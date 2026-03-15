# Phase 2: Supabase Database Layer

## Overview

Phase 2 builds the data access layer (DAL) for Your Wine Book. All pages now read data through a unified query interface that supports both **Supabase** (when configured) and **mock data** (default, zero-config). The mock dataset has been expanded from 6 wines to 32, with 6 merchants, 4 scenes, and full price comparison data.

## What Changed

### New Dependencies

- `@supabase/supabase-js` — Supabase client SDK

### New Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client factory; returns `null` when env vars are missing |
| `src/lib/types.ts` | TypeScript types mirroring the database schema |
| `src/lib/queries.ts` | 12 DAL functions with Supabase → mock fallback |
| `src/lib/locale-helpers.ts` | `toWineCard()`, `getSceneLocale()`, `getTastingNotes()`, etc. |
| `src/lib/schema.sql` | Full Postgres schema (10 tables, RLS policies, indexes) |
| `src/lib/seed.sql` | 32 wines, 6 merchants, 4 scenes, 20 tags, price data |
| `.env.local.example` | Environment variable template |
| `src/app/api/wines/route.ts` | `GET /api/wines?type=&search=&minPrice=&maxPrice=` |
| `src/app/api/wines/[slug]/route.ts` | `GET /api/wines/:slug` |
| `src/app/api/wines/[slug]/prices/route.ts` | `GET /api/wines/:slug/prices` |
| `src/app/api/merchants/route.ts` | `GET /api/merchants` |
| `src/app/api/merchants/[slug]/route.ts` | `GET /api/merchants/:slug` |
| `src/app/api/merchants/[slug]/wines/route.ts` | `GET /api/merchants/:slug/wines` |
| `src/app/api/scenes/route.ts` | `GET /api/scenes` |
| `src/app/api/scenes/[slug]/wines/route.ts` | `GET /api/scenes/:slug/wines` |
| `src/app/api/merchant-applications/route.ts` | `POST /api/merchant-applications` |
| `src/app/[locale]/wines/[slug]/WineDetailClient.tsx` | Client component extracted from wine detail page |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/mock-data.ts` | 6 → 32 wines, 1 → 6 merchants, added `Scene`/`Tag` types, per-wine price data, new fields (`grape_variety`, `vintage`, `tasting_notes`, `region_story`, `is_featured`) |
| `src/app/[locale]/page.tsx` | Homepage now uses `toWineCard()` + `getSceneLocale()` instead of inline data; locale detection via `useLocale()` instead of `t.raw()` hack |
| `src/app/[locale]/search/page.tsx` | Uses `toWineCard()` helper; shows all 32 wines |
| `src/app/[locale]/merchants/page.tsx` | Lists all 6 merchants with descriptions and stats (was showing partner names only) |
| `src/app/[locale]/merchants/[slug]/page.tsx` | Dynamic slug routing; finds merchant by slug instead of hardcoding `merchants[0]` |
| `src/app/[locale]/wines/[slug]/page.tsx` | Dynamic slug routing; looks up wine + prices by slug; Server/Client split |
| `src/app/[locale]/scenes/[slug]/page.tsx` | Dynamic slug routing; shows scene-specific wines from `scene.wineSlugs` |
| `src/app/[locale]/join/page.tsx` | Added merchant application form with POST to `/api/merchant-applications` |

### Database Schema (10 tables)

```
regions → merchants → wines → tags
                        ↓        ↓
                   wine_tags  merchant_prices
                        ↓
                   scene_wines → scenes

merchant_applications (standalone)
```

### DAL Query Functions

```typescript
// Wines
getWines(filters?)        // list with optional type/search/price filters
getWineBySlug(slug)       // single wine by slug
getFeaturedWines()        // is_featured = true, limit 3
getSimilarWines(slug)     // same type, exclude current
getWinePrices(slug)       // merchant price comparison

// Merchants
getMerchants()            // all merchants
getMerchantBySlug(slug)   // single merchant
getMerchantWines(slug)    // wines sold by merchant
getPartners()             // merchant name list

// Scenes
getScenes()               // all scenes with wine slugs
getSceneBySlug(slug)      // single scene
getSceneWines(slug)       // wines in scene

// Applications
submitMerchantApplication(data)  // insert application
```

## How to Use

### Without Supabase (default)

Just run `npm run dev` — everything works with mock data. No configuration needed.

### With Supabase

1. Create a Supabase project at https://app.supabase.com
2. Copy `.env.local.example` to `.env.local` and fill in your keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Run `schema.sql` then `seed.sql` in the Supabase SQL editor
4. Restart `npm run dev`

## Verification

- `npm run build` passes with all 19 routes
- `/wines/cloudy-bay-sauvignon-blanc-2023` shows Cloudy Bay with 6 merchant prices
- `/wines/penfolds-bin-389-2021` shows Penfolds with 4 merchant prices
- `/merchants/wine-and-co` shows Wine & Co merchant page (not just Watson's)
- `/scenes/gift` shows 6 gifting wines (Moët, Dom Pérignon, Cristal, etc.)
- `/join` has a working application form
- Chinese/English switching works on all pages
