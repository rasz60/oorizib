import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!displayName.trim()) {
      Alert.alert("오류", "이름을 입력해주세요.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) {
      Alert.alert("회원가입 오류", error.message);
    } else {
      Alert.alert("가입 완료", "이메일을 확인해주세요.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="flex-1 px-6 pt-16">
        <TouchableOpacity className="mb-8" onPress={() => router.back()}>
          <Text className="text-primary-600">← 뒤로</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-800 mb-8">회원가입</Text>

        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
          placeholder="이름 (가족들에게 표시됩니다)"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-8 text-gray-800"
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center mb-8"
          onPress={handleRegister}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "처리 중..." : "가입하기"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
