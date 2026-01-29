/**
 * Migration script to migrate from teacherType to teachingPhase and colorPreference
 * 
 * This script:
 * 1. Adds teaching_phase and color_preference columns
 * 2. Migrates existing data from teacher_type
 * 3. Optionally removes teacher_type column (commented out for safety)
 * 
 * Run with: pnpm tsx lib/db/migrate-teacher-type.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client, { schema });

async function migrateTeacherType() {
  console.log('Starting migration from teacherType to teachingPhase/colorPreference...\n');

  try {
    // Step 1: Add new columns if they don't exist
    console.log('Step 1: Adding new columns...');
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS teaching_phase VARCHAR(20) NOT NULL DEFAULT 'primary',
      ADD COLUMN IF NOT EXISTS color_preference VARCHAR(10) NOT NULL DEFAULT 'subject';
    `);
    console.log('✓ New columns added\n');

    // Step 2: Migrate existing data
    console.log('Step 2: Migrating existing data...');
    
    // Primary/Mixed → teachingPhase: 'primary', colorPreference: 'subject'
    const primaryResult = await db.execute(sql`
      UPDATE users 
      SET 
        teaching_phase = 'primary',
        color_preference = 'subject'
      WHERE teacher_type IN ('primary', 'mixed');
    `);
    console.log(`✓ Migrated ${primaryResult.rowCount || 0} primary/mixed users to primary/subject`);

    // Secondary → teachingPhase: 'secondary', colorPreference: 'class'
    const secondaryResult = await db.execute(sql`
      UPDATE users 
      SET 
        teaching_phase = 'secondary',
        color_preference = 'class'
      WHERE teacher_type = 'secondary';
    `);
    console.log(`✓ Migrated ${secondaryResult.rowCount || 0} secondary users to secondary/class`);

    // Handle any null or unexpected values
    const nullResult = await db.execute(sql`
      UPDATE users 
      SET 
        teaching_phase = 'primary',
        color_preference = 'subject'
      WHERE teaching_phase IS NULL OR color_preference IS NULL;
    `);
    console.log(`✓ Fixed ${nullResult.rowCount || 0} null values\n`);

    // Step 3: Verify migration
    console.log('Step 3: Verifying migration...');
    const verification = await db.execute(sql`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN teaching_phase IS NOT NULL AND color_preference IS NOT NULL THEN 1 END)::int as migrated,
        COUNT(CASE WHEN teacher_type IS NOT NULL THEN 1 END)::int as still_has_old_column
      FROM users;
    `);
    
    // Handle different result formats
    const stats = Array.isArray(verification) ? verification[0] : (verification as any).rows?.[0] || verification;
    console.log(`Total users: ${stats?.total || 0}`);
    console.log(`Successfully migrated: ${stats?.migrated || 0}`);
    console.log(`Still have teacher_type: ${stats?.still_has_old_column || 0}\n`);

    // Step 4: Optional - Remove old column (commented out for safety)
    // Uncomment this section after verifying the migration is successful
    /*
    console.log('Step 4: Removing old teacher_type column...');
    await db.execute(sql`
      ALTER TABLE users DROP COLUMN IF EXISTS teacher_type;
    `);
    console.log('✓ Old column removed\n');
    */

    console.log('Migration completed successfully! ✅');
    console.log('\n⚠️  Note: teacher_type column still exists for safety.');
    console.log('   After verifying everything works, uncomment Step 4 in the script to remove it.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
migrateTeacherType()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });

