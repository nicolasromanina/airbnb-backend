// Email template for payment confirmation
export const paymentConfirmationTemplate = (data: {
  customerName: string;
  customerEmail: string;
  reservationId: string;
  bookingDates: string; // e.g. "15 Jan - 20 Jan 2025"
  nights: number;
  totalAmount: number;
  currency: string;
  apartmentTitle: string;
  apartmentImage?: string;
  paymentDate: string;
  transactionId: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html dir="ltr" lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
        <title>Payment Confirmation - Your Booking</title>
        <style type="text/css">
          @media only screen and (max-width: 600px) {
            .container { width: 100% !important; max-width: 100% !important; }
            .content { padding: 20px !important; }
            .header-image { width: 100% !important; height: auto !important; }
          }
          body { margin: 0; padding: 0; min-width: 100% !important; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
          .booking-details { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .detail-label { color: #666; font-weight: 500; }
          .detail-value { color: #333; font-weight: 600; }
          .price-section { background: #f0f4ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; }
          .price-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .price-total { display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 18px; font-weight: bold; color: #667eea; }
          .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .apartment-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .apartment-image { width: 100%; height: auto; border-radius: 6px; margin-bottom: 15px; }
          .apartment-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px; }
          .apartment-subtitle { font-size: 13px; color: #666; }
          .confirmation-badge { display: inline-block; background: #4caf50; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
          .footer a { color: #667eea; text-decoration: none; }
          .support-section { background: #f0f4ff; padding: 15px; border-radius: 6px; margin-top: 20px; font-size: 13px; }
          .support-section strong { color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>✓ Payment Confirmed</h1>
            <p>Your booking is confirmed and secure</p>
          </div>

          <!-- Main Content -->
          <div class="content">
            <!-- Greeting -->
            <p style="font-size: 16px; color: #333; margin-top: 0;">
              Hello <strong>${data.customerName}</strong>,
            </p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              Thank you for your payment! Your booking is confirmed. Here's your payment summary and reservation details.
            </p>

            <!-- Confirmation Badge -->
            <div style="text-align: center;">
              <div class="confirmation-badge">✓ PAYMENT RECEIVED</div>
            </div>

            <!-- Apartment Section -->
            ${data.apartmentImage ? `
              <div class="apartment-info">
                <img src="${data.apartmentImage}" alt="${data.apartmentTitle}" class="apartment-image" style="max-height: 250px; object-fit: cover;">
                <div class="apartment-title">${data.apartmentTitle}</div>
                <div class="apartment-subtitle">${data.nights} night${data.nights > 1 ? 's' : ''} • ${data.bookingDates}</div>
              </div>
            ` : ''}

            <!-- Booking Details Section -->
            <div class="section">
              <div class="section-title">📅 Booking Details</div>
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Reservation ID</span>
                  <span class="detail-value">${data.reservationId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Check-in / Check-out</span>
                  <span class="detail-value">${data.bookingDates}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Number of Nights</span>
                  <span class="detail-value">${data.nights} night${data.nights > 1 ? 's' : ''}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Date</span>
                  <span class="detail-value">${data.paymentDate}</span>
                </div>
              </div>
            </div>

            <!-- Price Breakdown -->
            <div class="section">
              <div class="section-title">💰 Payment Summary</div>
              <div class="price-section">
                <div class="price-row">
                  <span>Accommodation (${data.nights} nights)</span>
                  <span>${data.currency.toUpperCase()} ${(data.totalAmount * 0.8).toFixed(2)}</span>
                </div>
                <div class="price-row" style="color: #999; font-size: 12px;">
                  <span>Taxes & Fees</span>
                  <span>${data.currency.toUpperCase()} ${(data.totalAmount * 0.2).toFixed(2)}</span>
                </div>
                <div class="price-total">
                  <span>Total Paid</span>
                  <span>${data.currency.toUpperCase()} ${data.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- Transaction Info -->
            <div class="section">
              <div class="section-title">💳 Transaction Details</div>
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Transaction ID</span>
                  <span class="detail-value" style="font-size: 12px; word-break: break-all;">${data.transactionId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value" style="color: #4caf50;">✓ Completed</span>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div class="section">
              <div class="section-title">📋 What's Next</div>
              <p style="font-size: 14px; color: #333; line-height: 1.8; margin: 0;">
                1. <strong>Check your email</strong> - You'll receive further instructions soon<br>
                2. <strong>Add to calendar</strong> - Mark your check-in date<br>
                3. <strong>Review house rules</strong> - Available on your booking page<br>
                4. <strong>Prepare for arrival</strong> - Contact us if you need anything
              </p>
            </div>

            <!-- Support Section -->
            <div class="support-section">
              <strong>Need Help?</strong><br>
              If you have any questions about your booking or payment, please don't hesitate to contact our support team. We're here to help!
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://air-frontend-neon.vercel.app'}/bookings" class="button">
                View Your Booking
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              <strong>Airbnb Clone</strong><br>
              Your trusted booking platform
            </p>
            <p style="margin: 0; color: #999; font-size: 11px;">
              © 2025 Airbnb Clone. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export default paymentConfirmationTemplate;
