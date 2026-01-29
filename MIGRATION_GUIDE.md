# Migration Guide: teacherType → teachingPhase + colorPreference

This guide walks you through migrating from the old `teacherType` field to the new `teachingPhase` and `colorPreference` fields.

## Overview

We're replacing the single `teacherType` field with two separate fields:
- **teachingPhase**: What phase/level you teach (Primary, Secondary, Elementary, etc.) - location-dependent
- **colorPreference**: How you want your calendar color-coded ('class' or 'subject')

## Migration Steps

### Step 1: Run the Drizzle Migration

This adds the new columns to your database:

```bash
pnpm db:migrate
```

This will apply the migration file `0010_add_teaching_phase_and_color_preference.sql` which adds:
- `teaching_phase` column (VARCHAR(20), default 'primary')
- `color_preference` column (VARCHAR(10), default 'subject')

### Step 2: Run the Data Migration Script

This migrates existing data from `teacher_type` to the new columns:

```bash
pnpm tsx lib/db/migrate-teacher-type.ts
```

**What this script does:**
1. ✅ Adds the new columns (if not already added)
2. ✅ Migrates existing data:
   - `primary` or `mixed` → `teachingPhase: 'primary'`, `colorPreference: 'subject'`
   - `secondary` → `teachingPhase: 'secondary'`, `colorPreference: 'class'`
3. ✅ Verifies the migration was successful
4. ⚠️ Keeps `teacher_type` column for safety (you can remove it later)

**Expected output:**
```
Starting migration from teacherType to teachingPhase/colorPreference...

Step 1: Adding new columns...
✓ New columns added

Step 2: Migrating existing data...
✓ Migrated X primary/mixed users to primary/subject
✓ Migrated Y secondary users to secondary/class
✓ Fixed Z null values

Step 3: Verifying migration...
Total users: X
Successfully migrated: X
Still have teacher_type: X

Migration completed successfully! ✅

⚠️  Note: teacher_type column still exists for safety.
   After verifying everything works, uncomment Step 4 in the script to remove it.
```

### Step 3: Verify the Migration

1. **Check your database:**
   ```sql
   SELECT id, name, teacher_type, teaching_phase, color_preference 
   FROM users 
   LIMIT 10;
   ```

2. **Test the application:**
   - Sign in to your account
   - Go to Account Settings
   - Verify you can see and edit "What phase do you teach?" and "How would you like your timetable color coded?"
   - Check that calendar views display correctly

### Step 4: Remove Old Column (Optional - After Verification)

Once you've verified everything works correctly, you can remove the old `teacher_type` column:

1. **Option A: Use the migration script** (recommended)
   - Edit `lib/db/migrate-teacher-type.ts`
   - Uncomment Step 4 (lines 79-85)
   - Run: `pnpm tsx lib/db/migrate-teacher-type.ts`

2. **Option B: Manual SQL**
   ```sql
   ALTER TABLE users DROP COLUMN IF EXISTS teacher_type;
   ```

3. **Option C: Generate a new Drizzle migration**
   - Temporarily remove `teacherType` from `lib/db/schema.ts`
   - Run: `pnpm db:generate`
   - Review and apply: `pnpm db:migrate`

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

1. **Restore data from teacher_type:**
   ```sql
   UPDATE users 
   SET teacher_type = CASE 
     WHEN color_preference = 'subject' THEN 'primary'
     WHEN color_preference = 'class' THEN 'secondary'
     ELSE 'primary'
   END
   WHERE teacher_type IS NULL;
   ```

2. **Remove new columns:**
   ```sql
   ALTER TABLE users 
   DROP COLUMN IF EXISTS teaching_phase,
   DROP COLUMN IF EXISTS color_preference;
   ```

## Data Mapping

| Old teacherType | New teachingPhase | New colorPreference |
|----------------|-------------------|---------------------|
| `primary`      | `primary`         | `subject`           |
| `mixed`        | `primary`         | `subject`           |
| `secondary`    | `secondary`      | `class`             |

## Troubleshooting

### Error: "column teacher_type does not exist"
- This means the column was already removed
- The migration script will still work (it checks for column existence)
- You can skip the data migration step

### Error: "column teaching_phase already exists"
- The columns were already added
- The script uses `IF NOT EXISTS` so it's safe to run again
- Just proceed to data migration

### Users showing incorrect values
- Check the migration script output for any errors
- Verify the mapping logic matches your data
- You can manually update specific users:
  ```sql
  UPDATE users 
  SET teaching_phase = 'primary', color_preference = 'subject' 
  WHERE id = <user_id>;
  ```

## Questions?

If you encounter any issues, check:
1. Database connection (`POSTGRES_URL` environment variable)
2. Migration script logs for specific errors
3. Database permissions (you need ALTER TABLE permissions)

