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
      tasks: {
        Row: {
          id: string
          project_id: string
          phase_id: string | null
          title: string
          description: string | null
          task_type: Database["public"]["Enums"]["task_type"]
          status: Database["public"]["Enums"]["task_status"]
          priority: Database["public"]["Enums"]["task_priority"]
          assignee_id: string | null
          created_by: string | null
          start_date: string | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          phase_id?: string | null
          title: string
          description?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
          assignee_id?: string | null
          created_by?: string | null
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          phase_id?: string | null
          title?: string
          description?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
          assignee_id?: string | null
          created_by?: string | null
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          project_type: Database["public"]["Enums"]["project_type_old"]
          project_type_config_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          project_type?: Database["public"]["Enums"]["project_type_old"]
          project_type_config_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          project_type?: Database["public"]["Enums"]["project_type_old"]
          project_type_config_id?: string | null
          status?: string
          created_at?: string
        }
      }
    }
    Enums: {
      task_status: "todo" | "in_progress" | "review" | "blocked" | "completed"
      task_type: "work" | "purchase" | "approval" | "admin"
      task_priority: "low" | "medium" | "high" | "critical"
      project_type_old: "residential" | "restaurant_cafe" | "commercial_office" | "industrial" | "restaurant" | "cafe"
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]
