/**
 * 文書決裁デモ: 申請詳細画面（Phase1: GET）
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { ApprovalRequest } from "../types/api";
import { getErrorMessage } from "../utils/errorHandler";
import ErrorMessageModal from "../components/ErrorMessageModal";

type Props = NativeStackScreenProps<RootStackParamList, "RequestDetail">;

export default function RequestDetailScreen({ route }: Props) {
  const { requestId } = route.params;
  const [item, setItem] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = async () => {
    try {
      const data = await apiClient.getRequest(requestId);
      setItem(data);
    } catch (e) {
      setErrorMessage(getErrorMessage(e));
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [requestId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>申請が見つかりません</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>status: {item.status}</Text>
        <Text style={styles.meta}>created_at: {item.created_at}</Text>
        <Text style={styles.meta}>updated_at: {item.updated_at}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本文</Text>
          <Text style={styles.body}>{item.body || "（本文なし）"}</Text>
        </View>
      </ScrollView>

      <ErrorMessageModal
        visible={errorModalVisible}
        message={errorMessage}
        onClose={() => setErrorModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  empty: { color: "#999" },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", color: "#2c3e50", marginBottom: 8 },
  meta: { color: "#666", fontSize: 12, marginBottom: 4 },
  card: { backgroundColor: "#fff", borderRadius: 8, padding: 12, marginTop: 14, borderWidth: 1, borderColor: "#ddd" },
  cardTitle: { fontWeight: "bold", color: "#2c3e50", marginBottom: 8 },
  body: { color: "#444", lineHeight: 20 },
});




