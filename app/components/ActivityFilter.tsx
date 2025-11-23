"use client";

import { Sport } from "@/lib/data";

type Props = {
  sports: Sport[];
  activity?: string | string[];
};

export function ActivityFilter({ sports, activity }: Props) {
  const selected = new Set(Array.isArray(activity) ? activity : activity ? [activity] : []);

  return (
    <form
      method="get"
      className="flex flex-col gap-3 rounded-3xl bg-white/5 px-5 py-4 ring-1 ring-white/10 sm:flex-row sm:items-center sm:flex-wrap"
      onChange={(e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
          e.currentTarget.requestSubmit();
        }
      }}
    >
      <div className="flex flex-col gap-2 text-sm text-slate-200">
        <span className="text-xs uppercase tracking-[0.12em] text-slate-300">Activités</span>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            className={`flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm transition ${
              selected.size === 0
                ? "bg-white/20 text-white"
                : "bg-slate-900 text-slate-200 hover:border-white/30"
            }`}
          >
            Toutes
          </a>
          {sports.map((sport) => (
            <label
              key={sport.name}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2"
            >
              <input
                type="checkbox"
                name="activity"
                value={sport.name}
                defaultChecked={selected.has(sport.name)}
              />
              <span>{sport.name}</span>
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}
