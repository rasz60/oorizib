import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, isPast, format } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";

export default function WhenComingScreen() {
  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["whenComing", profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from("when_are_you_coming")
        .select(`
          *,
          sender:sender_id(id, display_name),
          receiver:receiver_id(id, display_name)
        `)
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!profile,
    refetchInterval: 30000,
  });

  const handleCreate = async () => {
    if (!selectedReceiver || !profile || !activeGroup) return;
    await supabase.from("when_are_you_coming").insert({
      group_id: activeGroup.id,
      sender_id: profile.id,
      receiver_id: selectedReceiver,
      status: "pending",
    });

    // 수신자에게 알림
    await supabase.functions.invoke("send-notification", {
      body: {
        userIds: [selectedReceiver],
        title: "🕐 언제와?",
        body: `${profile.displayName}님이 언제 오냐고 물어봤어요`,
        data: { screen: "utility/when-coming" },
      },
    });

    queryClient.invalidateQueries({ queryKey: ["whenComing"] });
    setShowCreate(false);
    setSelectedReceiver("");
  };

  const handleRespond = async (itemId: string, expectedTime: string) => {
    await supabase
      .from("when_are_you_coming")
      .update({ expected_at: expectedTime, status: "responded" })
      .eq("id", itemId);
    queryClient.invalidateQueries({ queryKey: ["whenComing"] });
  };

  const handleArrived = async (item: any) => {
    Alert.alert("약속을 지켰나요?", "", [
      {
        text: "지켰어요 ✅",
        onPress: async () => {
          await supabase
            .from("when_are_you_coming")
            .update({ status: "arrived", is_kept: true })
            .eq("id", item.id);
          queryClient.invalidateQueries({ queryKey: ["whenComing"] });
        },
      },
      {
        text: "못 지켰어요 ❌",
        onPress: async () => {
          await supabase
            .from("when_are_you_coming")
            .update({ status: "missed", is_kept: false })
            .eq("id", item.id);
          queryClient.invalidateQueries({ queryKey: ["whenComing"] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-5 pt-4 pb-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary-600 mr-3">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">🕐 언제와?</Text>
        </View>
        <TouchableOpacity
          className="bg-primary-600 rounded-lg px-4 py-2"
          onPress={() => setShowCreate(true)}
        >
          <Text className="text-white text-sm font-medium">+ 물어보기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item: any) => item.id}
        contentContainerClassName="px-4 pb-6"
        renderItem={({ item }: any) => {
          const isSender = item.sender_id === profile?.id;
          const isExpired = item.expected_at && isPast(new Date(item.expected_at));

          return (
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-500 text-sm">
                  {isSender
                    ? `→ ${item.receiver?.display_name}`
                    : `← ${item.sender?.display_name}`}
                </Text>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    item.status === "arrived"
                      ? "bg-green-100"
                      : item.status === "missed"
                      ? "bg-red-100"
                      : item.status === "responded"
                      ? "bg-blue-100"
                      : "bg-yellow-100"
                  }`}
                >
                  <Text className="text-xs font-medium text-gray-600">
                    {item.status === "pending"
                      ? "대기 중"
                      : item.status === "responded"
                      ? "응답함"
                      : item.status === "arrived"
                      ? "도착 ✅"
                      : "못 지킴 ❌"}
                  </Text>
                </View>
              </View>

              {item.expected_at && (
                <Text className="text-gray-700 font-medium mb-1">
                  예상 도착: {format(new Date(item.expected_at), "M/d HH:mm")}
                  {item.status === "responded" && !isExpired && (
                    <Text className="text-primary-600">
                      {" "}
                      ({formatDistanceToNow(new Date(item.expected_at), { locale: ko, addSuffix: true })})
                    </Text>
                  )}
                </Text>
              )}

              {/* 수신자가 응답하는 버튼 */}
              {!isSender && item.status === "pending" && (
                <TouchableOpacity
                  className="bg-primary-600 rounded-lg py-2 mt-2 items-center"
                  onPress={() => {
                    Alert.prompt(
                      "예상 도착 시간",
                      "언제 도착할 것 같아요? (예: 2024-01-15T18:30)",
                      (time) => handleRespond(item.id, time),
                      "plain-text"
                    );
                  }}
                >
                  <Text className="text-white font-medium">응답하기</Text>
                </TouchableOpacity>
              )}

              {/* 발신자가 도착 확인하는 버튼 */}
              {isSender && item.status === "responded" && isExpired && (
                <TouchableOpacity
                  className="bg-green-500 rounded-lg py-2 mt-2 items-center"
                  onPress={() => handleArrived(item)}
                >
                  <Text className="text-white font-medium">도착 확인</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-gray-400">아직 언제와? 내역이 없어요</Text>
          </View>
        }
      />

      {/* 물어보기 모달 */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white px-6">
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-lg font-bold text-gray-800">언제와? 보내기</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text className="text-gray-400">닫기</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-gray-500 text-sm mb-3">누구에게 물어볼까요?</Text>
          {activeGroup?.members
            .filter((m) => m.userId !== profile?.id)
            .map((m) => (
              <TouchableOpacity
                key={m.userId}
                className={`p-4 rounded-xl mb-2 border ${
                  selectedReceiver === m.userId
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200"
                }`}
                onPress={() => setSelectedReceiver(m.userId)}
              >
                <Text className="text-gray-800 font-medium">{m.profile.displayName}</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-4 ${
              selectedReceiver ? "bg-primary-600" : "bg-gray-200"
            }`}
            onPress={handleCreate}
            disabled={!selectedReceiver}
          >
            <Text className={`font-semibold ${selectedReceiver ? "text-white" : "text-gray-400"}`}>
              물어보기
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
