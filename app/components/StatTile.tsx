type Props = { label: string; value: string; hint?: string };

export function StatTile({ label, value, hint }: Props) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="text-xl font-semibold text-white">{value}</span>
      {hint ? <span className="text-xs text-slate-300">{hint}</span> : null}
    </div>
  );
}
