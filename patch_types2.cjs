const fs = require("fs");
let content = fs.readFileSync("src/integrations/supabase/types.ts", "utf8");

const tablesToInsert = `      goethe_settings: {
        Row: {
          id: string;
          user_id: string;
          target_level: string | null;
          exam_date: string | null;
          weekly_goal_hours: number | null;
          target_readiness: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_level?: string | null;
          exam_date?: string | null;
          weekly_goal_hours?: number | null;
          target_readiness?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_level?: string | null;
          exam_date?: string | null;
          weekly_goal_hours?: number | null;
          target_readiness?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ielts_settings: {
        Row: {
          id: string;
          user_id: string;
          target_overall: number | null;
          target_listening: number | null;
          target_reading: number | null;
          target_writing: number | null;
          target_speaking: number | null;
          exam_date_lrw: string | null;
          exam_date_speaking: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_overall?: number | null;
          target_listening?: number | null;
          target_reading?: number | null;
          target_writing?: number | null;
          target_speaking?: number | null;
          exam_date_lrw?: string | null;
          exam_date_speaking?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          target_overall?: number | null;
          target_listening?: number | null;
          target_reading?: number | null;
          target_writing?: number | null;
          target_speaking?: number | null;
          exam_date_lrw?: string | null;
          exam_date_speaking?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      daily_progress: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          german_minutes: number | null;
          german_vocab: number | null;
          german_lesson_completed: boolean | null;
          ielts_listening_hours: number | null;
          ielts_reading_hours: number | null;
          ielts_writing_hours: number | null;
          ielts_speaking_hours: number | null;
          testas_topic: string | null;
          testas_hours: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          checkin_date: string;
          german_minutes?: number | null;
          german_vocab?: number | null;
          german_lesson_completed?: boolean | null;
          ielts_listening_hours?: number | null;
          ielts_reading_hours?: number | null;
          ielts_writing_hours?: number | null;
          ielts_speaking_hours?: number | null;
          testas_topic?: string | null;
          testas_hours?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          checkin_date?: string;
          german_minutes?: number | null;
          german_vocab?: number | null;
          german_lesson_completed?: boolean | null;
          ielts_listening_hours?: number | null;
          ielts_reading_hours?: number | null;
          ielts_writing_hours?: number | null;
          ielts_speaking_hours?: number | null;
          testas_topic?: string | null;
          testas_hours?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
`;

if (!content.includes("goethe_settings: {")) {
  content = content.replace(
    "      calendar_tokens: {",
    tablesToInsert + "      calendar_tokens: {",
  );
  fs.writeFileSync("src/integrations/supabase/types.ts", content, "utf8");
  console.log("Patched types.ts successfully with goethe and ielts.");
} else {
  console.log("Already patched.");
}
