import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "700" }}>🏠 홈</Text>

      <Pressable
        onPress={() => router.push("/shot-new")}
        style={{
          backgroundColor: "#2E7D32",
          paddingVertical: 14,
          paddingHorizontal: 18,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>바로 기록하기</Text>
      </Pressable>
    </View>
  );
}
