import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import ChoiceGroup from "../../src/components/ChoiceGroup";
import { getAllClubs } from "../../src/db/clubs";
import { getUnitPrefs } from "../../src/db/settings";
import { insertShot } from "../../src/db/shots";

type ClubOption = { label: string; value: string; id: number };

export default function ShotNewScreen() {
  // 단위
  const [distanceUnit, setDistanceUnit] = useState<"yard" | "meter">("yard");
  const [speedUnit, setSpeedUnit] = useState<"mph" | "mps">("mph");

  // 클럽 목록 (DB)
  const [clubOptions, setClubOptions] = useState<ClubOption[]>([]);
  const [clubId, setClubId] = useState<number | null>(null);

  // 폼
  const [carry, setCarry] = useState<string>("");
  const [total, setTotal] = useState<string>("");
  const [ballSpeed, setBallSpeed] = useState<string>("");
  const [clubSpeed, setClubSpeed] = useState<string>("");

  // 포커스될 때 단위/클럽 로드
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const prefs = await getUnitPrefs();
        const clubs = await getAllClubs();
        if (!alive) return;
        setDistanceUnit(prefs.distance);
        setSpeedUnit(prefs.speed);
        const opts = clubs.map((c) => ({
          label: c.label,
          value: c.type,
          id: c.id,
        }));
        setClubOptions(opts);
        if (opts.length > 0 && clubId == null) setClubId(opts[0].id);
      })();
      return () => {
        alive = false;
      };
    }, [clubId])
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

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16 as const,
  };

  const onSave = async () => {
    if (!canSave || clubId == null) return;
    try {
      const res = await insertShot({
        clubId,
        carry: parseFloat(carry),
        total: parseFloat(total),
        distanceUnit,
        ballSpeed: ballSpeed ? parseFloat(ballSpeed) : null,
        clubSpeed: clubSpeed ? parseFloat(clubSpeed) : null,
        speedUnit,
      });
      Alert.alert("저장됨", `스매시: ${res.smash ?? "-"}`);
      // 마지막 값 유지(원하면 clear)
      setCarry("");
      setTotal("");
      // setBallSpeed(""); setClubSpeed("");
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "샷을 저장하지 못했습니다.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, padding: 20, gap: 14 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", marginTop: 6 }}>
          샷 입력
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", marginTop: 6 }}>
            샷 입력
          </Text>
          <Pressable
            onPress={() => router.push("/clubs/new")}
            style={{
              backgroundColor: "#E5E7EB",
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontWeight: "700" }}>클럽 추가</Text>
          </Pressable>
        </View>

        {/* 클럽 선택 */}
        {clubOptions.length > 0 ? (
          <ChoiceGroup
            title="클럽 선택"
            options={clubOptions.map((o) => ({
              label: o.label,
              value: String(o.id),
            }))}
            value={clubId != null ? String(clubId) : String(clubOptions[0]?.id)}
            onChange={(v) => setClubId(Number(v))}
          />
        ) : (
          <Text style={{ color: "#6B7280" }}>클럽 목록을 불러오는 중…</Text>
        )}

        {/* 캐리/토탈 */}
        <View style={{ gap: 10, marginTop: 4 }}>
          <Text style={{ fontWeight: "700" }}>
            캐리 ({distanceUnit === "yard" ? "yd" : "m"}) *
          </Text>
          <TextInput
            value={carry}
            onChangeText={setCarry}
            keyboardType="numeric"
            placeholder={distanceUnit === "yard" ? "예: 235" : "예: 215"}
            style={inputStyle}
          />

          <Text style={{ fontWeight: "700", marginTop: 6 }}>
            토탈 ({distanceUnit === "yard" ? "yd" : "m"}) *
          </Text>
          <TextInput
            value={total}
            onChangeText={setTotal}
            keyboardType="numeric"
            placeholder={distanceUnit === "yard" ? "예: 252" : "예: 230"}
            style={inputStyle}
          />
        </View>

        {/* 선택: 속도 */}
        <View style={{ gap: 10, marginTop: 12 }}>
          <Text style={{ fontWeight: "700" }}>볼 스피드 ({speedUnit})</Text>
          <TextInput
            value={ballSpeed}
            onChangeText={setBallSpeed}
            keyboardType="numeric"
            placeholder={speedUnit === "mph" ? "예: 150" : "예: 67"}
            style={inputStyle}
          />

          <Text style={{ fontWeight: "700", marginTop: 6 }}>
            클럽 스피드 ({speedUnit})
          </Text>
          <TextInput
            value={clubSpeed}
            onChangeText={setClubSpeed}
            keyboardType="numeric"
            placeholder={speedUnit === "mph" ? "예: 100" : "예: 45"}
            style={inputStyle}
          />

          <View style={{ marginTop: 6 }}>
            <Text style={{ color: "#6B7280" }}>
              스매시 팩터:{" "}
              <Text style={{ fontWeight: "700", color: "#111827" }}>
                {smash !== null ? smash.toFixed(2) : "-"}
              </Text>
            </Text>
          </View>
        </View>

        {/* 저장 */}
        <Pressable
          onPress={onSave}
          disabled={!canSave}
          style={{
            marginTop: 10,
            backgroundColor: canSave ? "#2E7D32" : "#93C5AA",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {canSave ? "저장" : "필수값을 입력하세요"}
          </Text>
        </Pressable>

        <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
          * 필수: 캐리/토탈. 저장은 SI(미터/초)로 이루어집니다.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
