import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import ChoiceGroup from "../../../src/components/ChoiceGroup";
import Screen from "../../../src/components/Screen";
import { getAllClubs } from "../../../src/db/clubs";
import { getUnitPrefs } from "../../../src/db/settings";
import { deleteShot, getShotById, updateShot } from "../../../src/db/shots";

const m_to_yd = (m: number) => m / 0.9144;
const mps_to_mph = (mps: number) => mps / 0.44704;

type ClubOption = { label: string; id: number };

export default function ShotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shotId = Number(id);

  const [distanceUnit, setDistanceUnit] = useState<"yard" | "meter">("yard");
  const [speedUnit, setSpeedUnit] = useState<"mph" | "mps">("mph");

  const [clubs, setClubs] = useState<ClubOption[]>([]);
  const [clubId, setClubId] = useState<number | null>(null);

  const [carry, setCarry] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [ballSpeed, setBallSpeed] = useState<string>("");
  const [clubSpeed, setClubSpeed] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16 as const,
  };

  // 포커스 시마다 현재 단위/클럽/샷 데이터를 로드
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        // id가 유효하지 않으면 바로 복귀
        if (!id || Number.isNaN(shotId)) {
          Alert.alert("오류", "잘못된 접근입니다.", [
            { text: "확인", onPress: () => router.back() },
          ]);
          return;
        }

        setLoading(true);
        const prefs = await getUnitPrefs();
        const clubRows = await getAllClubs();
        const shot = await getShotById(shotId);

        if (!alive) return;

        setDistanceUnit(prefs.distance);
        setSpeedUnit(prefs.speed);

        const options = clubRows.map((c) => ({ label: c.label, id: c.id }));
        setClubs(options);

        if (!shot) {
          Alert.alert("오류", "샷을 찾을 수 없습니다.", [
            { text: "확인", onPress: () => router.back() },
          ]);
          return;
        }

        setClubId(shot.clubId);

        // SI → 표시 단위로 변환하여 입력칸에 채우기
        const carryDisp =
          prefs.distance === "yard"
            ? Math.round(m_to_yd(shot.carry_m)).toString()
            : Math.round(shot.carry_m).toString();
        const totalDisp =
          prefs.distance === "yard"
            ? Math.round(m_to_yd(shot.total_m)).toString()
            : Math.round(shot.total_m).toString();

        const bsDisp =
          shot.ball_mps == null
            ? ""
            : prefs.speed === "mph"
            ? Math.round(mps_to_mph(shot.ball_mps)).toString()
            : Math.round(shot.ball_mps).toString();

        const csDisp =
          shot.club_mps == null
            ? ""
            : prefs.speed === "mph"
            ? Math.round(mps_to_mph(shot.club_mps)).toString()
            : Math.round(shot.club_mps).toString();

        setCarry(carryDisp);
        setTotal(totalDisp);
        setBallSpeed(bsDisp);
        setClubSpeed(csDisp);

        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [id, shotId])
  );

  const smash = useMemo(() => {
    const bs = parseFloat(ballSpeed);
    const cs = parseFloat(clubSpeed);
    if (!isFinite(bs) || !isFinite(cs) || cs <= 0) return null;
    return Math.round((bs / cs) * 100) / 100;
  }, [ballSpeed, clubSpeed]);

  const canSave =
    clubId !== null &&
    carry.trim().length > 0 &&
    total.trim().length > 0 &&
    isFinite(parseFloat(carry)) &&
    isFinite(parseFloat(total));

  const onSave = async () => {
    if (!canSave || clubId == null || saving) return;
    setSaving(true);
    try {
      await updateShot(shotId, {
        clubId,
        carry: parseFloat(carry),
        total: parseFloat(total),
        distanceUnit,
        ballSpeed: ballSpeed ? parseFloat(ballSpeed) : null,
        clubSpeed: clubSpeed ? parseFloat(clubSpeed) : null,
        speedUnit,
      });
      Alert.alert("저장됨", "샷이 수정되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert("삭제할까요?", "이 샷은 되돌릴 수 없습니다.", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteShot(shotId);
            Alert.alert("삭제됨", "샷이 삭제되었습니다.", [
              { text: "확인", onPress: () => router.back() },
            ]);
          } catch (e) {
            console.error(e);
            Alert.alert("오류", "삭제하지 못했습니다.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#6B7280" }}>불러오는 중…</Text>
      </View>
    );
  }

  // ✅ 공용 Screen으로 스크롤/키보드 회피 처리 (중첩 래퍼 제거)
  return (
    <Screen scroll keyboard contentStyle={{ gap: 14 }}>
      <Text style={{ fontSize: 18, fontWeight: "800", marginTop: 6 }}>
        샷 상세/수정
      </Text>

      {/* 클럽 변경 */}
      {clubs.length > 0 && clubId != null ? (
        <ChoiceGroup
          title="클럽"
          options={clubs.map((c) => ({
            label: c.label,
            value: String(c.id),
          }))}
          value={String(clubId)}
          onChange={(v) => setClubId(Number(v))}
        />
      ) : null}

      {/* 필수 */}
      <View style={{ gap: 10, marginTop: 4 }}>
        <Text style={{ fontWeight: "700" }}>
          캐리 ({distanceUnit === "yard" ? "yd" : "m"}) *
        </Text>
        <TextInput
          value={carry}
          onChangeText={setCarry}
          keyboardType="decimal-pad"
          inputMode="numeric"
          style={inputStyle}
        />

        <Text style={{ fontWeight: "700", marginTop: 6 }}>
          토탈 ({distanceUnit === "yard" ? "yd" : "m"}) *
        </Text>
        <TextInput
          value={total}
          onChangeText={setTotal}
          keyboardType="decimal-pad"
          inputMode="numeric"
          style={inputStyle}
        />
      </View>

      {/* 선택 */}
      <View style={{ gap: 10, marginTop: 12 }}>
        <Text style={{ fontWeight: "700" }}>볼 스피드 ({speedUnit})</Text>
        <TextInput
          value={ballSpeed}
          onChangeText={setBallSpeed}
          keyboardType="decimal-pad"
          inputMode="numeric"
          style={inputStyle}
        />

        <Text style={{ fontWeight: "700", marginTop: 6 }}>
          클럽 스피드 ({speedUnit})
        </Text>
        <TextInput
          value={clubSpeed}
          onChangeText={setClubSpeed}
          keyboardType="decimal-pad"
          inputMode="numeric"
          style={inputStyle}
        />

        <View style={{ marginTop: 6 }}>
          <Text style={{ color: "#6B7280" }}>
            스매시 팩터(표시 단위 기반 추정):{" "}
            <Text style={{ fontWeight: "700", color: "#111827" }}>
              {smash !== null ? smash.toFixed(2) : "-"}
            </Text>
          </Text>
        </View>
      </View>

      {/* 액션들 */}
      <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
        <Pressable
          onPress={onSave}
          disabled={!canSave || saving}
          style={{
            backgroundColor: canSave ? "#2E7D32" : "#93C5AA",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            flex: 1,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {saving ? "저장 중…" : "저장"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onDelete}
          style={{
            backgroundColor: "#B91C1C",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            flex: 1,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>삭제</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
