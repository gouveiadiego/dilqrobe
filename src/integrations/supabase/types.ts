export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          client_address: string | null
          client_document: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          company_address: string | null
          company_document: string | null
          company_logo: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          delivery_time: string | null
          id: string
          items: Json
          notes: string | null
          payment_terms: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          client_address?: string | null
          client_document?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_address?: string | null
          company_document?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          delivery_time?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_terms?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          client_address?: string | null
          client_document?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_address?: string | null
          company_document?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          delivery_time?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_terms?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string | null
          ranking: number | null
          total_distance: number | null
          total_runs: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string | null
          ranking?: number | null
          total_distance?: number | null
          total_runs?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string | null
          ranking?: number | null
          total_distance?: number | null
          total_runs?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "running_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          document: string | null
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          document?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          document?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gym_records: {
        Row: {
          challenge_id: string
          created_at: string | null
          date: string
          duration: number
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          date: string
          duration: number
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          date?: string
          duration?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_records_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "running_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          completed_at: string | null
          date: string
          habit_id: string
          id: string
          mood: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          date: string
          habit_id: string
          id?: string
          mood?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          date?: string
          habit_id?: string
          id?: string
          mood?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean | null
          best_streak: number | null
          created_at: string | null
          description: string | null
          id: string
          positive_reinforcement: string[] | null
          schedule_days: string[]
          schedule_time: string | null
          streak: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          best_streak?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          positive_reinforcement?: string[] | null
          schedule_days?: string[]
          schedule_time?: string | null
          streak?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          best_streak?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          positive_reinforcement?: string[] | null
          schedule_days?: string[]
          schedule_time?: string | null
          streak?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string | null
          id: string
          prompt: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          prompt?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          prompt?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          company_logo: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          company_logo?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          company_logo?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      project_checklist: {
        Row: {
          category: string | null
          company_id: string
          completed: boolean | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          company_id: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          company_id?: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "project_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_companies: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_credentials: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          notes: string | null
          password: string
          title: string
          updated_at: string | null
          url: string | null
          username: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          password: string
          title: string
          updated_at?: string | null
          url?: string | null
          username?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          password?: string
          title?: string
          updated_at?: string | null
          url?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_credentials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "project_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_notes: {
        Row: {
          company_id: string
          content: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "project_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "project_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      running_badges: {
        Row: {
          badge_type: string
          challenge_id: string
          description: string | null
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_type: string
          challenge_id: string
          description?: string | null
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          challenge_id?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "running_badges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "running_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      running_challenges: {
        Row: {
          category: string | null
          challenge_type: string | null
          completion_criteria: Json | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          end_date: string
          id: string
          participants_count: number | null
          reward_badges: string[] | null
          start_date: string
          title: string
          updated_at: string | null
          user_id: string
          visibility: string | null
          yearly_goal: number
        }
        Insert: {
          category?: string | null
          challenge_type?: string | null
          completion_criteria?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_date: string
          id?: string
          participants_count?: number | null
          reward_badges?: string[] | null
          start_date?: string
          title: string
          updated_at?: string | null
          user_id: string
          visibility?: string | null
          yearly_goal: number
        }
        Update: {
          category?: string | null
          challenge_type?: string | null
          completion_criteria?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          end_date?: string
          id?: string
          participants_count?: number | null
          reward_badges?: string[] | null
          start_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
          yearly_goal?: number
        }
        Relationships: []
      }
      running_records: {
        Row: {
          challenge_id: string
          created_at: string | null
          date: string
          distance: number
          duration: number | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          date: string
          distance: number
          duration?: number | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          date?: string
          distance?: number
          duration?: number | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "running_records_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "running_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      running_weekly_stats: {
        Row: {
          avg_pace: number | null
          challenge_id: string
          completed_runs: number | null
          id: string
          total_distance: number
          total_duration: number | null
          user_id: string
          week_start: string
        }
        Insert: {
          avg_pace?: number | null
          challenge_id: string
          completed_runs?: number | null
          id?: string
          total_distance?: number
          total_duration?: number | null
          user_id: string
          week_start: string
        }
        Update: {
          avg_pace?: number | null
          challenge_id?: string
          completed_runs?: number | null
          id?: string
          total_distance?: number
          total_duration?: number | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "running_weekly_stats_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "running_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          amount: number
          client_id: string | null
          client_name: string
          company_name: string
          created_at: string | null
          id: string
          payment_status: string | null
          reference_month: string
          service_description: string
          stage: string
          start_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          client_name: string
          company_name: string
          created_at?: string | null
          id?: string
          payment_status?: string | null
          reference_month: string
          service_description: string
          stage: string
          start_date: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          client_name?: string
          company_name?: string
          created_at?: string | null
          id?: string
          payment_status?: string | null
          reference_month?: string
          service_description?: string
          stage?: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          price_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          price_id?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          price_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          category: string | null
          completed: boolean | null
          created_at: string | null
          due_date: string | null
          id: string
          priority: string | null
          section: string | null
          subtasks: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          section?: string | null
          subtasks?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          section?: string | null
          subtasks?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string
          id: string
          is_paid: boolean | null
          payment_type: string
          received_from: string
          recurring: boolean | null
          recurring_day: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description: string
          id?: string
          is_paid?: boolean | null
          payment_type: string
          received_from: string
          recurring?: boolean | null
          recurring_day?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          is_paid?: boolean | null
          payment_type?: string
          received_from?: string
          recurring?: boolean | null
          recurring_day?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_challenge_rankings: {
        Args: {
          challenge_id: string
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
