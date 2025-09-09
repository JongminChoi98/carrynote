import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import ChoiceGroup from "../../src/components/ChoiceGroup";
import Screen from "../../src/components/Screen";
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

  // 최초 로드
  useEffect(() => {
    (async () => {
      const prefs = await getUnitPrefs();
      setDistance(prefs.distance);
      setSpeed(prefs.speed);
      setClubs(await getAllClubs());
      setLoading(false);
    })();
  }, []);

  // 돌아올 때마다 클럽 새로고침
  const refreshClubs = useCallback(async () => {
    setClubs(await getAllClubs());
  }, []);
  useFocusEffect(
    useCallback(() => {
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

  // ===== 헤더/푸터 =====
  const Header = (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        gap: 16,
      }}
    >
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

      {/* 클럽 관리 헤더 */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800" }}>내 클럽 관리</Text>
        <Pressable
          onPress={() => router.push("/clubs/new")}
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
      <Text style={{ color: "#6B7280" }}>
        추가/편집은 여기서도 바로 할 수 있어요.
      </Text>
    </View>
  );

  const Footer = (
    <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
      <View
        style={{ height: 1, backgroundColor: "#E5E7EB", marginVertical: 16 }}
      />
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

  return (
    // ✅ Screen에서 스크롤/키보드 기능 끄고, 패딩 0으로 설정
    <Screen scroll={false} keyboard={false} contentPadding={0}>
      <FlatList
        data={clubs}
        keyExtractor={(c) => String(c.id)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <View
            style={{
              marginHorizontal: 20,
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
                onPress={() => router.push(`/clubs/${item.id}`)}
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
    </Screen>
  );
}
