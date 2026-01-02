export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
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
      chat_rooms: {
        Row: {
          id: string
          company_id: string
          project_id: string | null
          type: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          project_id?: string | null
          type: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          project_id?: string | null
          type?: string
          name?: string
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
          joined_at: string
          last_read_at: string | null
          muted_until: string | null
        }
        Insert: {
          id?: string
          chat_room_id: string
          user_id: string
          role?: string
          joined_at?: string
          last_read_at?: string | null
          muted_until?: string | null
        }
        Update: {
          id?: string
          chat_room_id?: string
          user_id?: string
          role?: string
          joined_at?: string
          last_read_at?: string | null
          muted_until?: string | null
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
          id: string
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
          role: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          role: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          role?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
