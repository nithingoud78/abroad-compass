import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mrgyrlwkqptgupnkfsmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_x_BFOitJ_sApjpsTRGcNAQ_ZX-44qlq';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username")
    .limit(1);
    
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
