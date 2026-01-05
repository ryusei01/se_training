/**
 * 文書決裁デモ: 申請一覧画面（Phase1: GET）
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { ApprovalRequest } from "../types/api";
import { getErrorMessage } from "../utils/errorHandler";
import ErrorMessageModal from "../components/ErrorMessageModal";

type Props = NativeStackScreenProps<RootStackParamList, "RequestList">;

export default function RequestListScreen({ navigation }: Props) {
  const [items, setItems] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = async () => {
    try {
      const data = await apiClient.getRequests();
      setItems(data);
    } catch (e) {
      setErrorMessage(getErrorMessage(e));
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate("RequestDetail", { requestId: item.id })}
          >
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            {!!item.body && <Text style={styles.body} numberOfLines={2}>{item.body}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>申請がありません</Text>}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
      />

      <ErrorMessageModal
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  item: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#ddd" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  title: { fontSize: 15, fontWeight: "bold", color: "#2c3e50", flex: 1 },
  status: { fontSize: 12, color: "#666" },
  body: { marginTop: 6, color: "#555", fontSize: 13 },
  emptyContainer: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  empty: { color: "#999" },
});




