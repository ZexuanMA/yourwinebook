"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, CheckCircle, XCircle,
  ExternalLink, ChevronDown, ChevronUp, Plus, X, Eye, MousePointerClick, Heart,
} from "lucide-react";
import type { PerMerchantStats } from "@/lib/analytics-store";

interface MerchantStatsWithFavorites extends PerMerchantStats {
  favoriteCount: number;
}

type AccountStatus = "active" | "inactive";

interface Merchant {
  slug: string;
  name: string;
  email: string;
  role: "merchant";
  status: AccountStatus;
  phone?: string;
  website?: string;
  joinDate: string;
  description?: string;
  winesListed?: number;
  bestPrices?: number;
  rating?: number;
}

const STATUS_CONFIG: Record<AccountStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  active:   { label: "正常",   bg: "bg-green-50",  text: "text-green-700",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  inactive: { label: "已停用", bg: "bg-red-50",    text: "text-red-600",    icon: <XCircle     className="w-3.5 h-3.5" /> },
};

export default function AdminAccountsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "all">("all");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", phone: "", website: "", description: "" });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [merchantStats, setMerchantStats] = useState<Record<string, MerchantStatsWithFavorites>>({});

  const loadMerchants = useCallback(async () => {
    const res = await fetch("/api/admin/accounts");
    if (res.ok) {
      const data = await res.json();
      setMerchants(data.merchants);
    }
  }, []);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/analytics/merchants");
    if (res.ok) {
      const list: MerchantStatsWithFavorites[] = await res.json();
      const map: Record<string, MerchantStatsWithFavorites> = {};
      for (const s of list) map[s.slug] = s;
      setMerchantStats(map);
    }
  }, []);

  useEffect(() => { loadMerchants(); loadStats(); }, [loadMerchants, loadStats]);

  const filtered = merchants.filter((m) => {
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleStatus = async (slug: string, current: AccountStatus) => {
    const next: AccountStatus = current === "active" ? "inactive" : "active";
    const res = await fetch(`/api/admin/accounts/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setMerchants((prev) => prev.map((m) => m.slug === slug ? { ...m, status: next } : m));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const d = await res.json();
        setCreateError(d.error ?? "建立失敗");
        return;
      }
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", phone: "", website: "", description: "" });
      loadMerchants();
    } finally {
      setCreating(false);
    }
  };

  const counts = {
    all: merchants.length,
    active: merchants.filter((m) => m.status === "active").length,
    inactive: merchants.filter((m) => m.status === "inactive").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">酒商帳號管理</h1>
          <p className="text-sm text-text-sub mt-1">查看並管理所有已入駐的酒商帳號</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> 新增酒商
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-text">新增酒商帳號</h2>
              <button onClick={() => setShowCreate(false)} className="text-text-sub hover:text-text cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {[
                { label: "酒商名稱 *", key: "name", type: "text", placeholder: "Watson's Wine" },
                { label: "Email *", key: "email", type: "email", placeholder: "contact@merchant.com" },
                { label: "密碼 *", key: "password", type: "password", placeholder: "至少8位" },
                { label: "電話", key: "phone", type: "text", placeholder: "+852 xxxx xxxx" },
                { label: "網站", key: "website", type: "url", placeholder: "https://..." },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-text-sub mb-1">{label}</label>
                  <input
                    type={type}
                    value={createForm[key as keyof typeof createForm]}
                    onChange={(e) => setCreateForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    required={label.endsWith("*")}
                    className="w-full px-3 py-2 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-text-sub mb-1">商家簡介</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="簡短介紹..."
                  rows={2}
                  className="w-full px-3 py-2 bg-bg border border-wine-border rounded-xl text-sm outline-none focus:border-gold transition-colors resize-none"
                />
              </div>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-wine-border rounded-xl text-sm text-text-sub hover:bg-bg transition-colors cursor-pointer">取消</button>
                <button type="submit" disabled={creating} className="flex-1 py-2 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors disabled:opacity-50 cursor-pointer">
                  {creating ? "建立中…" : "建立帳號"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(["all", "active", "inactive"] as const).map((key) => {
          const labels = { all: "全部帳號", active: "正常運營", inactive: "已停用" };
          const colors = { all: "text-text", active: "text-green-600", inactive: "text-red-500" };
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`bg-white border rounded-2xl px-5 py-4 text-left hover:shadow-md transition-all cursor-pointer ${filterStatus === key ? "border-wine shadow-sm" : "border-wine-border"}`}
            >
              <p className={`text-2xl font-bold ${colors[key]}`}>{counts[key]}</p>
              <p className="text-sm text-text-sub mt-0.5">{labels[key]}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索酒商名稱或 Email…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold transition-colors placeholder:text-text-sub/40"
        />
      </div>

      {/* Accounts table */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-text-sub text-sm">沒有符合條件的帳號</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg border-b border-wine-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">酒商</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">Email</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">狀態</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">入駐日期</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0EA]">
              {filtered.map((m) => {
                const status = m.status;
                const cfg = STATUS_CONFIG[status];
                const isExpanded = expandedSlug === m.slug;
                return (
                  <>
                    <tr key={m.slug} className="hover:bg-bg transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-wine rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {m.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-text">{m.name}</p>
                            {m.website && (
                              <a href={m.website} target="_blank" rel="noreferrer" className="text-xs text-text-sub/60 hover:text-gold flex items-center gap-0.5 transition-colors">
                                {m.website.replace("https://", "")} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-sub">{m.email}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-text-sub text-xs">
                        {new Date(m.joinDate).toLocaleDateString("zh-HK")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedSlug(isExpanded ? null : m.slug)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-bg border border-wine-border rounded-lg text-xs text-text-sub hover:border-gold hover:text-text transition-all cursor-pointer"
                          >
                            詳情 {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => toggleStatus(m.slug, status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                              status === "active"
                                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-100"
                            }`}
                          >
                            {status === "active" ? "停用" : "啟用"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr key={`${m.slug}-detail`} className="bg-bg">
                        <td colSpan={5} className="px-6 py-5">
                          <div className="grid grid-cols-3 gap-6 mb-5">
                            <div>
                              <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2">聯繫資料</p>
                              <p className="text-sm text-text">{m.phone ?? "未提供"}</p>
                              <p className="text-sm text-text-sub">{m.email}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2">入駐資料</p>
                              <p className="text-sm text-text">Slug: {m.slug}</p>
                              <p className="text-sm text-text-sub">加入於 {new Date(m.joinDate).toLocaleDateString("zh-HK")}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2">商家簡介</p>
                              <p className="text-sm text-text-sub leading-relaxed">{m.description ?? "未填寫"}</p>
                            </div>
                          </div>
                          {/* Analytics stats */}
                          <div>
                            <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-3">平台數據</p>
                            <div className="grid grid-cols-4 gap-3">
                              {(() => {
                                const s = merchantStats[m.slug];
                                const views = s?.wineViews ?? 0;
                                const clicks = s?.priceClicks ?? 0;
                                const rate = views > 0 ? Math.round((clicks / views) * 100) : 0;
                                const favs = s?.favoriteCount ?? 0;
                                return (
                                  <>
                                    <div className="bg-white border border-wine-border rounded-xl px-4 py-3 flex items-center gap-3">
                                      <div className="p-2 bg-red-light rounded-lg shrink-0">
                                        <Eye className="w-3.5 h-3.5 text-wine" />
                                      </div>
                                      <div>
                                        <p className="text-lg font-bold text-text">{views.toLocaleString()}</p>
                                        <p className="text-[11px] text-text-sub">酒款頁瀏覽</p>
                                      </div>
                                    </div>
                                    <div className="bg-white border border-wine-border rounded-xl px-4 py-3 flex items-center gap-3">
                                      <div className="p-2 bg-green-50 rounded-lg shrink-0">
                                        <MousePointerClick className="w-3.5 h-3.5 text-green-700" />
                                      </div>
                                      <div>
                                        <p className="text-lg font-bold text-text">{clicks.toLocaleString()}</p>
                                        <p className="text-[11px] text-text-sub">比價點擊</p>
                                      </div>
                                    </div>
                                    <div className="bg-white border border-wine-border rounded-xl px-4 py-3 flex items-center gap-3">
                                      <div className="p-2 bg-orange-50 rounded-lg shrink-0">
                                        <MousePointerClick className="w-3.5 h-3.5 text-orange-600" />
                                      </div>
                                      <div>
                                        <p className={`text-lg font-bold ${rate >= 10 ? "text-green-600" : "text-text"}`}>{rate}%</p>
                                        <p className="text-[11px] text-text-sub">轉化率</p>
                                      </div>
                                    </div>
                                    <div className="bg-white border border-wine-border rounded-xl px-4 py-3 flex items-center gap-3">
                                      <div className="p-2 bg-red-light rounded-lg shrink-0">
                                        <Heart className="w-3.5 h-3.5 text-wine" />
                                      </div>
                                      <div>
                                        <p className="text-lg font-bold text-text">{favs}</p>
                                        <p className="text-[11px] text-text-sub">被收藏量</p>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
