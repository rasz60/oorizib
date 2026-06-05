import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const { session, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && session) {
      router.replace("/(tabs)");
    }
  }, [session, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
