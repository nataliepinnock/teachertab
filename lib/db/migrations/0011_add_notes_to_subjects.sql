-- Migration: Add notes column to subjects table
ALTER TABLE subjects 
ADD COLUMN IF NOT EXISTS notes TEXT;

