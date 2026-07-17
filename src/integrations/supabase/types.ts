export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achieved_on: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          achieved_on?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          achieved_on?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_exam_schedule: {
        Row: {
          created_at: string | null
          exam_date: string | null
          exam_fee: number | null
          id: string
          is_active: boolean | null
          registration_closes: string | null
          registration_opens: string | null
          result_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exam_date?: string | null
          exam_fee?: number | null
          id?: string
          is_active?: boolean | null
          registration_closes?: string | null
          registration_opens?: string | null
          result_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exam_date?: string | null
          exam_fee?: number | null
          id?: string
          is_active?: boolean | null
          registration_closes?: string | null
          registration_opens?: string | null
          result_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string | null
          id: string
          model: string
          response: Json
          user_id: string | null
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at?: string | null
          id?: string
          model: string
          response: Json
          user_id?: string | null
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          model?: string
          response?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      ai_documents: {
        Row: {
          created_at: string
          id: string
          input: Json
          kind: string
          output: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input?: Json
          kind: string
          output: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input?: Json
          kind?: string
          output?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_provider_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_tokens: number
          memory_size: number
          model: string
          provider: string
          safety_settings: Json
          streaming: boolean
          system_prompt: string | null
          temperature: number
          top_k: number | null
          top_p: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_tokens?: number
          memory_size?: number
          model: string
          provider: string
          safety_settings?: Json
          streaming?: boolean
          system_prompt?: string | null
          temperature?: number
          top_k?: number | null
          top_p?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_tokens?: number
          memory_size?: number
          model?: string
          provider?: string
          safety_settings?: Json
          streaming?: boolean
          system_prompt?: string | null
          temperature?: number
          top_k?: number | null
          top_p?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          capability: string | null
          created_at: string
          error: string | null
          id: string
          latency_ms: number | null
          model: string
          status: string
          thread_id: string | null
          tokens_in: number
          tokens_out: number
          user_id: string
        }
        Insert: {
          capability?: string | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          model: string
          status?: string
          thread_id?: string | null
          tokens_in?: number
          tokens_out?: number
          user_id: string
        }
        Update: {
          capability?: string | null
          created_at?: string
          error?: string | null
          id?: string
          latency_ms?: number | null
          model?: string
          status?: string
          thread_id?: string | null
          tokens_in?: number
          tokens_out?: number
          user_id?: string
        }
        Relationships: []
      }
      aps_tracker: {
        Row: {
          application_date: string | null
          certificate_received: string | null
          checklist: Json
          documents: Json
          interview_date: string | null
          notes: string | null
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_date?: string | null
          certificate_received?: string | null
          checklist?: Json
          documents?: Json
          interview_date?: string | null
          notes?: string | null
          stage?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_date?: string | null
          certificate_received?: string | null
          checklist?: Json
          documents?: Json
          interview_date?: string | null
          notes?: string | null
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity: string | null
          entity_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity?: string | null
          entity_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string
          body_md: string
          category: string
          cover_url: string | null
          created_at: string
          excerpt: string
          featured: boolean
          featured_image: string | null
          id: string
          is_published: boolean
          pinned: boolean
          published_at: string
          reading_minutes: number
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          body_md: string
          category?: string
          cover_url?: string | null
          created_at?: string
          excerpt: string
          featured?: boolean
          featured_image?: string | null
          id?: string
          is_published?: boolean
          pinned?: boolean
          published_at?: string
          reading_minutes?: number
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          body_md?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          featured_image?: string | null
          id?: string
          is_published?: boolean
          pinned?: boolean
          published_at?: string
          reading_minutes?: number
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_reading_progress: {
        Row: {
          completed: boolean
          post_id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          post_id: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          post_id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_reading_progress_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          description: string | null
          id: string
          kind: string
          notes: string | null
          occurred_on: string
          recurrence: string
          subcategory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind: string
          notes?: string | null
          occurred_on?: string
          recurrence?: string
          subcategory?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind?: string
          notes?: string | null
          occurred_on?: string
          recurrence?: string
          subcategory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          cert_type: string
          created_at: string
          file_url: string | null
          id: string
          name: string | null
          notes: string | null
          obtained_on: string | null
          score: string | null
          user_id: string
        }
        Insert: {
          cert_type: string
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          obtained_on?: string | null
          score?: string | null
          user_id: string
        }
        Update: {
          cert_type?: string
          created_at?: string
          file_url?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          obtained_on?: string | null
          score?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          ai_notes: string | null
          checkin_date: string
          created_at: string
          duolingo_levels: number | null
          effort: number | null
          id: string
          immersion_minutes: number | null
          learned: boolean
          reflection: string | null
          skip_reason: string | null
          study_duration_minutes: number | null
          user_id: string
          words_learned: number | null
        }
        Insert: {
          ai_notes?: string | null
          checkin_date: string
          created_at?: string
          duolingo_levels?: number | null
          effort?: number | null
          id?: string
          immersion_minutes?: number | null
          learned: boolean
          reflection?: string | null
          skip_reason?: string | null
          study_duration_minutes?: number | null
          user_id: string
          words_learned?: number | null
        }
        Update: {
          ai_notes?: string | null
          checkin_date?: string
          created_at?: string
          duolingo_levels?: number | null
          effort?: number | null
          id?: string
          immersion_minutes?: number | null
          learned?: boolean
          reflection?: string | null
          skip_reason?: string | null
          study_duration_minutes?: number | null
          user_id?: string
          words_learned?: number | null
        }
        Relationships: []
      }
      daily_progress: {
        Row: {
          checkin_date: string
          created_at: string | null
          dmat_figure_sequence_min: number
          dmat_formula_count: number
          dmat_latin_squares_min: number
          dmat_math_equations_min: number
          dmat_subject_module_min: number
          german_duolingo_lessons: number
          german_lesson_completed: boolean | null
          german_listening_min: number
          german_minutes: number | null
          german_reading_min: number
          german_speaking_min: number
          german_vocab: number | null
          german_writing_min: number
          id: string
          ielts_listening_hours: number | null
          ielts_mock_listening: number | null
          ielts_mock_overall: number | null
          ielts_mock_reading: number | null
          ielts_mock_speaking: number | null
          ielts_mock_taken: boolean
          ielts_mock_writing: number | null
          ielts_reading_hours: number | null
          ielts_speaking_hours: number | null
          ielts_vocab_count: number
          ielts_writing_hours: number | null
          testas_hours: number | null
          testas_topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checkin_date: string
          created_at?: string | null
          dmat_figure_sequence_min?: number
          dmat_formula_count?: number
          dmat_latin_squares_min?: number
          dmat_math_equations_min?: number
          dmat_subject_module_min?: number
          german_duolingo_lessons?: number
          german_lesson_completed?: boolean | null
          german_listening_min?: number
          german_minutes?: number | null
          german_reading_min?: number
          german_speaking_min?: number
          german_vocab?: number | null
          german_writing_min?: number
          id?: string
          ielts_listening_hours?: number | null
          ielts_mock_listening?: number | null
          ielts_mock_overall?: number | null
          ielts_mock_reading?: number | null
          ielts_mock_speaking?: number | null
          ielts_mock_taken?: boolean
          ielts_mock_writing?: number | null
          ielts_reading_hours?: number | null
          ielts_speaking_hours?: number | null
          ielts_vocab_count?: number
          ielts_writing_hours?: number | null
          testas_hours?: number | null
          testas_topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string | null
          dmat_figure_sequence_min?: number
          dmat_formula_count?: number
          dmat_latin_squares_min?: number
          dmat_math_equations_min?: number
          dmat_subject_module_min?: number
          german_duolingo_lessons?: number
          german_lesson_completed?: boolean | null
          german_listening_min?: number
          german_minutes?: number | null
          german_reading_min?: number
          german_speaking_min?: number
          german_vocab?: number | null
          german_writing_min?: number
          id?: string
          ielts_listening_hours?: number | null
          ielts_mock_listening?: number | null
          ielts_mock_overall?: number | null
          ielts_mock_reading?: number | null
          ielts_mock_speaking?: number | null
          ielts_mock_taken?: boolean
          ielts_mock_writing?: number | null
          ielts_reading_hours?: number | null
          ielts_speaking_hours?: number | null
          ielts_vocab_count?: number
          ielts_writing_hours?: number | null
          testas_hours?: number | null
          testas_topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dmat_mock_tests: {
        Row: {
          details: Json
          duration_min: number | null
          id: string
          kind: string
          max_score: number
          score: number | null
          subject: string | null
          taken_at: string
          user_id: string
        }
        Insert: {
          details?: Json
          duration_min?: number | null
          id?: string
          kind: string
          max_score?: number
          score?: number | null
          subject?: string | null
          taken_at?: string
          user_id: string
        }
        Update: {
          details?: Json
          duration_min?: number | null
          id?: string
          kind?: string
          max_score?: number
          score?: number | null
          subject?: string | null
          taken_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dmat_progress: {
        Row: {
          confidence: number | null
          difficulty: string | null
          id: string
          notes: string | null
          progress_pct: number
          study_min: number
          subject: string
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          difficulty?: string | null
          id?: string
          notes?: string | null
          progress_pct?: number
          study_min?: number
          subject: string
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          difficulty?: string | null
          id?: string
          notes?: string | null
          progress_pct?: number
          study_min?: number
          subject?: string
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dmat_registration: {
        Row: {
          application_date: string | null
          application_submitted: boolean
          exam_center: string | null
          fee_paid: boolean
          hall_ticket: boolean
          registered: boolean
          registration_number: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_date?: string | null
          application_submitted?: boolean
          exam_center?: string | null
          fee_paid?: boolean
          hall_ticket?: boolean
          registered?: boolean
          registration_number?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_date?: string | null
          application_submitted?: boolean
          exam_center?: string | null
          fee_paid?: boolean
          hall_ticket?: boolean
          registered?: boolean
          registration_number?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dmat_settings: {
        Row: {
          created_at: string | null
          id: string
          target_score: number | null
          updated_at: string | null
          user_exam_date: string | null
          user_exam_session: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_score?: number | null
          updated_at?: string | null
          user_exam_date?: string | null
          user_exam_session?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_score?: number | null
          updated_at?: string | null
          user_exam_date?: string | null
          user_exam_session?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_reviews: {
        Row: {
          created_at: string
          document_id: string
          feedback: Json
          id: string
          model: string
          score: number | null
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          feedback?: Json
          id?: string
          model: string
          score?: number | null
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          feedback?: Json
          id?: string
          model?: string
          score?: number | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          expiry_date: string | null
          favorite: boolean
          file_path: string | null
          folder: string | null
          id: string
          link_url: string | null
          name: string
          notes: string | null
          pinned: boolean
          status: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          expiry_date?: string | null
          favorite?: boolean
          file_path?: string | null
          folder?: string | null
          id?: string
          link_url?: string | null
          name: string
          notes?: string | null
          pinned?: boolean
          status?: string
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          expiry_date?: string | null
          favorite?: boolean
          file_path?: string | null
          folder?: string | null
          id?: string
          link_url?: string | null
          name?: string
          notes?: string | null
          pinned?: boolean
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      education: {
        Row: {
          current_semester: number | null
          intermediate: string | null
          tenth_percentage: number | null
          total_credits: number | null
          ug_cgpa: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_semester?: number | null
          intermediate?: string | null
          tenth_percentage?: number | null
          total_credits?: number | null
          ug_cgpa?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_semester?: number | null
          intermediate?: string | null
          tenth_percentage?: number | null
          total_credits?: number | null
          ug_cgpa?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base: string
          captured_at: string
          id: string
          quote: string
          rate: number
        }
        Insert: {
          base: string
          captured_at?: string
          id?: string
          quote: string
          rate: number
        }
        Update: {
          base?: string
          captured_at?: string
          id?: string
          quote?: string
          rate?: number
        }
        Relationships: []
      }
      feedback_items: {
        Row: {
          assignee: string | null
          attachments: Json
          created_at: string
          description: string
          developer_notes: string | null
          duplicate_of: string | null
          featured: boolean
          id: string
          internal_notes: string | null
          kind: string
          pinned: boolean
          priority: string
          rating: number | null
          roadmap_stage: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          vote_count: number
        }
        Insert: {
          assignee?: string | null
          attachments?: Json
          created_at?: string
          description: string
          developer_notes?: string | null
          duplicate_of?: string | null
          featured?: boolean
          id?: string
          internal_notes?: string | null
          kind?: string
          pinned?: boolean
          priority?: string
          rating?: number | null
          roadmap_stage?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          vote_count?: number
        }
        Update: {
          assignee?: string | null
          attachments?: Json
          created_at?: string
          description?: string
          developer_notes?: string | null
          duplicate_of?: string | null
          featured?: boolean
          id?: string
          internal_notes?: string | null
          kind?: string
          pinned?: boolean
          priority?: string
          rating?: number | null
          roadmap_stage?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "feedback_items_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "feedback_items"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_votes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "feedback_items"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          actual_minutes: number
          created_at: string
          ended_at: string | null
          id: string
          interrupted: boolean
          label: string | null
          mode: string
          planned_minutes: number
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          actual_minutes?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          interrupted?: boolean
          label?: string | null
          mode?: string
          planned_minutes: number
          started_at?: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          actual_minutes?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          interrupted?: boolean
          label?: string | null
          mode?: string
          planned_minutes?: number
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      goethe_settings: {
        Row: {
          created_at: string | null
          exam_date: string | null
          id: string
          target_level: string | null
          target_readiness: number | null
          updated_at: string | null
          user_id: string
          weekly_goal_hours: number | null
        }
        Insert: {
          created_at?: string | null
          exam_date?: string | null
          id?: string
          target_level?: string | null
          target_readiness?: number | null
          updated_at?: string | null
          user_id: string
          weekly_goal_hours?: number | null
        }
        Update: {
          created_at?: string | null
          exam_date?: string | null
          id?: string
          target_level?: string | null
          target_readiness?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_goal_hours?: number | null
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_on: string
          count: number
          created_at: string
          habit_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          completed_on?: string
          count?: number
          created_at?: string
          habit_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          completed_on?: string
          count?: number
          created_at?: string
          habit_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived_at: string | null
          cadence: string
          category: string | null
          color: string | null
          created_at: string
          current_streak: number
          description: string | null
          icon: string | null
          id: string
          last_completed_on: string | null
          longest_streak: number
          name: string
          target_per_period: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          cadence?: string
          category?: string | null
          color?: string | null
          created_at?: string
          current_streak?: number
          description?: string | null
          icon?: string | null
          id?: string
          last_completed_on?: string | null
          longest_streak?: number
          name: string
          target_per_period?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          cadence?: string
          category?: string | null
          color?: string | null
          created_at?: string
          current_streak?: number
          description?: string | null
          icon?: string | null
          id?: string
          last_completed_on?: string | null
          longest_streak?: number
          name?: string
          target_per_period?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ielts_goals: {
        Row: {
          daily_min: number
          target_band: number
          test_date: string | null
          updated_at: string
          user_id: string
          weekly_min: number
        }
        Insert: {
          daily_min?: number
          target_band?: number
          test_date?: string | null
          updated_at?: string
          user_id: string
          weekly_min?: number
        }
        Update: {
          daily_min?: number
          target_band?: number
          test_date?: string | null
          updated_at?: string
          user_id?: string
          weekly_min?: number
        }
        Relationships: []
      }
      ielts_practice: {
        Row: {
          band: number | null
          bookmarked: boolean
          created_at: string
          duration_min: number | null
          id: string
          mistakes: Json
          notes: string | null
          skill: string
          title: string
          user_id: string
        }
        Insert: {
          band?: number | null
          bookmarked?: boolean
          created_at?: string
          duration_min?: number | null
          id?: string
          mistakes?: Json
          notes?: string | null
          skill: string
          title: string
          user_id: string
        }
        Update: {
          band?: number | null
          bookmarked?: boolean
          created_at?: string
          duration_min?: number | null
          id?: string
          mistakes?: Json
          notes?: string | null
          skill?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ielts_settings: {
        Row: {
          created_at: string | null
          exam_date_lrw: string | null
          exam_date_speaking: string | null
          id: string
          target_listening: number | null
          target_overall: number | null
          target_reading: number | null
          target_speaking: number | null
          target_writing: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_date_lrw?: string | null
          exam_date_speaking?: string | null
          id?: string
          target_listening?: number | null
          target_overall?: number | null
          target_reading?: number | null
          target_speaking?: number | null
          target_writing?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_date_lrw?: string | null
          exam_date_speaking?: string | null
          id?: string
          target_listening?: number | null
          target_overall?: number | null
          target_reading?: number | null
          target_speaking?: number | null
          target_writing?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      learning_links: {
        Row: {
          ai_summary: string | null
          checkin_id: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          link_date: string
          notes: string | null
          source: string | null
          subject: string | null
          tags: string[] | null
          title: string
          topics: string[] | null
          url: string
          user_id: string
          user_summary: string | null
        }
        Insert: {
          ai_summary?: string | null
          checkin_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          link_date: string
          notes?: string | null
          source?: string | null
          subject?: string | null
          tags?: string[] | null
          title: string
          topics?: string[] | null
          url: string
          user_id: string
          user_summary?: string | null
        }
        Update: {
          ai_summary?: string | null
          checkin_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          link_date?: string
          notes?: string | null
          source?: string | null
          subject?: string | null
          tags?: string[] | null
          title?: string
          topics?: string[] | null
          url?: string
          user_id?: string
          user_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_links_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_pages: {
        Row: {
          content_md: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content_md: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content_md?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          created_at: string
          event: string
          id: string
          ip: unknown
          metadata: Json
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          ip?: unknown
          metadata?: Json
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          ip?: unknown
          metadata?: Json
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          archived_at: string | null
          body: string | null
          created_at: string
          id: string
          link: string | null
          metadata: Json
          priority: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          priority?: string
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          metadata?: Json
          priority?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_german_level: string | null
          display_name: string | null
          germany_target_date: string | null
          github_username: string | null
          instagram_username: string | null
          linkedin_username: string | null
          onboarding_completed: boolean
          target_country: string | null
          target_degree: string | null
          target_intake: string | null
          theme: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_german_level?: string | null
          display_name?: string | null
          germany_target_date?: string | null
          github_username?: string | null
          instagram_username?: string | null
          linkedin_username?: string | null
          onboarding_completed?: boolean
          target_country?: string | null
          target_degree?: string | null
          target_intake?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_german_level?: string | null
          display_name?: string | null
          germany_target_date?: string | null
          github_username?: string | null
          instagram_username?: string | null
          linkedin_username?: string | null
          onboarding_completed?: boolean
          target_country?: string | null
          target_degree?: string | null
          target_intake?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          demo_url: string | null
          description: string | null
          github_url: string | null
          id: string
          name: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          name: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          demo_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          bookmarked: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          tags: string[]
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          bookmarked?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          tags?: string[]
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          bookmarked?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_scholarships: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          scholarship_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          scholarship_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          scholarship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_scholarships_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          created_at: string
          currency: string
          current_amount: number
          deadline: string | null
          id: string
          name: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name: string
          target_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          amount_eur: number | null
          country: string | null
          created_at: string
          deadline: string | null
          eligibility: string | null
          id: string
          link: string | null
          name: string
          provider: string | null
          requirements: string | null
          tags: string[]
        }
        Insert: {
          amount_eur?: number | null
          country?: string | null
          created_at?: string
          deadline?: string | null
          eligibility?: string | null
          id?: string
          link?: string | null
          name: string
          provider?: string | null
          requirements?: string | null
          tags?: string[]
        }
        Update: {
          amount_eur?: number | null
          country?: string | null
          created_at?: string
          deadline?: string | null
          eligibility?: string | null
          id?: string
          link?: string | null
          name?: string
          provider?: string | null
          requirements?: string | null
          tags?: string[]
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          query: string
          scope: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          scope?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      semester_subjects: {
        Row: {
          created_at: string
          credits: number
          grade: string | null
          id: string
          marks: number | null
          name: string
          semester_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          grade?: string | null
          id?: string
          marks?: number | null
          name: string
          semester_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          grade?: string | null
          id?: string
          marks?: number | null
          name?: string
          semester_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "semester_subjects_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      semesters: {
        Row: {
          created_at: string
          credits_completed: number | null
          ects_estimate: number | null
          id: string
          name: string | null
          semester_number: number
          sgpa: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_completed?: number | null
          ects_estimate?: number | null
          id?: string
          name?: string | null
          semester_number: number
          sgpa?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          credits_completed?: number | null
          ects_estimate?: number | null
          id?: string
          name?: string | null
          semester_number?: number
          sgpa?: number | null
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_streak: number
          last_checkin_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_checkin_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          last_checkin_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      targets: {
        Row: {
          budget_blocked_account: number | null
          budget_monthly: number | null
          budget_savings: number | null
          created_at: string | null
          german_date: string | null
          german_level: string | null
          id: string
          timeline_accommodation_date: string | null
          timeline_aps_date: string | null
          timeline_flight_date: string | null
          timeline_passport_date: string | null
          timeline_visa_date: string | null
          uni_acc_count: number | null
          uni_app_count: number | null
          uni_dream: string | null
          uni_intake_season: string | null
          uni_intake_year: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_blocked_account?: number | null
          budget_monthly?: number | null
          budget_savings?: number | null
          created_at?: string | null
          german_date?: string | null
          german_level?: string | null
          id?: string
          timeline_accommodation_date?: string | null
          timeline_aps_date?: string | null
          timeline_flight_date?: string | null
          timeline_passport_date?: string | null
          timeline_visa_date?: string | null
          uni_acc_count?: number | null
          uni_app_count?: number | null
          uni_dream?: string | null
          uni_intake_season?: string | null
          uni_intake_year?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_blocked_account?: number | null
          budget_monthly?: number | null
          budget_savings?: number | null
          created_at?: string | null
          german_date?: string | null
          german_level?: string | null
          id?: string
          timeline_accommodation_date?: string | null
          timeline_aps_date?: string | null
          timeline_flight_date?: string | null
          timeline_passport_date?: string | null
          timeline_visa_date?: string | null
          uni_acc_count?: number | null
          uni_app_count?: number | null
          uni_dream?: string | null
          uni_intake_season?: string | null
          uni_intake_year?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          depends_on: string[]
          description: string | null
          due_date: string | null
          id: string
          labels: string[]
          module: string
          next_occurrence_at: string | null
          parent_task_id: string | null
          position: number
          priority: string
          recurrence: Json | null
          recurrence_rule: string | null
          related_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          depends_on?: string[]
          description?: string | null
          due_date?: string | null
          id?: string
          labels?: string[]
          module?: string
          next_occurrence_at?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: string
          recurrence?: Json | null
          recurrence_rule?: string | null
          related_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          depends_on?: string[]
          description?: string | null
          due_date?: string | null
          id?: string
          labels?: string[]
          module?: string
          next_occurrence_at?: string | null
          parent_task_id?: string | null
          position?: number
          priority?: string
          recurrence?: Json | null
          recurrence_rule?: string | null
          related_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          acceptance_chance: string | null
          admission_decision: string | null
          application_fee_eur: number | null
          application_stage: string
          application_status: string | null
          aps_required: boolean | null
          cgpa_required: number | null
          city: string | null
          color_tag: string | null
          communications: Json
          country: string | null
          course: string | null
          course_duration_months: number | null
          created_at: string
          deadline: string | null
          ects_required: number | null
          english_requirement: string | null
          estimated_earnings_eur: number | null
          favourite: boolean | null
          german_requirement: string | null
          id: string
          internship: boolean | null
          interview_date: string | null
          interview_notes: string | null
          living_cost_eur: number | null
          name: string
          notes: string | null
          notes_timeline: Json
          offer_details: Json | null
          part_time: boolean | null
          pinned: boolean | null
          priority: string | null
          public_private: string | null
          qs_ranking: number | null
          required_subjects: string[] | null
          scholarship: boolean | null
          scholarship_amount_eur: number | null
          scholarship_status: string | null
          semester_fee_eur: number | null
          state: string | null
          summer: boolean | null
          tuition_fee_eur: number | null
          uni_assist: boolean | null
          updated_at: string
          user_id: string
          website: string | null
          winter: boolean | null
        }
        Insert: {
          acceptance_chance?: string | null
          admission_decision?: string | null
          application_fee_eur?: number | null
          application_stage?: string
          application_status?: string | null
          aps_required?: boolean | null
          cgpa_required?: number | null
          city?: string | null
          color_tag?: string | null
          communications?: Json
          country?: string | null
          course?: string | null
          course_duration_months?: number | null
          created_at?: string
          deadline?: string | null
          ects_required?: number | null
          english_requirement?: string | null
          estimated_earnings_eur?: number | null
          favourite?: boolean | null
          german_requirement?: string | null
          id?: string
          internship?: boolean | null
          interview_date?: string | null
          interview_notes?: string | null
          living_cost_eur?: number | null
          name: string
          notes?: string | null
          notes_timeline?: Json
          offer_details?: Json | null
          part_time?: boolean | null
          pinned?: boolean | null
          priority?: string | null
          public_private?: string | null
          qs_ranking?: number | null
          required_subjects?: string[] | null
          scholarship?: boolean | null
          scholarship_amount_eur?: number | null
          scholarship_status?: string | null
          semester_fee_eur?: number | null
          state?: string | null
          summer?: boolean | null
          tuition_fee_eur?: number | null
          uni_assist?: boolean | null
          updated_at?: string
          user_id: string
          website?: string | null
          winter?: boolean | null
        }
        Update: {
          acceptance_chance?: string | null
          admission_decision?: string | null
          application_fee_eur?: number | null
          application_stage?: string
          application_status?: string | null
          aps_required?: boolean | null
          cgpa_required?: number | null
          city?: string | null
          color_tag?: string | null
          communications?: Json
          country?: string | null
          course?: string | null
          course_duration_months?: number | null
          created_at?: string
          deadline?: string | null
          ects_required?: number | null
          english_requirement?: string | null
          estimated_earnings_eur?: number | null
          favourite?: boolean | null
          german_requirement?: string | null
          id?: string
          internship?: boolean | null
          interview_date?: string | null
          interview_notes?: string | null
          living_cost_eur?: number | null
          name?: string
          notes?: string | null
          notes_timeline?: Json
          offer_details?: Json | null
          part_time?: boolean | null
          pinned?: boolean | null
          priority?: string | null
          public_private?: string | null
          qs_ranking?: number | null
          required_subjects?: string[] | null
          scholarship?: boolean | null
          scholarship_amount_eur?: number | null
          scholarship_status?: string | null
          semester_fee_eur?: number | null
          state?: string | null
          summer?: boolean | null
          tuition_fee_eur?: number | null
          uni_assist?: boolean | null
          updated_at?: string
          user_id?: string
          website?: string | null
          winter?: boolean | null
        }
        Relationships: []
      }
      university_recommendations: {
        Row: {
          acceptance_probability: number | null
          bucket: string
          created_at: string
          gaps: Json
          id: string
          match_score: number
          model: string | null
          reasoning: string | null
          scholarships: Json
          university_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acceptance_probability?: number | null
          bucket: string
          created_at?: string
          gaps?: Json
          id?: string
          match_score?: number
          model?: string | null
          reasoning?: string | null
          scholarships?: Json
          university_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acceptance_probability?: number | null
          bucket?: string
          created_at?: string
          gaps?: Json
          id?: string
          match_score?: number
          model?: string | null
          reasoning?: string | null
          scholarships?: Json
          university_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_recommendations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          ai_cache_enabled: boolean
          ai_context_profile: boolean
          ai_default_model: string
          ai_memory_enabled: boolean
          ai_streaming: boolean
          ai_temperature: number
          ai_top_p: number
          created_at: string
          currency: string
          dashboard_collapsed: Json
          dashboard_layout: Json
          locale: string
          notify_deadline_reminders: boolean
          notify_email: boolean
          notify_email_digest: boolean
          notify_push: boolean
          notify_push_enabled: boolean
          notify_study_reminders: boolean
          theme: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_cache_enabled?: boolean
          ai_context_profile?: boolean
          ai_default_model?: string
          ai_memory_enabled?: boolean
          ai_streaming?: boolean
          ai_temperature?: number
          ai_top_p?: number
          created_at?: string
          currency?: string
          dashboard_collapsed?: Json
          dashboard_layout?: Json
          locale?: string
          notify_deadline_reminders?: boolean
          notify_email?: boolean
          notify_email_digest?: boolean
          notify_push?: boolean
          notify_push_enabled?: boolean
          notify_study_reminders?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_cache_enabled?: boolean
          ai_context_profile?: boolean
          ai_default_model?: string
          ai_memory_enabled?: boolean
          ai_streaming?: boolean
          ai_temperature?: number
          ai_top_p?: number
          created_at?: string
          currency?: string
          dashboard_collapsed?: Json
          dashboard_layout?: Json
          locale?: string
          notify_deadline_reminders?: boolean
          notify_email?: boolean
          notify_email_digest?: boolean
          notify_push?: boolean
          notify_push_enabled?: boolean
          notify_study_reminders?: boolean
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visa_tracker: {
        Row: {
          appointment_date: string | null
          appointment_location: string | null
          approval_date: string | null
          checklist: Json
          documents: Json
          interview_date: string | null
          notes: string | null
          stage: string
          updated_at: string
          user_id: string
          visa_type: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_location?: string | null
          approval_date?: string | null
          checklist?: Json
          documents?: Json
          interview_date?: string | null
          notes?: string | null
          stage?: string
          updated_at?: string
          user_id: string
          visa_type?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_location?: string | null
          approval_date?: string | null
          checklist?: Json
          documents?: Json
          interview_date?: string | null
          notes?: string | null
          stage?: string
          updated_at?: string
          user_id?: string
          visa_type?: string | null
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          category: string | null
          created_at: string
          difficulty: string | null
          english: string
          german: string
          id: string
          mastered: boolean
          revision_count: number
          sentence: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          difficulty?: string | null
          english: string
          german: string
          id?: string
          mastered?: boolean
          revision_count?: number
          sentence?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          difficulty?: string | null
          english?: string
          german?: string
          id?: string
          mastered?: boolean
          revision_count?: number
          sentence?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_analytics: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      upsert_streak: {
        Args: { p_date: string }
        Returns: {
          current_streak: number
          last_checkin_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "admin" | "super_admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "super_admin", "user"],
    },
  },
} as const
