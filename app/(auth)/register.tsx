import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { supabase } from "@/lib/supabase";
import { translateAuthError } from "@/lib/authErrors";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/FeedbackProvider";

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const feedback = useFeedback();

  const handleRegister = async () => {
    setError(null);

    if (!displayName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() } },
    });
    setLoading(false);

    if (error) {
      setError(translateAuthError(error.message));
      return;
    }

    // 이메일 인증이 켜진 상태에서 이미 가입된 이메일로 재가입하면
    // user 는 오지만 identities 가 빈 배열로 온다.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError("이미 가입된 이메일입니다. 로그인해주세요.");
      return;
    }

    if (data.session) {
      // 이메일 인증 비활성: 즉시 로그인됨 → onAuthStateChange 가 (tabs)로 이동.
      feedback.show({
        type: "success",
        title: "가입이 완료되었습니다",
        message: "환영해요! 바로 시작할게요.",
      });
      return;
    }

    // 이메일 인증 필요: 확인 메일 발송됨 → 확인 누르면 로그인 화면으로 이동.
    feedback.show({
      type: "success",
      title: "가입이 완료되었습니다",
      message: "인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해주세요.",
      confirmText: "로그인하러 가기",
      onConfirm: () => router.replace("/(auth)/login"),
    });
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-16 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          className="mb-8 flex-row items-center"
          onPress={() => router.back()}
        >
          <CaretLeft size={20} color="#4f46e5" weight="bold" />
          <Text className="text-primary-600 ml-1">뒤로</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-gray-900 mb-2">회원가입</Text>
        <Text className="text-gray-500 mb-8">우리 가족만의 공간을 시작해요</Text>

        {error && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-red-600">{error}</Text>
          </View>
        )}

        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
          placeholder="이름 (가족들에게 표시됩니다)"
          placeholderTextColor="#9ca3af"
          value={displayName}
          onChangeText={setDisplayName}
        />
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
          className="border border-gray-200 rounded-xl px-4 py-3 mb-8 text-gray-800"
          placeholder="비밀번호 (6자 이상)"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Button
          label="가입하기"
          loading={loading}
          onPress={handleRegister}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
