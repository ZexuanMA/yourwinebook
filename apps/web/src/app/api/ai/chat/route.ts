import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  AI_TOOLS,
  getSystemPrompt,
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_RATE_LIMIT_AUTHED,
  AI_RATE_LIMIT_ANON,
  AI_MAX_INPUT_LENGTH,
} from "@/lib/ai-tools";
import {
  checkRateLimit,
  getClientIp,
  type RateLimitConfig,
} from "@/lib/rate-limit";
import {
  getWinesPaginated,
  getWineBySlug,
  getWinePrices,
  getSceneWines,
  getRegions,
} from "@/lib/queries";

// ============================================================
// Rate limit configs for AI
// ============================================================

const AI_RATE_LIMIT_AUTHED_CONFIG: RateLimitConfig = {
  max: AI_RATE_LIMIT_AUTHED,
  windowMs: 60 * 60 * 1000, // 1 hour
};

const AI_RATE_LIMIT_ANON_CONFIG: RateLimitConfig = {
  max: AI_RATE_LIMIT_ANON,
  windowMs: 60 * 60 * 1000,
};

// ============================================================
// Tool execution
// ============================================================

async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "search_wines": {
      const result = await getWinesPaginated({
        search: (input.query as string) || undefined,
        type: input.type as string | undefined,
        region: (input.region as string) || undefined,
        minPrice: input.min_price as number | undefined,
        maxPrice: input.max_price as number | undefined,
        sort: (input.sort as "price_asc" | "price_desc" | "name_asc") || "price_asc",
        limit: 10,
        page: 1,
      });
      return {
        total: result.total,
        wines: result.wines.map((w) => ({
          slug: w.slug,
          name: w.name,
          type: w.type,
          region_zh: w.region_zh,
          region_en: w.region_en,
          grape_variety: w.grape_variety,
          vintage: w.vintage,
          minPrice: w.minPrice,
          merchantCount: w.merchantCount,
          tags_zh: w.tags_zh,
          tags_en: w.tags_en,
        })),
      };
    }

    case "get_wine_detail": {
      const wine = await getWineBySlug(input.slug as string);
      if (!wine) return { error: "Wine not found" };
      return {
        slug: wine.slug,
        name: wine.name,
        type: wine.type,
        region_zh: wine.region_zh,
        region_en: wine.region_en,
        grape_variety: wine.grape_variety,
        vintage: wine.vintage,
        minPrice: wine.minPrice,
        merchantCount: wine.merchantCount,
        tags_zh: wine.tags_zh,
        tags_en: wine.tags_en,
        description_zh: wine.description_zh,
        description_en: wine.description_en,
        tasting_notes: wine.tasting_notes,
        region_story_zh: wine.region_story_zh,
        region_story_en: wine.region_story_en,
      };
    }

    case "get_wine_prices": {
      const prices = await getWinePrices(input.slug as string);
      if (prices.length === 0) return { error: "No price data found" };
      return {
        slug: input.slug,
        prices: prices.map((p) => ({
          merchant: p.merchant,
          merchantSlug: p.merchantSlug,
          price: p.price,
          isBest: p.isBest,
        })),
      };
    }

    case "get_scene_wines": {
      const wines = await getSceneWines(input.scene as string);
      return {
        scene: input.scene,
        wines: wines.map((w) => ({
          slug: w.slug,
          name: w.name,
          type: w.type,
          region_zh: w.region_zh,
          region_en: w.region_en,
          minPrice: w.minPrice,
          merchantCount: w.merchantCount,
          tags_zh: w.tags_zh,
          tags_en: w.tags_en,
        })),
      };
    }

    case "get_regions": {
      const regions = await getRegions();
      return { regions };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ============================================================
// Streaming helper
// ============================================================

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ============================================================
// POST /api/ai/chat
// ============================================================

export async function POST(request: NextRequest) {
  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI service not configured", code: "ai_not_configured" },
      { status: 503 }
    );
  }

  // Parse body
  let body: { messages?: ChatMessage[]; locale?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body", code: "invalid_body" },
      { status: 400 }
    );
  }

  const { messages, locale = "zh-HK" } = body;

  // Validate messages
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "Messages array required", code: "missing_messages" },
      { status: 400 }
    );
  }

  // Validate last message length
  const lastMessage = messages[messages.length - 1];
  if (
    lastMessage.role !== "user" ||
    lastMessage.content.length > AI_MAX_INPUT_LENGTH
  ) {
    return Response.json(
      {
        error: `Message must be from user and under ${AI_MAX_INPUT_LENGTH} characters`,
        code: "invalid_message",
      },
      { status: 400 }
    );
  }

  // Rate limiting
  const userId = request.cookies.get("wb_user_session")?.value;
  const clientIp = getClientIp(request);
  const rateLimitKey = `ai:${userId || clientIp}`;
  const rateLimitConfig = userId
    ? AI_RATE_LIMIT_AUTHED_CONFIG
    : AI_RATE_LIMIT_ANON_CONFIG;

  const rateResult = checkRateLimit(rateLimitKey, rateLimitConfig);
  if (!rateResult.allowed) {
    return Response.json(
      { error: "Too many requests", code: "rate_limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateResult.retryAfterMs ?? 60000) / 1000)
          ),
        },
      }
    );
  }

  // Build Claude messages (limit history to last 10 turns)
  const trimmedMessages = messages.slice(-20);
  const claudeMessages: Anthropic.MessageParam[] = trimmedMessages.map(
    (m) => ({
      role: m.role,
      content: m.content,
    })
  );

  const client = new Anthropic({ apiKey });

  // Stream with tool use loop
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let currentMessages = claudeMessages;
        let toolUseIterations = 0;
        const maxToolIterations = 5;

        while (toolUseIterations < maxToolIterations) {
          const response = await client.messages.create({
            model: AI_MODEL,
            max_tokens: AI_MAX_TOKENS,
            system: getSystemPrompt(locale),
            tools: AI_TOOLS,
            messages: currentMessages,
            stream: true,
          });

          let hasToolUse = false;
          const toolCalls: { id: string; name: string; input: Record<string, unknown> }[] = [];
          let currentToolInput = "";
          let currentToolId = "";
          let currentToolName = "";
          let accumulatedText = "";

          for await (const event of response) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "text") {
                // Start of text block
              } else if (event.content_block.type === "tool_use") {
                hasToolUse = true;
                currentToolId = event.content_block.id;
                currentToolName = event.content_block.name;
                currentToolInput = "";
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                accumulatedText += event.delta.text;
                // Stream text to client
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
                  )
                );
              } else if (event.delta.type === "input_json_delta") {
                currentToolInput += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              if (currentToolName) {
                // Store completed tool call
                toolCalls.push({
                  id: currentToolId,
                  name: currentToolName,
                  input: JSON.parse(currentToolInput || "{}"),
                });
                currentToolName = "";
              }
            } else if (event.type === "message_stop") {
              // End of message
            }
          }

          if (!hasToolUse) {
            // No tool use — we're done
            break;
          }

          // Execute tools and continue conversation
          toolUseIterations++;

          // Signal to client that AI is looking up data
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "status", status: "searching" })}\n\n`
            )
          );

          // Build assistant message with text (if any) + tool_use blocks
          const assistantContent: Anthropic.ContentBlockParam[] = [];
          if (accumulatedText) {
            assistantContent.push({ type: "text", text: accumulatedText });
          }
          for (const tc of toolCalls) {
            assistantContent.push({
              type: "tool_use" as const,
              id: tc.id,
              name: tc.name,
              input: tc.input,
            });
          }

          // Execute all tool calls
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tc of toolCalls) {
            const result = await executeTool(tc.name, tc.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: tc.id,
              content: JSON.stringify(result),
            });
          }

          // Continue the conversation with tool results
          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: assistantContent },
            { role: "user", content: toolResults },
          ];
        }

        // Signal completion
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done" })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "AI service error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: message })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-RateLimit-Remaining": String(rateResult.remaining),
    },
  });
}
