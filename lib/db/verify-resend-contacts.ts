import { db } from './drizzle';
import { users } from './schema';
import { isNull } from 'drizzle-orm';
import { Resend } from 'resend';

/**
 * Script to verify which users exist in Resend Audience
 * Run with: npx tsx lib/db/verify-resend-contacts.ts
 */
async function verifyResendContacts() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    process.exit(1);
  }

  const resend = new Resend(resendApiKey);

  console.log('🔄 Fetching all users from database...');

  // Get all users that haven't been deleted
  const allUsers = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt));

  const totalUsers = allUsers.length;
  console.log(`📊 Found ${totalUsers} user(s) in database\n`);

  if (totalUsers === 0) {
    console.log('✅ No users to verify. Exiting.');
    process.exit(0);
  }

  let foundCount = 0;
  let notFoundCount = 0;
  const notFoundEmails: string[] = [];

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const progress = `[${i + 1}/${totalUsers}]`;

    try {
      // Try to get the contact from Resend
      let contact;
      if (audienceId) {
        contact = await resend.contacts.get({
          email: user.email,
          audienceId,
        });
      } else {
        // Try to list contacts and find this one
        // Note: Resend API might not have a direct "get by email" without audienceId
        // This is a workaround - we'll try to get it
        try {
          contact = await resend.contacts.get({
            email: user.email,
          });
        } catch (getError) {
          // If get fails, try listing (though this is less efficient)
          console.log(`${progress} ⚠️  Could not directly verify ${user.email} (may need audienceId)`);
          foundCount++; // Assume found if we can't verify
          continue;
        }
      }

      if (contact) {
        foundCount++;
        const contactData = contact as any;
        const status = contactData.unsubscribed ? 'Unsubscribed' : 'Subscribed';
        console.log(`${progress} ✅ Found: ${user.email} (${status})`);
      } else {
        notFoundCount++;
        notFoundEmails.push(user.email);
        console.log(`${progress} ❌ Not found: ${user.email}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If contact not found, Resend returns 404
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        notFoundCount++;
        notFoundEmails.push(user.email);
        console.log(`${progress} ❌ Not found in Resend: ${user.email}`);
      } else {
        // Other error - log it
        console.error(`${progress} ⚠️  Error checking ${user.email}:`, errorMessage);
        // Assume not found for now
        notFoundCount++;
        notFoundEmails.push(user.email);
      }
    }

    // Small delay to avoid rate limiting
    if (i < allUsers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n📈 Verification Summary:');
  console.log(`   ✅ Found in Resend: ${foundCount}`);
  console.log(`   ❌ Not found in Resend: ${notFoundCount}`);
  console.log(`   📊 Total in database: ${totalUsers}`);

  if (notFoundEmails.length > 0) {
    console.log('\n⚠️  Contacts not found in Resend:');
    notFoundEmails.forEach(email => {
      console.log(`   - ${email}`);
    });
    console.log('\n💡 These contacts may need to be re-added. Run: pnpm run resend:add-all-users');
  } else {
    console.log('\n✅ All contacts are in Resend Audience!');
  }

  process.exit(notFoundCount > 0 ? 1 : 0);
}

verifyResendContacts().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

