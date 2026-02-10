# Deployment Guide for TeacherTab

This guide will walk you through deploying your TeacherTab application to production.

## Recommended Platform: Vercel

Vercel is the recommended platform for Next.js applications as it provides:
- Automatic deployments from GitHub
- Built-in CI/CD
- Edge network for fast global performance
- Easy environment variable management
- Serverless functions support

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Production database (Supabase) set up
- [ ] Stripe production account and API keys
- [ ] Resend account and API key
- [ ] Google OAuth credentials configured
- [ ] Microsoft OAuth credentials configured
- [ ] Domain name (optional, Vercel provides a free subdomain)
- [ ] Sentry account (already configured)

## Step 1: Prepare Your Database

### 1.1 Set up Production Database

1. Go to [Supabase](https://supabase.com) and create a new project (or use existing)
2. Copy your database connection string (found in Settings > Database)
3. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 1.2 Run Migrations

Run your database migrations on the production database:

```bash
# Set your production database URL temporarily
export POSTGRES_URL="your-production-database-url"

# Run migrations
pnpm db:migrate
```

Or use Supabase's SQL editor to run migrations manually.

## Step 2: Configure Stripe

### 2.1 Get Production API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to "Live mode" (toggle in top right)
3. Go to Developers > API keys
4. Copy your **Publishable key** and **Secret key**

### 2.2 Set up Production Webhook

1. In Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. Set endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
   - (Use your Vercel URL initially: `https://your-app.vercel.app/api/stripe/webhook`)
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 3: Configure OAuth Providers

### 3.1 Update Google OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to APIs & Services > Credentials
4. Edit your OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/google/callback`
   - `https://your-app.vercel.app/api/auth/google/callback` (if using Vercel domain)

### 3.2 Update Microsoft OAuth Redirect URIs

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Select your app
4. Go to Authentication
5. Add redirect URIs:
   - `https://yourdomain.com/api/auth/microsoft/callback`
   - `https://your-app.vercel.app/api/auth/microsoft/callback` (if using Vercel domain)

## Step 4: Configure Resend

1. Go to [Resend](https://resend.com)
2. Get your API key from API Keys section
3. Set up your sending domain (recommended for production)
4. Note your Audience ID if you're using Resend Audiences

## Step 5: Deploy to Vercel

### 5.1 Connect Repository

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 5.2 Configure Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (or leave default)
- **Output Directory**: `.next` (default)
- **Install Command**: `pnpm install` (or leave default)
- **Root Directory**: `./` (default)

### 5.3 Add Environment Variables

In Vercel project settings, add these environment variables:

#### Required Environment Variables

```env
# Database
POSTGRES_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Authentication
AUTH_SECRET=your-random-secret-here
# Generate with: openssl rand -base64 32

# Application URL
BASE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=TeacherTab
RESEND_AUDIENCE_ID=your-audience-id (if using)
FEEDBACK_RECIPIENT_EMAIL=support@yourdomain.com
CONTACT_RECIPIENT_EMAIL=support@yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Termly (if using)
NEXT_PUBLIC_TERMLY_MASTER_CONSENTS_ORIGIN=https://yourdomain.com

# Sentry (already configured)
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=teachertab
SENTRY_PROJECT=teachertab
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### 5.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-app.vercel.app`

## Step 6: Configure Custom Domain (Optional)

1. In Vercel project settings, go to Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update environment variables with your custom domain:
   - `BASE_URL`
   - `NEXT_PUBLIC_APP_URL`
5. Update OAuth redirect URIs with your custom domain
6. Redeploy if needed

## Step 7: Post-Deployment Tasks

### 7.1 Verify Database Connection

1. Check Vercel logs for any database connection errors
2. Test user registration/login

### 7.2 Test Stripe Integration

1. Use Stripe test mode initially to verify webhook works
2. Test a real payment with a small amount
3. Verify webhook events are received correctly

### 7.3 Test OAuth Flows

1. Test Google sign-in
2. Test Microsoft sign-in
3. Verify redirect URIs work correctly

### 7.4 Set up Scheduled Tasks

Set up a cron job or scheduled function to run the cleanup script:

```bash
# Run cleanup for deleted accounts (every day)
# You can use Vercel Cron Jobs or external service like cron-job.org
```

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-deleted",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Then create `app/api/cron/cleanup-deleted/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cleanupDeletedAccounts } from '@/lib/db/cleanup-deleted-accounts';

export async function GET(request: NextRequest) {
  // Verify cron secret (add to env: CRON_SECRET)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await cleanupDeletedAccounts();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### 7.5 Monitor Application

1. Set up Sentry alerts for errors
2. Monitor Vercel analytics
3. Check Stripe dashboard for payment issues
4. Monitor Resend for email delivery issues

## Step 8: Security Checklist

- [ ] All environment variables are set correctly
- [ ] `AUTH_SECRET` is a strong random string
- [ ] Database credentials are secure
- [ ] Stripe webhook secret is configured
- [ ] OAuth redirect URIs only include your domain
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Sentry is configured for error tracking

## Troubleshooting

### Build Fails

- Check Vercel build logs
- Ensure all environment variables are set
- Verify `package.json` scripts are correct
- Check for TypeScript errors: `pnpm build` locally

### Database Connection Issues

- Verify `POSTGRES_URL` is correct
- Check Supabase firewall settings
- Ensure database allows connections from Vercel IPs

### Stripe Webhook Not Working

- Verify webhook URL is correct
- Check webhook secret matches
- View webhook logs in Stripe dashboard
- Test webhook endpoint manually

### OAuth Not Working

- Verify redirect URIs match exactly
- Check environment variables are set
- Review OAuth provider logs
- Test redirect URI format

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## Support

If you encounter issues during deployment:
1. Check Vercel deployment logs
2. Review Sentry for errors
3. Check application logs in Vercel dashboard
4. Verify all environment variables are set correctly

