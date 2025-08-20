import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { getUnitPrefs } from "../../src/db/settings";
import { getRecentShots, type ShotRow } from "../../src/db/shots";

// 단위 변환
const m_to_yd = (m: number) => m / 0.9144;
const mps_to_mph = (mps: number) => mps / 0.44704;

type DisplayItem = {
  id: number;
  club: string;
  carry: string; // "235 yd" or "215 m"
  total: string;
  speeds?: string | null; // "BS 150 mph / CS 100 mph" 등
  smash?: string | null; // "1.50"
  when: string; // "오늘 오전 10:32" 등
};

export default function HistoryScreen() {
  const [items, setItems] = useState<DisplayItem[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const prefs = await getUnitPrefs();
        const shots: ShotRow[] = await getRecentShots(50);

        const list = shots.map((s) => {
          const carryNum =
            prefs.distance === "yard" ? m_to_yd(s.carry_m) : s.carry_m;
          const totalNum =
            prefs.distance === "yard" ? m_to_yd(s.total_m) : s.total_m;
          const carry = `${Math.round(carryNum)} ${
            prefs.distance === "yard" ? "yd" : "m"
          }`;
          const total = `${Math.round(totalNum)} ${
            prefs.distance === "yard" ? "yd" : "m"
          }`;

          let speeds: string | null = null;
          if (s.ball_mps != null || s.club_mps != null) {
            const bs =
              s.ball_mps != null
                ? Math.round(
                    prefs.speed === "mph" ? mps_to_mph(s.ball_mps) : s.ball_mps
                  )
                : null;
            const cs =
              s.club_mps != null
                ? Math.round(
                    prefs.speed === "mph" ? mps_to_mph(s.club_mps) : s.club_mps
                  )
                : null;
            const unit = prefs.speed === "mph" ? "mph" : "m/s";
            speeds =
              (bs != null ? `BS ${bs} ${unit}` : "") +
              (bs != null && cs != null ? " / " : "") +
              (cs != null ? `CS ${cs} ${unit}` : "");
          }

          const smash = s.smash != null ? s.smash.toFixed(2) : null;
          const when = format(new Date(s.createdAt), "PPP p", { locale: ko });

          return {
            id: s.id,
            club: s.clubLabel,
            carry,
            total,
            speeds: speeds || null,
            smash,
            when,
          } as DisplayItem;
        });

        if (alive) setItems(list);
      })();
      return () => {
        alive = false;
      };
    }, [])
  );

  if (!items) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#6B7280" }}>불러오는 중…</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          아직 기록이 없어요
        </Text>
        <Text style={{ color: "#6B7280", textAlign: "center" }}>
          홈에서 “바로 기록하기”를 눌러 첫 샷을 저장해보세요.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(it) => String(it.id)}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item }) => (
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
            <Text style={{ fontWeight: "800", fontSize: 16 }}>{item.club}</Text>
            <Text style={{ color: "#6B7280" }}>{item.when}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 4 }}>
            <Text style={{ fontWeight: "700" }}>캐리</Text>
            <Text>{item.carry}</Text>
            <Text style={{ fontWeight: "700", marginLeft: 12 }}>토탈</Text>
            <Text>{item.total}</Text>
          </View>

          {item.speeds ? (
            <Text style={{ color: "#374151", marginBottom: 2 }}>
              {item.speeds}
            </Text>
          ) : null}

          {item.smash ? (
            <Text style={{ color: "#374151" }}>
              스매시 팩터:{" "}
              <Text style={{ fontWeight: "700" }}>{item.smash}</Text>
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}
