import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function ExampleScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>✨ 예시 화면</Text>

      {/* 로그인 페이지로 이동 */}
      <Button title="로그인으로 이동" onPress={() => router.push("/login")} />
    </View>
  );
}
