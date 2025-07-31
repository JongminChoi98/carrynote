import { Link } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={s.container}>
      <Text style={s.title}>CarryNote</Text>
      <View style={{ height: 16 }} />
      <Link href="/onboarding" asChild>
        <Pressable style={s.btn}><Text style={s.btnText}>온보딩 시작</Text></Pressable>
      </Link>
      <View style={{ height: 8 }} />
      <Link href="/session/new" asChild>
        <Pressable style={s.btn}><Text style={s.btnText}>오늘 세션 시작</Text></Pressable>
      </Link>
      <View style={{ height: 8 }} />
      <Link href="/settings" asChild>
        <Pressable style={s.btnGhost}><Text style={s.btnGhostText}>설정</Text></Pressable>
      </Link>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F3A2F", alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "#F7F5EE", fontSize: 28, fontWeight: "700" },
  btn: { backgroundColor: "#2E7D32", paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, minWidth: 220, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnGhost: { borderWidth: 1, borderColor: "#F7F5EE", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, minWidth: 220, alignItems: "center" },
  btnGhostText: { color: "#F7F5EE", fontSize: 16, fontWeight: "600" },
});
