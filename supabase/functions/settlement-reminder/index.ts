// 정산 알림: 매일 오전 10시, 오후 8시 실행 (Supabase cron 설정 필요)
// Cron: "0 1,11 * * *" (UTC 기준 → KST 10:00, 20:00)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: settlements } = await supabase
    .from("settlements")
    .select(`
      id, total_amount,
      target:target_user_id(push_token, display_name),
      requester:requester_id(display_name)
    `)
    .in("status", ["pending"]);

  if (!settlements || settlements.length === 0) {
    return new Response("no pending settlements", { status: 200 });
  }

  const messages = settlements
    .filter((s: any) => s.target?.push_token?.startsWith("ExponentPushToken"))
    .map((s: any) => ({
      to: s.target.push_token,
      title: "💸 정산 요청",
      body: `${s.requester.display_name}님이 ${s.total_amount.toLocaleString()}원 정산을 요청했어요`,
      data: { settlementId: s.id, screen: "finance/settlement" },
    }));

  if (messages.length > 0) {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  }

  return new Response(JSON.stringify({ notified: messages.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
