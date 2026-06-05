import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,

  setSession: (session) => set({ session, isLoading: false }),

  setProfile: (profile) => set({ profile }),

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      set({
        profile: {
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          pushToken: data.push_token,
        },
      });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
