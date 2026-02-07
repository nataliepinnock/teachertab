# OAuth Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Add Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth  
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### 2. Set Up Google OAuth (2 minutes)

1. Go to https://console.cloud.google.com/
2. Create a project or select existing
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure OAuth consent screen (External, add your email)
6. Create OAuth client:
   - Type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (or your production URL)
7. Copy Client ID and Client Secret to `.env`

### 3. Set Up Microsoft OAuth (2 minutes)

1. Go to https://portal.azure.com/
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: TeacherTab
   - **Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"** ⚠️ IMPORTANT
   - Redirect URI: 
     - Platform: Web
     - URI: `http://localhost:3000/api/auth/microsoft/callback` (or your production URL)
5. Click "Register"
6. Go to "Certificates & secrets" > "New client secret"
7. Copy Application (client) ID and Client secret value to `.env`

**⚠️ If you get "unauthorized_client" error:**
- Go to your app registration → "Authentication"
- Under "Supported account types", select "Accounts in any organizational directory and personal Microsoft accounts"
- Click "Save"

### 4. Verify Setup

Run the verification script:

```bash
pnpm oauth:verify
```

This will check:
- ✅ All environment variables are set
- ✅ Redirect URIs are correct
- ✅ Configuration is complete

### 5. Test It!

1. Start your dev server: `pnpm dev`
2. Go to `/sign-in` or `/sign-up`
3. Click "Continue with Google" or "Continue with Microsoft"
4. Complete the OAuth flow

## 📝 Important Notes

- **Redirect URIs must match exactly** (including http vs https, trailing slashes, etc.)
- For production, update redirect URIs in both Google and Microsoft to use your production domain
- OAuth buttons will appear on both sign-in and sign-up pages
- For sign-ups, users will be redirected to Stripe checkout after OAuth
- For sign-ins, users go directly to the dashboard

## 🔧 Troubleshooting

**"OAuth is not configured"**
- Check your `.env` file has all 4 OAuth variables
- Restart your dev server after adding variables

**"Invalid redirect URI"**
- Make sure the URI in your OAuth provider matches exactly what's in your code
- Check for http vs https, trailing slashes, etc.

**OAuth works but checkout fails**
- Make sure Stripe is configured
- Check that `priceId` is being passed in the OAuth flow

For detailed setup instructions, see `OAUTH_SETUP.md`.

