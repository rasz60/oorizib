import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { WishlistItem } from "@/types";

const STATUS_LABEL: Record<WishlistItem["status"], string> = {
  voting: "투표 중",
  approved: "승인됨",
  rejected: "반려",
  purchased: "구매 완료",
};

const STATUS_COLOR: Record<WishlistItem["status"], string> = {
  voting: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  purchased: "bg-gray-100 text-gray-500",
};

export default function WishlistScreen() {
  const { activeGroup } = useGroupStore();
  const { profile } = useAuthStore();
  const router = useRouter();

  const { data: items = [], refetch } = useQuery<WishlistItem[]>({
    queryKey: ["wishlist", activeGroup?.id],
    queryFn: async () => {
      if (!activeGroup) return [];
      const { data } = await supabase
        .from("wishlist_items")
        .select("*, wishlist_voters(user_id), wishlist_votes(user_id, vote)")
        .eq("group_id", activeGroup.id)
        .order("created_at", { ascending: false });
      return (data ?? []).map((w: any) => ({
        id: w.id,
        groupId: w.group_id,
        creatorId: w.creator_id,
        title: w.title,
        reason: w.reason,
        estimatedPrice: w.estimated_price,
        link: w.link,
        voteDeadline: w.vote_deadline,
        purchaseDate: w.purchase_date,
        status: w.status,
        voters: (w.wishlist_voters ?? []).map((v: any) => ({ id: v.user_id })),
        votes: (w.wishlist_votes ?? []).map((v: any) => ({
          userId: v.user_id,
          vote: v.vote,
        })),
      }));
    },
    enabled: !!activeGroup,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-gray-800">위시리스트</Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-lg px-4 py-2"
          onPress={() => router.push("/wishlist/create" as any)}
        >
          <Text className="text-white text-sm font-medium">+ 추가</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-6"
        renderItem={({ item }) => {
          const approveCount = item.votes.filter((v) => v.vote === "approve").length;
          const voterCount = item.voters.length;
          const myVote = item.votes.find((v) => v.userId === profile?.id);
          const canVote =
            item.status === "voting" &&
            item.voters.some((v: any) => v.id === profile?.id) &&
            !myVote;

          return (
            <TouchableOpacity
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              onPress={() => router.push(`/wishlist/${item.id}` as any)}
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-gray-800 font-semibold flex-1 mr-2">
                  {item.title}
                </Text>
                <View className={`rounded-full px-2 py-0.5 ${STATUS_COLOR[item.status]}`}>
                  <Text className={`text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>

              {item.reason && (
                <Text className="text-gray-500 text-sm mb-2">{item.reason}</Text>
              )}

              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-3">
                  {item.estimatedPrice && (
                    <Text className="text-gray-400 text-xs">
                      예상 {item.estimatedPrice.toLocaleString()}원
                    </Text>
                  )}
                  {item.voteDeadline && (
                    <Text className="text-gray-400 text-xs">
                      ~{format(new Date(item.voteDeadline), "M/d")}
                    </Text>
                  )}
                </View>
                {voterCount > 0 && (
                  <Text className="text-gray-500 text-xs">
                    찬성 {approveCount}/{voterCount}
                  </Text>
                )}
              </View>

              {canVote && (
                <View className="flex-row gap-2 mt-3">
                  <TouchableOpacity
                    className="flex-1 bg-green-500 rounded-lg py-2 items-center"
                    onPress={async (e) => {
                      e.stopPropagation();
                      await supabase.from("wishlist_votes").insert({
                        wishlist_item_id: item.id,
                        user_id: profile!.id,
                        vote: "approve",
                      });
                      refetch();
                    }}
                  >
                    <Text className="text-white font-medium text-sm">👍 찬성</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-red-400 rounded-lg py-2 items-center"
                    onPress={async (e) => {
                      e.stopPropagation();
                      await supabase.from("wishlist_votes").insert({
                        wishlist_item_id: item.id,
                        user_id: profile!.id,
                        vote: "reject",
                      });
                      refetch();
                    }}
                  >
                    <Text className="text-white font-medium text-sm">👎 반대</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-gray-400 text-base">위시리스트가 비었어요</Text>
            <Text className="text-gray-300 text-sm mt-1">갖고 싶은 것을 추가해보세요!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
