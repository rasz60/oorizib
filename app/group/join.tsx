import { useState } from "react";
import { Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";

export default function JoinGroupScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { joinGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const feedback = useFeedback();

  const handleJoin = async () => {
    if (!code.trim() || !profile) return;
    setLoading(true);
    try {
      await joinGroup(code.toUpperCase(), profile.id);
      feedback.show({
        type: "success",
        title: "그룹에 참여했어요",
        message: "이제 가족과 함께 사용할 수 있어요!",
        onConfirm: () => router.replace("/(tabs)"),
      });
    } catch (e: any) {
      feedback.show({
        type: "error",
        title: "참여 실패",
        message: e.message ?? "초대 코드를 다시 확인해주세요.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll bg="bg-white">
      <ScreenHeader title="초대 코드로 참여" />
      <Text className="text-gray-500 mb-8">
        가족에게 초대 코드를 받아 입력하세요.
      </Text>

      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 mb-8 text-gray-800 text-center text-2xl tracking-widest"
        placeholder="XXXXXX"
        placeholderTextColor="#9ca3af"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        maxLength={6}
        autoCapitalize="characters"
      />

      <Button
        label="참여하기"
        loading={loading}
        disabled={code.length < 6}
        onPress={handleJoin}
      />
    </Screen>
  );
}
