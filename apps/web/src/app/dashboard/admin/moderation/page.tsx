"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  MessageSquare,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

interface Report {
  id: string;
  reporter_id: string;
  target_type: "post" | "comment" | "user";
  target_id: string;
  reason: string;
  details?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

type ReportStatus = Report["status"];

const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; bg: string; text: string; border: string; icon: typeof Clock }
> = {
  pending: {
    label: "待處理",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
  reviewed: {
    label: "審核中",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: ShieldAlert,
  },
  resolved: {
    label: "已處理",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    icon: CheckCircle,
  },
  dismissed: {
    label: "已駁回",
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    icon: XCircle,
  },
};

const TARGET_TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof FileText }
> = {
  post: { label: "帖子", icon: FileText },
  comment: { label: "評論", icon: MessageSquare },
  user: { label: "用戶", icon: User },
};

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReportStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [contentCache, setContentCache] = useState<Record<string, { type: string; content: Record<string, unknown>; media?: Array<{ url: string }> }>>({});
  const [loadingContent, setLoadingContent] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/admin/reports${params}`);
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports);
        setError("");
      } else {
        setError(data.error ?? "Failed to load reports");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateStatus = async (id: string, newStatus: ReportStatus) => {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    }
  };

  const loadContent = async (report: Report) => {
    const key = `${report.target_type}:${report.target_id}`;
    if (contentCache[key]) return;
    setLoadingContent(report.id);
    try {
      const res = await fetch(
        `/api/admin/content?type=${report.target_type}&id=${report.target_id}`
      );
      if (res.ok) {
        const data = await res.json();
        setContentCache((prev) => ({ ...prev, [key]: data }));
      }
    } finally {
      setLoadingContent(null);
    }
  };

  const hideContent = async (report: Report) => {
    setActionLoading(report.id);
    try {
      const action =
        report.target_type === "post" ? "hide_post" : "hide_comment";
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          target_id: report.target_id,
          reason: report.reason,
        }),
      });
      if (res.ok) {
        // Update content cache to reflect hidden status
        const key = `${report.target_type}:${report.target_id}`;
        setContentCache((prev) => {
          const cached = prev[key];
          if (cached) {
            return {
              ...prev,
              [key]: {
                ...cached,
                content: { ...cached.content, status: "hidden" },
              },
            };
          }
          return prev;
        });
        // Auto-resolve the report
        await updateStatus(report.id, "resolved");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        r.reason.toLowerCase().includes(q) ||
        r.details?.toLowerCase().includes(q) ||
        r.target_id.toLowerCase().includes(q) ||
        r.reporter_id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    reviewed: reports.filter((r) => r.status === "reviewed").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-6 h-6 text-wine" />
        <h1 className="text-2xl font-bold text-text">審核管理</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(["pending", "reviewed", "resolved", "dismissed"] as ReportStatus[]).map(
          (s) => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  filterStatus === s
                    ? `${cfg.bg} ${cfg.border} ring-2 ring-offset-1 ring-wine/20`
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${cfg.text}`} />
                  <span className={`text-sm font-medium ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-text">{counts[s]}</p>
              </button>
            );
          }
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-sub" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索舉報原因、詳情、ID..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-text placeholder:text-text-sub/50 focus:outline-none focus:ring-2 focus:ring-wine/20 focus:border-wine"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="inline w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-text-sub">載入中...</div>
      )}

      {/* Empty State */}
      {!loading && filteredReports.length === 0 && (
        <div className="text-center py-12">
          <ShieldAlert className="w-12 h-12 mx-auto text-text-sub/30 mb-3" />
          <p className="text-text-sub">
            {reports.length === 0
              ? "目前沒有任何舉報"
              : "沒有符合條件的舉報"}
          </p>
        </div>
      )}

      {/* Report List */}
      <div className="space-y-3">
        {filteredReports.map((report) => {
          const statusCfg = STATUS_CONFIG[report.status];
          const typeCfg =
            TARGET_TYPE_CONFIG[report.target_type] ?? TARGET_TYPE_CONFIG.post;
          const TypeIcon = typeCfg.icon;
          const isExpanded = expandedId === report.id;

          return (
            <div
              key={report.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : report.id)
                }
                className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50/50 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg ${statusCfg.bg} ${statusCfg.border} border`}
                >
                  <TypeIcon className={`w-4 h-4 ${statusCfg.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} border`}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="text-xs text-text-sub">
                      {typeCfg.label}
                    </span>
                    <span className="text-xs text-text-sub">
                      {new Date(report.created_at).toLocaleDateString("zh-HK")}
                    </span>
                  </div>
                  <p className="text-sm text-text truncate">{report.reason}</p>
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-sub shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-sub shrink-0" />
                )}
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 py-3 text-sm">
                    <div>
                      <span className="text-text-sub">舉報 ID</span>
                      <p className="font-mono text-xs text-text mt-0.5">
                        {report.id}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-sub">目標 ID</span>
                      <p className="font-mono text-xs text-text mt-0.5">
                        {report.target_id}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-sub">舉報者 ID</span>
                      <p className="font-mono text-xs text-text mt-0.5">
                        {report.reporter_id}
                      </p>
                    </div>
                    <div>
                      <span className="text-text-sub">舉報類型</span>
                      <p className="text-text mt-0.5">{typeCfg.label}</p>
                    </div>
                  </div>

                  <div className="py-3 border-t border-gray-100">
                    <span className="text-sm text-text-sub">舉報原因</span>
                    <p className="text-sm text-text mt-1">{report.reason}</p>
                  </div>

                  {report.details && (
                    <div className="py-3 border-t border-gray-100">
                      <span className="text-sm text-text-sub">補充說明</span>
                      <p className="text-sm text-text mt-1 whitespace-pre-wrap">
                        {report.details}
                      </p>
                    </div>
                  )}

                  {/* Content Preview */}
                  {(() => {
                    const key = `${report.target_type}:${report.target_id}`;
                    const cached = contentCache[key];
                    const isContentHidden = cached?.content?.status === "hidden";

                    return (
                      <div className="py-3 border-t border-gray-100">
                        {!cached ? (
                          <button
                            onClick={() => loadContent(report)}
                            disabled={loadingContent === report.id}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 text-text border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            {loadingContent === report.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            查看原始內容
                          </button>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-text-sub">原始內容</span>
                              {isContentHidden && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                  已隱藏
                                </span>
                              )}
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm text-text">
                              <p className="whitespace-pre-wrap">
                                {String(cached.content.content ?? "")}
                              </p>
                              {cached.media && cached.media.length > 0 && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {cached.media.map((m, idx) => (
                                    <div
                                      key={idx}
                                      className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-xs text-text-sub"
                                    >
                                      圖{idx + 1}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {/* Hide/Unhide or Ban/Unban */}
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {(report.target_type === "post" || report.target_type === "comment") && (
                                <>
                                  {isContentHidden ? (
                                    <button
                                      onClick={async () => {
                                        setActionLoading(report.id);
                                        try {
                                          const action = report.target_type === "post" ? "unhide_post" : "unhide_comment";
                                          await fetch("/api/admin/moderate", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ action, target_id: report.target_id }),
                                          });
                                          setContentCache((prev) => ({
                                            ...prev,
                                            [key]: { ...cached, content: { ...cached.content, status: "visible" } },
                                          }));
                                        } finally {
                                          setActionLoading(null);
                                        }
                                      }}
                                      disabled={actionLoading === report.id}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      恢復顯示
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => hideContent(report)}
                                      disabled={actionLoading === report.id}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                      {actionLoading === report.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <EyeOff className="w-3.5 h-3.5" />
                                      )}
                                      一鍵隱藏
                                    </button>
                                  )}
                                </>
                              )}
                              {report.target_type === "user" && (
                                <>
                                  {cached.content.status === "banned" ? (
                                    <button
                                      onClick={async () => {
                                        setActionLoading(report.id);
                                        try {
                                          await fetch("/api/admin/moderate", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ action: "unban_user", target_id: report.target_id }),
                                          });
                                          setContentCache((prev) => ({
                                            ...prev,
                                            [key]: { ...cached, content: { ...cached.content, status: "active" } },
                                          }));
                                        } finally {
                                          setActionLoading(null);
                                        }
                                      }}
                                      disabled={actionLoading === report.id}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                                    >
                                      <User className="w-3.5 h-3.5" />
                                      解除封禁
                                    </button>
                                  ) : (
                                    <button
                                      onClick={async () => {
                                        if (!confirm("確定要封禁此用戶？其所有帖子和評論將被隱藏。")) return;
                                        setActionLoading(report.id);
                                        try {
                                          await fetch("/api/admin/moderate", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                              action: "ban_user",
                                              target_id: report.target_id,
                                              reason: report.reason,
                                            }),
                                          });
                                          setContentCache((prev) => ({
                                            ...prev,
                                            [key]: { ...cached, content: { ...cached.content, status: "banned" } },
                                          }));
                                          await updateStatus(report.id, "resolved");
                                        } finally {
                                          setActionLoading(null);
                                        }
                                      }}
                                      disabled={actionLoading === report.id}
                                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                      {actionLoading === report.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                      )}
                                      封禁用戶
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {report.resolved_at && (
                    <div className="py-3 border-t border-gray-100 text-sm text-text-sub">
                      處理時間：
                      {new Date(report.resolved_at).toLocaleString("zh-HK")}
                    </div>
                  )}

                  {/* Actions */}
                  {(report.status === "pending" ||
                    report.status === "reviewed") && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      {report.status === "pending" && (
                        <button
                          onClick={() => updateStatus(report.id, "reviewed")}
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          標記為審核中
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(report.id, "resolved")}
                        className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        已處理
                      </button>
                      <button
                        onClick={() => updateStatus(report.id, "dismissed")}
                        className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        駁回
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
