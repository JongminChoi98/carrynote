import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import Screen from "../../../src/components/Screen";
import { deleteClub, getAllClubs, type ClubRow } from "../../../src/db/clubs";
import { countShotsByClub } from "../../../src/db/shots";

export default function ClubsScreen() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await getAllClubs();
      setClubs(list);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const onDelete = async (id: number) => {
    try {
      const used = await countShotsByClub(id);
      const message =
        used > 0
          ? `이 클럽으로 저장된 샷 ${used}개가 있습니다. 삭제 시 히스토리에서 '삭제됨'처럼 보일 수 있어요.`
          : "이 클럽을 삭제할까요?";
      Alert.alert("삭제", message, [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteClub(id);
              // 낙관적 갱신
              setClubs((prev) => prev.filter((c) => c.id !== id));
            } catch (e) {
              console.error(e);
              Alert.alert("오류", "삭제하지 못했습니다.");
            }
          },
        },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "상태를 확인하지 못했습니다.");
    }
  };

  if (initialLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ color: "#6B7280", marginTop: 8 }}>불러오는 중…</Text>
      </View>
    );
  }

  const Header = (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "800" }}>내 클럽</Text>
      <Pressable
        onPress={() => router.push("/clubs/new")}
        style={{
          backgroundColor: "#2E7D32",
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>추가</Text>
      </Pressable>
    </View>
  );

  const Empty = (
    <View style={{ padding: 24, alignItems: "center" }}>
      <Text style={{ color: "#6B7280", marginBottom: 12 }}>
        아직 등록된 클럽이 없어요.
      </Text>
      <Pressable
        onPress={() => router.push("/clubs/new")}
        style={{
          backgroundColor: "#2E7D32",
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>첫 클럽 추가</Text>
      </Pressable>
    </View>
  );

  return (
    // ✅ FlatList가 유일한 세로 스크롤러가 되도록: scroll/keyboard 끔
    <Screen scroll={false} keyboard={false} contentPadding={0}>
      <FlatList
        data={clubs}
        keyExtractor={(c) => String(c.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={Header}
        ListEmptyComponent={Empty}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              padding: 12,
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
                  {item.loft ? `  •  ${item.loft}°` : ""} • sort {item.sort}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => router.push(`/clubs/${item.id}`)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: "#E5E7EB",
                  }}
                >
                  <Text style={{ fontWeight: "700" }}>편집</Text>
                </Pressable>
                <Pressable
                  onPress={() => onDelete(item.id)}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: "#FEE2E2",
                  }}
                >
                  <Text style={{ fontWeight: "700", color: "#991B1B" }}>
                    삭제
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
