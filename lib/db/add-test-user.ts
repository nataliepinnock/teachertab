import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function addTestUser() {
  const email = 'testuser@test.com';
  const password = 'test1234'; // Must be at least 8 characters (HTML5 validation)
  const passwordHash = await hashPassword(password);

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (existingUser) {
    console.log('ℹ️ User already exists:', email);
    process.exit(0);
  }

  // Create test user with active subscription status for UI testing
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      teacherType: 'primary',
      timetableCycle: 'weekly',
      name: 'Test User',
      subscriptionStatus: 'active', // Required for sign-in
      planName: 'Base',
      stripeCustomerId: `test_cus_${Date.now()}`, // Mock Stripe customer ID
      stripeSubscriptionId: `test_sub_${Date.now()}`, // Mock Stripe subscription ID
      stripeProductId: 'test_prod_base',
    })
    .returning();

  console.log('✅ Created test user:', user.email);
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   User ID:', user.id);
  console.log('   Subscription Status: active');
  process.exit(0);
}

addTestUser().catch((err) => {
  console.error('❌ Failed to add test user:', err);
  process.exit(1);
});

