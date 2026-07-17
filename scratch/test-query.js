import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mrgyrlwkqptgupnkfsmb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_x_BFOitJ_sApjpsTRGcNAQ_ZX-44qlq';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("study_buddies")
    .select(`
      id,
      user_id_1,
      user_id_2,
      status,
      profile_1:profiles!study_buddies_user_id_1_fkey(username, display_name, avatar_url),
      profile_2:profiles!study_buddies_user_id_2_fkey(username, display_name, avatar_url)
    `)
    .limit(1);
    
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
