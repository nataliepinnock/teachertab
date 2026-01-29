-- Migration: Add teaching_phase and color_preference columns
-- This migration adds the new columns while keeping teacher_type for data migration

-- Add new columns with defaults
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS teaching_phase VARCHAR(20) NOT NULL DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS color_preference VARCHAR(10) NOT NULL DEFAULT 'subject';

-- Note: Data migration will be handled by migrate-teacher-type.ts script
-- After data migration is complete, teacher_type column can be removed in a future migration

