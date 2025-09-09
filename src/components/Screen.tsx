import React, { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

/**
 * 모든 화면에서 공통으로 쓰는 래퍼.
 * - scroll: true면 ScrollView(폼/설정 화면에 추천), false면 그냥 View
 * - keyboard: true면 KeyboardAvoidingView 사용 (입력 화면 추천)
 * - contentPadding: 내부 기본 패딩
 * - contentStyle: 내부 컨테이너 스타일 확장
 */

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean; // 기본 true (폼/설정 화면)
  keyboard?: boolean; // 기본 true (입력 화면)
  contentPadding?: number; // 기본 20
  contentStyle?: StyleProp<ViewStyle>;
  keyboardDismissOnDrag?: boolean; // 기본 true (iOS에서 드래그로 키보드 닫기)
};

export default function Screen({
  children,
  scroll = false,
  keyboard = true,
  contentPadding = 20,
  contentStyle,
  keyboardDismissOnDrag = true,
}: ScreenProps) {
  const Inner = () => {
    if (scroll) {
      return (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            { padding: contentPadding, paddingBottom: 24 },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={keyboardDismissOnDrag ? "on-drag" : "none"}
        >
          {children}
        </ScrollView>
      );
    }
    return (
      <View style={[{ flex: 1, padding: contentPadding }, contentStyle]}>
        {children}
      </View>
    );
  };

  if (!keyboard) {
    return <Inner />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <Inner />
    </KeyboardAvoidingView>
  );
}

/** FlatList 등 "리스트 화면"에서 재사용할 기본 contentContainerStyle */
export const listContent = {
  paddingHorizontal: 20,
  paddingBottom: 24,
};
