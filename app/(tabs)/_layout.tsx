import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { Text } from "react-native";
import { useAuthStore } from "@/stores/authStore";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text className={`text-xs mt-1 ${focused ? "text-primary-600 font-semibold" : "text-gray-400"}`}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const { session, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/(auth)/login");
    }
  }, [session, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarLabel: "홈",
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: "일정", tabBarLabel: "일정" }}
      />
      <Tabs.Screen
        name="finance"
        options={{ title: "가계부", tabBarLabel: "가계부" }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{ title: "위시", tabBarLabel: "위시" }}
      />
      <Tabs.Screen
        name="invest"
        options={{ title: "재테크", tabBarLabel: "재테크" }}
      />
      <Tabs.Screen
        name="utility"
        options={{ title: "유틸", tabBarLabel: "유틸" }}
      />
    </Tabs>
  );
}
