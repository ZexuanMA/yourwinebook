"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Wine } from "lucide-react";
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

  const fillAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Wine className="w-7 h-7 text-[#8B1A1A]" />
            <span className="text-xl font-semibold text-[#1A1A1A]">Your Wine Book</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">酒商後台登入</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Merchant Dashboard</p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E8E0D6] rounded-2xl p-8 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                密碼 Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-[#E8E0D6] rounded-xl text-sm outline-none focus:border-[#B8956A] transition-colors pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#8B1A1A] text-white rounded-xl text-sm font-medium hover:bg-[#6B1515] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "登入中…" : "登入"}
            </button>
          </div>
        </form>

        {/* Demo accounts */}
        <div className="mt-6 bg-white border border-[#E8E0D6] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">
            Demo 帳號（點擊自動填入）
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => fillAccount(a.email, a.password)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#FAF8F5] transition-colors text-left cursor-pointer border border-transparent hover:border-[#E8E0D6]"
              >
                <span className="text-sm font-medium text-[#1A1A1A]">{a.name}</span>
                <span className="text-xs text-[#6B6B6B] font-mono">{a.email}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-[#6B6B6B] mt-3">所有帳號密碼均為 <span className="font-mono font-semibold">demo123</span></p>
        </div>
      </div>
    </div>
  );
}
