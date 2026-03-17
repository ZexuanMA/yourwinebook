import { NextResponse } from "next/server";
import { getScenes } from "@/lib/queries";

export async function GET() {
  const scenes = await getScenes();
  return NextResponse.json(scenes);
}
