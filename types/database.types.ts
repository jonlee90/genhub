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
      companies: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          name: string
          email: string
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      company_users: {
        Row: {
          id: string
          company_id: string
          user_id: string
          invited_by: string | null
          invited_at: string | null
          activated_at: string | null
          created_at: string
          updated_at: string
          invitation_token: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["member_status"]
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          invited_by?: string | null
          invited_at?: string | null
          activated_at?: string | null
          created_at?: string
          updated_at?: string
          invitation_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          invited_by?: string | null
          invited_at?: string | null
          activated_at?: string | null
          created_at?: string
          updated_at?: string
          invitation_token?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
        }
      }
      subcontractors: {
        Row: {
          id: string
          company_id: string
          company_name: string
          contact_name: string
          email: string | null
          phone: string | null
          address: string | null
          license_number: string | null
          license_expiry: string | null
          insurance_provider: string | null
          insurance_expiry: string | null
          performance_rating: number | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          company_name: string
          contact_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          license_number?: string | null
          license_expiry?: string | null
          insurance_provider?: string | null
          insurance_expiry?: string | null
          performance_rating?: number | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          company_name?: string
          contact_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          license_number?: string | null
          license_expiry?: string | null
          insurance_provider?: string | null
          insurance_expiry?: string | null
          performance_rating?: number | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          client_name: string
          client_email: string | null
          client_phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          project_type: Database["public"]["Enums"]["project_type_old"]
          description: string | null
          start_date: string | null
          end_date: string | null
          budget: number | null
          health_score: number | null
          completion_percentage: number | null
          created_by: string | null
          created_at: string
          updated_at: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          status: Database["public"]["Enums"]["project_status"]
          actual_cost: number | null
          project_type_config_id: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          client_name: string
          client_email?: string | null
          client_phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          project_type?: Database["public"]["Enums"]["project_type_old"]
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          health_score?: number | null
          completion_percentage?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          actual_cost?: number | null
          project_type_config_id?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          client_name?: string
          client_email?: string | null
          client_phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          project_type?: Database["public"]["Enums"]["project_type_old"]
          description?: string | null
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          health_score?: number | null
          completion_percentage?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          actual_cost?: number | null
          project_type_config_id?: string | null
        }
      }
      project_phases: {
        Row: {
          id: string
          project_id: string
          name: string
          order_index: number
          completion_percentage: number | null
          started_at: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
          status: Database["public"]["Enums"]["phase_status"]
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          order_index?: number
          completion_percentage?: number | null
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          status?: Database["public"]["Enums"]["phase_status"]
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          order_index?: number
          completion_percentage?: number | null
          started_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          status?: Database["public"]["Enums"]["phase_status"]
        }
      }
      project_team: {
        Row: {
          id: string
          project_id: string
          user_id: string | null
          subcontractor_id: string | null
          assigned_at: string
          assigned_by: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          id?: string
          project_id: string
          user_id?: string | null
          subcontractor_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string | null
          subcontractor_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          phase_id: string | null
          title: string
          description: string | null
          assignee_id: string | null
          due_date: string | null
          planned_cost: number | null
          actual_cost: number | null
          blocked_reason: string | null
          completed_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          start_date: string | null
          task_type: Database["public"]["Enums"]["task_type"]
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approval_notes: string | null
          approved_by: string | null
          approved_at: string | null
          receipt_photo_url: string | null
          spatial_marker_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          priority: Database["public"]["Enums"]["task_priority"]
        }
        Insert: {
          id?: string
          project_id: string
          phase_id?: string | null
          title: string
          description?: string | null
          assignee_id?: string | null
          due_date?: string | null
          planned_cost?: number | null
          actual_cost?: number | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          start_date?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          approval_status?: Database["public"]["Enums"]["approval_status"] | null
          approval_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          receipt_photo_url?: string | null
          spatial_marker_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
        }
        Update: {
          id?: string
          project_id?: string
          phase_id?: string | null
          title?: string
          description?: string | null
          assignee_id?: string | null
          due_date?: string | null
          planned_cost?: number | null
          actual_cost?: number | null
          blocked_reason?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          start_date?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          approval_status?: Database["public"]["Enums"]["approval_status"] | null
          approval_notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          receipt_photo_url?: string | null
          spatial_marker_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
        }
      }
      task_dependencies: {
        Row: {
          id: string
          task_id: string
          depends_on_task_id: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          depends_on_task_id: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          depends_on_task_id?: string
          created_at?: string
        }
      }
      task_activity: {
        Row: {
          id: string
          task_id: string
          user_id: string | null
          old_value: string | null
          new_value: string | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id?: string | null
          old_value?: string | null
          new_value?: string | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_id?: string | null
          old_value?: string | null
          new_value?: string | null
          comment?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          link: string | null
          read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          link?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          link?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      attachments: {
        Row: {
          id: string
          entity_id: string
          file_name: string
          file_url: string
          file_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_id: string
          file_name: string
          file_url: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_id?: string
          file_name?: string
          file_url?: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      team_invitations: {
        Row: {
          id: string
          company_id: string
          email: string
          name: string
          invitation_token: string
          invited_by: string
          invited_at: string
          expires_at: string
          used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          email: string
          name: string
          invitation_token?: string
          invited_by: string
          invited_at?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          name?: string
          invitation_token?: string
          invited_by?: string
          invited_at?: string
          expires_at?: string
          used_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          company_id: string
          product_name: string
          product_description: string | null
          sku: string | null
          category: Database["public"]["Enums"]["material_category"]
          manufacturer: string | null
          unit_price: number | null
          unit_of_measure: string
          home_depot_product_id: string | null
          home_depot_url: string | null
          product_image_url: string | null
          stock_status: string | null
          lead_time_days: number | null
          specifications: Json | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          product_name: string
          product_description?: string | null
          sku?: string | null
          category?: Database["public"]["Enums"]["material_category"]
          manufacturer?: string | null
          unit_price?: number | null
          unit_of_measure?: string
          home_depot_product_id?: string | null
          home_depot_url?: string | null
          product_image_url?: string | null
          stock_status?: string | null
          lead_time_days?: number | null
          specifications?: Json | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          product_name?: string
          product_description?: string | null
          sku?: string | null
          category?: Database["public"]["Enums"]["material_category"]
          manufacturer?: string | null
          unit_price?: number | null
          unit_of_measure?: string
          home_depot_product_id?: string | null
          home_depot_url?: string | null
          product_image_url?: string | null
          stock_status?: string | null
          lead_time_days?: number | null
          specifications?: Json | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      material_assignments: {
        Row: {
          id: string
          material_id: string
          task_id: string
          project_id: string
          quantity: number
          unit_cost: number
          total_cost: number | null
          procurement_status: Database["public"]["Enums"]["procurement_status"]
          purchaser_type: Database["public"]["Enums"]["purchaser_type"]
          purchaser_id: string | null
          subcontractor_id: string | null
          ordered_date: string | null
          estimated_delivery_date: string | null
          delivered_date: string | null
          installed_date: string | null
          notes: string | null
          assigned_by: string | null
          created_at: string
          updated_at: string
          spatial_marker_id: string | null
        }
        Insert: {
          id?: string
          material_id: string
          task_id: string
          project_id: string
          quantity: number
          unit_cost: number
          total_cost?: number | null
          procurement_status?: Database["public"]["Enums"]["procurement_status"]
          purchaser_type?: Database["public"]["Enums"]["purchaser_type"]
          purchaser_id?: string | null
          subcontractor_id?: string | null
          ordered_date?: string | null
          estimated_delivery_date?: string | null
          delivered_date?: string | null
          installed_date?: string | null
          notes?: string | null
          assigned_by?: string | null
          created_at?: string
          updated_at?: string
          spatial_marker_id?: string | null
        }
        Update: {
          id?: string
          material_id?: string
          task_id?: string
          project_id?: string
          quantity?: number
          unit_cost?: number
          total_cost?: number | null
          procurement_status?: Database["public"]["Enums"]["procurement_status"]
          purchaser_type?: Database["public"]["Enums"]["purchaser_type"]
          purchaser_id?: string | null
          subcontractor_id?: string | null
          ordered_date?: string | null
          estimated_delivery_date?: string | null
          delivered_date?: string | null
          installed_date?: string | null
          notes?: string | null
          assigned_by?: string | null
          created_at?: string
          updated_at?: string
          spatial_marker_id?: string | null
        }
      }
      expenses: {
        Row: {
          id: string
          company_id: string
          project_id: string | null
          task_id: string | null
          description: string
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          expense_date: string | null
          vendor_name: string | null
          vendor_address: string | null
          receipt_url: string | null
          receipt_ocr_data: Json | null
          ocr_confidence_score: number | null
          ocr_processed: boolean
          status: Database["public"]["Enums"]["expense_status"]
          submitted_by: string
          submitted_at: string
          reviewed_by: string | null
          reviewed_at: string | null
          approval_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          project_id?: string | null
          task_id?: string | null
          description: string
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          expense_date?: string | null
          vendor_name?: string | null
          vendor_address?: string | null
          receipt_url?: string | null
          receipt_ocr_data?: Json | null
          ocr_confidence_score?: number | null
          ocr_processed?: boolean
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by: string
          submitted_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          approval_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          project_id?: string | null
          task_id?: string | null
          description?: string
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          expense_date?: string | null
          vendor_name?: string | null
          vendor_address?: string | null
          receipt_url?: string | null
          receipt_ocr_data?: Json | null
          ocr_confidence_score?: number | null
          ocr_processed?: boolean
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by?: string
          submitted_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          approval_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expense_line_items: {
        Row: {
          id: string
          expense_id: string
          material_id: string | null
          material_assignment_id: string | null
          description: string
          quantity: number | null
          unit_price: number
          line_total: number | null
          matched_by_ai: boolean
          match_confidence_score: number | null
          manually_matched: boolean
          ocr_extracted_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          material_id?: string | null
          material_assignment_id?: string | null
          description: string
          quantity?: number | null
          unit_price: number
          line_total?: number | null
          matched_by_ai?: boolean
          match_confidence_score?: number | null
          manually_matched?: boolean
          ocr_extracted_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          material_id?: string | null
          material_assignment_id?: string | null
          description?: string
          quantity?: number | null
          unit_price?: number
          line_total?: number | null
          matched_by_ai?: boolean
          match_confidence_score?: number | null
          manually_matched?: boolean
          ocr_extracted_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      stripe_customers: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          plan_active: boolean
          plan_expires: number | null
          subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          stripe_customer_id: string
          plan_active?: boolean
          plan_expires?: number | null
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          plan_active?: boolean
          plan_expires?: number | null
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_rooms: {
        Row: {
          id: string
          company_id: string
          project_id: string | null
          type: string
          name: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          project_id?: string | null
          type: string
          name?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          project_id?: string | null
          type?: string
          name?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_participants: {
        Row: {
          id: string
          chat_room_id: string
          user_id: string
          role: string
          last_read_at: string
          muted_until: string | null
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          user_id: string
          role?: string
          last_read_at?: string
          muted_until?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          user_id?: string
          role?: string
          last_read_at?: string
          muted_until?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_room_id: string
          sender_id: string
          content: string
          reply_to_id: string | null
          entity_references: Json
          edited_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          sender_id: string
          content: string
          reply_to_id?: string | null
          entity_references?: Json
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          sender_id?: string
          content?: string
          reply_to_id?: string | null
          entity_references?: Json
          edited_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      message_reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string | null
        }
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          thumbnail_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          thumbnail_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          thumbnail_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          platform: string
          p256dh_key: string
          auth_key: string
          user_agent: string | null
          last_used_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          platform: string
          p256dh_key: string
          auth_key: string
          user_agent?: string | null
          last_used_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          platform?: string
          p256dh_key?: string
          auth_key?: string
          user_agent?: string | null
          last_used_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      kakao_connections: {
        Row: {
          id: string
          user_id: string
          kakao_user_id: string
          sendbird_user_id: string
          two_way_sync: boolean
          connected_at: string
          disconnected_at: string | null
          access_token: string
          refresh_token: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kakao_user_id: string
          sendbird_user_id: string
          two_way_sync?: boolean
          connected_at?: string
          disconnected_at?: string | null
          access_token: string
          refresh_token: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kakao_user_id?: string
          sendbird_user_id?: string
          two_way_sync?: boolean
          connected_at?: string
          disconnected_at?: string | null
          access_token?: string
          refresh_token?: string
          created_at?: string
          updated_at?: string
        }
      }
      project_type_configs: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          icon_name: string | null
          color: string | null
          is_default: boolean | null
          order_index: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          icon_name?: string | null
          color?: string | null
          is_default?: boolean | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          icon_name?: string | null
          color?: string | null
          is_default?: boolean | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      task_type_configs: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          color: string | null
          icon_name: string | null
          is_default: boolean | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          description?: string | null
          color?: string | null
          icon_name?: string | null
          is_default?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          description?: string | null
          color?: string | null
          icon_name?: string | null
          is_default?: boolean | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      phase_templates: {
        Row: {
          id: string
          company_id: string
          project_type_config_id: string
          name: string
          description: string | null
          order_index: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          project_type_config_id: string
          name: string
          description?: string | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          project_type_config_id?: string
          name?: string
          description?: string | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      task_templates: {
        Row: {
          id: string
          company_id: string
          phase_template_id: string
          title: string
          description: string | null
          default_task_type: Database["public"]["Enums"]["task_type"] | null
          default_priority: Database["public"]["Enums"]["task_priority"] | null
          order_index: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
          days_offset: number | null
        }
        Insert: {
          id?: string
          company_id: string
          phase_template_id: string
          title: string
          description?: string | null
          default_task_type?: Database["public"]["Enums"]["task_type"] | null
          default_priority?: Database["public"]["Enums"]["task_priority"] | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          days_offset?: number | null
        }
        Update: {
          id?: string
          company_id?: string
          phase_template_id?: string
          title?: string
          description?: string | null
          default_task_type?: Database["public"]["Enums"]["task_type"] | null
          default_priority?: Database["public"]["Enums"]["task_priority"] | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          days_offset?: number | null
        }
      }
      projects_3d_models: {
        Row: {
          id: string
          project_id: string
          version: number
          file_name: string
          original_file_url: string
          xkt_file_url: string | null
          lod_medium_url: string | null
          lod_low_url: string | null
          thumbnail_url: string | null
          file_size_bytes: number
          element_count: number | null
          bounds: Json | null
          floors: Json | null
          metadata: Json | null
          is_active: boolean | null
          processing_status: Database["public"]["Enums"]["spatial_processing_status"] | null
          processing_error: string | null
          created_at: string
          updated_at: string
          is_default: boolean | null
          default_model_id: string | null
        }
        Insert: {
          id?: string
          project_id: string
          version?: number
          file_name: string
          original_file_url: string
          xkt_file_url?: string | null
          lod_medium_url?: string | null
          lod_low_url?: string | null
          thumbnail_url?: string | null
          file_size_bytes: number
          element_count?: number | null
          bounds?: Json | null
          floors?: Json | null
          metadata?: Json | null
          is_active?: boolean | null
          processing_status?: Database["public"]["Enums"]["spatial_processing_status"] | null
          processing_error?: string | null
          created_at?: string
          updated_at?: string
          is_default?: boolean | null
          default_model_id?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          version?: number
          file_name?: string
          original_file_url?: string
          xkt_file_url?: string | null
          lod_medium_url?: string | null
          lod_low_url?: string | null
          thumbnail_url?: string | null
          file_size_bytes?: number
          element_count?: number | null
          bounds?: Json | null
          floors?: Json | null
          metadata?: Json | null
          is_active?: boolean | null
          processing_status?: Database["public"]["Enums"]["spatial_processing_status"] | null
          processing_error?: string | null
          created_at?: string
          updated_at?: string
          is_default?: boolean | null
          default_model_id?: string | null
        }
      }
      spatial_markers: {
        Row: {
          id: string
          project_id: string
          model_id: string | null
          type: Database["public"]["Enums"]["spatial_marker_type"]
          status: Database["public"]["Enums"]["spatial_marker_status"]
          position_x: number | null
          position_y: number | null
          position_z: number | null
          normal_x: number | null
          normal_y: number | null
          normal_z: number | null
          element_id: string | null
          element_type: string | null
          element_name: string | null
          floor_id: string | null
          floor_name: string | null
          room_id: string | null
          room_name: string | null
          title: string
          description: string | null
          task_id: string | null
          phase_id: string | null
          cluster_id: string | null
          content_count: number | null
          last_activity_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          marker_config_id: string | null
          is_client_visible: boolean
        }
        Insert: {
          id?: string
          project_id: string
          model_id?: string | null
          type?: Database["public"]["Enums"]["spatial_marker_type"]
          status?: Database["public"]["Enums"]["spatial_marker_status"]
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          normal_x?: number | null
          normal_y?: number | null
          normal_z?: number | null
          element_id?: string | null
          element_type?: string | null
          element_name?: string | null
          floor_id?: string | null
          floor_name?: string | null
          room_id?: string | null
          room_name?: string | null
          title: string
          description?: string | null
          task_id?: string | null
          phase_id?: string | null
          cluster_id?: string | null
          content_count?: number | null
          last_activity_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          marker_config_id?: string | null
          is_client_visible?: boolean
        }
        Update: {
          id?: string
          project_id?: string
          model_id?: string | null
          type?: Database["public"]["Enums"]["spatial_marker_type"]
          status?: Database["public"]["Enums"]["spatial_marker_status"]
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          normal_x?: number | null
          normal_y?: number | null
          normal_z?: number | null
          element_id?: string | null
          element_type?: string | null
          element_name?: string | null
          floor_id?: string | null
          floor_name?: string | null
          room_id?: string | null
          room_name?: string | null
          title?: string
          description?: string | null
          task_id?: string | null
          phase_id?: string | null
          cluster_id?: string | null
          content_count?: number | null
          last_activity_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          marker_config_id?: string | null
          is_client_visible?: boolean
        }
      }
      marker_content: {
        Row: {
          id: string
          marker_id: string
          type: Database["public"]["Enums"]["marker_content_type"]
          photo_url: string | null
          photo_thumbnail_url: string | null
          photo_width: number | null
          photo_height: number | null
          photo_exif: Json | null
          file_url: string | null
          file_name: string | null
          file_size_bytes: number | null
          file_mime_type: string | null
          note_text: string | null
          note_format: string | null
          activity_type: string | null
          activity_data: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          marker_id: string
          type: Database["public"]["Enums"]["marker_content_type"]
          photo_url?: string | null
          photo_thumbnail_url?: string | null
          photo_width?: number | null
          photo_height?: number | null
          photo_exif?: Json | null
          file_url?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_mime_type?: string | null
          note_text?: string | null
          note_format?: string | null
          activity_type?: string | null
          activity_data?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          marker_id?: string
          type?: Database["public"]["Enums"]["marker_content_type"]
          photo_url?: string | null
          photo_thumbnail_url?: string | null
          photo_width?: number | null
          photo_height?: number | null
          photo_exif?: Json | null
          file_url?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_mime_type?: string | null
          note_text?: string | null
          note_format?: string | null
          activity_type?: string | null
          activity_data?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      model_elements: {
        Row: {
          id: string
          model_id: string
          element_guid: string
          element_type: string
          element_name: string | null
          floor_id: string | null
          floor_name: string | null
          room_id: string | null
          room_name: string | null
          properties: Json | null
          bounds: Json | null
          parent_element_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          model_id: string
          element_guid: string
          element_type: string
          element_name?: string | null
          floor_id?: string | null
          floor_name?: string | null
          room_id?: string | null
          room_name?: string | null
          properties?: Json | null
          bounds?: Json | null
          parent_element_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          element_guid?: string
          element_type?: string
          element_name?: string | null
          floor_id?: string | null
          floor_name?: string | null
          room_id?: string | null
          room_name?: string | null
          properties?: Json | null
          bounds?: Json | null
          parent_element_id?: string | null
          created_at?: string
        }
      }
      default_3d_models: {
        Row: {
          id: string
          project_type: string
          name: string
          description: string | null
          original_file_url: string
          xkt_file_url: string
          lod_medium_url: string | null
          lod_low_url: string | null
          thumbnail_url: string | null
          file_size_bytes: number
          element_count: number | null
          bounds: Json | null
          floors: Json | null
          version: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_type: string
          name: string
          description?: string | null
          original_file_url: string
          xkt_file_url: string
          lod_medium_url?: string | null
          lod_low_url?: string | null
          thumbnail_url?: string | null
          file_size_bytes: number
          element_count?: number | null
          bounds?: Json | null
          floors?: Json | null
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_type?: string
          name?: string
          description?: string | null
          original_file_url?: string
          xkt_file_url?: string
          lod_medium_url?: string | null
          lod_low_url?: string | null
          thumbnail_url?: string | null
          file_size_bytes?: number
          element_count?: number | null
          bounds?: Json | null
          floors?: Json | null
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      company_default_models: {
        Row: {
          id: string
          company_id: string
          project_type_config_id: string
          model_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          project_type_config_id: string
          model_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          project_type_config_id?: string
          model_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      default_marker_configs: {
        Row: {
          id: string
          default_model_id: string
          position_x: number
          position_y: number
          position_z: number
          normal_x: number
          normal_y: number
          normal_z: number
          floor_id: string | null
          floor_name: string | null
          element_id: string | null
          element_type: string | null
          title: string
          description: string | null
          type: string
          task_template_title: string | null
          phase_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          default_model_id: string
          position_x: number
          position_y: number
          position_z: number
          normal_x?: number
          normal_y?: number
          normal_z?: number
          floor_id?: string | null
          floor_name?: string | null
          element_id?: string | null
          element_type?: string | null
          title: string
          description?: string | null
          type: string
          task_template_title?: string | null
          phase_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          default_model_id?: string
          position_x?: number
          position_y?: number
          position_z?: number
          normal_x?: number
          normal_y?: number
          normal_z?: number
          floor_id?: string | null
          floor_name?: string | null
          element_id?: string | null
          element_type?: string | null
          title?: string
          description?: string | null
          type?: string
          task_template_title?: string | null
          phase_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Enums: {
      user_role: "gc_admin" | "project_manager" | "foreman" | "field_worker" | "subcontractor" | "client"
      member_status: "active" | "invited" | "inactive"
      project_type_old: "residential" | "restaurant_cafe" | "commercial_office" | "industrial" | "restaurant" | "cafe"
      project_status: "active" | "on_hold" | "completed" | "archived"
      phase_status: "not_started" | "in_progress" | "completed"
      task_type: "work" | "purchase" | "approval" | "admin"
      approval_status: "pending" | "approved" | "rejected" | "revision_requested"
      task_status: "todo" | "in_progress" | "review" | "blocked" | "completed"
      task_priority: "low" | "medium" | "high" | "critical"
      material_category: "lumber" | "concrete" | "electrical" | "plumbing" | "hvac" | "roofing" | "flooring" | "paint" | "hardware" | "tools" | "fixtures" | "insulation" | "drywall" | "doors_windows" | "landscaping" | "other"
      procurement_status: "needed" | "ordered" | "delivered" | "installed"
      purchaser_type: "gc" | "pm" | "subcontractor"
      expense_category: "materials" | "labor" | "equipment" | "permits" | "transportation" | "meals" | "lodging" | "other"
      expense_status: "submitted" | "under_review" | "approved" | "rejected" | "paid"
      spatial_processing_status: "pending" | "processing" | "ready" | "failed"
      spatial_marker_type: "issue" | "note" | "photo" | "inspection" | "rfi" | "safety" | "material" | "progress"
      spatial_marker_status: "open" | "in_progress" | "resolved" | "closed"
      marker_content_type: "photo" | "file" | "note" | "activity"
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
       