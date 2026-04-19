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
      admin_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string
          invited_by: string
          name: string | null
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by: string
          name?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string
          invited_by?: string
          name?: string | null
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          cached: boolean
          company_id: string
          completion_tokens: number
          cost: number
          created_at: string
          id: string
          model: string
          page_id: string | null
          prompt_tokens: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          cached?: boolean
          company_id: string
          completion_tokens: number
          cost: number
          created_at?: string
          id?: string
          model: string
          page_id?: string | null
          prompt_tokens: number
          total_tokens: number
          user_id: string
        }
        Update: {
          cached?: boolean
          company_id?: string
          completion_tokens?: number
          cost?: number
          created_at?: string
          id?: string
          model?: string
          page_id?: string | null
          prompt_tokens?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "ai_usage_log_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "plan_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      assembly_items: {
        Row: {
          assembly_id: string
          created_at: string
          description: string
          id: string
          material_id: string | null
          quantity_multiplier: number
          sort_order: number
          trade: string
          unit: string
        }
        Insert: {
          assembly_id: string
          created_at?: string
          description: string
          id?: string
          material_id?: string | null
          quantity_multiplier?: number
          sort_order?: number
          trade: string
          unit: string
        }
        Update: {
          assembly_id?: string
          created_at?: string
          description?: string
          id?: string
          material_id?: string | null
          quantity_multiplier?: number
          sort_order?: number
          trade?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "assembly_items_assembly_id_fkey"
            columns: ["assembly_id"]
            isOneToOne: false
            referencedRelation: "estimate_assemblies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assembly_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          entity_id: string
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
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          allocated_amount: number
          budget_id: string
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          spent_amount: number
          updated_at: string
        }
        Insert: {
          allocated_amount?: number
          budget_id: string
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          spent_amount?: number
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          budget_id?: string
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          spent_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
        ]
      }
      budgets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string
          source_estimate_id: string | null
          status: Database["public"]["Enums"]["budget_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          source_estimate_id?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          source_estimate_id?: string | null
          status?: Database["public"]["Enums"]["budget_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_room_id: string
          created_at: string
          id: string
          joined_at: string
          last_read_at: string
          muted_until: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_room_id: string
          created_at?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          muted_until?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_room_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          muted_until?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string | null
          project_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "chat_rooms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          ai_monthly_budget: number
          client_can_view_budget: boolean
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
          ai_monthly_budget?: number
          client_can_view_budget?: boolean
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
          ai_monthly_budget?: number
          client_can_view_budget?: boolean
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
      company_default_models: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          model_id: string
          project_type_config_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          model_id: string
          project_type_config_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          model_id?: string
          project_type_config_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_default_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_default_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "company_default_models_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "projects_3d_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_default_models_project_type_config_id_fkey"
            columns: ["project_type_config_id"]
            isOneToOne: false
            referencedRelation: "project_type_configs"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
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
      default_3d_models: {
        Row: {
          bounds: Json | null
          created_at: string
          description: string | null
          element_count: number | null
          file_size_bytes: number
          floors: Json | null
          id: string
          is_active: boolean
          lod_low_url: string | null
          lod_medium_url: string | null
          name: string
          original_file_url: string
          project_type: string
          thumbnail_url: string | null
          updated_at: string
          version: number
          xkt_file_url: string
        }
        Insert: {
          bounds?: Json | null
          created_at?: string
          description?: string | null
          element_count?: number | null
          file_size_bytes: number
          floors?: Json | null
          id?: string
          is_active?: boolean
          lod_low_url?: string | null
          lod_medium_url?: string | null
          name: string
          original_file_url: string
          project_type: string
          thumbnail_url?: string | null
          updated_at?: string
          version?: number
          xkt_file_url: string
        }
        Update: {
          bounds?: Json | null
          created_at?: string
          description?: string | null
          element_count?: number | null
          file_size_bytes?: number
          floors?: Json | null
          id?: string
          is_active?: boolean
          lod_low_url?: string | null
          lod_medium_url?: string | null
          name?: string
          original_file_url?: string
          project_type?: string
          thumbnail_url?: string | null
          updated_at?: string
          version?: number
          xkt_file_url?: string
        }
        Relationships: []
      }
      default_marker_configs: {
        Row: {
          created_at: string
          default_model_id: string
          description: string | null
          element_id: string | null
          element_type: string | null
          floor_id: string | null
          floor_name: string | null
          id: string
          normal_x: number
          normal_y: number
          normal_z: number
          phase_name: string | null
          position_x: number
          position_y: number
          position_z: number
          task_template_title: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_model_id: string
          description?: string | null
          element_id?: string | null
          element_type?: string | null
          floor_id?: string | null
          floor_name?: string | null
          id?: string
          normal_x?: number
          normal_y?: number
          normal_z?: number
          phase_name?: string | null
          position_x: number
          position_y: number
          position_z: number
          task_template_title?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_model_id?: string
          description?: string | null
          element_id?: string | null
          element_type?: string | null
          floor_id?: string | null
          floor_name?: string | null
          id?: string
          normal_x?: number
          normal_y?: number
          normal_z?: number
          phase_name?: string | null
          position_x?: number
          position_y?: number
          position_z?: number
          task_template_title?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "default_marker_configs_default_model_id_fkey"
            columns: ["default_model_id"]
            isOneToOne: false
            referencedRelation: "default_3d_models"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_activity: {
        Row: {
          action_type: string
          company_id: string
          created_at: string
          details: Json | null
          estimate_id: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          company_id: string
          created_at?: string
          details?: Json | null
          estimate_id: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          company_id?: string
          created_at?: string
          details?: Json | null
          estimate_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_activity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_activity_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "estimate_activity_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_assemblies: {
        Row: {
          category: string
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_company_template: boolean
          name: string
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_company_template?: boolean
          name: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_company_template?: boolean
          name?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_assemblies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_assemblies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
        ]
      }
      estimate_chat_messages: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by: string | null
          estimate_id: string
          id: string
          plan_references: Json | null
          role: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          created_by?: string | null
          estimate_id: string
          id?: string
          plan_references?: Json | null
          role: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string | null
          estimate_id?: string
          id?: string
          plan_references?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_chat_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "estimate_chat_messages_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          category: Database["public"]["Enums"]["takeoff_category"]
          company_id: string
          created_at: string
          description: string | null
          equipment_cost: number
          estimate_id: string
          id: string
          labor_cost: number
          material_cost: number
          material_id: string | null
          quantity: number
          sort_order: number
          sub_type: string
          subtotal: number
          takeoff_item_id: string | null
          trade: string
          unit: string
          unit_cost: number
        }
        Insert: {
          category: Database["public"]["Enums"]["takeoff_category"]
          company_id: string
          created_at?: string
          description?: string | null
          equipment_cost?: number
          estimate_id: string
          id?: string
          labor_cost?: number
          material_cost?: number
          material_id?: string | null
          quantity: number
          sort_order?: number
          sub_type: string
          subtotal?: number
          takeoff_item_id?: string | null
          trade: string
          unit: string
          unit_cost?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["takeoff_category"]
          company_id?: string
          created_at?: string
          description?: string | null
          equipment_cost?: number
          estimate_id?: string
          id?: string
          labor_cost?: number
          material_cost?: number
          material_id?: string | null
          quantity?: number
          sort_order?: number
          sub_type?: string
          subtotal?: number
          takeoff_item_id?: string | null
          trade?: string
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_takeoff_item_id_fkey"
            columns: ["takeoff_item_id"]
            isOneToOne: false
            referencedRelation: "takeoff_items"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_locks: {
        Row: {
          company_id: string
          estimate_id: string
          expires_at: string
          id: string
          locked_at: string
          locked_by: string
          trade: string
        }
        Insert: {
          company_id: string
          estimate_id: string
          expires_at?: string
          id?: string
          locked_at?: string
          locked_by: string
          trade: string
        }
        Update: {
          company_id?: string
          estimate_id?: string
          expires_at?: string
          id?: string
          locked_at?: string
          locked_by?: string
          trade?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_locks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_locks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "estimate_locks_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_revisions: {
        Row: {
          changes_applied: Json | null
          company_id: string
          created_at: string
          created_by: string
          diff_results: Json | null
          estimate_id: string
          id: string
          new_plan_upload_id: string | null
          notes: string | null
          previous_estimate_id: string | null
          updated_at: string
        }
        Insert: {
          changes_applied?: Json | null
          company_id: string
          created_at?: string
          created_by: string
          diff_results?: Json | null
          estimate_id: string
          id?: string
          new_plan_upload_id?: string | null
          notes?: string | null
          previous_estimate_id?: string | null
          updated_at?: string
        }
        Update: {
          changes_applied?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string
          diff_results?: Json | null
          estimate_id?: string
          id?: string
          new_plan_upload_id?: string | null
          notes?: string | null
          previous_estimate_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_revisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_revisions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "estimate_revisions_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_revisions_new_plan_upload_id_fkey"
            columns: ["new_plan_upload_id"]
            isOneToOne: false
            referencedRelation: "plan_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_revisions_previous_estimate_id_fkey"
            columns: ["previous_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          grand_total: number
          id: string
          markup_amount: number
          markup_pct: number
          name: string
          overhead_amount: number
          overhead_pct: number
          plan_upload_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["estimate_status"]
          subtotal: number
          superseded_by: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          grand_total?: number
          id?: string
          markup_amount?: number
          markup_pct?: number
          name: string
          overhead_amount?: number
          overhead_pct?: number
          plan_upload_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          superseded_by?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          grand_total?: number
          id?: string
          markup_amount?: number
          markup_pct?: number
          name?: string
          overhead_amount?: number
          overhead_pct?: number
          plan_upload_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          superseded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "estimates_plan_upload_id_fkey"
            columns: ["plan_upload_id"]
            isOneToOne: false
            referencedRelation: "plan_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "estimates"
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
          category: Database["public"]["Enums"]["expense_category"]
          company_id: string
          created_at: string
          description: string
          expense_date: string
          id: string
          ocr_confidence_score: number | null
          ocr_processed: boolean
          payment_method: string | null
          project_id: string | null
          receipt_ocr_data: Json | null
          receipt_url: string | null
          store_account: string | null
          subcontractor_id: string | null
          subcontractor_payment_id: string | null
          task_id: string | null
          updated_at: string
          vendor_address: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          company_id: string
          created_at?: string
          description: string
          expense_date: string
          id?: string
          ocr_confidence_score?: number | null
          ocr_processed?: boolean
          payment_method?: string | null
          project_id?: string | null
          receipt_ocr_data?: Json | null
          receipt_url?: string | null
          store_account?: string | null
          subcontractor_id?: string | null
          subcontractor_payment_id?: string | null
          task_id?: string | null
          updated_at?: string
          vendor_address?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          company_id?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          ocr_confidence_score?: number | null
          ocr_processed?: boolean
          payment_method?: string | null
          project_id?: string | null
          receipt_ocr_data?: Json | null
          receipt_url?: string | null
          store_account?: string | null
          subcontractor_id?: string | null
          subcontractor_payment_id?: string | null
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
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_subcontractor_payment_id_fkey"
            columns: ["subcontractor_payment_id"]
            isOneToOne: false
            referencedRelation: "subcontractor_payments"
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
      extraction_jobs: {
        Row: {
          attempt: number
          claimed_at: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          depends_on: string[] | null
          error: string | null
          heartbeat_at: string | null
          id: string
          max_attempts: number
          page_number: number
          plan_upload_id: string
          result: Json | null
          stage: Database["public"]["Enums"]["extraction_stage"]
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }
        Insert: {
          attempt?: number
          claimed_at?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          depends_on?: string[] | null
          error?: string | null
          heartbeat_at?: string | null
          id?: string
          max_attempts?: number
          page_number: number
          plan_upload_id: string
          result?: Json | null
          stage: Database["public"]["Enums"]["extraction_stage"]
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Update: {
          attempt?: number
          claimed_at?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          depends_on?: string[] | null
          error?: string | null
          heartbeat_at?: string | null
          id?: string
          max_attempts?: number
          page_number?: number
          plan_upload_id?: string
          result?: Json | null
          stage?: Database["public"]["Enums"]["extraction_stage"]
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "extraction_jobs_plan_upload_id_fkey"
            columns: ["plan_upload_id"]
            isOneToOne: false
            referencedRelation: "plan_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      file_audit_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          file_id: string | null
          file_type: string
          id: string
          new_state: Json | null
          performed_by: string
          previous_state: Json | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          file_id?: string | null
          file_type: string
          id?: string
          new_state?: Json | null
          performed_by: string
          previous_state?: Json | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          file_id?: string | null
          file_type?: string
          id?: string
          new_state?: Json | null
          performed_by?: string
          previous_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "file_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
        ]
      }
      kakao_connections: {
        Row: {
          access_token: string
          connected_at: string
          created_at: string
          disconnected_at: string | null
          id: string
          kakao_user_id: string
          refresh_token: string
          sendbird_user_id: string
          two_way_sync: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          created_at?: string
          disconnected_at?: string | null
          id?: string
          kakao_user_id: string
          refresh_token: string
          sendbird_user_id: string
          two_way_sync?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          created_at?: string
          disconnected_at?: string | null
          id?: string
          kakao_user_id?: string
          refresh_token?: string
          sendbird_user_id?: string
          two_way_sync?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marker_content: {
        Row: {
          activity_data: Json | null
          activity_type: string | null
          created_at: string
          created_by: string | null
          file_mime_type: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          marker_id: string
          note_format: string | null
          note_text: string | null
          photo_exif: Json | null
          photo_height: number | null
          photo_thumbnail_url: string | null
          photo_url: string | null
          photo_width: number | null
          type: Database["public"]["Enums"]["marker_content_type"]
          updated_at: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type?: string | null
          created_at?: string
          created_by?: string | null
          file_mime_type?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          marker_id: string
          note_format?: string | null
          note_text?: string | null
          photo_exif?: Json | null
          photo_height?: number | null
          photo_thumbnail_url?: string | null
          photo_url?: string | null
          photo_width?: number | null
          type: Database["public"]["Enums"]["marker_content_type"]
          updated_at?: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string | null
          created_at?: string
          created_by?: string | null
          file_mime_type?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          marker_id?: string
          note_format?: string | null
          note_text?: string | null
          photo_exif?: Json | null
          photo_height?: number | null
          photo_thumbnail_url?: string | null
          photo_url?: string | null
          photo_width?: number | null
          type?: Database["public"]["Enums"]["marker_content_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marker_content_marker_id_fkey"
            columns: ["marker_id"]
            isOneToOne: false
            referencedRelation: "spatial_markers"
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
          spatial_marker_id: string | null
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
          spatial_marker_id?: string | null
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
          spatial_marker_id?: string | null
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
            foreignKeyName: "material_assignments_spatial_marker_id_fkey"
            columns: ["spatial_marker_id"]
            isOneToOne: false
            referencedRelation: "spatial_markers"
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
      material_price_history: {
        Row: {
          company_id: string
          created_at: string
          id: string
          material_id: string
          price: number
          recorded_at: string
          source: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          material_id: string
          price: number
          recorded_at?: string
          source?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          material_id?: string
          price?: number
          recorded_at?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_price_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_price_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "material_price_history_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
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
          {
            foreignKeyName: "materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          entity_references: Json
          id: string
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          entity_references?: Json
          id?: string
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          entity_references?: Json
          id?: string
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_confirmations: {
        Row: {
          company_id: string
          confidence_boost: number | null
          confirmation_type: string
          context_data: Json
          created_at: string
          id: string
          plan_upload_id: string
          question_text: string
          responded_at: string | null
          responded_by: string | null
          response_options: Json
          takeoff_item_id: string | null
          updated_at: string
          user_response: string | null
        }
        Insert: {
          company_id: string
          confidence_boost?: number | null
          confirmation_type: string
          context_data?: Json
          created_at?: string
          id?: string
          plan_upload_id: string
          question_text: string
          responded_at?: string | null
          responded_by?: string | null
          response_options: Json
          takeoff_item_id?: string | null
          updated_at?: string
          user_response?: string | null
        }
        Update: {
          company_id?: string
          confidence_boost?: number | null
          confirmation_type?: string
          context_data?: Json
          created_at?: string
          id?: string
          plan_upload_id?: string
          question_text?: string
          responded_at?: string | null
          responded_by?: string | null
          response_options?: Json
          takeoff_item_id?: string | null
          updated_at?: string
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "micro_confirmations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_confirmations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "micro_confirmations_plan_upload_id_fkey"
            columns: ["plan_upload_id"]
            isOneToOne: false
            referencedRelation: "plan_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "micro_confirmations_takeoff_item_id_fkey"
            columns: ["takeoff_item_id"]
            isOneToOne: false
            referencedRelation: "takeoff_items"
            referencedColumns: ["id"]
          },
        ]
      }
      model_elements: {
        Row: {
          bounds: Json | null
          created_at: string
          element_guid: string
          element_name: string | null
          element_type: string
          floor_id: string | null
          floor_name: string | null
          id: string
          model_id: string
          parent_element_id: string | null
          properties: Json | null
          room_id: string | null
          room_name: string | null
        }
        Insert: {
          bounds?: Json | null
          created_at?: string
          element_guid: string
          element_name?: string | null
          element_type: string
          floor_id?: string | null
          floor_name?: string | null
          id?: string
          model_id: string
          parent_element_id?: string | null
          properties?: Json | null
          room_id?: string | null
          room_name?: string | null
        }
        Update: {
          bounds?: Json | null
          created_at?: string
          element_guid?: string
          element_name?: string | null
          element_type?: string
          floor_id?: string | null
          floor_name?: string | null
          id?: string
          model_id?: string
          parent_element_id?: string | null
          properties?: Json | null
          room_id?: string | null
          room_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_elements_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "projects_3d_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_elements_parent_element_id_fkey"
            columns: ["parent_element_id"]
            isOneToOne: false
            referencedRelation: "model_elements"
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
          user_id?: string
        }
        Relationships: []
      }
      owners: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phase_templates: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          project_type_config_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          project_type_config_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          project_type_config_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "phase_templates_project_type_config_id_fkey"
            columns: ["project_type_config_id"]
            isOneToOne: false
            referencedRelation: "project_type_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_measurements: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          measurement_type: string
          page_number: number
          plan_upload_id: string
          points: Json
          result_unit: string | null
          result_value: number | null
          scale_ratio: number | null
          takeoff_item_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          measurement_type: string
          page_number: number
          plan_upload_id: string
          points: Json
          result_unit?: string | null
          result_value?: number | null
          scale_ratio?: number | null
          takeoff_item_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          measurement_type?: string
          page_number?: number
          plan_upload_id?: string
          points?: Json
          result_unit?: string | null
          result_value?: number | null
          scale_ratio?: number | null
          takeoff_item_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_measurements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_measurements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "plan_measurements_plan_upload_id_fkey"
            columns: ["plan_upload_id"]
            isOneToOne: false
            referencedRelation: "plan_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_measurements_takeoff_item_id_fkey"
            columns: ["takeoff_item_id"]
            isOneToOne: false
            referencedRelation: "takeoff_items"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_pages: {
        Row: {
          classification_confidence: number | null
          company_id: string
          created_at: string
          file_size: number
          id: string
          image_hash_sha256: string | null
          image_height: number
          image_path: string
          image_width: number
          page_classification: string | null
          page_number: number
          page_type: string | null
          parse_status: Database["public"]["Enums"]["plan_page_parse_status"]
          parsed_at: string | null
          plan_upload_id: string
        }
        Insert: {
          classification_confidence?: number | null
          company_id: string
          created_at?: string
          file_size: number
          id?: string
          image_hash_sha256?: string | null
          image_height: number
          image_path: string
          image_width: number
          page_classification?: string | null
          page_number: number
          page_type?: string | null
          parse_status?: Database["public"]["Enums"]["plan_page_parse_status"]
          parsed_at?: string | null
          plan_upload_id: string
        }
        Update: {
          classification_confidence?: number | null
          company_id?: string
          created_at?: string
          file_size?: number
          id?: string
          image_hash_sha256?: string | null
          image_height?: number
          image_path?: string
          image_width?: number
          page_classification?: string | null
          page_number?: number
          page_type?: string | null
          parse_status?: Database["public"]["Enums"]["plan_page_parse_status"]
          parsed_at?: string | null
          plan_upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_pages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "plan_pages_plan_upload_id_fkey"
            columns: ["plan_upload_id"]
            isOneToOne: false
            referencedRelation: "plan_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_parse_results: {
        Row: {
          cached: boolean
          company_id: string
          completion_tokens: number
          cost: number
          created_at: string
          id: string
          model: string
          page_type: string | null
          plan_page_id: string
          prompt_tokens: number
          raw_response: Json
          total_tokens: number
        }
        Insert: {
          cached?: boolean
          company_id: string
          completion_tokens: number
          cost: number
          created_at?: string
          id?: string
          model: string
          page_type?: string | null
          plan_page_id: string
          prompt_tokens: number
          raw_response: Json
          total_tokens: number
        }
        Update: {
          cached?: boolean
          company_id?: string
          completion_tokens?: number
          cost?: number
          created_at?: string
          id?: string
          model?: string
          page_type?: string | null
          plan_page_id?: string
          prompt_tokens?: number
          raw_response?: Json
          total_tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_parse_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_parse_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "plan_parse_results_plan_page_id_fkey"
            columns: ["plan_page_id"]
            isOneToOne: false
            referencedRelation: "plan_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_uploads: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          error_message: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          mime_type: string
          project_id: string
          project_phase_id: string | null
          status: Database["public"]["Enums"]["plan_upload_status"]
          total_pages: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          error_message?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          mime_type: string
          project_id: string
          project_phase_id?: string | null
          status?: Database["public"]["Enums"]["plan_upload_status"]
          total_pages?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          error_message?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          mime_type?: string
          project_id?: string
          project_phase_id?: string | null
          status?: Database["public"]["Enums"]["plan_upload_status"]
          total_pages?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_uploads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_uploads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "plan_uploads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_uploads_project_phase_id_fkey"
            columns: ["project_phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_template_items: {
        Row: {
          category: Database["public"]["Enums"]["takeoff_category"]
          company_id: string
          created_at: string
          equipment_cost: number
          id: string
          labor_cost: number
          material_cost: number
          sub_type: string
          template_id: string
          trade: string
          unit: string
          unit_cost: number
        }
        Insert: {
          category: Database["public"]["Enums"]["takeoff_category"]
          company_id: string
          created_at?: string
          equipment_cost?: number
          id?: string
          labor_cost?: number
          material_cost?: number
          sub_type: string
          template_id: string
          trade: string
          unit: string
          unit_cost?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["takeoff_category"]
          company_id?: string
          created_at?: string
          equipment_cost?: number
          id?: string
          labor_cost?: number
          material_cost?: number
          sub_type?: string
          template_id?: string
          trade?: string
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_template_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_template_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "pricing_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pricing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_templates: {
        Row: {
          category: string | null
          changelog: string[] | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_company_template: boolean
          is_default: boolean
          name: string
          template_data: Json
          updated_at: string
          version: number
        }
        Insert: {
          category?: string | null
          changelog?: string[] | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_company_template?: boolean
          is_default?: boolean
          name: string
          template_data?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string | null
          changelog?: string[] | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_company_template?: boolean
          is_default?: boolean
          name?: string
          template_data?: Json
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
        ]
      }
      project_files: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          client_visible: boolean | null
          company_id: string
          created_at: string
          deleted_at: string | null
          file_size: number
          file_type: string
          file_url: string
          filename: string
          id: string
          metadata: Json | null
          original_filename: string
          parent_file_id: string | null
          project_id: string
          tags: string[] | null
          updated_at: string
          uploaded_by: string
          version_number: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          client_visible?: boolean | null
          company_id: string
          created_at?: string
          deleted_at?: string | null
          file_size: number
          file_type: string
          file_url: string
          filename: string
          id?: string
          metadata?: Json | null
          original_filename: string
          parent_file_id?: string | null
          project_id: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by: string
          version_number?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          client_visible?: boolean | null
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          filename?: string
          id?: string
          metadata?: Json | null
          original_filename?: string
          parent_file_id?: string | null
          project_id?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "project_files_parent_file_id_fkey"
            columns: ["parent_file_id"]
            isOneToOne: false
            referencedRelation: "project_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string
          icon_name: string | null
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
          icon_name?: string | null
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
          icon_name?: string | null
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
      project_photos: {
        Row: {
          category: Database["public"]["Enums"]["photo_category"]
          client_visible: boolean | null
          company_id: string
          created_at: string
          deleted_at: string | null
          exif_data: Json | null
          file_size: number
          filename: string
          id: string
          photo_url: string
          project_id: string
          tags: string[] | null
          thumbnail_url: string | null
          uploaded_by: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["photo_category"]
          client_visible?: boolean | null
          company_id: string
          created_at?: string
          deleted_at?: string | null
          exif_data?: Json | null
          file_size: number
          filename: string
          id?: string
          photo_url: string
          project_id: string
          tags?: string[] | null
          thumbnail_url?: string | null
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["photo_category"]
          client_visible?: boolean | null
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          exif_data?: Json | null
          file_size?: number
          filename?: string
          id?: string
          photo_url?: string
          project_id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_photos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "project_photos_project_id_fkey"
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
          role?: Database["public"]["Enums"]["user_role"]
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
      project_type_configs: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_type_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_type_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_cost: number | null
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
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          project_type: string
          project_type_config_id: string | null
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          actual_cost?: number | null
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
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          project_type?: string
          project_type_config_id?: string | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          actual_cost?: number | null
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
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          project_type?: string
          project_type_config_id?: string | null
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
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "projects_project_type_config_id_fkey"
            columns: ["project_type_config_id"]
            isOneToOne: false
            referencedRelation: "project_type_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_3d_models: {
        Row: {
          bounds: Json | null
          created_at: string
          default_model_id: string | null
          element_count: number | null
          file_name: string
          file_size_bytes: number
          floors: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          lod_low_url: string | null
          lod_medium_url: string | null
          metadata: Json | null
          original_file_url: string
          processing_error: string | null
          processing_status:
            | Database["public"]["Enums"]["spatial_processing_status"]
            | null
          project_id: string
          thumbnail_url: string | null
          updated_at: string
          version: number
          xkt_file_url: string | null
        }
        Insert: {
          bounds?: Json | null
          created_at?: string
          default_model_id?: string | null
          element_count?: number | null
          file_name: string
          file_size_bytes: number
          floors?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          lod_low_url?: string | null
          lod_medium_url?: string | null
          metadata?: Json | null
          original_file_url: string
          processing_error?: string | null
          processing_status?:
            | Database["public"]["Enums"]["spatial_processing_status"]
            | null
          project_id: string
          thumbnail_url?: string | null
          updated_at?: string
          version?: number
          xkt_file_url?: string | null
        }
        Update: {
          bounds?: Json | null
          created_at?: string
          default_model_id?: string | null
          element_count?: number | null
          file_name?: string
          file_size_bytes?: number
          floors?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          lod_low_url?: string | null
          lod_medium_url?: string | null
          metadata?: Json | null
          original_file_url?: string
          processing_error?: string | null
          processing_status?:
            | Database["public"]["Enums"]["spatial_processing_status"]
            | null
          project_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          version?: number
          xkt_file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_3d_models_default_model_id_fkey"
            columns: ["default_model_id"]
            isOneToOne: false
            referencedRelation: "default_3d_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_3d_models_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh_key: string
          platform: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh_key: string
          platform: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh_key?: string
          platform?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      spatial_markers: {
        Row: {
          cluster_id: string | null
          content_count: number | null
          created_at: string
          created_by: string | null
          description: string | null
          element_id: string | null
          element_name: string | null
          element_type: string | null
          floor_id: string | null
          floor_name: string | null
          id: string
          is_client_visible: boolean
          last_activity_at: string | null
          marker_config_id: string | null
          model_id: string | null
          normal_x: number | null
          normal_y: number | null
          normal_z: number | null
          phase_id: string | null
          position_x: number
          position_y: number
          position_z: number
          project_id: string
          room_id: string | null
          room_name: string | null
          status: Database["public"]["Enums"]["spatial_marker_status"]
          task_id: string | null
          title: string
          type: Database["public"]["Enums"]["spatial_marker_type"]
          updated_at: string
        }
        Insert: {
          cluster_id?: string | null
          content_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          element_id?: string | null
          element_name?: string | null
          element_type?: string | null
          floor_id?: string | null
          floor_name?: string | null
          id?: string
          is_client_visible?: boolean
          last_activity_at?: string | null
          marker_config_id?: string | null
          model_id?: string | null
          normal_x?: number | null
          normal_y?: number | null
          normal_z?: number | null
          phase_id?: string | null
          position_x: number
          position_y: number
          position_z: number
          project_id: string
          room_id?: string | null
          room_name?: string | null
          status?: Database["public"]["Enums"]["spatial_marker_status"]
          task_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["spatial_marker_type"]
          updated_at?: string
        }
        Update: {
          cluster_id?: string | null
          content_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          element_id?: string | null
          element_name?: string | null
          element_type?: string | null
          floor_id?: string | null
          floor_name?: string | null
          id?: string
          is_client_visible?: boolean
          last_activity_at?: string | null
          marker_config_id?: string | null
          model_id?: string | null
          normal_x?: number | null
          normal_y?: number | null
          normal_z?: number | null
          phase_id?: string | null
          position_x?: number
          position_y?: number
          position_z?: number
          project_id?: string
          room_id?: string | null
          room_name?: string | null
          status?: Database["public"]["Enums"]["spatial_marker_status"]
          task_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["spatial_marker_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spatial_markers_marker_config_id_fkey"
            columns: ["marker_config_id"]
            isOneToOne: false
            referencedRelation: "default_marker_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_markers_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "projects_3d_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_markers_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_markers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spatial_markers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          id: string
          plan_active: boolean
          plan_expires: number | null
          stripe_customer_id: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_active?: boolean
          plan_expires?: number | null
          stripe_customer_id: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_active?: boolean
          plan_expires?: number | null
          stripe_customer_id?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subcontractor_contracts: {
        Row: {
          company_id: string
          contract_amount: number
          contract_executed: boolean
          created_at: string
          created_by: string | null
          id: string
          insurance_received: boolean
          notes: string | null
          ntp_issued: boolean
          phase: string | null
          project_id: string
          punchlist_complete: boolean
          schedule_received: boolean
          status: string
          subcontractor_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_amount: number
          contract_executed?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          insurance_received?: boolean
          notes?: string | null
          ntp_issued?: boolean
          phase?: string | null
          project_id: string
          punchlist_complete?: boolean
          schedule_received?: boolean
          status?: string
          subcontractor_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_amount?: number
          contract_executed?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          insurance_received?: boolean
          notes?: string | null
          ntp_issued?: boolean
          phase?: string | null
          project_id?: string
          punchlist_complete?: boolean
          schedule_received?: boolean
          status?: string
          subcontractor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "subcontractor_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_contracts_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_payments: {
        Row: {
          amount: number
          company_id: string
          contract_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
        }
        Insert: {
          amount: number
          company_id: string
          contract_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
        }
        Update: {
          amount?: number
          company_id?: string
          contract_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "subcontractor_payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "subcontractor_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          address: string | null
          certificate_of_insurance: string | null
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
          trade_specialization: Database["public"]["Enums"]["trade_type"] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          certificate_of_insurance?: string | null
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
          trade_specialization?:
            | Database["public"]["Enums"]["trade_type"]
            | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          certificate_of_insurance?: string | null
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
          trade_specialization?:
            | Database["public"]["Enums"]["trade_type"]
            | null
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
          {
            foreignKeyName: "subcontractors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
        ]
      }
      takeoff_items: {
        Row: {
          adjusted_quantity: number
          ai_item_id: string | null
          category: Database["public"]["Enums"]["takeoff_category"]
          company_id: string
          confidence: number
          created_at: string
          edit_history: Json
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          id: string
          needs_review: boolean
          notes: string | null
          plan_page_id: string
          plan_upload_id: string
          quantity: number
          review_status: Database["public"]["Enums"]["review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          source_region: Json | null
          sub_type: string
          trade: string
          unit: string
          updated_at: string
          waste_factor: number
        }
        Insert: {
          adjusted_quantity: number
          ai_item_id?: string | null
          category: Database["public"]["Enums"]["takeoff_category"]
          company_id: string
          confidence: number
          created_at?: string
          edit_history?: Json
          extraction_method: Database["public"]["Enums"]["extraction_method"]
          id?: string
          needs_review?: boolean
          notes?: string | null
          plan_page_id: string
          plan_upload_id: string
          quantity: number
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_region?: Json | null
          sub_type: string
          trade: string
          unit: string
          updated_at?: string
          waste_factor?: number
        }
        Update: {
          adjusted_quantity?: number
          ai_item_id?: string | null
          category?: Database["public"]["Enums"]["takeoff_category"]
          company_id?: string
          confidence?: number
          created_at?: string
          edit_history?: Json
          extraction_method?: Database["public"]["Enums"]["extraction_method"]
          id?: string
          needs_review?: boolean
          notes?: string | null
          plan_page_id?: string
          plan_upload_id?: string
          quantity?: number
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_region?: Json | null
          sub_type?: string
          trade?: string
          unit?: string
          updated_at?: string
          waste_factor?: number
        }
        Relationships: [
          {
            foreignKeyName: "takeoff_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoff_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "takeoff_items_plan_page_id_fkey"
            columns: ["plan_page_id"]
            isOneToOne: false
            referencedRelation: "plan_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoff_items_plan_upload_id_fkey"
            columns: ["plan_upload_id"]
            isOneToOne: false
            referencedRelation: "plan_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id?: string | null
        }
        Update: {
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
      task_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          is_primary: boolean
          subcontractor_id: string | null
          task_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          subcontractor_id?: string | null
          task_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          subcontractor_id?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
      task_templates: {
        Row: {
          company_id: string
          created_at: string | null
          days_offset: number | null
          default_priority: Database["public"]["Enums"]["task_priority"] | null
          default_task_type: string | null
          description: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          phase_template_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          days_offset?: number | null
          default_priority?: Database["public"]["Enums"]["task_priority"] | null
          default_task_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          phase_template_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          days_offset?: number | null
          default_priority?: Database["public"]["Enums"]["task_priority"] | null
          default_task_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          phase_template_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "task_templates_phase_template_id_fkey"
            columns: ["phase_template_id"]
            isOneToOne: false
            referencedRelation: "phase_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_type_configs: {
        Row: {
          color: string | null
          company_id: string
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_type_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_type_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_cost: number | null
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
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
          receipt_photo_url: string | null
          spatial_marker_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          approval_notes?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
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
          receipt_photo_url?: string | null
          spatial_marker_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          approval_notes?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
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
          receipt_photo_url?: string | null
          spatial_marker_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: string
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
          {
            foreignKeyName: "tasks_spatial_marker_id_fkey"
            columns: ["spatial_marker_id"]
            isOneToOne: false
            referencedRelation: "spatial_markers"
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
          role: string
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
          role?: string
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
          role?: string
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
            foreignKeyName: "team_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
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
      template_usage: {
        Row: {
          created_at: string
          estimate_id: string | null
          id: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimate_id?: string | null
          id?: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimate_id?: string | null
          id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_usage_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_usage_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pricing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_materials: {
        Row: {
          company_id: string
          created_at: string
          id: string
          material_id: string
          tracked_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          material_id: string
          tracked_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          material_id?: string
          tracked_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracked_materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "mv_dashboard_kpis"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tracked_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
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
      mv_dashboard_kpis: {
        Row: {
          active_projects: number | null
          archived_projects: number | null
          at_risk_tasks: number | null
          blocked_tasks: number | null
          company_id: string | null
          completed_projects: number | null
          completed_tasks: number | null
          delayed_tasks: number | null
          due_this_week_tasks: number | null
          due_today_tasks: number | null
          expenses_total: number | null
          expenses_total_amount: number | null
          in_progress_tasks: number | null
          last_updated: string | null
          materials_delivered: number | null
          materials_needed: number | null
          materials_ordered: number | null
          on_hold_projects: number | null
          on_time_tasks: number | null
          overdue_tasks: number | null
          pending_approval_tasks: number | null
          team_size: number | null
          todo_tasks: number | null
          total_actual_cost: number | null
          total_budget: number | null
          total_materials: number | null
          total_planned_cost: number | null
          total_projects: number | null
          total_tasks: number | null
          unassigned_tasks: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      acquire_dm_lock: {
        Args: { user1_id: string; user2_id: string }
        Returns: number
      }
      calculate_project_health_score: {
        Args: { p_project_id: string }
        Returns: number
      }
      claim_extraction_job: {
        Args: { p_worker_id?: string }
        Returns: {
          attempt: number
          claimed_at: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          depends_on: string[] | null
          error: string | null
          heartbeat_at: string | null
          id: string
          max_attempts: number
          page_number: number
          plan_upload_id: string
          result: Json | null
          stage: Database["public"]["Enums"]["extraction_stage"]
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "extraction_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      find_dm_room: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      get_chat_rooms_with_metadata: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: {
          company_id: string
          created_at: string
          id: string
          last_message: Json
          last_read_at: string
          muted_until: string
          name: string
          participant_count: number
          project_id: string
          type: string
          unread_count: number
          updated_at: string
        }[]
      }
      get_expenses_by_category: {
        Args: { p_company_id: string }
        Returns: {
          amount: number
          category: string
        }[]
      }
      get_message_with_details: {
        Args: { p_message_id: string }
        Returns: Json
      }
      get_next_phase_template_order_index: {
        Args: { p_company_id: string; p_project_type_config_id: string }
        Returns: number
      }
      get_next_project_type_order_index: {
        Args: { p_company_id: string }
        Returns: number
      }
      get_next_task_template_order_index: {
        Args: { p_company_id: string; p_phase_template_id: string }
        Returns: number
      }
      get_project_detail_with_stats: {
        Args: { p_project_id: string }
        Returns: Json
      }
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
      get_project_team_cost_summary: {
        Args: { p_project_id: string }
        Returns: Json
      }
      get_project_types_with_counts: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_project_with_full_stats: {
        Args: { p_company_id: string; p_project_id: string }
        Returns: Json
      }
      get_projects_with_stats: {
        Args: { p_company_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_task_analytics: {
        Args: { p_company_id: string; project_filter: string }
        Returns: {
          at_risk: number
          blocked_by_deps: number
          blocked_count: number
          blocked_rate: number
          budget_utilization: number
          budget_variance: number
          completed: number
          completion_rate: number
          expenses_total: number
          materials_delivered: number
          materials_needed: number
          materials_ordered: number
          on_time: number
          overdue: number
          priority_high: number
          priority_low: number
          priority_medium: number
          ready_to_start: number
          tasks_per_day: number
          top_assignees_json: Json
          top_blocked_reasons: string[]
          total_actual: number
          total_amount: number
          total_planned: number
          total_tasks: number
          unassigned: number
          velocity_trend: number
        }[]
      }
      get_team_member_project_counts: {
        Args: { p_company_id: string }
        Returns: {
          project_count: number
          user_id: string
        }[]
      }
      get_top_assignees: {
        Args: { p_company_id: string; p_limit?: number }
        Returns: {
          avatar_url: string
          id: string
          name: string
          task_count: number
        }[]
      }
      get_top_team_members_by_completed_tasks: {
        Args: { limit_count?: number; p_company_id: string }
        Returns: {
          avatar_url: string
          completed_tasks: number
          id: string
          name: string
        }[]
      }
      get_unread_count: {
        Args: { p_chat_room_id: string; p_user_id: string }
        Returns: number
      }
      get_user_company_id: { Args: { p_user_id: string }; Returns: string }
      is_user_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_user_gc_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_user_owner: { Args: { p_user_id: string }; Returns: boolean }
      reap_stale_extraction_jobs: { Args: never; Returns: number }
      refresh_dashboard_kpis: { Args: never; Returns: undefined }
      seed_company_templates: {
        Args: { company_id_param: string }
        Returns: undefined
      }
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
      approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "revision_requested"
      attachment_entity_type:
        | "task"
        | "project"
        | "phase"
        | "profile"
        | "subcontractor"
      budget_status: "draft" | "approved" | "locked"
      document_category:
        | "contracts"
        | "permits"
        | "drawings"
        | "reports"
        | "financial"
        | "safety"
        | "meeting_notes"
        | "specifications"
        | "general"
      estimate_status: "draft" | "reviewed" | "approved" | "superseded"
      expense_category:
        | "materials"
        | "labor"
        | "equipment"
        | "permits"
        | "transportation"
        | "meals"
        | "lodging"
        | "other"
      extraction_method: "labeled" | "calculated" | "inferred" | "manual"
      extraction_stage:
        | "extract_vectors"
        | "classify_sheet"
        | "detect_scale"
        | "detect_elements"
        | "detect_rooms"
        | "extract_schedules"
        | "extract_mep"
        | "calculate_quantities"
        | "cross_page_reconcile"
        | "generate_estimate"
      job_status:
        | "pending"
        | "claimed"
        | "processing"
        | "completed"
        | "failed"
        | "dead_letter"
      marker_content_type: "photo" | "file" | "note" | "activity"
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
      phase_status: "not_started" | "in_progress" | "completed" | "on_hold"
      photo_category:
        | "site_progress"
        | "safety_documentation"
        | "permits_approvals"
        | "inspection_reports"
        | "material_receipts"
        | "change_orders"
        | "defects_issues"
        | "before_after"
        | "task_receipts"
        | "expense_receipts"
        | "general"
      plan_page_parse_status: "pending" | "parsing" | "parsed" | "parse_failed"
      plan_upload_status: "uploading" | "processing" | "ready" | "failed"
      procurement_status: "needed" | "ordered" | "delivered" | "installed"
      project_status:
        | "active"
        | "on_hold"
        | "completed"
        | "archived"
        | "planning"
        | "in_progress"
      project_type:
        | "residential"
        | "restaurant"
        | "cafe"
        | "commercial_office"
        | "industrial"
      purchaser_type: "gc" | "pm" | "subcontractor"
      review_status: "pending" | "accepted" | "rejected" | "edited"
      spatial_marker_status: "open" | "in_progress" | "resolved" | "closed"
      spatial_marker_type:
        | "issue"
        | "note"
        | "photo"
        | "inspection"
        | "rfi"
        | "safety"
        | "material"
        | "progress"
      spatial_processing_status: "pending" | "processing" | "ready" | "failed"
      takeoff_category:
        | "structural"
        | "architectural"
        | "mechanical"
        | "electrical"
        | "plumbing"
        | "painting"
        | "site"
        | "general"
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
        | "framing"
      user_role:
        | "admin"
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
      approval_status: [
        "pending",
        "approved",
        "rejected",
        "revision_requested",
      ],
      attachment_entity_type: [
        "task",
        "project",
        "phase",
        "profile",
        "subcontractor",
      ],
      budget_status: ["draft", "approved", "locked"],
      document_category: [
        "contracts",
        "permits",
        "drawings",
        "reports",
        "financial",
        "safety",
        "meeting_notes",
        "specifications",
        "general",
      ],
      estimate_status: ["draft", "reviewed", "approved", "superseded"],
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
      extraction_method: ["labeled", "calculated", "inferred", "manual"],
      extraction_stage: [
        "extract_vectors",
        "classify_sheet",
        "detect_scale",
        "detect_elements",
        "detect_rooms",
        "extract_schedules",
        "extract_mep",
        "calculate_quantities",
        "cross_page_reconcile",
        "generate_estimate",
      ],
      job_status: [
        "pending",
        "claimed",
        "processing",
        "completed",
        "failed",
        "dead_letter",
      ],
      marker_content_type: ["photo", "file", "note", "activity"],
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
      ],
      phase_status: ["not_started", "in_progress", "completed", "on_hold"],
      photo_category: [
        "site_progress",
        "safety_documentation",
        "permits_approvals",
        "inspection_reports",
        "material_receipts",
        "change_orders",
        "defects_issues",
        "before_after",
        "task_receipts",
        "expense_receipts",
        "general",
      ],
      plan_page_parse_status: ["pending", "parsing", "parsed", "parse_failed"],
      plan_upload_status: ["uploading", "processing", "ready", "failed"],
      procurement_status: ["needed", "ordered", "delivered", "installed"],
      project_status: [
        "active",
        "on_hold",
        "completed",
        "archived",
        "planning",
        "in_progress",
      ],
      project_type: [
        "residential",
        "restaurant",
        "cafe",
        "commercial_office",
        "industrial",
      ],
      purchaser_type: ["gc", "pm", "subcontractor"],
      review_status: ["pending", "accepted", "rejected", "edited"],
      spatial_marker_status: ["open", "in_progress", "resolved", "closed"],
      spatial_marker_type: [
        "issue",
        "note",
        "photo",
        "inspection",
        "rfi",
        "safety",
        "material",
        "progress",
      ],
      spatial_processing_status: ["pending", "processing", "ready", "failed"],
      takeoff_category: [
        "structural",
        "architectural",
        "mechanical",
        "electrical",
        "plumbing",
        "painting",
        "site",
        "general",
      ],
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
        "framing",
      ],
      user_role: [
        "admin",
        "project_manager",
        "foreman",
        "field_worker",
        "subcontractor",
        "client",
      ],
    },
  },
} as const
