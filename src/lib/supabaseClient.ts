import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wrvazjrpvwaippcsqxvg.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_JcebXyaBailBLK8l1o44wg_wXpN6bVr";

export const supabase = createClient(supabaseUrl, supabaseKey);
