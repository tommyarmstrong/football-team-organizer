export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      competitions: {
        Row: {
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["competition_kind"] | null;
          name: string;
          team_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["competition_kind"] | null;
          name: string;
          team_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["competition_kind"] | null;
          name?: string;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competitions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          assist_player_id: string | null;
          created_at: string;
          from_setpiece: boolean;
          id: string;
          is_freekick: boolean;
          is_penalty: boolean;
          match_id: string;
          minute: number | null;
          period: string | null;
          player_id: string;
        };
        Insert: {
          assist_player_id?: string | null;
          created_at?: string;
          from_setpiece?: boolean;
          id?: string;
          is_freekick?: boolean;
          is_penalty?: boolean;
          match_id: string;
          minute?: number | null;
          period?: string | null;
          player_id: string;
        };
        Update: {
          assist_player_id?: string | null;
          created_at?: string;
          from_setpiece?: boolean;
          id?: string;
          is_freekick?: boolean;
          is_penalty?: boolean;
          match_id?: string;
          minute?: number | null;
          period?: string | null;
          player_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_assist_player_id_fkey";
            columns: ["assist_player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goals_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goals_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          competition_id: string | null;
          created_at: string;
          date: string;
          goals_against: number | null;
          goals_for: number | null;
          id: string;
          kickoff_time: string | null;
          notes: string | null;
          opponent_name: string;
          status: Database["public"]["Enums"]["match_status"];
          team_id: string;
          updated_at: string;
          venue: Database["public"]["Enums"]["match_venue"];
        };
        Insert: {
          competition_id?: string | null;
          created_at?: string;
          date: string;
          goals_against?: number | null;
          goals_for?: number | null;
          id?: string;
          kickoff_time?: string | null;
          notes?: string | null;
          opponent_name: string;
          status?: Database["public"]["Enums"]["match_status"];
          team_id: string;
          updated_at?: string;
          venue: Database["public"]["Enums"]["match_venue"];
        };
        Update: {
          competition_id?: string | null;
          created_at?: string;
          date?: string;
          goals_against?: number | null;
          goals_for?: number | null;
          id?: string;
          kickoff_time?: string | null;
          notes?: string | null;
          opponent_name?: string;
          status?: Database["public"]["Enums"]["match_status"];
          team_id?: string;
          updated_at?: string;
          venue?: Database["public"]["Enums"]["match_venue"];
        };
        Relationships: [
          {
            foreignKeyName: "matches_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      players: {
        Row: {
          active: boolean;
          created_at: string;
          first_name: string;
          id: string;
          last_name: string;
          position: string | null;
          shirt_number: number | null;
          team_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          first_name: string;
          id?: string;
          last_name: string;
          position?: string | null;
          shirt_number?: number | null;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          position?: string | null;
          shirt_number?: number | null;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["team_member_role"];
          team_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["team_member_role"];
          team_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["team_member_role"];
          team_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          age_group: string;
          club: string;
          created_at: string;
          gender: Database["public"]["Enums"]["team_gender"];
          head_coach_name: string;
          home_ground: string;
          id: string;
          name: string;
          season_label: string;
          updated_at: string;
        };
        Insert: {
          age_group: string;
          club: string;
          created_at?: string;
          gender: Database["public"]["Enums"]["team_gender"];
          head_coach_name: string;
          home_ground: string;
          id?: string;
          name: string;
          season_label: string;
          updated_at?: string;
        };
        Update: {
          age_group?: string;
          club?: string;
          created_at?: string;
          gender?: Database["public"]["Enums"]["team_gender"];
          head_coach_name?: string;
          home_ground?: string;
          id?: string;
          name?: string;
          season_label?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_team_member: {
        Args: { p_team_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      competition_kind: "league" | "cup" | "friendly" | "tournament" | "other";
      match_status: "scheduled" | "played" | "postponed" | "cancelled";
      match_venue: "home" | "away" | "neutral";
      team_gender: "boys" | "girls" | "mixed";
      team_member_role: "coach" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Team = Tables<"teams">;
export type TeamMember = Tables<"team_members">;
export type Competition = Tables<"competitions">;
export type Player = Tables<"players">;
export type Match = Tables<"matches">;
export type Goal = Tables<"goals">;

export type TeamGender = Enums<"team_gender">;
export type CompetitionKind = Enums<"competition_kind">;
export type MatchVenue = Enums<"match_venue">;
export type MatchStatus = Enums<"match_status">;
export type TeamMemberRole = Enums<"team_member_role">;
