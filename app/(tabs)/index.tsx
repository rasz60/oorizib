import { ComponentType, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { PieChart } from "react-native-gifted-charts";
import {
  ShoppingBag,
  ChartLineUp,
  Clock,
  CheckSquare,
  ForkKnife,
  Plus,
  SignOut,
  UsersThree,
  CaretDown,
  CalendarBlank,
  Wallet,
  Check,
  type IconProps,
} from "phosphor-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useGroupStore } from "@/stores/groupStore";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Card } from "@/components/ui/Card";
import { Widget } from "@/components/ui/Widget";
import { Colors, Radius, Typography } from "@/constants/theme";
import { EXPENSE_CATEGORIES } from "@/constants";

type Shortcut = {
  label: string;
  route: string;
  Icon: ComponentType<IconProps>;
  color: string;
  bg: string;
};

// 일정/가계부는 위젯으로 분리했으므로 바로가기에서 제외
const SHORTCUTS: Shortcut[] = [
  { label: "위시리스트", route: "/(tabs)/wishlist", Icon: ShoppingBag, color: "#db2777", bg: "bg-pink-50" },
  { label: "재테크",    route: "/(tabs)/invest", Icon: ChartLineUp, color: "#ea580c", bg: "bg-orange-50" },
  { label: "언제와?",   route: "/utility/when-coming", Icon: Clock, color: "#0891b2", bg: "bg-cyan-50" },
  { label: "했어?",     route: "/utility/did-you-do", Icon: CheckSquare, color: "#7c3aed", bg: "bg-violet-50" },
  { label: "뭐먹지?",   route: "/utility/what-to-eat", Icon: ForkKnife, color: "#d97706", bg: "bg-amber-50" },
];

const PIE_COLORS = ["#9B8EC4", "#F4A261", "#6BCB8B", "#E07070", "#6CA0DC", "#DAB910"];

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

export default function HomeScreen() {
  const { profile, signOut } = useAuthStore();
  const { activeGroup, groups, setActiveGroup } = useGroupStore();
  const router = useRouter();

  const [groupSheet, setGroupSheet] = useState(false);
  const [memberSheet, setMemberSheet] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const month = format(new Date(), "yyyy-MM");

  const { data: todaySchedules = [] } = useQuery({
    queryKey: ["home-schedules", activeGroup?.id, today],
    queryFn: async () => {
      if (!activeGroup) return [];
      const { data } = await supabase
        .from("schedules")
        .select("id, title, start_at, is_all_day, color")
        .eq("group_id", activeGroup.id)
        .gte("start_at", `${today}T00:00:00`)
        .lte("start_at", `${today}T23:59:59`)
        .order("start_at");
      return data ?? [];
    },
    enabled: !!activeGroup,
  });

  const { data: monthTx = [] } = useQuery({
    queryKey: ["home-finance", activeGroup?.id, month],
    queryFn: async () => {
      if (!activeGroup) return [];
      const { data } = await supabase
        .from("transactions")
        .select("type, amount, category")
        .eq("group_id", activeGroup.id)
        .gte("transacted_at", `${month}-01`)
        .lte("transacted_at", `${month}-31`);
      return data ?? [];
    },
    enabled: !!activeGroup,
  });

  // 계좌 잔고 = 그룹 전체 누적 수입 - 누적 지출
  const { data: balance = 0 } = useQuery({
    queryKey: ["home-balance", activeGroup?.id],
    queryFn: async () => {
      if (!activeGroup) return 0;
      const { data } = await supabase
        .from("transactions")
        .select("type, amount")
        .eq("group_id", activeGroup.id);
      return (data ?? []).reduce(
        (s: number, t: any) => s + (t.type === "income" ? t.amount : -t.amount),
        0
      );
    },
    enabled: !!activeGroup,
  });

  const income = monthTx
    .filter((t: any) => t.type === "income")
    .reduce((s: number, t: any) => s + t.amount, 0);
  const expense = monthTx
    .filter((t: any) => t.type === "expense")
    .reduce((s: number, t: any) => s + t.amount, 0);

  // 사용처(지출 카테고리) 도넛 데이터
  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
    label: cat.label,
    total: monthTx
      .filter((t: any) => t.type === "expense" && t.category === cat.id)
      .reduce((s: number, t: any) => s + t.amount, 0),
  })).filter((c) => c.total > 0);

  const pieData = categoryTotals.map((c, i) => ({
    value: c.total,
    label: c.label,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  if (!activeGroup) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <UsersThree size={40} color={Colors.primary} weight="duotone" />
          </View>
          <Text style={styles.emptyTitle}>아직 그룹이 없어요</Text>
          <Text style={styles.emptyDesc}>
            가족 그룹을 만들거나{"\n"}초대 코드로 참여해보세요.
          </Text>
          <Button
            label="그룹 만들기"
            icon={<Plus size={18} color="#ffffff" weight="bold" />}
            onPress={() => router.push("/group/create")}
            className="mb-3"
          />
          <Button
            label="초대 코드로 참여"
            variant="outline"
            onPress={() => router.push("/group/join")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const members = activeGroup.members;
  const previewMembers = members.slice(0, 3);
  const extraCount = Math.max(0, members.length - 3);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.greeting}>
              안녕하세요, {profile?.displayName}님 👋
            </Text>
            <TouchableOpacity onPress={signOut} style={styles.row} hitSlop={8}>
              <SignOut size={16} color="#ffffff" />
              <Text style={styles.logoutText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={groups.length > 1 ? 0.7 : 1}
            onPress={() => groups.length > 1 && setGroupSheet(true)}
            hitSlop={8}
          >
            <Text style={styles.groupName}>{activeGroup.name}</Text>
            {groups.length > 1 && (
              <CaretDown size={16} color="#ffffff" weight="bold" style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
          <View style={styles.headerMember}>
            <UsersThree size={16} color="#ffffff" weight="duotone" style={{ marginRight: 6 }} />
            <TouchableOpacity activeOpacity={0.7} style={styles.row} onPress={() => setMemberSheet(true)}>
              {previewMembers.map((m, i) => (
                <View
                  key={m.id}
                  style={[styles.avatar, { marginLeft: i === 0 ? 0 : -10 }]}
                >
                  <Text style={styles.avatarText}>{m.profile.displayName[0]}</Text>
                </View>
              ))}
              {extraCount > 0 && (
                <View style={[styles.avatar, styles.avatarExtra, { marginLeft: -10 }]}>
                  <Text style={styles.avatarExtraText}>+{extraCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 일정 위젯 */}
        <Widget>
          <View style={styles.widgetHeader}>
            <CalendarBlank size={16} color={Colors.textSub} weight="duotone" />
            <Text style={styles.widgetTitle}>오늘 일정</Text>
          </View>
          <Card onPress={() => router.push("/(tabs)/calendar")}>
            {todaySchedules.length === 0 ? (
              <Text style={styles.emptyText}>오늘 등록된 일정이 없어요.</Text>
            ) : (
              todaySchedules.map((s: any) => (
                <View key={s.id} style={styles.scheduleRow}>
                  <View
                    style={[styles.dot, { backgroundColor: s.color ?? Colors.primary }]}
                  />
                  <Text style={styles.scheduleTitle} numberOfLines={1}>
                    {s.title}
                  </Text>
                  <Text style={styles.scheduleTime}>
                    {s.is_all_day ? "종일" : format(new Date(s.start_at), "HH:mm")}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </Widget>

        {/* 가계부 위젯 */}
        <Widget>
          <View style={styles.widgetHeader}>
            <Wallet size={16} color={Colors.textSub} weight="duotone" />
            <Text style={styles.widgetTitle}>이번 달 가계부</Text>
          </View>

          {/* 계좌 잔고 (full width) */}
          <Card onPress={() => router.push("/(tabs)/finance")}>
            <Text style={styles.financeLabel}>계좌 잔고</Text>
            <Text style={[styles.financeValueLg, { color: Colors.text }]}>
              {won(balance)}
            </Text>
          </Card>

          {/* 수입 / 지출 */}
          <View style={styles.financeRow}>
            <Card onPress={() => router.push("/(tabs)/finance")} style={styles.financeHalf}>
              <Text style={styles.financeLabel}>수입</Text>
              <Text style={[styles.financeValue, { color: Colors.success }]}>
                {won(income)}
              </Text>
            </Card>
            <Card onPress={() => router.push("/(tabs)/finance")} style={styles.financeHalf}>
              <Text style={styles.financeLabel}>지출</Text>
              <Text style={[styles.financeValue, { color: Colors.danger }]}>
                {won(expense)}
              </Text>
            </Card>
          </View>

          {/* 사용처 도넛 */}
          {pieData.length > 0 && (
            <Card onPress={() => router.push("/(tabs)/finance")}>
              <Text style={styles.financeLabel}>사용처</Text>
              <View style={styles.donutWrap}>
                <PieChart
                  data={pieData}
                  donut
                  radius={70}
                  innerRadius={45}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: "center" }}>
                      <Text style={styles.donutCenterLabel}>총 지출</Text>
                      <Text style={styles.donutCenterValue}>{won(expense)}</Text>
                    </View>
                  )}
                />
              </View>
              <View style={styles.legend}>
                {pieData.map((d) => (
                  <View key={d.label} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={styles.legendLabel}>{d.label}</Text>
                    <Text style={styles.legendValue}>{won(d.value)}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </Widget>

        {/* 바로가기 */}
        <Widget>
          <Text style={styles.widgetTitle}>바로가기</Text>
          <View style={styles.shortcutGrid}>
            {SHORTCUTS.map(({ label, route, Icon, color, bg }) => (
              <Card
                key={label}
                style={styles.shortcutCard}
                onPress={() => router.push(route as any)}
              >
                <View
                  className={`w-11 h-11 rounded-full ${bg} items-center justify-center mb-2`}
                >
                  <Icon size={24} color={color} weight="duotone" />
                </View>
                <Text style={styles.shortcutLabel}>{label}</Text>
              </Card>
            ))}
          </View>
        </Widget>
      </ScrollView>

      {/* 그룹 전환 bottom sheet */}
      <BottomSheet
        visible={groupSheet}
        onClose={() => setGroupSheet(false)}
        title="그룹 선택"
      >
        {groups.map((g) => {
          const active = g.id === activeGroup.id;
          return (
            <TouchableOpacity
              key={g.id}
              style={styles.sheetRow}
              onPress={() => {
                setActiveGroup(g);
                setGroupSheet(false);
              }}
            >
              <Text style={[styles.sheetGroupName, active && styles.sheetGroupActive]}>
                {g.name}
              </Text>
              {active && <Check size={20} color={Colors.primary} weight="bold" />}
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      {/* 가족 멤버 상세 bottom sheet */}
      <BottomSheet
        visible={memberSheet}
        onClose={() => setMemberSheet(false)}
        title={`가족 멤버 ${members.length}명`}
      >
        {members.map((m) => (
          <View key={m.id} style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.memberAvatarText}>
                {m.profile.displayName[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{m.profile.displayName}</Text>
              <Text style={styles.memberEmail}>{m.profile.email}</Text>
            </View>
            {m.role === "owner" && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>방장</Text>
              </View>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.memberRow}
          onPress={() => {
            setMemberSheet(false);
            router.push("/group/invite");
          }}
        >
          <View style={[styles.memberAvatar, styles.inviteAvatar]}>
            <Plus size={20} color={Colors.textLight} weight="bold" />
          </View>
          <Text style={styles.inviteText}>가족 초대하기</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // 빈 상태
  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: { ...Typography.h3, fontSize: 20, fontWeight: "700", marginBottom: 8 },
  emptyDesc: { ...Typography.body, color: Colors.textSub, textAlign: "center", lineHeight: 22, marginBottom: 32 },

  // 헤더
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center" },
  groupName: { color: "#ffffff", fontSize: 18, fontWeight: "700" },
  logoutText: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginLeft: 4 },
  greeting: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 8 },

  // 위젯 공통
  widgetTitle: { ...Typography.label, marginLeft: 6 },
  widgetHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

  // 가족 멤버
  headerMember: { flexDirection: "row", alignItems: "center", paddingTop: 8, paddingLeft: 8 },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Colors.primary, fontWeight: "700", fontSize: 11 },
  avatarExtra: { backgroundColor: Colors.border },
  avatarExtraText: { color: Colors.textSub, fontWeight: "700", fontSize: 12 },

  // 일정
  emptyText: { color: Colors.textSub, fontSize: 14 },
  scheduleRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: Radius.full, marginRight: 12 },
  scheduleTitle: { color: Colors.text, flex: 1 },
  scheduleTime: { color: Colors.textSub, fontSize: 13, marginLeft: 8 },

  // 가계부
  financeLabel: { color: Colors.textSub, fontSize: 12, marginBottom: 4 },
  financeValue: { fontWeight: "700", fontSize: 16, textAlign: "right" },
  financeValueLg: { fontWeight: "700", fontSize: 22, textAlign: "right" },
  financeRow: { flexDirection: "row" },
  financeHalf: { flex: 1 },
  donutWrap: { alignItems: "center", marginTop: 12, marginBottom: 12 },
  donutCenterLabel: { fontSize: 11, color: Colors.textSub },
  donutCenterValue: { fontSize: 13, fontWeight: "700", color: Colors.text },
  legend: { marginTop: 4 },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendDot: { width: 10, height: 10, borderRadius: Radius.full, marginRight: 8 },
  legendLabel: { color: Colors.textSub, fontSize: 13, flex: 1 },
  legendValue: { color: Colors.text, fontSize: 13, fontWeight: "600" },

  // 바로가기
  shortcutGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: 8, marginTop: 8 },
  shortcutCard: { width: "31%", margin: 0, marginBottom: 10, alignItems: "center" },
  shortcutLabel: { color: Colors.text, fontSize: 12, fontWeight: "500" },

  // 그룹 선택 시트
  sheetRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  sheetGroupName: { fontSize: 16, color: Colors.text },
  sheetGroupActive: { color: Colors.primary, fontWeight: "700" },

  // 멤버 상세 시트
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberAvatarText: { color: Colors.primary, fontWeight: "700", fontSize: 16 },
  memberName: { color: Colors.text, fontWeight: "600" },
  memberEmail: { color: Colors.textSub, fontSize: 13 },
  ownerBadge: { backgroundColor: Colors.primaryUltraLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  ownerBadgeText: { color: Colors.primary, fontSize: 12, fontWeight: "500" },
  inviteAvatar: { backgroundColor: Colors.border },
  inviteText: { color: Colors.textSub, fontWeight: "500" },
});