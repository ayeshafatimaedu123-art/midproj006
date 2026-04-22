
/*
  # Seed Initial Data for AdFlow Pro

  ## What this migration does
  - Inserts 3 packages: Basic, Standard, Premium
  - Inserts 12 categories for diverse ad listings
  - Inserts 15 cities across Pakistan
  - Inserts 10 learning questions for the widget
*/

-- ==================== PACKAGES ====================
INSERT INTO packages (name, slug, duration_days, weight, is_featured, homepage_visibility, refresh_rule, price, description, max_ads)
VALUES
  ('Basic', 'basic', 7, 1, false, 'none', 'none', 999, 'Entry-level listing for 7 days. Perfect for quick sales. No homepage visibility.', 3),
  ('Standard', 'standard', 15, 2, false, 'category', 'manual', 2499, 'Popular choice with 15-day listing and category page priority. Manual refresh available.', 5),
  ('Premium', 'premium', 30, 3, true, 'homepage', 'auto', 4999, 'Best visibility with 30-day listing, homepage featured placement, and automatic refresh every 3 days.', 10)
ON CONFLICT (slug) DO NOTHING;

-- ==================== CATEGORIES ====================
INSERT INTO categories (name, slug, icon, description, sort_order)
VALUES
  ('Electronics', 'electronics', 'monitor', 'Phones, laptops, gadgets, and electronic devices', 1),
  ('Vehicles', 'vehicles', 'car', 'Cars, bikes, trucks, and auto parts', 2),
  ('Real Estate', 'real-estate', 'home', 'Houses, apartments, plots, and commercial property', 3),
  ('Jobs', 'jobs', 'briefcase', 'Job postings, internships, and freelance work', 4),
  ('Fashion', 'fashion', 'shopping-bag', 'Clothing, shoes, accessories, and jewelry', 5),
  ('Furniture', 'furniture', 'armchair', 'Home and office furniture', 6),
  ('Services', 'services', 'tool', 'Professional services, repairs, and home services', 7),
  ('Education', 'education', 'book-open', 'Tutoring, courses, and educational materials', 8),
  ('Sports', 'sports', 'activity', 'Sports equipment, fitness gear, and outdoor activities', 9),
  ('Food & Kitchen', 'food-kitchen', 'coffee', 'Kitchen appliances, utensils, and food products', 10),
  ('Pets', 'pets', 'heart', 'Pets, pet food, accessories, and vet services', 11),
  ('Other', 'other', 'package', 'Everything else that does not fit other categories', 12)
ON CONFLICT (slug) DO NOTHING;

-- ==================== CITIES ====================
INSERT INTO cities (name, slug, province, sort_order)
VALUES
  ('Karachi', 'karachi', 'Sindh', 1),
  ('Lahore', 'lahore', 'Punjab', 2),
  ('Islamabad', 'islamabad', 'Federal', 3),
  ('Rawalpindi', 'rawalpindi', 'Punjab', 4),
  ('Faisalabad', 'faisalabad', 'Punjab', 5),
  ('Multan', 'multan', 'Punjab', 6),
  ('Peshawar', 'peshawar', 'KPK', 7),
  ('Quetta', 'quetta', 'Balochistan', 8),
  ('Hyderabad', 'hyderabad', 'Sindh', 9),
  ('Sialkot', 'sialkot', 'Punjab', 10),
  ('Gujranwala', 'gujranwala', 'Punjab', 11),
  ('Abbottabad', 'abbottabad', 'KPK', 12),
  ('Sukkur', 'sukkur', 'Sindh', 13),
  ('Bahawalpur', 'bahawalpur', 'Punjab', 14),
  ('Sargodha', 'sargodha', 'Punjab', 15)
ON CONFLICT (slug) DO NOTHING;

-- ==================== LEARNING QUESTIONS ====================
INSERT INTO learning_questions (question, answer, topic, difficulty)
VALUES
  ('What is the purpose of Row Level Security (RLS) in Supabase?', 'RLS restricts which rows a user can read or write based on policies. It ensures data isolation so users can only access their own data unless policies explicitly grant broader access.', 'Database Security', 'easy'),
  ('What is the difference between maybeSingle() and single() in Supabase?', 'single() throws an error if no row is found, while maybeSingle() returns null without error. Use maybeSingle() when you expect 0 or 1 results.', 'Supabase Query', 'easy'),
  ('Explain the AdFlow Pro ad lifecycle stages.', 'An ad goes through: Draft → Submitted → Under Review → Payment Pending → Payment Submitted → Payment Verified → Scheduled → Published → Expired. Only Published ads are visible publicly.', 'Workflow', 'medium'),
  ('How does the ranking formula work in AdFlow Pro?', 'rankScore = (featured ? 50 : 0) + (packageWeight * 10) + freshnessPoints + adminBoost + verifiedSellerPoints. Featured and premium ads get higher scores and appear first.', 'Business Logic', 'medium'),
  ('What is RBAC and how is it implemented in this project?', 'Role-Based Access Control (RBAC) assigns permissions based on roles (client, moderator, admin, super_admin). Each role has specific allowed actions enforced via middleware and database RLS policies.', 'Security', 'medium'),
  ('Why are media files stored as URLs instead of being uploaded directly?', 'URL-based storage avoids file storage costs and complexity. The platform normalizes URLs (e.g., extracting YouTube thumbnail), validates domains, and uses placeholders for broken links.', 'Architecture', 'easy'),
  ('What are scheduled cron jobs responsible for in AdFlow Pro?', 'Cron jobs handle: publishing scheduled ads when publish_at is reached, expiring ads when expire_at passes, sending 48-hour expiry notifications, and logging DB heartbeat for monitoring.', 'Automation', 'hard'),
  ('How do audit logs support traceability in the system?', 'audit_logs records every state change with actor_id, action_type, target, old_value, and new_value. Combined with ad_status_history, it enables complete reconstruction of any ad journey for debugging.', 'Traceability', 'hard'),
  ('What prevents duplicate payment submissions in AdFlow Pro?', 'transaction_ref uniqueness checks on the payments table flag or block duplicate refs. Business rules require payment verification before publishing, and admin review catches suspicious patterns.', 'Validation', 'hard'),
  ('Explain the External Media Normalization process.', 'The system detects if a URL is YouTube (extracts video ID → generates thumbnail), validates image URLs for protocol and extension, and stores source_type, original_url, thumbnail_url, and validation_status in ad_media.', 'Media Handling', 'medium')
ON CONFLICT DO NOTHING;
