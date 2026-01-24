-- Migration to create content table for file uploads
-- This table will store metadata for all uploaded content (PDFs, images, documents)

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_is_free ON content(is_free);
CREATE INDEX IF NOT EXISTS idx_content_topic ON content(topic_id);
CREATE INDEX IF NOT EXISTS idx_content_subject ON content(subject_id);
CREATE INDEX IF NOT EXISTS idx_content_course ON content(course_id);
CREATE INDEX IF NOT EXISTS idx_content_created ON content(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Content is viewable by everyone" ON content
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert content" ON content
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update content" ON content
  FOR UPDATE USING (true);

CREATE POLICY "Admin can delete content" ON content
  FOR DELETE USING (true);

-- Create storage bucket for content if it doesn't exist
-- Note: This needs to be run separately in Supabase dashboard or via client
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('content', 'content', true)
-- ON CONFLICT (id) DO NOTHING;