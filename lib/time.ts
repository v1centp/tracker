export function formatDuration(minutes?: number) {
  if (!minutes || Number.isNaN(minutes)) return "—";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins} mins`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h${mins.toString().padStart(2, "0")}`;
}
