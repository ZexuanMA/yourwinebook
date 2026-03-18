import { NextRequest, NextResponse } from "next/server";
import { createApplication } from "@/lib/application-store";

export async function POST(request: NextRequest) {
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
