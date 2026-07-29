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
      clubs: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      club_members: {
        Row: {
          id: string;
          club_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["club_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["club_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["club_role"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          age_group: string;
          gender: Database["public"]["Enums"]["team_gender"];
          home_ground: string;
          head_coach_name: string;
          season_label: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          age_group: string;
          gender: Database["public"]["Enums"]["team_gender"];
          home_ground: string;
          head_coach_name: string;
          season_label: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          age_group?: string;
          gender?: Database["public"]["Enums"]["team_gender"];
          home_ground?: string;
          head_coach_name?: string;
          season_label?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["team_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["team_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["team_role"];
          created_at?: string;
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
      players: {
        Row: {
          id: string;
          club_id: string;
          user_id: string | null;
          first_name: string;
          last_name: string;
          position: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id?: string | null;
          first_name: string;
          last_name: string;
          position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          user_id?: string | null;
          first_name?: string;
          last_name?: string;
          position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "players_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      player_contacts: {
        Row: {
          player_id: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          medical_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          player_id?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_contacts_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: true;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      player_guardians: {
        Row: {
          id: string;
          player_id: string;
          guardian_id: string;
          relationship: Database["public"]["Enums"]["guardian_relationship"];
          legal_guardian: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          guardian_id: string;
          relationship: Database["public"]["Enums"]["guardian_relationship"];
          legal_guardian?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          guardian_id?: string;
          relationship?: Database["public"]["Enums"]["guardian_relationship"];
          legal_guardian?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_guardians_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "player_guardians_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "guardians";
            referencedColumns: ["id"];
          },
        ];
      };
      guardians: {
        Row: {
          id: string;
          club_id: string;
          user_id: string | null;
          first_name: string;
          second_name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          user_id?: string | null;
          first_name: string;
          second_name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          user_id?: string | null;
          first_name?: string;
          second_name?: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "guardians_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      team_players: {
        Row: {
          id: string;
          team_id: string;
          player_id: string;
          shirt_number: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          player_id: string;
          shirt_number?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          player_id?: string;
          shirt_number?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_players_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      coaches: {
        Row: {
          id: string;
          club_id: string;
          first_name: string;
          second_name: string;
          joined_date: string;
          dbs_checked: boolean;
          fa_level_1: boolean;
          fa_level_2: boolean;
          phone: string | null;
          email: string | null;
          notes: string | null;
          biography: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          first_name: string;
          second_name: string;
          joined_date: string;
          dbs_checked?: boolean;
          fa_level_1?: boolean;
          fa_level_2?: boolean;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          biography?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          first_name?: string;
          second_name?: string;
          joined_date?: string;
          dbs_checked?: boolean;
          fa_level_1?: boolean;
          fa_level_2?: boolean;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          biography?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coaches_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      team_coaches: {
        Row: {
          id: string;
          team_id: string;
          coach_id: string;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          coach_id: string;
          role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          coach_id?: string;
          role?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_coaches_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_coaches_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
        ];
      };
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
          player_of_the_match_id: string | null;
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
          player_of_the_match_id?: string | null;
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
          player_of_the_match_id?: string | null;
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
          {
            foreignKeyName: "matches_player_of_the_match_id_fkey";
            columns: ["player_of_the_match_id"];
            isOneToOne: false;
            referencedRelation: "players";
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_club_management: { Args: { p_club_id: string }; Returns: boolean };
      is_club_staff: { Args: { p_club_id: string }; Returns: boolean };
      can_edit_team: { Args: { p_team_id: string }; Returns: boolean };
      can_read_team: { Args: { p_team_id: string }; Returns: boolean };
      can_edit_player: { Args: { p_player_id: string }; Returns: boolean };
      can_read_player: { Args: { p_player_id: string }; Returns: boolean };
      can_view_player_contact: {
        Args: { p_player_id: string };
        Returns: boolean;
      };
      has_app_access: { Args: Record<string, never>; Returns: boolean };
      create_club_with_management: {
        Args: { p_name: string };
        Returns: Database["public"]["Tables"]["clubs"]["Row"];
      };
    };
    Enums: {
      club_role: "management";
      team_role: "coach" | "guardian" | "player";
      guardian_relationship:
        "dad" | "mum" | "guardian" | "football_contact" | "other";
      competition_kind: "league" | "cup" | "friendly" | "tournament" | "other";
      match_status: "scheduled" | "played" | "postponed" | "cancelled";
      match_venue: "home" | "away" | "neutral";
      team_gender: "boys" | "girls" | "mixed";
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

export type Club = Tables<"clubs">;
export type ClubMember = Tables<"club_members">;
export type Team = Tables<"teams">;
export type TeamMember = Tables<"team_members">;
export type Player = Tables<"players">;
export type PlayerContact = Tables<"player_contacts">;
export type PlayerGuardian = Tables<"player_guardians">;
export type Guardian = Tables<"guardians">;
export type TeamPlayer = Tables<"team_players">;
export type Competition = Tables<"competitions">;
export type Coach = Tables<"coaches">;
export type TeamCoach = Tables<"team_coaches">;
export type Match = Tables<"matches">;
export type Goal = Tables<"goals">;

export type ClubRole = Enums<"club_role">;
export type TeamRole = Enums<"team_role">;
export type GuardianRelationship = Enums<"guardian_relationship">;
export type TeamGender = Enums<"team_gender">;
export type CompetitionKind = Enums<"competition_kind">;
export type MatchVenue = Enums<"match_venue">;
export type MatchStatus = Enums<"match_status">;
