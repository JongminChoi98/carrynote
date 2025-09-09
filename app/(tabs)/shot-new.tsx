import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import ChoiceGroup from "../../src/components/ChoiceGroup";
import Screen from "../../src/components/Screen";
import { getAllClubs } from "../../src/db/clubs";
import { getUnitPrefs } from "../../src/db/settings";
import { insertShot } from "../../src/db/shots";
import { useLastShotStore } from "../../src/store/lastShotStore";

type ClubOption = { label: string; id: number };

export default function ShotNewScreen() {
  // 단위
  const [distanceUnit, setDistanceUnit] = useState<"yard" | "meter">("yard");
  const [speedUnit, setSpeedUnit] = useState<"mph" | "mps">("mph");

  // 클럽
  const [clubOptions, setClubOptions] = useState<ClubOption[]>([]);
  const [clubId, setClubId] = useState<number | null>(null);

  // 입력 상태 (마지막 값 자동 유지)
  const { carry, total, ballSpeed, clubSpeed, setLastShot } =
    useLastShotStore();
  const [carryLocal, setCarryLocal] = useState(carry);
  const [totalLocal, setTotalLocal] = useState(total);
  const [ballLocal, setBallLocal] = useState(ballSpeed);
  const [clubLocal, setClubLocal] = useState(clubSpeed);

  // 포커스 이동 refs
  const totalRef = useRef<TextInput>(null);
  const ballRef = useRef<TextInput>(null);
  const clubRef = useRef<TextInput>(null);

  // 화면 진입/재진입 시 단위/클럽 & 마지막 값 로드
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const prefs = await getUnitPrefs();
        const clubs = await getAllClubs();
        if (!alive) return;

        setDistanceUnit(prefs.distance);
        setSpeedUnit(prefs.speed);

        const opts = clubs.map((c) => ({ label: c.label, id: c.id }));
        setClubOptions(opts);
        if (opts.length > 0 && clubId == null) setClubId(opts[0].id);

        // store의 최근 값으로 입력 초기화 (반복 기록 빠르게)
        setCarryLocal(carry);
        setTotalLocal(total);
        setBallLocal(ballSpeed);
        setClubLocal(clubSpeed);
      })();
      return () => {
        alive = false;
      };
    }, [clubId, carry, total, ballSpeed, clubSpeed])
  );

  // 스매시 표시(입력 단위 기반 간이 계산)
  const smash = useMemo(() => {
    const bs = parseFloat(ballLocal);
    const cs = parseFloat(clubLocal);
    if (!isFinite(bs) || !isFinite(cs) || cs <= 0) return null;
    return Math.round((bs / cs) * 100) / 100;
  }, [ballLocal, clubLocal]);

  const canSave =
    clubId !== null &&
    carryLocal.trim().length > 0 &&
    totalLocal.trim().length > 0 &&
    isFinite(parseFloat(carryLocal)) &&
    isFinite(parseFloat(totalLocal));

  const inputBase = {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16 as const,
    flex: 1,
  };

  const Unit = ({ children }: { children: string }) => (
    <Text style={{ marginLeft: 8, color: "#374151", fontWeight: "700" }}>
      {children}
    </Text>
  );

  const onSave = async () => {
    if (!canSave || clubId == null) return;
    try {
      const res = await insertShot({
        clubId,
        carry: parseFloat(carryLocal),
        total: parseFloat(totalLocal),
        distanceUnit,
        ballSpeed: ballLocal ? parseFloat(ballLocal) : null,
        clubSpeed: clubLocal ? parseFloat(clubLocal) : null,
        speedUnit,
      });

      // 마지막 값 유지 (반복 입력을 빠르게)
      setLastShot({
        carry: carryLocal,
        total: totalLocal,
        ballSpeed: ballLocal,
        clubSpeed: clubLocal,
      });

      Alert.alert("저장됨", `스매시: ${res.smash ?? "-"}`);
      // 원하면 입력 초기화:
      // setCarryLocal(""); setTotalLocal(""); setBallLocal(""); setClubLocal("");
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "샷을 저장하지 못했습니다.");
    }
  };

  // ✅ 공용 Screen이 Scroll & KeyboardAvoidingView를 처리하므로, 추가 래퍼 불필요
  return (
    <Screen scroll keyboard contentStyle={{ gap: 14 }}>
      {/* 헤더 + 클럽 추가 빠른 진입 */}
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
      {clubOptions.length > 0 && clubId != null ? (
        <ChoiceGroup
          title="클럽 선택"
          options={clubOptions.map((o) => ({
            label: o.label,
            value: String(o.id),
          }))}
          value={String(clubId)}
          onChange={(v) => setClubId(Number(v))}
        />
      ) : (
        <Text style={{ color: "#6B7280" }}>클럽 목록을 불러오는 중…</Text>
      )}

      {/* 캐리 */}
      <View style={{ gap: 8, marginTop: 4 }}>
        <Text style={{ fontWeight: "700" }}>
          캐리 ({distanceUnit === "yard" ? "yd" : "m"}) *
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            value={carryLocal}
            onChangeText={setCarryLocal}
            keyboardType="decimal-pad"
            inputMode="numeric"
            placeholder={distanceUnit === "yard" ? "예: 235" : "예: 215"}
            returnKeyType="next"
            onSubmitEditing={() => totalRef.current?.focus()}
            style={inputBase}
          />
          <Unit>{distanceUnit === "yard" ? "yd" : "m"}</Unit>
        </View>
      </View>

      {/* 토탈 */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: "700" }}>
          토탈 ({distanceUnit === "yard" ? "yd" : "m"}) *
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            ref={totalRef}
            value={totalLocal}
            onChangeText={setTotalLocal}
            keyboardType="decimal-pad"
            inputMode="numeric"
            placeholder={distanceUnit === "yard" ? "예: 252" : "예: 230"}
            returnKeyType="next"
            onSubmitEditing={() => ballRef.current?.focus()}
            style={inputBase}
          />
          <Unit>{distanceUnit === "yard" ? "yd" : "m"}</Unit>
        </View>
      </View>

      {/* 선택: 속도 */}
      <View style={{ gap: 8, marginTop: 6 }}>
        <Text style={{ fontWeight: "700" }}>
          볼 스피드 ({speedUnit === "mph" ? "mph" : "m/s"})
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            ref={ballRef}
            value={ballLocal}
            onChangeText={setBallLocal}
            keyboardType="decimal-pad"
            inputMode="numeric"
            placeholder={speedUnit === "mph" ? "예: 150" : "예: 67"}
            returnKeyType="next"
            onSubmitEditing={() => clubRef.current?.focus()}
            style={inputBase}
          />
          <Unit>{speedUnit === "mph" ? "mph" : "m/s"}</Unit>
        </View>

        <Text style={{ fontWeight: "700", marginTop: 6 }}>
          클럽 스피드 ({speedUnit === "mph" ? "mph" : "m/s"})
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            ref={clubRef}
            value={clubLocal}
            onChangeText={setClubLocal}
            keyboardType="decimal-pad"
            inputMode="numeric"
            placeholder={speedUnit === "mph" ? "예: 100" : "예: 45"}
            returnKeyType="done"
            style={inputBase}
          />
          <Unit>{speedUnit === "mph" ? "mph" : "m/s"}</Unit>
        </View>

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
        * 저장하면 마지막 값이 유지돼 반복 기록이 빨라집니다.
      </Text>
    </Screen>
  );
}
