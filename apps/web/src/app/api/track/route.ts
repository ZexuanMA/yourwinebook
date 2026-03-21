import { NextRequest, NextResponse } from "next/server";
import { trackEvent, TrackEvent } from "@/lib/analytics-store";
import { checkRateLimit, getClientIp, TRACK_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`track:${ip}`, TRACK_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }); // Silently drop, don't expose 429
  }

  try {
    const body = await request.json() as Partial<TrackEvent>;
    if (!body.type || !body.sessionId) {
      return NextResponse.json({ error: "type and sessionId required" }, { status: 400 });
    }
    trackEvent({
      type: body.type,
      path: body.path,
      pageLabel: body.pageLabel,
      wineSlug: body.wineSlug,
      wineName: body.wineName,
      wineEmoji: body.wineEmoji,
      merchant: body.merchant,
      sessionId: body.sessionId,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
