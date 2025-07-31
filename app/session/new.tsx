import { View, Text, StyleSheet, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { insertQuickShot } from "../../src/db/db";

export default function NewSession() {
  const [clubType, setClubType] = useState("7I");
  const [carry, setCarry] = useState("");
  const [total, setTotal] = useState("");

  const save = async () => {
    const carryNum = Number(carry);
    const totalNum = Number(total);
    if (Number.isNaN(carryNum) || Number.isNaN(totalNum)) return;
    await insertQuickShot({ clubType, carry_m: carryNum, total_m: totalNum });
    router.back();
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>새 샷 기록</Text>
      <Text style={s.label}>클럽</Text>
      <View style={s.pill}><Text style={s.pillText}>{clubType}</Text></View>
      <Text style={s.label}>캐리 (m)</Text>
      <TextInput style={s.input} keyboardType="numeric" value={carry} onChangeText={setCarry} placeholder="예: 150" placeholderTextColor="#9fb0a9" />
      <Text style={s.label}>토탈 (m)</Text>
      <TextInput style={s.input} keyboardType="numeric" value={total} onChangeText={setTotal} placeholder="예: 160" placeholderTextColor="#9fb0a9" />
      <Pressable style={s.btn} onPress={save}><Text style={s.btnText}>저장</Text></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, backgroundColor: "#0F3A2F" },
  title: { color: "#F7F5EE", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  label: { color: "#F7F5EE", marginTop: 12 },
  input: { backgroundColor: "#11473a", color: "#F7F5EE", padding: 12, borderRadius: 10, marginTop: 6 },
  pill: { backgroundColor: "#11473a", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, alignSelf: "flex-start" },
  pillText: { color: "#F7F5EE" },
  btn: { backgroundColor: "#2E7D32", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 18 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
