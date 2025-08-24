import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import ChoiceGroup from "../../src/components/ChoiceGroup";
import { getAllClubs, type ClubRow } from "../../src/db/clubs";
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
  const [clubs, setClubs] = useState<ClubRow[]>([]);

  // 최초 로드: 단위 + 초기 클럽 목록
  useEffect(() => {
    (async () => {
      const prefs = await getUnitPrefs();
      setDistance(prefs.distance);
      setSpeed(prefs.speed);
      setClubs(await getAllClubs());
      setLoading(false);
    })();
  }, []);

  // ✅ 포커스가 돌아올 때마다 클럽 목록 새로고침
  const refreshClubs = useCallback(async () => {
    setClubs(await getAllClubs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      // settings 화면이 다시 보이면 리프레시
      refreshClubs();
    }, [refreshClubs])
  );

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
    await setHasOnboarded(false);
    router.replace("/onboarding");
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

      {/* ========== 클럽 관리 섹션 ========== */}
      <View
        style={{ height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 }}
      />
      <Text style={{ fontSize: 18, fontWeight: "800" }}>내 클럽 관리</Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#6B7280" }}>
          추가/편집은 여기서도 바로 할 수 있어요.
        </Text>
        <Pressable
          onPress={() => {
            // ❌ await 필요 없음: push는 Promise를 반환하지 않아요.
            router.push("/clubs/new");
            // 저장은 새 화면에서 이뤄지므로, 여기서 즉시 refresh하지 말고
            // ✅ 돌아왔을 때 useFocusEffect로 자동 새로고침
          }}
          style={{
            backgroundColor: "#2E7D32",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>클럽 추가</Text>
        </Pressable>
      </View>

      <FlatList
        data={clubs}
        keyExtractor={(c) => String(c.id)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 10,
              padding: 10,
              backgroundColor: "#fff",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text style={{ fontWeight: "800" }}>{item.label}</Text>
                <Text style={{ color: "#6B7280" }}>
                  {item.type}
                  {item.loft ? ` • ${item.loft}°` : ""} • sort {item.sort}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  router.push(`/clubs/${item.id}`);
                  // 편집 후 돌아오면 useFocusEffect가 자동 갱신
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  backgroundColor: "#E5E7EB",
                }}
              >
                <Text style={{ fontWeight: "700" }}>편집</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

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
