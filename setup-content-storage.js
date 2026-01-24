#!/usr/bin/env node

/**
 * Setup script to create the content table and storage bucket for file uploads
 * 
 * This script should be run once to set up the database schema for the upload functionality.
 * 
 * Usage:
 * 1. Make sure you have the correct Supabase credentials in your .env.local
 * 2. Run: node setup-content-storage.js
 * 
 * Alternative: Copy the SQL commands from this script and run them in Supabase SQL Editor
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Required environment variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('⚠️  This script requires service role key for full setup.');
console.log('Instead, please run the following SQL in your Supabase SQL Editor:');
console.log('\n--- SQL TO RUN IN SUPABASE SQL EDITOR ---\n');

const sql = `-- Create content table for file uploads
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  title_hi VARCHAR(200),
  description TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('pdf', 'image', 'video', 'audio', 'document')),
  category VARCHAR(50) DEFAULT 'study_material' CHECK (category IN ('study_material', 'current_affairs', 'question_bank', 'notes', 'reference')),
  language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('hi', 'en', 'both')),
  is_free BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  download_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add subject column to questions table to match application expectations
ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject VARCHAR(100);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_is_free ON content(is_free);
CREATE INDEX IF NOT EXISTS idx_content_topic ON content(topic_id);
CREATE INDEX IF NOT EXISTS idx_content_subject ON content(subject_id);
CREATE INDEX IF NOT EXISTS idx_content_course ON content(course_id);
CREATE INDEX IF NOT EXISTS idx_content_created ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);

-- Add updated_at trigger (if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE TRIGGER content_updated_at
      BEFORE UPDATE ON content
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Content is viewable by everyone" ON content;
DROP POLICY IF EXISTS "Admin can insert content" ON content;
DROP POLICY IF EXISTS "Admin can update content" ON content;
DROP POLICY IF EXISTS "Admin can delete content" ON content;

CREATE POLICY "Content is viewable by everyone" ON content FOR SELECT USING (true);
CREATE POLICY "Admin can insert content" ON content FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update content" ON content FOR UPDATE USING (true);
CREATE POLICY "Admin can delete content" ON content FOR DELETE USING (true);`;

console.log(sql);

console.log('\n--- END SQL ---\n');
console.log('After running the SQL, create a storage bucket:');
console.log('1. Go to Supabase Dashboard → Storage');
console.log('2. Create a new bucket named "content"');
console.log('3. Set it as public');
console.log('4. Configure allowed file types: PDF, images, documents');
console.log('5. Set max file size to 50MB');

console.log('\n🎉 Once completed, your upload functionality should work!');