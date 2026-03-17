import { NextRequest, NextResponse } from "next/server";
import { getWineBySlug } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const wine = await getWineBySlug(slug);
  if (!wine) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(wine);
}
