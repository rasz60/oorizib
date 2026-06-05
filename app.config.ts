import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Oorizib",
  slug: "oorizib",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "oorizib",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.oorizib.app",
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "위치 공유 기능을 위해 위치 정보가 필요합니다.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "백그라운드 위치 공유를 위해 위치 정보가 필요합니다.",
      NSCameraUsageDescription: "입금 내역 사진 등록을 위해 카메라가 필요합니다.",
      NSPhotoLibraryUsageDescription:
        "입금 내역 사진 등록을 위해 사진 라이브러리 접근이 필요합니다.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.oorizib.app",
    permissions: [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_BACKGROUND_LOCATION",
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.VIBRATE",
      "android.permission.RECEIVE_BOOT_COMPLETED",
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#6366f1",
        sounds: [],
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "위치 공유 기능을 위해 위치 정보가 필요합니다.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    expoProjectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? "fe84c35f-83c1-4138-b416-afc3836e902b",
    eas: {
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? "fe84c35f-83c1-4138-b416-afc3836e902b",
    },
  },
});
