import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendUserInfoToResend } from './service';

/**
 * Helper function to remove a user from marketing emails
 * This ensures both the database and Resend stay in sync
 * 
 * NOTE: This marks the user as "unsubscribed" in Resend but keeps them in the audience
 * so they can still receive transactional emails (password resets, account updates, etc.).
 * Only account deletion removes them completely from the audience.
 * 
 * @param email - The user's email address
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function removeUserFromMarketingEmails(email: string): Promise<boolean> {
  try {
    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.error(`[remove-from-marketing] User not found: ${email}`);
      return false;
    }

    // If already unsubscribed, return success
    if (user.marketingEmails === 0) {
      console.log(`[remove-from-marketing] User ${email} is already unsubscribed`);
      return true;
    }

    // Update the database
    const [updatedUser] = await db
      .update(users)
      .set({
        marketingEmails: 0, // 0 = unsubscribed
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      console.error(`[remove-from-marketing] Failed to update user in database: ${email}`);
      return false;
    }

    // Sync to Resend (this will mark them as unsubscribed but keep in audience for transactional emails)
    try {
      await sendUserInfoToResend(updatedUser, 'profile_update');
      console.log(`[remove-from-marketing] Successfully marked ${email} as unsubscribed from marketing emails (still in audience for transactional emails)`);
      return true;
    } catch (resendError) {
      console.error(`[remove-from-marketing] Database updated but Resend sync failed for ${email}:`, resendError);
      // Database is updated, but Resend sync failed
      // Return false so caller knows there was a partial failure
      return false;
    }
  } catch (error) {
    console.error(`[remove-from-marketing] Error removing ${email} from marketing emails:`, error);
    return false;
  }
}

