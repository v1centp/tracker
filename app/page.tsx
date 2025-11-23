import Link from "next/link";
import { revalidatePath } from "next/cache";
import { StatTile } from "./components/StatTile";
import { MonthCard } from "./components/MonthCard";
import { ActivityFilter } from "./components/ActivityFilter";
import { MonthFilter } from "./components/MonthFilter";
import { RefreshBar } from "./components/RefreshBar";
import {
  appendTrainingEntry,
  deleteTrainingEntry,
  fetchSports,
  fetchTrainingEntries,
  fetchDateCatalog,
  TrainingEntry,
  formatHours,
  formatDay,
} from "@/lib/data";

type CalendarDay = {
  day: number | null;
  dateKey: string | null;
  entries: TrainingEntry[];
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function normalizeSport(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function toDateKey(date: Date) {
  return formatDay(date);
}

function getCalendar(
  year: number,
  monthIndex: number,
  entries: TrainingEntry[],
  allowedDates?: Set<string>,
) {
  const totalDays = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const startOffset = (firstDay + 6) % 7; // Monday first

  const grouped = entries.reduce((map, entry) => {
    const list = map.get(entry.day) ?? [];
    list.push(entry);
    map.set(entry.day, list);
    return map;
  }, new Map<string, TrainingEntry[]>());

  const days: CalendarDay[] = Array.from({ length: startOffset }, () => ({
    day: null,
    dateKey: null,
    entries: [],
  }));

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    const key = toDateKey(date);
    if (!allowedDates || allowedDates.has(key)) {
      days.push({ day, dateKey: key, entries: grouped.get(key) ?? [] });
    }
  }

  return days;
}

async function addEntryAction(formData: FormData) {
  "use server";
  const sport = formData.get("sport")?.toString().trim() ?? "";
  const day = formData.get("day")?.toString().trim() ?? "";
  const hours = Number(formData.get("hours") ?? 0) || 0;
  const minutes = Number(formData.get("minutes") ?? 0) || 0;
  const commentValue = formData.get("comment")?.toString().trim();
  const comment = commentValue ? commentValue : undefined;

  if (!sport || !day) return;

  const lengthMinutes = hours * 60 + minutes;
  await appendTrainingEntry({
    sport,
    day,
    lengthMinutes,
    comment,
  });
  revalidatePath("/");
}

async function deleteEntryAction(formData: FormData) {
  "use server";
  const idValue = formData.get("id");
  const id = typeof idValue === "string" ? Number(idValue) : null;
  if (!id) return;
  await deleteTrainingEntry(id);
  revalidatePath("/");
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (searchParams ? await searchParams : {}) ?? {};
  const [entries, sports, catalog] = await Promise.all([
    fetchTrainingEntries(),
    fetchSports(),
    fetchDateCatalog(),
  ]);
  const sortedEntries = [...entries].sort(
    (a, b) =>
      new Date(`${a.day}T00:00:00Z`).getTime() - new Date(`${b.day}T00:00:00Z`).getTime(),
  );

  const currentYear = new Date().getUTCFullYear();
  const requestedActivity = params?.activity;
  const requestedMonths = params?.monthKey
    ? Array.isArray(params.monthKey)
      ? params.monthKey
      : [params.monthKey]
    : [];

  const activityFilters = Array.isArray(requestedActivity)
    ? requestedActivity.map((a) => normalizeSport(a))
    : requestedActivity
      ? [normalizeSport(requestedActivity)]
      : [];
  const filteredEntries = sortedEntries.filter((entry) => {
    if (activityFilters.length === 0) return true;
    return activityFilters.includes(normalizeSport(entry.sport));
  });

  const formatMonthLabel = (month: number) =>
    new Date(Date.UTC(2000, month, 1)).toLocaleString("fr", { month: "long" });

  const totalActivities = filteredEntries.length;
  const uniqueActiveDays = new Set(filteredEntries.map((entry) => entry.day)).size;
  const sportColorMap = Object.fromEntries(
    sports.map((sport) => [normalizeSport(sport.name), sport.color]),
  );

  const monthOrderStandard = Array.from({ length: 12 }, (_, i) => i);
  const allMonths = (() => {
    if (!filteredEntries.length) {
      const years = [currentYear, currentYear + 1];
      return years.flatMap((year) =>
        monthOrderStandard.map((month) => {
          const days = getCalendar(year, month, []);
          return {
            index: month,
            year,
            days,
            monthEntries: [],
            activeDays: 0,
            completion: 0,
            sportSummary: [],
            key: `${year}-${month}`,
            label: `${formatMonthLabel(month)} ${year}`,
          };
        }),
      );
    }

    const minYear = Math.min(
      currentYear,
      ...filteredEntries.map((e) => new Date(`${e.day}T00:00:00Z`).getUTCFullYear()),
    );
    const maxYear = Math.max(
      currentYear + 1,
      ...filteredEntries.map((e) => new Date(`${e.day}T00:00:00Z`).getUTCFullYear()),
    );

    const years = [];
    for (let y = minYear; y <= maxYear; y += 1) {
      years.push(y);
    }
    // Place current year first if within range
    const orderedYears = [...years].sort((a, b) => {
      if (a === currentYear) return -1;
      if (b === currentYear) return 1;
      return a - b;
    });

    return orderedYears.flatMap((year) => {
      const order =
        year === currentYear
          ? [
              ...monthOrderStandard.slice(new Date().getUTCMonth()),
              ...monthOrderStandard.slice(0, new Date().getUTCMonth()),
            ]
          : monthOrderStandard;

      return order.map((month) => {
        const monthKey = `${year}-${month}`;
        const monthEntries = filteredEntries.filter(
          (entry) =>
            new Date(`${entry.day}T00:00:00Z`).getUTCFullYear() === year &&
            new Date(`${entry.day}T00:00:00Z`).getUTCMonth() === month,
        );
        const days = getCalendar(year, month, monthEntries);
        const activeDays = new Set(monthEntries.map((entry) => entry.day)).size;
        const completion =
          days.filter((day) => day.day !== null).length > 0
            ? Math.round(
                (activeDays /
                  days.filter((day) => day.day !== null).length) *
                  100,
              )
            : 0;
        const sportSummaryMap = monthEntries.reduce((acc, entry) => {
          const key = entry.sport;
          const minutes = entry.lengthMinutes ?? 0;
          const existing = acc.get(key);
          if (existing) {
            existing.minutes += minutes;
            existing.count += 1;
          } else {
            acc.set(key, { name: entry.sport, minutes, count: 1 });
          }
          return acc;
        }, new Map<string, { name: string; minutes: number; count: number }>());
        const sportSummary = Array.from(sportSummaryMap.values());
        return {
          index: month,
          year,
          days,
          monthEntries,
          activeDays,
          completion,
          sportSummary,
          key: monthKey,
          label: `${formatMonthLabel(month)} ${year}`,
        };
      });
    });
  })();

  const defaultMonthKey = (() => {
    const nowKey = `${new Date().getUTCFullYear()}-${new Date().getUTCMonth()}`;
    return allMonths.find((m) => m.key === nowKey)?.key ?? allMonths[0]?.key ?? "";
  })();

  const selectedMonthKeys =
    requestedMonths.length > 0
      ? requestedMonths
      : defaultMonthKey
        ? [defaultMonthKey]
        : [];

  const months = allMonths.filter((m) => {
    if (selectedMonthKeys.length === 0) return true;
    return selectedMonthKeys.includes(m.key);
  }) as {
    index: number;
    year: number;
    days: CalendarDay[];
    monthEntries: TrainingEntry[];
    activeDays: number;
    completion: number;
    sportSummary: { name: string; minutes: number; count: number }[];
    key: string;
    label: string;
  }[];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <RefreshBar />
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Vue continue</p>
            <h1 className="text-4xl font-semibold leading-tight text-white">
              Tableau d&apos;activités
            </h1>
            <p className="text-base text-slate-300">Toutes tes séances sur plusieurs années.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 sm:grid-cols-3">
          <StatTile label="Temps total" value={formatHours(filteredEntries)} hint="Filtré" />
          <StatTile label="Séances" value={`${totalActivities}`} hint="Enregistrées" />
          <StatTile label="Jours actifs" value={`${uniqueActiveDays}`} hint="Jours uniques" />
        </div>

        <ActivityFilter sports={sports} activity={requestedActivity ?? ""} />
        <div className="flex flex-wrap items-center gap-3">
          <MonthFilter
            monthKeys={allMonths.map((m) => ({ key: m.key, label: m.label }))}
            selected={selectedMonthKeys}
            activities={requestedActivity}
          />
          {selectedMonthKeys.length > 0 && selectedMonthKeys[0] !== defaultMonthKey ? (
            <a
              href="/"
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-slate-200 transition hover:border-white/30"
            >
              Réinitialiser les mois
            </a>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {months.map(({ index: monthIndex, year, days, monthEntries, activeDays, completion, sportSummary }) => {
            const monthName = new Date(Date.UTC(year, monthIndex, 1)).toLocaleString("fr", {
              month: "long",
            });
            const monthHours = formatHours(monthEntries);
            return (
              <MonthCard
                key={`${year}-${monthIndex}`}
                monthName={`${monthName} ${year}`}
                days={days}
                activeDays={activeDays}
                completion={completion}
                monthHours={monthHours}
                weekdays={WEEKDAYS}
                sportColors={sportColorMap}
                sportSummary={sportSummary}
                sportOptions={sports}
                activityFilters={activityFilters}
                onAddEntry={addEntryAction}
                onDeleteEntry={deleteEntryAction}
                isCurrentMonth={
                  new Date().getUTCMonth() === monthIndex && new Date().getUTCFullYear() === year
                }
                currentDayKey={formatDay(new Date())}
                anchorId={
                  new Date().getUTCMonth() === monthIndex && new Date().getUTCFullYear() === year
                    ? "mois-courant"
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
