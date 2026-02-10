import 'dotenv/config';
import { Resend } from 'resend';

/**
 * Test script to verify Resend Audience API is working
 * Run with: npx tsx lib/db/test-resend-audience.ts
 */
async function testResendAudience() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  console.log('🔍 Testing Resend Audience API...\n');
  console.log('Configuration:');
  console.log(`  RESEND_API_KEY: ${resendApiKey ? '✅ Set' : '❌ NOT SET'}`);
  console.log(`  RESEND_AUDIENCE_ID: ${audienceId ? `✅ Set (${audienceId})` : '⚠️  Not set (will use default audience)'}\n`);

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY is required. Please set it in your .env file.');
    process.exit(1);
  }

  const resend = new Resend(resendApiKey);
  const testEmail = `test-${Date.now()}@example.com`;
  const testName = 'Test User';

  try {
    console.log(`📝 Creating test contact: ${testEmail}...`);
    
    const contactData: any = {
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      unsubscribed: false,
    };

    let response;
    if (audienceId) {
      console.log(`  Using audienceId: ${audienceId}`);
      response = await resend.contacts.create({
        email: testEmail,
        audienceId,
        ...contactData,
      });
    } else {
      console.log(`  Using default audience (no audienceId)`);
      response = await resend.contacts.create({
        email: testEmail,
        ...contactData,
      });
    }

    console.log('✅ Successfully created contact!');
    console.log('  Response:', JSON.stringify(response, null, 2));
    
    // Try to verify it exists
    console.log('\n🔍 Verifying contact exists...');
    if (audienceId) {
      const contacts = await resend.contacts.list({ audienceId });
      const contactsData = (contacts as any)?.data as any[] | undefined;
      const found = contactsData?.find((c: any) => c.email === testEmail);
      if (found) {
        console.log('✅ Contact found in audience!');
        console.log('  Contact data:', JSON.stringify(found, null, 2));
      } else {
        console.log('⚠️  Contact not found in list (may take a moment to appear)');
      }
    } else {
      console.log('⚠️  Cannot verify without audienceId');
    }

    // Clean up - remove test contact
    console.log('\n🧹 Cleaning up test contact...');
    try {
      if (audienceId) {
        await resend.contacts.remove({ email: testEmail, audienceId });
      } else {
        await resend.contacts.remove({ email: testEmail });
      }
      console.log('✅ Test contact removed');
    } catch (cleanupError) {
      console.warn('⚠️  Failed to remove test contact (this is okay):', cleanupError);
    }

    console.log('\n✅ Resend Audience API is working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Failed to create contact:', {
      error: error instanceof Error ? error.message : String(error),
      code: (error as any)?.statusCode || (error as any)?.code,
      response: (error as any)?.response,
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

testResendAudience();

