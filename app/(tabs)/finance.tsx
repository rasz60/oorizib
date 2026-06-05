import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths } from "date-fns";
import { PieChart } from "react-native-gifted-charts";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { Transaction } from "@/types";
import { EXPENSE_CATEGORIES } from "@/constants";

export default function FinanceScreen() {
  const { activeGroup } = useGroupStore();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [activeTab, setActiveTab] = useState<"list" | "chart">("list");

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["transactions", activeGroup?.id, selectedMonth],
    queryFn: async () => {
      if (!activeGroup) return [];
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("group_id", activeGroup.id)
        .gte("transacted_at", `${selectedMonth}-01`)
        .lte("transacted_at", `${selectedMonth}-31`)
        .order("transacted_at", { ascending: false });
      return (data ?? []).map((t: any) => ({
        id: t.id,
        groupId: t.group_id,
        bankAccountId: t.bank_account_id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        merchantName: t.merchant_name,
        category: t.category,
        tags: t.tags,
        transactedAt: t.transacted_at,
        isManual: t.is_manual,
      }));
    },
    enabled: !!activeGroup,
  });

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => {
    const total = transactions
      .filter((t) => t.type === "expense" && t.category === cat.id)
      .reduce((s, t) => s + t.amount, 0);
    return { ...cat, total };
  }).filter((c) => c.total > 0);

  const pieData = categoryTotals.map((c, i) => ({
    value: c.total,
    label: c.label,
    color: ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"][i % 6],
  }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-5 pt-4 pb-2 bg-white">
        <Text className="text-xl font-bold text-gray-800">가계부</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="border border-gray-200 rounded-lg px-3 py-2"
            onPress={() => router.push("/finance/accounts" as any)}
          >
            <Text className="text-gray-600 text-sm">계좌 관리</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-primary-600 rounded-lg px-4 py-2"
            onPress={() => router.push("/finance/add" as any)}
          >
            <Text className="text-white text-sm font-medium">+ 추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 월 선택 */}
      <View className="flex-row justify-center items-center py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() =>
            setSelectedMonth(
              format(subMonths(new Date(selectedMonth), 1), "yyyy-MM")
            )
          }
        >
          <Text className="text-gray-400 px-4">{"<"}</Text>
        </TouchableOpacity>
        <Text className="text-gray-700 font-medium w-24 text-center">{selectedMonth}</Text>
        <TouchableOpacity
          onPress={() =>
            setSelectedMonth(
              format(subMonths(new Date(selectedMonth), -1), "yyyy-MM")
            )
          }
        >
          <Text className="text-gray-400 px-4">{">"}</Text>
        </TouchableOpacity>
      </View>

      {/* 요약 */}
      <View className="flex-row mx-4 mt-4 mb-3 gap-3">
        <View className="flex-1 bg-blue-50 rounded-xl p-4">
          <Text className="text-blue-400 text-xs mb-1">수입</Text>
          <Text className="text-blue-700 font-bold text-base">
            {income.toLocaleString()}원
          </Text>
        </View>
        <View className="flex-1 bg-red-50 rounded-xl p-4">
          <Text className="text-red-400 text-xs mb-1">지출</Text>
          <Text className="text-red-600 font-bold text-base">
            {expense.toLocaleString()}원
          </Text>
        </View>
      </View>

      {/* 탭 */}
      <View className="flex-row mx-4 mb-3 bg-gray-100 rounded-xl p-1">
        {(["list", "chart"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === tab ? "bg-white shadow-sm" : ""
            }`}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab ? "text-gray-800" : "text-gray-400"
              }`}
            >
              {tab === "list" ? "내역" : "차트"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "chart" ? (
        <ScrollView className="flex-1 mx-4">
          {pieData.length > 0 ? (
            <View className="bg-white rounded-2xl p-4 mb-4">
              <Text className="text-gray-600 text-sm mb-4">지출 카테고리</Text>
              <View className="items-center mb-4">
                <PieChart
                  data={pieData}
                  donut
                  radius={90}
                  innerRadius={55}
                  centerLabelComponent={() => (
                    <View className="items-center">
                      <Text className="text-xs text-gray-400">총 지출</Text>
                      <Text className="text-sm font-bold text-gray-700">
                        {expense.toLocaleString()}
                      </Text>
                    </View>
                  )}
                />
              </View>
              {pieData.map((d) => (
                <View key={d.label} className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: d.color }}
                    />
                    <Text className="text-gray-600 text-sm">{d.label}</Text>
                  </View>
                  <Text className="text-gray-700 text-sm font-medium">
                    {d.value.toLocaleString()}원
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-gray-400">지출 내역이 없습니다</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          className="mx-4"
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center"
              onPress={() => router.push(`/finance/${item.id}` as any)}
            >
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">{item.description}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">
                  {EXPENSE_CATEGORIES.find((c) => c.id === item.category)?.label ?? item.category}
                  {item.tags.length > 0 && ` · ${item.tags.join(", ")}`}
                </Text>
              </View>
              <Text
                className={`font-bold ${
                  item.type === "income" ? "text-blue-600" : "text-red-500"
                }`}
              >
                {item.type === "income" ? "+" : "-"}
                {item.amount.toLocaleString()}원
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-gray-400">거래 내역이 없습니다</Text>
            </View>
          }
        />
      )}

      {/* 정산 요청 버튼 */}
      <TouchableOpacity
        className="mx-4 mb-4 bg-primary-600 rounded-xl py-4 items-center"
        onPress={() => router.push("/finance/settlement" as any)}
      >
        <Text className="text-white font-semibold">정산 요청</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
