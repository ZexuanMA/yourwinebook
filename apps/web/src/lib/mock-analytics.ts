// Mock analytics data — replace with real analytics service (e.g. Plausible, PostHog, Supabase) later

export interface DailyStats {
  date: string;       // "MM/DD"
  pageViews: number;
  visitors: number;
  sessions: number;
}

export interface TopPage {
  path: string;
  label: string;
  views: number;
  avgDuration: string;   // "mm:ss"
  bounceRate: number;    // 0-100
}

export interface TopWine {
  slug: string;
  name: string;
  emoji: string;
  views: number;
  clickouts: number;     // clicks to merchant buy links
}

export interface RecentSession {
  id: string;
  country: string;
  flag: string;
  device: "desktop" | "mobile" | "tablet";
  entryPage: string;
  duration: string;
  pages: number;
  time: string;         // relative, e.g. "2 分鐘前"
}

// Last 30 days daily data
export const dailyStats: DailyStats[] = [
  { date: "02/14", pageViews: 412,  visitors: 189, sessions: 224 },
  { date: "02/15", pageViews: 388,  visitors: 172, sessions: 198 },
  { date: "02/16", pageViews: 521,  visitors: 243, sessions: 287 },
  { date: "02/17", pageViews: 634,  visitors: 301, sessions: 356 },
  { date: "02/18", pageViews: 578,  visitors: 268, sessions: 312 },
  { date: "02/19", pageViews: 490,  visitors: 224, sessions: 261 },
  { date: "02/20", pageViews: 445,  visitors: 198, sessions: 231 },
  { date: "02/21", pageViews: 523,  visitors: 247, sessions: 289 },
  { date: "02/22", pageViews: 612,  visitors: 288, sessions: 334 },
  { date: "02/23", pageViews: 698,  visitors: 334, sessions: 391 },
  { date: "02/24", pageViews: 743,  visitors: 357, sessions: 418 },
  { date: "02/25", pageViews: 812,  visitors: 389, sessions: 452 },
  { date: "02/26", pageViews: 756,  visitors: 362, sessions: 421 },
  { date: "02/27", pageViews: 689,  visitors: 328, sessions: 379 },
  { date: "02/28", pageViews: 724,  visitors: 348, sessions: 404 },
  { date: "03/01", pageViews: 834,  visitors: 401, sessions: 467 },
  { date: "03/02", pageViews: 901,  visitors: 432, sessions: 503 },
  { date: "03/03", pageViews: 978,  visitors: 469, sessions: 547 },
  { date: "03/04", pageViews: 1043, visitors: 501, sessions: 586 },
  { date: "03/05", pageViews: 1124, visitors: 538, sessions: 628 },
  { date: "03/06", pageViews: 1089, visitors: 521, sessions: 609 },
  { date: "03/07", pageViews: 1201, visitors: 574, sessions: 672 },
  { date: "03/08", pageViews: 1143, visitors: 549, sessions: 641 },
  { date: "03/09", pageViews: 1267, visitors: 608, sessions: 712 },
  { date: "03/10", pageViews: 1389, visitors: 667, sessions: 781 },
  { date: "03/11", pageViews: 1456, visitors: 698, sessions: 817 },
  { date: "03/12", pageViews: 1523, visitors: 731, sessions: 856 },
  { date: "03/13", pageViews: 1478, visitors: 712, sessions: 833 },
  { date: "03/14", pageViews: 1612, visitors: 774, sessions: 907 },
  { date: "03/15", pageViews: 1734, visitors: 832, sessions: 976 },
];

export const topPages: TopPage[] = [
  { path: "/zh-HK",                               label: "首頁",             views: 8234, avgDuration: "1:42", bounceRate: 38 },
  { path: "/zh-HK/search",                        label: "搜索頁",           views: 5612, avgDuration: "3:18", bounceRate: 24 },
  { path: "/zh-HK/wines/cloudy-bay-*",            label: "Cloudy Bay 詳情",  views: 3891, avgDuration: "4:05", bounceRate: 19 },
  { path: "/zh-HK/wines/penfolds-*",              label: "Penfolds 詳情",    views: 3247, avgDuration: "3:52", bounceRate: 21 },
  { path: "/zh-HK/scenes/gift",                   label: "送禮場景",         views: 2934, avgDuration: "2:47", bounceRate: 29 },
  { path: "/zh-HK/wines/moet-chandon-*",          label: "Moët 詳情",        views: 2712, avgDuration: "3:31", bounceRate: 22 },
  { path: "/zh-HK/merchants",                     label: "酒商列表",         views: 2156, avgDuration: "1:58", bounceRate: 34 },
  { path: "/zh-HK/scenes/dinner",                 label: "聚餐場景",         views: 1923, avgDuration: "2:34", bounceRate: 31 },
];

export const topWines: TopWine[] = [
  { slug: "cloudy-bay-sauvignon-blanc-2023", name: "Cloudy Bay Sauvignon Blanc", emoji: "🍾", views: 3891, clickouts: 412 },
  { slug: "penfolds-bin-389-2021",           name: "Penfolds Bin 389",           emoji: "🍷", views: 3247, clickouts: 389 },
  { slug: "moet-chandon-brut-imperial",      name: "Moët & Chandon Brut",        emoji: "🥂", views: 2712, clickouts: 298 },
  { slug: "whispering-angel-rose-2023",      name: "Whispering Angel Rosé",      emoji: "🌸", views: 2134, clickouts: 241 },
  { slug: "masi-costasera-amarone-2018",     name: "Masi Costasera Amarone",     emoji: "🍷", views: 1876, clickouts: 187 },
];

export const recentSessions: RecentSession[] = [
  { id: "s1",  country: "香港",   flag: "🇭🇰", device: "mobile",  entryPage: "首頁",         duration: "4:12", pages: 6,  time: "1 分鐘前"  },
  { id: "s2",  country: "香港",   flag: "🇭🇰", device: "desktop", entryPage: "搜索頁",        duration: "8:34", pages: 12, time: "3 分鐘前"  },
  { id: "s3",  country: "澳門",   flag: "🇲🇴", device: "mobile",  entryPage: "Cloudy Bay 詳情", duration: "2:18", pages: 3,  time: "5 分鐘前"  },
  { id: "s4",  country: "香港",   flag: "🇭🇰", device: "desktop", entryPage: "送禮場景",      duration: "6:45", pages: 9,  time: "8 分鐘前"  },
  { id: "s5",  country: "英國",   flag: "🇬🇧", device: "desktop", entryPage: "首頁",          duration: "3:02", pages: 5,  time: "11 分鐘前" },
  { id: "s6",  country: "香港",   flag: "🇭🇰", device: "tablet",  entryPage: "Penfolds 詳情", duration: "5:21", pages: 7,  time: "14 分鐘前" },
  { id: "s7",  country: "新加坡", flag: "🇸🇬", device: "mobile",  entryPage: "酒商列表",      duration: "1:48", pages: 2,  time: "17 分鐘前" },
  { id: "s8",  country: "香港",   flag: "🇭🇰", device: "desktop", entryPage: "搜索頁",        duration: "11:23", pages: 16, time: "21 分鐘前" },
];

// Summary stats (last 30 days vs previous 30 days)
export const summaryStats = {
  pageViews:    { value: 28934, change: +18.4 },
  visitors:     { value: 13872, change: +22.1 },
  sessions:     { value: 16203, change: +19.7 },
  avgDuration:  { value: "3:24", change: +8.2  },
  bounceRate:   { value: 27.3,  change: -4.1  },   // negative = improvement
  clickouts:    { value: 1527,  change: +31.6 },
};

// Traffic sources
export const trafficSources = [
  { label: "直接訪問",    value: 38, color: "#5B2E35" },
  { label: "Google 搜索", value: 29, color: "#B8956A" },
  { label: "社交媒體",    value: 18, color: "#3A4A3C" },
  { label: "推薦連結",    value: 11, color: "#8B6E4E" },
  { label: "其他",        value:  4, color: "#C8BFB5" },
];

// Device breakdown
export const deviceBreakdown = [
  { label: "手機",  value: 56, icon: "📱" },
  { label: "桌面",  value: 36, icon: "💻" },
  { label: "平板",  value:  8, icon: "📟" },
];
