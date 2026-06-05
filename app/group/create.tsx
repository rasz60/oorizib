import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";

export default function CreateGroupScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { createGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim() || !profile) return;
    setLoading(true);
    try {
      await createGroup(name, description, profile.id);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("오류", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity className="mt-4 mb-8" onPress={() => router.back()}>
        <Text className="text-primary-600">← 뒤로</Text>
      </TouchableOpacity>
      <Text className="text-2xl font-bold text-gray-800 mb-8">그룹 만들기</Text>

      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
        placeholder="그룹 이름 (예: 우리 가족)"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 mb-8 text-gray-800"
        placeholder="설명 (선택사항)"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity
        className="bg-primary-600 rounded-xl py-4 items-center"
        onPress={handleCreate}
        disabled={loading || !name.trim()}
      >
        <Text className="text-white font-semibold">
          {loading ? "생성 중..." : "그룹 만들기"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
