# Fix Microsoft OAuth 403 Forbidden Error

## The Problem
You're getting a 403 Forbidden error when trying to get user info, even though you have `User.Read` permission configured.

## The Solution: Grant Admin Consent

The permission is configured, but **admin consent hasn't been granted**. This is required for the permission to work.

### Step-by-Step Fix:

1. **Go to Azure Portal**
   - Navigate to: [Azure Portal](https://portal.azure.com/)
   - Go to **Azure Active Directory** → **App registrations**
   - Click on your app registration

2. **Go to API Permissions**
   - In the left sidebar, click **API permissions**
   - You should see `User.Read` listed under Microsoft Graph

3. **Grant Admin Consent**
   - Look for a button that says **"Grant admin consent for [your tenant name]"**
   - Click it
   - Confirm when prompted
   - You should see green checkmarks (✓) appear next to the permissions

4. **Verify**
   - After granting consent, you should see:
     - Status: "Granted for [your tenant]"
     - Green checkmarks next to all permissions

5. **Try Again**
   - Clear your browser cookies/session (or use incognito mode)
   - Try signing in with Microsoft again

## If You Don't See the "Grant Admin Consent" Button

If you don't have admin rights:
- Ask an Azure AD administrator to grant consent for you
- Or use a personal Microsoft account (which auto-consents)

## Alternative: Use Personal Microsoft Account

If you're testing with a personal Microsoft account (@outlook.com, @hotmail.com, etc.):
- Personal accounts usually auto-consent
- Try signing in again - it should work without admin consent

## Still Getting 403?

If you still get 403 after granting admin consent:
1. Wait 5-10 minutes for changes to propagate
2. Clear browser cache and cookies
3. Try in an incognito/private window
4. Verify the permission shows as "Granted" in Azure Portal

