"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

export default function JoinPage() {
  const t = useTranslations("join");
  const locale = useLocale();
  const isZh = locale === "zh-HK";

  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    wine_count: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/merchant-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          wine_count: form.wine_count ? Number(form.wine_count) : undefined,
        }),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ company_name: "", contact_name: "", email: "", phone: "", website: "", wine_count: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-wine-border rounded-xl text-sm bg-white focus:border-gold focus:outline-none transition-colors";

  return (
    <>
      {/* Hero */}
      <section className="pt-36 pb-15 text-center">
        <div className="max-w-[1120px] mx-auto px-6">
          <h1 className="text-[32px] font-semibold mb-2">{t("pageTitle")}</h1>
          <p className="text-base text-text-sub max-w-[520px] mx-auto leading-7">
            {t("pageDesc")}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-15">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-10 h-0.5 bg-gold mx-auto mb-5" />
            <h2 className="text-[28px] font-semibold">{t("whyTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-15">
            {[
              { emoji: "📈", title: t("benefit1Title"), desc: t("benefit1Desc") },
              { emoji: "🏪", title: t("benefit2Title"), desc: t("benefit2Desc") },
              { emoji: "📦", title: t("benefit3Title"), desc: t("benefit3Desc") },
            ].map((b) => (
              <div
                key={b.title}
                className="bg-white border border-wine-border rounded-2xl p-8 text-center"
              >
                <div className="text-4xl mb-4">{b.emoji}</div>
                <h3 className="text-base font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-text-sub leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-15">
        <div className="max-w-[600px] mx-auto px-6">
          <div className="text-center mb-10">
            <div className="w-10 h-0.5 bg-gold mx-auto mb-5" />
            <h2 className="text-[28px] font-semibold">
              {isZh ? "立即申請" : "Apply Now"}
            </h2>
            <p className="text-sm text-text-sub mt-2">
              {isZh ? "填寫以下表單，我們會盡快與您聯繫。" : "Fill out the form below and we'll get back to you soon."}
            </p>
          </div>

          {status === "success" ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold mb-2">
                {isZh ? "申請已提交！" : "Application Submitted!"}
              </h3>
              <p className="text-sm text-text-sub">
                {isZh ? "我們會在 1-2 個工作天內與您聯繫。" : "We'll get back to you within 1-2 business days."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {isZh ? "公司名稱" : "Company Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className={inputClass}
                  placeholder={isZh ? "例：好酒坊有限公司" : "e.g. Fine Wine Co. Ltd."}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {isZh ? "聯絡人" : "Contact Name"} *
                </label>
                <input
                  type="text"
                  required
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {isZh ? "電郵" : "Email"} *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {isZh ? "電話" : "Phone"}
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {isZh ? "酒款數量" : "Number of Wines"}
                  </label>
                  <input
                    type="number"
                    value={form.wine_count}
                    onChange={(e) => setForm({ ...form, wine_count: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {isZh ? "網站" : "Website"}
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className={inputClass}
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {isZh ? "備註" : "Message"}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${inputClass} h-[100px] resize-none`}
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-500">
                  {isZh ? "提交失敗，請稍後重試。" : "Submission failed. Please try again."}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full py-3.5 bg-wine text-white text-[15px] font-medium rounded-xl hover:bg-wine-dark transition-colors disabled:opacity-60"
              >
                {status === "submitting"
                  ? (isZh ? "提交中..." : "Submitting...")
                  : (isZh ? "提交申請" : "Submit Application")}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-15 text-center border-t border-wine-border">
        <div className="max-w-[1120px] mx-auto px-6">
          <h2 className="text-2xl font-semibold mb-3">{t("ctaTitle")}</h2>
          <p className="text-[15px] text-text-sub mb-6">{t("ctaDesc")}</p>
          <a
            href="mailto:partner@yourwinebook.com"
            className="font-en text-lg font-semibold text-wine border-b-2 border-gold-light pb-0.5 hover:border-wine transition-colors"
          >
            partner@yourwinebook.com
          </a>
        </div>
      </section>
    </>
  );
}
