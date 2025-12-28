/**
 * 問題一覧画面
 * 
 * コーディングテストの問題一覧を表示する画面。
 * 問題をリスト表示し、カテゴリー別の表示やフィルタリング機能を提供する。
 */

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { Problem, Difficulty } from "../types/api";

type Props = NativeStackScreenProps<RootStackParamList, "ProblemList">;

// スクロール位置を保存するためのグローバル変数（画面遷移時に保持）
let savedScrollOffset = 0;

/** 表示モード */
type ViewMode = "all" | "category";

/**
 * 問題一覧画面コンポーネント
 * 
 * 問題の一覧を表示し、カテゴリー別の表示やフィルタリング機能を提供する。
 * 問題をタップすると、問題詳細画面に遷移する。
 * 
 * @param {Props} props - ナビゲーションプロップ
 * @returns {JSX.Element} 問題一覧画面コンポーネント
 */
export default function ProblemListScreen({ navigation }: Props) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  /**
   * 問題一覧を読み込む
   */
  const loadProblems = async () => {
    try {
      setError(null);
      const data = await apiClient.getProblems();
      setProblems(data);
    } catch (error: any) {
      console.error("Failed to load problems:", error);
      // エラーメッセージを状態に設定
      const errorMessage = error?.response?.data?.detail || error?.message || "問題の読み込みに失敗しました";
      setError(`エラー: ${errorMessage}\n\nAPI URLの設定を確認してください。\n詳細は SETUP_API_URL.md を参照してください。`);
      setProblems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  // 画面がフォーカスされたときにスクロール位置を復元
  useFocusEffect(
    React.useCallback(() => {
      // 少し遅延させてからスクロール位置を復元（レンダリング完了後）
      const timer = setTimeout(() => {
        if (flatListRef.current && savedScrollOffset > 0) {
          flatListRef.current.scrollToOffset({
            offset: savedScrollOffset,
            animated: false,
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProblems();
  };

  /**
   * 難易度に応じた色を返す
   * 
   * @param {Difficulty} difficulty - 難易度
   * @returns {string} 色コード
   */
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

  /**
   * 問題アイテムがタップされたときのハンドラ
   * 
   * @param {Problem} item - タップされた問題
   */
  const handleItemPress = (item: Problem) => {
    // onScrollイベントで既にスクロール位置が保存されているので、そのまま遷移
    navigation.navigate("ProblemDetail", { problemId: item.id });
  };

  /**
   * スクロールイベントのハンドラ
   * 
   * スクロール位置を保存して、画面遷移後に復元できるようにする。
   * 
   * @param {any} event - スクロールイベント
   */
  const handleScroll = (event: any) => {
    // スクロール位置を保存
    savedScrollOffset = event.nativeEvent.contentOffset.y;
  };

  // カテゴリー一覧を取得
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    problems.forEach((problem) => {
      if (problem.category && Array.isArray(problem.category)) {
        problem.category.forEach((cat) => categorySet.add(cat));
      }
    });
    return Array.from(categorySet).sort();
  }, [problems]);

  // フィルターされた問題リスト
  const filteredProblems = useMemo(() => {
    if (viewMode === "all") {
      return problems;
    }
    if (selectedCategory === "all") {
      return problems;
    }
    return problems.filter(
      (problem) =>
        problem.category && problem.category.includes(selectedCategory)
    );
  }, [problems, viewMode, selectedCategory]);

  // カテゴリー別にグループ化
  const problemsByCategory = useMemo(() => {
    if (viewMode !== "category") {
      return {};
    }
    const grouped: { [key: string]: Problem[] } = {};
    filteredProblems.forEach((problem) => {
      if (problem.category && Array.isArray(problem.category)) {
        problem.category.forEach((cat) => {
          if (!grouped[cat]) {
            grouped[cat] = [];
          }
          if (!grouped[cat].find((p) => p.id === problem.id)) {
            grouped[cat].push(problem);
          }
        });
      } else {
        if (!grouped["その他"]) {
          grouped["その他"] = [];
        }
        if (!grouped["その他"].find((p) => p.id === problem.id)) {
          grouped["その他"].push(problem);
        }
      }
    });
    return grouped;
  }, [filteredProblems, viewMode]);

  // フラットリスト用のデータ（カテゴリー別表示用）
  const flatListData = useMemo(() => {
    if (viewMode === "all") {
      return filteredProblems;
    }
    // カテゴリー別表示の場合は、カテゴリーヘッダーと問題を交互に配置
    const result: Array<{ type: "category" | "problem"; data: any }> = [];
    const sortedCategories = Object.keys(problemsByCategory).sort();
    sortedCategories.forEach((category) => {
      result.push({ type: "category", data: category });
      problemsByCategory[category].forEach((problem) => {
        result.push({ type: "problem", data: problem });
      });
    });
    return result;
  }, [viewMode, filteredProblems, problemsByCategory]);

  const renderItem = ({ item }: { item: Problem }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleItemPress(item)}
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
      <View style={styles.categoryTags}>
        {item.category.map((cat) => (
          <View key={cat} style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{cat}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderCategoryHeader = ({ item }: { item: string }) => (
    <View style={styles.categoryHeader}>
      <Text style={styles.categoryHeaderText}>{item}</Text>
    </View>
  );

  const renderFlatListItem = ({ item }: { item: any }) => {
    if (item.type === "category") {
      return renderCategoryHeader({ item: item.data });
    }
    return renderItem({ item: item.data });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <View style={styles.filterSection}>
        <View style={styles.filterControls}>
          <Text style={styles.filterLabel}>表示モード:</Text>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === "all" && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode("all")}
            >
              <Text
                style={[
                  styles.viewModeButtonText,
                  viewMode === "all" && styles.viewModeButtonTextActive,
                ]}
              >
                すべて
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === "category" && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode("category")}
            >
              <Text
                style={[
                  styles.viewModeButtonText,
                  viewMode === "category" && styles.viewModeButtonTextActive,
                ]}
              >
                カテゴリー別
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {viewMode === "category" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilterScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                selectedCategory === "all" && styles.categoryFilterButtonActive,
              ]}
              onPress={() => setSelectedCategory("all")}
            >
              <Text
                style={[
                  styles.categoryFilterButtonText,
                  selectedCategory === "all" &&
                    styles.categoryFilterButtonTextActive,
                ]}
              >
                すべて
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryFilterButton,
                  selectedCategory === category &&
                    styles.categoryFilterButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryFilterButtonText,
                    selectedCategory === category &&
                      styles.categoryFilterButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      <FlatList
        ref={flatListRef}
        data={viewMode === "all" ? filteredProblems : flatListData}
        renderItem={viewMode === "all" ? renderItem : renderFlatListItem}
        keyExtractor={(item, index) =>
          viewMode === "all"
            ? (item as Problem).id
            : `${(item as any).type}-${(item as any).data.id || (item as any).data}-${index}`
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            {error ? (
              <Text style={styles.emptyText}>問題の読み込みに失敗しました</Text>
            ) : (
              <Text style={styles.emptyText}>問題がありません</Text>
            )}
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
  categoryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  categoryTag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "500",
  },
  filterSection: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  filterControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  filterLabel: {
    fontWeight: "bold",
    color: "#2c3e50",
    marginRight: 10,
  },
  viewModeToggle: {
    flexDirection: "row",
    gap: 10,
  },
  viewModeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  viewModeButtonActive: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  viewModeButtonText: {
    fontSize: 14,
    color: "#333",
  },
  viewModeButtonTextActive: {
    color: "#fff",
  },
  categoryFilterScroll: {
    marginTop: 10,
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },
  categoryFilterButtonActive: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  categoryFilterButtonText: {
    fontSize: 14,
    color: "#333",
  },
  categoryFilterButtonTextActive: {
    color: "#fff",
  },
  categoryHeader: {
    backgroundColor: "#e3f2fd",
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
  },
  categoryHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
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
  errorContainer: {
    backgroundColor: "#fee",
    borderBottomWidth: 1,
    borderBottomColor: "#fcc",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#dc3545",
  },
  errorText: {
    fontSize: 14,
    color: "#721c24",
    lineHeight: 20,
  },
});

