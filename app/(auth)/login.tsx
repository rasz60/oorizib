import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { translateAuthError } from "@/lib/authErrors";
import { Button } from "@/components/ui/Button";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    // 성공 시 onAuthStateChange 가 세션을 채우고 (auth)/_layout 이 (tabs)로 이동시킨다.
    if (error) setError(translateAuthError(error.message));
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-primary-600 mb-2">Oorizib</Text>
        <Text className="text-gray-500 mb-10">우리 가족만의 공간</Text>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-600">{error}</Text>
          </View>
        )}

        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
          placeholder="이메일"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-800"
          placeholder="비밀번호"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button label="로그인" loading={loading} onPress={handleLogin} />

        <TouchableOpacity
          className="mt-4 items-center"
          onPress={() => router.push("/(auth)/register")}
        >
          <Text className="text-gray-500">
            계정이 없으신가요?{" "}
            <Text className="text-primary-600 font-semibold">회원가입</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
