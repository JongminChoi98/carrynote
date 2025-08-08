import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function LoginScreen() {
  const onComplete = () => {
    router.replace("/");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>🔐 로그인 화면</Text>
      <Button title="로그인 완료" onPress={onComplete} />
    </View>
  );
}
