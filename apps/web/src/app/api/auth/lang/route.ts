import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateMerchantPreferredLang } from "@/lib/merchant-store";

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const slug = cookieStore.get("wb_session")?.value;
  if (!slug || slug === "admin") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { lang } = await request.json();
  if (lang !== "zh-HK" && lang !== "en") {
    return NextResponse.json({ error: "Invalid lang" }, { status: 400 });
  }

  updateMerchantPreferredLang(slug, lang);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("wb_dash_lang", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
