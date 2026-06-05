import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";

export default function JoinGroupScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { joinGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();

  const handleJoin = async () => {
    if (!code.trim() || !profile) return;
    setLoading(true);
    try {
      await joinGroup(code.toUpperCase(), profile.id);
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
      <Text className="text-2xl font-bold text-gray-800 mb-4">초대 코드로 참여</Text>
      <Text className="text-gray-500 mb-8">가족에게 초대 코드를 받아 입력하세요.</Text>

      <TextInput
        className="border border-gray-200 rounded-xl px-4 py-3 mb-8 text-gray-800 text-center text-2xl tracking-widest"
        placeholder="XXXXXX"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        maxLength={6}
        autoCapitalize="characters"
      />

      <TouchableOpacity
        className="bg-primary-600 rounded-xl py-4 items-center"
        onPress={handleJoin}
        disabled={loading || code.length < 6}
      >
        <Text className="text-white font-semibold">
          {loading ? "참여 중..." : "참여하기"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
