"use client";

import { useMemo, useState } from "react";

type Props = {
  monthKeys: { key: string; label: string }[];
  selected: string[];
  activities?: string | string[];
};

export function MonthFilter({ monthKeys, selected, activities }: Props) {
  const [open, setOpen] = useState(false);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const label =
    selected.length === 0
      ? "Tous les mois"
      : `${selected.length} mois sélectionnés`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
      >
        {label}
      </button>
      {open ? (
        <form
          id="month-filter-form"
          method="get"
          className="absolute z-30 mt-2 w-72 rounded-2xl bg-slate-900 p-3 shadow-xl ring-1 ring-white/10"
        >
          <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
            {monthKeys.map((m) => (
              <label
                key={m.key}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1 text-sm text-slate-100 hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  name="monthKey"
                  value={m.key}
                  defaultChecked={selectedSet.has(m.key)}
                  className="h-4 w-4"
                  onChange={(e) => {
                    e.stopPropagation();
                    e.currentTarget.form?.requestSubmit();
                  }}
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
          {activities
            ? (Array.isArray(activities) ? activities : [activities]).map((act) => (
                <input key={`activity-${act}`} type="hidden" name="activity" value={act} />
              ))
            : null}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="rounded-lg border border-white/20 px-3 py-1 text-xs text-slate-200 hover:border-white/40"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
