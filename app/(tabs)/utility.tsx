import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";

export default function UtilityScreen() {
  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();

  const { data: whenComingList = [] } = useQuery({
    queryKey: ["whenComing", activeGroup?.id, profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from("when_are_you_coming")
        .select("*, sender:sender_id(display_name), receiver:receiver_id(display_name)")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .in("status", ["pending", "responded"])
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!profile,
  });

  const { data: didYouDoList = [] } = useQuery({
    queryKey: ["didYouDo", activeGroup?.id, profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from("did_you_do")
        .select("*, sender:sender_id(display_name), receiver:receiver_id(display_name)")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!profile,
  });

  const { data: whatToEatList = [] } = useQuery({
    queryKey: ["whatToEat", activeGroup?.id, profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from("what_to_eat")
        .select("*")
        .or(`creator_id.eq.${profile.id}`)
        .in("status", ["collecting", "tournament"])
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!profile,
  });

  const UtilCard = ({
    title,
    subtitle,
    onPress,
    badge,
  }: {
    title: string;
    subtitle: string;
    onPress: () => void;
    badge?: number;
  }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-5 mb-3 shadow-sm"
      onPress={onPress}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-gray-800 font-bold text-base">{title}</Text>
          <Text className="text-gray-400 text-sm mt-1">{subtitle}</Text>
        </View>
        {badge != null && badge > 0 && (
          <View className="bg-primary-600 rounded-full w-6 h-6 items-center justify-center">
            <Text className="text-white text-xs font-bold">{badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Text className="text-xl font-bold text-gray-800 px-5 pt-4 pb-4">유틸</Text>
      <ScrollView className="flex-1 px-4">
        <UtilCard
          title="🕐 언제와?"
          subtitle={`진행 중 ${whenComingList.length}건`}
          onPress={() => router.push("/utility/when-coming" as any)}
          badge={whenComingList.filter((w: any) => w.receiver_id === profile?.id && w.status === "pending").length}
        />
        <UtilCard
          title="✅ 했어?"
          subtitle={`답변 대기 ${didYouDoList.length}건`}
          onPress={() => router.push("/utility/did-you-do" as any)}
          badge={didYouDoList.filter((d: any) => d.receiver_id === profile?.id).length}
        />
        <UtilCard
          title="🍽️ 뭐먹지?"
          subtitle={`진행 중 ${whatToEatList.length}건`}
          onPress={() => router.push("/utility/what-to-eat" as any)}
          badge={whatToEatList.length}
        />
        <UtilCard
          title="📍 위치 공유"
          subtitle="가족 위치를 실시간으로 확인"
          onPress={() => router.push("/utility/location" as any)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
