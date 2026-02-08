import 'dotenv/config';
import { db } from './drizzle';
import { users } from './schema';
import { isNotNull, lt, eq, and } from 'drizzle-orm';

/**
 * Script to permanently delete accounts that were soft-deleted 30+ days ago
 * This should be run periodically (e.g., via cron job or scheduled task)
 * 
 * Usage: npx tsx lib/db/cleanup-deleted-accounts.ts
 */
async function cleanupDeletedAccounts() {
  console.log('🔄 Checking for accounts to permanently delete...\n');

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log(`📅 Looking for accounts deleted before: ${thirtyDaysAgo.toISOString()}\n`);

  // Find all users that were deleted 30+ days ago
  const deletedUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(and(
      isNotNull(users.deletedAt),
      lt(users.deletedAt, thirtyDaysAgo)
    ));

  const totalToDelete = deletedUsers.length;
  console.log(`📊 Found ${totalToDelete} account(s) to permanently delete\n`);

  if (totalToDelete === 0) {
    console.log('✅ No accounts to delete. Exiting.');
    process.exit(0);
  }

  // Show accounts that will be deleted
  console.log('📋 Accounts to be permanently deleted:');
  deletedUsers.forEach((user, index) => {
    console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - Deleted: ${user.deletedAt?.toISOString()}`);
  });
  console.log('');

  // Confirm deletion (in production, you might want to add a --force flag)
  if (process.env.NODE_ENV === 'production' && !process.env.FORCE_CLEANUP) {
    console.log('⚠️  Running in production mode. Set FORCE_CLEANUP=true to proceed with deletion.');
    console.log('⚠️  This is a destructive operation. Make sure you have backups!');
    process.exit(1);
  }

  let deletedCount = 0;
  let errorCount = 0;
  let resendRemovedCount = 0;
  let resendErrorCount = 0;

  // Import Resend removal function
  let removeContactFromResendAudience: ((email: string) => Promise<void>) | null = null;
  try {
    const resendModule = await import('@/lib/emails/service');
    removeContactFromResendAudience = resendModule.removeContactFromResendAudience;
  } catch (importError) {
    console.warn('⚠️  Could not import removeContactFromResendAudience:', importError);
  }

  for (let i = 0; i < deletedUsers.length; i++) {
    const user = deletedUsers[i];
    try {
      // Remove from Resend first
      if (removeContactFromResendAudience) {
        try {
          await removeContactFromResendAudience(user.email);
          resendRemovedCount++;
          console.log(`   📧 Removed from Resend: ${user.email}`);
        } catch (resendError) {
          resendErrorCount++;
          console.warn(`   ⚠️  Failed to remove from Resend (continuing with DB deletion):`, {
            email: user.email,
            error: resendError instanceof Error ? resendError.message : String(resendError),
          });
        }
      }

      // Then delete from database
      await db.delete(users).where(eq(users.id, user.id));
      deletedCount++;
      console.log(`✅ [${i + 1}/${totalToDelete}] Permanently deleted account: ${user.email}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ [${i + 1}/${totalToDelete}] Failed to delete ${user.email}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log('\n📈 Cleanup Summary:');
  console.log(`   ✅ Successfully deleted from DB: ${deletedCount}`);
  console.log(`   📧 Removed from Resend: ${resendRemovedCount}`);
  console.log(`   ⚠️  Resend removal errors: ${resendErrorCount}`);
  console.log(`   ❌ DB deletion errors: ${errorCount}`);
  console.log(`   📊 Total processed: ${totalToDelete}`);

  if (errorCount > 0) {
    console.error('\n⚠️  Some accounts failed to delete. Please review the logs above.');
    process.exit(1);
  } else {
    console.log('\n✅ All eligible accounts have been permanently deleted!');
    process.exit(0);
  }
}

cleanupDeletedAccounts().catch((err) => {
  console.error('❌ Fatal error during cleanup:', err);
  process.exit(1);
});

