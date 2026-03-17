import { NextRequest, NextResponse } from "next/server";
import { getMockUser } from "@/lib/mock-users";

export async function GET(request: NextRequest) {
  const id = request.cookies.get("wb_user_session")?.value;
  if (!id) return NextResponse.json(null, { status: 401 });
  const user = getMockUser(id);
  if (!user) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(user);
}
