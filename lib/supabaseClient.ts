type SupabaseOptions = RequestInit & { headers?: HeadersInit };

export async function supabaseFetch(path: string, options?: SupabaseOptions) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment");
  }

  const apiKey = supabaseAnonKey ?? "";
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

  const response = await fetch(`${supabaseUrl}${path}`, {
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
