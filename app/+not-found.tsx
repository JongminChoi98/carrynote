import { Link, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function NotFound() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "800" }}>
        🚫 페이지를 찾을 수 없습니다
      </Text>
      <Text style={{ color: "#6B7280", textAlign: "center" }}>
        요청하신 경로가 없거나 이동되었습니다.
      </Text>

      <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: "#E5E7EB",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ fontWeight: "700" }}>이전으로</Text>
        </Pressable>

        <Link href="/" asChild>
          <Pressable
            style={{
              backgroundColor: "#2E7D32",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>홈으로</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
