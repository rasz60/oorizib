export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          avatar_url: string | null;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          invite_code: string;
          owner_id: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["groups"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["group_members"]["Row"],
          "id" | "joined_at"
        >;
        Update: Partial<Database["public"]["Tables"]["group_members"]["Insert"]>;
      };
      schedules: {
        Row: {
          id: string;
          group_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          start_at: string;
          end_at: string | null;
          is_all_day: boolean;
          is_personal: boolean;
          color: string;
          remind_options: string[];
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["schedules"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["schedules"]["Insert"]>;
      };
      schedule_participants: {
        Row: {
          id: string;
          schedule_id: string;
          user_id: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["schedule_participants"]["Row"],
          "id"
        >;
        Update: never;
      };
      bank_accounts: {
        Row: {
          id: string;
          group_id: string;
          bank_code: string;
          bank_name: string;
          account_number_enc: string;
          fintechUseNum: string | null;
          access_token_enc: string | null;
          refresh_token_enc: string | null;
          alias: string;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["bank_accounts"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["bank_accounts"]["Insert"]
        >;
      };
      transactions: {
        Row: {
          id: string;
          group_id: string;
          bank_account_id: string | null;
          type: "income" | "expense";
          amount: number;
          description: string;
          merchant_name: string | null;
          category: string;
          tags: string[];
          transacted_at: string;
          is_manual: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["transactions"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["transactions"]["Insert"]
        >;
      };
      settlements: {
        Row: {
          id: string;
          group_id: string;
          requester_id: string;
          target_user_id: string;
          transaction_ids: string[];
          total_amount: number;
          status: "pending" | "sender_confirmed" | "completed" | "cancelled";
          sender_proof_url: string | null;
          requester_proof_url: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["settlements"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["settlements"]["Insert"]
        >;
      };
      wishlist_items: {
        Row: {
          id: string;
          group_id: string;
          creator_id: string;
          title: string;
          reason: string | null;
          estimated_price: number | null;
          link: string | null;
          vote_deadline: string | null;
          purchase_date: string | null;
          status: "voting" | "approved" | "rejected" | "purchased";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["wishlist_items"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["wishlist_items"]["Insert"]
        >;
      };
      wishlist_voters: {
        Row: {
          id: string;
          wishlist_item_id: string;
          user_id: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["wishlist_voters"]["Row"],
          "id"
        >;
        Update: never;
      };
      wishlist_votes: {
        Row: {
          id: string;
          wishlist_item_id: string;
          user_id: string;
          vote: "approve" | "reject";
          voted_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["wishlist_votes"]["Row"],
          "id" | "voted_at"
        >;
        Update: never;
      };
      stock_watchlist: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          symbol: string;
          name: string;
          market: "KR" | "US";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["stock_watchlist"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["stock_watchlist"]["Insert"]
        >;
      };
      my_stocks: {
        Row: {
          id: string;
          user_id: string;
          group_id: string;
          symbol: string;
          name: string;
          market: "KR" | "US";
          purchase_price: number;
          quantity: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["my_stocks"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["my_stocks"]["Insert"]
        >;
      };
      when_are_you_coming: {
        Row: {
          id: string;
          group_id: string;
          sender_id: string;
          receiver_id: string;
          expected_at: string | null;
          status: "pending" | "responded" | "arrived" | "missed";
          is_kept: boolean | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["when_are_you_coming"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["when_are_you_coming"]["Insert"]
        >;
      };
      did_you_do: {
        Row: {
          id: string;
          group_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          scheduled_date: string | null;
          scheduled_time: string | null;
          status: "pending" | "responded";
          response_check: boolean | null;
          response_memo: string | null;
          responded_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["did_you_do"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["did_you_do"]["Insert"]
        >;
      };
      what_to_eat: {
        Row: {
          id: string;
          group_id: string;
          creator_id: string;
          participant_ids: string[];
          meal_date: string;
          meal_type: "breakfast" | "lunch" | "dinner" | "latenight" | "snack";
          status: "collecting" | "tournament" | "done";
          winner: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["what_to_eat"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["what_to_eat"]["Insert"]
        >;
      };
      what_to_eat_entries: {
        Row: {
          id: string;
          what_to_eat_id: string;
          user_id: string;
          food_name: string;
          is_eliminated: boolean;
        };
        Insert: Omit<
          Database["public"]["Tables"]["what_to_eat_entries"]["Row"],
          "id"
        >;
        Update: Partial<
          Database["public"]["Tables"]["what_to_eat_entries"]["Insert"]
        >;
      };
      user_locations: {
        Row: {
          user_id: string;
          group_id: string;
          latitude: number;
          longitude: number;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["user_locations"]["Row"];
        Update: Partial<
          Database["public"]["Tables"]["user_locations"]["Row"]
        >;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
