// 問題一覧画面

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
import { Problem, Difficulty } from "../types/api";

type Props = NativeStackScreenProps<RootStackParamList, "ProblemList">;

export default function ProblemListScreen({ navigation }: Props) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProblems = async () => {
    try {
      const data = await apiClient.getProblems();
      setProblems(data);
    } catch (error: any) {
      console.error("Failed to load problems:", error);
      // エラーメッセージをアラートで表示
      const errorMessage = error?.response?.data?.detail || error?.message || "問題の読み込みに失敗しました";
      alert(`エラー: ${errorMessage}\n\nAPI URLの設定を確認してください。\n詳細は SETUP_API_URL.md を参照してください。`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProblems();
  };

  const getDifficultyColor = (difficulty: Difficulty): string => {
    switch (difficulty) {
      case "easy":
        return "#28a745";
      case "medium":
        return "#ffc107";
      case "hard":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const renderItem = ({ item }: { item: Problem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("ProblemDetail", { problemId: item.id })}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.id}: {item.title}</Text>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(item.difficulty) },
          ]}
        >
          <Text style={styles.difficultyText}>
            {item.difficulty.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.itemCategory}>
        カテゴリ: {item.category.join(", ")}
      </Text>
    </TouchableOpacity>
  );

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
        data={problems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>問題がありません</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  itemCategory: {
    fontSize: 14,
    color: "#666",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

