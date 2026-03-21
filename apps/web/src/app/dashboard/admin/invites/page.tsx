"use client";

import { useEffect, useState } from "react";
import { Copy, Plus, CheckCircle } from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  created_at: string;
  expires_at: string | null;
  used_by: string | null;
  used_at: string | null;
}

export default function InviteCodesPage() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(5);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = async () => {
    const res = await fetch("/api/admin/invite-codes");
    const data = await res.json();
    setCodes(data.codes ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    await fetch("/api/admin/invite-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count, expires_in_days: 30 }),
    });
    await fetchCodes();
    setGenerating(false);
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const available = codes.filter((c) => !c.used_by);
  const used = codes.filter((c) => c.used_by);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin h-8 w-8 border-2 border-wine border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-wine-border p-4 text-center">
          <p className="text-2xl font-bold text-wine">{codes.length}</p>
          <p className="text-xs text-text-sub mt-1">總數</p>
        </div>
        <div className="bg-white rounded-xl border border-wine-border p-4 text-center">
          <p className="text-2xl font-bold text-green">{available.length}</p>
          <p className="text-xs text-text-sub mt-1">可用</p>
        </div>
        <div className="bg-white rounded-xl border border-wine-border p-4 text-center">
          <p className="text-2xl font-bold text-text-sub">{used.length}</p>
          <p className="text-xs text-text-sub mt-1">已使用</p>
        </div>
      </div>

      {/* Generate */}
      <div className="bg-white rounded-xl border border-wine-border p-5">
        <h3 className="text-sm font-semibold text-text mb-3">生成邀請碼</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm text-text-sub">數量</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="border border-wine-border rounded-lg px-3 py-1.5 text-sm bg-bg"
          >
            {[1, 3, 5, 10, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 bg-wine text-white text-sm px-4 py-2 rounded-lg hover:bg-wine-dark disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {generating ? "生成中…" : "生成"}
          </button>
        </div>
      </div>

      {/* Available codes */}
      {available.length > 0 && (
        <div className="bg-white rounded-xl border border-wine-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3">可用邀請碼</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {available.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCopy(c.code, c.id)}
                className="flex items-center justify-between gap-2 bg-bg rounded-lg px-3 py-2 text-sm font-mono tracking-wider text-text hover:bg-bg-card transition-colors cursor-pointer"
              >
                {c.code}
                {copiedId === c.id ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-text-sub shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Used codes */}
      {used.length > 0 && (
        <div className="bg-white rounded-xl border border-wine-border p-5">
          <h3 className="text-sm font-semibold text-text mb-3">已使用</h3>
          <div className="space-y-1.5">
            {used.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-bg rounded-lg px-3 py-2 text-sm">
                <span className="font-mono tracking-wider text-text-sub line-through">{c.code}</span>
                <span className="text-xs text-text-sub">
                  {c.used_at ? new Date(c.used_at).toLocaleDateString("zh-HK") : "已使用"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
