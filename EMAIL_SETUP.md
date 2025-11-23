# Email Configuration Guide

This application uses **Resend** to send emails. Once configured, it can send to **any email address** without any hardcoding.

## Required Environment Variables

Set this in your Vercel project settings (Settings → Environment Variables):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

**Optional** (only if you've verified your own domain):
```
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

If `RESEND_FROM_EMAIL` is not set, the app will use `onboarding@resend.dev` automatically.

## Quick Start (No Domain Required!)

**You can start using Resend immediately without verifying any domain!**

1. **Sign up for Resend**: Go to https://resend.com and create a free account
2. **Get your API key**: 
   - Navigate to API Keys in your Resend dashboard
   - Create a new API key
   - Copy the API key (starts with `re_`)
3. **Set environment variable** (that's it!):
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```

The application will automatically use `onboarding@resend.dev` as the sender email. This works immediately without any domain verification and is perfect for development and testing.

**Free tier**: 3,000 emails/month, 100 emails/day

## Using Your Own Domain (Optional - For Production)

If you want to use your own domain (e.g., `noreply@yourdomain.com`) for production:

1. **Verify your domain**:
   - Go to Domains in your Resend dashboard
   - Add your domain (e.g., `yourdomain.com`) and follow the DNS verification steps
   - **Note**: Vercel's default domains (like `teachertab.vercel.app`) cannot be verified. You'll need your own custom domain.
2. **Set the from email**:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

**Important**: You must own and control the domain to verify it. Free Vercel deployment URLs cannot be used.

### Option 2: Gmail (Free - SMTP)

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use these settings:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

### Option 3: Outlook/Hotmail (Free - SMTP)

```
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
```

### Option 4: Custom Domain Email (SMTP)

If you have email with your domain (e.g., through your hosting provider):

```
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

### Option 5: Other Transactional Email Services (SMTP)

Services like **SendGrid**, **Mailgun**, or **Amazon SES** provide SMTP access:

**SendGrid:**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM_EMAIL=your-verified-email@yourdomain.com
```

**Mailgun:**
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM_EMAIL=your-verified-email@yourdomain.com
```

## How It Works

- **One-time configuration**: Set the Resend API key once
- **Works with any email**: Can send to Gmail, Outlook, Yahoo, or any other email address
- **No hardcoding**: All configuration is via environment variables
- **Modern API**: Resend provides a simple, reliable API for sending emails
- **Note**: The application currently uses Resend. For SMTP support, you would need to modify the code.

## Testing

After setting up, try the password reset feature. The email will be sent to any email address you provide.

