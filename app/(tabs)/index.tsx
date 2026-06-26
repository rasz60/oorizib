import { ComponentType, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ShoppingBag,
  ChartLineUp,
  Clock,
  CheckSquare,
  ForkKnife,
  Plus,
  SignOut,
  UsersThree,
  CaretDown,
  CalendarBlank,
  Wallet,
  Check,
  type IconProps,
} from "phosphor-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";

type Shortcut = {
  label: string;
  route: string;
  Icon: ComponentType<IconProps>;
  color: string;
  bg: string;
};

// 일정/가계부는 위젯으로 분리했으므로 바로가기에서 제외
const SHORTCUTS: Shortcut[] = [
  { label: "위시리스트", route: "/(tabs)/wishlist", Icon: ShoppingBag, color: "#db2777", bg: "bg-pink-50" },
  { label: "재테크", route: "/(tabs)/invest", Icon: ChartLineUp, color: "#ea580c", bg: "bg-orange-50" },
  { label: "언제와?", route: "/utility/when-coming", Icon: Clock, color: "#0891b2", bg: "bg-cyan-50" },
  { label: "했어?", route: "/utility/did-you-do", Icon: CheckSquare, color: "#7c3aed", bg: "bg-violet-50" },
  { label: "뭐먹지?", route: "/utility/what-to-eat", Icon: ForkKnife, color: "#d97706", bg: "bg-amber-50" },
];

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

export default function HomeScreen() {
  const { profile, signOut } = useAuthStore();
  const { activeGroup, groups, setActiveGroup } = useGroupStore();
  const router = useRouter();

  const [groupSheet, setGroupSheet] = useState(false);
  const [memberSheet, setMemberSheet] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const month = format(new Date(), "yyyy-MM");

  const { data: todaySchedules = [] } = useQuery({
    queryKey: ["home-schedules", activeGroup?.id, today],
    queryFn: async () => {
      if (!activeGroup) return [];
      const { data } = await supabase
        .from("schedules")
        .select("id, title, start_at, is_all_day, color")
        .eq("group_id", activeGroup.id)
        .gte("start_at", `${today}T00:00:00`)
        .lte("start_at", `${today}T23:59:59`)
        .order("start_at");
      return data ?? [];
    },
    enabled: !!activeGroup,
  });

  const { data: monthTx = [] } = useQuery({
    queryKey: ["home-finance", activeGroup?.id, month],
    queryFn: async () => {
      if (!activeGroup) return [];
      const { data } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("group_id", activeGroup.id)
        .gte("transacted_at", `${month}-01`)
        .lte("transacted_at", `${month}-31`);
      return data ?? [];
    },
    enabled: !!activeGroup,
  });

  const income = monthTx
    .filter((t: any) => t.type === "income")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const expense = monthTx
    .filter((t: any) => t.type === "expense")
    .reduce((s: number, t: any) => s + t.amount, 0);

  if (!activeGroup) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-20 h-20 rounded-full bg-primary-50 items-center justify-center mb-6">
            <UsersThree size={40} color="#4f46e5" weight="duotone" />
          </View>
          <Text className="text-xl font-bold text-gray-900 mb-2">
            아직 그룹이 없어요
          </Text>
          <Text className="text-gray-500 mb-8 text-center leading-5">
            가족 그룹을 만들거나{"\n"}초대 코드로 참여해보세요.
          </Text>
          <Button
            label="그룹 만들기"
            icon={<Plus size={18} color="#ffffff" weight="bold" />}
            onPress={() => router.push("/group/create")}
            className="mb-3"
          />
          <Button
            label="초대 코드로 참여"
            variant="outline"
            onPress={() => router.push("/group/join")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const members = activeGroup.members;
  const previewMembers = members.slice(0, 3);
  const extraCount = Math.max(0, members.length - 3);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View className="bg-primary-600 px-5 pt-4 pb-10 rounded-b-3xl">
          <View className="flex-row justify-between items-center mb-1">
            <TouchableOpacity
              className="flex-row items-center"
              activeOpacity={groups.length > 1 ? 0.7 : 1}
              onPress={() => groups.length > 1 && setGroupSheet(true)}
              hitSlop={8}
            >
              <Text className="text-white text-lg font-bold">
                {activeGroup.name}
              </Text>
              {groups.length > 1 && (
                <CaretDown size={16} color="#ffffff" weight="bold" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={signOut}
              className="flex-row items-center"
              hitSlop={8}
            >
              <SignOut size={16} color="#c7d2fe" />
              <Text className="text-primary-200 text-sm ml-1">로그아웃</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-primary-200 text-sm">
            안녕하세요, {profile?.displayName}님 👋
          </Text>
        </View>

        {/* 가족 멤버 위젯 — 타이틀 + 겹친 프로필 아이콘(최대 3) */}
        <TouchableOpacity
          className="mx-5 -mt-6 bg-white rounded-2xl p-5 shadow-sm mb-4 flex-row items-center justify-between"
          activeOpacity={0.8}
          onPress={() => setMemberSheet(true)}
        >
          <Text className="text-gray-900 font-semibold text-base">가족 멤버</Text>
          <View className="flex-row items-center">
            {previewMembers.map((m, i) => (
              <View
                key={m.id}
                className="w-9 h-9 rounded-full bg-primary-100 border-2 border-white items-center justify-center"
                style={{ marginLeft: i === 0 ? 0 : -10 }}
              >
                <Text className="text-primary-600 font-bold text-sm">
                  {m.profile.displayName[0]}
                </Text>
              </View>
            ))}
            {extraCount > 0 && (
              <View
                className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white items-center justify-center"
                style={{ marginLeft: -10 }}
              >
                <Text className="text-gray-500 font-bold text-xs">
                  +{extraCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* 일정 위젯 */}
        <TouchableOpacity
          className="mx-5 bg-white rounded-2xl p-5 shadow-sm mb-4"
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/calendar")}
        >
          <View className="flex-row items-center mb-3">
            <CalendarBlank size={16} color="#6b7280" weight="duotone" />
            <Text className="text-gray-500 text-xs ml-1.5 font-medium">
              오늘 일정
            </Text>
          </View>
          {todaySchedules.length === 0 ? (
            <Text className="text-gray-400 text-sm">오늘 등록된 일정이 없어요.</Text>
          ) : (
            todaySchedules.map((s: any) => (
              <View key={s.id} className="flex-row items-center mb-2 last:mb-0">
                <View
                  className="w-2 h-2 rounded-full mr-3"
                  style={{ backgroundColor: s.color ?? "#6366f1" }}
                />
                <Text className="text-gray-800 flex-1" numberOfLines={1}>
                  {s.title}
                </Text>
                <Text className="text-gray-400 text-sm ml-2">
                  {s.is_all_day ? "종일" : format(new Date(s.start_at), "HH:mm")}
                </Text>
              </View>
            ))
          )}
        </TouchableOpacity>

        {/* 가계부 위젯 */}
        <TouchableOpacity
          className="mx-5 bg-white rounded-2xl p-5 shadow-sm mb-4"
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/finance")}
        >
          <View className="flex-row items-center mb-3">
            <Wallet size={16} color="#6b7280" weight="duotone" />
            <Text className="text-gray-500 text-xs ml-1.5 font-medium">
              이번 달 가계부
            </Text>
          </View>
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-gray-400 text-xs mb-1">수입</Text>
              <Text className="text-green-600 font-bold text-base">
                {won(income)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-xs mb-1">지출</Text>
              <Text className="text-red-500 font-bold text-base">
                {won(expense)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 바로가기 */}
        <View className="mx-5 mb-8">
          <Text className="text-gray-500 text-xs mb-3 font-medium">바로가기</Text>
          <View className="flex-row flex-wrap justify-between">
            {SHORTCUTS.map(({ label, route, Icon, color, bg }) => (
              <TouchableOpacity
                key={label}
                className="bg-white rounded-2xl p-4 shadow-sm mb-3 items-center"
                style={{ width: "31.5%" }}
                onPress={() => router.push(route as any)}
              >
                <View
                  className={`w-11 h-11 rounded-full ${bg} items-center justify-center mb-2`}
                >
                  <Icon size={24} color={color} weight="duotone" />
                </View>
                <Text className="text-gray-700 text-xs font-medium">{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 그룹 전환 bottom sheet */}
      <BottomSheet
        visible={groupSheet}
        onClose={() => setGroupSheet(false)}
        title="그룹 선택"
      >
        {groups.map((g) => {
          const active = g.id === activeGroup.id;
          return (
            <TouchableOpacity
              key={g.id}
              className="flex-row items-center justify-between py-3"
              onPress={() => {
                setActiveGroup(g);
                setGroupSheet(false);
              }}
            >
              <Text
                className={`text-base ${
                  active ? "text-primary-600 font-bold" : "text-gray-800"
                }`}
              >
                {g.name}
              </Text>
              {active && <Check size={20} color="#4f46e5" weight="bold" />}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      {/* 가족 멤버 상세 bottom sheet */}
      <BottomSheet
        visible={memberSheet}
        onClose={() => setMemberSheet(false)}
        title={`가족 멤버 ${members.length}명`}
      >
        {members.map((m) => (
          <View key={m.id} className="flex-row items-center py-3">
            <View className="w-11 h-11 rounded-full bg-primary-100 items-center justify-center mr-3">
              <Text className="text-primary-600 font-bold text-base">
                {m.profile.displayName[0]}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold">
                {m.profile.displayName}
              </Text>
              <Text className="text-gray-400 text-sm">{m.profile.email}</Text>
            </View>
            {m.role === "owner" && (
              <View className="bg-primary-50 rounded-full px-2.5 py-1">
                <Text className="text-primary-600 text-xs font-medium">방장</Text>
              </View>
            )}
          </View>
        ))}
        <TouchableOpacity
          className="mt-3"
          onPress={() => {
            setMemberSheet(false);
            router.push("/group/invite");
          }}
        >
          <View className="flex-row items-center py-3">
            <View className="w-11 h-11 rounded-full bg-gray-100 items-center justify-center mr-3">
              <Plus size={20} color="#9ca3af" weight="bold" />
            </View>
            <Text className="text-gray-500 font-medium">가족 초대하기</Text>
          </View>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}
