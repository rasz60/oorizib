import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";

export default function HomeScreen() {
  const { profile, signOut } = useAuthStore();
  const { activeGroup, groups, setActiveGroup } = useGroupStore();
  const router = useRouter();

  if (!activeGroup) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-xl font-bold text-gray-800 mb-3">그룹이 없어요</Text>
        <Text className="text-gray-500 mb-8 text-center">
          가족 그룹을 만들거나 초대 코드로 참여하세요.
        </Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-3 px-8 mb-3 w-full items-center"
          onPress={() => router.push("/group/create")}
        >
          <Text className="text-white font-semibold">그룹 만들기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="border border-primary-600 rounded-xl py-3 px-8 w-full items-center"
          onPress={() => router.push("/group/join")}
        >
          <Text className="text-primary-600 font-semibold">초대 코드로 참여</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* 헤더 */}
        <View className="bg-primary-600 px-5 pt-4 pb-8">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-white text-lg font-bold">{activeGroup.name}</Text>
            <TouchableOpacity onPress={signOut}>
              <Text className="text-primary-200 text-sm">로그아웃</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-primary-200 text-sm">
            안녕하세요, {profile?.displayName}님 👋
          </Text>

          {/* 그룹 선택 */}
          {groups.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
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
        <View className="mx-4 -mt-4 bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="text-gray-500 text-xs mb-3">가족 멤버</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeGroup.members.map((m) => (
              <View key={m.id} className="items-center mr-4">
                <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mb-1">
                  <Text className="text-primary-600 font-bold text-lg">
                    {m.profile.displayName[0]}
                  </Text>
                </View>
                <Text className="text-xs text-gray-600">{m.profile.displayName}</Text>
              </View>
            ))}
            <TouchableOpacity
              className="items-center"
              onPress={() => router.push("/group/invite")}
            >
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-1">
                <Text className="text-gray-400 text-2xl">+</Text>
              </View>
              <Text className="text-xs text-gray-400">초대</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 바로가기 */}
        <View className="mx-4 mb-4">
          <Text className="text-gray-500 text-xs mb-3">바로가기</Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { label: "📅 일정", route: "/(tabs)/calendar" },
              { label: "💳 가계부", route: "/(tabs)/finance" },
              { label: "🛍️ 위시리스트", route: "/(tabs)/wishlist" },
              { label: "📈 재테크", route: "/(tabs)/invest" },
              { label: "🕐 언제와?", route: "/(tabs)/utility" },
              { label: "✅ 했어?", route: "/(tabs)/utility" },
              { label: "🍽️ 뭐먹지?", route: "/(tabs)/utility" },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                className="bg-white rounded-xl px-4 py-3 shadow-sm"
                onPress={() => router.push(item.route as any)}
              >
                <Text className="text-gray-700 text-sm">{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
