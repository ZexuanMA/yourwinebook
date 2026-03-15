"use client";

import { useState } from "react";
import { getAllMerchants } from "@/lib/mock-auth";
import { merchants } from "@/lib/mock-data";
import {
  Search, CheckCircle, XCircle, Clock,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";

type AccountStatus = "active" | "inactive" | "pending";

const STATUS_CONFIG: Record<AccountStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  active:   { label: "正常",   bg: "bg-green-50",  text: "text-green-700",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  inactive: { label: "已停用", bg: "bg-red-50",    text: "text-red-600",    icon: <XCircle     className="w-3.5 h-3.5" /> },
  pending:  { label: "待審核", bg: "bg-amber-50",  text: "text-amber-700",  icon: <Clock       className="w-3.5 h-3.5" /> },
};

export default function AdminAccountsPage() {
  const allMerchants = getAllMerchants();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AccountStatus | "all">("all");
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AccountStatus>>(
    Object.fromEntries(allMerchants.map((m) => [m.slug, m.status]))
  );

  const filtered = allMerchants.filter((m) => {
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || statuses[m.slug] === filterStatus;
    return matchSearch && matchStatus;
  });

  const toggleStatus = (slug: string) => {
    setStatuses((prev) => ({
      ...prev,
      [slug]: prev[slug] === "active" ? "inactive" : "active",
    }));
  };

  const counts = {
    all: allMerchants.length,
    active: allMerchants.filter((m) => statuses[m.slug] === "active").length,
    inactive: allMerchants.filter((m) => statuses[m.slug] === "inactive").length,
    pending: allMerchants.filter((m) => statuses[m.slug] === "pending").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text">酒商帳號管理</h1>
        <p className="text-sm text-text-sub mt-1">查看並管理所有已入駐的酒商帳號</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {(["all", "active", "inactive", "pending"] as const).map((key) => {
          const labels = { all: "全部帳號", active: "正常運營", inactive: "已停用", pending: "待審核" };
          const colors = { all: "text-text", active: "text-green-600", inactive: "text-red-500", pending: "text-amber-600" };
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
                <th className="text-right px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">上架酒款</th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">評分</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">狀態</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">入駐日期</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0EA]">
              {filtered.map((m) => {
                const info = merchants.find((x) => x.slug === m.slug);
                const status = statuses[m.slug] as AccountStatus;
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
                      <td className="px-4 py-4 text-right font-semibold text-text">{info?.winesListed ?? "—"}</td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-semibold text-text">{info?.rating?.toFixed(1) ?? "—"}</span>
                        <span className="text-text-sub/50 text-xs"> ★</span>
                      </td>
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
                          {status !== "pending" && (
                            <button
                              onClick={() => toggleStatus(m.slug)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                                status === "active"
                                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                                  : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-100"
                              }`}
                            >
                              {status === "active" ? "停用" : "啟用"}
                            </button>
                          )}
                          {status === "pending" && (
                            <button
                              onClick={() => setStatuses((p) => ({ ...p, [m.slug]: "active" }))}
                              className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-100 rounded-lg text-xs font-medium cursor-pointer hover:bg-green-100 transition-all"
                            >
                              審核通過
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr key={`${m.slug}-detail`} className="bg-bg">
                        <td colSpan={7} className="px-6 py-5">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2">聯繫資料</p>
                              <p className="text-sm text-text">{m.phone ?? "未提供"}</p>
                              <p className="text-sm text-text-sub">{m.email}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2">平台數據</p>
                              <p className="text-sm text-text">{info?.winesListed ?? 0} 款上架 · {info?.bestPrices ?? 0} 款最低價</p>
                              <p className="text-sm text-text-sub">評分 {info?.rating?.toFixed(1) ?? "—"} ★</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-2">商家簡介</p>
                              <p className="text-sm text-text-sub leading-relaxed">{m.description ?? "未填寫"}</p>
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

      <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <span className="font-semibold">Demo 模式：</span>停用/啟用操作僅影響當前頁面狀態，重整後恢復。接入 Supabase 後將持久化。
      </div>
    </div>
  );
}
