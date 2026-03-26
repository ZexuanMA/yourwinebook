"use client";

import { useState, useEffect, useCallback } from "react";
import { wines } from "@/lib/mock-data";
import { getDisplayInitial } from "@/lib/display-name";
import { Search, CheckCircle, XCircle, Bookmark, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

type UserStatus = "active" | "suspended";

interface User {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  preferredLang: "zh-HK" | "en";
  joinDate: string;
  lastSeen: string;
  bookmarks: string[];
}

const STATUS_CONFIG: Record<UserStatus, { label: string; bg: string; text: string }> = {
  active:    { label: "正常",   bg: "bg-green-50", text: "text-green-700" },
  suspended: { label: "已停用", bg: "bg-red-50",   text: "text-red-600"  },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (user: User) => {
    const next: UserStatus = user.status === "active" ? "suspended" : "active";
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: next } : u));
      }
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text">用戶管理</h1>
          <p className="text-sm text-text-sub mt-1">查看並管理所有已注冊的用戶帳號</p>
        </div>
        <button onClick={fetchUsers} disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-wine-border rounded-xl text-xs text-text-sub hover:border-gold hover:text-text transition-all cursor-pointer disabled:opacity-50 shrink-0 self-start">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["all", "active", "suspended"] as const).map((key) => {
          const labels = { all: "全部用戶", active: "正常帳號", suspended: "已停用" };
          const colors = { all: "text-text", active: "text-green-600", suspended: "text-red-500" };
          return (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={`bg-white border rounded-2xl px-5 py-4 text-left hover:shadow-md transition-all cursor-pointer ${filterStatus === key ? "border-wine shadow-sm" : "border-wine-border"}`}>
              <p className={`text-2xl font-bold ${colors[key]}`}>{loading ? "—" : counts[key]}</p>
              <p className="text-sm text-text-sub mt-0.5">{labels[key]}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub/50" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索姓名或 Email…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold transition-colors placeholder:text-text-sub/40"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-text-sub text-sm">載入中…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text-sub text-sm">沒有符合條件的用戶</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-bg border-b border-wine-border">
                <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">用戶</th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">慣用語言</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">收藏數</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">加入日期</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">最後上線</th>
                <th className="text-center px-4 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">狀態</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-text-sub uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0EA]">
              {filtered.map((u) => {
                const cfg = STATUS_CONFIG[u.status];
                const isExpanded = expandedId === u.id;
                const bookmarkedWines = wines.filter((w) => u.bookmarks.includes(w.slug));
                return (
                  <>
                    <tr key={u.id} className="hover:bg-bg transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-wine/10 border border-wine/20 rounded-xl flex items-center justify-center text-wine font-bold text-sm shrink-0">
                            {getDisplayInitial(u.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-text">{u.name}</p>
                            <p className="text-xs text-text-sub">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-sub text-sm">
                        {u.preferredLang === "zh-HK" ? "繁體中文" : "English"}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Bookmark className="w-3.5 h-3.5 text-text-sub/50" />
                          <span className="font-semibold text-text">{u.bookmarks.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-text-sub text-xs">
                        {new Date(u.joinDate).toLocaleDateString("zh-HK")}
                      </td>
                      <td className="px-4 py-4 text-center text-text-sub text-xs">
                        {new Date(u.lastSeen).toLocaleDateString("zh-HK")}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          {u.status === "active"
                            ? <CheckCircle className="w-3.5 h-3.5" />
                            : <XCircle    className="w-3.5 h-3.5" />}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.bookmarks.length > 0 && (
                            <button onClick={() => setExpandedId(isExpanded ? null : u.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-bg border border-wine-border rounded-lg text-xs text-text-sub hover:border-gold hover:text-text transition-all cursor-pointer">
                              收藏 {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                          <button onClick={() => toggleStatus(u)} disabled={togglingId === u.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all disabled:opacity-50 ${
                              u.status === "active"
                                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-100"
                            }`}>
                            {togglingId === u.id ? "…" : u.status === "active" ? "停用" : "啟用"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded bookmarks */}
                    {isExpanded && (
                      <tr key={`${u.id}-detail`} className="bg-bg">
                        <td colSpan={7} className="px-6 py-4">
                          <p className="text-xs font-semibold text-text-sub uppercase tracking-wider mb-3">收藏酒款</p>
                          <div className="flex flex-wrap gap-2">
                            {bookmarkedWines.map((w) => (
                              <span key={w.slug} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-wine-border rounded-xl text-xs font-medium text-text">
                                <span>{w.emoji}</span> {w.name}
                                <span className="text-text-sub/60">HK${w.minPrice}</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
