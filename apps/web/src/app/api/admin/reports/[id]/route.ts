import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getMockAccount } from "@/lib/mock-auth";
import { createSupabaseServer } from "@/lib/supabase-server";

async function requireAdmin() {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug) return null;
  const account = await getMockAccount(slug);
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "resolved" || status === "dismissed") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("reports")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Report update error:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
