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
      client_meetings: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          duration: number
          id: string
          location: string | null
          meeting_date: string
          notes: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          location?: string | null
          meeting_date: string
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          location?: string | null
          meeting_date?: string
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_meetings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_links: {
        Row: {
          access_token: string
          company_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          password_hash: string
          updated_at: string
        }
        Insert: {
          access_token: string
          company_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          password_hash: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          company_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "project_companies"
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
      company_content_tasks: {
        Row: {
          client_status: string
          company_id: string
          completed: boolean | null
          content: string
          created_at: string | null
          id: string
          status: string
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_status?: string
          company_id: string
          completed?: boolean | null
          content: string
          created_at?: string | null
          id?: string
          status?: string
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_status?: string
          company_id?: string
          completed?: boolean | null
          content?: string
          created_at?: string | null
          id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_content_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "project_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_share_links: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          share_token: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          share_token: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          share_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_share_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "project_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_work_log: {
        Row: {
          category: string | null
          checklist_item_id: string | null
          company_id: string
          completed_at: string
          created_at: string
          description: string | null
          id: string
          month_year: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          checklist_item_id?: string | null
          company_id: string
          completed_at?: string
          created_at?: string
          description?: string | null
          id?: string
          month_year?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          checklist_item_id?: string | null
          company_id?: string
          completed_at?: string
          created_at?: string
          description?: string | null
          id?: string
          month_year?: string
          title?: string
          updated_at?: string
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
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          status: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          company_logo: string | null
          cpf: string | null
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
          cpf?: string | null
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
          cpf?: string | null
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
          is_active: boolean | null
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
          is_active?: boolean | null
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
          is_active?: boolean | null
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
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          attachments: Json
          category: string | null
          comments: Json
          completed: boolean | null
          created_at: string | null
          due_date: string | null
          estimated_time_minutes: number | null
          id: string
          is_recurring: boolean | null
          priority: string | null
          project_company_id: string | null
          recurrence_completed: number | null
          recurrence_count: number | null
          recurrence_type: string | null
          section: string | null
          subtasks: Json | null
          timer_value_seconds: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json
          category?: string | null
          comments?: Json
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          estimated_time_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          priority?: string | null
          project_company_id?: string | null
          recurrence_completed?: number | null
          recurrence_count?: number | null
          recurrence_type?: string | null
          section?: string | null
          subtasks?: Json | null
          timer_value_seconds?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json
          category?: string | null
          comments?: Json
          completed?: boolean | null
          created_at?: string | null
          due_date?: string | null
          estimated_time_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          priority?: string | null
          project_company_id?: string | null
          recurrence_completed?: number | null
          recurrence_count?: number | null
          recurrence_type?: string | null
          section?: string | null
          subtasks?: Json | null
          timer_value_seconds?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_company_id_fkey"
            columns: ["project_company_id"]
            isOneToOne: false
            referencedRelation: "project_companies"
            referencedColumns: ["id"]
          },
        ]
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
      delete_journal_entry: {
        Args: { entry_id_param: string; user_id_param: string }
        Returns: boolean
      }
      get_user_payments: {
        Args: { user_id_param: string }
        Returns: {
          amount: number
          created_at: string
          currency: string
          id: string
          status: string
          stripe_payment_id: string | null
          user_id: string
        }[]
      }
      update_challenge_rankings: {
        Args: { challenge_id: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
