-- Your Wine Book — Database Schema
-- Run this in the Supabase SQL editor to set up all tables.

-- 1. Regions
CREATE TABLE regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  country_zh TEXT NOT NULL,
  country_en TEXT NOT NULL,
  description_zh TEXT,
  description_en TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Merchants
CREATE TABLE merchants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description_zh TEXT NOT NULL,
  description_en TEXT NOT NULL,
  details_zh TEXT[] DEFAULT '{}',
  details_en TEXT[] DEFAULT '{}',
  wines_listed INT DEFAULT 0,
  best_prices INT DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Wines
CREATE TABLE wines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('red','white','sparkling','rosé','dessert')),
  region_zh TEXT NOT NULL,
  region_en TEXT NOT NULL,
  grape_variety TEXT,
  vintage INT,
  description_zh TEXT NOT NULL,
  description_en TEXT NOT NULL,
  tasting_notes JSONB DEFAULT '{}',
  region_story_zh TEXT,
  region_story_en TEXT,
  min_price INT,
  merchant_count INT DEFAULT 0,
  emoji TEXT DEFAULT '🍷',
  badge TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Wine Tags
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL
);

CREATE TABLE wine_tags (
  wine_id UUID REFERENCES wines(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (wine_id, tag_id)
);

-- 5. Scenes
CREATE TABLE scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_zh TEXT NOT NULL,
  description_en TEXT NOT NULL,
  emoji TEXT DEFAULT '🍷',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scene_wines (
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES wines(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  PRIMARY KEY (scene_id, wine_id)
);

-- 6. Merchant Prices (price comparison)
CREATE TABLE merchant_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wine_id UUID REFERENCES wines(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  price INT NOT NULL,
  url TEXT,
  is_best BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (wine_id, merchant_id)
);

-- 7. Merchant Applications
CREATE TABLE merchant_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  wine_count INT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_wines_type ON wines(type);
CREATE INDEX idx_wines_is_featured ON wines(is_featured);
CREATE INDEX idx_wines_slug ON wines(slug);
CREATE INDEX idx_merchants_slug ON merchants(slug);
CREATE INDEX idx_scenes_slug ON scenes(slug);
CREATE INDEX idx_merchant_prices_wine ON merchant_prices(wine_id);
CREATE INDEX idx_merchant_prices_merchant ON merchant_prices(merchant_id);

-- Enable RLS
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_applications ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read" ON wines FOR SELECT USING (true);
CREATE POLICY "Public read" ON merchants FOR SELECT USING (true);
CREATE POLICY "Public read" ON scenes FOR SELECT USING (true);
CREATE POLICY "Public read" ON merchant_prices FOR SELECT USING (true);
CREATE POLICY "Public read" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read" ON wine_tags FOR SELECT USING (true);
CREATE POLICY "Public read" ON scene_wines FOR SELECT USING (true);
CREATE POLICY "Public read" ON regions FOR SELECT USING (true);

-- Allow anonymous inserts for merchant applications
CREATE POLICY "Anon insert" ON merchant_applications FOR INSERT WITH CHECK (true);
