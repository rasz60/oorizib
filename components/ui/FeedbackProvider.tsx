import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { Modal, Text, View } from "react-native";
import { CheckCircle, WarningCircle, Info } from "phosphor-react-native";
import { Button } from "./Button";

type FeedbackType = "success" | "error" | "info";

type FeedbackOptions = {
  title: string;
  message?: string;
  type?: FeedbackType;
  confirmText?: string;
  /** 확인 버튼을 누른 뒤 실행 (예: 화면 이동) */
  onConfirm?: () => void;
};

type FeedbackContextValue = {
  show: (options: FeedbackOptions) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const ICON_SIZE = 44;

function FeedbackIcon({ type }: { type: FeedbackType }) {
  if (type === "success")
    return <CheckCircle size={ICON_SIZE} color="#16a34a" weight="fill" />;
  if (type === "error")
    return <WarningCircle size={ICON_SIZE} color="#dc2626" weight="fill" />;
  return <Info size={ICON_SIZE} color="#4f46e5" weight="fill" />;
}

/**
 * 플랫폼 공통(iOS/Android/Web) 안내 메시지 창.
 * react-native 의 Alert 는 웹에서 동작하지 않으므로 Modal 기반으로 직접 구현한다.
 * 액션 완료 시 안내 + 확인 버튼 → onConfirm(예: redirect)을 지원한다.
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<FeedbackOptions | null>(null);

  const show = useCallback((opts: FeedbackOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    const cb = options?.onConfirm;
    // 닫기 애니메이션 이후 콜백 실행
    setTimeout(() => cb?.(), 0);
  }, [options]);

  const type = options?.type ?? "info";

  return (
    <FeedbackContext.Provider value={{ show }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleConfirm}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          <View className="bg-white rounded-3xl w-full max-w-sm px-6 pt-7 pb-6 items-center">
            <FeedbackIcon type={type} />
            <Text className="text-lg font-bold text-gray-900 mt-4 text-center">
              {options?.title}
            </Text>
            {options?.message ? (
              <Text className="text-gray-500 text-center mt-2 leading-5">
                {options.message}
              </Text>
            ) : null}
            <View className="w-full mt-6">
              <Button
                label={options?.confirmText ?? "확인"}
                onPress={handleConfirm}
              />
            </View>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return ctx;
}
