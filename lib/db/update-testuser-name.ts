import { db } from './drizzle';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import { addUserToResendAudience } from '@/lib/emails/service';

/**
 * Script to update testuser@test.com name to be unique
 * Run with: npx tsx lib/db/update-testuser-name.ts
 */
async function updateTestUserName() {
  const email = 'testuser@test.com';
  const newName = 'Test User 2'; // Make it unique from "Test User"

  // Find the user
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!existingUser) {
    console.error('❌ User not found:', email);
    process.exit(1);
  }

  console.log(`🔄 Updating name for ${email}...`);
  console.log(`   Old name: ${existingUser.name || 'N/A'}`);
  console.log(`   New name: ${newName}`);

  // Update the user's name
  const [updatedUser] = await db
    .update(users)
    .set({
      name: newName,
      updatedAt: new Date()
    })
    .where(eq(users.id, existingUser.id))
    .returning();

  if (!updatedUser) {
    console.error('❌ Failed to update user');
    process.exit(1);
  }

  console.log('✅ Updated user name in database');

  // Update the contact in Resend with the new name
  console.log('🔄 Updating contact in Resend Audience...');
  
  try {
    const metadata: Record<string, string> = {
      user_id: updatedUser.id.toString(),
      ...(updatedUser.location && { location: updatedUser.location }),
      ...(updatedUser.teachingPhase && { teaching_phase: updatedUser.teachingPhase }),
      ...(updatedUser.colorPreference && { color_preference: updatedUser.colorPreference }),
      ...(updatedUser.timetableCycle && { timetable_cycle: updatedUser.timetableCycle }),
      ...(updatedUser.planName && { plan_name: updatedUser.planName }),
      ...(updatedUser.subscriptionStatus && { subscription_status: updatedUser.subscriptionStatus }),
      ...(updatedUser.stripeCustomerId && { stripe_customer_id: updatedUser.stripeCustomerId }),
      ...(updatedUser.createdAt && { account_created: updatedUser.createdAt.toISOString() }),
    };

    await addUserToResendAudience(updatedUser.email, updatedUser.name, metadata);
    console.log('✅ Updated contact in Resend Audience with new name');
    console.log('\n💡 Refresh your Resend dashboard - you should now see all 3 contacts with unique names!');
  } catch (error) {
    console.error('⚠️  Failed to update contact in Resend:', error instanceof Error ? error.message : String(error));
    console.log('   The database was updated, but Resend update failed. You may need to manually update in Resend.');
  }

  process.exit(0);
}

updateTestUserName().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

