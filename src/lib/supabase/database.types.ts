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
          website: string | null;
          email: string | null;
          phone: string | null;
          icon_url: string | null;
          colour: string | null;
          established: number | null;
          about: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          icon_url?: string | null;
          colour?: string | null;
          established?: number | null;
          about?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          website?: string | null;
          email?: string | null;
          phone?: string | null;
          icon_url?: string | null;
          colour?: string | null;
          established?: number | null;
          about?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      managers: {
        Row: {
          id: string;
          club_id: string;
          person_id: string;
          active_role: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          person_id: string;
          active_role?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          person_id?: string;
          active_role?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "managers_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "managers_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
        ];
      };
      people: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          auth_user_id: string | null;
          account_status: Database["public"]["Enums"]["person_account_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          auth_user_id?: string | null;
          account_status?: Database["public"]["Enums"]["person_account_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          auth_user_id?: string | null;
          account_status?: Database["public"]["Enums"]["person_account_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      person_invitations: {
        Row: {
          id: string;
          person_id: string;
          email: string;
          token_hash: string;
          expires_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          email: string;
          token_hash: string;
          expires_at: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          email?: string;
          token_hash?: string;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "person_invitations_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
            referencedColumns: ["id"];
          },
        ];
      };
      people_migration_conflicts: {
        Row: {
          id: string;
          source_table: string;
          source_id: string;
          conflict_type: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_table: string;
          source_id: string;
          conflict_type: string;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_table?: string;
          source_id?: string;
          conflict_type?: string;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          address_line1: string | null;
          address_line2: string | null;
          town_city: string | null;
          postcode: string | null;
          surface: Database["public"]["Enums"]["venue_surface"][];
          parking: Database["public"]["Enums"]["venue_parking"];
          food_and_drink: Database["public"]["Enums"]["venue_food_and_drink"][];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          address_line1?: string | null;
          address_line2?: string | null;
          town_city?: string | null;
          postcode?: string | null;
          surface?: Database["public"]["Enums"]["venue_surface"][];
          parking?: Database["public"]["Enums"]["venue_parking"];
          food_and_drink?: Database["public"]["Enums"]["venue_food_and_drink"][];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          address_line1?: string | null;
          address_line2?: string | null;
          town_city?: string | null;
          postcode?: string | null;
          surface?: Database["public"]["Enums"]["venue_surface"][];
          parking?: Database["public"]["Enums"]["venue_parking"];
          food_and_drink?: Database["public"]["Enums"]["venue_food_and_drink"][];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venues_club_id_fkey";
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
          home_venue_id: string | null;
          training_venue_id: string | null;
          training_days: string[] | null;
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
          home_venue_id?: string | null;
          training_venue_id?: string | null;
          training_days?: string[] | null;
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
          home_venue_id?: string | null;
          training_venue_id?: string | null;
          training_days?: string[] | null;
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
          {
            foreignKeyName: "teams_home_venue_id_fkey";
            columns: ["home_venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_training_venue_id_fkey";
            columns: ["training_venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
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
          person_id: string;
          active_role: boolean;
          position: string | null;
          school: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          person_id: string;
          active_role?: boolean;
          position?: string | null;
          school?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          person_id?: string;
          active_role?: boolean;
          position?: string | null;
          school?: string | null;
          date_of_birth?: string | null;
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
          {
            foreignKeyName: "players_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
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
          emergency_guardian_id: string | null;
          medical_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          player_id: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          emergency_guardian_id?: string | null;
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          player_id?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          emergency_guardian_id?: string | null;
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
          {
            foreignKeyName: "player_contacts_emergency_guardian_id_fkey";
            columns: ["emergency_guardian_id"];
            isOneToOne: false;
            referencedRelation: "guardians";
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
          emergency_contact: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          guardian_id: string;
          relationship: Database["public"]["Enums"]["guardian_relationship"];
          legal_guardian?: boolean;
          emergency_contact?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          guardian_id?: string;
          relationship?: Database["public"]["Enums"]["guardian_relationship"];
          legal_guardian?: boolean;
          emergency_contact?: boolean;
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
          person_id: string;
          active_role: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          person_id: string;
          active_role?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          person_id?: string;
          active_role?: boolean;
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
          {
            foreignKeyName: "guardians_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
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
          person_id: string;
          active_role: boolean;
          joined_date: string;
          date_of_birth: string | null;
          dbs_checked: boolean;
          fa_level_1: boolean;
          fa_level_2: boolean;
          notes: string | null;
          biography: string | null;
          philosophy: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          person_id: string;
          active_role?: boolean;
          joined_date: string;
          date_of_birth?: string | null;
          dbs_checked?: boolean;
          fa_level_1?: boolean;
          fa_level_2?: boolean;
          notes?: string | null;
          biography?: string | null;
          philosophy?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          person_id?: string;
          active_role?: boolean;
          joined_date?: string;
          date_of_birth?: string | null;
          dbs_checked?: boolean;
          fa_level_1?: boolean;
          fa_level_2?: boolean;
          notes?: string | null;
          biography?: string | null;
          philosophy?: string | null;
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
          {
            foreignKeyName: "coaches_person_id_fkey";
            columns: ["person_id"];
            isOneToOne: false;
            referencedRelation: "people";
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
          age_group: string | null;
          created_at: string;
          gender: Database["public"]["Enums"]["competition_gender"] | null;
          id: string;
          kind: Database["public"]["Enums"]["competition_kind"] | null;
          knockout: boolean;
          minutes_per_period: number | null;
          name: string;
          notes: string | null;
          periods: Database["public"]["Enums"]["competition_periods"];
          players_per_team: number | null;
          season: string | null;
          team_id: string;
        };
        Insert: {
          age_group?: string | null;
          created_at?: string;
          gender?: Database["public"]["Enums"]["competition_gender"] | null;
          id?: string;
          kind?: Database["public"]["Enums"]["competition_kind"] | null;
          knockout?: boolean;
          minutes_per_period?: number | null;
          name: string;
          notes?: string | null;
          periods?: Database["public"]["Enums"]["competition_periods"];
          players_per_team?: number | null;
          season?: string | null;
          team_id: string;
        };
        Update: {
          age_group?: string | null;
          created_at?: string;
          gender?: Database["public"]["Enums"]["competition_gender"] | null;
          id?: string;
          kind?: Database["public"]["Enums"]["competition_kind"] | null;
          knockout?: boolean;
          minutes_per_period?: number | null;
          name?: string;
          notes?: string | null;
          periods?: Database["public"]["Enums"]["competition_periods"];
          players_per_team?: number | null;
          season?: string | null;
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
          id: string;
          kickoff_time: string | null;
          notes: string | null;
          club_notes: string | null;
          opponent_name: string;
          player_of_the_match_id: string | null;
          players_player_of_the_match_id: string | null;
          status: Database["public"]["Enums"]["match_status"];
          team_id: string;
          updated_at: string;
          home_away: Database["public"]["Enums"]["match_home_away"];
          venue_id: string | null;
        };
        Insert: {
          competition_id?: string | null;
          created_at?: string;
          date: string;
          id?: string;
          kickoff_time?: string | null;
          notes?: string | null;
          club_notes?: string | null;
          opponent_name: string;
          player_of_the_match_id?: string | null;
          players_player_of_the_match_id?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          team_id: string;
          updated_at?: string;
          home_away: Database["public"]["Enums"]["match_home_away"];
          venue_id?: string | null;
        };
        Update: {
          competition_id?: string | null;
          created_at?: string;
          date?: string;
          id?: string;
          kickoff_time?: string | null;
          notes?: string | null;
          club_notes?: string | null;
          opponent_name?: string;
          player_of_the_match_id?: string | null;
          players_player_of_the_match_id?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          team_id?: string;
          updated_at?: string;
          home_away?: Database["public"]["Enums"]["match_home_away"];
          venue_id?: string | null;
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
          {
            foreignKeyName: "matches_players_player_of_the_match_id_fkey";
            columns: ["players_player_of_the_match_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
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
          is_opposition: boolean;
          is_own_goal: boolean;
          is_penalty: boolean;
          match_id: string;
          minute: number | null;
          period: string | null;
          period_id: string | null;
          player_id: string | null;
        };
        Insert: {
          assist_player_id?: string | null;
          created_at?: string;
          from_setpiece?: boolean;
          id?: string;
          is_freekick?: boolean;
          is_opposition?: boolean;
          is_own_goal?: boolean;
          is_penalty?: boolean;
          match_id: string;
          minute?: number | null;
          period?: string | null;
          period_id?: string | null;
          player_id?: string | null;
        };
        Update: {
          assist_player_id?: string | null;
          created_at?: string;
          from_setpiece?: boolean;
          id?: string;
          is_freekick?: boolean;
          is_opposition?: boolean;
          is_own_goal?: boolean;
          is_penalty?: boolean;
          match_id?: string;
          minute?: number | null;
          period?: string | null;
          period_id?: string | null;
          player_id?: string | null;
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
            foreignKeyName: "goals_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "match_periods";
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
      match_players: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_players_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      match_periods: {
        Row: {
          id: string;
          match_id: string;
          name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_periods_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };
      match_period_starters: {
        Row: {
          id: string;
          period_id: string;
          player_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          period_id: string;
          player_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          period_id?: string;
          player_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_period_starters_period_id_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "match_periods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_period_starters_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      cards: {
        Row: {
          id: string;
          match_id: string;
          player_id: string | null;
          coach_id: string | null;
          guardian_id: string | null;
          type: Database["public"]["Enums"]["card_type"];
          coach_notes: string | null;
          referee_notes: string | null;
          club_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id?: string | null;
          coach_id?: string | null;
          guardian_id?: string | null;
          type: Database["public"]["Enums"]["card_type"];
          coach_notes?: string | null;
          referee_notes?: string | null;
          club_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string | null;
          coach_id?: string | null;
          guardian_id?: string | null;
          type?: Database["public"]["Enums"]["card_type"];
          coach_notes?: string | null;
          referee_notes?: string | null;
          club_notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cards_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "guardians";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_development_objectives: {
        Row: {
          id: string;
          coach_id: string;
          body: string;
          objective_type: Database["public"]["Enums"]["coach_objective_type"];
          target_date: string | null;
          status: Database["public"]["Enums"]["coach_objective_status"];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          body: string;
          objective_type?: Database["public"]["Enums"]["coach_objective_type"];
          target_date?: string | null;
          status?: Database["public"]["Enums"]["coach_objective_status"];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          body?: string;
          objective_type?: Database["public"]["Enums"]["coach_objective_type"];
          target_date?: string | null;
          status?: Database["public"]["Enums"]["coach_objective_status"];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "coach_development_objectives_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "coaches";
            referencedColumns: ["id"];
          },
        ];
      };
      player_development_objectives: {
        Row: {
          id: string;
          player_id: string;
          body: string;
          objective_type: Database["public"]["Enums"]["player_objective_type"];
          status: Database["public"]["Enums"]["player_objective_status"];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          body: string;
          objective_type?: Database["public"]["Enums"]["player_objective_type"];
          status?: Database["public"]["Enums"]["player_objective_status"];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          body?: string;
          objective_type?: Database["public"]["Enums"]["player_objective_type"];
          status?: Database["public"]["Enums"]["player_objective_status"];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "player_development_objectives_player_id_fkey";
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
      can_edit_match_goals: { Args: { p_team_id: string }; Returns: boolean };
      can_read_team: { Args: { p_team_id: string }; Returns: boolean };
      can_edit_player: { Args: { p_player_id: string }; Returns: boolean };
      can_read_player: { Args: { p_player_id: string }; Returns: boolean };
      can_view_player_contact: {
        Args: { p_player_id: string };
        Returns: boolean;
      };
      has_app_access: { Args: Record<string, never>; Returns: boolean };
      person_auth_user_id: { Args: { p_person_id: string }; Returns: string };
      player_auth_user_id: { Args: { p_player_id: string }; Returns: string };
      guardian_auth_user_id: {
        Args: { p_guardian_id: string };
        Returns: string;
      };
      can_manage_any_club: { Args: Record<string, never>; Returns: boolean };
      create_club_with_management: {
        Args: { p_name: string };
        Returns: Database["public"]["Tables"]["clubs"]["Row"];
      };
    };
    Enums: {
      person_account_status: "none" | "invited" | "active" | "disabled";
      team_role:
        "management" | "coach" | "guardian" | "guardian_assistant" | "player";
      guardian_relationship:
        "parent" | "guardian" | "football_contact" | "other";
      competition_kind: "league" | "cup" | "friendly" | "tournament" | "other";
      competition_gender: "female" | "male" | "mixed";
      competition_periods: "1" | "2" | "4" | "other";
      match_status:
        "scheduled" | "played" | "in_progress" | "postponed" | "cancelled";
      match_home_away: "home" | "away" | "neutral";
      team_gender: "boys" | "girls" | "mixed";
      card_type: "yellow_1st" | "yellow_2nd" | "red" | "timeout" | "other";
      venue_surface:
        "astro" | "grass" | "hard_court" | "indoor" | "varies" | "unknown";
      venue_parking:
        | "usually_fine"
        | "weekend_parking"
        | "paid_parking"
        | "no_parking"
        | "unknown";
      venue_food_and_drink:
        | "bbq"
        | "cafe"
        | "tuck_shop"
        | "local_outlets"
        | "ice_cream_van"
        | "bar"
        | "toilets"
        | "rain_shelter";
      coach_objective_type:
        "coaching" | "communications" | "time_management" | "admin" | "other";
      coach_objective_status:
        "in_progress" | "ready_for_review" | "complete" | "deferred";
      player_objective_type:
        | "skills"
        | "confidence"
        | "team_work"
        | "positional"
        | "following_coaching"
        | "other";
      player_objective_status:
        "emerging" | "expected" | "exceeding" | "complete";
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
export type Person = Tables<"people">;
export type PersonInvitation = Tables<"person_invitations">;
export type Manager = Tables<"managers">;
export type Venue = Tables<"venues">;
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
export type MatchPlayer = Tables<"match_players">;
export type MatchPeriod = Tables<"match_periods">;
export type MatchPeriodStarter = Tables<"match_period_starters">;
export type Goal = Tables<"goals">;
export type Card = Tables<"cards">;
export type CoachDevelopmentObjective = Tables<"coach_development_objectives">;
export type PlayerDevelopmentObjective =
  Tables<"player_development_objectives">;

export type PersonAccountStatus = Enums<"person_account_status">;

export type TeamRole = Enums<"team_role">;
export type GuardianRelationship = Enums<"guardian_relationship">;
export type TeamGender = Enums<"team_gender">;
export type CompetitionKind = Enums<"competition_kind">;
export type CompetitionGender = Enums<"competition_gender">;
export type CompetitionPeriods = Enums<"competition_periods">;
export type MatchHomeAway = Enums<"match_home_away">;
export type MatchStatus = Enums<"match_status">;
export type CardType = Enums<"card_type">;
export type VenueSurface = Enums<"venue_surface">;
export type VenueParking = Enums<"venue_parking">;
export type VenueFoodAndDrink = Enums<"venue_food_and_drink">;
export type CoachObjectiveType = Enums<"coach_objective_type">;
export type CoachObjectiveStatus = Enums<"coach_objective_status">;
export type PlayerObjectiveType = Enums<"player_objective_type">;
export type PlayerObjectiveStatus = Enums<"player_objective_status">;
