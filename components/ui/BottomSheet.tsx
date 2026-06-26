import { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** 화면 하단에서 올라오는 공통 bottom modal (iOS/Android/Web 대응). */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          className="bg-white rounded-t-3xl px-5 pt-3 pb-8"
          onPress={(e) => e.stopPropagation()}
        >
          {/* 핸들 */}
          <View className="items-center mb-3">
            <View className="w-10 h-1.5 rounded-full bg-gray-200" />
          </View>
          {title ? (
            <Text className="text-lg font-bold text-gray-900 mb-4">{title}</Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
