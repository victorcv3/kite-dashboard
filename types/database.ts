// Auto-generated Supabase types — run `npx supabase gen types` to regenerate
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          brand_color: string
          support_email: string | null
          booking_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          company_id: string
          role: 'admin' | 'company_owner' | 'company_user'
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      vapi_assistants: {
        Row: {
          id: string
          company_id: string
          vapi_assistant_id: string
          display_name: string
          is_active: boolean
          allowed_edit_fields: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vapi_assistants']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['vapi_assistants']['Insert']>
      }
      vapi_phone_numbers: {
        Row: {
          id: string
          company_id: string
          vapi_phone_number_id: string
          display_name: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vapi_phone_numbers']['Row'], 'id' | 'created_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['vapi_phone_numbers']['Insert']>
      }
      call_cache: {
        Row: {
          id: string
          company_id: string
          vapi_call_id: string
          data: Json
          cached_at: string
        }
        Insert: Omit<Database['public']['Tables']['call_cache']['Row'], 'id' | 'cached_at'> & { id?: string }
        Update: Partial<Database['public']['Tables']['call_cache']['Insert']>
      }
      client_settings: {
        Row: {
          company_id: string
          feature_flags: Json
          usage_limits: Json
          advanced_mode: boolean
        }
        Insert: Database['public']['Tables']['client_settings']['Row']
        Update: Partial<Database['public']['Tables']['client_settings']['Insert']>
      }
      invites: {
        Row: {
          id: string
          company_id: string
          email: string
          role: 'company_owner' | 'company_user'
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['invites']['Row'], 'id' | 'token' | 'expires_at' | 'created_at'> & { id?: string; token?: string }
        Update: Partial<Database['public']['Tables']['invites']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
