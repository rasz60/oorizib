import { View, Text, Share } from "react-native";
import { ShareNetwork } from "phosphor-react-native";
import { useGroupStore } from "@/stores/groupStore";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";

export default function InviteScreen() {
  const { activeGroup } = useGroupStore();

  const handleShare = async () => {
    if (!activeGroup) return;
    await Share.share({
      message: `Oorizib 앱에서 "${activeGroup.name}" 그룹에 참여하세요!\n초대 코드: ${activeGroup.inviteCode}`,
    });
  };

  return (
    <Screen scroll bg="bg-white">
      <ScreenHeader title="가족 초대" />
      <Text className="text-gray-500 mb-8">
        아래 초대 코드를 가족에게 공유하세요.
      </Text>

      <View className="bg-primary-50 rounded-2xl p-8 items-center mb-8">
        <Text className="text-gray-500 text-sm mb-3">초대 코드</Text>
        <Text className="text-4xl font-bold text-primary-600 tracking-widest">
          {activeGroup?.inviteCode ?? "------"}
        </Text>
      </View>

      <Button
        label="초대 링크 공유하기"
        icon={<ShareNetwork size={18} color="#ffffff" weight="bold" />}
        onPress={handleShare}
      />
    </Screen>
  );
}
