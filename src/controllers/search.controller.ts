import { Request, Response } from 'express';
import RoomDetail from '../models/RoomDetail';
import { Review } from '../models/Review';
import { Availability } from '../models/Availability';

export class SearchController {
  // Search apartments with filters
  async searchApartments(req: Request, res: Response) {
    try {
      const {
        destination,
        city,
        country,
        location,
        minPrice,
        maxPrice,
        minCapacity,
        amenities,
        checkIn,
        availableFrom,
        travelers,
        sortBy = 'popularity',
        page = 1,
        limit = 12
      } = req.query;

      // Build filter query
      const filter: any = {};

      // Destination or City/Country filter - support both names and exact city/country
      const destinationFilters: any[] = [];
      
      if (destination && typeof destination === 'string' && destination.trim()) {
        const destRegex = new RegExp(destination.trim(), 'i');
        destinationFilters.push(
          { city: destRegex },
          { country: destRegex },
          { location: destRegex },
          { title: destRegex },
          { description: destRegex }
        );
      }
      
      if (city && typeof city === 'string' && city.trim()) {
        const cityRegex = new RegExp(city.trim(), 'i');
        destinationFilters.push(
          { city: cityRegex }
        );
      }
      
      if (country && typeof country === 'string' && country.trim()) {
        const countryRegex = new RegExp(country.trim(), 'i');
        destinationFilters.push(
          { country: countryRegex }
        );
      }
      
      if (location && typeof location === 'string' && location.trim()) {
        const locRegex = new RegExp(location.trim(), 'i');
        destinationFilters.push(
          { location: locRegex }
        );
      }

      if (destinationFilters.length > 0) {
        filter.$or = destinationFilters;
      }

      // Price filter
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice as string);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice as string);
      }

      // Capacity/Travelers filter
      if (minCapacity || travelers) {
        const requiredCapacity = minCapacity ? parseInt(minCapacity as string) : (travelers ? parseInt(travelers as string) : null);
        if (requiredCapacity) {
          filter.$expr = {
            $gte: [
              {
                $toInt: {
                  $arrayElemAt: [
                    {
                      $regexFindAll: {
                        input: '$guests',
                        regex: '[0-9]+'
                      }
                    },
                    0
                  ]
                }
              },
              requiredCapacity
            ]
          };
        }
      }

      // Amenities filter
      if (amenities && typeof amenities === 'string') {
        const amenitiesArray = amenities.split(',').map(a => a.trim());
        filter.amenities = { $in: amenitiesArray };
      }

      // Check-in date availability filter
      if (checkIn && typeof checkIn === 'string') {
        const checkInDate = new Date(checkIn);
        filter.$or = filter.$or ? [...filter.$or, {
          availableFrom: { $lte: checkInDate }
        }, {
          availableFrom: { $exists: false }
        }] : [{
          availableFrom: { $lte: checkInDate }
        }, {
          availableFrom: { $exists: false }
        }];
      }

      // Available from filter
      if (availableFrom && typeof availableFrom === 'string') {
        const availableFromDate = new Date(availableFrom);
        filter.$or = filter.$or ? [...filter.$or, {
          availableFrom: { $lte: availableFromDate }
        }, {
          availableFrom: { $exists: false }
        }] : [{
          availableFrom: { $lte: availableFromDate }
        }, {
          availableFrom: { $exists: false }
        }];
      }

      // Availability status filter
      filter.availability = { $ne: false };

      // Setup sort
      let sortOption: any = { 'meta.popularity': -1 };
      if (sortBy === 'price-low') {
        sortOption = { price: 1 };
      } else if (sortBy === 'price-high') {
        sortOption = { price: -1 };
      } else if (sortBy === 'rating') {
        sortOption = { 'meta.averageRating': -1 };
      } else if (sortBy === 'newest') {
        sortOption = { 'meta.createdAt': -1 };
      }

      // Pagination
      const pageNum = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 12;
      const skip = (pageNum - 1) * pageSize;

      // Execute query
      const apartments = await RoomDetail.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(pageSize)
        .lean();

      const total = await RoomDetail.countDocuments(filter);

      // Enrich with review data
      const enrichedApartments = await Promise.all(
        apartments.map(async (apt: any) => {
          const reviews = await Review.find({
            'apartment.id': apt.roomId,
            status: 'approved'
          }).lean();

          const avgRating =
            reviews.length > 0
              ? Math.round(
                  (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
                ) / 10
              : 0;

          return {
            ...apt,
            averageRating: avgRating,
            reviewCount: reviews.length
          };
        })
      );

      res.json({
        apartments: enrichedApartments,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      console.error('Error searching apartments:', error);
      res.status(500).json({ error: 'Failed to search apartments' });
    }
  }

  // Get availability calendar for apartment
  async getAvailabilityCalendar(req: Request, res: Response) {
    try {
      const { apartmentId, month, year } = req.query;

      if (!apartmentId || !month || !year) {
        return res.status(400).json({
          error: 'apartmentId, month, and year parameters are required'
        });
      }

      const monthNum = parseInt(month as string);
      const yearNum = parseInt(year as string);

      // Get dates for entire month
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0);

      // Get all reservations for this month
      const { Reservation } = await import('../models/Reservation');
      const reservations = await Reservation.find({
        apartmentId: parseInt(apartmentId as string),
        $or: [
          {
            checkIn: { $lt: endDate },
            checkOut: { $gt: startDate }
          }
        ]
      }).lean();

      // Get blocked dates
      const blockedDates = await Availability.find({
        apartmentId: parseInt(apartmentId as string),
        isAvailable: false,
        dateFrom: { $lt: endDate },
        dateTo: { $gt: startDate }
      }).lean();

      // Generate calendar days
      const daysInMonth = endDate.getDate();
      const calendar: any[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(yearNum, monthNum - 1, day);

        // Check if date is booked
        const isBooked = reservations.some(
          (res) =>
            new Date(res.checkIn).getTime() <= currentDate.getTime() &&
            new Date(res.checkOut).getTime() > currentDate.getTime()
        );

        // Check if date is blocked
        const isBlocked = blockedDates.some(
          (block) =>
            new Date(block.dateFrom).getTime() <= currentDate.getTime() &&
            new Date(block.dateTo).getTime() > currentDate.getTime()
        );

        calendar.push({
          date: currentDate,
          day,
          isAvailable: !isBooked && !isBlocked,
          isBooked,
          isBlocked
        });
      }

      res.json({
        month: monthNum,
        year: yearNum,
        apartmentId: parseInt(apartmentId as string),
        calendar
      });
    } catch (error) {
      console.error('Error getting availability calendar:', error);
      res.status(500).json({ error: 'Failed to get availability calendar' });
    }
  }

  // Check date availability for checkout
  async checkDateAvailability(req: Request, res: Response) {
    try {
      const { apartmentId, checkIn, checkOut } = req.body;

      if (!apartmentId || !checkIn || !checkOut) {
        return res.status(400).json({
          error: 'apartmentId, checkIn, and checkOut are required'
        });
      }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      // Check for conflicting reservations
      const { Reservation } = await import('../models/Reservation');
      const conflictingReservations = await Reservation.countDocuments({
        apartmentId: parseInt(apartmentId as string),
        status: { $ne: 'cancelled' },
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
      });

      // Check for blocked dates
      const blockedDates = await Availability.countDocuments({
        apartmentId: parseInt(apartmentId as string),
        isAvailable: false,
        dateFrom: { $lt: checkOutDate },
        dateTo: { $gt: checkInDate }
      });

      const isAvailable = conflictingReservations === 0 && blockedDates === 0;

      res.json({
        apartmentId: parseInt(apartmentId as string),
        checkInDate,
        checkOutDate,
        isAvailable,
        conflictingReservations,
        blockedDates
      });
    } catch (error) {
      console.error('Error checking date availability:', error);
      res.status(500).json({ error: 'Failed to check date availability' });
    }
  }

  // Get suggested filters (for search filters UI)
  async getSuggestedFilters(req: Request, res: Response) {
    try {
      const apartments = await RoomDetail.find({}).lean();

      // Extract unique locations
      const locations = [
        ...new Set(
          apartments
            .filter((apt) => apt.city || apt.location)
            .map((apt) => apt.city || apt.location)
        )
      ] as string[];

      // Extract unique countries
      const countries = [
        ...new Set(
          apartments
            .filter((apt) => apt.country)
            .map((apt) => apt.country)
        )
      ] as string[];

      // Extract unique cities
      const cities = [
        ...new Set(
          apartments
            .filter((apt) => apt.city)
            .map((apt) => apt.city)
        )
      ] as string[];

      // Get price range
      const priceStats = await RoomDetail.aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' }
          }
        }
      ]);

      // Extract unique amenities
      const amenitiesSet = new Set<string>();
      apartments.forEach((apt: any) => {
        if (apt.amenities && Array.isArray(apt.amenities)) {
          apt.amenities.forEach((amenity: any) => amenitiesSet.add(amenity));
        }
      });

      // Get capacity range
      const capacityStats = await RoomDetail.aggregate([
        {
          $addFields: {
            capacityNum: {
              $toInt: {
                $arrayElemAt: [
                  {
                    $split: ['$guests', ' ']
                  },
                  0
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            minCapacity: { $min: '$capacityNum' },
            maxCapacity: { $max: '$capacityNum' }
          }
        }
      ]);

      res.json({
        locations: locations.sort(),
        cities: cities.sort(),
        countries: countries.sort(),
        priceRange: priceStats[0] || { minPrice: 0, maxPrice: 0 },
        amenities: Array.from(amenitiesSet).sort(),
        capacityRange: capacityStats[0] || { minCapacity: 1, maxCapacity: 10 }
      });
    } catch (error) {
      console.error('Error getting suggested filters:', error);
      res.status(500).json({ error: 'Failed to get suggested filters' });
    }
  }
}
