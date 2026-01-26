Admin Backend - Gmail SMTP & Exports

Setup Gmail SMTP (recommended using App Password):

1. Enable 2-Step Verification on the Gmail account.
2. Create an App Password (in Google Account > Security > App passwords) for "Mail" and copy it.
3. In your environment (e.g., `.env`), set the following:

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Your App Name <your-email@gmail.com>"

Notes:
- Use the App Password (not your regular Gmail password).
- For high-volume sending consider using a transactional email provider (SendGrid, Mailgun, SES).

Exports:
- CSV: GET `/api/admin/bookings/export?format=csv`
- XLSX: GET `/api/admin/bookings/export?format=xlsx`
- PDF: GET `/api/admin/bookings/export?format=pdf`
- Single reservation export: add `id` query param: `?id=<reservationId>`

Example:
GET /api/admin/bookings/export?format=xlsx&id=63ab... 

