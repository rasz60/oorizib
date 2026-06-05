import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";

interface MemberLocation {
  userId: string;
  displayName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export default function LocationScreen() {
  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const [memberLocations, setMemberLocations] = useState<MemberLocation[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!activeGroup) return;

    const channel = supabase
      .channel(`locations:${activeGroup.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_locations",
          filter: `group_id=eq.${activeGroup.id}`,
        },
        async (payload) => {
          const loc = payload.new as any;
          if (!loc) return;
          const member = activeGroup.members.find((m) => m.userId === loc.user_id);
          if (!member) return;

          setMemberLocations((prev) => {
            const filtered = prev.filter((l) => l.userId !== loc.user_id);
            return [
              ...filtered,
              {
                userId: loc.user_id,
                displayName: member.profile.displayName,
                latitude: loc.latitude,
                longitude: loc.longitude,
                updatedAt: loc.updated_at,
              },
            ];
          });
        }
      )
      .subscribe();

    // 현재 위치 데이터 가져오기
    supabase
      .from("user_locations")
      .select("*")
      .eq("group_id", activeGroup.id)
      .then(({ data }) => {
        if (!data) return;
        const locs: MemberLocation[] = data.map((loc: any) => {
          const member = activeGroup.members.find((m) => m.userId === loc.user_id);
          return {
            userId: loc.user_id,
            displayName: member?.profile.displayName ?? "알 수 없음",
            latitude: loc.latitude,
            longitude: loc.longitude,
            updatedAt: loc.updated_at,
          };
        });
        setMemberLocations(locs);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeGroup]);

  const startSharing = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    setIsSharing(true);
    const location = await Location.getCurrentPositionAsync({});

    if (activeGroup && profile) {
      await supabase.from("user_locations").upsert({
        user_id: profile.id,
        group_id: activeGroup.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const stopSharing = async () => {
    setIsSharing(false);
    if (profile) {
      await supabase.from("user_locations").delete().eq("user_id", profile.id);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-5 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary-600 mr-3">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">📍 위치 공유</Text>
      </View>

      <View className="flex-1 mx-4">
        <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <Text className="text-yellow-700 text-sm">
            카카오톡과 같은 실시간 지도 표시는 현재 버전에서는 텍스트 형태로 제공됩니다.
            지도 표시 기능은 react-native-maps를 추가로 설치해 구현할 수 있습니다.
          </Text>
        </View>

        <TouchableOpacity
          className={`rounded-xl py-4 items-center mb-4 ${
            isSharing ? "bg-red-500" : "bg-primary-600"
          }`}
          onPress={isSharing ? stopSharing : startSharing}
        >
          <Text className="text-white font-semibold">
            {isSharing ? "위치 공유 중지" : "내 위치 공유 시작"}
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-500 text-sm mb-3">가족 위치</Text>
        {memberLocations.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center">
            <Text className="text-gray-400">위치를 공유한 가족이 없어요</Text>
          </View>
        ) : (
          memberLocations.map((loc) => (
            <View key={loc.userId} className="bg-white rounded-xl px-4 py-3 mb-2 flex-row justify-between">
              <View>
                <Text className="text-gray-800 font-medium">{loc.displayName}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </Text>
              </View>
              <Text className="text-gray-400 text-xs self-center">
                {new Date(loc.updatedAt).toLocaleTimeString("ko-KR")}
              </Text>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}
