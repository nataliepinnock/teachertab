import 'dotenv/config';
import { db } from './drizzle';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { sendUserInfoToResend } from '@/lib/emails/service';

/**
 * Script to manually remove a user from marketing emails
 * This ensures both the database and Resend stay in sync
 * 
 * Usage: npx tsx lib/db/remove-user-from-marketing.ts <email>
 * Example: npx tsx lib/db/remove-user-from-marketing.ts user@example.com
 */
async function removeUserFromMarketing() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npx tsx lib/db/remove-user-from-marketing.ts <email>');
    process.exit(1);
  }

  console.log(`🔄 Removing ${email} from marketing emails...\n`);

  try {
    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`📋 Found user: ${user.name || 'N/A'} (ID: ${user.id})`);
    console.log(`   Current marketingEmails: ${user.marketingEmails} (${user.marketingEmails === 1 ? 'subscribed' : 'unsubscribed'})`);

    if (user.marketingEmails === 0) {
      console.log('ℹ️  User is already unsubscribed from marketing emails');
      process.exit(0);
    }

    // Update the database
    console.log('\n📝 Updating database...');
    const [updatedUser] = await db
      .update(users)
      .set({
        marketingEmails: 0, // 0 = unsubscribed
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      console.error('❌ Failed to update user in database');
      process.exit(1);
    }

    console.log('✅ Database updated: marketingEmails = 0');

    // Sync to Resend (this will remove them from audience or mark as unsubscribed)
    console.log('\n🔄 Syncing to Resend...');
    try {
      await sendUserInfoToResend(updatedUser, 'profile_update');
      console.log('✅ Successfully synced to Resend');
      console.log('   User has been removed from Resend Audience or marked as unsubscribed');
    } catch (resendError) {
      console.error('❌ Failed to sync to Resend:', resendError);
      console.log('⚠️  Database was updated, but Resend sync failed');
      console.log('   You may need to manually remove them from Resend Audience');
      process.exit(1);
    }

    console.log('\n✅ Successfully removed user from marketing emails!');
    console.log('   Database: ✅ Updated');
    console.log('   Resend: ✅ Synced');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

removeUserFromMarketing();

