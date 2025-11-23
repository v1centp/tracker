import { supabaseFetch } from "./supabaseClient";
import { formatDuration } from "./time";

export type TrainingEntry = {
  id?: number;
  sport: string;
  day: string; // YYYY-MM-DD
  lengthMinutes?: number;
  comment?: string;
};

export type Sport = {
  id?: number;
  name: string;
  color: string;
};

export type DayCell = { day: string };

const ACTIVITY_TABLE = "SZ_activity";
const SPORT_TABLE = "SZ_list_activity";

// Supabase REST defaults to 1k rows; page through results so the client sees everything.
async function fetchAllSupabaseRows<T>(path: string, pageSize = 1000) {
  const rows: T[] = [];
  let start = 0;

  while (true) {
    const res = await supabaseFetch(path, {
      headers: { Range: `${start}-${start + pageSize - 1}` },
    });
    const page = (await res.json()) as T[];
    rows.push(...page);
    if (page.length < pageSize || page.length === 0) break;
    start += pageSize;
  }

  return rows;
}

export function formatDay(date: Date) {
  const y = date.getUTCFullYear();
  const m = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const d = `${date.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toISODate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return formatDay(d);
}

export async function fetchTrainingEntries(): Promise<TrainingEntry[]> {
  try {
    const data = await fetchAllSupabaseRows<{
      id?: number;
      activity?: string;
      day?: string;
      length?: number;
      comment?: string;
    }>(`/rest/v1/${ACTIVITY_TABLE}?select=id,activity,day,length,comment&order=day.asc`);
    return data
      .filter((row) => row.activity && row.day && row.id !== undefined)
      .map((row) => ({
        id: row.id,
        sport: row.activity ?? "",
        day: toISODate(row.day) ?? "",
        lengthMinutes: row.length ?? undefined,
        comment: row.comment ?? undefined,
      }))
      .filter((row) => row.day);
  } catch {
    return [];
  }
}

export async function fetchSports(): Promise<Sport[]> {
  try {
    const data = await fetchAllSupabaseRows<{
      id?: number;
      activity?: string;
      color?: string;
    }>(`/rest/v1/${SPORT_TABLE}?select=id,activity,color&order=id.asc`);
    return data
      .filter((row) => row.activity && row.id !== undefined)
      .map((row) => ({
        id: row.id,
        name: row.activity ?? "",
        color: (row.color ?? "#ffffff").toLowerCase(),
      }));
  } catch {
    return [];
  }
}

export async function fetchDateCatalog(): Promise<DayCell[]> {
  try {
    const data = await fetchAllSupabaseRows<{ day?: string }>(
      `/rest/v1/${ACTIVITY_TABLE}?select=day&order=day.asc&distinct=day`,
    );
    return data
      .map((row) => (row.day ? toISODate(row.day) : null))
      .filter((d): d is string => Boolean(d))
      .map((day) => ({ day }));
  } catch {
    return [];
  }
}

export async function appendTrainingEntry(entry: TrainingEntry) {
  await supabaseFetch(`/rest/v1/${ACTIVITY_TABLE}`, {
    method: "POST",
    body: JSON.stringify({
      activity: entry.sport,
      day: entry.day,
      length: entry.lengthMinutes,
      comment: entry.comment,
    }),
  });
}

export async function deleteTrainingEntry(id: number) {
  await supabaseFetch(`/rest/v1/${ACTIVITY_TABLE}?id=eq.${id}`, {
    method: "DELETE",
  });
}

export async function appendSport(sport: Sport) {
  await supabaseFetch(`/rest/v1/${SPORT_TABLE}`, {
    method: "POST",
    body: JSON.stringify({
      activity: sport.name,
      color: sport.color,
    }),
  });
}

export async function updateSport(sport: Sport) {
  if (!sport.id) return;
  await supabaseFetch(`/rest/v1/${SPORT_TABLE}?id=eq.${sport.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      activity: sport.name,
      color: sport.color,
    }),
  });
}

export async function deleteSport(id: number) {
  await supabaseFetch(`/rest/v1/${SPORT_TABLE}?id=eq.${id}`, {
    method: "DELETE",
  });
}

export function formatHours(entries: TrainingEntry[]) {
  const totalMinutes = entries.reduce(
    (sum, entry) => sum + (entry.lengthMinutes ? Number(entry.lengthMinutes) : 0),
    0,
  );
  return formatDuration(totalMinutes);
}
