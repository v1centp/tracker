import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appendSport, fetchSports, Sport, updateSport, deleteSport } from "@/lib/data";

async function addSportAction(formData: FormData) {
  "use server";
  const name = formData.get("sportName")?.toString().trim();
  const color = formData.get("sportColor")?.toString().trim() || "#ffffff";
  if (!name) return;

  await appendSport({ name, color });
  revalidatePath("/add");
  revalidatePath("/");
  redirect("/add");
}

async function updateSportAction(formData: FormData) {
  "use server";
  const name = formData.get("sportName")?.toString().trim();
  const color = formData.get("sportColor")?.toString().trim() || "#ffffff";
  const id = Number(formData.get("sportId"));
  if (!name || Number.isNaN(id)) return;

  await updateSport({ name, color, id });
  revalidatePath("/add");
  revalidatePath("/");
  redirect("/add");
}

async function deleteSportAction(formData: FormData) {
  "use server";
  const id = Number(formData.get("sportId"));
  if (!id || Number.isNaN(id)) return;
  await deleteSport(id);
  revalidatePath("/add");
  revalidatePath("/");
  redirect("/add");
}

export default async function AddPage() {
  const sports = await fetchSports();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Nouvelle activité</p>
            <h1 className="text-3xl font-semibold text-white">Gestion des activités</h1>
            <p className="text-sm text-slate-300">Créer, modifier ou supprimer tes activités et leurs couleurs.</p>
          </div>
          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
          >
            Retour au tableau
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <form
            action={addSportAction}
            className="rounded-3xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Créer une activité</h2>
              <span className="text-xs uppercase tracking-[0.16em] text-slate-400">Supabase</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Nom
                <input
                  name="sportName"
                  required
                  placeholder="Trail, Yoga..."
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/30"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Couleur
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                  <input
                    type="color"
                    name="sportColor"
                    defaultValue="#10b981"
                    className="h-9 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent"
                  />
                  <span className="text-xs text-slate-300">Choisis une couleur</span>
                </div>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button
                type="submit"
                className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
              >
                Enregistrer
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Activités existantes</p>
            <div className="mt-3 space-y-3">
              {sports
                .filter((sport) => sport.id !== undefined)
                .map((sport: Sport) => (
                  <div
                    key={`${sport.id}-${sport.name}`}
                    className="flex flex-col gap-2 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <form action={updateSportAction} className="flex flex-1 flex-wrap items-center gap-3">
                      <input type="hidden" name="sportId" value={sport.id} />
                      <label className="flex flex-col text-xs uppercase tracking-[0.08em] text-slate-400">
                        Name
                        <input
                          name="sportName"
                          defaultValue={sport.name}
                          className="mt-1 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none ring-1 ring-transparent transition focus:border-white/20 focus:ring-white/30"
                        />
                      </label>
                      <label className="flex flex-col text-xs uppercase tracking-[0.08em] text-slate-400">
                        Color
                        <input
                          type="color"
                          name="sportColor"
                          defaultValue={sport.color}
                          className="mt-1 h-10 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent"
                        />
                      </label>
                      <button
                        type="submit"
                        className="self-start rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/15"
                      >
                        Mettre à jour
                      </button>
                    </form>
                    <form action={deleteSportAction}>
                      <input type="hidden" name="sportId" value={sport.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400/60 hover:bg-red-500/20"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
