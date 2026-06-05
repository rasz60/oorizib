// 일정 알림: 매 10분마다 실행
// Cron: "*/10 * * * *"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const REMIND_WINDOWS: Record<string, number> = {
  "1day": 24 * 60,
  "30min": 30,
  "10min": 10,
};

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date();
  const messages: any[] = [];

  for (const [key, minutes] of Object.entries(REMIND_WINDOWS)) {
    const targetTime = new Date(now.getTime() + minutes * 60 * 1000);
    const from = new Date(targetTime.getTime() - 5 * 60 * 1000).toISOString();
    const to = new Date(targetTime.getTime() + 5 * 60 * 1000).toISOString();

    const { data: schedules } = await supabase
      .from("schedules")
      .select(`
        id, title, start_at,
        schedule_participants(user_id),
        profiles!schedules_creator_id_fkey(push_token)
      `)
      .gte("start_at", from)
      .lte("start_at", to)
      .contains("remind_options", [key]);

    for (const schedule of schedules ?? []) {
      const userIds = (schedule as any).schedule_participants.map(
        (p: any) => p.user_id
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("push_token")
        .in("id", userIds)
        .not("push_token", "is", null);

      for (const p of profiles ?? []) {
        if ((p as any).push_token?.startsWith("ExponentPushToken")) {
          messages.push({
            to: (p as any).push_token,
            title: "📅 일정 알림",
            body: `${key === "1day" ? "내일" : key === "30min" ? "30분 후" : "10분 후"} - ${(schedule as any).title}`,
            data: { scheduleId: (schedule as any).id },
          });
        }
      }
    }
  }

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
