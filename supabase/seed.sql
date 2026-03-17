-- ============================================================
-- SEED DATA — Your Wine Book MVP
-- ============================================================
-- Uses deterministic UUIDs for referential integrity.
-- Compatible with `supabase db reset` (auto-runs after migrations).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ADMIN PROFILE (via auth.users + profiles)
-- ────────────────────────────────────────────────────────────

-- Create admin auth user (set all string columns to '' to avoid NULL scan errors)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone, phone_change, phone_change_token, is_sso_user, is_anonymous)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@yourwinebook.com',
  crypt('admin123', gen_salt('bf')),
  now(), 'authenticated', 'authenticated', now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Admin"}',
  '', '', '', '', '', '', NULL, '', '', false, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@yourwinebook.com"}',
  'email',
  'a0000000-0000-0000-0000-000000000001',
  now(), now()
) ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, email, role, status)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Admin', 'admin@yourwinebook.com', 'admin', 'active')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. REGIONS
-- ────────────────────────────────────────────────────────────

INSERT INTO regions (slug, name_zh, name_en, country_zh, country_en) VALUES
  ('bordeaux', '波爾多', 'Bordeaux', '法國', 'France'),
  ('burgundy', '勃艮第', 'Burgundy', '法國', 'France'),
  ('champagne', '香檳', 'Champagne', '法國', 'France'),
  ('provence', '普羅旺斯', 'Provence', '法國', 'France'),
  ('rhone-valley', '隆河谷', 'Rhône Valley', '法國', 'France'),
  ('tuscany', '托斯卡納', 'Tuscany', '意大利', 'Italy'),
  ('veneto', '威尼托', 'Veneto', '意大利', 'Italy'),
  ('piedmont', '皮埃蒙特', 'Piedmont', '意大利', 'Italy'),
  ('rioja', '里奧哈', 'Rioja', '西班牙', 'Spain'),
  ('marlborough', '馬爾堡', 'Marlborough', '紐西蘭', 'New Zealand'),
  ('barossa-valley', '巴羅莎谷', 'Barossa Valley', '澳洲', 'Australia'),
  ('napa-valley', '納帕谷', 'Napa Valley', '美國', 'United States'),
  ('mendoza', '門多薩', 'Mendoza', '阿根廷', 'Argentina'),
  ('mosel', '摩澤爾', 'Mosel', '德國', 'Germany'),
  ('douro-valley', '杜羅河', 'Douro Valley', '葡萄牙', 'Portugal')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 3. MERCHANTS
-- ────────────────────────────────────────────────────────────

INSERT INTO merchants (id, slug, name, description_zh, description_en, details_zh, details_en, wines_listed, best_prices, rating, status) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'watsons-wine', 'Watson''s Wine',
  '深耕香港葡萄酒市場超過二十年，Watson''s Wine 擁有全港最齊全的葡萄酒庫存之一。從日常餐酒到珍藏年份，為每位愛酒人提供可靠的選擇。',
  'With over twenty years in the Hong Kong wine market, Watson''s Wine offers one of the city''s most comprehensive wine selections.',
  ARRAY['📍 全港多間門店', '🚚 次日送達', '💳 支持多種付款方式'],
  ARRAY['📍 Multiple locations', '🚚 Next-day delivery', '💳 Multiple payment options'],
  126, 23, 4.6, 'active'
),
(
  'b0000000-0000-0000-0000-000000000002',
  'wine-and-co', 'Wine & Co',
  '專注歐洲精品酒莊的進口商，主打法國、意大利小農酒。每支酒都有故事，每個年份都值得細品。',
  'A boutique importer focused on European artisan wineries — mainly French and Italian small producers.',
  ARRAY['📍 中環門店', '🚚 港島即日送', '💳 Wine Club 會員折扣'],
  ARRAY['📍 Central shop', '🚚 Same-day HK Island', '💳 Wine Club discounts'],
  89, 15, 4.7, 'active'
),
(
  'b0000000-0000-0000-0000-000000000003',
  'cellardoor', 'CellarDoor',
  '新世代線上酒舖，以年輕化選酒和親民定價著稱。網站介面清爽，下單方便，經常有限時優惠。',
  'A new-generation online wine shop known for approachable selections and fair pricing.',
  ARRAY['📍 純線上', '🚚 免費送貨滿$500', '💳 信用卡/FPS'],
  ARRAY['📍 Online only', '🚚 Free delivery over $500', '💳 Credit card / FPS'],
  74, 18, 4.4, 'active'
),
(
  'b0000000-0000-0000-0000-000000000004',
  'vinhk', 'VinHK',
  '主打自然酒和有機酒的專門店，為注重健康和風土的飲家提供獨特選擇。',
  'Specializing in natural and organic wines for health-conscious drinkers who care about terroir.',
  ARRAY['📍 西營盤門店', '🚚 預約送貨', '💳 現金/轉數快'],
  ARRAY['📍 Sai Ying Pun shop', '🚚 Scheduled delivery', '💳 Cash / FPS'],
  62, 10, 4.5, 'active'
),
(
  'b0000000-0000-0000-0000-000000000005',
  'grape-hk', 'Grape HK',
  '以批量採購壓低成本，提供極具競爭力的價格。適合想囤貨或團購的消費者。',
  'Leverages bulk purchasing for competitive pricing. Great for stocking up or group buys.',
  ARRAY['📍 觀塘倉庫自取', '🚚 購滿12支免運', '💳 銀行轉帳優惠'],
  ARRAY['📍 Kwun Tong warehouse pickup', '🚚 Free shipping 12+ bottles', '💳 Bank transfer discount'],
  95, 28, 4.3, 'inactive'
),
(
  'b0000000-0000-0000-0000-000000000006',
  'bottleshop', 'BottleShop',
  '精選世界各地得獎酒款，每月推出主題酒單。適合想嘗鮮又不想踩雷的飲家。',
  'Curated award-winning wines from around the world with monthly themed selections.',
  ARRAY['📍 銅鑼灣門店', '🚚 標準配送', '💳 多種付款'],
  ARRAY['📍 Causeway Bay shop', '🚚 Standard delivery', '💳 Multiple payment options'],
  58, 12, 4.5, 'pending'
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 4. MERCHANT STAFF USERS (auth + profiles + merchant_staff)
-- ────────────────────────────────────────────────────────────

-- Merchant staff auth users
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone, phone_change, phone_change_token, is_sso_user, is_anonymous)
VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'watsons@demo.com', crypt('demo123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'wineandco@demo.com', crypt('demo123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'cellardoor@demo.com', crypt('demo123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'vinhk@demo.com', crypt('demo123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'grape@demo.com', crypt('demo123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'bottle@demo.com', crypt('demo123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '{"sub":"c0000000-0000-0000-0000-000000000001","email":"watsons@demo.com"}', 'email', 'c0000000-0000-0000-0000-000000000001', now(), now()),
  ('c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', '{"sub":"c0000000-0000-0000-0000-000000000002","email":"wineandco@demo.com"}', 'email', 'c0000000-0000-0000-0000-000000000002', now(), now()),
  ('c0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', '{"sub":"c0000000-0000-0000-0000-000000000003","email":"cellardoor@demo.com"}', 'email', 'c0000000-0000-0000-0000-000000000003', now(), now()),
  ('c0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', '{"sub":"c0000000-0000-0000-0000-000000000004","email":"vinhk@demo.com"}', 'email', 'c0000000-0000-0000-0000-000000000004', now(), now()),
  ('c0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', '{"sub":"c0000000-0000-0000-0000-000000000005","email":"grape@demo.com"}', 'email', 'c0000000-0000-0000-0000-000000000005', now(), now()),
  ('c0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', '{"sub":"c0000000-0000-0000-0000-000000000006","email":"bottle@demo.com"}', 'email', 'c0000000-0000-0000-0000-000000000006', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, email, role, status) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Watson''s Wine', 'watsons@demo.com', 'merchant_staff', 'active'),
  ('c0000000-0000-0000-0000-000000000002', 'Wine & Co', 'wineandco@demo.com', 'merchant_staff', 'active'),
  ('c0000000-0000-0000-0000-000000000003', 'CellarDoor', 'cellardoor@demo.com', 'merchant_staff', 'active'),
  ('c0000000-0000-0000-0000-000000000004', 'VinHK', 'vinhk@demo.com', 'merchant_staff', 'active'),
  ('c0000000-0000-0000-0000-000000000005', 'Grape HK', 'grape@demo.com', 'merchant_staff', 'active'),
  ('c0000000-0000-0000-0000-000000000006', 'BottleShop', 'bottle@demo.com', 'merchant_staff', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO merchant_staff (profile_id, merchant_id, role) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'owner'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'owner'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'owner'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'owner'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'owner'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'owner')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 5. CONSUMER USERS (auth + profiles)
-- ────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone, phone_change, phone_change_token, is_sso_user, is_anonymous)
VALUES
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'david@demo.com', crypt('user123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'mary@demo.com', crypt('user123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'james@demo.com', crypt('user123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'sophie@demo.com', crypt('user123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '{"sub":"d0000000-0000-0000-0000-000000000001","email":"david@demo.com"}', 'email', 'd0000000-0000-0000-0000-000000000001', now(), now()),
  ('d0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', '{"sub":"d0000000-0000-0000-0000-000000000002","email":"mary@demo.com"}', 'email', 'd0000000-0000-0000-0000-000000000002', now(), now()),
  ('d0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', '{"sub":"d0000000-0000-0000-0000-000000000003","email":"james@demo.com"}', 'email', 'd0000000-0000-0000-0000-000000000003', now(), now()),
  ('d0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', '{"sub":"d0000000-0000-0000-0000-000000000004","email":"sophie@demo.com"}', 'email', 'd0000000-0000-0000-0000-000000000004', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, email, role, status) VALUES
  ('d0000000-0000-0000-0000-000000000001', '陳大文', 'david@demo.com', 'user', 'active'),
  ('d0000000-0000-0000-0000-000000000002', '李美玲', 'mary@demo.com', 'user', 'active'),
  ('d0000000-0000-0000-0000-000000000003', 'James Wong', 'james@demo.com', 'user', 'active'),
  ('d0000000-0000-0000-0000-000000000004', 'Sophie Lam', 'sophie@demo.com', 'user', 'active')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 6. MERCHANT LOCATIONS (stores with real HK coordinates)
-- ────────────────────────────────────────────────────────────

INSERT INTO merchant_locations (id, merchant_id, name, address_zh, address_en, district_zh, district_en, phone, location, hours, is_active) VALUES
-- Watson's Wine: multiple locations
(
  'e0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Watson''s Wine 中環店',
  '中環皇后大道中 15 號',
  '15 Queen''s Road Central',
  '中環', 'Central',
  '+852 2523 1234',
  ST_SetSRID(ST_MakePoint(114.1588, 22.2812), 4326)::geography,
  '{"mon":{"open":"10:00","close":"21:00"},"tue":{"open":"10:00","close":"21:00"},"wed":{"open":"10:00","close":"21:00"},"thu":{"open":"10:00","close":"21:00"},"fri":{"open":"10:00","close":"22:00"},"sat":{"open":"10:00","close":"22:00"},"sun":{"open":"11:00","close":"20:00"}}',
  true
),
(
  'e0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'Watson''s Wine 尖沙咀店',
  '尖沙咀廣東道 33 號',
  '33 Canton Road, TST',
  '尖沙咀', 'Tsim Sha Tsui',
  '+852 2368 5678',
  ST_SetSRID(ST_MakePoint(114.1694, 22.2988), 4326)::geography,
  '{"mon":{"open":"10:00","close":"21:00"},"tue":{"open":"10:00","close":"21:00"},"wed":{"open":"10:00","close":"21:00"},"thu":{"open":"10:00","close":"21:00"},"fri":{"open":"10:00","close":"22:00"},"sat":{"open":"10:00","close":"22:00"},"sun":{"open":"11:00","close":"20:00"}}',
  true
),
(
  'e0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000001',
  'Watson''s Wine 銅鑼灣店',
  '銅鑼灣怡和街 68 號',
  '68 Yee Wo Street, Causeway Bay',
  '銅鑼灣', 'Causeway Bay',
  '+852 2890 1234',
  ST_SetSRID(ST_MakePoint(114.1849, 22.2802), 4326)::geography,
  '{"mon":{"open":"10:00","close":"21:00"},"tue":{"open":"10:00","close":"21:00"},"wed":{"open":"10:00","close":"21:00"},"thu":{"open":"10:00","close":"21:00"},"fri":{"open":"10:00","close":"22:00"},"sat":{"open":"10:00","close":"22:00"},"sun":{"open":"11:00","close":"20:00"}}',
  true
),
-- Wine & Co: Central
(
  'e0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000002',
  'Wine & Co 中環店',
  '中環荷李活道 108 號',
  '108 Hollywood Road, Central',
  '中環', 'Central',
  '+852 2544 5678',
  ST_SetSRID(ST_MakePoint(114.1508, 22.2835), 4326)::geography,
  '{"mon":{"open":"11:00","close":"20:00"},"tue":{"open":"11:00","close":"20:00"},"wed":{"open":"11:00","close":"20:00"},"thu":{"open":"11:00","close":"20:00"},"fri":{"open":"11:00","close":"21:00"},"sat":{"open":"10:00","close":"21:00"},"sun":{"open":"12:00","close":"19:00"}}',
  true
),
-- VinHK: Sai Ying Pun
(
  'e0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000004',
  'VinHK 西營盤店',
  '西營盤德輔道西 280 號',
  '280 Des Voeux Road West, Sai Ying Pun',
  '西營盤', 'Sai Ying Pun',
  '+852 2819 3456',
  ST_SetSRID(ST_MakePoint(114.1420, 22.2870), 4326)::geography,
  '{"mon":{"open":"12:00","close":"20:00"},"tue":{"open":"12:00","close":"20:00"},"wed":{"open":"12:00","close":"20:00"},"thu":{"open":"12:00","close":"20:00"},"fri":{"open":"12:00","close":"21:00"},"sat":{"open":"11:00","close":"21:00"},"sun":{"closed":true}}',
  true
),
-- Grape HK: Kwun Tong warehouse
(
  'e0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000005',
  'Grape HK 觀塘倉庫',
  '觀塘開源道 77 號',
  '77 Hoi Yuen Road, Kwun Tong',
  '觀塘', 'Kwun Tong',
  '+852 2343 7890',
  ST_SetSRID(ST_MakePoint(114.2230, 22.3120), 4326)::geography,
  '{"mon":{"open":"09:00","close":"18:00"},"tue":{"open":"09:00","close":"18:00"},"wed":{"open":"09:00","close":"18:00"},"thu":{"open":"09:00","close":"18:00"},"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"10:00","close":"16:00"},"sun":{"closed":true}}',
  true
),
-- BottleShop: Causeway Bay
(
  'e0000000-0000-0000-0000-000000000007',
  'b0000000-0000-0000-0000-000000000006',
  'BottleShop 銅鑼灣',
  '銅鑼灣渣甸坊 15 號',
  '15 Jardine''s Crescent, Causeway Bay',
  '銅鑼灣', 'Causeway Bay',
  '+852 2576 8901',
  ST_SetSRID(ST_MakePoint(114.1867, 22.2787), 4326)::geography,
  '{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"22:00"},"sat":{"open":"10:00","close":"22:00"},"sun":{"open":"12:00","close":"20:00"}}',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 7. TAGS
-- ────────────────────────────────────────────────────────────

INSERT INTO tags (id, slug, name_zh, name_en) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'easy-drinking', '易飲', 'Easy Drinking'),
  ('f0000000-0000-0000-0000-000000000002', 'full-bodied', '濃郁', 'Full-Bodied'),
  ('f0000000-0000-0000-0000-000000000003', 'fruity', '果味', 'Fruity'),
  ('f0000000-0000-0000-0000-000000000004', 'oaky', '橡木桶', 'Oaky'),
  ('f0000000-0000-0000-0000-000000000005', 'crisp', '清爽', 'Crisp'),
  ('f0000000-0000-0000-0000-000000000006', 'gift', '送禮', 'Gift'),
  ('f0000000-0000-0000-0000-000000000007', 'dinner', '晚餐', 'Dinner'),
  ('f0000000-0000-0000-0000-000000000008', 'party', '派對', 'Party'),
  ('f0000000-0000-0000-0000-000000000009', 'everyday', '日常', 'Everyday'),
  ('f0000000-0000-0000-0000-000000000010', 'explore', '嘗新', 'Explore'),
  ('f0000000-0000-0000-0000-000000000011', 'budget', '親民', 'Budget'),
  ('f0000000-0000-0000-0000-000000000012', 'premium', '精品', 'Premium'),
  ('f0000000-0000-0000-0000-000000000013', 'organic', '有機', 'Organic'),
  ('f0000000-0000-0000-0000-000000000014', 'natural', '自然酒', 'Natural Wine'),
  ('f0000000-0000-0000-0000-000000000015', 'award-winning', '得獎', 'Award Winning')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 8. SCENES
-- ────────────────────────────────────────────────────────────

INSERT INTO scenes (id, slug, title_zh, title_en, description_zh, description_en, emoji) VALUES
  ('f2000000-0000-0000-0000-000000000001', 'gift', '送禮', 'Gift Giving', '精選適合送禮的酒款，讓你的心意更有溫度。', 'Curated wines perfect for gifting — make your gesture even more thoughtful.', '🎁'),
  ('f2000000-0000-0000-0000-000000000002', 'dinner', '聚餐', 'Dinner Party', '為你的餐桌找到完美搭配，讓每頓飯都更有儀式感。', 'Find the perfect pairing for your table — elevate every meal.', '🍽️'),
  ('f2000000-0000-0000-0000-000000000003', 'everyday', '日常', 'Everyday Sipping', '性價比高的日常好酒，隨時隨地享受一杯。', 'Great value everyday wines — enjoy a glass anytime, anywhere.', '🏠'),
  ('f2000000-0000-0000-0000-000000000004', 'explore', '嘗新', 'Explore New', '跳出舒適區，發現令人驚喜的新酒款。', 'Step out of your comfort zone — discover surprising new wines.', '🧭')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 9. WINES (32) — matches apps/web/src/lib/mock-data.ts
-- ────────────────────────────────────────────────────────────

INSERT INTO wines (id, slug, name, type, region_zh, region_en, grape_variety, vintage, description_zh, description_en, tasting_notes, region_story_zh, region_story_en, min_price, merchant_count, emoji, badge, is_featured) VALUES
-- 1. Cloudy Bay Sauvignon Blanc 2023
(
  '10000000-0000-0000-0000-000000000001',
  'cloudy-bay-sauvignon-blanc-2023',
  'Cloudy Bay Sauvignon Blanc 2023',
  'white',
  '紐西蘭 · 馬爾堡羅 · 白酒',
  'New Zealand · Marlborough · White',
  'Sauvignon Blanc', 2023,
  '如果你喜歡清爽不膩的白酒，這支很難踩雷。帶點青草和柑橘香氣，配海鮮特別好。',
  'If you like crisp, refreshing whites, this one rarely disappoints. Hints of fresh grass and citrus.',
  '{"appearance_zh":"淺稻草色，帶綠色光澤","appearance_en":"Pale straw with green tints","nose_zh":"青草、百香果、柑橘皮、淡淡的燧石礦物味","nose_en":"Cut grass, passionfruit, citrus zest, flinty minerals","palate_zh":"入口清脆，酸度明亮，中等酒體，收尾乾淨清爽","palate_en":"Crisp entry, bright acidity, medium body, clean finish","food_zh":["聚餐","海鮮","沙拉","夏日午後","朋友聚會"],"food_en":["Dinner parties","Seafood","Salads","Summer afternoons"]}',
  '馬爾堡羅位於紐西蘭南島的東北端，是全球公認的長相思聖地。這裡日照充足但夜晚涼爽，葡萄可以緩慢成熟，保留住清脆的酸度和豐富的果香。Cloudy Bay 酒莊創立於 1985 年，幾乎憑一己之力讓紐西蘭長相思登上世界舞台。',
  'Marlborough sits at the northeastern tip of New Zealand''s South Island and is globally recognized as the spiritual home of Sauvignon Blanc. Long sunshine hours paired with cool nights allow grapes to ripen slowly, preserving crisp acidity and vibrant fruit character.',
  138, 6, '🍾', 'Editor''s Pick', true
),
-- 2. Moët & Chandon Brut Impérial
(
  '10000000-0000-0000-0000-000000000002',
  'moet-chandon-brut-imperial',
  'Moët & Chandon Brut Impérial',
  'sparkling',
  '法國 · 香檳區 · 氣泡酒',
  'France · Champagne · Sparkling',
  'Chardonnay / Pinot Noir / Pinot Meunier', NULL,
  '送香檳基本不會出錯。金色酒液、細膩氣泡，任何場合都撐得住場面。',
  'You can never go wrong with Champagne. Golden hues, fine bubbles — a gift in itself.',
  '{"appearance_zh":"金黃色，氣泡細膩持久","appearance_en":"Golden yellow with fine persistent bubbles","nose_zh":"白花、柑橘、烤杏仁","nose_en":"White flowers, citrus, toasted almonds","palate_zh":"優雅豐富，果味與礦物感平衡","palate_en":"Elegant and rich, balanced fruit and mineral notes","food_zh":["慶祝","開胃菜","海鮮拼盤"],"food_en":["Celebrations","Appetizers","Seafood platters"]}',
  '香檳區位於巴黎東北方約 150 公里，是法國最北的葡萄酒產區。Moët & Chandon 創立於 1743 年，是全球最知名的香檳品牌之一。',
  'The Champagne region lies about 150km northeast of Paris and is France''s northernmost wine region. Moët & Chandon, founded in 1743, is one of the world''s most iconic Champagne houses.',
  268, 8, '🥂', NULL, true
),
-- 3. Whispering Angel Rosé 2023
(
  '10000000-0000-0000-0000-000000000003',
  'whispering-angel-rose-2023',
  'Whispering Angel Rosé 2023',
  'rosé',
  '法國 · 普羅旺斯 · 粉紅酒',
  'France · Provence · Rosé',
  'Grenache / Cinsault / Rolle', 2023,
  '淡粉色的瓶身已經贏了一半。清爽的草莓和白桃香氣，冰鎮後配沙拉最棒。',
  'The pale pink bottle is half the charm. Fresh strawberry and white peach aromas — pure summer.',
  '{"appearance_zh":"淡三文魚粉色","appearance_en":"Pale salmon pink","nose_zh":"草莓、白桃、柑橘花","nose_en":"Strawberry, white peach, citrus blossom","palate_zh":"清爽圓潤，微微礦物感","palate_en":"Fresh and round with subtle minerality","food_zh":["沙拉","海鮮","戶外野餐"],"food_en":["Salads","Seafood","Outdoor picnics"]}',
  '普羅旺斯是全球粉紅酒的標杆產區，地中海氣候賦予葡萄完美的成熟度和清爽的酸度。',
  'Provence is the benchmark region for rosé worldwide. The Mediterranean climate provides perfect grape ripeness with refreshing acidity.',
  198, 5, '🍷', NULL, true
),
-- 4. Penfolds Bin 389 2021
(
  '10000000-0000-0000-0000-000000000004',
  'penfolds-bin-389-2021',
  'Penfolds Bin 389 2021',
  'red',
  '澳洲 · 南澳 · 紅酒',
  'Australia · South Australia · Red',
  'Cabernet Sauvignon / Shiraz', 2021,
  '澳洲紅酒的經典代表，果味濃郁但不失結構，配牛排最對味。',
  'A classic Australian red — rich fruit with good structure. Perfect with steak.',
  '{"appearance_zh":"深紅寶石色","appearance_en":"Deep ruby red","nose_zh":"黑醋栗、巧克力、香草","nose_en":"Blackcurrant, chocolate, vanilla","palate_zh":"飽滿濃郁，單寧成熟，餘韻悠長","palate_en":"Full and rich, ripe tannins, long finish","food_zh":["牛排","燒烤","硬質芝士"],"food_en":["Steak","BBQ","Hard cheese"]}',
  '南澳是澳洲最重要的葡萄酒產區，以溫暖乾燥的氣候著稱。Penfolds 是澳洲最受尊崇的酒莊之一。',
  'South Australia is Australia''s most important wine region, known for its warm, dry climate. Penfolds is one of Australia''s most revered wineries.',
  328, 7, '🍷', NULL, false
),
-- 5. Masi Costasera Amarone 2018
(
  '10000000-0000-0000-0000-000000000005',
  'masi-costasera-amarone-2018',
  'Masi Costasera Amarone 2018',
  'red',
  '意大利 · 威尼托 · 紅酒',
  'Italy · Veneto · Red',
  'Corvina / Rondinella / Molinara', 2018,
  '意大利經典風乾葡萄釀造，濃郁醇厚，適合冬天慢慢品嚐。',
  'Classic Italian Amarone made from dried grapes — rich and warming, perfect for winter evenings.',
  '{"appearance_zh":"深石榴紅色","appearance_en":"Deep garnet red","nose_zh":"乾果、可可、菸草、香料","nose_en":"Dried fruit, cocoa, tobacco, spices","palate_zh":"濃郁豐厚，帶甜美果味，餘韻帶杏仁苦味","palate_en":"Rich and velvety, sweet fruit flavors, almond-bitter finish","food_zh":["燉肉","野味","陳年芝士"],"food_en":["Stewed meats","Game","Aged cheese"]}',
  '威尼托位於意大利東北部，Amarone 是該產區最珍貴的酒款，使用風乾數月的葡萄釀造，風味極為濃縮。',
  'Veneto is in northeastern Italy. Amarone is the region''s most prized wine, made from grapes dried for months to concentrate their flavors.',
  388, 4, '🍾', NULL, false
),
-- 6. Santa Margherita Pinot Grigio
(
  '10000000-0000-0000-0000-000000000006',
  'santa-margherita-pinot-grigio',
  'Santa Margherita Pinot Grigio',
  'white',
  '意大利 · 特倫蒂諾 · 白酒',
  'Italy · Trentino · White',
  'Pinot Grigio', NULL,
  '清爽百搭的意大利白酒，不管配什麼菜都不會出錯。',
  'A crisp, versatile Italian white that goes with just about anything.',
  '{"appearance_zh":"淺稻草色","appearance_en":"Pale straw","nose_zh":"青蘋果、白花、礦物","nose_en":"Green apple, white flowers, minerals","palate_zh":"清脆乾爽，酸度適中","palate_en":"Crisp and dry, moderate acidity","food_zh":["意麵","沙拉","白肉"],"food_en":["Pasta","Salads","White meat"]}',
  '特倫蒂諾位於意大利北部阿爾卑斯山腳，涼爽的氣候讓白葡萄保留了清新的果味和酸度。',
  'Trentino sits at the foot of the Alps in northern Italy. The cool climate preserves fresh fruit flavors and acidity in white grapes.',
  168, 5, '🥂', NULL, false
),
-- 7. Château Mouton Rothschild 2018
(
  '10000000-0000-0000-0000-000000000007',
  'chateau-mouton-rothschild-2018',
  'Château Mouton Rothschild 2018',
  'red',
  '法國 · 波爾多 · 紅酒',
  'France · Bordeaux · Red',
  'Cabernet Sauvignon / Merlot', 2018,
  '波爾多五大名莊之一，2018 年份被譽為完美年份，收藏或品飲皆宜。',
  'One of Bordeaux''s First Growths — the 2018 vintage is considered near-perfect for cellaring or drinking.',
  '{"appearance_zh":"深紫紅色","appearance_en":"Deep purple-red","nose_zh":"黑醋栗、雪松、石墨、紫羅蘭","nose_en":"Blackcurrant, cedar, graphite, violets","palate_zh":"宏大而精細，單寧如絲般細膩","palate_en":"Grand yet refined, silky tannins","food_zh":["羊排","松露料理","陳年芝士"],"food_en":["Lamb chops","Truffle dishes","Aged cheese"]}',
  NULL, NULL,
  4800, 3, '🍷', 'Collector', false
),
-- 8. Opus One 2019
(
  '10000000-0000-0000-0000-000000000008',
  'opus-one-2019',
  'Opus One 2019',
  'red',
  '美國 · 納帕谷 · 紅酒',
  'USA · Napa Valley · Red',
  'Cabernet Sauvignon / Merlot / Cab Franc', 2019,
  '納帕谷殿堂級名莊，法美合作的結晶，優雅而不失力量。',
  'A legendary Napa Valley estate — the Franco-American collaboration that redefined California wine.',
  '{"appearance_zh":"深寶石紅","appearance_en":"Deep ruby","nose_zh":"黑莓、紫羅蘭、可可、月桂","nose_en":"Blackberry, violet, cocoa, bay laurel","palate_zh":"絲滑豐滿，層次複雜","palate_en":"Silky and full, complex layers","food_zh":["牛排","燉牛尾","黑松露"],"food_en":["Steak","Braised oxtail","Black truffle"]}',
  NULL, NULL,
  3200, 4, '🍷', 'Premium', false
),
-- 9. Louis Roederer Cristal 2015
(
  '10000000-0000-0000-0000-000000000009',
  'louis-roederer-cristal-2015',
  'Louis Roederer Cristal 2015',
  'sparkling',
  '法國 · 香檳區 · 氣泡酒',
  'France · Champagne · Sparkling',
  'Pinot Noir / Chardonnay', 2015,
  '頂級年份香檳代表，為沙皇而生。極致細膩的氣泡和深邃的風味。',
  'The pinnacle of prestige Champagne, originally created for the Tsar. Exquisite bubbles and profound depth.',
  '{"appearance_zh":"閃耀金黃色","appearance_en":"Brilliant gold","nose_zh":"榛子、柑橘蜜、白花、粉筆","nose_en":"Hazelnut, citrus honey, white flowers, chalk","palate_zh":"極其精緻，奶油般質地，無盡餘韻","palate_en":"Extremely refined, creamy texture, endless finish","food_zh":["魚子醬","龍蝦","精緻法餐"],"food_en":["Caviar","Lobster","Fine French cuisine"]}',
  NULL, NULL,
  2800, 3, '🥂', 'Luxury', false
),
-- 10. Veuve Clicquot Yellow Label
(
  '10000000-0000-0000-0000-000000000010',
  'veuve-clicquot-yellow-label',
  'Veuve Clicquot Yellow Label',
  'sparkling',
  '法國 · 香檳區 · 氣泡酒',
  'France · Champagne · Sparkling',
  'Pinot Noir / Chardonnay / Pinot Meunier', NULL,
  '黃牌香檳辨識度超高，果味豐富，慶祝場合的首選。',
  'The iconic yellow label — rich, fruit-forward Champagne that''s perfect for celebrations.',
  '{"appearance_zh":"金黃色","appearance_en":"Golden yellow","nose_zh":"烤面包、杏桃、香草","nose_en":"Toasted bread, apricot, vanilla","palate_zh":"豐富圓潤，氣泡活潑","palate_en":"Rich and round, lively bubbles","food_zh":["慶祝","開胃菜","壽司"],"food_en":["Celebrations","Appetizers","Sushi"]}',
  NULL, NULL,
  328, 6, '🥂', NULL, false
),
-- 11. Dom Pérignon 2013
(
  '10000000-0000-0000-0000-000000000011',
  'dom-perignon-2013',
  'Dom Pérignon 2013',
  'sparkling',
  '法國 · 香檳區 · 氣泡酒',
  'France · Champagne · Sparkling',
  'Chardonnay / Pinot Noir', 2013,
  '香檳之王，每個年份都是藝術品。2013 年清新而精確，展現極致平衡。',
  'The King of Champagne — every vintage is a work of art. The 2013 is fresh, precise, and supremely balanced.',
  '{"appearance_zh":"明亮金黃","appearance_en":"Bright golden","nose_zh":"白花、柑橘、杏仁、輕煙燻","nose_en":"White flowers, citrus, almonds, light smoke","palate_zh":"精準有力，極致平衡","palate_en":"Precise and powerful, supreme balance","food_zh":["精緻海鮮","日本料理","慶典"],"food_en":["Fine seafood","Japanese cuisine","Celebrations"]}',
  NULL, NULL,
  1880, 4, '🥂', 'Icon', false
),
-- 12. Villa Maria Sauvignon Blanc 2023
(
  '10000000-0000-0000-0000-000000000012',
  'marlborough-villa-maria-sauvignon-blanc-2023',
  'Villa Maria Sauvignon Blanc 2023',
  'white',
  '紐西蘭 · 馬爾堡羅 · 白酒',
  'New Zealand · Marlborough · White',
  'Sauvignon Blanc', 2023,
  '馬爾堡羅另一經典白酒，百香果和青椒香氣特別鮮明，CP值超高。',
  'Another Marlborough classic — vibrant passionfruit and capsicum notes with excellent value.',
  '{"appearance_zh":"淺黃綠色","appearance_en":"Pale yellow-green","nose_zh":"百香果、青椒、葡萄柚","nose_en":"Passionfruit, capsicum, grapefruit","palate_zh":"多汁清脆，酸度活潑","palate_en":"Juicy and crisp, vibrant acidity","food_zh":["海鮮","亞洲菜","沙拉"],"food_en":["Seafood","Asian cuisine","Salads"]}',
  NULL, NULL,
  98, 5, '🍾', 'Best Value', false
),
-- 13. William Fèvre Chablis 2022
(
  '10000000-0000-0000-0000-000000000013',
  'chablis-william-fevre-2022',
  'William Fèvre Chablis 2022',
  'white',
  '法國 · 勃艮第 · 白酒',
  'France · Burgundy · White',
  'Chardonnay', 2022,
  '夏布利的礦物感白酒代表，清冽如泉水，配生蠔絕配。',
  'The quintessential mineral-driven Chablis — as clear as spring water, sublime with oysters.',
  '{"appearance_zh":"淺金色","appearance_en":"Pale gold","nose_zh":"燧石、青蘋果、檸檬","nose_en":"Flint, green apple, lemon","palate_zh":"礦物感突出，酸度清冽","palate_en":"Pronounced minerality, bracing acidity","food_zh":["生蠔","白灼蝦","壽司"],"food_en":["Oysters","Poached prawns","Sushi"]}',
  NULL, NULL,
  228, 4, '🍾', NULL, false
),
-- 14. Pascal Jolivet Sancerre 2022
(
  '10000000-0000-0000-0000-000000000014',
  'sancerre-pascal-jolivet-2022',
  'Pascal Jolivet Sancerre 2022',
  'white',
  '法國 · 盧瓦爾河谷 · 白酒',
  'France · Loire Valley · White',
  'Sauvignon Blanc', 2022,
  '法國長相思的正宗風味，比紐西蘭的更含蓄，帶燧石和白花香氣。',
  'The French take on Sauvignon Blanc — more restrained than New Zealand, with flint and white flower notes.',
  '{"appearance_zh":"透亮銀黃色","appearance_en":"Bright silver-yellow","nose_zh":"白花、燧石、柑橘","nose_en":"White flowers, flint, citrus","palate_zh":"含蓄優雅，礦物感細膩","palate_en":"Restrained elegance, fine minerality","food_zh":["山羊芝士","白肉","沙拉"],"food_en":["Goat cheese","White meat","Salads"]}',
  NULL, NULL,
  248, 3, '🍾', NULL, false
),
-- 15. Dr. Loosen Riesling 2022
(
  '10000000-0000-0000-0000-000000000015',
  'riesling-dr-loosen-2022',
  'Dr. Loosen Riesling 2022',
  'white',
  '德國 · 摩澤爾 · 白酒',
  'Germany · Mosel · White',
  'Riesling', 2022,
  '德國摩澤爾的經典雷司令，微甜帶酸，像喝礦泉水一樣清新。酒精度低，適合不愛太酒味的人。',
  'Classic Mosel Riesling — off-dry with racy acidity, fresh as mineral water. Low alcohol, perfect for those who prefer lighter wines.',
  '{"appearance_zh":"淡檸檬色","appearance_en":"Pale lemon","nose_zh":"青蘋果、蜂蜜、白桃、板岩","nose_en":"Green apple, honey, white peach, slate","palate_zh":"微甜清爽，酸甜平衡完美","palate_en":"Off-dry and fresh, perfect sweet-acid balance","food_zh":["亞洲菜","辣菜","甜品"],"food_en":["Asian food","Spicy dishes","Desserts"]}',
  NULL, NULL,
  158, 5, '🍾', NULL, false
),
-- 16. Trimbach Gewürztraminer 2020
(
  '10000000-0000-0000-0000-000000000016',
  'gewurztraminer-trimbach-2020',
  'Trimbach Gewürztraminer 2020',
  'white',
  '法國 · 阿爾薩斯 · 白酒',
  'France · Alsace · White',
  'Gewürztraminer', 2020,
  '阿爾薩斯的招牌品種，荔枝和玫瑰花瓣香氣撲鼻，配中菜特別好。',
  'Alsace''s signature grape — intoxicating lychee and rose petal aromas. Superb with Chinese cuisine.',
  '{"appearance_zh":"深金黃色","appearance_en":"Deep golden","nose_zh":"荔枝、玫瑰、生薑、蜂蜜","nose_en":"Lychee, rose, ginger, honey","palate_zh":"芳香豐富，微甜圓潤","palate_en":"Aromatic and rich, off-dry and round","food_zh":["中菜","咖喱","泰國菜","鵝肝"],"food_en":["Chinese food","Curry","Thai food","Foie gras"]}',
  NULL, NULL,
  218, 3, '🍾', NULL, false
),
-- 17. Château Dereszla Tokaji 5 Puttonyos 2017
(
  '10000000-0000-0000-0000-000000000017',
  'chateau-dereszla-tokaji-5-puttonyos-2017',
  'Château Dereszla Tokaji 5 Puttonyos 2017',
  'dessert',
  '匈牙利 · 托卡伊 · 甜酒',
  'Hungary · Tokaj · Dessert',
  'Furmint / Hárslevelű', 2017,
  '匈牙利國寶級甜酒，蜂蜜和杏桃的極致甜蜜，配甜品或單獨品嚐都好。',
  'Hungary''s national treasure — honey and apricot sweetness, wonderful with desserts or on its own.',
  '{"appearance_zh":"深琥珀金色","appearance_en":"Deep amber gold","nose_zh":"蜂蜜、杏桃、橙皮、焦糖","nose_en":"Honey, apricot, orange peel, caramel","palate_zh":"甜美而不膩，酸度平衡","palate_en":"Sweet but not cloying, balanced acidity","food_zh":["甜品","藍紋芝士","水果塔"],"food_en":["Desserts","Blue cheese","Fruit tarts"]}',
  NULL, NULL,
  348, 3, '🍾', NULL, false
),
-- 18. Château d'Yquem 2017
(
  '10000000-0000-0000-0000-000000000018',
  'chateau-dyquem-2017',
  'Château d''Yquem 2017',
  'dessert',
  '法國 · 波爾多蘇玳 · 甜酒',
  'France · Bordeaux Sauternes · Dessert',
  'Sémillon / Sauvignon Blanc', 2017,
  '世界最頂級的貴腐甜酒，液態黃金般的存在。每一口都是奢華的享受。',
  'The world''s greatest sweet wine — liquid gold. Every sip is pure luxury.',
  '{"appearance_zh":"深金黃色","appearance_en":"Deep gold","nose_zh":"蜂蜜、杏桃、番紅花、焦糖","nose_en":"Honey, apricot, saffron, caramel","palate_zh":"極致豐富，完美平衡甜與酸","palate_en":"Supremely rich, perfect sweet-acid balance","food_zh":["鵝肝","藍紋芝士","法式甜點"],"food_en":["Foie gras","Blue cheese","French pastry"]}',
  NULL, NULL,
  3500, 2, '🍾', 'Legendary', false
),
-- 19. Tignanello 2020
(
  '10000000-0000-0000-0000-000000000019',
  'tignanello-2020',
  'Tignanello 2020',
  'red',
  '意大利 · 托斯卡納 · 紅酒',
  'Italy · Tuscany · Red',
  'Sangiovese / Cabernet Sauvignon', 2020,
  '超級托斯卡納的先驅，打破傳統的叛逆之作。強勁而優雅，意大利紅酒的巔峰之一。',
  'The pioneer of Super Tuscans — a rebel that broke traditions. Powerful yet elegant, among Italy''s finest reds.',
  '{"appearance_zh":"深紅寶石色","appearance_en":"Deep ruby","nose_zh":"黑櫻桃、香料、皮革、可可","nose_en":"Black cherry, spices, leather, cocoa","palate_zh":"強勁優雅，單寧精緻","palate_en":"Powerful yet elegant, refined tannins","food_zh":["燉肉","牛排","硬質芝士"],"food_en":["Braised meats","Steak","Hard cheese"]}',
  NULL, NULL,
  688, 4, '🍷', NULL, false
),
-- 20. Pio Cesare Barolo 2018
(
  '10000000-0000-0000-0000-000000000020',
  'barolo-pio-cesare-2018',
  'Pio Cesare Barolo 2018',
  'red',
  '意大利 · 皮埃蒙特 · 紅酒',
  'Italy · Piedmont · Red',
  'Nebbiolo', 2018,
  '意大利酒王 Barolo，需要時間來展現魅力。玫瑰花瓣、焦油和松露的複雜香氣。',
  'The ''King of Italian wines'' — Barolo needs time to reveal its charm. Complex aromas of rose petal, tar, and truffle.',
  '{"appearance_zh":"淺石榴紅","appearance_en":"Pale garnet","nose_zh":"玫瑰、焦油、松露、甘草","nose_en":"Rose, tar, truffle, licorice","palate_zh":"單寧強勁但優雅，酸度活潑","palate_en":"Firm but elegant tannins, lively acidity","food_zh":["松露料理","燉肉","陳年芝士"],"food_en":["Truffle dishes","Braised meats","Aged cheese"]}',
  NULL, NULL,
  528, 3, '🍷', NULL, false
),
-- 21. Marqués de Riscal Reserva 2018
(
  '10000000-0000-0000-0000-000000000021',
  'rioja-marques-de-riscal-reserva-2018',
  'Marqués de Riscal Reserva 2018',
  'red',
  '西班牙 · 里奧哈 · 紅酒',
  'Spain · Rioja · Red',
  'Tempranillo', 2018,
  '西班牙里奧哈的經典陳年紅酒，溫和易飲，帶皮革和香料氣息。性價比極高。',
  'A classic aged Rioja — smooth and approachable with leather and spice notes. Exceptional value.',
  '{"appearance_zh":"中等紅寶石色","appearance_en":"Medium ruby","nose_zh":"紅莓、皮革、香草、菸草","nose_en":"Red berries, leather, vanilla, tobacco","palate_zh":"溫和圓潤，橡木味恰到好處","palate_en":"Smooth and round, well-judged oak","food_zh":["西班牙火腿","烤肉","中等硬度芝士"],"food_en":["Jamon","Grilled meats","Semi-hard cheese"]}',
  NULL, NULL,
  178, 5, '🍷', 'Best Value', false
),
-- 22. Catena Zapata Malbec 2021
(
  '10000000-0000-0000-0000-000000000022',
  'malbec-catena-zapata-2021',
  'Catena Zapata Malbec 2021',
  'red',
  '阿根廷 · 門多薩 · 紅酒',
  'Argentina · Mendoza · Red',
  'Malbec', 2021,
  '阿根廷最好的馬爾貝克之一，紫色花香混合深色水果，口感厚實柔滑。',
  'One of Argentina''s finest Malbecs — purple florals with dark fruit, thick and silky on the palate.',
  '{"appearance_zh":"深紫紅色","appearance_en":"Deep purple-red","nose_zh":"紫羅蘭、黑莓、李子、可可","nose_en":"Violet, blackberry, plum, cocoa","palate_zh":"厚實柔滑，單寧甜美","palate_en":"Thick and silky, sweet tannins","food_zh":["燒烤","牛肉","濃味菜式"],"food_en":["BBQ","Beef","Rich dishes"]}',
  NULL, NULL,
  298, 4, '🍷', NULL, false
),
-- 23. Felton Road Pinot Noir 2022
(
  '10000000-0000-0000-0000-000000000023',
  'pinot-noir-felton-road-2022',
  'Felton Road Pinot Noir 2022',
  'red',
  '紐西蘭 · 中部奧塔哥 · 紅酒',
  'New Zealand · Central Otago · Red',
  'Pinot Noir', 2022,
  '紐西蘭頂級黑皮諾，來自全世界最南端的產區。紅果香氣和絲般質地。',
  'Top-tier New Zealand Pinot Noir from the world''s southernmost wine region. Red fruit and silky texture.',
  '{"appearance_zh":"透亮紅寶石色","appearance_en":"Bright ruby","nose_zh":"紅櫻桃、覆盆子、香料、泥土","nose_en":"Red cherry, raspberry, spice, earth","palate_zh":"絲般質地，優雅精緻","palate_en":"Silky texture, elegant and refined","food_zh":["鴨肉","三文魚","蘑菇料理"],"food_en":["Duck","Salmon","Mushroom dishes"]}',
  NULL, NULL,
  438, 3, '🍷', NULL, false
),
-- 24. Louis Jadot Bourgogne Pinot Noir 2021
(
  '10000000-0000-0000-0000-000000000024',
  'burgundy-louis-jadot-bourgogne-2021',
  'Louis Jadot Bourgogne Pinot Noir 2021',
  'red',
  '法國 · 勃艮第 · 紅酒',
  'France · Burgundy · Red',
  'Pinot Noir', 2021,
  '入門級勃艮第紅酒，讓你用親民價格感受黑皮諾的優雅。紅果香和輕盈酒體。',
  'Entry-level Burgundy — experience Pinot Noir elegance at an approachable price. Red fruit and light body.',
  '{"appearance_zh":"淺紅寶石色","appearance_en":"Light ruby","nose_zh":"紅櫻桃、草莓、花香","nose_en":"Red cherry, strawberry, floral","palate_zh":"輕盈優雅，果味純淨","palate_en":"Light and elegant, pure fruit","food_zh":["家禽","蘑菇","輕食"],"food_en":["Poultry","Mushrooms","Light dishes"]}',
  NULL, NULL,
  198, 5, '🍷', NULL, false
),
-- 25. La Marca Prosecco
(
  '10000000-0000-0000-0000-000000000025',
  'prosecco-la-marca',
  'La Marca Prosecco',
  'sparkling',
  '意大利 · 威尼托 · 氣泡酒',
  'Italy · Veneto · Sparkling',
  'Glera', NULL,
  '意大利國民氣泡酒，青蘋果和蜂蜜的清新香氣。價格親民，適合隨時開一瓶。',
  'Italy''s favorite sparkling — fresh green apple and honey notes. Affordable enough to pop open anytime.',
  '{"appearance_zh":"淺稻草色","appearance_en":"Pale straw","nose_zh":"青蘋果、蜂蜜、白花","nose_en":"Green apple, honey, white flowers","palate_zh":"清新活潑，微甜順口","palate_en":"Fresh and lively, slightly sweet","food_zh":["開胃菜","輕食","早午餐"],"food_en":["Appetizers","Light bites","Brunch"]}',
  NULL, NULL,
  98, 6, '🥂', 'Best Value', false
),
-- 26. Laurenz V Grüner Veltliner 2022
(
  '10000000-0000-0000-0000-000000000026',
  'gruner-veltliner-laurenz-v-2022',
  'Laurenz V Grüner Veltliner 2022',
  'white',
  '奧地利 · 坎普谷 · 白酒',
  'Austria · Kamptal · White',
  'Grüner Veltliner', 2022,
  '奧地利的國民白葡萄，白胡椒和柑橘的獨特組合。超百搭，特別適合亞洲菜。',
  'Austria''s signature white grape — unique white pepper and citrus combo. Incredibly versatile, especially with Asian food.',
  '{"appearance_zh":"淺黃綠色","appearance_en":"Pale yellow-green","nose_zh":"白胡椒、柑橘、青草","nose_en":"White pepper, citrus, fresh herbs","palate_zh":"清爽多汁，有咬口感","palate_en":"Fresh and juicy with a savory bite","food_zh":["亞洲菜","壽司","沙拉","雞肉"],"food_en":["Asian food","Sushi","Salads","Chicken"]}',
  NULL, NULL,
  168, 3, '🍾', NULL, false
),
-- 27. E. Guigal Côtes du Rhône 2020
(
  '10000000-0000-0000-0000-000000000027',
  'cote-du-rhone-guigal-2020',
  'E. Guigal Côtes du Rhône 2020',
  'red',
  '法國 · 隆河谷 · 紅酒',
  'France · Rhône Valley · Red',
  'Grenache / Syrah / Mourvèdre', 2020,
  '南法經典混釀，果味奔放，香料氣息豐富。價格親民但品質穩定，日常餐酒首選。',
  'A classic Southern Rhône blend — exuberant fruit with rich spice notes. Affordable yet consistent — an everyday wine staple.',
  '{"appearance_zh":"深紅寶石色","appearance_en":"Deep ruby","nose_zh":"紅莓、黑胡椒、百里香","nose_en":"Red berries, black pepper, thyme","palate_zh":"果味奔放，香料味突出","palate_en":"Exuberant fruit, prominent spice","food_zh":["燒烤","燉菜","披薩"],"food_en":["BBQ","Stews","Pizza"]}',
  NULL, NULL,
  128, 6, '🍷', NULL, false
),
-- 28. Castello di Ama Chianti Classico 2020
(
  '10000000-0000-0000-0000-000000000028',
  'chianti-classico-castello-di-ama-2020',
  'Castello di Ama Chianti Classico 2020',
  'red',
  '意大利 · 托斯卡納 · 紅酒',
  'Italy · Tuscany · Red',
  'Sangiovese', 2020,
  '經典奇安提，酸度活潑，帶櫻桃和草本香氣。配意大利菜天生一對。',
  'Classic Chianti with lively acidity, cherry and herbal notes. Born to pair with Italian food.',
  '{"appearance_zh":"明亮紅寶石色","appearance_en":"Bright ruby","nose_zh":"酸櫻桃、百里香、泥土","nose_en":"Sour cherry, thyme, earth","palate_zh":"酸度活潑，單寧中等","palate_en":"Lively acidity, medium tannins","food_zh":["意大利麵","披薩","烤蔬菜"],"food_en":["Pasta","Pizza","Roasted vegetables"]}',
  NULL, NULL,
  228, 4, '🍷', NULL, false
),
-- 29. Graham's 10 Year Tawny Port
(
  '10000000-0000-0000-0000-000000000029',
  'port-tawny-10-year-grahams',
  'Graham''s 10 Year Tawny Port',
  'dessert',
  '葡萄牙 · 杜羅河 · 加強酒',
  'Portugal · Douro · Fortified',
  'Touriga Nacional / Tinta Roriz', NULL,
  '陳年茶色波特酒，焦糖、堅果和太妃糖的迷人風味。餐後酒的完美選擇。',
  'Aged tawny Port with caramel, nut, and toffee flavors. The perfect after-dinner wine.',
  '{"appearance_zh":"琥珀色","appearance_en":"Amber","nose_zh":"焦糖、核桃、太妃糖、橙皮","nose_en":"Caramel, walnut, toffee, orange peel","palate_zh":"甜潤柔滑，堅果味悠長","palate_en":"Sweet and silky, lingering nutty finish","food_zh":["甜品","堅果","巧克力","芝士"],"food_en":["Desserts","Nuts","Chocolate","Cheese"]}',
  NULL, NULL,
  268, 3, '🍾', NULL, false
),
-- 30. Laurent-Perrier Cuvée Rosé
(
  '10000000-0000-0000-0000-000000000030',
  'champagne-laurent-perrier-rose',
  'Laurent-Perrier Cuvée Rosé',
  'sparkling',
  '法國 · 香檳區 · 粉紅氣泡酒',
  'France · Champagne · Rosé Sparkling',
  'Pinot Noir', NULL,
  '粉紅香檳的標桿之作，全球最受歡迎的粉紅香檳之一。草莓和紅醋栗的優雅氣息。',
  'The benchmark rosé Champagne — one of the world''s most popular. Elegant strawberry and redcurrant notes.',
  '{"appearance_zh":"三文魚粉色","appearance_en":"Salmon pink","nose_zh":"草莓、紅醋栗、玫瑰","nose_en":"Strawberry, redcurrant, rose","palate_zh":"細膩活潑，果味優雅","palate_en":"Delicate and lively, elegant fruit","food_zh":["海鮮","壽司","莓果甜品"],"food_en":["Seafood","Sushi","Berry desserts"]}',
  NULL, NULL,
  488, 4, '🥂', NULL, false
),
-- 31. Penfolds Max's Shiraz 2021
(
  '10000000-0000-0000-0000-000000000031',
  'shiraz-penfolds-max-2021',
  'Penfolds Max''s Shiraz 2021',
  'red',
  '澳洲 · 南澳 · 紅酒',
  'Australia · South Australia · Red',
  'Shiraz', 2021,
  'Penfolds 入門級設拉子，黑莓和巧克力的豐富風味。比 Bin 389 更平易近人的選擇。',
  'Penfolds'' entry-level Shiraz — rich blackberry and chocolate flavors. More approachable than Bin 389.',
  '{"appearance_zh":"深紫紅色","appearance_en":"Deep purple-red","nose_zh":"黑莓、巧克力、黑胡椒","nose_en":"Blackberry, chocolate, black pepper","palate_zh":"果味豐富，單寧柔順","palate_en":"Rich fruit, soft tannins","food_zh":["燒烤","漢堡","燉肉"],"food_en":["BBQ","Burgers","Stews"]}',
  NULL, NULL,
  198, 5, '🍷', NULL, false
),
-- 32. Martín Códax Albariño 2023
(
  '10000000-0000-0000-0000-000000000032',
  'albarino-martin-codax-2023',
  'Martín Códax Albariño 2023',
  'white',
  '西班牙 · 下海灣 · 白酒',
  'Spain · Rías Baixas · White',
  'Albariño', 2023,
  '西班牙加利西亞的海風白酒，帶明顯的海洋礦物感和柑橘香氣。配海鮮天作之合。',
  'A sea-breeze white from Galicia — pronounced marine minerality and citrus. A natural match for seafood.',
  '{"appearance_zh":"淺金色帶綠光","appearance_en":"Pale gold with green tints","nose_zh":"柑橘、白桃、海風、礦物","nose_en":"Citrus, white peach, sea breeze, minerals","palate_zh":"清爽鹹鮮，礦物感突出","palate_en":"Fresh and saline, prominent minerality","food_zh":["海鮮","壽司","白灼蝦"],"food_en":["Seafood","Sushi","Poached prawns"]}',
  NULL, NULL,
  148, 4, '🍾', NULL, false
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 10. MERCHANT PRICES (6 wines with comparison data)
-- ────────────────────────────────────────────────────────────

INSERT INTO merchant_prices (wine_id, merchant_id, price, url, is_best) VALUES
-- Cloudy Bay Sauvignon Blanc 2023
('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 138, NULL, true),
('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 155, NULL, false),
('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 168, NULL, false),
('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 172, NULL, false),
('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 185, NULL, false),
('10000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 198, NULL, false),
-- Moët & Chandon Brut Impérial
('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 268, NULL, true),
('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 288, NULL, false),
('10000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 298, NULL, false),
-- Whispering Angel Rosé 2023
('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 198, NULL, true),
('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 218, NULL, false),
('10000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 228, NULL, false),
-- Penfolds Bin 389 2021
('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 328, NULL, true),
('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 348, NULL, false),
('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 358, NULL, false),
('10000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 368, NULL, false),
-- Masi Costasera Amarone 2018
('10000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 388, NULL, true),
('10000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 408, NULL, false),
('10000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 418, NULL, false),
-- Santa Margherita Pinot Grigio
('10000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 168, NULL, true),
('10000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 178, NULL, false),
('10000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 188, NULL, false)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 11. WINE_TAGS (junction: wine ↔ tag)
-- ────────────────────────────────────────────────────────────

INSERT INTO wine_tags (wine_id, tag_id) VALUES
-- 1. Cloudy Bay: easy-drinking, crisp
('10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005'),
-- 2. Moët: gift, party
('10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000006'),
('10000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000008'),
-- 3. Whispering Angel: crisp, fruity
('10000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000005'),
('10000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003'),
-- 4. Penfolds 389: full-bodied, dinner
('10000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000007'),
-- 5. Amarone: full-bodied, fruity
('10000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000003'),
-- 6. Santa Margherita: easy-drinking, crisp
('10000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000005'),
-- 7. Mouton Rothschild: premium
('10000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000012'),
-- 8. Opus One: premium
('10000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000012'),
-- 9. Cristal: premium, gift
('10000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000012'),
('10000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000006'),
-- 10. Veuve Clicquot: gift, party
('10000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000006'),
('10000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000008'),
-- 11. Dom Pérignon: premium
('10000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000012'),
-- 12. Villa Maria: easy-drinking, budget
('10000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000011'),
-- 13. Chablis: crisp, dinner
('10000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000005'),
('10000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000007'),
-- 14. Sancerre: easy-drinking, crisp
('10000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000005'),
-- 15. Riesling: easy-drinking
('10000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000001'),
-- 16. Gewürztraminer: fruity, dinner
('10000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000007'),
-- 17. Tokaji: fruity
('10000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000003'),
-- 18. d'Yquem: premium
('10000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000012'),
-- 19. Tignanello: full-bodied, fruity
('10000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000003'),
-- 20. Barolo: full-bodied, premium
('10000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000012'),
-- 21. Rioja: budget, everyday
('10000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000011'),
('10000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000009'),
-- 22. Malbec: full-bodied, fruity
('10000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000022', 'f0000000-0000-0000-0000-000000000003'),
-- 23. Felton Road: fruity
('10000000-0000-0000-0000-000000000023', 'f0000000-0000-0000-0000-000000000003'),
-- 24. Louis Jadot: budget, everyday
('10000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-000000000011'),
('10000000-0000-0000-0000-000000000024', 'f0000000-0000-0000-0000-000000000009'),
-- 25. Prosecco: easy-drinking, budget
('10000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000025', 'f0000000-0000-0000-0000-000000000011'),
-- 26. Grüner Veltliner: explore
('10000000-0000-0000-0000-000000000026', 'f0000000-0000-0000-0000-000000000010'),
-- 27. Côtes du Rhône: budget, everyday
('10000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-000000000011'),
('10000000-0000-0000-0000-000000000027', 'f0000000-0000-0000-0000-000000000009'),
-- 28. Chianti: everyday, dinner
('10000000-0000-0000-0000-000000000028', 'f0000000-0000-0000-0000-000000000009'),
('10000000-0000-0000-0000-000000000028', 'f0000000-0000-0000-0000-000000000007'),
-- 29. Port: explore
('10000000-0000-0000-0000-000000000029', 'f0000000-0000-0000-0000-000000000010'),
-- 30. Laurent-Perrier: gift
('10000000-0000-0000-0000-000000000030', 'f0000000-0000-0000-0000-000000000006'),
-- 31. Penfolds Max: budget
('10000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000011'),
-- 32. Albariño: crisp, explore
('10000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000005'),
('10000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 12. SCENE_WINES (junction: scene ↔ wine, with sort_order)
-- ────────────────────────────────────────────────────────────

INSERT INTO scene_wines (scene_id, wine_id, sort_order) VALUES
-- Gift scene
('f2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1), -- Moët
('f2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 2), -- Dom Pérignon
('f2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000009', 3), -- Cristal
('f2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000030', 4), -- Laurent-Perrier
('f2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', 5), -- Opus One
('f2000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000018', 6), -- d'Yquem
-- Dinner scene
('f2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 1), -- Cloudy Bay
('f2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 2), -- Penfolds 389
('f2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000016', 3), -- Gewürztraminer
('f2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000021', 4), -- Rioja
('f2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000028', 5), -- Chianti
('f2000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000027', 6), -- Côtes du Rhône
-- Everyday scene
('f2000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000012', 1), -- Villa Maria
('f2000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000025', 2), -- Prosecco
('f2000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 3), -- Santa Margherita
('f2000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000027', 4), -- Côtes du Rhône
('f2000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000031', 5), -- Penfolds Max
('f2000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000024', 6), -- Louis Jadot
-- Explore scene
('f2000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000026', 1), -- Grüner Veltliner
('f2000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000015', 2), -- Riesling
('f2000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000017', 3), -- Tokaji
('f2000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000032', 4), -- Albariño
('f2000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000005', 5), -- Amarone
('f2000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000020', 6)  -- Barolo
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 13. ADDITIONAL CONSUMER USERS (張志強, 王建國)
-- ────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, phone, phone_change, phone_change_token, is_sso_user, is_anonymous)
VALUES
  ('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'zhang@demo.com', crypt('user123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false),
  ('d0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'wang@demo.com', crypt('user123', gen_salt('bf')), now(), 'authenticated', 'authenticated', now(), now(), '{"provider":"email","providers":["email"]}', '{}', '', '', '', '', '', '', NULL, '', '', false, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', '{"sub":"d0000000-0000-0000-0000-000000000005","email":"zhang@demo.com"}', 'email', 'd0000000-0000-0000-0000-000000000005', now(), now()),
  ('d0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006', '{"sub":"d0000000-0000-0000-0000-000000000006","email":"wang@demo.com"}', 'email', 'd0000000-0000-0000-0000-000000000006', now(), now())
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, display_name, email, role, status) VALUES
  ('d0000000-0000-0000-0000-000000000005', '張志強', 'zhang@demo.com', 'user', 'active'),
  ('d0000000-0000-0000-0000-000000000006', '王建國', 'wang@demo.com', 'user', 'active')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 14. COMMUNITY — POSTS (from community.json, skip real users)
-- ────────────────────────────────────────────────────────────
-- ID mapping: u1→d0..01, u2→d0..02, u3→d0..03, u4→d0..05, u5→d0..04, u6→d0..06
-- Merchant staff: watsons→c0..01, wine-and-co→c0..02, cellardoor→c0..03, vinhk→c0..04

INSERT INTO posts (id, author_id, content, is_official, merchant_id, like_count, comment_count, status, created_at, updated_at) VALUES
-- p1001: 陳大文 on Cloudy Bay
(
  '20000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  '第一次試 Cloudy Bay，驚喜不錯

朋友推薦的 Cloudy Bay Sauvignon Blanc 2023，開瓶就能聞到很清新的柑橘和百香果香氣。入口酸度恰好，配海鮮很搭。在 Watson''s Wine 買的，價格也比較實惠。推薦給喜歡清爽白酒的朋友。',
  false, NULL, 4, 2, 'visible',
  '2026-03-14T10:30:00Z', '2026-03-14T10:30:00Z'
),
-- p1002: Sophie on Moët
(
  '20000000-0000-0000-0000-000000000002',
  'd0000000-0000-0000-0000-000000000004',
  'Birthday dinner wine pairing success!

Picked up the Moët & Chandon Brut Imperial for my friend''s birthday dinner. The bubbles were perfect and everyone loved it. Pro tip: chill it well beforehand and pair with light appetizers. The price comparison on this platform saved me about HK$50 compared to buying at a random shop.',
  false, NULL, 3, 1, 'visible',
  '2026-03-13T18:15:00Z', '2026-03-13T18:15:00Z'
),
-- p1003: 李美玲 on Penfolds 389
(
  '20000000-0000-0000-0000-000000000003',
  'd0000000-0000-0000-0000-000000000002',
  'Penfolds Bin 389 配中菜真的很搭

一直聽說 Penfolds 配中菜好，這次終於試了 Bin 389 2021 配紅燒肉和叉燒，果然名不虛傳。酒體夠厚、單寧柔順，和肉類的油脂感完美搭配。下次聚餐打算試試配燒鵝。',
  false, NULL, 4, 2, 'visible',
  '2026-03-12T14:00:00Z', '2026-03-12T14:00:00Z'
),
-- p1004: Watson's Wine official post
(
  '20000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  '本週精選：春季白酒推薦

春天到了，是時候開一瓶清爽的白酒。本週我們精選了幾款適合春天飲用的白酒：Cloudy Bay Sauvignon Blanc 的清新果香、Santa Margherita Pinot Grigio 的優雅花香，都是日常自飲的好選擇。歡迎到店試飲。',
  true, 'b0000000-0000-0000-0000-000000000001', 3, 1, 'visible',
  '2026-03-11T09:00:00Z', '2026-03-11T09:00:00Z'
),
-- p1005: James on Whispering Angel
(
  '20000000-0000-0000-0000-000000000005',
  'd0000000-0000-0000-0000-000000000003',
  'Whispering Angel Rosé - perfect for rooftop drinks

Got a bottle of Whispering Angel for a rooftop gathering last weekend. It''s light, refreshing, and looks gorgeous in the glass. The pale pink colour is Instagram-worthy. Great value for what you get. Found the best price through this platform at Wine & Co.',
  false, NULL, 2, 1, 'visible',
  '2026-03-10T16:45:00Z', '2026-03-10T16:45:00Z'
),
-- p1006: Wine & Co official post
(
  '20000000-0000-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000000002',
  '新手選酒指南：如何讀懂酒標

很多朋友說在酒架前不知道怎麼選。其實看懂酒標就成功一半了。重點看三個地方：1) 產區 - 決定風格；2) 葡萄品種 - 決定口感；3) 年份 - 影響成熟度。有任何問題歡迎留言，我們很樂意幫大家解答。',
  true, 'b0000000-0000-0000-0000-000000000002', 5, 2, 'visible',
  '2026-03-09T11:30:00Z', '2026-03-09T11:30:00Z'
),
-- p1007: 王建國 asks for recommendations
(
  '20000000-0000-0000-0000-000000000007',
  'd0000000-0000-0000-0000-000000000006',
  '求推薦：HK$200 以下的紅酒

平時下班喜歡小酌一杯，想找幾款 HK$200 以下、口感柔順不會太酸澀的紅酒。主要配簡單的家常菜或者零食。大家有什麼好推薦嗎？',
  false, NULL, 2, 3, 'visible',
  '2026-03-08T20:00:00Z', '2026-03-08T20:00:00Z'
),
-- p1008: CellarDoor official post on Amarone event
(
  '20000000-0000-0000-0000-000000000008',
  'c0000000-0000-0000-0000-000000000003',
  'Amarone 品鑑會回顧

上週的 Amarone 品鑑會非常成功，感謝大家參加！我們品嚐了 Masi Costasera Amarone 2018，大家對它濃郁的果乾和巧克力風味讚不絕口。下次品鑑會主題會是波爾多 vs 納帕谷，敬請期待。',
  true, 'b0000000-0000-0000-0000-000000000003', 2, 1, 'visible',
  '2026-03-07T15:00:00Z', '2026-03-07T15:00:00Z'
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 15. POST_PRODUCTS (wine references in posts)
-- ────────────────────────────────────────────────────────────

INSERT INTO post_products (post_id, wine_id) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'), -- p1001 → Cloudy Bay
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'), -- p1002 → Moët
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004'), -- p1003 → Penfolds 389
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003'), -- p1005 → Whispering Angel
('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005')  -- p1008 → Amarone
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 16. POST_LIKES
-- ────────────────────────────────────────────────────────────

INSERT INTO post_likes (post_id, user_id) VALUES
-- p1001 likes: u2, u3, u5
('20000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004'),
-- p1002 likes: u1, u2, u4
('20000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005'),
-- p1003 likes: u1, u3, u5, u6
('20000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004'),
('20000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006'),
-- p1004 likes: u1, u2, u5
('20000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004'),
-- p1005 likes: u1, u5
('20000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004'),
-- p1006 likes: u1, u2, u3, u4, u6
('20000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000003'),
('20000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005'),
('20000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000006'),
-- p1007 likes: u2, u4
('20000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000005'),
-- p1008 likes: u2, u3
('20000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000002'),
('20000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 17. COMMENTS (from community.json)
-- ────────────────────────────────────────────────────────────

INSERT INTO comments (id, post_id, author_id, content, status, created_at) VALUES
-- c2001: Sophie on p1001
('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004',
 'Totally agree! Cloudy Bay is one of my favourites too. Try it with sushi next time!',
 'visible', '2026-03-14T12:00:00Z'),
-- c2002: Watson's Wine on p1001
('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
 '感謝分享！Cloudy Bay 確實是我們的暢銷款之一，很高興你喜歡。配壽司也是非常好的選擇。',
 'visible', '2026-03-14T14:30:00Z'),
-- c2003: 陳大文 on p1002
('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
 'Moët 開生日派對確實很有氣氛！下次可以試試 Veuve Clicquot，我覺得也很棒。',
 'visible', '2026-03-13T20:00:00Z'),
-- c2004: 王建國 on p1003
('21000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000006',
 '配燒鵝一定要試！之前在酒商活動上試過，絕配。',
 'visible', '2026-03-12T16:00:00Z'),
-- c2005: CellarDoor on p1003
('21000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003',
 'Penfolds 配中菜是經典搭配。如果想更進一步，可以試試 Bin 407，和紅燒菜式同樣出色。',
 'visible', '2026-03-12T18:00:00Z'),
-- c2006: James on p1004
('21000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003',
 'Will definitely visit this weekend! Do you have any Riesling in stock?',
 'visible', '2026-03-11T11:00:00Z'),
-- c2007: 李美玲 on p1005
('21000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002',
 'Whispering Angel 的顏值真的很高，送禮也很適合！',
 'visible', '2026-03-10T18:00:00Z'),
-- c2008: 陳大文 on p1006
('21000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000001',
 '非常實用的科普！希望能多出一些這樣的內容。想問一下，新世界和舊世界的酒有什麼主要區別？',
 'visible', '2026-03-09T14:00:00Z'),
-- c2009: Wine & Co on p1006
('21000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000002',
 '好問題！簡單來說，舊世界（歐洲）的酒風格較含蓄、注重風土；新世界（澳洲、智利等）較果味奔放、容易入口。下次會寫一篇詳細分享。',
 'visible', '2026-03-09T16:00:00Z'),
-- c2010: 李美玲 on p1007
('21000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002',
 '推薦 Torres Sangre de Toro，大約 HK$120，口感很柔順，性價比高。',
 'visible', '2026-03-08T21:00:00Z'),
-- c2011: Sophie on p1007
('21000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000004',
 'Try the Casillero del Diablo! Great value under $150 and very smooth.',
 'visible', '2026-03-08T21:30:00Z'),
-- c2012: VinHK on p1007
('21000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004',
 '歡迎來看看我們的 $200 以下精選區，有幾款澳洲和智利的紅酒都很適合日常自飲。',
 'visible', '2026-03-09T09:00:00Z'),
-- c2013: 李美玲 on p1008
('21000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000002',
 '好可惜沒能參加！下次波爾多場一定要報名。',
 'visible', '2026-03-07T17:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 18. WINE BOOKMARKS (from users.json)
-- ────────────────────────────────────────────────────────────

INSERT INTO wine_bookmarks (user_id, wine_id) VALUES
-- 陳大文 (d0..01): cloudy-bay, moet, whispering-angel
('d0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
('d0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
('d0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003'),
-- 李美玲 (d0..02): penfolds-389, amarone
('d0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004'),
('d0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005'),
-- James (d0..03): cloudy-bay, santa-margherita
('d0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'),
('d0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006'),
-- Sophie (d0..04): moet, whispering-angel, penfolds-389
('d0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002'),
('d0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003'),
('d0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004'),
-- 王建國 (d0..06): cloudy-bay
('d0000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 19. MERCHANT BOOKMARKS (from users.json)
-- ────────────────────────────────────────────────────────────

INSERT INTO merchant_bookmarks (user_id, merchant_id) VALUES
-- 陳大文: watsons-wine, wine-and-co
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'),
-- 李美玲: cellardoor, watsons-wine
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003'),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'),
-- James: wine-and-co
('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002'),
-- Sophie: bottleshop, vinhk, watsons-wine
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006'),
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004'),
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001'),
-- 王建國: grape-hk
('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;
