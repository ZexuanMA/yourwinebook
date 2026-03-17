import { Link } from "@/i18n/navigation";

export interface SceneCardData {
  slug: string;
  emoji: string;
  title: string;
  description: string;
}

export function SceneCard({
  scene,
  exploreLabel,
}: {
  scene: SceneCardData;
  exploreLabel: string;
}) {
  return (
    <Link
      href={`/scenes/${scene.slug}`}
      className="block bg-white border border-wine-border rounded-2xl px-6 py-9 text-center cursor-pointer transition-all duration-250 hover:border-gold hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(91,46,53,0.06)]"
    >
      <div className="text-4xl mb-4">{scene.emoji}</div>
      <h3 className="text-[17px] font-semibold mb-2">{scene.title}</h3>
      <p className="text-sm text-text-sub leading-relaxed">{scene.description}</p>
      <span className="inline-block mt-4 font-en text-[13px] font-semibold text-gold tracking-wide">
        {exploreLabel}
      </span>
    </Link>
  );
}
