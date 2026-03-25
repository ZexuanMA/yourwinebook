import { describe, it, expect } from "vitest";
import {
  AI_TOOLS,
  getSystemPrompt,
  AI_MAX_TOKENS,
  AI_RATE_LIMIT_AUTHED,
  AI_RATE_LIMIT_ANON,
  AI_MAX_INPUT_LENGTH,
} from "@/lib/ai-tools";

describe("AI_TOOLS", () => {
  it("defines 5 tools", () => {
    expect(AI_TOOLS.length).toBe(5);
  });

  it("each tool has name, description, and input_schema", () => {
    for (const tool of AI_TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.input_schema).toBeDefined();
      expect(tool.input_schema.type).toBe("object");
    }
  });

  it("has search_wines tool with correct filter properties", () => {
    const search = AI_TOOLS.find((t) => t.name === "search_wines");
    expect(search).toBeDefined();
    const props = search!.input_schema.properties as Record<string, unknown>;
    expect(props.query).toBeDefined();
    expect(props.type).toBeDefined();
    expect(props.region).toBeDefined();
    expect(props.min_price).toBeDefined();
    expect(props.max_price).toBeDefined();
    expect(props.sort).toBeDefined();
  });

  it("has get_wine_detail tool with required slug", () => {
    const tool = AI_TOOLS.find((t) => t.name === "get_wine_detail");
    expect(tool).toBeDefined();
    expect(tool!.input_schema.required).toContain("slug");
  });

  it("has get_wine_prices tool with required slug", () => {
    const tool = AI_TOOLS.find((t) => t.name === "get_wine_prices");
    expect(tool).toBeDefined();
    expect(tool!.input_schema.required).toContain("slug");
  });

  it("has get_scene_wines with valid scene enum", () => {
    const tool = AI_TOOLS.find((t) => t.name === "get_scene_wines");
    expect(tool).toBeDefined();
    const sceneParam = (tool!.input_schema.properties as Record<string, { enum?: string[] }>).scene;
    expect(sceneParam.enum).toContain("gift");
    expect(sceneParam.enum).toContain("dinner");
    expect(sceneParam.enum).toContain("everyday");
    expect(sceneParam.enum).toContain("explore");
  });

  it("has get_regions tool with no required params", () => {
    const tool = AI_TOOLS.find((t) => t.name === "get_regions");
    expect(tool).toBeDefined();
    expect(tool!.input_schema.required).toEqual([]);
  });
});

describe("getSystemPrompt()", () => {
  it("returns Chinese prompt for zh-HK", () => {
    const prompt = getSystemPrompt("zh-HK");
    expect(prompt).toContain("AI 選酒助手");
    expect(prompt).toContain("不用廣東話口語");
    expect(prompt).toContain("不像銷售員推銷");
  });

  it("returns English prompt for en", () => {
    const prompt = getSystemPrompt("en");
    expect(prompt).toContain("AI Wine Advisor");
    expect(prompt).toContain("never pretentious");
    expect(prompt).toContain("not like a salesperson");
  });

  it("defaults to English for unknown locale", () => {
    const prompt = getSystemPrompt("fr");
    expect(prompt).toContain("AI Wine Advisor");
  });
});

describe("AI Constants", () => {
  it("has reasonable default values", () => {
    expect(AI_MAX_TOKENS).toBe(2048);
    expect(AI_RATE_LIMIT_AUTHED).toBe(20);
    expect(AI_RATE_LIMIT_ANON).toBe(5);
    expect(AI_MAX_INPUT_LENGTH).toBe(500);
  });
});
