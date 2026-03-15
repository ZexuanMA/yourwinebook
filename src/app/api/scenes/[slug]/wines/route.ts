import { NextRequest, NextResponse } from "next/server";
import { getSceneWines } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const wines = await getSceneWines(slug);
  return NextResponse.json(wines);
}
