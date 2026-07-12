const fs = require("fs");
let code = fs.readFileSync("src/integrations/supabase/types.ts", "utf8");

const newTypes = `
      admin_exam_schedule: {
        Row: {
          created_at: string;
          exam_date: string | null;
          exam_fee: number | null;
          id: string;
          is_active: boolean | null;
          registration_closes: string | null;
          registration_opens: string | null;
          result_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          exam_date?: string | null;
          exam_fee?: number | null;
          id?: string;
          is_active?: boolean | null;
          registration_closes?: string | null;
          registration_opens?: string | null;
          result_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          exam_date?: string | null;
          exam_fee?: number | null;
          id?: string;
          is_active?: boolean | null;
          registration_closes?: string | null;
          registration_opens?: string | null;
          result_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      daily_progress: {
        Row: {
          checkin_date: string;
          created_at: string | null;
          german_lesson_completed: boolean | null;
          german_minutes: number | null;
          german_vocab: number | null;
          id: string;
          ielts_listening_hours: number | null;
          ielts_reading_hours: number | null;
          ielts_speaking_hours: number | null;
          ielts_writing_hours: number | null;
          testas_hours: number | null;
          testas_topic: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          checkin_date: string;
          created_at?: string | null;
          german_lesson_completed?: boolean | null;
          german_minutes?: number | null;
          german_vocab?: number | null;
          id?: string;
          ielts_listening_hours?: number | null;
          ielts_reading_hours?: number | null;
          ielts_speaking_hours?: number | null;
          ielts_writing_hours?: number | null;
          testas_hours?: number | null;
          testas_topic?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          checkin_date?: string;
          created_at?: string | null;
          german_lesson_completed?: boolean | null;
          german_minutes?: number | null;
          german_vocab?: number | null;
          id?: string;
          ielts_listening_hours?: number | null;
          ielts_reading_hours?: number | null;
          ielts_speaking_hours?: number | null;
          ielts_writing_hours?: number | null;
          testas_hours?: number | null;
          testas_topic?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      dmat_settings: {
        Row: {
          created_at: string | null;
          id: string;
          target_score: number | null;
          updated_at: string | null;
          user_exam_date: string | null;
          user_exam_session: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          target_score?: number | null;
          updated_at?: string | null;
          user_exam_date?: string | null;
          user_exam_session?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          target_score?: number | null;
          updated_at?: string | null;
          user_exam_date?: string | null;
          user_exam_session?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      ielts_settings: {
        Row: {
          created_at: string | null;
          exam_date_lrw: string | null;
          exam_date_speaking: string | null;
          id: string;
          target_listening: number | null;
          target_overall: number | null;
          target_reading: number | null;
          target_speaking: number | null;
          target_writing: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          exam_date_lrw?: string | null;
          exam_date_speaking?: string | null;
          id?: string;
          target_listening?: number | null;
          target_overall?: number | null;
          target_reading?: number | null;
          target_speaking?: number | null;
          target_writing?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          exam_date_lrw?: string | null;
          exam_date_speaking?: string | null;
          id?: string;
          target_listening?: number | null;
          target_overall?: number | null;
          target_reading?: number | null;
          target_speaking?: number | null;
          target_writing?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      targets: {
        Row: {
          budget_blocked_account: number | null;
          budget_monthly: number | null;
          budget_savings: number | null;
          created_at: string | null;
          german_date: string | null;
          german_level: string | null;
          id: string;
          timeline_accommodation_date: string | null;
          timeline_aps_date: string | null;
          timeline_flight_date: string | null;
          timeline_passport_date: string | null;
          timeline_visa_date: string | null;
          uni_acc_count: number | null;
          uni_app_count: number | null;
          uni_dream: string | null;
          uni_intake_season: string | null;
          uni_intake_year: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          budget_blocked_account?: number | null;
          budget_monthly?: number | null;
          budget_savings?: number | null;
          created_at?: string | null;
          german_date?: string | null;
          german_level?: string | null;
          id?: string;
          timeline_accommodation_date?: string | null;
          timeline_aps_date?: string | null;
          timeline_flight_date?: string | null;
          timeline_passport_date?: string | null;
          timeline_visa_date?: string | null;
          uni_acc_count?: number | null;
          uni_app_count?: number | null;
          uni_dream?: string | null;
          uni_intake_season?: string | null;
          uni_intake_year?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          budget_blocked_account?: number | null;
          budget_monthly?: number | null;
          budget_savings?: number | null;
          created_at?: string | null;
          german_date?: string | null;
          german_level?: string | null;
          id?: string;
          timeline_accommodation_date?: string | null;
          timeline_aps_date?: string | null;
          timeline_flight_date?: string | null;
          timeline_passport_date?: string | null;
          timeline_visa_date?: string | null;
          uni_acc_count?: number | null;
          uni_app_count?: number | null;
          uni_dream?: string | null;
          uni_intake_season?: string | null;
          uni_intake_year?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
`;

code = code.replace(/(\s*Tables: {\s*)/, "$1" + newTypes);
fs.writeFileSync("src/integrations/supabase/types.ts", code);
