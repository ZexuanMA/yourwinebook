"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { DEMO_ACCOUNTS } from "@/lib/mock-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "登入失敗");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("網絡錯誤，請重試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[480px] bg-wine flex-col justify-between p-12 shrink-0 relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-16">
            <span className="text-2xl">🍷</span>
            <span className="font-en text-lg font-bold text-white tracking-wide">Your Wine Book</span>
          </div>
          <h1 className="font-en text-4xl font-bold text-white leading-tight mb-4">
            酒商後台
            <br />
            <span className="text-gold-light">管理中心</span>
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            管理你的上架酒款、追蹤比價排名、<br />更新定價和購買連結。
          </p>
        </div>

        {/* Decorative wine bottles */}
        <div className="relative flex items-end justify-center gap-4 mb-8">
          {["🍷", "🥂", "🍾", "🌸", "🍯"].map((emoji, i) => (
            <div
              key={i}
              className="text-4xl opacity-20 hover:opacity-40 transition-opacity"
              style={{ transform: `translateY(${[0, -8, -16, -8, 0][i]}px)` }}
            >
              {emoji}
            </div>
          ))}
        </div>

        <p className="relative text-white/30 text-xs">
          © 2025 Your Wine Book · Merchant Portal
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-bg flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-xl">🍷</span>
            <span className="font-en text-base font-bold text-wine">Your Wine Book</span>
          </div>

          <h2 className="text-2xl font-semibold text-text mb-1">歡迎回來</h2>
          <p className="text-sm text-text-sub mb-8">使用你的酒商帳號登入</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(184,149,106,0.12)] transition-all placeholder:text-text-sub/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">密碼</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(184,149,106,0.12)] transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-sub hover:text-text transition-colors cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-light border border-red-200 rounded-xl text-sm text-wine">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors disabled:opacity-50 cursor-pointer mt-2 shadow-sm"
            >
              {loading ? "登入中…" : "登入後台"}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-wine-border" />
              <span className="text-xs text-text-sub">快速登入</span>
              <div className="h-px flex-1 bg-wine-border" />
            </div>
            {/* Admin account */}
            {DEMO_ACCOUNTS.filter((a) => a.role === "admin").map((a) => (
              <button
                key={a.email}
                onClick={() => { setEmail(a.email); setPassword("admin123"); setError(""); }}
                className="w-full text-left px-3 py-2.5 bg-wine/5 border border-wine/20 rounded-xl hover:border-wine hover:shadow-sm transition-all cursor-pointer group mb-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-wine truncate">{a.name}</p>
                  <span className="text-[10px] bg-wine text-white px-1.5 py-0.5 rounded-full">管理員</span>
                </div>
                <p className="text-[11px] text-text-sub/60 mt-0.5 truncate">{a.email} · admin123</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
