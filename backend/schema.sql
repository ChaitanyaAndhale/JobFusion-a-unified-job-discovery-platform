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

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- Empty for Google Auth
  phone TEXT,
  title TEXT DEFAULT 'Job Seeker',
  location TEXT,
  skills TEXT[] DEFAULT '{}',
  resume_text TEXT,
  resume_file_name TEXT,
  resume_uploaded BOOLEAN DEFAULT false,
  experience_level TEXT,
  preferred_location TEXT,
  avatar TEXT,
  github TEXT,
  linkedin TEXT,
  portfolio TEXT,
  notification_prefs JSONB DEFAULT '{"email": true, "sms": false, "frequency": "daily", "minMatchScore": 50}'::jsonb,
  saved_jobs_count INTEGER DEFAULT 0,
  applied_jobs_count INTEGER DEFAULT 0,
  joined_date DATE DEFAULT CURRENT_DATE,
  profile_completion INTEGER DEFAULT 25,
  resume_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applied Jobs Table
CREATE TABLE applied_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  source TEXT,
  apply_url TEXT,
  status TEXT DEFAULT 'applied',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Log Table
CREATE TABLE notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email' or 'sms'
  job_ids TEXT[] DEFAULT '{}',
  match_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for new tables
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_applied_jobs_user_id ON applied_jobs(user_id);
CREATE INDEX idx_notif_log_user_id ON notifications_log(user_id);
CREATE INDEX idx_notif_log_sent_at ON notifications_log(sent_at);
