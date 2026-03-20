/**
 * Hong Kong districts with center coordinates for manual location fallback.
 * Used when user denies location permission on C-end.
 */

export interface District {
  slug: string;
  name_zh: string;
  name_en: string;
  lat: number;
  lng: number;
}

export const HK_DISTRICTS: District[] = [
  { slug: "central", name_zh: "中環", name_en: "Central", lat: 22.2812, lng: 114.1588 },
  { slug: "tsim-sha-tsui", name_zh: "尖沙咀", name_en: "Tsim Sha Tsui", lat: 22.2988, lng: 114.1694 },
  { slug: "causeway-bay", name_zh: "銅鑼灣", name_en: "Causeway Bay", lat: 22.2802, lng: 114.1849 },
  { slug: "wan-chai", name_zh: "灣仔", name_en: "Wan Chai", lat: 22.2783, lng: 114.1747 },
  { slug: "sai-ying-pun", name_zh: "西營盤", name_en: "Sai Ying Pun", lat: 22.2870, lng: 114.1420 },
  { slug: "kwun-tong", name_zh: "觀塘", name_en: "Kwun Tong", lat: 22.3120, lng: 114.2230 },
  { slug: "mong-kok", name_zh: "旺角", name_en: "Mong Kok", lat: 22.3193, lng: 114.1694 },
  { slug: "sha-tin", name_zh: "沙田", name_en: "Sha Tin", lat: 22.3865, lng: 114.1950 },
  { slug: "tuen-mun", name_zh: "屯門", name_en: "Tuen Mun", lat: 22.3908, lng: 113.9734 },
  { slug: "tsuen-wan", name_zh: "荃灣", name_en: "Tsuen Wan", lat: 22.3714, lng: 114.1140 },
];
