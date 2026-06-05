import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert("로그인 오류", error.message);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-primary-600 mb-2">Oorizib</Text>
        <Text className="text-gray-500 mb-10">우리 가족만의 공간</Text>

        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-800"
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">
            {loading ? "로그인 중..." : "로그인"}
          </Text>
        </TouchableOpacity>

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
