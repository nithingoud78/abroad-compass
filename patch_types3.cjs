const fs = require("fs");
let content = fs.readFileSync("src/integrations/supabase/types.ts", "utf8");

const tablesToInsert = `      targets: {
        Row: {
          id: string;
          user_id: string;
          german_level: string | null;
          german_date: string | null;
          budget_savings: number | null;
          budget_blocked_account: number | null;
          budget_monthly: number | null;
          uni_dream: string | null;
          uni_intake_season: string | null;
          uni_intake_year: string | null;
          uni_app_count: number | null;
          uni_acc_count: number | null;
          timeline_passport_date: string | null;
          timeline_aps_date: string | null;
          timeline_visa_date: string | null;
          timeline_accommodation_date: string | null;
          timeline_flight_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          german_level?: string | null;
          german_date?: string | null;
          budget_savings?: number | null;
          budget_blocked_account?: number | null;
          budget_monthly?: number | null;
          uni_dream?: string | null;
          uni_intake_season?: string | null;
          uni_intake_year?: string | null;
          uni_app_count?: number | null;
          uni_acc_count?: number | null;
          timeline_passport_date?: string | null;
          timeline_aps_date?: string | null;
          timeline_visa_date?: string | null;
          timeline_accommodation_date?: string | null;
          timeline_flight_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          german_level?: string | null;
          german_date?: string | null;
          budget_savings?: number | null;
          budget_blocked_account?: number | null;
          budget_monthly?: number | null;
          uni_dream?: string | null;
          uni_intake_season?: string | null;
          uni_intake_year?: string | null;
          uni_app_count?: number | null;
          uni_acc_count?: number | null;
          timeline_passport_date?: string | null;
          timeline_aps_date?: string | null;
          timeline_visa_date?: string | null;
          timeline_accommodation_date?: string | null;
          timeline_flight_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      dmat_settings: {
        Row: {
          id: string;
          user_id: string;
          target_score: number | null;
          user_exam_date: string | null;
          user_exam_session: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_score?: number | null;
          user_exam_date?: string | null;
          user_exam_session?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_score?: number | null;
          user_exam_date?: string | null;
          user_exam_session?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
`;

if (!content.includes("targets: {")) {
  content = content.replace(
    "      calendar_tokens: {",
    tablesToInsert + "      calendar_tokens: {",
  );
  fs.writeFileSync("src/integrations/supabase/types.ts", content, "utf8");
  console.log("Patched types.ts successfully with targets and dmat_settings.");
} else {
  console.log("Already patched.");
}
