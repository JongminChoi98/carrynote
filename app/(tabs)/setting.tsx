import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import ChoiceGroup from "../../src/components/ChoiceGroup";
import {
  getUnitPrefs,
  setHasOnboarded,
  setUnitPrefs,
  type DistanceUnit,
  type SpeedUnit,
} from "../../src/db/settings";

export default function SettingScreen() {
  const [distance, setDistance] = useState<DistanceUnit>("yard");
  const [speed, setSpeed] = useState<SpeedUnit>("mph");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 현재 저장된 단위 불러오기
  useEffect(() => {
    (async () => {
      const prefs = await getUnitPrefs();
      setDistance(prefs.distance);
      setSpeed(prefs.speed);
      setLoading(false);
    })();
  }, []);

  const saveUnits = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await setUnitPrefs({ distance, speed });
      Alert.alert(
        "저장 완료",
        `거리: ${distance === "yard" ? "야드" : "미터"}, 속도: ${speed}`
      );
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "단위를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const resetOnboarding = async () => {
    await setHasOnboarded(false); // 플래그를 false로 변경
    router.replace("/onboarding"); // 온보딩 화면으로 이동
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#6B7280" }}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "800", marginTop: 6 }}>
        환경설정
      </Text>
      <Text style={{ color: "#6B7280" }}>앱 단위 설정을 변경할 수 있어요.</Text>

      {/* 거리 단위 */}
      <ChoiceGroup
        title="거리 단위"
        options={[
          { label: "야드 (yd)", value: "yard" as DistanceUnit },
          { label: "미터 (m)", value: "meter" as DistanceUnit },
        ]}
        value={distance}
        onChange={setDistance}
      />

      {/* 속도 단위 */}
      <ChoiceGroup
        title="속도 단위"
        options={[
          { label: "mph", value: "mph" as SpeedUnit },
          { label: "m/s", value: "mps" as SpeedUnit },
        ]}
        value={speed}
        onChange={setSpeed}
      />

      {/* 저장 버튼 */}
      <Pressable
        onPress={saveUnits}
        disabled={saving}
        style={{
          backgroundColor: saving ? "#93C5AA" : "#2E7D32",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>
          {saving ? "저장 중..." : "단위 저장"}
        </Text>
      </Pressable>

      {/* 구분선 */}
      <View
        style={{ height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 }}
      />

      {/* 테스트용 온보딩 버튼 */}
      <Pressable
        onPress={resetOnboarding}
        style={{
          backgroundColor: "#2563EB",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>
          온보딩 다시 보기 (TEST)
        </Text>
      </Pressable>
    </View>
  );
}
