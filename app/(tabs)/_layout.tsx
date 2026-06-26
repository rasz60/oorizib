import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  House,
  CalendarBlank,
  Wallet,
  SquaresFour,
  DotsNine,
  type Icon,
} from "phosphor-react-native";
import { useAuthStore } from "@/stores/authStore";

function tabIcon(IconCmp: Icon) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <IconCmp size={24} color={color} weight={focused ? "fill" : "regular"} />
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
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          // 홈은 아이콘만 표시(텍스트 제외)
          tabBarLabel: () => null,
          tabBarIcon: tabIcon(House),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "일정",
          tabBarLabel: "일정",
          tabBarIcon: tabIcon(CalendarBlank),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "가계부",
          tabBarLabel: "가계부",
          tabBarIcon: tabIcon(Wallet),
        }}
      />
      <Tabs.Screen
        name="utility"
        options={{
          title: "유틸",
          tabBarLabel: "유틸",
          tabBarIcon: tabIcon(SquaresFour),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "전체보기",
          tabBarLabel: "전체보기",
          tabBarIcon: tabIcon(DotsNine),
        }}
      />

      {/* 탭 바에는 노출하지 않지만 라우트로는 접근 가능 (전체보기에서 진입) */}
      <Tabs.Screen name="wishlist" options={{ href: null }} />
      <Tabs.Screen name="invest" options={{ href: null }} />
    </Tabs>
  );
}
