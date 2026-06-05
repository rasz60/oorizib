export const APP_NAME = "Oorizib";

export const NOTIFICATION_TRIGGERS = {
  SCHEDULE_1_DAY: 24 * 60 * 60,
  SCHEDULE_30_MIN: 30 * 60,
  SCHEDULE_10_MIN: 10 * 60,
} as const;

export const SETTLEMENT_REMINDER_TIMES = ["10:00", "20:00"] as const;

export const EXPENSE_CATEGORIES = [
  { id: "food", label: "식비", icon: "🍽️" },
  { id: "transport", label: "교통", icon: "🚗" },
  { id: "shopping", label: "쇼핑", icon: "🛍️" },
  { id: "medical", label: "의료", icon: "🏥" },
  { id: "education", label: "교육", icon: "📚" },
  { id: "culture", label: "문화/여가", icon: "🎭" },
  { id: "insurance", label: "보험", icon: "🛡️" },
  { id: "housing", label: "주거/관리비", icon: "🏠" },
  { id: "communication", label: "통신", icon: "📱" },
  { id: "savings", label: "저축/투자", icon: "💰" },
  { id: "etc", label: "기타", icon: "📌" },
] as const;

export const MERCHANT_CATEGORY_MAP: Record<string, string> = {
  스타벅스: "food",
  배달의민족: "food",
  쿠팡이츠: "food",
  올리브영: "shopping",
  쿠팡: "shopping",
  CGV: "culture",
  롯데시네마: "culture",
  GS칼텍스: "transport",
  SK에너지: "transport",
};

export const KIS_BASE_URL = {
  real: "https://openapi.koreainvestment.com:9443",
  mock: "https://openapivts.koreainvestment.com:29443",
} as const;

export const OPEN_BANKING_BASE_URL =
  "https://testapi.openbanking.or.kr" as const;

export const MEAL_TYPES = [
  { id: "breakfast", label: "아침" },
  { id: "lunch", label: "점심" },
  { id: "dinner", label: "저녁" },
  { id: "latenight", label: "야식" },
  { id: "snack", label: "간식" },
] as const;

export const TOURNAMENT_MAX_ENTRIES = 8 as const;
