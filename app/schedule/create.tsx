import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { RemindOption } from "@/types";

const REMIND_OPTIONS: { key: RemindOption; label: string }[] = [
  { key: "1day", label: "1일 전" },
  { key: "30min", label: "30분 전" },
  { key: "10min", label: "10분 전" },
];

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"];

export default function CreateScheduleScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [remindOptions, setRemindOptions] = useState<RemindOption[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const toggleRemind = (key: RemindOption) => {
    setRemindOptions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!title || !startDate || !activeGroup || !profile) return;
    setLoading(true);
    try {
      const startAt = isAllDay
        ? `${startDate}T00:00:00+09:00`
        : `${startDate}T${startTime}:00+09:00`;

      const { data: schedule, error } = await supabase
        .from("schedules")
        .insert({
          group_id: activeGroup.id,
          creator_id: profile.id,
          title,
          description,
          start_at: startAt,
          is_all_day: isAllDay,
          is_personal: isPersonal,
          color,
          remind_options: remindOptions,
        })
        .select()
        .single();

      if (error || !schedule) throw error;

      const participants = isPersonal
        ? [profile.id]
        : [profile.id, ...selectedParticipants.filter((id) => id !== profile.id)];

      await supabase.from("schedule_participants").insert(
        participants.map((uid) => ({ schedule_id: schedule.id, user_id: uid }))
      );

      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      router.back();
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "일정 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary-600 mr-4">취소</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-bold text-gray-800">새 일정</Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading || !title || !startDate}>
          <Text
            className={`font-semibold ${
              title && startDate ? "text-primary-600" : "text-gray-300"
            }`}
          >
            {loading ? "저장 중..." : "저장"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        <TextInput
          className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-3"
          placeholder="일정 제목"
          value={title}
          onChangeText={setTitle}
        />

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-600">하루 종일</Text>
          <Switch
            value={isAllDay}
            onValueChange={setIsAllDay}
            trackColor={{ true: "#6366f1" }}
          />
        </View>

        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
          placeholder="날짜 (YYYY-MM-DD)"
          value={startDate}
          onChangeText={setStartDate}
          keyboardType="numbers-and-punctuation"
        />

        {!isAllDay && (
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 mb-3 text-gray-800"
            placeholder="시간 (HH:MM)"
            value={startTime}
            onChangeText={setStartTime}
          />
        )}

        <TextInput
          className="border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800"
          placeholder="메모 (선택사항)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        {/* 색상 */}
        <Text className="text-gray-500 text-sm mb-2">색상</Text>
        <View className="flex-row gap-3 mb-4">
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              className={`w-8 h-8 rounded-full ${color === c ? "border-2 border-gray-400" : ""}`}
              style={{ backgroundColor: c }}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        {/* 알림 */}
        <Text className="text-gray-500 text-sm mb-2">알림</Text>
        <View className="flex-row gap-2 mb-4">
          {REMIND_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              className={`px-3 py-1.5 rounded-full border ${
                remindOptions.includes(opt.key)
                  ? "bg-primary-600 border-primary-600"
                  : "border-gray-200"
              }`}
              onPress={() => toggleRemind(opt.key)}
            >
              <Text
                className={`text-sm ${
                  remindOptions.includes(opt.key) ? "text-white" : "text-gray-500"
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 개인 일정 */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-600">개인 일정</Text>
          <Switch
            value={isPersonal}
            onValueChange={setIsPersonal}
            trackColor={{ true: "#6366f1" }}
          />
        </View>

        {/* 참여자 (공용 일정일 때) */}
        {!isPersonal && activeGroup && (
          <>
            <Text className="text-gray-500 text-sm mb-2">참여자</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {activeGroup.members
                .filter((m) => m.userId !== profile?.id)
                .map((m) => (
                  <TouchableOpacity
                    key={m.userId}
                    className={`px-3 py-1.5 rounded-full border ${
                      selectedParticipants.includes(m.userId)
                        ? "bg-primary-600 border-primary-600"
                        : "border-gray-200"
                    }`}
                    onPress={() => toggleParticipant(m.userId)}
                  >
                    <Text
                      className={`text-sm ${
                        selectedParticipants.includes(m.userId)
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    >
                      {m.profile.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
