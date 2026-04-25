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
  public: {
    Tables: {
      ai_insights: {
        Row: {
          drivers: Json
          generated_at: string
          id: string
          insight: string | null
          language: string
          recommendations: Json
          scope: string
          scope_id: string
        }
        Insert: {
          drivers?: Json
          generated_at?: string
          id?: string
          insight?: string | null
          language?: string
          recommendations?: Json
          scope: string
          scope_id: string
        }
        Update: {
          drivers?: Json
          generated_at?: string
          id?: string
          insight?: string | null
          language?: string
          recommendations?: Json
          scope?: string
          scope_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          ai_generated: boolean
          body: string
          county: string
          created_at: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          ai_generated?: boolean
          body: string
          county: string
          created_at?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: string
          status?: string
          title: string
        }
        Update: {
          ai_generated?: boolean
          body?: string
          county?: string
          created_at?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          animal_count: number | null
          animal_signs: string[]
          animal_type: string | null
          category: string
          county: string
          created_at: string
          env_signals: string[]
          id: string
          known_exposure: boolean | null
          mood: number | null
          notes: string | null
          recent_travel: boolean | null
          risk_score: number | null
          symptoms: string[]
          travel_destination: string | null
          user_id: string | null
        }
        Insert: {
          animal_count?: number | null
          animal_signs?: string[]
          animal_type?: string | null
          category: string
          county: string
          created_at?: string
          env_signals?: string[]
          id?: string
          known_exposure?: boolean | null
          mood?: number | null
          notes?: string | null
          recent_travel?: boolean | null
          risk_score?: number | null
          symptoms?: string[]
          travel_destination?: string | null
          user_id?: string | null
        }
        Update: {
          animal_count?: number | null
          animal_signs?: string[]
          animal_type?: string | null
          category?: string
          county?: string
          created_at?: string
          env_signals?: string[]
          id?: string
          known_exposure?: boolean | null
          mood?: number | null
          notes?: string | null
          recent_travel?: boolean | null
          risk_score?: number | null
          symptoms?: string[]
          travel_destination?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      county_daily: {
        Row: {
          air_quality: Json | null
          animal_score: number
          checkin_count: number
          clusters: Json
          composite_risk: number
          county: string
          date: string
          env_score: number
          human_score: number
          top_animal_signs: Json
          top_env_signals: Json
          top_human_symptoms: Json
          updated_at: string
          vector_score: number
          weather: Json | null
        }
        Insert: {
          air_quality?: Json | null
          animal_score?: number
          checkin_count?: number
          clusters?: Json
          composite_risk?: number
          county: string
          date: string
          env_score?: number
          human_score?: number
          top_animal_signs?: Json
          top_env_signals?: Json
          top_human_symptoms?: Json
          updated_at?: string
          vector_score?: number
          weather?: Json | null
        }
        Update: {
          air_quality?: Json | null
          animal_score?: number
          checkin_count?: number
          clusters?: Json
          composite_risk?: number
          county?: string
          date?: string
          env_score?: number
          human_score?: number
          top_animal_signs?: Json
          top_env_signals?: Json
          top_human_symptoms?: Json
          updated_at?: string
          vector_score?: number
          weather?: Json | null
        }
        Relationships: []
      }
      epicore_feed: {
        Row: {
          hazard: string
          id: string
          observed_at: string
          pathway: string | null
          region: string
          severity: number
          summary: string
        }
        Insert: {
          hazard: string
          id?: string
          observed_at?: string
          pathway?: string | null
          region: string
          severity?: number
          summary: string
        }
        Update: {
          hazard?: string
          id?: string
          observed_at?: string
          pathway?: string | null
          region?: string
          severity?: number
          summary?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_band: string | null
          conditions: string[]
          created_at: string
          home_county: string
          id: string
          language: string
          last_checkin_date: string | null
          onboarded: boolean
          persona: string
          role: string
          streak: number
        }
        Insert: {
          age_band?: string | null
          conditions?: string[]
          created_at?: string
          home_county?: string
          id: string
          language?: string
          last_checkin_date?: string | null
          onboarded?: boolean
          persona?: string
          role?: string
          streak?: number
        }
        Update: {
          age_band?: string | null
          conditions?: string[]
          created_at?: string
          home_county?: string
          id?: string
          language?: string
          last_checkin_date?: string | null
          onboarded?: boolean
          persona?: string
          role?: string
          streak?: number
        }
        Relationships: []
      }
      review_log: {
        Row: {
          action: string
          actor: string | null
          after: Json | null
          alert_id: string | null
          before: Json | null
          created_at: string
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          after?: Json | null
          alert_id?: string | null
          before?: Json | null
          created_at?: string
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          after?: Json | null
          alert_id?: string | null
          before?: Json | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_log_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: { Args: { _role: string; _uid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
