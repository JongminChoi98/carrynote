import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  contentStyle?: object;
  contentPadding?: number;
};

export default function Screen({
  children,
  scroll = false,
  keyboard = false,
  contentStyle,
  contentPadding = 20,
}: ScreenProps) {
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        contentContainerStyle: [{ padding: contentPadding }, contentStyle],
        // ✅ 인풋/버튼 탭 시엔 키보드 유지, 빈 곳 탭 시엔 닫힘
        keyboardShouldPersistTaps: "handled" as const,
        // 드래그하면 자연스럽게 닫힘
        keyboardDismissMode: "on-drag" as const,
      }
    : { style: [{ padding: contentPadding }, contentStyle] };

  const body = <Container {...(containerProps as any)}>{children}</Container>;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "right", "left"]}>
      <StatusBar barStyle="dark-content" />
      {keyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.select({ ios: "padding", android: undefined })}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}
