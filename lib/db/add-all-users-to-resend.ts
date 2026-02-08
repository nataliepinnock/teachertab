import { db } from './drizzle';
import { users } from './schema';
import { isNull } from 'drizzle-orm';
import { addUserToResendAudience } from '@/lib/emails/service';

/**
 * Script to add all existing users to Resend Audience
 * Run with: npx tsx lib/db/add-all-users-to-resend.ts
 */
async function addAllUsersToResend() {
  console.log('🔄 Fetching all users from database...');

  // Get all users that haven't been deleted
  const allUsers = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt));

  const totalUsers = allUsers.length;
  console.log(`📊 Found ${totalUsers} user(s) to process`);

  if (totalUsers === 0) {
    console.log('✅ No users to add. Exiting.');
    process.exit(0);
  }

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const progress = `[${i + 1}/${totalUsers}]`;

    try {
      // Build metadata for the contact
      const metadata: Record<string, string> = {
        user_id: user.id.toString(),
        ...(user.location && { location: user.location }),
        ...(user.teachingPhase && { teaching_phase: user.teachingPhase }),
        ...(user.colorPreference && { color_preference: user.colorPreference }),
        ...(user.timetableCycle && { timetable_cycle: user.timetableCycle }),
        ...(user.planName && { plan_name: user.planName }),
        ...(user.subscriptionStatus && { subscription_status: user.subscriptionStatus }),
        ...(user.stripeCustomerId && { stripe_customer_id: user.stripeCustomerId }),
        ...(user.createdAt && { account_created: user.createdAt.toISOString() }),
      };

      await addUserToResendAudience(user.email, user.name, metadata);
      successCount++;
      console.log(`${progress} ✅ Added: ${user.email}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If contact already exists, that's okay - count as success
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate') || errorMessage.includes('409')) {
        successCount++;
        skippedCount++;
        console.log(`${progress} ⏭️  Already exists: ${user.email}`);
      } else {
        errorCount++;
        console.error(`${progress} ❌ Failed to add ${user.email}:`, errorMessage);
      }
    }

    // Small delay to avoid rate limiting
    if (i < allUsers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n📈 Summary:');
  console.log(`   ✅ Successfully added/updated: ${successCount}`);
  if (skippedCount > 0) {
    console.log(`   ⏭️  Already in audience: ${skippedCount}`);
  }
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
  }
  console.log(`   📊 Total processed: ${totalUsers}`);

  if (errorCount === 0) {
    console.log('\n✅ All users have been added to Resend Audience!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  Completed with ${errorCount} error(s).`);
    process.exit(1);
  }
}

addAllUsersToResend().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

