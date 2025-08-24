import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import ChoiceGroup from "../../../src/components/ChoiceGroup";
import { CLUB_TYPE_OPTIONS } from "../../../src/constants/clubTypes";
import { insertClub } from "../../../src/db/clubs";

export default function ClubNewScreen() {
  const [label, setLabel] = useState<string>("");
  const [type, setType] = useState<string>(CLUB_TYPE_OPTIONS[0].value);
  const [loft, setLoft] = useState<string>("");
  const [sort, setSort] = useState<string>("999");

  const canSave = label.trim().length > 0;

  const onSave = async () => {
    if (!canSave) return;
    try {
      await insertClub({
        label,
        type,
        sort: Number(sort) || 999,
        loft: loft ? parseFloat(loft) : null,
      });
      Alert.alert("저장됨", "클럽이 추가되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "저장하지 못했습니다.");
    }
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>클럽 추가</Text>

      <Text style={{ fontWeight: "700" }}>표시 이름 *</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="예: Stealth2 Driver"
        style={inputStyle}
      />

      <ChoiceGroup
        title="타입"
        options={CLUB_TYPE_OPTIONS}
        value={type}
        onChange={setType}
      />

      <Text style={{ fontWeight: "700" }}>로프트(°)</Text>
      <TextInput
        value={loft}
        onChangeText={setLoft}
        keyboardType="numeric"
        placeholder="예: 10.5"
        style={inputStyle}
      />

      <Text style={{ fontWeight: "700" }}>정렬 우선순위(작을수록 위)</Text>
      <TextInput
        value={sort}
        onChangeText={setSort}
        keyboardType="numeric"
        placeholder="예: 1"
        style={inputStyle}
      />

      <Pressable
        onPress={onSave}
        disabled={!canSave}
        style={{
          backgroundColor: canSave ? "#2E7D32" : "#93C5AA",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>저장</Text>
      </Pressable>
    </View>
  );
}
