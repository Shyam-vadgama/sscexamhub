-- Migration: Create Study Templates Table
-- Purpose: Store study plan templates for the Planner feature
-- Date: 2026-01-28

-- 1. Create table
CREATE TABLE IF NOT EXISTS study_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tasks JSONB DEFAULT '[]'::jsonb, -- Array of {title, subject, description}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create updated_at trigger
DROP TRIGGER IF EXISTS update_study_templates_updated_at ON study_templates;
CREATE TRIGGER update_study_templates_updated_at
    BEFORE UPDATE ON study_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Enable RLS
ALTER TABLE study_templates ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Public read access (so app users can fetch them)
DROP POLICY IF EXISTS "Public read access for study_templates" ON study_templates;
CREATE POLICY "Public read access for study_templates"
ON study_templates FOR SELECT
TO public
USING (true);

-- Admin full access
DROP POLICY IF EXISTS "Admins can manage study_templates" ON study_templates;
CREATE POLICY "Admins can manage study_templates"
ON study_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.plan = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.plan = 'admin'
  )
);

-- 5. Reload schema cache
NOTIFY pgrst, 'reload schema';
