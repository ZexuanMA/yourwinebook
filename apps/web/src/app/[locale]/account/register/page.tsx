"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", inviteCode: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const passwordStrength = (pw: string) => {
    if (pw.length === 0) return null;
    if (pw.length < 6) return { label: "太短", color: "bg-red-400", width: "w-1/4" };
    if (pw.length < 8 || !/[0-9]/.test(pw)) return { label: "一般", color: "bg-amber-400", width: "w-2/4" };
    if (!/[A-Z]/.test(pw)) return { label: "良好", color: "bg-blue-400", width: "w-3/4" };
    return { label: "強", color: "bg-green-500", width: "w-full" };
  };

  const strength = passwordStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("兩次密碼不一致"); return; }
    if (form.password.length < 6) { setError("密碼至少 6 個字符"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/user/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, inviteCode: form.inviteCode || undefined }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "注冊失敗"); return; }
      router.push("/account");
    } catch { setError("網絡錯誤，請重試"); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all placeholder:text-text-sub/40";

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text">創建帳號</h1>
          <p className="text-sm text-text-sub mt-1">加入 Your Wine Book，收藏心儀酒款</p>
        </div>

        <div className="bg-white border border-wine-border rounded-2xl p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">暱稱</label>
              <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="你的名字" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)}
                placeholder="your@email.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">密碼</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={form.password}
                  onChange={(e) => set("password", e.target.value)} placeholder="至少 6 個字符"
                  className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-sub hover:text-text transition-colors cursor-pointer">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {strength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bg-card rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <span className="text-xs text-text-sub">{strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">確認密碼</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)} placeholder="再次輸入密碼"
                  className={`${inputCls} pr-11`} />
                {form.confirm && form.password === form.confirm && (
                  <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">邀請碼 <span className="text-text-sub font-normal">(如有)</span></label>
              <input type="text" value={form.inviteCode} onChange={(e) => set("inviteCode", e.target.value.toUpperCase())}
                placeholder="XXXXXXXX" maxLength={8} className={`${inputCls} uppercase tracking-widest font-mono`} />
            </div>
            {error && <p className="text-sm text-wine bg-red-light px-4 py-2.5 rounded-xl">⚠ {error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors disabled:opacity-50 cursor-pointer mt-1">
              {loading ? "注冊中…" : "創建帳號"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-sub mt-5">
          已有帳號？{" "}
          <Link href="/account/login" className="text-wine font-medium hover:underline">立即登入</Link>
        </p>
      </div>
    </div>
  );
}
