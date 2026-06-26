import { ComponentType } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ShoppingBag,
  ChartLineUp,
  Clock,
  CheckSquare,
  ForkKnife,
  MapPin,
  CaretRight,
  type IconProps,
} from "phosphor-react-native";

type MenuItem = {
  label: string;
  subtitle: string;
  route: string;
  Icon: ComponentType<IconProps>;
  color: string;
  bg: string;
};

const MENU: MenuItem[] = [
  { label: "위시리스트", subtitle: "갖고 싶은 것 함께 정하기", route: "/(tabs)/wishlist", Icon: ShoppingBag, color: "#db2777", bg: "bg-pink-50" },
  { label: "재테크", subtitle: "관심종목·보유주식 관리", route: "/(tabs)/invest", Icon: ChartLineUp, color: "#ea580c", bg: "bg-orange-50" },
  { label: "언제와?", subtitle: "도착 시간 공유", route: "/utility/when-coming", Icon: Clock, color: "#0891b2", bg: "bg-cyan-50" },
  { label: "했어?", subtitle: "할 일 확인 요청", route: "/utility/did-you-do", Icon: CheckSquare, color: "#7c3aed", bg: "bg-violet-50" },
  { label: "뭐먹지?", subtitle: "메뉴 토너먼트", route: "/utility/what-to-eat", Icon: ForkKnife, color: "#d97706", bg: "bg-amber-50" },
  { label: "위치 공유", subtitle: "가족 위치 실시간 확인", route: "/utility/location", Icon: MapPin, color: "#16a34a", bg: "bg-green-50" },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Text className="text-xl font-bold text-gray-900 px-5 pt-4 pb-4">
        전체보기
      </Text>
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {MENU.map(({ label, subtitle, route, Icon, color, bg }) => (
          <TouchableOpacity
            key={label}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row items-center"
            activeOpacity={0.8}
            onPress={() => router.push(route as any)}
          >
            <View
              className={`w-12 h-12 rounded-full ${bg} items-center justify-center mr-4`}
            >
              <Icon size={24} color={color} weight="duotone" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-base">{label}</Text>
              <Text className="text-gray-400 text-sm mt-0.5">{subtitle}</Text>
            </View>
            <CaretRight size={18} color="#d1d5db" weight="bold" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
