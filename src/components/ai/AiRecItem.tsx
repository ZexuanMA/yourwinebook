export function AiRecItem({
  name,
  price,
  reason,
}: {
  name: string;
  price: string;
  reason: string;
}) {
  return (
    <div className="mt-2.5 p-3 bg-bg border border-wine-border rounded-[10px] cursor-pointer hover:border-gold transition-colors">
      <div className="font-en font-semibold text-[13px]">{name}</div>
      <div className="font-en text-xs text-gold font-semibold">{price}</div>
      <div className="text-[13px] text-text-sub mt-1">{reason}</div>
    </div>
  );
}
