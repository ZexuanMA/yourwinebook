"use client";

import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Eye, Users, MousePointerClick, TrendingUp, TrendingDown,
  Clock, Smartphone, Monitor, Tablet, ArrowUpRight,
} from "lucide-react";
import {
  dailyStats, topPages, topWines, recentSessions,
  summaryStats, trafficSources, deviceBreakdown,
} from "@/lib/mock-analytics";

// ─── helpers ─────────────────────────────────────────────────────────────────

function ChangeChip({ value, invert = false }: { value: number; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0;
  const label = `${value > 0 ? "+" : ""}${value}%`;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
        positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {label}
    </span>
  );
}

const DeviceIcon = ({ type }: { type: string }) => {
  if (type === "mobile")  return <Smartphone className="w-3.5 h-3.5 text-text-sub" />;
  if (type === "tablet")  return <Tablet      className="w-3.5 h-3.5 text-text-sub" />;
  return                         <Monitor     className="w-3.5 h-3.5 text-text-sub" />;
};

// Custom tooltip shared style
const TooltipStyle = {
  contentStyle: {
    background: "#fff",
    border: "1px solid #E5E0DA",
    borderRadius: 12,
    fontSize: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  labelStyle: { color: "#6B6560", marginBottom: 4, fontWeight: 600 },
};

// ─── page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const last7 = dailyStats.slice(-7);

  const statCards = [
    {
      label: "頁面瀏覽量",
      value: summaryStats.pageViews.value.toLocaleString(),
      change: summaryStats.pageViews.change,
      icon: Eye,
      iconBg: "bg-red-light",
      iconColor: "text-wine",
    },
    {
      label: "獨立訪客",
      value: summaryStats.visitors.value.toLocaleString(),
      change: summaryStats.visitors.change,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "跳出率",
      value: `${summaryStats.bounceRate.value}%`,
      change: summaryStats.bounceRate.change,
      invert: true,
      icon: TrendingDown,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "平均訪問時長",
      value: summaryStats.avgDuration.value,
      change: summaryStats.avgDuration.change,
      icon: Clock,
      iconBg: "bg-[#FDF6EC]",
      iconColor: "text-gold",
    },
    {
      label: "比價點擊數",
      value: summaryStats.clickouts.value.toLocaleString(),
      change: summaryStats.clickouts.change,
      icon: MousePointerClick,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "總會話數",
      value: summaryStats.sessions.value.toLocaleString(),
      change: summaryStats.sessions.change,
      icon: TrendingUp,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-7">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text">流量分析</h1>
        <p className="text-sm text-text-sub mt-1">過去 30 天數據 · 對比上一個週期</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map(({ label, value, change, invert, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="bg-white border border-wine-border rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${iconBg}`}>
                <Icon className={`w-4.5 h-4.5 ${iconColor}`} style={{ width: 18, height: 18 }} />
              </div>
              <ChangeChip value={change} invert={invert} />
            </div>
            <p className="text-2xl font-bold text-text tracking-tight">{value}</p>
            <p className="text-sm text-text-sub mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Traffic chart — 30 days */}
      <div className="bg-white border border-wine-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-text">訪問趨勢</h2>
            <p className="text-xs text-text-sub mt-0.5">過去 30 天</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={dailyStats} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE2" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9B9490" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis tick={{ fontSize: 11, fill: "#9B9490" }} tickLine={false} axisLine={false} />
            <Tooltip {...TooltipStyle} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
              formatter={(v) => v === "pageViews" ? "頁面瀏覽" : "獨立訪客"}
            />
            <Line
              type="monotone"
              dataKey="pageViews"
              stroke="#5B2E35"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="visitors"
              stroke="#B8956A"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Middle row: Top pages + Traffic sources + Devices */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Top pages */}
        <div className="xl:col-span-2 bg-white border border-wine-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-wine-border">
            <h2 className="font-semibold text-text">熱門頁面</h2>
            <p className="text-xs text-text-sub mt-0.5">按頁面瀏覽量排序</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-wine-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">頁面</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">瀏覽量</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">平均時長</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">跳出率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0EA]">
                {topPages.map((p, i) => (
                  <tr key={p.path} className="hover:bg-bg transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs text-text-sub/40 w-4 text-right shrink-0">{i + 1}</span>
                        <span className="font-medium text-text">{p.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-text">
                      {p.views.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-text-sub">{p.avgDuration}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`text-sm font-medium ${p.bounceRate < 25 ? "text-green-600" : p.bounceRate < 35 ? "text-text" : "text-orange-500"}`}>
                        {p.bounceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic sources + Devices stacked */}
        <div className="space-y-5">
          {/* Traffic sources */}
          <div className="bg-white border border-wine-border rounded-2xl p-5">
            <h2 className="font-semibold text-text mb-4">流量來源</h2>
            <div className="space-y-3">
              {trafficSources.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text">{s.label}</span>
                    <span className="font-semibold text-text">{s.value}%</span>
                  </div>
                  <div className="h-2 bg-bg-card rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${s.value}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device breakdown */}
          <div className="bg-white border border-wine-border rounded-2xl p-5">
            <h2 className="font-semibold text-text mb-4">裝置類型</h2>
            <div className="space-y-3">
              {deviceBreakdown.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{d.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text">{d.label}</span>
                      <span className="font-semibold text-text">{d.value}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-wine transition-all"
                        style={{ width: `${d.value}%`, opacity: d.value > 30 ? 1 : 0.5 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Top wines + Last 7 days bar + Recent sessions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Top wines */}
        <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-wine-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-text">熱門酒款</h2>
              <p className="text-xs text-text-sub mt-0.5">按頁面瀏覽量</p>
            </div>
          </div>
          <div className="divide-y divide-[#F5F0EA]">
            {topWines.map((w, i) => {
              const clickRate = Math.round((w.clickouts / w.views) * 100);
              return (
                <div key={w.slug} className="px-6 py-4 flex items-center gap-4 hover:bg-bg transition-colors">
                  <span className="text-xs text-text-sub/40 w-4 text-right shrink-0">{i + 1}</span>
                  <div className="w-9 h-9 bg-red-light rounded-xl flex items-center justify-center text-lg shrink-0">
                    {w.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{w.name}</p>
                    <p className="text-xs text-text-sub mt-0.5">
                      {w.views.toLocaleString()} 瀏覽 · {w.clickouts} 點擊購買
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${clickRate >= 12 ? "text-green-600" : "text-text"}`}>
                      {clickRate}%
                    </p>
                    <p className="text-[10px] text-text-sub">轉化率</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Last 7 days bar chart */}
        <div className="bg-white border border-wine-border rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="font-semibold text-text">本週每日瀏覽</h2>
            <p className="text-xs text-text-sub mt-0.5">頁面瀏覽量 vs 獨立訪客</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last7} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EAE2" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9B9490" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9B9490" }} tickLine={false} axisLine={false} />
              <Tooltip {...TooltipStyle} />
              <Bar dataKey="pageViews" name="頁面瀏覽" fill="#5B2E35" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="visitors"  name="獨立訪客"  fill="#B8956A" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent sessions */}
      <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-wine-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-text">最近訪問記錄</h2>
            <p className="text-xs text-text-sub mt-0.5">實時更新（演示數據）</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            實時
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg border-b border-wine-border">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">地區</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">裝置</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">入口頁面</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">訪問時長</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">瀏覽頁數</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-text-sub uppercase tracking-wider">時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0EA]">
              {recentSessions.map((s) => (
                <tr key={s.id} className="hover:bg-bg transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.flag}</span>
                      <span className="font-medium text-text">{s.country}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <DeviceIcon type={s.device} />
                  </td>
                  <td className="px-4 py-3.5 text-text-sub">{s.entryPage}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-sm text-text">{s.duration}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`font-semibold ${s.pages >= 10 ? "text-wine" : "text-text"}`}>
                      {s.pages}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-text-sub text-xs">{s.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo notice */}
      <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <span className="font-semibold">Demo 模式：</span>
        以上均為演示數據。接入真實分析服務（如 Plausible、PostHog 或 Supabase 自定義事件）後將顯示真實流量。
      </div>
    </div>
  );
}
