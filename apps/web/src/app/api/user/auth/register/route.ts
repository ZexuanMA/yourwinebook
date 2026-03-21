import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/lib/user-store";
import { USE_SUPABASE_AUTH, supabaseSignUp } from "@/lib/supabase-auth";
import { checkRateLimit, getClientIp, REGISTER_RATE_LIMIT } from "@/lib/rate-limit";
import { createSupabaseServer } from "@/lib/supabase-server";

const REQUIRE_INVITE_CODE = process.env.REQUIRE_INVITE_CODE === "true";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, REGISTER_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const { name, email, password, inviteCode } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "請填寫所有必填項" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "密碼至少需要 6 個字符" },
      { status: 400 }
    );
  }

  // ── Invite code validation ──
  let inviteCodeId: string | null = null;
  if (REQUIRE_INVITE_CODE) {
    if (!inviteCode) {
      return NextResponse.json(
        { error: "需要邀請碼才能注冊" },
        { status: 400 }
      );
    }
    const supabase = await createSupabaseServer();
    if (supabase) {
      const { data: codeData } = await supabase
        .from("invite_codes")
        .select("id, used_by, expires_at")
        .eq("code", inviteCode.toUpperCase())
        .is("used_by", null)
        .single();

      if (!codeData) {
        return NextResponse.json(
          { error: "邀請碼無效或已被使用" },
          { status: 400 }
        );
      }
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        return NextResponse.json(
          { error: "邀請碼已過期" },
          { status: 400 }
        );
      }
      inviteCodeId = codeData.id;
    }
  }

  // ── Supabase Auth path ──
  if (USE_SUPABASE_AUTH) {
    const authUser = await supabaseSignUp(email, password, name);
    if (!authUser) {
      return NextResponse.json(
        { error: "該 Email 已被注冊" },
        { status: 409 }
      );
    }

    const user = {
      id: authUser.id,
      name: authUser.displayName,
      email: authUser.email,
      status: authUser.status,
    };

    // Mark invite code as used
    if (inviteCodeId) {
      const sb = await createSupabaseServer();
      if (sb) {
        await sb.from("invite_codes").update({ used_by: user.id, used_at: new Date().toISOString() }).eq("id", inviteCodeId);
      }
    }

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set("wb_user_session", user.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return res;
  }

  // ── Legacy path ──
  const user = await registerUser(name, email, password);
  if (!user) {
    return NextResponse.json(
      { error: "該 Email 已被注冊" },
      { status: 409 }
    );
  }

  // Mark invite code as used (legacy path)
  if (inviteCodeId) {
    const sb = await createSupabaseServer();
    if (sb) {
      await sb.from("invite_codes").update({ used_by: user.id, used_at: new Date().toISOString() }).eq("id", inviteCodeId);
    }
  }

  const res = NextResponse.json({ ok: true, user });
  res.cookies.set("wb_user_session", user.id, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
  return res;
}
