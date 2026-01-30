import { Request, Response } from 'express';
import { Reservation } from '../../models/Reservation';
import { User } from '../../models/User';
import { Payment } from '../../models/Payment';
import { sendEmail } from '../../utils/email';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import stream from 'stream';

const toDate = (v?: any) => v ? new Date(v) : undefined;

// Helper to transform reservation data and add paymentStatus
const transformReservationData = (item: any) => {
  return {
    ...item,
    paymentStatus: item.payment?.status || 'pending'
  };
};

export const listReservations = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(1, parseInt((req.query.limit as string) || '20'));
    const { status, user, apartmentId, dateFrom, dateTo, q } = req.query as any;

    const filter: any = {};
    if (status) filter.status = status;
    if (user) filter.user = user;
    if (apartmentId) filter.apartmentId = Number(apartmentId);
    if (dateFrom || dateTo) filter.checkIn = {};
    if (dateFrom) filter.checkIn.$gte = toDate(dateFrom);
    if (dateTo) filter.checkIn.$lte = toDate(dateTo);

    // Support search 'q' on user name/email, title or apartmentNumber
    if (q && String(q).trim()) {
      const qStr = String(q).trim();
      const re = { $regex: qStr, $options: 'i' };

      // Find matching users first (search firstName, lastName, email)
      const matchedUsers = await User.find({
        $or: [
          { email: re },
          { firstName: re },
          { lastName: re }
        ]
      }).select('_id').lean();

      const userIds = matchedUsers.map(u => u._id);

      filter.$or = [
        ...(userIds.length ? [{ user: { $in: userIds } }] : []),
        { title: re },
        { apartmentNumber: re }
      ];
    }

    const total = await Reservation.countDocuments(filter);
    const items = await Reservation.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('payment')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform items to add paymentStatus
    const transformedItems = items.map(transformReservationData);

    res.json({ data: transformedItems, meta: { total, page, limit } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list reservations', details: (error as any).message });
  }
};

export const getReservation = async (req: Request, res: Response) => {
  try {
    const r = await Reservation.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('payment')
      .lean();
    if (!r) return res.status(404).json({ error: 'Reservation not found' });
    
    // Transform to add paymentStatus
    const transformedData = transformReservationData(r);
    res.json({ data: transformedData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get reservation', details: (error as any).message });
  }
};

export const confirmReservation = async (req: Request, res: Response) => {
  try {
    const r = await Reservation.findByIdAndUpdate(req.params.id, { status: 'confirmed' }, { new: true })
      .populate('user', 'email firstName lastName')
      .populate('payment')
      .lean();
    if (!r) return res.status(404).json({ error: 'Reservation not found' });

    // Notify user via email (if configured)
    try {
      if (r.user && (r as any).user.email) {
        await sendEmail((r as any).user.email, `Votre réservation ${r.title} est confirmée`, `Bonjour ${(r as any).user.firstName || ''},\n\nVotre réservation a été confirmée. Merci.`);
      }
    } catch (e) {
      // ignore email errors
    }

    const transformedData = transformReservationData(r);
    res.json({ data: transformedData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm reservation', details: (error as any).message });
  }
};

export const cancelReservation = async (req: Request, res: Response) => {
  try {
    const r = await Reservation.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true })
      .populate('user', 'email firstName lastName')
      .populate('payment')
      .lean();
    if (!r) return res.status(404).json({ error: 'Reservation not found' });

    // Optionally update payment
    if (r.payment) {
      await Payment.findByIdAndUpdate(r.payment, { status: 'canceled' });
    }

    // Notify user via email (if configured)
    try {
      if (r.user && (r as any).user.email) {
        await sendEmail((r as any).user.email, `Votre réservation ${r.title} a été annulée`, `Bonjour ${(r as any).user.firstName || ''},\n\nVotre réservation a été annulée. Contactez-nous pour plus d'informations.`);
      }
    } catch (e) {
      // ignore email errors
    }

    const transformedData = transformReservationData(r);
    res.json({ data: transformedData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel reservation', details: (error as any).message });
  }
};

export const exportReservationsCSV = async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'csv';
    const { status, id, q } = req.query as any;
    const filter: any = {};
    if (status) filter.status = status;
    if (id) filter._id = id;

    // Support export search q
    if (q && String(q).trim()) {
      const qStr = String(q).trim();
      const re = { $regex: qStr, $options: 'i' };
      const matchedUsers = await User.find({
        $or: [ { email: re }, { firstName: re }, { lastName: re } ]
      }).select('_id').lean();
      const userIds = matchedUsers.map(u => u._id);
      filter.$or = [ ...(userIds.length ? [{ user: { $in: userIds } }] : []), { title: re }, { apartmentNumber: re } ];
    }

    const items = await Reservation.find(filter).populate('user', 'firstName lastName email').lean();

    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Reservations');
      ws.addRow(['id','userEmail','userName','apartmentId','apartmentNumber','checkIn','checkOut','nights','guests','totalPrice','status','createdAt']);
      items.forEach(it => {
        ws.addRow([
          it._id?.toString(),
          (it as any).user?.email || '',
          `${(it as any).user?.firstName || ''} ${(it as any).user?.lastName || ''}`.trim(),
          it.apartmentId,
          it.apartmentNumber,
          it.checkIn?.toISOString(),
          it.checkOut?.toISOString(),
          it.nights,
          it.guests,
          it.totalPrice,
          it.status,
          it.createdAt?.toISOString()
        ]);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="reservations_${Date.now()}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
      return;
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reservations_${Date.now()}.pdf"`);

      doc.pipe(res);
      doc.fontSize(14).text('Reservations Export', { align: 'center' });
      doc.moveDown();

      items.forEach((it: any, idx: number) => {
        doc.fontSize(10).text(`${idx + 1}. ${it.title} - ${it.apartmentNumber}`);
        doc.text(`Client: ${(it.user?.firstName||'')} ${(it.user?.lastName||'')} <${it.user?.email||''}>`);
        doc.text(`Dates: ${it.checkIn?.toISOString()} -> ${it.checkOut?.toISOString()}`);
        doc.text(`Nuits: ${it.nights} | Guests: ${it.guests} | Prix: ${it.totalPrice} | Statut: ${it.status}`);
        doc.moveDown();
      });

      doc.end();
      return;
    }

    // default CSV
    const headers = ['id','userEmail','userName','apartmentId','apartmentNumber','checkIn','checkOut','nights','guests','totalPrice','status','createdAt'];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="reservations_${Date.now()}.csv"`);

    res.write(headers.join(',') + '\n');
    for (const it of items) {
      const r = [
        it._id?.toString(),
        (it as any).user?.email || '',
        `${(it as any).user?.firstName || ''} ${(it as any).user?.lastName || ''}`.trim(),
        it.apartmentId,
        it.apartmentNumber,
        it.checkIn?.toISOString(),
        it.checkOut?.toISOString(),
        it.nights,
        it.guests,
        it.totalPrice,
        it.status,
        it.createdAt?.toISOString()
      ];
      const line = r.map(c => typeof c === 'string' ? `"${(c as string).replace(/"/g,'""')}"` : c).join(',');
      res.write(line + '\n');
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to export reservations', details: (error as any).message });
  }
};

export const getBookingCommunications = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find the booking
    const booking = await Reservation.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Return communication history (empty for now, can be extended)
    // In a full implementation, you'd query from a Communications collection
    const communications = [
      {
        _id: 'comm_1',
        type: 'email',
        subject: 'Booking confirmation',
        content: 'Your booking has been confirmed',
        status: 'sent',
        sentAt: booking.createdAt,
        sentBy: {
          name: 'System',
          email: 'noreply@airbnb.com'
        },
        metadata: {
          emailId: 'email_123'
        }
      }
    ];

    res.json({ success: true, data: communications });
  } catch (error) {
    console.error('Error fetching booking communications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch communications' });
  }
};

export default { listReservations, getReservation, confirmReservation, cancelReservation, exportReservationsCSV, getBookingCommunications };
