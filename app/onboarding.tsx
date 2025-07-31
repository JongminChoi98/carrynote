import { View, Text, Pressable, StyleSheet, Switch } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { createDefaultBagAndClubs, setUnitPrefs } from "../src/db/db";

export default function Onboarding() {
  const [yard, setYard] = useState(true);
  const [mph, setMph] = useState(true);

  const onDone = async () => {
    await setUnitPrefs({ distance: yard ? "yard" : "meter", speed: mph ? "mph" : "mps" });
    await createDefaultBagAndClubs();
    router.replace("/");
  };

  return (
    <View style={s.wrap}>
      <Text style={s.h1}>기록하면 늘어난다</Text>
      <View style={{ height: 12 }} />
      <View style={s.row}>
        <Text style={s.label}>거리 단위 (Yard)</Text>
        <Switch value={yard} onValueChange={setYard} />
      </View>
      <View style={s.row}>
        <Text style={s.label}>속도 단위 (mph)</Text>
        <Switch value={mph} onValueChange={setMph} />
      </View>
      <View style={{ height: 24 }} />
      <Pressable onPress={onDone} style={s.btn}><Text style={s.btnText}>시작하기</Text></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: "#0F3A2F", justifyContent: "center" },
  h1: { color: "#F7F5EE", fontSize: 24, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  label: { color: "#F7F5EE", fontSize: 16 },
  btn: { backgroundColor: "#2E7D32", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" }
});
