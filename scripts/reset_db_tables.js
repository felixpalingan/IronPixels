global.WebSocket = class DummyWebSocket {};

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const [k, v] = line.split("=");
    if (k && v) {
      if (k.trim() === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = v.trim();
      if (k.trim() === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") supabaseKey = v.trim();
    }
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function wipeDatabase() {
  console.log("Cleaning up and resetting all Supabase DB tables...");

  const queries = [
    { table: "Session_Sets", column: "set_id" },
    { table: "Session_Exercises", column: "log_id" },
    { table: "Workout_Sessions", column: "session_id" },
    { table: "user_inventory", column: "inventory_id" },
    { table: "Party_Members", column: "member_id" },
    { table: "Party", column: "party_id" },
    { table: "friends", column: "id" },
    { table: "Equipped_Gear", column: "id" },
    { table: "User_Skills", column: "skill_id" },
    { table: "profiles", column: "id" },
  ];

  for (const item of queries) {
    try {
      const { error } = await supabase.from(item.table).delete().neq(item.column, "00000000-0000-0000-0000-000000000000");
      if (error) {
        console.log(`Notice on table '${item.table}':`, error.message);
      } else {
        console.log(`Successfully cleaned all rows from table '${item.table}'.`);
      }
    } catch (e) {
      console.log(`Skipped table '${item.table}':`, e.message);
    }
  }

  console.log("Database tables cleanup complete!");
}

wipeDatabase();
