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
    // 그룹 생성 + owner 멤버 등록을 원자적으로 처리하는 SECURITY DEFINER RPC 사용.
    // (직접 INSERT 시 RETURNING 이 RLS SELECT 정책에 막혀 실패)
    const { data, error } = await (supabase.rpc as any)("create_group", {
      _name: name,
      _description: description,
    }).single();

    if (error || !data) {
      throw new Error(error?.message ?? "그룹 생성에 실패했습니다.");
    }

    const group = data as { id: string };
    await get().fetchGroups(ownerId);
    return get().groups.find((g) => g.id === group.id)!;
  },

  joinGroup: async (inviteCode, userId) => {
    // 비멤버도 초대 코드로 가입할 수 있도록 SECURITY DEFINER RPC 사용.
    // (groups SELECT 정책상 비멤버는 직접 조회 불가. 함수는 types/database 에
    //  포함돼 있지 않아 rpc 호출은 캐스팅으로 처리한다.)
    const { data, error } = await (supabase.rpc as any)("join_group_by_code", {
      _invite_code: inviteCode,
    }).single();

    if (error || !data) {
      if (error?.message?.includes("INVALID_CODE")) {
        throw new Error("초대 코드가 올바르지 않습니다.");
      }
      throw new Error(error?.message ?? "그룹 참여에 실패했습니다.");
    }

    const group = data as { id: string };
    await get().fetchGroups(userId);
    return get().groups.find((g) => g.id === group.id)!;
  },
}));
