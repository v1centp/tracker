const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment");
}

type SupabaseOptions = RequestInit & { headers?: HeadersInit };

export async function supabaseFetch(path: string, options?: SupabaseOptions) {
  const apiKey = SUPABASE_ANON_KEY ?? "";
  const baseHeaders = new Headers({
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  });
  if (options?.headers) {
    const extra = new Headers(options.headers as HeadersInit);
    extra.forEach((value, key) => baseHeaders.set(key, value));
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: baseHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${text}`);
  }

  return response;
}
