import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function sendExpoPush(messages: PushPayload[]) {
  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
    },
    body: JSON.stringify(messages),
  });
  return res.json();
}

serve(async (req) => {
  const { userIds, title, body, data } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("push_token")
    .in("id", userIds)
    .not("push_token", "is", null);

  if (!profiles || profiles.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const messages: PushPayload[] = profiles
    .filter((p: any) => p.push_token?.startsWith("ExponentPushToken"))
    .map((p: any) => ({ to: p.push_token, title, body, data }));

  const result = await sendExpoPush(messages);
  return new Response(JSON.stringify({ sent: messages.length, result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
