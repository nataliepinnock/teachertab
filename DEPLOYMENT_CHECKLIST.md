# Deployment Checklist - What Actually Needs Doing

Based on your current codebase, here's what you **actually** need to do:

## ✅ Already Configured (Based on Code)

- Sentry is configured (next.config.ts)
- Vercel Analytics is installed
- Termly consent management is set up
- Contact widget API endpoint exists
- All authentication flows are implemented
- Database schema and migrations are ready

## 🔴 REQUIRED - Must Do Before Going Live

### 1. Environment Variables in Vercel

**Critical (app will break without these):**
```env
POSTGRES_URL=postgresql://...              # Your Supabase production database
AUTH_SECRET=...                            # Generate: openssl rand -base64 32
STRIPE_SECRET_KEY=sk_live_...              # Stripe live mode secret key
STRIPE_WEBHOOK_SECRET=whsec_...            # From Stripe webhook setup
RESEND_API_KEY=re_...                      # Your Resend API key
```

**Important (needed for full functionality):**
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com # Your production URL
RESEND_FROM_EMAIL=noreply@yourdomain.com  # Email address for sending
RESEND_FROM_NAME=TeacherTab                # Sender name
```

**Optional (has defaults but recommended):**
```env
RESEND_AUDIENCE_ID=...                     # If using Resend Audiences
CONTACT_RECIPIENT_EMAIL=support@...        # Where contact form emails go
FEEDBACK_RECIPIENT_EMAIL=support@...      # Where feedback emails go
RESEND_DELETED_USERS_SEGMENT_ID=...       # Default exists, but set explicitly
```

**OAuth (if you want Google/Microsoft sign-in):**
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
```

### 2. Update OAuth Redirect URIs (If Using OAuth)

**Google Cloud Console:**
- Add: `https://yourdomain.com/api/auth/google/callback`
- Add: `https://your-app.vercel.app/api/auth/google/callback` (temporary)

**Microsoft Azure Portal:**
- Add: `https://yourdomain.com/api/auth/microsoft/callback`
- Add: `https://your-app.vercel.app/api/auth/microsoft/callback` (temporary)

### 3. Set Up Stripe Production Webhook

1. Go to Stripe Dashboard → Webhooks (Live mode)
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret → Add to Vercel env vars

### 4. Run Database Migrations on Production

```bash
# Set production database URL temporarily
export POSTGRES_URL="your-production-postgres-url"

# Run migrations
pnpm db:migrate
```

Or use Supabase SQL editor to run migrations manually.

### 5. Deploy to Vercel

1. Push code to GitHub (✅ already done)
2. Go to vercel.com → Import project
3. Connect GitHub repo
4. Add all environment variables from step 1
5. Deploy

## 🟡 RECOMMENDED - Do After Initial Deployment

### 6. Set Up Custom Domain (If You Have One)

1. In Vercel → Project Settings → Domains
2. Add your domain
3. Update DNS records
4. Update `NEXT_PUBLIC_APP_URL` env var
5. Update OAuth redirect URIs with new domain
6. Redeploy

### 7. Set Up Scheduled Cleanup (Optional - Can Do Later)

The cleanup script exists but needs to be run manually or via external cron service.

**Option A: Manual (simplest)**
- Run `FORCE_CLEANUP=true pnpm db:cleanup-deleted` periodically

**Option B: Vercel Cron (requires code changes)**
- Export cleanup function from `lib/db/cleanup-deleted-accounts.ts`
- Create API route handler
- Set up Vercel cron job

**Option C: External Cron Service**
- Use cron-job.org or similar
- Call a cleanup API endpoint you create

### 8. Verify Everything Works

- [ ] User can sign up
- [ ] User can sign in (email/password and OAuth if configured)
- [ ] Stripe checkout works
- [ ] Webhook receives events
- [ ] Emails are sent (welcome, password reset, etc.)
- [ ] Contact form works
- [ ] Account deletion works
- [ ] Data export works

## 📝 Summary

**Minimum to go live:**
1. Set 5-7 critical environment variables in Vercel
2. Set up Stripe production webhook
3. Run database migrations
4. Deploy to Vercel
5. Update OAuth redirect URIs (if using OAuth)

**That's it!** Everything else has defaults or is optional.

