import { db } from './drizzle';
import { sql } from 'drizzle-orm';

/**
 * Script to add marketing_emails column to users table
 * Run with: npx tsx lib/db/add-marketing-emails-column.ts
 */
async function addMarketingEmailsColumn() {
  try {
    console.log('🔄 Adding marketing_emails column to users table...');

    // Add the column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS marketing_emails integer NOT NULL DEFAULT 1;
    `);

    console.log('✅ Successfully added marketing_emails column to users table');
    console.log('   Default value: 1 (subscribed)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add marketing_emails column:', error);
    process.exit(1);
  }
}

addMarketingEmailsColumn().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

