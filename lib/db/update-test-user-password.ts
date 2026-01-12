import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

async function updateTestUserPassword() {
  const email = 'testuser@test.com';
  const newPassword = 'test1234'; // 8 characters
  const passwordHash = await hashPassword(newPassword);

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

  // Update the password
  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date()
    })
    .where(eq(users.id, existingUser.id));

  console.log('✅ Updated password for test user:', email);
  console.log('   New Password:', newPassword);
  process.exit(0);
}

updateTestUserPassword().catch((err) => {
  console.error('❌ Failed to update password:', err);
  process.exit(1);
});

