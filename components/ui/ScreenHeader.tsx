import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { CaretLeft } from "phosphor-react-native";

type ScreenHeaderProps = {
  title?: string;
  /** 뒤로가기 버튼 표시 (기본 true) */
  back?: boolean;
};

/** 화면 상단 공통 헤더: 뒤로가기 + 제목. */
export function ScreenHeader({ title, back = true }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="mb-6">
      {back && (
        <TouchableOpacity
          className="flex-row items-center mb-4 -ml-1"
          onPress={() => router.back()}
          hitSlop={8}
        >
          <CaretLeft size={22} color="#4f46e5" weight="bold" />
          <Text className="text-primary-600 ml-0.5">뒤로</Text>
        </TouchableOpacity>
      )}
      {title ? (
        <Text className="text-2xl font-bold text-gray-900">{title}</Text>
      ) : null}
    </View>
  );
}
