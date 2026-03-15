import { useTranslations, useLocale } from "next-intl";
import { AiRecItem } from "@/components/ai/AiRecItem";

export default function AiPage() {
  const t = useTranslations("aiPage");
  const locale = useLocale();
  const isZh = locale === "zh-HK";

  return (
    <section className="pt-28 pb-15">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-semibold mb-2">{t("pageTitle")}</h1>
          <p className="text-base text-text-sub">{t("pageDesc")}</p>
        </div>

        <div className="text-center text-xs font-semibold text-gold font-en tracking-wide mb-6">
          DEMO CONVERSATION
        </div>

        <div className="max-w-[640px] mx-auto">
          {/* User msg 1 */}
          <div className="bg-wine text-white p-3.5 rounded-[14px] rounded-br-sm text-sm leading-relaxed mb-3 max-w-[85%] ml-auto">
            {isZh ? "送女朋友生日，預算 300 左右" : "Birthday gift for my girlfriend, budget around HK$300"}
          </div>

          {/* AI msg 1 */}
          <div className="bg-white border border-wine-border p-3.5 rounded-[14px] rounded-bl-sm text-sm leading-relaxed mb-3 max-w-[85%]">
            <p>{isZh ? "好的！女朋友平時喜歡什麼風格？還是不太確定也沒關係，我幫你想想：" : "Great! Does your girlfriend have a preferred wine style? If you're not sure, no worries — here are some ideas:"}</p>
            <AiRecItem
              name="Moët & Chandon Brut Impérial"
              price={isZh ? "HK$268 起" : "From HK$268"}
              reason={isZh ? "送香檳基本不會出錯，而且開瓶的儀式感很棒。" : "Champagne is always a safe bet, and the ritual of popping it open is half the gift."}
            />
            <AiRecItem
              name="Whispering Angel Rosé 2023"
              price={isZh ? "HK$198 起" : "From HK$198"}
              reason={isZh ? "粉色瓶身拍照很好看，味道清爽不會太重。" : "The pink bottle is Instagram-worthy, and it's light and refreshing."}
            />
            <AiRecItem
              name="Cloudy Bay Sauvignon Blanc 2023"
              price={isZh ? "HK$138 起" : "From HK$138"}
              reason={isZh ? "如果她喜歡清淡口味，這支很安全。" : "If she prefers lighter flavours, this is a reliable pick."}
            />
          </div>

          {/* User msg 2 */}
          <div className="bg-wine text-white p-3.5 rounded-[14px] rounded-br-sm text-sm leading-relaxed mb-3 max-w-[85%] ml-auto">
            {isZh ? "她喜歡甜一點的，有沒有別的推薦？" : "She prefers something sweeter — any other options?"}
          </div>

          {/* AI msg 2 */}
          <div className="bg-white border border-wine-border p-3.5 rounded-[14px] rounded-bl-sm text-sm leading-relaxed mb-3 max-w-[85%]">
            <p>{isZh ? "了解！喜歡甜口的話，這幾支會更對她的味道：" : "Got it! For sweeter palates, these would be right up her alley:"}</p>
            <AiRecItem
              name="Château Guiraud Sauternes 2018 (375ml)"
              price={isZh ? "HK$238 起" : "From HK$238"}
              reason={isZh ? "波爾多的貴腐甜酒，蜂蜜和杏桃的香氣，甜而不膩，非常適合送禮。" : "A Bordeaux dessert wine with honey and apricot aromas — sweet but never cloying. Perfect as a gift."}
            />
            <AiRecItem
              name="Moscato d'Asti La Spinetta 2023"
              price={isZh ? "HK$168 起" : "From HK$168"}
              reason={isZh ? "微甜微氣泡，像喝水果汽水，輕鬆好入口。" : "Gently sweet and lightly fizzy — like sparkling fruit juice, easy to love."}
            />
            <AiRecItem
              name="Dr. Loosen Riesling Kabinett 2022"
              price={isZh ? "HK$148 起" : "From HK$148"}
              reason={isZh ? "德國雷司令，酸甜平衡，非常清新優雅。" : "German Riesling with a lovely sweet-acid balance — fresh and elegant."}
            />
          </div>

          {/* Input bar (disabled) */}
          <div className="flex gap-3 mt-6">
            <input
              type="text"
              disabled
              placeholder={t("inputPlaceholder")}
              className="flex-1 px-5 py-3.5 border border-wine-border rounded-xl text-[15px] bg-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              disabled
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-wine text-white text-[15px] font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("sendBtn")}
            </button>
          </div>
          <p className="text-center text-xs text-text-sub mt-3">
            * {t("comingSoon")}
          </p>
        </div>
      </div>
    </section>
  );
}
