import { NextRequest, NextResponse } from "next/server";
import { submitMerchantApplication } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { company_name, contact_name, email } = body;
  if (!company_name || !contact_name || !email) {
    return NextResponse.json(
      { error: "company_name, contact_name, and email are required" },
      { status: 400 }
    );
  }

  const result = await submitMerchantApplication(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 201 });
}
