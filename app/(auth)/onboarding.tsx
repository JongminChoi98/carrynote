import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import ChoiceGroup from "../../src/components/ChoiceGroup";
import {
  setHasOnboarded,
  setUnitPrefs,
  type DistanceUnit,
  type SpeedUnit,
} from "../../src/db/settings";

export default function Onboarding() {
  const [distance, setDistance] = useState<DistanceUnit>("yard");
  const [speed, setSpeed] = useState<SpeedUnit>("mph");
  const [saving, setSaving] = useState(false);

  const onDone = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setUnitPrefs({ distance, speed });
      await setHasOnboarded(true);
      router.replace("/");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 6 }}>
        기록하면 늘어난다
      </Text>
      <Text style={{ color: "#6B7280", marginBottom: 24 }}>
        단위를 선택하면 나중에 설정에서 언제든 변경할 수 있어요.
      </Text>

      <ChoiceGroup
        title="거리 단위"
        options={[
          { label: "야드 (yd)", value: "yard" as DistanceUnit },
          { label: "미터 (m)", value: "meter" as DistanceUnit },
        ]}
        value={distance}
        onChange={setDistance}
      />

      <ChoiceGroup
        title="속도 단위"
        options={[
          { label: "mph", value: "mph" as SpeedUnit },
          { label: "m/s", value: "mps" as SpeedUnit },
        ]}
        value={speed}
        onChange={setSpeed}
      />

      <Pressable
        onPress={onDone}
        disabled={saving}
        style={{
          backgroundColor: saving ? "#93C5AA" : "#2E7D32",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
          {saving ? "저장 중..." : "시작하기"}
        </Text>
      </Pressable>
    </View>
  );
}
