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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["attachment_entity_type"]
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["attachment_entity_type"]
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["attachment_entity_type"]
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_users: {
        Row: {
          activated_at: string | null
          company_id: string
          created_at: string
          id: string
          invitation_token: string | null
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          company_id: string
          created_at?: string
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          company_id?: string
          created_at?: string
          id?: string
          invitation_token?: string | null
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_line_items: {
        Row: {
          created_at: string
          description: string
          expense_id: string
          id: string
          line_total: number | null
          manually_matched: boolean
          match_confidence_score: number | null
          matched_by_ai: boolean
          material_assignment_id: string | null
          material_id: string | null
          ocr_extracted_data: Json | null
          quantity: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          expense_id: string
          id?: string
          line_total?: number | null
          manually_matched?: boolean
          match_confidence_score?: number | null
          matched_by_ai?: boolean
          material_assignment_id?: string | null
          material_id?: string | null
          ocr_extracted_data?: Json | null
          quantity?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          expense_id?: string
          id?: string
          line_total?: number | null
          manually_matched?: boolean
          match_confidence_score?: number | null
          matched_by_ai?: boolean
          material_assignment_id?: string | null
          material_id?: string | null
          ocr_extracted_data?: Json | null
          quantity?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_line_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_line_items_material_assignment_id_fkey"
            columns: ["material_assignment_id"]
            isOneToOne: false
            referencedRelation: "material_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_line_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approval_notes: string | null
          category: Database["public"]["Enums"]["expense_category"]
          company_id: string
          created_at: string
          description: string
          expense_date: string
          id: string
          ocr_confidence_score: number | null
          ocr_processed: boolean
          project_id: string | null
          receipt_ocr_data: Json | null
          receipt_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["expense_status"]
          submitted_at: string
          submitted_by: string
          task_id: string | null
          updated_at: string
          vendor_address: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          approval_notes?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          company_id: string
          created_at?: string
          description: string
          expense_date: string
          id?: string
          ocr_confidence_score?: number | null
          ocr_processed?: boolean
          project_id?: string | null
          receipt_ocr_data?: Json | null
          receipt_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_at?: string
          submitted_by: string
          task_id?: string | null
          updated_at?: string
          vendor_address?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          approval_notes?: string | null
          category?: Database["public"]["Enums"]["expense_category"]
          company_id?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          ocr_confidence_score?: number | null
          ocr_processed?: boolean
          project_id?: string | null
          receipt_ocr_data?: Json | null
          receipt_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_at?: string
          submitted_by?: string
          task_id?: string | null
          updated_at?: string
          vendor_address?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      material_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          delivered_date: string | null
          estimated_delivery_date: string | null
          id: string
          installed_date: string | null
          material_id: string
          notes: string | null
          ordered_date: string | null
          procurement_status: Database["public"]["Enums"]["procurement_status"]
          project_id: string
          purchaser_id: string | null
          purchaser_type: Database["public"]["Enums"]["purchaser_type"]
          quantity: number
          subcontractor_id: string | null
          task_id: string
          total_cost: number | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          delivered_date?: string | null
          estimated_delivery_date?: string | null
          id?: string
          installed_date?: string | null
          material_id: string
          notes?: string | null
          ordered_date?: string | null
          procurement_status?: Database["public"]["Enums"]["procurement_status"]
          project_id: string
          purchaser_id?: string | null
          purchaser_type?: Database["public"]["Enums"]["purchaser_type"]
          quantity: number
          subcontractor_id?: string | null
          task_id: string
          total_cost?: number | null
          unit_cost: number
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          delivered_date?: string | null
          estimated_delivery_date?: string | null
          id?: string
          installed_date?: string | null
          material_id?: string
          notes?: string | null
          ordered_date?: string | null
          procurement_status?: Database["public"]["Enums"]["procurement_status"]
          project_id?: string
          purchaser_id?: string | null
          purchaser_type?: Database["public"]["Enums"]["purchaser_type"]
          quantity?: number
          subcontractor_id?: string | null
          task_id?: string
          total_cost?: number | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_assignments_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_assignments_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: Database["public"]["Enums"]["material_category"]
          company_id: string
          created_at: string
          created_by: string | null
          home_depot_product_id: string | null
          home_depot_url: string | null
          id: string
          is_active: boolean
          lead_time_days: number | null
          manufacturer: string | null
          product_description: string | null
          product_image_url: string | null
          product_name: string
          sku: string | null
          specifications: Json | null
          stock_status: string | null
          unit_of_measure: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["material_category"]
          company_id: string
          created_at?: string
          created_by?: string | null
          home_depot_product_id?: string | null
          home_depot_url?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          manufacturer?: string | null
          product_description?: string | null
          product_image_url?: string | null
          product_name: string
          sku?: string | null
          specifications?: Json | null
          stock_status?: string | null
          unit_of_measure?: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["material_category"]
          company_id?: string
          created_at?: string
          created_by?: string | null
          home_depot_product_id?: string | null
          home_depot_url?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          manufacturer?: string | null
          product_description?: string | null
          product_image_url?: string | null
          product_name?: string
          sku?: string | null
          specifications?: Json | null
          stock_status?: string | null
          unit_of_measure?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      project_phases: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          id: string
          name: string
          notes: string | null
          order_index: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["phase_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          order_index?: number
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["phase_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["phase_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          subcontractor_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          project_id: string
          role: Database["public"]["Enums"]["user_role"]
          subcontractor_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          project_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          subcontractor_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_team_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget: number | null
          city: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          company_id: string
          completion_percentage: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          health_score: number | null
          id: string
          name: string
          project_type: Database["public"]["Enums"]["project_type"]
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          budget?: number | null
          city?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          company_id: string
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          health_score?: number | null
          id?: string
          name: string
          project_type?: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          budget?: number | null
          city?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          company_id?: string
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          health_score?: number | null
          id?: string
          name?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          address: string | null
          company_id: string
          company_name: string
          contact_name: string
          created_at: string
          email: string | null
          id: string
          insurance_expiry: string | null
          insurance_provider: string | null
          is_active: boolean
          license_expiry: string | null
          license_number: string | null
          notes: string | null
          performance_rating: number | null
          phone: string | null
          trade_specialization: Database["public"]["Enums"]["trade_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          company_name: string
          contact_name: string
          created_at?: string
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_provider?: string | null
          is_active?: boolean
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          performance_rating?: number | null
          phone?: string | null
          trade_specialization?: Database["public"]["Enums"]["trade_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_provider?: string | null
          is_active?: boolean
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          performance_rating?: number | null
          phone?: string | null
          trade_specialization?: Database["public"]["Enums"]["trade_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          comment: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          comment?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          comment?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_cost: number | null
          assignee_id: string | null
          blocked_reason: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          phase_id: string | null
          planned_cost: number | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assignee_id?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          phase_id?: string | null
          planned_cost?: number | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assignee_id?: string | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          phase_id?: string | null
          planned_cost?: number | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          company_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string
          invited_by: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          used_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_project_material_summary: {
        Args: { project_uuid: string }
        Returns: {
          approved_expense_amount: number
          materials_delivered_count: number
          materials_installed_count: number
          materials_needed_count: number
          materials_ordered_count: number
          total_expense_amount: number
          total_materials_cost: number
        }[]
      }
      get_team_member_project_counts: {
        Args: { p_company_id: string }
        Returns: {
          project_count: number
          user_id: string
        }[]
      }
      get_user_company_id: { Args: { p_user_id: string }; Returns: string }
      is_user_gc_admin: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      activity_action:
        | "created"
        | "updated"
        | "deleted"
        | "status_changed"
        | "assigned"
        | "commented"
        | "attachment_added"
        | "attachment_removed"
      attachment_entity_type:
        | "task"
        | "project"
        | "phase"
        | "profile"
        | "subcontractor"
        | "material"
        | "expense"
      expense_category:
        | "materials"
        | "labor"
        | "equipment"
        | "permits"
        | "transportation"
        | "meals"
        | "lodging"
        | "other"
      expense_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "paid"
      material_category:
        | "lumber"
        | "concrete"
        | "electrical"
        | "plumbing"
        | "hvac"
        | "roofing"
        | "flooring"
        | "paint"
        | "hardware"
        | "tools"
        | "fixtures"
        | "insulation"
        | "drywall"
        | "doors_windows"
        | "landscaping"
        | "other"
      member_status: "active" | "invited" | "inactive"
      notification_type:
        | "task_assigned"
        | "task_completed"
        | "task_overdue"
        | "task_blocked"
        | "project_update"
        | "team_invited"
        | "mention"
        | "system"
        | "material_assigned"
        | "material_delivered"
        | "material_ordered"
        | "expense_submitted"
        | "expense_approved"
        | "expense_rejected"
        | "budget_overrun"
      phase_status: "not_started" | "in_progress" | "completed" | "on_hold"
      procurement_status: "needed" | "ordered" | "delivered" | "installed"
      project_status: "active" | "on_hold" | "completed" | "archived"
      project_type:
        | "residential"
        | "restaurant_cafe"
        | "commercial_office"
        | "industrial"
      purchaser_type: "gc" | "pm" | "subcontractor"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "todo" | "in_progress" | "review" | "blocked" | "completed"
      trade_type:
        | "general"
        | "electrical"
        | "plumbing"
        | "hvac"
        | "carpentry"
        | "masonry"
        | "roofing"
        | "flooring"
        | "painting"
        | "drywall"
        | "concrete"
        | "landscaping"
        | "demolition"
        | "steel_work"
        | "glass_glazing"
        | "fire_protection"
        | "insulation"
        | "other"
      user_role:
        | "gc_admin"
        | "project_manager"
        | "foreman"
        | "field_worker"
        | "subcontractor"
        | "client"
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
    Enums: {
      activity_action: [
        "created",
        "updated",
        "deleted",
        "status_changed",
        "assigned",
        "commented",
        "attachment_added",
        "attachment_removed",
      ],
      attachment_entity_type: [
        "task",
        "project",
        "phase",
        "profile",
        "subcontractor",
        "material",
        "expense",
      ],
      expense_category: [
        "materials",
        "labor",
        "equipment",
        "permits",
        "transportation",
        "meals",
        "lodging",
        "other",
      ],
      expense_status: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "paid",
      ],
      material_category: [
        "lumber",
        "concrete",
        "electrical",
        "plumbing",
        "hvac",
        "roofing",
        "flooring",
        "paint",
        "hardware",
        "tools",
        "fixtures",
        "insulation",
        "drywall",
        "doors_windows",
        "landscaping",
        "other",
      ],
      member_status: ["active", "invited", "inactive"],
      notification_type: [
        "task_assigned",
        "task_completed",
        "task_overdue",
        "task_blocked",
        "project_update",
        "team_invited",
        "mention",
        "system",
        "material_assigned",
        "material_delivered",
        "material_ordered",
        "expense_submitted",
        "expense_approved",
        "expense_rejected",
        "budget_overrun",
      ],
      phase_status: ["not_started", "in_progress", "completed", "on_hold"],
      procurement_status: ["needed", "ordered", "delivered", "installed"],
      project_status: ["active", "on_hold", "completed", "archived"],
      project_type: [
        "residential",
        "restaurant_cafe",
        "commercial_office",
        "industrial",
      ],
      purchaser_type: ["gc", "pm", "subcontractor"],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: ["todo", "in_progress", "review", "blocked", "completed"],
      trade_type: [
        "general",
        "electrical",
        "plumbing",
        "hvac",
        "carpentry",
        "masonry",
        "roofing",
        "flooring",
        "painting",
        "drywall",
        "concrete",
        "landscaping",
        "demolition",
        "steel_work",
        "glass_glazing",
        "fire_protection",
        "insulation",
        "other",
      ],
      user_role: [
        "gc_admin",
        "project_manager",
        "foreman",
        "field_worker",
        "subcontractor",
        "client",
      ],
    },
  },
} as const
