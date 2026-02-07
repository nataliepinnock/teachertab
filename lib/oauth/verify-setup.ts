/**
 * Utility script to verify OAuth configuration
 * Run with: npx tsx lib/oauth/verify-setup.ts
 */

import dotenv from 'dotenv';
import { getOAuthRedirectUri } from './utils';

// Load environment variables from .env file
dotenv.config();

function checkEnvVar(name: string): { exists: boolean; value: string | undefined } {
  const value = process.env[name];
  return {
    exists: !!value,
    value: value ? (value.length > 0 ? `${value.substring(0, 10)}...` : 'empty') : undefined,
  };
}

function verifyOAuthSetup() {
  console.log('🔍 Verifying OAuth Configuration...\n');

  const googleClientId = checkEnvVar('GOOGLE_CLIENT_ID');
  const googleClientSecret = checkEnvVar('GOOGLE_CLIENT_SECRET');
  const microsoftClientId = checkEnvVar('MICROSOFT_CLIENT_ID');
  const microsoftClientSecret = checkEnvVar('MICROSOFT_CLIENT_SECRET');
  const authSecret = checkEnvVar('AUTH_SECRET');
  const appUrl = checkEnvVar('NEXT_PUBLIC_APP_URL');

  console.log('📋 Environment Variables:');
  console.log('─'.repeat(50));
  console.log(`GOOGLE_CLIENT_ID:        ${googleClientId.exists ? '✅ Set' : '❌ Missing'} ${googleClientId.value || ''}`);
  console.log(`GOOGLE_CLIENT_SECRET:    ${googleClientSecret.exists ? '✅ Set' : '❌ Missing'} ${googleClientSecret.value || ''}`);
  console.log(`MICROSOFT_CLIENT_ID:     ${microsoftClientId.exists ? '✅ Set' : '❌ Missing'} ${microsoftClientId.value || ''}`);
  console.log(`MICROSOFT_CLIENT_SECRET: ${microsoftClientSecret.exists ? '✅ Set' : '❌ Missing'} ${microsoftClientSecret.value || ''}`);
  console.log(`AUTH_SECRET:             ${authSecret.exists ? '✅ Set' : '❌ Missing'} ${authSecret.value || ''}`);
  console.log(`NEXT_PUBLIC_APP_URL:     ${appUrl.exists ? '✅ Set' : '⚠️  Not set (will use default)'} ${appUrl.value || ''}`);
  console.log('─'.repeat(50));

  const googleRedirectUri = getOAuthRedirectUri('google');
  const microsoftRedirectUri = getOAuthRedirectUri('microsoft');

  console.log('\n🔗 OAuth Redirect URIs:');
  console.log('─'.repeat(50));
  console.log(`Google:    ${googleRedirectUri}`);
  console.log(`Microsoft: ${microsoftRedirectUri}`);
  console.log('─'.repeat(50));

  console.log('\n📝 Next Steps:');
  console.log('─'.repeat(50));

  if (!googleClientId.exists || !googleClientSecret.exists) {
    console.log('1. Set up Google OAuth:');
    console.log('   - Go to https://console.cloud.google.com/');
    console.log('   - Create OAuth 2.0 credentials');
    console.log(`   - Add redirect URI: ${googleRedirectUri}`);
    console.log('   - Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env\n');
  }

  if (!microsoftClientId.exists || !microsoftClientSecret.exists) {
    console.log('2. Set up Microsoft OAuth:');
    console.log('   - Go to https://portal.azure.com/');
    console.log('   - Register a new application');
    console.log(`   - Add redirect URI: ${microsoftRedirectUri}`);
    console.log('   - Create a client secret');
    console.log('   - Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to .env\n');
  }

  if (!authSecret.exists) {
    console.log('3. Set AUTH_SECRET in .env (required for OAuth state management)\n');
  }

  const allConfigured = 
    googleClientId.exists && 
    googleClientSecret.exists && 
    microsoftClientId.exists && 
    microsoftClientSecret.exists && 
    authSecret.exists;

  if (allConfigured) {
    console.log('✅ All OAuth providers are configured!');
    console.log('\n💡 Make sure the redirect URIs above match exactly in your OAuth provider settings.');
  } else {
    console.log('⚠️  Some OAuth providers are not configured. See steps above.');
  }

  console.log('\n📚 For detailed setup instructions, see OAUTH_SETUP.md');
}

verifyOAuthSetup();

