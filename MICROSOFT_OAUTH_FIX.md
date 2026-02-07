# Fix Microsoft OAuth "unauthorized_client" Error

## The Problem
You're getting: `unauthorized_client: The client does not exist or is not enabled for consumers`

This means your Microsoft app registration is not configured to allow personal Microsoft accounts.

## Solution: Create a New App Registration

Some Azure tenants don't allow changing the "Supported account types" setting after creation. You need to create a **new** app registration with the correct settings from the start.

### Step 1: Create New App Registration

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Fill in:
   - **Name**: TeacherTab (or TeacherTab-v2)
   - **Supported account types**: ⚠️ **MUST SELECT**: "Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"
   - **Redirect URI**:
     - Click "Add a platform" → Select "Web"
     - URI: `http://localhost:3000/api/auth/microsoft/callback`
5. Click **Register**

### Step 2: Get Your New Credentials

1. On the app registration overview page, copy the **Application (client) ID** - this is your `MICROSOFT_CLIENT_ID`
2. Go to **Certificates & secrets**
3. Click **New client secret**
4. Add description: "TeacherTab Web Secret"
5. Choose expiration (24 months recommended)
6. Click **Add**
7. **IMMEDIATELY** copy the **Value** (not the Secret ID) - this is your `MICROSOFT_CLIENT_SECRET`
   - ⚠️ **CRITICAL**: You must copy the **Value** column, NOT the **Secret ID** column
   - ⚠️ The Value looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (a GUID format)
   - ⚠️ The Secret ID looks like: `X.XXX~xxx~xxx...` (different format - longer string)
   - ⚠️ You won't be able to see the Value again after you leave the page!

### Step 3: Configure API Permissions ⚠️ CRITICAL

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:
   - `openid` (usually added automatically)
   - `email` (usually added automatically)
   - `profile` (usually added automatically)
   - `User.Read` (click to add this one)
6. Click **Add permissions**
7. **IMPORTANT**: Click **Grant admin consent for [your tenant]**
   - ⚠️ This step is REQUIRED - without admin consent, you'll get 403 Forbidden errors
   - ⚠️ You must be an admin or have permission to grant consent
   - ⚠️ If you don't see this button, ask an admin to grant consent

### Step 4: Update Your .env File

Replace your old Microsoft credentials with the new ones:

```env
MICROSOFT_CLIENT_ID=your_new_client_id_here
MICROSOFT_CLIENT_SECRET=your_new_client_secret_here
```

### Step 5: Restart Your Dev Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
pnpm dev
```

### Step 6: Test

Try signing in with Microsoft again. It should work now!

## Why This Happens

- The "Supported account types" setting cannot always be changed after app registration creation
- Some Azure tenants have restrictions on modifying this setting
- Creating a new registration with the correct setting from the start is the most reliable solution

## Optional: Delete Old Registration

Once the new one is working, you can delete the old app registration:
1. Go to the old app registration
2. Click **Delete** (at the top)
3. Confirm deletion

