export type UserRole = 'client' | 'moderator' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string;
  created_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  display_name: string;
  business_name: string;
  phone: string;
  city: string;
  bio: string;
  website: string;
  is_verified: boolean;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  duration_days: number;
  weight: number;
  is_featured: boolean;
  homepage_visibility: 'none' | 'category' | 'homepage';
  refresh_rule: 'none' | 'manual' | 'auto';
  price: number;
  description: string;
  max_ads: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  province: string;
  is_active: boolean;
}

export type AdStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'payment_pending'
  | 'payment_submitted'
  | 'payment_verified'
  | 'scheduled'
  | 'published'
  | 'expired'
  | 'rejected'
  | 'archived';

export interface Ad {
  id: string;
  user_id: string;
  package_id?: string;
  category_id?: string;
  city_id?: string;
  title: string;
  slug?: string;
  description: string;
  price?: number;
  price_label?: string;
  contact_phone?: string;
  contact_email?: string;
  status: AdStatus;
  is_featured: boolean;
  admin_boost: number;
  rejection_reason?: string;
  moderation_notes?: string;
  publish_at?: string;
  expire_at?: string;
  views_count: number;
  rank_score: number;
  created_at: string;
  updated_at: string;
  packages?: Package;
  categories?: Category;
  cities?: City;
  users?: User;
  ad_media?: AdMedia[];
  seller_profiles?: SellerProfile;
}

export interface AdMedia {
  id: string;
  ad_id: string;
  source_type: 'image' | 'youtube' | 'cloudinary';
  original_url: string;
  thumbnail_url: string;
  validation_status: 'pending' | 'valid' | 'invalid' | 'placeholder';
  is_primary: boolean;
  sort_order: number;
}

export interface Payment {
  id: string;
  ad_id: string;
  user_id: string;
  amount: number;
  method: string;
  transaction_ref: string;
  sender_name: string;
  screenshot_url: string;
  notes: string;
  status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
  ads?: Ad;
  users?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action_type: string;
  target_type: string;
  target_id?: string;
  old_value?: Record<string, unknown>;
  new_value?: Record<string, unknown>;
  created_at: string;
  users?: User;
}

export interface AdStatusHistory {
  id: string;
  ad_id: string;
  previous_status: string;
  new_status: string;
  changed_by?: string;
  note: string;
  changed_at: string;
  users?: User;
}

export interface LearningQuestion {
  id: string;
  question: string;
  answer: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_active: boolean;
}

export interface SystemHealthLog {
  id: string;
  source: string;
  response_ms: number;
  status: 'ok' | 'warning' | 'error';
  message: string;
  checked_at: string;
}

export interface AnalyticsSummary {
  total_ads: number;
  active_ads: number;
  pending_review: number;
  expired_ads: number;
  total_revenue: number;
  pending_payments: number;
  approval_rate: number;
  rejection_rate: number;
  flagged_ads: number;
}
