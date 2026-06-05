import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";

export default function DidYouDoScreen() {
  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState("");
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const [showRespond, setShowRespond] = useState(false);
  const [respondingItem, setRespondingItem] = useState<any>(null);
  const [responseCheck, setResponseCheck] = useState(false);
  const [responseMemo, setResponseMemo] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["didYouDo", profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from("did_you_do")
        .select("*, sender:sender_id(display_name), receiver:receiver_id(display_name)")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!profile,
  });

  const handleCreate = async () => {
    if (!content || !selectedReceiver || !activeGroup || !profile) return;
    const { data: item } = await supabase
      .from("did_you_do")
      .insert({
        group_id: activeGroup.id,
        sender_id: profile.id,
        receiver_id: selectedReceiver,
        content,
        scheduled_date: scheduledDate || null,
        scheduled_time: scheduledTime || null,
        status: "pending",
      })
      .select()
      .single();

    await supabase.functions.invoke("send-notification", {
      body: {
        userIds: [selectedReceiver],
        title: "✅ 했어?",
        body: `${profile.displayName}님: "${content}"`,
        data: { screen: "utility/did-you-do" },
      },
    });

    queryClient.invalidateQueries({ queryKey: ["didYouDo"] });
    setShowCreate(false);
    setContent("");
    setSelectedReceiver("");
    setScheduledDate("");
    setScheduledTime("");
  };

  const handleRespond = async () => {
    if (!respondingItem || !profile) return;
    await supabase
      .from("did_you_do")
      .update({
        status: "responded",
        response_check: responseCheck,
        response_memo: responseMemo || null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", respondingItem.id);

    await supabase.functions.invoke("send-notification", {
      body: {
        userIds: [respondingItem.sender_id],
        title: "✅ 했어? 응답",
        body: `${profile.displayName}님이 "${respondingItem.content}"에 답했어요: ${responseCheck ? "완료 ✅" : "미완료 ❌"}`,
        data: { screen: "utility/did-you-do" },
      },
    });

    queryClient.invalidateQueries({ queryKey: ["didYouDo"] });
    setShowRespond(false);
    setRespondingItem(null);
    setResponseCheck(false);
    setResponseMemo("");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-5 pt-4 pb-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary-600 mr-3">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">✅ 했어?</Text>
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
          return (
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              onPress={() => {
                if (!isSender && item.status === "pending") {
                  setRespondingItem(item);
                  setShowRespond(true);
                }
              }}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-800 font-semibold">{item.content}</Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {isSender ? `→ ${item.receiver?.display_name}` : `← ${item.sender?.display_name}`}
                    {item.scheduled_date && ` · ${item.scheduled_date}`}
                  </Text>
                </View>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    item.status === "responded"
                      ? item.response_check
                        ? "bg-green-100"
                        : "bg-red-100"
                      : "bg-yellow-100"
                  }`}
                >
                  <Text className="text-xs font-medium text-gray-600">
                    {item.status === "pending"
                      ? "대기 중"
                      : item.response_check
                      ? "완료 ✅"
                      : "미완료 ❌"}
                  </Text>
                </View>
              </View>
              {item.response_memo && (
                <Text className="text-gray-500 text-sm bg-gray-50 rounded-lg p-2 mt-1">
                  "{item.response_memo}"
                </Text>
              )}
              {!isSender && item.status === "pending" && (
                <Text className="text-primary-600 text-xs mt-2">탭하여 응답하기 →</Text>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-gray-400">했어? 내역이 없어요</Text>
          </View>
        }
      />

      {/* 생성 모달 */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white px-6">
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-lg font-bold text-gray-800">했어? 보내기</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text className="text-gray-400">닫기</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-3"
            placeholder="내용 (예: 약 먹었어?)"
            value={content}
            onChangeText={setContent}
            multiline
          />
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-3"
            placeholder="날짜 (선택, YYYY-MM-DD)"
            value={scheduledDate}
            onChangeText={setScheduledDate}
          />
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-4"
            placeholder="시간 (선택, HH:MM)"
            value={scheduledTime}
            onChangeText={setScheduledTime}
          />

          <Text className="text-gray-500 text-sm mb-2">누구에게?</Text>
          {activeGroup?.members
            .filter((m) => m.userId !== profile?.id)
            .map((m) => (
              <TouchableOpacity
                key={m.userId}
                className={`p-3 rounded-xl mb-2 border ${
                  selectedReceiver === m.userId ? "border-primary-600 bg-primary-50" : "border-gray-200"
                }`}
                onPress={() => setSelectedReceiver(m.userId)}
              >
                <Text className="text-gray-800">{m.profile.displayName}</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-4 ${content && selectedReceiver ? "bg-primary-600" : "bg-gray-200"}`}
            onPress={handleCreate}
            disabled={!content || !selectedReceiver}
          >
            <Text className={`font-semibold ${content && selectedReceiver ? "text-white" : "text-gray-400"}`}>
              보내기
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* 응답 모달 */}
      <Modal visible={showRespond} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white px-6">
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-lg font-bold text-gray-800">응답하기</Text>
            <TouchableOpacity onPress={() => setShowRespond(false)}>
              <Text className="text-gray-400">닫기</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-6">
            <Text className="text-gray-800 font-medium">{respondingItem?.content}</Text>
          </View>

          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-gray-700 font-medium">완료했어요</Text>
            <Switch
              value={responseCheck}
              onValueChange={setResponseCheck}
              trackColor={{ true: "#6366f1" }}
            />
          </View>

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-6"
            placeholder="메모 (선택사항)"
            value={responseMemo}
            onChangeText={setResponseMemo}
            multiline
          />

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
            onPress={handleRespond}
          >
            <Text className="text-white font-semibold">응답 전송</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
