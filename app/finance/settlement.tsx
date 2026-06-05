import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";

export default function SettlementScreen() {
  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: settlements = [] } = useQuery({
    queryKey: ["settlements", activeGroup?.id, profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from("settlements")
        .select(`
          *,
          requester:requester_id(display_name),
          target:target_user_id(display_name)
        `)
        .or(`requester_id.eq.${profile.id},target_user_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!profile,
  });

  const uploadProof = async (settlementId: string, role: "sender" | "requester") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    const ext = uri.split(".").pop();
    const fileName = `settlements/${settlementId}/${role}_${Date.now()}.${ext}`;

    const { data: uploadData, error } = await supabase.storage
      .from("proofs")
      .upload(fileName, { uri, type: `image/${ext}`, name: fileName } as any);

    if (error) { Alert.alert("업로드 실패"); return; }

    const { data: urlData } = supabase.storage.from("proofs").getPublicUrl(fileName);
    const field = role === "sender" ? "sender_proof_url" : "requester_proof_url";
    await supabase.from("settlements").update({ [field]: urlData.publicUrl }).eq("id", settlementId);
    queryClient.invalidateQueries({ queryKey: ["settlements"] });
  };

  const confirmSenderPayment = async (item: any) => {
    await supabase
      .from("settlements")
      .update({ status: "sender_confirmed" })
      .eq("id", item.id);

    await supabase.functions.invoke("send-notification", {
      body: {
        userIds: [item.requester_id],
        title: "💸 입금 완료",
        body: `${item.target?.display_name}님이 ${item.total_amount.toLocaleString()}원 입금을 완료했어요`,
        data: { screen: "finance/settlement", settlementId: item.id },
      },
    });

    queryClient.invalidateQueries({ queryKey: ["settlements"] });
  };

  const confirmRequesterReceived = async (item: any) => {
    await supabase
      .from("settlements")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", item.id);
    queryClient.invalidateQueries({ queryKey: ["settlements"] });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-5 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary-600 mr-3">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">정산 내역</Text>
      </View>

      <FlatList
        data={settlements}
        keyExtractor={(item: any) => item.id}
        contentContainerClassName="px-4 pb-6"
        renderItem={({ item }: any) => {
          const isSender = item.target_user_id === profile?.id;
          const isRequester = item.requester_id === profile?.id;

          return (
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-800 font-semibold">
                  {isSender ? `← ${item.requester?.display_name}` : `→ ${item.target?.display_name}`}
                </Text>
                <Text
                  className={`text-lg font-bold ${
                    isSender ? "text-red-500" : "text-blue-600"
                  }`}
                >
                  {item.total_amount.toLocaleString()}원
                </Text>
              </View>

              <View className="flex-row items-center justify-between mb-3">
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    item.status === "completed"
                      ? "bg-green-100"
                      : item.status === "sender_confirmed"
                      ? "bg-blue-100"
                      : "bg-yellow-100"
                  }`}
                >
                  <Text className="text-xs text-gray-600">
                    {item.status === "pending"
                      ? "정산 요청 중"
                      : item.status === "sender_confirmed"
                      ? "송금자 확인 완료"
                      : "정산 완료 ✅"}
                  </Text>
                </View>
              </View>

              {/* 증빙 사진 */}
              <View className="flex-row gap-3 mb-3">
                {item.sender_proof_url && (
                  <View>
                    <Text className="text-xs text-gray-400 mb-1">송금자 증빙</Text>
                    <Image
                      source={{ uri: item.sender_proof_url }}
                      className="w-20 h-20 rounded-lg"
                    />
                  </View>
                )}
                {item.requester_proof_url && (
                  <View>
                    <Text className="text-xs text-gray-400 mb-1">요청자 증빙</Text>
                    <Image
                      source={{ uri: item.requester_proof_url }}
                      className="w-20 h-20 rounded-lg"
                    />
                  </View>
                )}
              </View>

              {/* 송금자 버튼 */}
              {isSender && item.status === "pending" && (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 border border-gray-200 rounded-lg py-2 items-center"
                    onPress={() => uploadProof(item.id, "sender")}
                  >
                    <Text className="text-gray-600 text-sm">📸 증빙 등록</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-primary-600 rounded-lg py-2 items-center"
                    onPress={() => confirmSenderPayment(item)}
                  >
                    <Text className="text-white text-sm font-medium">입금 완료</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 요청자 버튼 */}
              {isRequester && item.status === "sender_confirmed" && (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 border border-gray-200 rounded-lg py-2 items-center"
                    onPress={() => uploadProof(item.id, "requester")}
                  >
                    <Text className="text-gray-600 text-sm">📸 증빙 등록</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-green-500 rounded-lg py-2 items-center"
                    onPress={() => confirmRequesterReceived(item)}
                  >
                    <Text className="text-white text-sm font-medium">수령 확인</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-gray-400">정산 내역이 없어요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
