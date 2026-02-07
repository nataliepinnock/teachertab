export type OAuthProvider = 'google' | 'microsoft';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export interface MicrosoftUserInfo {
  id: string;
  mail: string;
  userPrincipalName: string;
  displayName: string;
  givenName?: string;
  surname?: string;
}

export function getGoogleAuthUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function getMicrosoftAuthUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile User.Read',
    state: state,
    response_mode: 'query',
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function getGoogleAccessToken(
  code: string,
  config: OAuthConfig
): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Google access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function getMicrosoftAccessToken(
  code: string,
  config: OAuthConfig
): Promise<string> {
  const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  
  console.log('[oauth/microsoft] Requesting access token:', {
    tokenUrl,
    redirectUri: config.redirectUri,
    hasCode: !!code,
    clientIdPrefix: config.clientId?.substring(0, 10) + '...',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
      scope: 'openid email profile User.Read',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[oauth/microsoft] Access token request failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Failed to get Microsoft access token: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('[oauth/microsoft] Access token received successfully');
  return data.access_token;
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Google user info: ${error}`);
  }

  return await response.json();
}

export async function getMicrosoftUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
  const userInfoUrl = 'https://graph.microsoft.com/v1.0/me';
  
  console.log('[oauth/microsoft] Requesting user info from Microsoft Graph');

  const response = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[oauth/microsoft] User info request failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Failed to get Microsoft user info: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const userInfo = await response.json();
  console.log('[oauth/microsoft] User info received:', {
    hasMail: !!userInfo.mail,
    hasUserPrincipalName: !!userInfo.userPrincipalName,
    hasDisplayName: !!userInfo.displayName,
  });
  return userInfo;
}

