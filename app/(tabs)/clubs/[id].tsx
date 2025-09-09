import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import ChoiceGroup from "../../../src/components/ChoiceGroup";
import Screen from "../../../src/components/Screen";
import { CLUB_TYPE_OPTIONS } from "../../../src/constants/clubTypes";
import {
  deleteClub,
  getClubById,
  updateClub,
  type ClubRow,
} from "../../../src/db/clubs";
import { countShotsByClub } from "../../../src/db/shots";

export default function ClubEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clubId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [label, setLabel] = useState<string>("");
  const [type, setType] = useState<string>(CLUB_TYPE_OPTIONS[0].value);
  const [loft, setLoft] = useState<string>("");
  const [sort, setSort] = useState<string>("999");

  // 진입/복귀 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        // id 가드
        if (!id || Number.isNaN(clubId)) {
          Alert.alert("오류", "잘못된 접근입니다.", [
            { text: "확인", onPress: () => router.back() },
          ]);
          return;
        }

        setLoading(true);
        const row: ClubRow | null = await getClubById(clubId);
        if (!alive) return;

        if (!row) {
          Alert.alert("오류", "클럽을 찾을 수 없습니다.", [
            { text: "확인", onPress: () => router.back() },
          ]);
          return;
        }
        setLabel(row.label);
        setType(row.type);
        setLoft(row.loft != null ? String(row.loft) : "");
        setSort(String(row.sort ?? 999));
        setLoading(false);
      })();
      return () => {
        alive = false;
      };
    }, [id, clubId])
  );

  const canSave = label.trim().length > 0;

  const onSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await updateClub(clubId, {
        label,
        type,
        sort: Number.isFinite(Number(sort)) ? Number(sort) : 999,
        loft: loft ? Number(loft) : null,
      });
      Alert.alert("저장됨", "클럽이 수정되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const used = await countShotsByClub(clubId);
    const message =
      used > 0
        ? `이 클럽으로 저장된 샷 ${used}개가 있습니다. 삭제하면 히스토리에서 '삭제됨'처럼 보일 수 있어요.`
        : "이 클럽을 삭제할까요?";
    Alert.alert("삭제", message, [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteClub(clubId);
            Alert.alert("삭제됨", "클럽이 삭제되었습니다.", [
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

  const inputStyle = {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16 as const,
  };

  return (
    // ✅ 공용 Screen으로 스크롤/키보드 회피 일괄 처리
    <Screen scroll keyboard contentStyle={{ gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>클럽 편집</Text>

      <Text style={{ fontWeight: "700" }}>표시 이름 *</Text>
      <TextInput
        value={label}
        onChangeText={setLabel}
        placeholder="예: Stealth2 Driver"
        style={inputStyle}
      />

      <ChoiceGroup
        title="타입"
        // CLUB_TYPE_OPTIONS가 readonly면 타입 에러 방지용 얕은 복사
        options={CLUB_TYPE_OPTIONS.map((o) => ({ ...o }))}
        value={type}
        onChange={setType}
      />

      <Text style={{ fontWeight: "700" }}>로프트(°)</Text>
      <TextInput
        value={loft}
        onChangeText={setLoft}
        keyboardType="decimal-pad"
        inputMode="numeric"
        placeholder="예: 10.5"
        style={inputStyle}
      />

      <Text style={{ fontWeight: "700" }}>정렬 우선순위(작을수록 위)</Text>
      <TextInput
        value={sort}
        onChangeText={setSort}
        keyboardType="number-pad"
        inputMode="numeric"
        placeholder="예: 1"
        style={inputStyle}
      />

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
          <Text style={{ color: "#fff", fontWeight: "700" }}>
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
          <Text style={{ color: "#fff", fontWeight: "700" }}>삭제</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
