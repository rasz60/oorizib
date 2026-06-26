import { useState } from "react";
import { Text, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";

export default function CreateGroupScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { createGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const feedback = useFeedback();

  const handleCreate = async () => {
    if (!name.trim() || !profile) return;
    setLoading(true);
    try {
      await createGroup(name, description, profile.id);
      feedback.show({
        type: "success",
        title: "그룹이 만들어졌어요",
        message: `"${name.trim()}" 그룹을 시작할게요!`,
        onConfirm: () => router.replace("/(tabs)"),
      });
    } catch (e: any) {
      feedback.show({ type: "error", title: "오류", message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll bg="bg-white">
      <ScreenHeader title="그룹 만들기" />
      <Text className="text-gray-500 mb-8">
        가족이 함께 쓸 공간의 이름을 정해주세요.
      </Text>

      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
        placeholder="그룹 이름 (예: 우리 가족)"
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 mb-8 text-gray-800"
        placeholder="설명 (선택사항)"
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button
        label="그룹 만들기"
        loading={loading}
        disabled={!name.trim()}
        onPress={handleCreate}
      />
    </Screen>
  );
}
