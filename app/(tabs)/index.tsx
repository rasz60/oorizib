import { ComponentType } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  CalendarBlank,
  Wallet,
  ShoppingBag,
  ChartLineUp,
  Clock,
  CheckSquare,
  ForkKnife,
  Plus,
  SignOut,
  UsersThree,
  type IconProps,
} from "phosphor-react-native";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { Button } from "@/components/ui/Button";

type Shortcut = {
  label: string;
  route: string;
  Icon: ComponentType<IconProps>;
  color: string;
  bg: string;
};

const SHORTCUTS: Shortcut[] = [
  { label: "일정", route: "/(tabs)/calendar", Icon: CalendarBlank, color: "#4f46e5", bg: "bg-primary-50" },
  { label: "가계부", route: "/(tabs)/finance", Icon: Wallet, color: "#16a34a", bg: "bg-green-50" },
  { label: "위시리스트", route: "/(tabs)/wishlist", Icon: ShoppingBag, color: "#db2777", bg: "bg-pink-50" },
  { label: "재테크", route: "/(tabs)/invest", Icon: ChartLineUp, color: "#ea580c", bg: "bg-orange-50" },
  { label: "언제와?", route: "/utility/when-coming", Icon: Clock, color: "#0891b2", bg: "bg-cyan-50" },
  { label: "했어?", route: "/utility/did-you-do", Icon: CheckSquare, color: "#7c3aed", bg: "bg-violet-50" },
  { label: "뭐먹지?", route: "/utility/what-to-eat", Icon: ForkKnife, color: "#d97706", bg: "bg-amber-50" },
];

export default function HomeScreen() {
  const { profile, signOut } = useAuthStore();
  const { activeGroup, groups, setActiveGroup } = useGroupStore();
  const router = useRouter();

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

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View className="bg-primary-600 px-5 pt-4 pb-10 rounded-b-3xl">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-white text-lg font-bold">
              {activeGroup.name}
            </Text>
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

          {groups.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
            >
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  className={`mr-2 px-3 py-1 rounded-full ${
                    g.id === activeGroup.id ? "bg-white" : "bg-primary-500"
                  }`}
                  onPress={() => setActiveGroup(g)}
                >
                  <Text
                    className={`text-xs font-medium ${
                      g.id === activeGroup.id ? "text-primary-600" : "text-white"
                    }`}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 멤버 */}
        <View className="mx-5 -mt-6 bg-white rounded-2xl p-5 shadow-sm mb-5">
          <Text className="text-gray-500 text-xs mb-3 font-medium">가족 멤버</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeGroup.members.map((m) => (
              <View key={m.id} className="items-center mr-4">
                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mb-1">
                  <Text className="text-primary-600 font-bold text-lg">
                    {m.profile.displayName[0]}
                  </Text>
                </View>
                <Text className="text-xs text-gray-600">
                  {m.profile.displayName}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              className="items-center"
              onPress={() => router.push("/group/invite")}
            >
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-1">
                <Plus size={22} color="#9ca3af" weight="bold" />
              </View>
              <Text className="text-xs text-gray-400">초대</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

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
    </SafeAreaView>
  );
}
