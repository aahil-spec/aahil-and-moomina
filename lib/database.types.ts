export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          created_at: string;
          host_id: string;
          host_name: string;
          video_url: string | null;
          is_active: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          host_id: string;
          host_name: string;
          video_url?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          host_id?: string;
          host_name?: string;
          video_url?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      room_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          display_name: string;
          joined_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          display_name: string;
          joined_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          display_name?: string;
          joined_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          display_name: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          display_name: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          display_name?: string;
          text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
  };
}