import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gwyqrhaipihirpeknyey.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_AyF4vSPu2pq_FoYXYzrokQ_0Fe1co9D"
  );
}
