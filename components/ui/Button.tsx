import { ReactNode } from "react";
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Variant = "primary" | "secondary" | "outline";
type Size = "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  /** 라벨 앞에 표시할 아이콘 (Phosphor 아이콘 등) */
  icon?: ReactNode;
  /** 부모 폭을 가득 채울지 (기본 true) */
  fullWidth?: boolean;
  className?: string;
};

const containerByVariant: Record<Variant, string> = {
  primary: "bg-primary-600",
  secondary: "bg-primary-50",
  outline: "bg-white border border-primary-600",
};

const textByVariant: Record<Variant, string> = {
  primary: "text-white",
  secondary: "text-primary-700",
  outline: "text-primary-600",
};

const containerBySize: Record<Size, string> = {
  md: "py-3 px-5",
  lg: "py-4 px-6",
};

/**
 * 카카오뱅크 스타일의 둥근 버튼. primary/secondary/outline 변형 지원.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  className = "",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      className={`rounded-2xl items-center justify-center flex-row ${
        containerByVariant[variant]
      } ${containerBySize[size]} ${fullWidth ? "w-full" : ""} ${
        isDisabled ? "opacity-50" : ""
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#ffffff" : "#4f46e5"}
        />
      ) : (
        <View className="flex-row items-center">
          {icon ? <View className="mr-2">{icon}</View> : null}
          <Text className={`font-semibold text-base ${textByVariant[variant]}`}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
