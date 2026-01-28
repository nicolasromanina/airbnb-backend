import { Request, Response } from 'express';
import { Reservation } from '../models/Reservation';
import { Payment } from '../models/Payment';
import { Review } from '../models/Review';
import { BookingAnalytics, IBookingAnalytics } from '../models/BookingAnalytics';

export class AnalyticsController {
  // Get dashboard overview stats
  async getDashboardStats(req: Request, res: Response) {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const lastYear = currentYear - 1;

      // Current month stats
      const currentMonthStats = await this.getMonthlyStats(currentYear, currentMonth);

      // Last month stats for comparison
      const lastMonthDate =
        currentMonth === 1
          ? new Date(lastYear, 11, 1)
          : new Date(currentYear, currentMonth - 2, 1);
      const lastMonthStats = await this.getMonthlyStats(
        lastMonthDate.getFullYear(),
        lastMonthDate.getMonth() + 1
      );

      // Year to date stats
      const yearToDateStats = await Reservation.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1)
            },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
            averageBookingValue: { $avg: '$totalPrice' }
          }
        }
      ]);

      // All time stats
      const allTimeStats = await Reservation.aggregate([
        {
          $match: { status: { $ne: 'cancelled' } }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' }
          }
        }
      ]);

      // Calculate percentage changes
      const bookingChange =
        lastMonthStats.totalBookings > 0
          ? (
              ((currentMonthStats.totalBookings - lastMonthStats.totalBookings) /
                lastMonthStats.totalBookings) *
              100
            ).toFixed(1)
          : 0;

      const revenueChange =
        lastMonthStats.totalRevenue > 0
          ? (
              ((currentMonthStats.totalRevenue - lastMonthStats.totalRevenue) /
                lastMonthStats.totalRevenue) *
              100
            ).toFixed(1)
          : 0;

      res.json({
        currentMonth: {
          ...currentMonthStats,
          bookingChangePercent: parseFloat(bookingChange as string),
          revenueChangePercent: parseFloat(revenueChange as string)
        },
        yearToDate: yearToDateStats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          averageBookingValue: 0
        },
        allTime: allTimeStats[0] || {
          totalBookings: 0,
          totalRevenue: 0
        }
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }

  // Get monthly revenue chart data (last 12 months)
  async getMonthlyRevenueChart(req: Request, res: Response) {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const months = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);

        const stats = await this.getMonthlyStats(date.getFullYear(), date.getMonth() + 1);

        months.push({
          month: this.getMonthName(date.getMonth()),
          year: date.getFullYear(),
          revenue: stats.totalRevenue,
          bookings: stats.totalBookings,
          displayLabel: `${this.getMonthName(date.getMonth()).substr(0, 3)} ${date.getFullYear()}`
        });
      }

      res.json(months);
    } catch (error) {
      console.error('Error getting revenue chart:', error);
      res.status(500).json({ error: 'Failed to fetch revenue chart' });
    }
  }

  // Get apartment-wise booking stats
  async getApartmentStats(req: Request, res: Response) {
    try {
      const stats = await Reservation.aggregate([
        {
          $match: {
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: {
              apartmentId: '$apartmentId',
              title: '$title'
            },
            bookings: { $sum: 1 },
            revenue: { $sum: '$totalPrice' },
            averagePrice: { $avg: '$totalPrice' }
          }
        },
        {
          $sort: { revenue: -1 }
        }
      ]);

      res.json(stats);
    } catch (error) {
      console.error('Error getting apartment stats:', error);
      res.status(500).json({ error: 'Failed to fetch apartment stats' });
    }
  }

  // Get booking trends
  async getBookingTrends(req: Request, res: Response) {
    try {
      const { months = 12 } = req.query;
      const monthsBack = parseInt(months as string) || 12;
      const now = new Date();

      const trends = [];

      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const stats = await Reservation.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(year, month - 1, 1),
                $lt: new Date(month === 12 ? year + 1 : year, month % 12, 1)
              },
              status: { $ne: 'cancelled' }
            }
          },
          {
            $group: {
              _id: null,
              bookings: { $sum: 1 },
              revenue: { $sum: '$totalPrice' }
            }
          }
        ]);

        trends.push({
          month: this.getMonthName(month - 1),
          year,
          bookings: stats[0]?.bookings || 0,
          revenue: stats[0]?.revenue || 0,
          displayLabel: `${this.getMonthName(month - 1).substr(0, 3)} '${year.toString().substr(-2)}`
        });
      }

      res.json(trends);
    } catch (error) {
      console.error('Error getting booking trends:', error);
      res.status(500).json({ error: 'Failed to fetch booking trends' });
    }
  }

  // Get review analytics
  async getReviewAnalytics(req: Request, res: Response) {
    try {
      const stats = await Review.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const ratingDistribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      };

      stats.forEach((stat) => {
        ratingDistribution[stat._id as keyof typeof ratingDistribution] = stat.count;
      });

      const totalReviews = await Review.countDocuments({ status: 'approved' });
      const avgRating =
        totalReviews > 0
          ? (
              await Review.aggregate([
                { $match: { status: 'approved' } },
                { $group: { _id: null, avg: { $avg: '$rating' } } }
              ])
            )[0]?.avg || 0
          : 0;

      res.json({
        totalReviews,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingDistribution,
        pendingReviews: await Review.countDocuments({ status: 'pending' })
      });
    } catch (error) {
      console.error('Error getting review analytics:', error);
      res.status(500).json({ error: 'Failed to fetch review analytics' });
    }
  }

  // Private helper methods
  private async getMonthlyStats(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const stats = await Reservation.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate
          },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          averageBookingValue: { $avg: '$totalPrice' }
        }
      }
    ]);

    return stats[0] || {
      totalBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0
    };
  }

  private getMonthName(monthIndex: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return months[monthIndex];
  }
}
