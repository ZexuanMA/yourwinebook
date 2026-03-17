// Database row
export interface SceneRow {
  id: string;
  slug: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  emoji: string;
  created_at: string;
}

// Frontend scene model
export interface Scene {
  slug: string;
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  emoji: string;
  wineSlugs: string[];
}
