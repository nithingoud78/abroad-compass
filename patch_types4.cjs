const fs = require("fs");
let content = fs.readFileSync("src/integrations/supabase/types.ts", "utf8");

const tablesToInsert = `      legal_pages: {
        Row: {
          slug: string;
          title: string;
          content_md: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          title: string;
          content_md: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          content_md?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      study_buddies: {
        Row: {
          id: string;
          user_id_1: string;
          user_id_2: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id_1: string;
          user_id_2: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id_1?: string;
          user_id_2?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_buddies_user_id_1_fkey";
            columns: ["user_id_1"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "study_buddies_user_id_2_fkey";
            columns: ["user_id_2"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          }
        ];
      };
      targets: {
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
      admin_exam_schedule: {
        Row: {
          id: string;
          registration_opens: string | null;
          registration_closes: string | null;
          exam_date: string | null;
          result_date: string | null;
          exam_fee: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          registration_opens?: string | null;
          registration_closes?: string | null;
          exam_date?: string | null;
          result_date?: string | null;
          exam_fee?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          registration_opens?: string | null;
          registration_closes?: string | null;
          exam_date?: string | null;
          result_date?: string | null;
          exam_fee?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
`;

if (!content.includes("study_buddies: {")) {
  content = content.replace(
    "      calendar_tokens: {",
    tablesToInsert + "      calendar_tokens: {",
  );
  fs.writeFileSync("src/integrations/supabase/types.ts", content, "utf8");
  console.log("Patched types.ts successfully with patch_types4.");
} else {
  console.log("Already patched.");
}
