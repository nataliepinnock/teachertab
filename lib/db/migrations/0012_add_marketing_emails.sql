-- Add marketing_emails column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "marketing_emails" integer NOT NULL DEFAULT 1;

