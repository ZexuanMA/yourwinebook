"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function UserLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/user/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "登入失敗"); return; }
      router.push("/account");
    } catch { setError("網絡錯誤，請重試"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-text">歡迎回來</h1>
          <p className="text-sm text-text-sub mt-1">登入你的 Your Wine Book 帳號</p>
        </div>

        <div className="bg-white border border-wine-border rounded-2xl p-7 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all placeholder:text-text-sub/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">密碼</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all pr-11"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-sub hover:text-text transition-colors cursor-pointer">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-wine bg-red-light px-4 py-2.5 rounded-xl">⚠ {error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors disabled:opacity-50 cursor-pointer mt-1">
              {loading ? "登入中…" : "登入"}
            </button>
          </form>

        </div>

        <p className="text-center text-sm text-text-sub mt-5">
          還沒有帳號？{" "}
          <Link href="/account/register" className="text-wine font-medium hover:underline">立即注冊</Link>
        </p>
      </div>
    </div>
  );
}
