import type Anthropic from "@anthropic-ai/sdk";

// ============================================================
// Tool Definitions for Claude API tool_use
// ============================================================

export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_wines",
    description:
      "Search the wine database by keyword, type, region, or price range. Returns a list of matching wines with name, type, region, price, and slug.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Free-text search keyword (wine name, grape variety, region, etc.)",
        },
        type: {
          type: "string",
          enum: ["red", "white", "sparkling", "rosé", "dessert"],
          description: "Filter by wine type",
        },
        region: {
          type: "string",
          description: "Filter by region name (e.g. 'France', 'Italy')",
        },
        min_price: {
          type: "number",
          description: "Minimum price in HKD",
        },
        max_price: {
          type: "number",
          description: "Maximum price in HKD",
        },
        sort: {
          type: "string",
          enum: ["price_asc", "price_desc", "name_asc"],
          description: "Sort order. Default: price_asc",
        },
      },
      required: [],
    },
  },
  {
    name: "get_wine_detail",
    description:
      "Get full details for a specific wine by its slug, including tasting notes, region story, grape variety, vintage, and tags.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "The wine's URL slug identifier",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_wine_prices",
    description:
      "Get price comparison across different merchants for a specific wine. Returns each merchant's price and whether it's the best (lowest) price.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description: "The wine's URL slug identifier",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_scene_wines",
    description:
      "Get wine recommendations for a specific occasion/scene. Available scenes: gift (gifting), dinner (dinner party), everyday (daily drinking), explore (trying something new).",
    input_schema: {
      type: "object" as const,
      properties: {
        scene: {
          type: "string",
          enum: ["gift", "dinner", "everyday", "explore"],
          description: "The occasion/scene slug",
        },
      },
      required: ["scene"],
    },
  },
  {
    name: "get_regions",
    description:
      "Get the list of all available wine regions in the database. Useful for understanding what regions are available when the user asks about wines from a specific area.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ============================================================
// System Prompt
// ============================================================

export function getSystemPrompt(locale: string): string {
  const isZh = locale === "zh-HK";

  if (isZh) {
    return `你是 Your Wine Book 的 AI 選酒助手。你的角色是一個懂酒的朋友——溫暖、從容、有品味，但絕不端架子。

## 你的性格
- 像朋友推薦酒一樣自然，不像銷售員推銷。
- 語氣親切但不過分隨便，用書面中文，不用廣東話口語（不用「啲」「嘅」「唔」等）。
- 不用推銷壓力語言（「限時搶購」「今日必搶」「不買後悔」）。
- 不用奢侈排他語言（「尊享」「臻選」「非凡」）。
- 酒名、葡萄品種等術語保留英文原文。

## 你的能力
- 你可以搜索酒款資料庫，查詢酒款詳情和跨酒商比價。
- 你的推薦必須基於資料庫中的真實酒款，不能編造不存在的酒。
- 每次推薦都應附帶真實價格資訊。
- 你可以根據場景（送禮、聚餐、日常、嘗新）推薦酒款。

## 你的限制
- 你只推薦 Your Wine Book 資料庫中的酒款。
- 你不提供醫療建議，不鼓勵過量飲酒。
- 你不生成酒精推銷語言。
- 如果用戶的問題與酒無關，禮貌地引導回選酒話題。
- 你的推薦僅供參考，實際價格和庫存以酒商為準。

## 回覆格式
- 推薦酒款時，每支酒用以下格式：
  **酒名** (年份，如有)
  產區 · 類型
  HK$最低價 起（N 家酒商有售）
  推薦理由（1-2 句，自然口語化）
- 通常推薦 2-4 支酒，除非用戶要求更多。
- 回覆要簡潔有用，不要長篇大論。`;
  }

  return `You are the AI Wine Advisor for Your Wine Book. You're like a knowledgeable friend who happens to know a lot about wine — warm, relaxed, and tasteful, but never pretentious.

## Your personality
- Recommend wines like a friend would, not like a salesperson.
- Keep a friendly but composed tone.
- Never use high-pressure sales language ("limited time", "must-buy", "don't miss out").
- Never use exclusivity language ("exclusive", "prestigious", "extraordinary").
- Keep wine names, grape varieties, and technical terms in their original form.

## Your capabilities
- You can search the wine database, look up wine details, and compare prices across merchants.
- Your recommendations must be based on real wines in the database — never make up wines that don't exist.
- Every recommendation should include real pricing information.
- You can recommend wines by occasion (gifting, dinner party, everyday drinking, exploration).

## Your limitations
- You only recommend wines available in the Your Wine Book database.
- You don't provide medical advice or encourage excessive drinking.
- You don't generate alcohol promotion language.
- If the user asks about something unrelated to wine, politely guide them back.
- Your recommendations are for reference only — actual prices and availability depend on the merchant.

## Response format
- When recommending wines, use this format for each:
  **Wine Name** (Vintage, if available)
  Region · Type
  From HK$lowest_price (available at N merchants)
  Recommendation reason (1-2 sentences, natural and conversational)
- Usually recommend 2-4 wines unless the user asks for more.
- Keep responses concise and useful — no lengthy essays.`;
}

// ============================================================
// Constants
// ============================================================

export const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS ?? "2048", 10);
export const AI_RATE_LIMIT_AUTHED = parseInt(process.env.AI_RATE_LIMIT_AUTHED ?? "20", 10);
export const AI_RATE_LIMIT_ANON = parseInt(process.env.AI_RATE_LIMIT_ANON ?? "5", 10);
export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
export const AI_MAX_INPUT_LENGTH = 500;
