"use client";

import { useTranslations } from "next-intl";
import { ChatInterface } from "@/components/ai/ChatInterface";

export default function AiPage() {
  const t = useTranslations("aiPage");

  const quickPrompts = [
    { label: t("quickQ1"), prompt: t("quickQ1Prompt") },
    { label: t("quickQ2"), prompt: t("quickQ2Prompt") },
    { label: t("quickQ3"), prompt: t("quickQ3Prompt") },
    { label: t("quickQ4"), prompt: t("quickQ4Prompt") },
    { label: t("quickQ5"), prompt: t("quickQ5Prompt") },
  ];

  return (
    <section className="pt-28 pb-6 h-screen flex flex-col">
      <div className="max-w-[800px] mx-auto px-6 w-full flex flex-col flex-1 min-h-0">
        <div className="text-center mb-6 shrink-0">
          <h1 className="text-[28px] font-semibold mb-2">{t("pageTitle")}</h1>
          <p className="text-base text-text-sub">{t("pageDesc")}</p>
        </div>

        <div className="flex-1 min-h-0">
          <ChatInterface
            quickPrompts={quickPrompts}
            placeholder={t("inputPlaceholder")}
            sendLabel={t("sendBtn")}
            disclaimer={t("disclaimer")}
            thinkingLabel={t("thinking")}
            searchingLabel={t("searching")}
            errorLabel={t("errorTitle")}
            retryLabel={t("retry")}
            clearLabel={t("clearChat")}
            notConfiguredTitle={t("notConfiguredTitle")}
            notConfiguredDesc={t("notConfiguredDesc")}
          />
        </div>
      </div>
    </section>
  );
}
