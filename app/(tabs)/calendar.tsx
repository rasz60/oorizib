import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { Schedule } from "@/types";

export default function CalendarScreen() {
  const { activeGroup } = useGroupStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const router = useRouter();

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["schedules", activeGroup?.id, selectedDate.substring(0, 7)],
    queryFn: async () => {
      if (!activeGroup) return [];
      const monthStart = `${selectedDate.substring(0, 7)}-01`;
      const monthEnd = `${selectedDate.substring(0, 7)}-31`;
      const { data } = await supabase
        .from("schedules")
        .select("*, schedule_participants(user_id)")
        .eq("group_id", activeGroup.id)
        .gte("start_at", monthStart)
        .lte("start_at", monthEnd)
        .order("start_at");
      return (data ?? []).map((s: any) => ({
        id: s.id,
        groupId: s.group_id,
        creatorId: s.creator_id,
        title: s.title,
        description: s.description,
        startAt: s.start_at,
        endAt: s.end_at,
        isAllDay: s.is_all_day,
        isPersonal: s.is_personal,
        color: s.color,
        remindOptions: s.remind_options,
        participants: [],
      }));
    },
    enabled: !!activeGroup,
  });

  const markedDates: Record<string, any> = {};
  schedules.forEach((s) => {
    const date = s.startAt.substring(0, 10);
    markedDates[date] = {
      marked: true,
      dotColor: s.color,
      ...(date === selectedDate ? { selected: true, selectedColor: "#6366f1" } : {}),
    };
  });
  if (!markedDates[selectedDate]) {
    markedDates[selectedDate] = { selected: true, selectedColor: "#6366f1" };
  }

  const todaySchedules = schedules.filter(
    (s) => s.startAt.substring(0, 10) === selectedDate
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row justify-between items-center px-5 pt-4 pb-2">
        <Text className="text-xl font-bold text-gray-800">일정</Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-lg px-4 py-2"
          onPress={() => router.push("/schedule/create")}
        >
          <Text className="text-white text-sm font-medium">+ 추가</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          todayTextColor: "#6366f1",
          selectedDayBackgroundColor: "#6366f1",
          arrowColor: "#6366f1",
        }}
      />

      <View className="flex-1 px-5 pt-4">
        <Text className="text-sm text-gray-500 mb-3">
          {format(new Date(selectedDate), "M월 d일 (EEE)", { locale: ko })}의 일정
        </Text>
        {todaySchedules.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-400">일정이 없습니다</Text>
          </View>
        ) : (
          <FlatList
            data={todaySchedules}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-2"
                onPress={() => router.push(`/schedule/${item.id}` as any)}
              >
                <View
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: item.color }}
                />
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">{item.title}</Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    {item.isAllDay
                      ? "하루 종일"
                      : format(new Date(item.startAt), "HH:mm")}
                  </Text>
                </View>
                {item.isPersonal && (
                  <View className="bg-gray-200 rounded px-2 py-0.5">
                    <Text className="text-gray-500 text-xs">개인</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
