import { create } from "zustand";
import { Group } from "@/types";
import { supabase } from "@/lib/supabase";

interface GroupState {
  groups: Group[];
  activeGroup: Group | null;
  setActiveGroup: (group: Group) => void;
  fetchGroups: (userId: string) => Promise<void>;
  createGroup: (name: string, description: string, ownerId: string) => Promise<Group>;
  joinGroup: (inviteCode: string, userId: string) => Promise<Group>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroup: null,

  setActiveGroup: (group) => set({ activeGroup: group }),

  fetchGroups: async (userId) => {
    const { data } = await supabase
      .from("group_members")
      .select(`
        group_id,
        role,
        groups (
          id, name, description, invite_code, owner_id, created_at
        ),
        profiles!group_members_user_id_fkey (
          id, display_name, avatar_url, push_token, email
        )
      `)
      .eq("user_id", userId);

    if (!data) return;

    const groups: Group[] = [];
    const seen = new Set<string>();

    for (const row of data) {
      const g = row.groups as any;
      if (!g || seen.has(g.id)) continue;
      seen.add(g.id);

      const { data: members } = await supabase
        .from("group_members")
        .select("*, profiles!group_members_user_id_fkey(*)")
        .eq("group_id", g.id);

      groups.push({
        id: g.id,
        name: g.name,
        description: g.description,
        inviteCode: g.invite_code,
        ownerId: g.owner_id,
        members: (members ?? []).map((m: any) => ({
          id: m.id,
          groupId: m.group_id,
          userId: m.user_id,
          role: m.role,
          profile: {
            id: m.profiles.id,
            email: m.profiles.email,
            displayName: m.profiles.display_name,
            avatarUrl: m.profiles.avatar_url,
            pushToken: m.profiles.push_token,
          },
        })),
      });
    }

    set({ groups, activeGroup: get().activeGroup ?? groups[0] ?? null });
  },

  createGroup: async (name, description, ownerId) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name, description, invite_code: inviteCode, owner_id: ownerId })
      .select()
      .single();

    if (error || !group) throw error;

    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: ownerId,
      role: "owner",
    });

    await get().fetchGroups(ownerId);
    return get().groups.find((g) => g.id === group.id)!;
  },

  joinGroup: async (inviteCode, userId) => {
    const { data: group, error } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", inviteCode)
      .single();

    if (error || !group) throw new Error("초대 코드가 올바르지 않습니다.");

    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: userId,
      role: "member",
    });

    await get().fetchGroups(userId);
    return get().groups.find((g) => g.id === group.id)!;
  },
}));
