import { NextRequest, NextResponse } from "next/server";
import { createApplication } from "@/lib/application-store";
import { checkRateLimit, getClientIp, APPLICATION_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`application:${ip}`, APPLICATION_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many applications. Please try again later." }, { status: 429 });
  }

  const body = await request.json();

  const { company_name, contact_name, email } = body;
  if (!company_name || !contact_name || !email) {
    return NextResponse.json(
      { error: "company_name, contact_name, and email are required" },
      { status: 400 }
    );
  }

  const app = await createApplication(body);
  return NextResponse.json({ success: true, id: app.id }, { status: 201 });
}
