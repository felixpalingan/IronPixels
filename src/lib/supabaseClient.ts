import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gwyqrhaipihirpeknyey.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_AyF4vSPu2pq_FoYXYzrokQ_0Fe1co9D";

export const supabase = createClient(supabaseUrl, supabaseKey);
