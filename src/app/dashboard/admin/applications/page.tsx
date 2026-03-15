"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, MessageSquare, Phone, Globe, Search } from "lucide-react";

interface MerchantApplication {
  id: string; companyName: string; contactName: string; email: string;
  phone: string; wineCount: number; website?: string; message?: string;
  status: "pending" | "contacted" | "approved" | "rejected"; submittedAt: string;
}

type AppStatus = MerchantApplication["status"];

const STATUS_CONFIG: Record<AppStatus, { label: string; bg: string; text: string; border: string }> = {
  pending:   { label: "待處理", bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  contacted: { label: "已聯繫", bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"  },
  approved:  { label: "已批准", bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  rejected:  { label: "已拒絕", bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200"   },
};

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState<MerchantApplication[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AppStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadApps = useCallback(async () => {
    const res = await fetch("/api/admin/applications");
    if (res.ok) {
      const data = await res.json();
      setApps(data.applications);
    }
  }, []);

  useEffect(() => { loadApps(); }, [loadApps]);

  const updateStatus = async (id: string, status: AppStatus) => {
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    }
  };

  const filtered = apps.filter((a) => {
    const matchSearch =
      !search ||
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.contactName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: apps.length,
    pending: apps.filter((a) => a.status === "pending").length,
    contacted: apps.filter((a) => a.status === "contacted").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text">入駐申請管理</h1>
        <p className="text-sm text-text-sub mt-1">審核通過申請的酒商，審核後可聯繫對方開通帳號</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "contacted", "approved", "rejected"] as const).map((key) => {
          const labels = { all: "全部", pending: "待處理", contacted: "已聯繫", approved: "已批准", rejected: "已拒絕" };
          const active = filterStatus === key;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer border ${
                active ? "bg-wine text-white border-wine" : "bg-white text-text-sub border-wine-border hover:border-gold"
              }`}
            >
              {labels[key]}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-bg-card text-text-sub"}`}>
                {counts[key]}
              </span>
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
          placeholder="搜索公司名、聯繫人或 Email…"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold transition-colors placeholder:text-text-sub/40"
        />
      </div>

      {/* Applications list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-wine-border rounded-2xl py-16 text-center text-text-sub text-sm">
            沒有符合條件的申請
          </div>
        ) : (
          filtered.map((app) => {
            const cfg = STATUS_CONFIG[app.status];
            const isExpanded = expandedId === app.id;
            const submittedDate = new Date(app.submittedAt).toLocaleDateString("zh-HK", {
              year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
            });

            return (
              <div key={app.id} className="bg-white border border-wine-border rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                {/* Card header */}
                <div className="px-6 py-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-light rounded-xl flex items-center justify-center text-wine font-bold shrink-0">
                    {app.companyName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-text">{app.companyName}</p>
                        <p className="text-sm text-text-sub mt-0.5">
                          聯繫人：{app.contactName} · {app.wineCount} 款酒款
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {app.status === "pending"   && <Clock       className="w-3 h-3" />}
                          {app.status === "contacted" && <MessageSquare className="w-3 h-3" />}
                          {app.status === "approved"  && <CheckCircle  className="w-3 h-3" />}
                          {app.status === "rejected"  && <XCircle      className="w-3 h-3" />}
                          {cfg.label}
                        </span>
                        <span className="text-xs text-text-sub">{submittedDate}</span>
                      </div>
                    </div>

                    {/* Contact pills */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a href={`mailto:${app.email}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg border border-wine-border rounded-lg text-xs text-text-sub hover:border-gold hover:text-text transition-all">
                        ✉ {app.email}
                      </a>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg border border-wine-border rounded-lg text-xs text-text-sub">
                        <Phone className="w-3 h-3" /> {app.phone}
                      </span>
                      {app.website && (
                        <a href={app.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg border border-wine-border rounded-lg text-xs text-text-sub hover:border-gold hover:text-text transition-all">
                          <Globe className="w-3 h-3" /> {app.website.replace("https://", "")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable message */}
                {app.message && (
                  <div className="px-6 pb-4">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      className="text-xs text-text-sub hover:text-text transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {isExpanded ? "收起申請說明" : "查看申請說明"}
                    </button>
                    {isExpanded && (
                      <div className="mt-2 px-4 py-3 bg-bg border border-wine-border rounded-xl text-sm text-text leading-relaxed">
                        {app.message}
                      </div>
                    )}
                  </div>
                )}

                {/* Action bar */}
                <div className="px-6 py-3.5 bg-bg border-t border-wine-border flex items-center justify-end gap-2">
                  {app.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(app.id, "contacted")}
                        className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        標記已聯繫
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "rejected")}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        拒絕申請
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "approved")}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        批准入駐
                      </button>
                    </>
                  )}
                  {app.status === "contacted" && (
                    <>
                      <button
                        onClick={() => updateStatus(app.id, "rejected")}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        拒絕申請
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "approved")}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        批准入駐
                      </button>
                    </>
                  )}
                  {(app.status === "approved" || app.status === "rejected") && (
                    <button
                      onClick={() => updateStatus(app.id, "pending")}
                      className="px-4 py-2 bg-bg border border-wine-border rounded-xl text-xs text-text-sub hover:border-gold transition-colors cursor-pointer"
                    >
                      重置為待處理
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
