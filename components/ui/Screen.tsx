import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  /** 스크롤 가능한 화면이면 true (기본 false) */
  scroll?: boolean;
  /** 좌우/상하 기본 여백 적용 여부 (기본 true) */
  padded?: boolean;
  /** 배경색 tailwind 클래스 (기본 bg-gray-50) */
  bg?: string;
  /** 내부 컨테이너에 추가할 클래스 */
  className?: string;
  /** 콘텐츠를 세로 가운데 정렬 (스크롤 아닐 때) */
  center?: boolean;
};

/**
 * iOS/Android/Web 모두에서 동일한 SafeArea + 일관된 여백을 제공하는 화면 래퍼.
 * 모든 페이지가 이 컴포넌트를 사용해 공통 패딩을 적용한다.
 */
export function Screen({
  children,
  scroll = false,
  padded = true,
  bg = "bg-gray-50",
  className = "",
  center = false,
}: ScreenProps) {
  const padding = padded ? "px-5 py-4" : "";

  if (scroll) {
    return (
      <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${padding} ${className}`}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${bg}`} edges={["top"]}>
      <View
        className={`flex-1 ${padding} ${
          center ? "justify-center" : ""
        } ${className}`}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}
