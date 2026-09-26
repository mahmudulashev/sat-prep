// Generated from the Supabase schema. Regenerate after changing migrations.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      attempts: {
        Row: {
          answers: Json;
          breakdown: Json | null;
          correct_count: number | null;
          deadline: string;
          english_score: number | null;
          flagged: string[];
          guest_key: string | null;
          id: string;
          ip_hash: string | null;
          math_score: number | null;
          module_index: number;
          modules: Json;
          question_ids: string[];
          score: number | null;
          section: Database["public"]["Enums"]["exam_section"];
          started_at: string;
          status: Database["public"]["Enums"]["attempt_status"];
          submitted_at: string | null;
          test_id: string;
          time_spent: Json;
          total_count: number | null;
          user_id: string | null;
          violations: Json;
        };
        Insert: {
          answers?: Json;
          breakdown?: Json | null;
          correct_count?: number | null;
          deadline: string;
          english_score?: number | null;
          flagged?: string[];
          guest_key?: string | null;
          id?: string;
          ip_hash?: string | null;
          math_score?: number | null;
          module_index?: number;
          modules?: Json;
          question_ids: string[];
          score?: number | null;
          section: Database["public"]["Enums"]["exam_section"];
          started_at?: string;
          status?: Database["public"]["Enums"]["attempt_status"];
          submitted_at?: string | null;
          test_id: string;
          time_spent?: Json;
          total_count?: number | null;
          user_id?: string | null;
          violations?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["attempts"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          target_score: number | null;
          test_date: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          target_score?: number | null;
          test_date?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          target_score?: number | null;
          test_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          active: boolean;
          answer: Json;
          choices: Json | null;
          created_at: string;
          difficulty: Database["public"]["Enums"]["difficulty"];
          domain: string;
          explanation: string;
          id: string;
          prompt: string;
          skill: string;
          stimulus: Json;
          subject: Database["public"]["Enums"]["subject"];
          type: Database["public"]["Enums"]["question_type"];
        };
        Insert: {
          active?: boolean;
          answer: Json;
          choices?: Json | null;
          created_at?: string;
          difficulty: Database["public"]["Enums"]["difficulty"];
          domain: string;
          explanation: string;
          id: string;
          prompt: string;
          skill: string;
          stimulus?: Json;
          subject: Database["public"]["Enums"]["subject"];
          type?: Database["public"]["Enums"]["question_type"];
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
        Relationships: [];
      };
      test_forms: {
        Row: {
          active: boolean;
          created_at: string;
          description: string;
          id: string;
          modules: Json;
          section: Database["public"]["Enums"]["exam_section"];
          sort: number;
          title: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description: string;
          id: string;
          modules: Json;
          section: Database["public"]["Enums"]["exam_section"];
          sort?: number;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["test_forms"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      end_break: {
        Args: { p_attempt_id: string; p_guest_key?: string; p_secret: string };
        Returns: Json;
      };
      get_attempt: {
        Args: { p_attempt_id: string; p_guest_key?: string; p_secret: string };
        Returns: Json;
      };
      get_result: {
        Args: { p_attempt_id: string; p_guest_key?: string; p_secret: string };
        Returns: Json;
      };
      save_progress: {
        Args: {
          p_answers?: Json;
          p_attempt_id: string;
          p_flagged?: string[];
          p_guest_key?: string;
          p_secret: string;
          p_time_spent?: Json;
          p_violations?: Json;
        };
        Returns: Json;
      };
      start_attempt: {
        Args: {
          p_guest_key?: string;
          p_ip_hash?: string;
          p_secret: string;
          p_test_id: string;
        };
        Returns: Json;
      };
      submit_module: {
        Args: {
          p_answers?: Json;
          p_attempt_id: string;
          p_flagged?: string[];
          p_guest_key?: string;
          p_secret: string;
          p_time_spent?: Json;
          p_violations?: Json;
        };
        Returns: Json;
      };
      seed_content: {
        Args: { p_forms: Json; p_questions: Json; p_secret: string };
        Returns: Json;
      };
      usage_status: {
        Args: { p_guest_key?: string; p_ip_hash?: string; p_secret: string };
        Returns: Json;
      };
    };
    Enums: {
      attempt_status: "in_progress" | "completed";
      difficulty: "easy" | "medium" | "hard";
      exam_section: "math" | "english" | "general";
      question_type: "mcq" | "spr";
      subject: "math" | "english";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
