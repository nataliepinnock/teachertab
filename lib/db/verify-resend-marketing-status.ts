import 'dotenv/config';
import { db } from './drizzle';
import { users } from './schema';
import { isNull } from 'drizzle-orm';
import { Resend } from 'resend';

/**
 * Script to verify marketing emails status between database and Resend
 * This will show you exactly what's in Resend vs what's in your database
 * 
 * Usage: npx tsx lib/db/verify-resend-marketing-status.ts
 */
async function verifyMarketingStatus() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    process.exit(1);
  }

  const resend = new Resend(resendApiKey);

  console.log('🔄 Fetching users from database...\n');

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

  console.log('🔄 Fetching contacts from Resend...\n');

  // Fetch all contacts from Resend
  let resendContacts: any[] = [];
  try {
    if (audienceId) {
      const response = await resend.contacts.list({ audienceId });
      resendContacts = ((response as any)?.data as any[]) || [];
    } else {
      const response = await resend.contacts.list();
      resendContacts = ((response as any)?.data as any[]) || [];
    }
    console.log(`📊 Found ${resendContacts.length} contact(s) in Resend\n`);
  } catch (error) {
    console.error('❌ Failed to fetch contacts from Resend:', error);
    process.exit(1);
  }

  // Create a map of Resend contacts by email
  const resendMap = new Map<string, any>();
  resendContacts.forEach(contact => {
    resendMap.set(contact.email, contact);
  });

  console.log('📋 Comparison Report:\n');
  console.log('='.repeat(80));

  let matchCount = 0;
  let mismatchCount = 0;
  const mismatches: Array<{ email: string; dbStatus: string; resendStatus: string }> = [];

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const progress = `[${i + 1}/${totalUsers}]`;
    const dbSubscribed = Boolean(user.marketingEmails);
    const dbStatus = dbSubscribed ? 'SUBSCRIBED (1)' : 'UNSUBSCRIBED (0)';

    const resendContact = resendMap.get(user.email);
    
    if (!resendContact) {
      console.log(`${progress} ❌ ${user.email}`);
      console.log(`   Database: ${dbStatus}`);
      console.log(`   Resend: NOT FOUND`);
      mismatchCount++;
      mismatches.push({
        email: user.email,
        dbStatus,
        resendStatus: 'NOT FOUND'
      });
      continue;
    }

    const resendSubscribed = !resendContact.unsubscribed;
    const resendStatus = resendSubscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED';
    const resendUnsubscribed = resendContact.unsubscribed ? 'YES' : 'NO';

    const matches = dbSubscribed === resendSubscribed;

    if (matches) {
      console.log(`${progress} ✅ ${user.email}`);
      console.log(`   Database: ${dbStatus}`);
      console.log(`   Resend: ${resendStatus} (unsubscribed: ${resendUnsubscribed})`);
      matchCount++;
    } else {
      console.log(`${progress} ⚠️  ${user.email}`);
      console.log(`   Database: ${dbStatus}`);
      console.log(`   Resend: ${resendStatus} (unsubscribed: ${resendUnsubscribed})`);
      console.log(`   ⚠️  MISMATCH!`);
      mismatchCount++;
      mismatches.push({
        email: user.email,
        dbStatus,
        resendStatus: `${resendStatus} (unsubscribed: ${resendUnsubscribed})`
      });
    }

    // Show additional Resend contact info
    console.log(`   Resend ID: ${resendContact.id}`);
    console.log(`   Resend Created: ${resendContact.created_at || 'N/A'}`);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('\n📈 Summary:');
  console.log(`   ✅ Matching: ${matchCount}`);
  console.log(`   ⚠️  Mismatches: ${mismatchCount}`);
  console.log(`   📊 Total users: ${totalUsers}`);
  console.log(`   📧 Total Resend contacts: ${resendContacts.length}`);

  if (mismatches.length > 0) {
    console.log('\n⚠️  Mismatches found:');
    mismatches.forEach(m => {
      console.log(`   - ${m.email}`);
      console.log(`     Database: ${m.dbStatus}`);
      console.log(`     Resend: ${m.resendStatus}`);
    });
    console.log('\n💡 Run: pnpm run resend:sync-marketing-status to fix mismatches');
  } else {
    console.log('\n✅ All users match between database and Resend!');
  }

  // Show all Resend contacts that aren't in database
  const dbEmails = new Set(allUsers.map(u => u.email));
  const orphanedContacts = resendContacts.filter(c => !dbEmails.has(c.email));
  
  if (orphanedContacts.length > 0) {
    console.log(`\n📭 Found ${orphanedContacts.length} contact(s) in Resend that are not in database:`);
    orphanedContacts.forEach(c => {
      console.log(`   - ${c.email} (unsubscribed: ${c.unsubscribed ? 'YES' : 'NO'})`);
    });
  }

  process.exit(mismatches.length > 0 ? 1 : 0);
}

verifyMarketingStatus();

