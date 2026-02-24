-- Add FCM token column to users table for push notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Create an index on fcm_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_fcm_token ON users(fcm_token);
