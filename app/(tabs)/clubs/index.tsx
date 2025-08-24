import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { deleteClub, getAllClubs, type ClubRow } from "../../../src/db/clubs";
import { countShotsByClub } from "../../../src/db/shots";

export default function ClubsScreen() {
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const load = useCallback(async () => {
    setClubs(await getAllClubs());
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = async (id: number) => {
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
          await deleteClub(id);
          load();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
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

      <FlatList
        data={clubs}
        keyExtractor={(c) => String(c.id)}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
    </View>
  );
}
