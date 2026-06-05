import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { MEAL_TYPES, TOURNAMENT_MAX_ENTRIES } from "@/constants";

export default function WhatToEatScreen() {
  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [mealDate, setMealDate] = useState("");
  const [mealType, setMealType] = useState<string>("lunch");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const { data: items = [] } = useQuery({
    queryKey: ["whatToEat", activeGroup?.id, profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from("what_to_eat")
        .select("*, what_to_eat_entries(*)")
        .or(`creator_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!profile,
  });

  const handleCreate = async () => {
    if (!mealDate || !activeGroup || !profile) return;
    const allParticipants = [profile.id, ...selectedParticipants.filter((id) => id !== profile.id)];

    const { data: item, error } = await supabase
      .from("what_to_eat")
      .insert({
        group_id: activeGroup.id,
        creator_id: profile.id,
        participant_ids: allParticipants,
        meal_date: mealDate,
        meal_type: mealType,
        status: "collecting",
      })
      .select()
      .single();

    if (error || !item) return;

    await supabase.functions.invoke("send-notification", {
      body: {
        userIds: selectedParticipants,
        title: "🍽️ 뭐먹지?",
        body: `${profile.displayName}님이 뭐 먹을지 물어봤어요! 먹고 싶은 거 입력해주세요`,
        data: { whatToEatId: item.id, screen: "utility/what-to-eat" },
      },
    });

    queryClient.invalidateQueries({ queryKey: ["whatToEat"] });
    setShowCreate(false);
  };

  const handleAddFood = async (itemId: string, foodName: string) => {
    if (!profile) return;
    const { data: existing } = await supabase
      .from("what_to_eat_entries")
      .select("id")
      .eq("what_to_eat_id", itemId)
      .eq("user_id", profile.id);

    if ((existing?.length ?? 0) >= TOURNAMENT_MAX_ENTRIES) {
      Alert.alert("알림", `최대 ${TOURNAMENT_MAX_ENTRIES}개까지 입력할 수 있어요`);
      return;
    }

    await supabase.from("what_to_eat_entries").insert({
      what_to_eat_id: itemId,
      user_id: profile.id,
      food_name: foodName,
    });

    queryClient.invalidateQueries({ queryKey: ["whatToEat"] });
  };

  const handleStartTournament = async (item: any) => {
    await supabase
      .from("what_to_eat")
      .update({ status: "tournament" })
      .eq("id", item.id);
    queryClient.invalidateQueries({ queryKey: ["whatToEat"] });
  };

  const handleTournamentVote = async (winnerId: string, loserId: string, itemId: string) => {
    await supabase
      .from("what_to_eat_entries")
      .update({ is_eliminated: true })
      .eq("id", loserId);

    const { data: remaining } = await supabase
      .from("what_to_eat_entries")
      .select("id, food_name")
      .eq("what_to_eat_id", itemId)
      .eq("is_eliminated", false);

    if (remaining && remaining.length === 1) {
      await supabase
        .from("what_to_eat")
        .update({ status: "done", winner: remaining[0].food_name })
        .eq("id", itemId);
      queryClient.invalidateQueries({ queryKey: ["whatToEat"] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["whatToEat"] });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-5 pt-4 pb-3">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-primary-600 mr-3">←</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">🍽️ 뭐먹지?</Text>
        </View>
        <TouchableOpacity
          className="bg-primary-600 rounded-lg px-4 py-2"
          onPress={() => setShowCreate(true)}
        >
          <Text className="text-white text-sm font-medium">+ 새로 묻기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item: any) => item.id}
        contentContainerClassName="px-4 pb-6"
        renderItem={({ item }: any) => {
          const myEntries = (item.what_to_eat_entries ?? []).filter(
            (e: any) => e.user_id === profile?.id
          );
          const activeEntries = (item.what_to_eat_entries ?? []).filter(
            (e: any) => !e.is_eliminated
          );

          return (
            <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-800 font-bold">
                  {MEAL_TYPES.find((m) => m.id === item.meal_type)?.label} · {item.meal_date}
                </Text>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    item.status === "done"
                      ? "bg-green-100"
                      : item.status === "tournament"
                      ? "bg-yellow-100"
                      : "bg-blue-100"
                  }`}
                >
                  <Text className="text-xs font-medium text-gray-600">
                    {item.status === "collecting"
                      ? "입력 중"
                      : item.status === "tournament"
                      ? "토너먼트"
                      : "완료"}
                  </Text>
                </View>
              </View>

              {item.status === "done" && item.winner && (
                <View className="bg-green-50 rounded-xl p-4 items-center">
                  <Text className="text-2xl mb-1">🏆</Text>
                  <Text className="text-green-700 font-bold text-xl">{item.winner}</Text>
                </View>
              )}

              {item.status === "collecting" && item.creator_id === profile?.id && (
                <TouchableOpacity
                  className="bg-yellow-500 rounded-lg py-2 items-center mt-2"
                  onPress={() => handleStartTournament(item)}
                >
                  <Text className="text-white font-medium">토너먼트 시작</Text>
                </TouchableOpacity>
              )}

              {item.status === "tournament" && activeEntries.length >= 2 && (
                <View>
                  <Text className="text-gray-500 text-sm mb-2">
                    남은 항목: {activeEntries.length}개 — 이길 것 같은 걸 골라요!
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="flex-1 bg-primary-600 rounded-lg py-3 items-center"
                      onPress={() =>
                        handleTournamentVote(
                          activeEntries[0].id,
                          activeEntries[1].id,
                          item.id
                        )
                      }
                    >
                      <Text className="text-white font-medium">{activeEntries[0].food_name}</Text>
                    </TouchableOpacity>
                    <Text className="self-center text-gray-400">VS</Text>
                    <TouchableOpacity
                      className="flex-1 bg-primary-600 rounded-lg py-3 items-center"
                      onPress={() =>
                        handleTournamentVote(
                          activeEntries[1].id,
                          activeEntries[0].id,
                          item.id
                        )
                      }
                    >
                      <Text className="text-white font-medium">{activeEntries[1].food_name}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-gray-400">뭐먹지? 내역이 없어요</Text>
          </View>
        }
      />

      {/* 생성 모달 */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white px-6">
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-lg font-bold text-gray-800">뭐먹지? 시작하기</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text className="text-gray-400">닫기</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-3"
            placeholder="날짜 (YYYY-MM-DD)"
            value={mealDate}
            onChangeText={setMealDate}
          />

          <Text className="text-gray-500 text-sm mb-2">끼니</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {MEAL_TYPES.map((m) => (
              <TouchableOpacity
                key={m.id}
                className={`px-3 py-1.5 rounded-full border ${
                  mealType === m.id ? "bg-primary-600 border-primary-600" : "border-gray-200"
                }`}
                onPress={() => setMealType(m.id)}
              >
                <Text className={`text-sm ${mealType === m.id ? "text-white" : "text-gray-500"}`}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-gray-500 text-sm mb-2">함께할 가족</Text>
          {activeGroup?.members
            .filter((m) => m.userId !== profile?.id)
            .map((m) => (
              <TouchableOpacity
                key={m.userId}
                className={`p-3 rounded-xl mb-2 border ${
                  selectedParticipants.includes(m.userId)
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200"
                }`}
                onPress={() =>
                  setSelectedParticipants((prev) =>
                    prev.includes(m.userId)
                      ? prev.filter((id) => id !== m.userId)
                      : [...prev, m.userId]
                  )
                }
              >
                <Text className="text-gray-800">{m.profile.displayName}</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            className={`rounded-xl py-4 items-center mt-4 ${mealDate ? "bg-primary-600" : "bg-gray-200"}`}
            onPress={handleCreate}
            disabled={!mealDate}
          >
            <Text className={`font-semibold ${mealDate ? "text-white" : "text-gray-400"}`}>
              시작하기
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
