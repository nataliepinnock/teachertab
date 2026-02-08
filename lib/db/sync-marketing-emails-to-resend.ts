import 'dotenv/config';
import { db } from './drizzle';
import { users } from './schema';
import { isNull } from 'drizzle-orm';
import { sendUserInfoToResend } from '@/lib/emails/service';

/**
 * Script to sync all users' marketingEmails status from database to Resend
 * This ensures Resend reflects the current state of marketingEmails in Supabase
 * 
 * Usage: npx tsx lib/db/sync-marketing-emails-to-resend.ts
 */
async function syncMarketingEmailsToResend() {
  console.log('🔄 Syncing marketing emails status from database to Resend...\n');

  // Get all users that haven't been deleted
  const allUsers = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt));

  const totalUsers = allUsers.length;
  console.log(`📊 Found ${totalUsers} user(s) in database\n`);

  if (totalUsers === 0) {
    console.log('✅ No users to sync. Exiting.');
    process.exit(0);
  }

  let syncedCount = 0;
  let errorCount = 0;
  const subscribedUsers: string[] = [];
  const unsubscribedUsers: string[] = [];

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const progress = `[${i + 1}/${totalUsers}]`;
    const isSubscribed = user.marketingEmails === 1 || user.marketingEmails === true;

    try {
      console.log(`${progress} Syncing ${user.email}...`);
      console.log(`   Marketing Emails: ${user.marketingEmails} (${isSubscribed ? 'subscribed' : 'unsubscribed'})`);

      // Sync to Resend - this will add/update if subscribed, or mark as unsubscribed if not
      await sendUserInfoToResend(user, 'profile_update');
      
      syncedCount++;
      if (isSubscribed) {
        subscribedUsers.push(user.email);
        console.log(`   ✅ Synced: Subscribed in Resend`);
      } else {
        unsubscribedUsers.push(user.email);
        console.log(`   ✅ Synced: Marked as unsubscribed in Resend`);
      }
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any)?.statusCode || (error as any)?.code;
      console.error(`${progress} ❌ Failed to sync ${user.email}:`, {
        error: errorMessage,
        code: errorCode,
      });
      
      // If it's a rate limit error, suggest waiting
      if (errorMessage.includes('429') || errorCode === 429) {
        console.log(`   💡 Rate limited. Wait a moment and run the script again for remaining users.`);
      }
    }

    // Small delay to avoid rate limiting
    if (i < allUsers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n📈 Sync Summary:');
  console.log(`   ✅ Successfully synced: ${syncedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📧 Subscribed users: ${subscribedUsers.length}`);
  console.log(`   🚫 Unsubscribed users: ${unsubscribedUsers.length}`);

  if (subscribedUsers.length > 0) {
    console.log('\n📧 Subscribed users:');
    subscribedUsers.forEach(email => console.log(`   - ${email}`));
  }

  if (unsubscribedUsers.length > 0) {
    console.log('\n🚫 Unsubscribed users:');
    unsubscribedUsers.forEach(email => console.log(`   - ${email}`));
  }

  if (errorCount > 0) {
    console.log('\n⚠️  Some users failed to sync. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All users have been synced to Resend!');
    process.exit(0);
  }
}

syncMarketingEmailsToResend();

