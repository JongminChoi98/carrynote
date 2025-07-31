import { View, Text, StyleSheet } from "react-native";
import { getDbInfo } from "../src/db/db";
import { useEffect, useState } from "react";

export default function Settings() {
  const [info, setInfo] = useState<any>(null);
  useEffect(() => { getDbInfo().then(setInfo); }, []);
  return (
    <View style={s.wrap}>
      <Text style={s.h1}>설정</Text>
      <Text style={s.p}>DB 버전: {info?.schemaVersion ?? "-"}</Text>
      <Text style={s.p}>클럽 수: {info?.clubCount ?? "-"}</Text>
      <Text style={s.p}>샷 수: {info?.shotCount ?? "-"}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0F3A2F", padding: 20 },
  h1: { color: "#F7F5EE", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  p: { color: "#F7F5EE", marginTop: 6 },
});
