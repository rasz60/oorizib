import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { fetchStockPrice } from "@/lib/api/kis";
import { MyStock, StockWatchlistItem } from "@/types";

export default function InvestScreen() {
  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();

  const { data: watchlist = [] } = useQuery<StockWatchlistItem[]>({
    queryKey: ["watchlist", activeGroup?.id, profile?.id],
    queryFn: async () => {
      if (!activeGroup || !profile) return [];
      const { data } = await supabase
        .from("stock_watchlist")
        .select("*")
        .eq("group_id", activeGroup.id)
        .eq("user_id", profile.id);
      const items = data ?? [];
      return Promise.all(
        items.map(async (item: any) => {
          const price = await fetchStockPrice(item.symbol, item.market).catch(() => null);
          return {
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            market: item.market,
            currentPrice: price?.currentPrice,
            changeRate: price?.changeRate,
            changeAmount: price?.changeAmount,
          };
        })
      );
    },
    enabled: !!activeGroup && !!profile,
    refetchInterval: 60000,
  });

  const { data: myStocks = [] } = useQuery<MyStock[]>({
    queryKey: ["myStocks", activeGroup?.id, profile?.id],
    queryFn: async () => {
      if (!activeGroup || !profile) return [];
      const { data } = await supabase
        .from("my_stocks")
        .select("*")
        .eq("group_id", activeGroup.id)
        .eq("user_id", profile.id);
      const stocks = data ?? [];
      return Promise.all(
        stocks.map(async (s: any) => {
          const price = await fetchStockPrice(s.symbol, s.market).catch(() => null);
          const currentPrice = price?.currentPrice ?? 0;
          const profitRate = currentPrice
            ? ((currentPrice - s.purchase_price) / s.purchase_price) * 100
            : 0;
          return {
            id: s.id,
            symbol: s.symbol,
            name: s.name,
            market: s.market,
            purchasePrice: s.purchase_price,
            quantity: s.quantity,
            currentPrice,
            profitRate,
            dayChangeRate: price?.changeRate,
          };
        })
      );
    },
    enabled: !!activeGroup && !!profile,
    refetchInterval: 60000,
  });

  const totalAsset = myStocks.reduce(
    (sum, s) => sum + (s.currentPrice ?? 0) * s.quantity,
    0
  );
  const totalCost = myStocks.reduce((sum, s) => sum + s.purchasePrice * s.quantity, 0);
  const totalProfitRate = totalCost > 0 ? ((totalAsset - totalCost) / totalCost) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-gray-800">재테크</Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-lg px-4 py-2"
          onPress={() => router.push("/invest/add-stock" as any)}
        >
          <Text className="text-white text-sm font-medium">+ 내 주식</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* 내 주식 요약 */}
        {myStocks.length > 0 && (
          <View className="mx-4 mb-4 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-gray-500 text-xs mb-3">내 주식 포트폴리오</Text>
            <View className="flex-row justify-between mb-3">
              <View>
                <Text className="text-gray-400 text-xs">총 평가 금액</Text>
                <Text className="text-gray-800 font-bold text-lg">
                  {Math.round(totalAsset).toLocaleString()}원
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-400 text-xs">총 수익률</Text>
                <Text
                  className={`font-bold text-lg ${
                    totalProfitRate >= 0 ? "text-red-500" : "text-blue-500"
                  }`}
                >
                  {totalProfitRate >= 0 ? "+" : ""}
                  {totalProfitRate.toFixed(2)}%
                </Text>
              </View>
            </View>

            {myStocks.map((stock) => (
              <View
                key={stock.id}
                className="flex-row items-center justify-between py-2 border-t border-gray-50"
              >
                <View>
                  <Text className="text-gray-700 font-medium">{stock.name}</Text>
                  <Text className="text-gray-400 text-xs">
                    {stock.symbol} · {stock.quantity}주 · 매입 {stock.purchasePrice.toLocaleString()}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-700 font-medium">
                    {stock.currentPrice?.toLocaleString()}
                  </Text>
                  <Text
                    className={`text-xs ${
                      (stock.profitRate ?? 0) >= 0 ? "text-red-500" : "text-blue-500"
                    }`}
                  >
                    {(stock.profitRate ?? 0) >= 0 ? "+" : ""}
                    {stock.profitRate?.toFixed(2)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 관심 종목 */}
        <View className="mx-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-gray-500 text-sm">관심 종목</Text>
            <TouchableOpacity onPress={() => router.push("/invest/watchlist" as any)}>
              <Text className="text-primary-600 text-xs">+ 종목 추가</Text>
            </TouchableOpacity>
          </View>
          {watchlist.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-gray-400 text-sm">관심 종목을 추가해보세요</Text>
            </View>
          ) : (
            watchlist.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-gray-800 font-medium">{item.name}</Text>
                  <Text className="text-gray-400 text-xs">{item.symbol} · {item.market}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-800 font-medium">
                    {item.currentPrice?.toLocaleString() ?? "-"}
                  </Text>
                  <Text
                    className={`text-xs ${
                      (item.changeRate ?? 0) >= 0 ? "text-red-500" : "text-blue-500"
                    }`}
                  >
                    {(item.changeRate ?? 0) >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(item.changeRate ?? 0).toFixed(2)}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
