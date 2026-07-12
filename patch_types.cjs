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
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          action_link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          action_link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          action_link?: string | null;
          is_read?: boolean;
          created_at?: string;
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
`;

if (!content.includes("study_buddies: {")) {
  content = content.replace(
    "      calendar_tokens: {",
    tablesToInsert + "      calendar_tokens: {",
  );
  fs.writeFileSync("src/integrations/supabase/types.ts", content, "utf8");
  console.log("Patched types.ts successfully.");
} else {
  console.log("Already patched.");
}
