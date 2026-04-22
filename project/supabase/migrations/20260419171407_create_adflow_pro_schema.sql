
/*
  # AdFlow Pro - Complete Database Schema

  ## Overview
  Full schema for AdFlow Pro sponsored listing marketplace with moderation workflow.

  ## Tables Created
  1. users - Extended user profiles with roles (client, moderator, admin, super_admin)
  2. seller_profiles - Public seller metadata
  3. packages - Ad package definitions (Basic, Standard, Premium)
  4. categories - Ad listing categories
  5. cities - Location taxonomy
  6. ads - Main listing records with full lifecycle
  7. ad_media - External media URL normalization
  8. payments - Payment proof records
  9. notifications - In-app notification system
  10. audit_logs - Full traceability log
  11. ad_status_history - Workflow state change tracking
  12. learning_questions - Demo/keep-alive content
  13. system_health_logs - DB and cron monitoring

  ## Security
  - RLS enabled on all tables
  - Role-based policies for each table
  - Public read only for approved/published ads
*/

-- ==================== USERS ====================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'moderator', 'admin', 'super_admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin', 'moderator'))
  );

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin'))
  );

-- ==================== SELLER PROFILES ====================
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  business_name text DEFAULT '',
  phone text DEFAULT '',
  city text DEFAULT '',
  bio text DEFAULT '',
  website text DEFAULT '',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seller profiles"
  ON seller_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view seller profiles"
  ON seller_profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON seller_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
  ON seller_profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')));

-- ==================== PACKAGES ====================
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  duration_days integer NOT NULL DEFAULT 7,
  weight integer NOT NULL DEFAULT 1,
  is_featured boolean DEFAULT false,
  homepage_visibility text DEFAULT 'none' CHECK (homepage_visibility IN ('none', 'category', 'homepage')),
  refresh_rule text DEFAULT 'none' CHECK (refresh_rule IN ('none', 'manual', 'auto')),
  price numeric(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  max_ads integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON packages FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can view active packages"
  ON packages FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admins can manage packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'));

CREATE POLICY "Super admins can update packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'));

-- ==================== CATEGORIES ====================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT 'tag',
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')));

CREATE POLICY "Super admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')));

-- ==================== CITIES ====================
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  province text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cities"
  ON cities FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can view cities"
  ON cities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')));

-- ==================== ADS ====================
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id uuid REFERENCES packages(id),
  category_id uuid REFERENCES categories(id),
  city_id uuid REFERENCES cities(id),
  title text NOT NULL DEFAULT '',
  slug text UNIQUE,
  description text DEFAULT '',
  price numeric(10,2),
  price_label text DEFAULT '',
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'payment_pending', 'payment_submitted', 'payment_verified', 'scheduled', 'published', 'expired', 'rejected', 'archived')),
  is_featured boolean DEFAULT false,
  admin_boost integer DEFAULT 0,
  rejection_reason text DEFAULT '',
  moderation_notes text DEFAULT '',
  publish_at timestamptz,
  expire_at timestamptz,
  views_count integer DEFAULT 0,
  rank_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published ads"
  ON ads FOR SELECT
  TO anon
  USING (status = 'published' AND (expire_at IS NULL OR expire_at > now()));

CREATE POLICY "Authenticated can view published ads"
  ON ads FOR SELECT
  TO authenticated
  USING (
    (status = 'published' AND (expire_at IS NULL OR expire_at > now()))
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('moderator', 'admin', 'super_admin'))
  );

CREATE POLICY "Clients can insert own ads"
  ON ads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clients can update own draft ads"
  ON ads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('moderator', 'admin', 'super_admin')))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('moderator', 'admin', 'super_admin')));

-- ==================== AD MEDIA ====================
CREATE TABLE IF NOT EXISTS ad_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  source_type text NOT NULL DEFAULT 'image' CHECK (source_type IN ('image', 'youtube', 'cloudinary')),
  original_url text NOT NULL DEFAULT '',
  thumbnail_url text DEFAULT '',
  validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'placeholder')),
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ad_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view media for published ads"
  ON ad_media FOR SELECT
  TO anon
  USING (
    EXISTS (SELECT 1 FROM ads a WHERE a.id = ad_id AND a.status = 'published')
  );

CREATE POLICY "Authenticated can view ad media"
  ON ad_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ads a WHERE a.id = ad_id AND (
        a.status = 'published' OR a.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('moderator', 'admin', 'super_admin'))
      )
    )
  );

CREATE POLICY "Users can insert media for own ads"
  ON ad_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM ads a WHERE a.id = ad_id AND a.user_id = auth.uid())
  );

CREATE POLICY "Users can update own ad media"
  ON ad_media FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM ads a WHERE a.id = ad_id AND a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM ads a WHERE a.id = ad_id AND a.user_id = auth.uid()));

CREATE POLICY "Users can delete own ad media"
  ON ad_media FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM ads a WHERE a.id = ad_id AND a.user_id = auth.uid()));

-- ==================== PAYMENTS ====================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  method text DEFAULT 'bank_transfer' CHECK (method IN ('bank_transfer', 'easypaisa', 'jazzcash', 'stripe', 'other')),
  transaction_ref text DEFAULT '',
  sender_name text DEFAULT '',
  screenshot_url text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by uuid REFERENCES users(id),
  verified_at timestamptz,
  rejection_reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')));

-- ==================== NOTIFICATIONS ====================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  link text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==================== AUDIT LOGS ====================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action_type text NOT NULL DEFAULT '',
  target_type text DEFAULT '',
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==================== AD STATUS HISTORY ====================
CREATE TABLE IF NOT EXISTS ad_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  previous_status text DEFAULT '',
  new_status text NOT NULL DEFAULT '',
  changed_by uuid REFERENCES users(id),
  note text DEFAULT '',
  changed_at timestamptz DEFAULT now()
);

ALTER TABLE ad_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad history"
  ON ad_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM ads a WHERE a.id = ad_id AND a.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('moderator', 'admin', 'super_admin'))
  );

CREATE POLICY "Authenticated can insert status history"
  ON ad_status_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==================== LEARNING QUESTIONS ====================
CREATE TABLE IF NOT EXISTS learning_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  topic text DEFAULT '',
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions"
  ON learning_questions FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Authenticated can view active questions"
  ON learning_questions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Super admins can manage questions"
  ON learning_questions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'super_admin'));

-- ==================== SYSTEM HEALTH LOGS ====================
CREATE TABLE IF NOT EXISTS system_health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT '',
  response_ms integer DEFAULT 0,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'error')),
  message text DEFAULT '',
  checked_at timestamptz DEFAULT now()
);

ALTER TABLE system_health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view health logs"
  ON system_health_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin')));

CREATE POLICY "System can insert health logs"
  ON system_health_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon can insert health logs"
  ON system_health_logs FOR INSERT
  TO anon
  WITH CHECK (true);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_category_id ON ads(category_id);
CREATE INDEX IF NOT EXISTS idx_ads_city_id ON ads(city_id);
CREATE INDEX IF NOT EXISTS idx_ads_rank_score ON ads(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_ads_publish_at ON ads(publish_at);
CREATE INDEX IF NOT EXISTS idx_ads_expire_at ON ads(expire_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_payments_ad_id ON payments(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_status_history_ad_id ON ad_status_history(ad_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
