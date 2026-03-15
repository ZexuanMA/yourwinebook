import { NextRequest, NextResponse } from "next/server";
import { trackEvent, TrackEvent } from "@/lib/analytics-store";

export async function POST(request: NextRequest) {
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
