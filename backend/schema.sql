-- Run this SQL in your Supabase SQL Editor to create the jobs table

CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT,
  salary_text TEXT,
  experience TEXT,
  type TEXT,
  mode TEXT,
  source TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  description TEXT,
  source_url TEXT,
  apply_url TEXT,
  category TEXT,
  posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create some indexes for faster searching and filtering
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_mode ON jobs(mode);
CREATE INDEX idx_jobs_experience ON jobs(experience);
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date DESC);
