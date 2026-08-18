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
      legal_consents: {
        Row: {
          accepted_at: string
          created_at: string
          profile_role: "student" | "advisor"
          terms_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          profile_role?: "student" | "advisor"
          terms_version: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          terms_version?: string
          profile_role?: "student" | "advisor"
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generation_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          error_code: string | null
          id: string
          idempotency_key: string
          owner_id: string
          project_id: string
          report_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key: string
          owner_id: string
          project_id: string
          report_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          id?: string
          idempotency_key?: string
          owner_id?: string
          project_id?: string
          report_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          academic_level: string | null
          advisor_email: string | null
          advisor_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          keywords: string[]
          knowledge_area: string | null
          owner_id: string
          problem_statement: string | null
          status: string
          theme: string | null
          title: string
          updated_at: string
          workflow_version: number
        }
        Insert: {
          academic_level?: string | null
          advisor_email?: string | null
          advisor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          keywords?: string[]
          knowledge_area?: string | null
          owner_id: string
          problem_statement?: string | null
          status?: string
          theme?: string | null
          title: string
          updated_at?: string
          workflow_version?: number
        }
        Update: {
          academic_level?: string | null
          advisor_email?: string | null
          advisor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          keywords?: string[]
          knowledge_area?: string | null
          owner_id?: string
          problem_statement?: string | null
          status?: string
          theme?: string | null
          title?: string
          updated_at?: string
          workflow_version?: number
        }
        Relationships: []
      }
      research_workflows: {
        Row: {
          content: Json
          created_at: string
          owner_id: string
          project_id: string
          revision: number
          schema_version: string
          source_revision: number
          stable_state: string
          state: string
          updated_at: string
          validation_state: Json
        }
        Insert: {
          content?: Json
          created_at?: string
          owner_id: string
          project_id: string
          revision?: number
          schema_version?: string
          source_revision?: number
          stable_state?: string
          state?: string
          updated_at?: string
          validation_state?: Json
        }
        Update: {
          content?: Json
          created_at?: string
          owner_id?: string
          project_id?: string
          revision?: number
          schema_version?: string
          source_revision?: number
          stable_state?: string
          state?: string
          updated_at?: string
          validation_state?: Json
        }
        Relationships: [
          {
            foreignKeyName: "research_workflows_project_owner_fkey"
            columns: ["project_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      research_structures: {
        Row: {
          content: Json
          created_at: string
          model: string
          owner_id: string
          project_id: string
          prompt_version: string
          references_data: Json
          revision: number
          schema_version: string
          updated_at: string
          warnings: string[]
        }
        Insert: {
          content: Json
          created_at?: string
          model: string
          owner_id: string
          project_id: string
          prompt_version: string
          references_data?: Json
          revision?: number
          schema_version: string
          updated_at?: string
          warnings?: string[]
        }
        Update: {
          content?: Json
          created_at?: string
          model?: string
          owner_id?: string
          project_id?: string
          prompt_version?: string
          references_data?: Json
          revision?: number
          schema_version?: string
          updated_at?: string
          warnings?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "research_structures_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active_role: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_role: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_role?: string
          created_at?: string
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
      claim_pending_advisor_projects: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      set_project_advisor: {
        Args: {
          advisor_email_input: string | null
          project_id_input: string
        }
        Returns: boolean
      }
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
