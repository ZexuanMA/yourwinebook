import { NextResponse } from "next/server";
import { getMerchants } from "@/lib/queries";

export async function GET() {
  const merchants = await getMerchants();
  return NextResponse.json(merchants);
}
