import { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import {
  House,
  CalendarBlank,
  Wallet,
  ShoppingBag,
  ChartLineUp,
  SquaresFour,
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
        options={{ title: "홈", tabBarLabel: "홈", tabBarIcon: tabIcon(House) }}
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
        name="wishlist"
        options={{
          title: "위시",
          tabBarLabel: "위시",
          tabBarIcon: tabIcon(ShoppingBag),
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: "재테크",
          tabBarLabel: "재테크",
          tabBarIcon: tabIcon(ChartLineUp),
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
    </Tabs>
  );
}
