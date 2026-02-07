# OAuth Setup Guide for TeacherTab

This guide will help you set up Google and Microsoft OAuth authentication for TeacherTab.

## Prerequisites

- A Google Cloud Platform account
- A Microsoft Azure account (for Microsoft OAuth)
- Your TeacherTab application deployed or running locally

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "TeacherTab")
5. Click "Create"

### Step 2: Enable Google+ API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in the required information:
     - App name: TeacherTab
     - User support email: your email
     - Developer contact: your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
   - Save and continue through the steps

4. Back in Credentials, create OAuth client ID:
   - Application type: "Web application"
   - Name: "TeacherTab Web Client"
   - Authorized redirect URIs:
     - For production: `https://yourdomain.com/api/auth/google/callback`
     - For local development: `http://localhost:3000/api/auth/google/callback`
   - Click "Create"

5. Copy the **Client ID** and **Client Secret**

### Step 4: Add to Environment Variables

Add these to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Microsoft OAuth Setup

### Step 1: Register an Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in the details:
   - Name: TeacherTab
   - **Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"** ⚠️ CRITICAL - Must select this exact option
   - Redirect URI:
     - Platform: Web
     - URI: `https://yourdomain.com/api/auth/microsoft/callback` (production)
     - Or: `http://localhost:3000/api/auth/microsoft/callback` (local)
5. Click "Register"

**⚠️ IMPORTANT:** If you get "unauthorized_client: The client does not exist or is not enabled for consumers" error:

1. **Check Authentication Settings:**
   - Go to your app registration → "Authentication"
   - Under "Supported account types", verify it says: "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"
   - If it doesn't match, change it and click "Save"
   - Wait 5-10 minutes for changes to propagate

2. **If changing settings doesn't work:**
   - You may need to create a **new** app registration with the correct account type from the start
   - Some Azure tenants don't allow changing this setting after creation
   - Delete the old registration and create a new one with the correct account type

3. **Verify Redirect URI:**
   - Go to "Authentication" → "Platform configurations" → "Web"
   - Make sure your redirect URI matches **exactly** (including http vs https, no trailing slashes)
   - For local: `http://localhost:3000/api/auth/microsoft/callback`
   - For production: `https://yourdomain.com/api/auth/microsoft/callback`

### Step 2: Create a Client Secret

1. In your app registration, go to "Certificates & secrets"
2. Click "New client secret"
3. Add a description (e.g., "TeacherTab Web Secret")
4. Choose an expiration period
5. Click "Add"
6. **Important**: Copy the secret value immediately (you won't be able to see it again)

### Step 3: Configure API Permissions

1. Go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Delegated permissions"
5. Add these permissions:
   - `openid`
   - `email`
   - `profile`
   - `User.Read`
6. Click "Add permissions"
7. Click "Grant admin consent" (if you have admin rights)

### Step 4: Add to Environment Variables

Add these to your `.env` file:

```env
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here
```

## Environment Variables Summary

Add all of these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Existing variables (make sure these are set)
AUTH_SECRET=your_auth_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # or http://localhost:3000 for local
```

## Testing OAuth

### Local Development

1. Make sure your `.env` file has all the required variables
2. Use `http://localhost:3000` as the redirect URI in both Google and Microsoft
3. Start your development server: `pnpm dev`
4. Navigate to `/sign-in` or `/sign-up`
5. Click "Continue with Google" or "Continue with Microsoft"
6. Complete the OAuth flow

### Production

1. Update redirect URIs in both Google and Microsoft to use your production domain
2. Deploy your application
3. Test the OAuth flow on your production site

## Troubleshooting

### "OAuth is not configured" error
- Check that `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, and `MICROSOFT_CLIENT_SECRET` are set in your environment variables
- Restart your development server after adding environment variables

### "Invalid redirect URI" error
- Make sure the redirect URI in your OAuth provider matches exactly what's in your code
- For Google: Check in Google Cloud Console > Credentials
- For Microsoft: Check in Azure Portal > App registrations > Redirect URIs
- The URI must match exactly (including http vs https, trailing slashes, etc.)

### "Email not verified" error (Google)
- Google requires email verification for OAuth
- Make sure the Google account you're using has a verified email address

### OAuth works but checkout fails
- Make sure Stripe is properly configured
- Check that the `priceId` is being passed correctly in the OAuth flow
- Verify that the checkout session creation is working

## Security Notes

- Never commit your OAuth client secrets to version control
- Use environment variables for all sensitive credentials
- Rotate secrets periodically
- Use different OAuth apps for development and production
- Enable 2FA on your Google Cloud and Azure accounts

## Next Steps

After setting up OAuth:
1. Test both sign-in and sign-up flows
2. Verify that users are created correctly in your database
3. Test the Stripe checkout integration with OAuth sign-ups
4. Monitor for any errors in your application logs

