import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import ChoiceGroup from "../../src/components/ChoiceGroup";
import { getAllClubs } from "../../src/db/clubs";
import { getUnitPrefs } from "../../src/db/settings";
import { deleteShot, getShots, type ShotRow } from "../../src/db/shots";

// 단위 변환
const m_to_yd = (m: number) => m / 0.9144;
const mps_to_mph = (mps: number) => mps / 0.44704;

// 통계 유틸
function quantile(sorted: number[], q: number) {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}
function toStats(values: number[]) {
  if (values.length === 0)
    return { mean: NaN, median: NaN, iqr: NaN, q1: NaN, q3: NaN };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const median = quantile(sorted, 0.5);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  const iqr = q3 - q1;
  return { mean, median, iqr, q1, q3 };
}

type DisplayItem = {
  id: number;
  club: string;
  carryNum: number; // 현재 단위 수치
  totalNum: number;
  speeds?: string | null;
  smash?: string | null;
  when: string;
};

const PAGE_SIZE = 20;

export default function HistoryScreen() {
  // 단위 설정
  const [distanceUnit, setDistanceUnit] = useState<"yard" | "meter">("yard");
  const [speedUnit, setSpeedUnit] = useState<"mph" | "mps">("mph");

  // 클럽 필터
  const [clubOptions, setClubOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedClub, setSelectedClub] = useState<string>("ALL");

  // 리스트 & 페이지네이션
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 첫 진입/재진입 시: 단위/클럽 목록 로드 + 첫 페이지
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const prefs = await getUnitPrefs();
        const clubs = await getAllClubs();
        if (!alive) return;
        setDistanceUnit(prefs.distance);
        setSpeedUnit(prefs.speed);
        const opts = [
          { label: "전체", value: "ALL" },
          ...clubs.map((c) => ({ label: c.label, value: String(c.id) })),
        ];
        setClubOptions(opts);
        setSelectedClub("ALL");
        // 페이지 초기화 후 첫 페이지 로드
        setItems([]);
        setOffset(0);
        setHasMore(true);
        setLoading(true);
        await loadPage({
          reset: true,
          clubId: null,
          prefsDistance: prefs.distance,
          prefsSpeed: prefs.speed,
        });
        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  // 현재 단위/필터를 이용해 페이지 로드
  const loadPage = useCallback(
    async (opts?: {
      reset?: boolean;
      clubId: number | null;
      prefsDistance: "yard" | "meter";
      prefsSpeed: "mph" | "mps";
    }) => {
      const clubId =
        opts?.clubId ?? (selectedClub === "ALL" ? null : Number(selectedClub));

      const distanceU = opts?.prefsDistance ?? distanceUnit;
      const speedU = opts?.prefsSpeed ?? speedUnit;

      const useOffset = opts?.reset ? 0 : offset;
      const rows: ShotRow[] = await getShots({
        limit: PAGE_SIZE,
        offset: useOffset,
        clubId,
      });

      const mapped: DisplayItem[] = rows.map((s) => {
        const carryNum =
          distanceU === "yard"
            ? Math.round(m_to_yd(s.carry_m))
            : Math.round(s.carry_m);
        const totalNum =
          distanceU === "yard"
            ? Math.round(m_to_yd(s.total_m))
            : Math.round(s.total_m);

        let speeds: string | null = null;
        if (s.ball_mps != null || s.club_mps != null) {
          const unit = speedU === "mph" ? "mph" : "m/s";
          const bs =
            s.ball_mps != null
              ? Math.round(
                  speedU === "mph" ? mps_to_mph(s.ball_mps) : s.ball_mps
                )
              : null;
          const cs =
            s.club_mps != null
              ? Math.round(
                  speedU === "mph" ? mps_to_mph(s.club_mps) : s.club_mps
                )
              : null;
          speeds =
            (bs != null ? `BS ${bs} ${unit}` : "") +
            (bs != null && cs != null ? " / " : "") +
            (cs != null ? `CS ${cs} ${unit}` : "");
        }

        return {
          id: s.id,
          club: s.clubLabel,
          carryNum,
          totalNum,
          speeds: speeds || null,
          smash: s.smash != null ? s.smash.toFixed(2) : null,
          when: format(new Date(s.createdAt), "PPP p", { locale: ko }),
        };
      });

      setItems((prev) => (opts?.reset ? mapped : [...prev, ...mapped]));
      setOffset(useOffset + rows.length);
      setHasMore(rows.length === PAGE_SIZE);
    },
    [selectedClub, distanceUnit, speedUnit, offset]
  );

  // 필터 변경 시: 리스트 리셋 후 첫 페이지
  const onChangeClub = async (v: string) => {
    setSelectedClub(v);
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);
    await loadPage({
      reset: true,
      clubId: v === "ALL" ? null : Number(v),
      prefsDistance: distanceUnit,
      prefsSpeed: speedUnit,
    });
    setLoading(false);
  };

  // 무한 스크롤
  const onEndReached = async () => {
    if (!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    await loadPage({
      prefsDistance: distanceUnit,
      prefsSpeed: speedUnit,
      clubId: selectedClub === "ALL" ? null : Number(selectedClub),
    });
    setLoadingMore(false);
  };

  // 통계 계산(현재 단위로 변환된 수치 기반)
  const stats = useMemo(() => {
    const carryValues = items
      .map((i) => i.carryNum)
      .filter((n) => Number.isFinite(n));
    const totalValues = items
      .map((i) => i.totalNum)
      .filter((n) => Number.isFinite(n));
    const c = toStats(carryValues);
    const t = toStats(totalValues);
    return {
      carry: c,
      total: t,
      unit: distanceUnit === "yard" ? "yd" : "m",
    };
  }, [items, distanceUnit]);

  const onDeleteItem = (id: number) => {
    Alert.alert("삭제할까요?", "이 샷 기록은 되돌릴 수 없습니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            // 1) DB 삭제
            await deleteShot(id);
            // 2) 화면에서 즉시 제거(낙관적 갱신)
            setItems((prev) => prev.filter((it) => it.id !== id));
            // 3) 오프셋/hasMore는 유지(페이지네이션 무너뜨리지 않기)
            // 필요 시 다음 fetch에서 하나 더 불러오도록 reset 없이 유지
          } catch (e) {
            console.error(e);
            Alert.alert("오류", "삭제하지 못했습니다.");
          }
        },
      },
    ]);
  };

  // UI 렌더링
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ color: "#6B7280", marginTop: 8 }}>불러오는 중…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 필터 + 통계 카드 */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <ChoiceGroup
          title="클럽 필터"
          options={clubOptions}
          value={selectedClub}
          onChange={onChangeClub}
        />

        {/* 통계 카드 */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 12,
            padding: 12,
            backgroundColor: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontWeight: "800", marginBottom: 6 }}>
            간단 통계 (표시 단위 기준)
          </Text>

          <Text style={{ marginBottom: 2 }}>
            <Text style={{ fontWeight: "700" }}>캐리</Text>
            {"  "}
            평균{" "}
            {Number.isFinite(stats.carry.mean)
              ? Math.round(stats.carry.mean)
              : "-"}{" "}
            {stats.unit} /{"  "}
            중간값{" "}
            {Number.isFinite(stats.carry.median)
              ? Math.round(stats.carry.median)
              : "-"}{" "}
            {stats.unit} /{"  "}
            IQR{" "}
            {Number.isFinite(stats.carry.iqr)
              ? Math.round(stats.carry.iqr)
              : "-"}{" "}
            {stats.unit}
          </Text>

          <Text>
            <Text style={{ fontWeight: "700" }}>토탈</Text>
            {"  "}
            평균{" "}
            {Number.isFinite(stats.total.mean)
              ? Math.round(stats.total.mean)
              : "-"}{" "}
            {stats.unit} /{"  "}
            중간값{" "}
            {Number.isFinite(stats.total.median)
              ? Math.round(stats.total.median)
              : "-"}{" "}
            {stats.unit} /{"  "}
            IQR{" "}
            {Number.isFinite(stats.total.iqr)
              ? Math.round(stats.total.iqr)
              : "-"}{" "}
            {stats.unit}
          </Text>
        </View>
      </View>

      {/* 리스트 */}
      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReachedThreshold={0.2}
        onEndReached={onEndReached}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 12, alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          ) : !hasMore ? (
            <View style={{ paddingVertical: 12, alignItems: "center" }}>
              <Text style={{ color: "#6B7280" }}>마지막입니다</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/shot/${item.id}`)}
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              padding: 14,
              backgroundColor: "#FFFFFF",
            }}
          >
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                padding: 14,
                backgroundColor: "#FFFFFF",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontWeight: "800", fontSize: 16 }}>
                  {item.club}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Text style={{ color: "#6B7280" }}>{item.when}</Text>
                  <Pressable
                    onPress={() => onDeleteItem(item.id)}
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                      backgroundColor: "#FEE2E2", // 연한 빨강
                    }}
                  >
                    <Text style={{ color: "#991B1B", fontWeight: "700" }}>
                      삭제
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                <Text style={{ fontWeight: "700" }}>캐리</Text>
                <Text>{` ${item.carryNum} ${
                  distanceUnit === "yard" ? "yd" : "m"
                }`}</Text>
                <Text style={{ fontWeight: "700", marginLeft: 12 }}>토탈</Text>
                <Text>{` ${item.totalNum} ${
                  distanceUnit === "yard" ? "yd" : "m"
                }`}</Text>
              </View>

              {item.speeds ? (
                <Text style={{ color: "#374151", marginTop: 4 }}>
                  {item.speeds}
                </Text>
              ) : null}

              {item.smash ? (
                <Text style={{ color: "#374151", marginTop: 2 }}>
                  스매시 팩터:{" "}
                  <Text style={{ fontWeight: "700" }}>{item.smash}</Text>
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
