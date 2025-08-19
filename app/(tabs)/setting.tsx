// app/(tabs)/settings.tsx
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { setHasOnboarded } from "../../src/db/settings";

export default function SettingScreen() {
  const resetOnboarding = async () => {
    await setHasOnboarded(false); // 플래그를 false로 변경
    router.replace("/onboarding"); // 온보딩 화면으로 이동
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 24 }}>환경설정</Text>

      {/* 테스트용 온보딩 버튼 */}
      <Pressable
        onPress={resetOnboarding}
        style={{
          marginTop: 20,
          backgroundColor: "#2563EB",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>
          온보딩 다시 보기 (TEST)
        </Text>
      </Pressable>
    </View>
  );
}
