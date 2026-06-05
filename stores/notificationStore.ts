import { create } from "zustand";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationState {
  expoPushToken: string | null;
  registerForPushNotifications: (userId: string) => Promise<void>;
  scheduleLocalNotification: (
    title: string,
    body: string,
    triggerSeconds: number
  ) => Promise<string>;
  cancelNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  expoPushToken: null,

  registerForPushNotifications: async (userId) => {
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.expoProjectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    set({ expoPushToken: token });

    await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", userId);
  },

  scheduleLocalNotification: async (title, body, triggerSeconds) => {
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { seconds: triggerSeconds },
    });
  },

  cancelNotification: async (id) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  },
}));
