"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sport, TrainingEntry } from "@/lib/data";
import { formatDuration } from "@/lib/time";

type CalendarDay = {
  day: number | null;
  dateKey: string | null;
  entries: TrainingEntry[];
};

type Props = {
  monthName: string;
  days: CalendarDay[];
  activeDays: number;
  completion: number;
  monthHours: string;
  weekdays: string[];
  sportColors: Record<string, string>;
  sportSummary: { name: string; minutes: number; count: number }[];
  sportOptions: Sport[];
  isCurrentMonth?: boolean;
  currentDayKey?: string;
  anchorId?: string;
  activityFilters?: string[];
  onAddEntry?: (formData: FormData) => Promise<void>;
  onDeleteEntry?: (formData: FormData) => Promise<void>;
};

export function MonthCard({
  monthName,
  days,
  activeDays,
  completion,
  monthHours,
  weekdays,
  sportColors,
  sportSummary,
  sportOptions,
  isCurrentMonth,
  currentDayKey,
  anchorId,
  activityFilters = [],
  onAddEntry,
  onDeleteEntry,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  useEffect(() => {
    if (!selected) return;
    const match = days.find((d) => d.dateKey === selected.dateKey && d.day === selected.day);
    setSelected(match ?? null);
  }, [days, selected]);

  const selectedSummary = useMemo(() => {
    if (!selected || !selected.entries.length) return null;
    const totalMinutes = selected.entries.reduce(
      (sum, entry) => sum + (entry.lengthMinutes ?? 0),
      0,
    );
    return {
      totalMinutes,
      notes: selected.entries.filter((e) => e.comment).length,
    };
  }, [selected]);

  const dayMetrics = useMemo(
    () =>
      days
        .filter((d) => d.day !== null && d.dateKey)
        .map((d) => {
          const minutes = d.entries.reduce(
            (sum, e) => sum + (e.lengthMinutes ?? 0),
            0,
          );
          const sessions = d.entries.length;
          const bySport = d.entries.reduce((acc, entry) => {
            const key = normalizeSport(entry.sport);
            const existing = acc.get(key) ?? 0;
            const value = entry.lengthMinutes ?? 0;
            acc.set(key, existing + value);
            return acc;
          }, new Map<string, number>());
          return {
            day: d.day as number,
            minutes,
            sessions,
            bySport,
            entries: d.entries,
          };
        }),
    [days],
  );

  const [showChart, setShowChart] = useState(false);
  const [metric, setMetric] = useState<"temps" | "seances">("temps");
  const chartActivities = useMemo(
    () => sportSummary.map((s) => s.name),
    [sportSummary],
  );
  const defaultChartActivity = useMemo(() => {
    const normalizedFilters = activityFilters.map((f) => normalizeSport(f));
    const match = chartActivities.find((name) =>
      normalizedFilters.includes(normalizeSport(name)),
    );
    return match ?? chartActivities[0] ?? "";
  }, [activityFilters, chartActivities]);
  const [chartActivity, setChartActivity] = useState<string>(defaultChartActivity);
  useEffect(() => {
    setChartActivity(defaultChartActivity);
  }, [defaultChartActivity]);

  const chartPoints = useMemo(() => {
    const xStep = 28;
    const xOffset = 16;
    const filtered = dayMetrics.map((m) => {
      const activityKey = chartActivity ? normalizeSport(chartActivity) : null;
      const value =
        metric === "temps"
          ? activityKey
            ? m.bySport.get(activityKey) ?? 0
            : m.minutes
          : metric === "seances"
            ? activityKey
              ? (m.entries ?? []).filter((e) => normalizeSport(e.sport) === activityKey).length
              : m.sessions
            : 0;
      return { day: m.day, value, minutes: m.minutes, sessions: m.sessions };
    });

    const values = filtered.map((p) => p.value);
    const rawMax = values.length ? Math.max(...values) : 1;
    const maxValue = Math.max(1, rawMax);
    return {
      points: filtered,
      maxValue,
      xStep,
      xOffset,
    };
  }, [chartActivity, dayMetrics, metric]);

  useEffect(() => {
    if (selected) {
      setShowChart(false);
    }
  }, [selected]);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  return (
    <div
      id={anchorId}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-slate-800/40 p-4 ring-1 backdrop-blur sm:p-5 ${
        isCurrentMonth ? "ring-amber-400/60 shadow-lg shadow-amber-400/20" : "ring-white/10"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Mois</p>
          <p className="text-2xl font-semibold text-white">{monthName}</p>
          <p className="text-xs text-slate-300">
            {activeDays} jour{activeDays === 1 ? "" : "s"} actif{activeDays === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowChart((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/10 p-2 text-white transition hover:border-white/30 hover:bg-white/15"
            title={showChart ? "Masquer le graphique" : "Voir le graphique"}
            aria-label={showChart ? "Masquer le graphique" : "Voir le graphique"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M3.75 4.5a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z" />
              <path d="M6 9a1 1 0 0 1 1-1h2.25a1 1 0 0 1 1 1v9H6V9Zm5.25 3a1 1 0 0 1 1-1h2.25a1 1 0 0 1 1 1v6h-4.25v-6Zm5.25-5a1 1 0 0 1 1-1H20a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1h-3.5V7Z" />
            </svg>
          </button>
          <div className="relative h-24 w-12 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/10">
            <div
              className="absolute bottom-0 w-full bg-gradient-to-t from-amber-500 via-orange-400 to-yellow-200"
              style={{ height: `${Math.max(6, completion)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
              {completion}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <StatBox label="Durée" value={monthHours} />
        <StatBox
          label="Séances"
          value={`${days.reduce((sum, d) => sum + d.entries.length, 0)}`}
        />
        <StatBox label="Jours actifs" value={`${activeDays}`} />
      </div>

      {sportSummary.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {sportSummary.map((sport) => {
            const color = sportColors[normalizeSport(sport.name)];
            return (
              <div
                key={sport.name}
                className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-white ring-1 ring-white/10"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: color ?? "#ffffff" }}
                />
                <span className="font-semibold">{sport.name}</span>
                <span className="text-slate-300">
                  {formatDuration(sport.minutes)} ({sport.count}x)
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {showChart ? (
        <div className="mt-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span>Vue graphique</span>
            <select
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
              value={metric}
              onChange={(e) => setMetric(e.target.value as typeof metric)}
            >
              <option value="temps">Heures (minutes)</option>
              <option value="seances">Nombre de séances</option>
            </select>
            <select
              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
              value={chartActivity}
              onChange={(e) => setChartActivity(e.target.value)}
            >
              {chartActivities.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <span>Max {chartPoints.maxValue}</span>
          </div>
          <div className="flex items-end gap-1 overflow-x-auto pb-2">
            <svg
              width={Math.max(chartPoints.points.length * chartPoints.xStep + chartPoints.xOffset * 2, 120)}
              height={140}
              className="overflow-visible"
            >
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                points={chartPoints.points
                  .map((p, idx) => {
                    const x = idx * chartPoints.xStep + chartPoints.xOffset;
                    const y = 120 - (p.value / chartPoints.maxValue) * 100;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
              {chartPoints.points.map((p, idx) => {
                const x = idx * chartPoints.xStep + chartPoints.xOffset;
                const y = 120 - (p.value / chartPoints.maxValue) * 100;
                return (
                  <g key={p.day}>
                    <circle cx={x} cy={y} r={3} fill="#f97316" />
                    <text x={x} y={135} fontSize="10" textAnchor="middle" fill="#cbd5e1">
                      {p.day}
                    </text>
                    <text x={x} y={y - 6} fontSize="9" textAnchor="middle" fill="#fbbf24">
                      {metric === "temps" ? formatDuration(p.value) : `${p.value}`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-2">
        <div className="grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.16em] text-slate-400 sm:text-xs">
          {weekdays.map((weekday, idx) => (
            <span key={`weekday-${idx}`}>{weekday}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            if (day.day === null) {
              return (
                <div
                  key={`empty-${monthName}-${idx}`}
                  className="aspect-[1/1] rounded-2xl bg-transparent"
                />
              );
            }

            const hasEntries = day.entries.length > 0;
            const totalMinutes = day.entries.reduce(
              (sum, entry) => sum + (entry.lengthMinutes ?? 0),
              0,
            );

            const isToday = currentDayKey && currentDayKey === day.dateKey;
            return (
              <button
                key={`${monthName}-${day.dateKey ?? `${day.day}-${idx}`}`}
                type="button"
                onClick={() => setSelected(day)}
                className={`group relative flex aspect-[1/1] flex-col items-center justify-center gap-2 rounded-2xl px-2 py-2 text-xs transition ${
                  hasEntries ? "bg-white/5 hover:bg-white/10" : "bg-white/5 text-slate-500"
                } ${isToday ? "ring-2 ring-amber-400/80 border border-amber-300/40" : "border border-slate-800/60"}`}
              >
                <span className="absolute left-2 top-2 text-[11px] font-semibold text-slate-400">
                  {day.day}
                </span>
                <div className="flex w-full flex-1 items-center justify-center gap-1">
                  {hasEntries ? (
                    renderDots(day.entries.slice(0, 3), sportColors)
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                  {day.entries.length > 3 ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white">
                      +{day.entries.length - 3}
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] font-semibold text-slate-200">
                  {hasEntries ? formatDuration(totalMinutes) : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 p-5 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Jour {selected.day}
                </p>
                <p className="text-xl font-semibold text-white">{monthName}</p>
                <p className="text-sm text-slate-300">
                  {selectedSummary?.totalMinutes ? formatDuration(selectedSummary.totalMinutes) : "—"}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full bg-white/10 px-3 py-1 text-sm text-white ring-1 ring-white/10 transition hover:bg-white/20"
                onClick={() => setSelected(null)}
              >
                Fermer
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {selected.entries.length ? (
                selected.entries.map((entry, idx) => {
                  const normalized = normalizeSport(entry.sport);
                  const color = sportColors[normalized];
                  return (
                    <div
                      key={`${entry.sport}-${idx}`}
                      className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/10"
                          style={{ backgroundColor: color ?? "#94a3b8" }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">{entry.sport}</p>
                          {entry.comment ? (
                            <p className="text-xs text-slate-300">{entry.comment}</p>
                          ) : null}
                        </div>
                      </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {entry.lengthMinutes ? formatDuration(entry.lengthMinutes) : "—"}
              </span>
                        {entry.id && onDeleteEntry ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (!entry.id) return;
                              setDeletingId(entry.id);
                              const formData = new FormData();
                              formData.set("id", `${entry.id}`);
                              try {
                                await onDeleteEntry(formData);
                                startTransition(() => router.refresh());
                                setSelected(null);
                              } finally {
                                setDeletingId((current) => (current === entry.id ? null : current));
                              }
                            }}
                            disabled={deletingId === entry.id}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-red-400/50 bg-red-500/20 text-red-200 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Supprimer la séance"
                            aria-label="Supprimer la séance"
                          >
                            {deletingId === entry.id ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-4 w-4 animate-spin text-red-100"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="9"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  opacity="0.25"
                                />
                                <path
                                  d="M21 12a9 9 0 0 1-9 9"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M9.5 3a1 1 0 0 0-.894.553L8.118 5H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2h-3.118l-.488-.947A1 1 0 0 0 14.5 3h-5Zm-3 6.5a.75.75 0 0 1 1.5 0v8a.75.75 0 0 1-1.5 0v-8Zm4.25 0a.75.75 0 0 1 1.5 0v8a.75.75 0 0 1-1.5 0v-8Zm5.75-.75a.75.75 0 0 0-1.5 0v8a.75.75 0 0 0 1.5 0v-8Zm-2-1.75a1 1 0 0 1 1 1v8a2.75 2.75 0 0 1-2.75 2.75h-3.5A2.75 2.75 0 0 1 6.5 16v-8a1 1 0 0 1 1-1h6.5Z" />
                              </svg>
                            )}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-300">Pas encore de séance pour ce jour.</p>
              )}
              <form
                action={async (formData) => {
                  if (onAddEntry) {
                    await onAddEntry(formData);
                  }
                  startTransition(() => router.refresh());
                  setSelected(null);
                }}
                className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
              >
                <input type="hidden" name="day" value={selected.dateKey ?? ""} />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <label className="flex flex-1 flex-col text-xs uppercase tracking-[0.08em] text-slate-400">
                    Sport
                    <select
                      name="sport"
                      required
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/30"
                      defaultValue={sportOptions[0]?.name ?? ""}
                    >
                      {!sportOptions.length ? (
                        <option value="" disabled>
                          Ajoute une activité d&apos;abord
                        </option>
                      ) : null}
                      {sportOptions.map((sport) => (
                        <option key={sport.name} value={sport.name}>
                          {sport.name}
                        </option>
                      ))}
                    </select>
                  </label>
                <div className="flex flex-1 gap-2">
                  <label className="flex w-1/2 flex-col text-xs uppercase tracking-[0.08em] text-slate-400">
                    Heures
                    <input
                      type="number"
                      name="hours"
                      min="0"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/30"
                    />
                  </label>
                  <label className="flex w-1/2 flex-col text-xs uppercase tracking-[0.08em] text-slate-400">
                    Minutes
                    <input
                      type="number"
                      name="minutes"
                        min="0"
                        max="59"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/30"
                      />
                    </label>
                  </div>
                </div>
                <label className="flex flex-col text-xs uppercase tracking-[0.08em] text-slate-400">
                  Commentaire
                  <input
                    name="comment"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/30"
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/30 transition hover:brightness-105"
                  >
                    Ajouter une séance
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderDots(entries: TrainingEntry[], sportColors: Record<string, string>) {
  return entries.map((entry, index) => {
    const normalized = normalizeSport(entry.sport);
    const color = sportColors[normalized];
    return (
      <span
        key={`${entry.sport}-${index}`}
        className="flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-black/10"
        style={{
          marginLeft: index > 0 ? -6 : 0,
          backgroundColor: color ?? "#cbd5e1",
        }}
        title={entry.comment ?? entry.sport}
      />
    );
  });
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/50 px-4 py-3 text-left ring-1 ring-white/10">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function normalizeSport(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}
