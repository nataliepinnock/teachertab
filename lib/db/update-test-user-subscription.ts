import { db } from './drizzle';
import { users } from './schema';
import { eq } from 'drizzle-orm';

async function updateTestUserSubscription() {
  const email = 'testuser@test.com';

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

  // Update the user with active subscription status for testing
  await db
    .update(users)
    .set({
      subscriptionStatus: 'active',
      planName: 'Base',
      stripeCustomerId: `test_cus_${existingUser.id}`,
      stripeSubscriptionId: `test_sub_${existingUser.id}`,
      stripeProductId: 'test_prod_base',
      updatedAt: new Date()
    })
    .where(eq(users.id, existingUser.id));

  console.log('✅ Updated subscription status for test user:', email);
  console.log('   Subscription Status: active');
  console.log('   Plan Name: Base');
  process.exit(0);
}

updateTestUserSubscription().catch((err) => {
  console.error('❌ Failed to update subscription:', err);
  process.exit(1);
});

