# Phase 1 Implementation: Monitoring & Error Tracking

## ✅ What's Implemented

### 1. Sentry Integration
**Error Tracking & Performance Monitoring**

```bash
# Install
npm install @sentry/node @sentry/tracing

# Configuration in .env
SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

**Features:**
- ✅ Automatic error capture
- ✅ Performance monitoring (request tracing)
- ✅ Environment tracking
- ✅ Breadcrumb logging
- ✅ Source maps support
- ✅ Sensitive data filtering (auth headers, cookies)
- ✅ Health check exclusion (no noise)

**How it works:**
1. All unhandled exceptions are captured
2. Performance metrics tracked (latency, errors, transactions)
3. Errors sent to Sentry dashboard in real-time
4. Setup Alerts → Slack integration for critical errors

---

### 2. Slack Integration (Optional but Recommended)
**Real-time Notifications**

```typescript
// Usage Example
import { alertService } from './utils/alertService';

// Alert on critical errors
await alertService.alertOnError(error, { route: '/api/payments' });

// Alert on database issues
await alertService.alertOnDatabaseError(mongoError);

// Alert on slow endpoints
await alertService.alertOnHighResponseTime('/api/reservations', 5200);

// Alert on error spikes
await alertService.alertOnHighErrorRate(0.08); // 8% error rate
```

**Setup Slack Webhook:**
1. Go to https://api.slack.com/apps
2. Create new app → "From scratch"
3. Name: "AirBnB Alerts"
4. Enable "Incoming Webhooks"
5. Add New Webhook to Workspace → Select channel #alerts
6. Copy webhook URL to `.env`: `SLACK_WEBHOOK_URL=...`

---

## 📋 Next Steps: UptimeRobot Setup

### Setup (5 minutes)

**Free tier includes:**
- ✅ 50 monitors
- ✅ 5-minute checks
- ✅ Email alerts
- ✅ Status page
- ✅ 99.99% uptime SLA

### Configuration Steps:

1. **Go to https://uptimerobot.com**
2. **Sign up with email**
3. **Create Monitors:**

**Monitor 1: Backend Health**
```
Name: Backend Health Check
URL: https://airbnb-backend-l640.onrender.com/health
Type: HTTPS
Check Interval: 5 minutes
Alert Contacts: Your Email + SMS
```

**Monitor 2: API Health**
```
Name: API Health Check
URL: https://airbnb-backend-l640.onrender.com/api/health
Type: HTTPS
Check Interval: 5 minutes
```

**Monitor 3: Frontend**
```
Name: Frontend (Vercel)
URL: https://air-frontend-neon.vercel.app
Type: HTTPS
Check Interval: 5 minutes
```

**Monitor 4: Critical API Endpoint**
```
Name: Payment Service
URL: https://airbnb-backend-l640.onrender.com/api/payments
Type: HTTPS
Method: GET (or POST with dummy data)
Check Interval: 5 minutes
Alert Contacts: SMS + Email
```

4. **Add Alert Contacts:**
   - Email alerts (immediate)
   - SMS alerts (for critical outages)
   - Slack webhooks (if premium)

5. **Enable Status Page:**
   - Settings → Status Page
   - Make it public for transparency
   - Customize with your branding
   - Share with clients: `https://uptimerobot.com/status/[page-id]`

---

## 🔍 Monitoring Checklist

- [ ] Sentry project created & DSN added to `.env`
- [ ] Sentry alerts configured in dashboard
- [ ] Slack webhook added (optional)
- [ ] Backend deployed with Sentry
- [ ] UptimeRobot account created
- [ ] 4 monitors configured
- [ ] Alert contacts added
- [ ] Status page enabled
- [ ] Test: Trigger a test error in Sentry
- [ ] Test: Stop backend, check UptimeRobot alert

---

## 🚨 Error Tracking Best Practices

**What gets automatically tracked:**
- Unhandled exceptions
- HTTP errors (4xx, 5xx)
- Slow requests (>1s)
- Database connection errors
- Authentication failures
- Payment processing errors

**What to manually track:**
```typescript
// Critical business logic
try {
  await processPayment(order);
} catch (error) {
  Sentry.captureException(error, {
    contexts: {
      order: { id: order.id, amount: order.total }
    },
    level: 'fatal'
  });
}

// Performance tracking
const transaction = Sentry.startTransaction({
  op: "http.server",
  name: "POST /api/reservations"
});
// ... operation ...
transaction.finish();
```

---

## 📊 Metrics to Monitor

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Response Time | <100ms | <500ms | >1s |
| Error Rate | <0.1% | 0.1-1% | >1% |
| Uptime | >99.9% | >99% | <99% |
| Request Volume | Stable | ±20% | ±50% |
| DB Connection Pool | <80% | 80-95% | >95% |

---

## 🎯 Phase 2 (Next Week): Redis Caching

When ready:
```bash
npm install redis ioredis
```

Will implement:
- Cache footer data (30 min TTL)
- Cache API responses
- Session store
- Rate limit counter
