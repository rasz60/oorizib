import { View, Text, TouchableOpacity, Share, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGroupStore } from "@/stores/groupStore";

export default function InviteScreen() {
  const { activeGroup } = useGroupStore();
  const router = useRouter();

  const handleShare = async () => {
    if (!activeGroup) return;
    await Share.share({
      message: `Oorizib 앱에서 "${activeGroup.name}" 그룹에 참여하세요!\n초대 코드: ${activeGroup.inviteCode}`,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity className="mt-4 mb-8" onPress={() => router.back()}>
        <Text className="text-primary-600">← 뒤로</Text>
      </TouchableOpacity>
      <Text className="text-2xl font-bold text-gray-800 mb-4">가족 초대</Text>
      <Text className="text-gray-500 mb-8">
        아래 초대 코드를 가족에게 공유하세요.
      </Text>

      <View className="bg-primary-50 rounded-2xl p-8 items-center mb-8">
        <Text className="text-gray-500 text-sm mb-3">초대 코드</Text>
        <Text className="text-4xl font-bold text-primary-600 tracking-widest">
          {activeGroup?.inviteCode ?? "------"}
        </Text>
      </View>

      <TouchableOpacity
        className="bg-primary-600 rounded-xl py-4 items-center"
        onPress={handleShare}
      >
        <Text className="text-white font-semibold">초대 링크 공유하기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
