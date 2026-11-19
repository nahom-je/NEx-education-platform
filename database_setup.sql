-- ==============================================================================
-- NEx Monetization & Payment System Database Migration
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ksbwfmejdpffpbuxtenc/sql/new
-- ==============================================================================

-- 1. Extend the users table with phone auth and safety fields
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rejection_count_24h INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rejection_at TIMESTAMPTZ;

-- 2. Settings table for dynamic price and banking info
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial settings
INSERT INTO public.settings (key, value, description)
VALUES 
  ('course_price', '70', 'Price per course in ETB'),
  ('cbe_account_number', '1000591061155', 'Commercial Bank of Ethiopia account number'),
  ('cbe_account_name', 'NAHOM JEMBERU', 'Commercial Bank of Ethiopia account holder name'),
  ('telebirr_number', '0964549757', 'Telebirr account phone number'),
  ('telebirr_name', 'NAHOM JEMBERU', 'Telebirr account holder name'),
  ('telegram_admin_handle', 'nahomJT', 'Telegram admin handle for payment verification'),
  ('telegram_admin_id', '7308473615', 'Telegram admin user ID')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- 3. Payment requests table (student drafts, claimed payments, review states)
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_code TEXT UNIQUE NOT NULL,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  course_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  amount INT NOT NULL DEFAULT 50,
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  telegram_confirmed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  reject_reason TEXT,
  reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for speedy queries by student and status
CREATE INDEX IF NOT EXISTS idx_payment_requests_student_id ON public.payment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_payment_code ON public.payment_requests(payment_code);

-- 4. Course access table (student course unlock records)
CREATE TABLE IF NOT EXISTS public.course_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unlocked',
  payment_request_id UUID REFERENCES public.payment_requests(id) ON DELETE SET NULL,
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_access_student ON public.course_access(student_id);
CREATE INDEX IF NOT EXISTS idx_course_access_course ON public.course_access(course_id);

-- 5. Audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Content view log table (for watermarking and access monitoring)
CREATE TABLE IF NOT EXISTS public.view_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  resource_id UUID REFERENCES public.resources(id),
  course_id UUID REFERENCES public.courses(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Disable Row Level Security (RLS) or add permissive policies for service role
-- Since the Node.js backend uses SUPABASE_SERVICE_ROLE_KEY to interact with these tables:
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_log DISABLE ROW LEVEL SECURITY;

