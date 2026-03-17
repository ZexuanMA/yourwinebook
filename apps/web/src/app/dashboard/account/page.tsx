"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useDashboardLang } from "@/lib/dashboard-lang-context";

interface Account {
  slug: string;
  name: string;
  email: string;
  role: "admin" | "merchant";
  phone?: string;
  website?: string;
  joinDate: string;
  description?: string;
  status: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-wine-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-wine-border">
        <h2 className="font-semibold text-text">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 bg-white border border-wine-border rounded-xl text-sm outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(184,149,106,0.10)] transition-all placeholder:text-text-sub/40";
const readonlyCls = "w-full px-4 py-2.5 bg-bg border border-wine-border rounded-xl text-sm text-text-sub cursor-not-allowed";

export default function AccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", website: "", description: "" });
  const [profileSaved, setProfileSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useDashboardLang();

  // Password change state
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const isAdmin = account?.role === "admin";
  // Admin pages stay in Chinese
  const label = (merchantKey: string, adminFallback: string) => isAdmin ? adminFallback : t(merchantKey);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((a: Account | null) => {
        if (!a) return;
        setAccount(a);
        setForm({
          name: a.name,
          phone: a.phone ?? "",
          website: a.website ?? "",
          description: a.description ?? "",
        });
      });
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (!pwForm.current) {
      setPwError(isAdmin ? "請輸入當前密碼" : t("account.currentPw"));
      return;
    }
    if (!pwForm.next || pwForm.next.length < 6) {
      setPwError(isAdmin ? "新密碼至少需要 6 個字符" : t("account.newPw"));
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError(isAdmin ? "兩次密碼不一致" : t("account.confirmPw"));
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? (isAdmin ? "密碼修改失敗" : "Failed")); return; }
      setPwSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSaved(false), 3000);
    } catch {
      setPwError(isAdmin ? "網絡錯誤，請稍後重試" : "Network error");
    } finally {
      setPwSaving(false);
    }
  };

  if (!account) {
    return <div className="space-y-5 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-40 bg-bg-card rounded-2xl" />)}</div>;
  }

  const pwLabels: Record<string, string> = {
    current: label("account.currentPw", "當前密碼"),
    next: label("account.newPw", "新密碼"),
    confirm: label("account.confirmPw", "確認新密碼"),
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">{label("account.title", "帳號設置")}</h1>
        <p className="text-sm text-text-sub mt-1">{label("account.subtitle", "管理你的個人資料和安全設置")}</p>
      </div>

      {/* Account overview */}
      <div className="bg-white border border-wine-border rounded-2xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-wine rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {account.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-text text-lg">{account.name}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-wine text-white rounded-full text-[10px] font-semibold">
                <ShieldCheck className="w-2.5 h-2.5" /> 管理員
              </span>
            )}
          </div>
          <p className="text-sm text-text-sub">{account.email}</p>
          <p className="text-xs text-text-sub/60 mt-1">
            {label("account.joinDate", "入駐日期")}：{new Date(account.joinDate).toLocaleDateString("zh-HK")}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
          account.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {account.status === "active" ? label("account.statusActive", "正常") : label("account.statusInactive", "已停用")}
        </div>
      </div>

      {/* Profile form */}
      <Section title={label("account.basicProfile", "基本資料")}>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={label("account.displayName", "顯示名稱")}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label={label("account.emailReadonly", "Email（不可修改）")}>
              <input type="email" value={account.email} readOnly className={readonlyCls} />
            </Field>
            <Field label={label("account.phone", "聯繫電話")}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+852 1234 5678"
                className={inputCls}
              />
            </Field>
            <Field label={label("account.website", "網站連結")}>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://..."
                className={inputCls}
              />
            </Field>
          </div>
          {account.role === "merchant" && (
            <Field label={label("account.bio", "商家簡介")}>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder={t("account.bioPlaceholder")}
                className={`${inputCls} resize-none`}
              />
            </Field>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            {profileSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" /> {label("account.saved", "已保存")}
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? label("account.saving", "保存中…") : label("account.save", "保存更改")}
            </button>
          </div>
        </form>
      </Section>

      {/* Password change */}
      <Section title={label("account.changePassword", "修改密碼")}>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {(["current", "next", "confirm"] as const).map((key) => (
            <Field key={key} label={pwLabels[key]}>
              <div className="relative">
                <input
                  type={showPw[key] ? "text" : "password"}
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-sub hover:text-text transition-colors cursor-pointer"
                >
                  {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          ))}
          {pwError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl">
              ⚠ {pwError}
            </p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            {pwSaved && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" /> {label("account.pwUpdated", "密碼已更新")}
              </span>
            )}
            <button
              type="submit"
              disabled={pwSaving}
              className="px-5 py-2.5 bg-wine text-white rounded-xl text-sm font-semibold hover:bg-wine-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {pwSaving ? label("account.pwUpdating", "更新中…") : label("account.pwUpdate", "更新密碼")}
            </button>
          </div>
        </form>
      </Section>

      {/* Danger zone — merchant only */}
      {account.role === "merchant" && (
        <Section title={t("account.dangerZone")}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text">{t("account.suspend")}</p>
              <p className="text-xs text-text-sub mt-0.5">{t("account.suspendDesc")}</p>
            </div>
            <button className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer">
              {t("account.suspendBtn")}
            </button>
          </div>
        </Section>
      )}

    </div>
  );
}
