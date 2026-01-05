/**
 * 章一覧画面
 *
 * コースの章一覧を表示し、各章を選択できる画面。
 * 各章を選択したときにログインを求める。
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
import { Chapter } from "../types/api";
import { getErrorMessage, checkAuth } from "../utils/errorHandler";
import ErrorMessageModal from "../components/ErrorMessageModal";
import ConfirmModal from "../components/ConfirmModal";

type Props = NativeStackScreenProps<RootStackParamList, "ChapterList">;

/**
 * 章一覧画面コンポーネント
 *
 * @param {Props} props - ナビゲーションプロップ
 * @returns {JSX.Element} 章一覧画面コンポーネント
 */
export default function ChapterListScreen({ route, navigation }: Props) {
  const { courseId, courseName } = route.params;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingChapter, setPendingChapter] = useState<Chapter | null>(null);

  /**
   * 章一覧を読み込む
   */
  const loadChapters = async () => {
    try {
      const data = await apiClient.getCourseChapters(courseId);
      setChapters(data);
    } catch (error: any) {
      console.error("Failed to load chapters:", error);
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadChapters();
  }, [courseId]);

  /**
   * プルリフレッシュ
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadChapters();
  };

  /**
   * 章アイテムがタップされたときのハンドラ
   *
   * @param {Chapter} chapter - タップされた章
   */
  const handleChapterPress = async (chapter: Chapter) => {
    // 認証チェック
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      setPendingChapter(chapter);
      setConfirmModalVisible(true);
      return;
    }

    // 章詳細画面に遷移
    navigation.navigate("ChapterDetail", {
      chapterId: chapter.id,
      courseId: courseId,
    });
  };

  /**
   * 章アイテムをレンダリング
   *
   * @param {Object} param0 - レンダリングパラメータ
   * @param {Chapter} param0.item - 章情報
   * @returns {JSX.Element} 章アイテムコンポーネント
   */
  const renderChapterItem = ({ item }: { item: Chapter }) => (
    <TouchableOpacity
      testID={`chapter-item-${item.id}`}
      style={styles.chapterItem}
      onPress={() => handleChapterPress(item)}
    >
      <View style={styles.chapterHeader} testID={`chapter-header-${item.id}`}>
        <Text style={styles.chapterTitle} testID={`chapter-title-${item.id}`}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center} testID="chapter-list-loading">
        <ActivityIndicator size="large" color="#2c3e50" testID="chapter-list-loading-indicator" />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="chapter-list-screen">
      <FlatList
        testID="chapter-list"
        data={chapters}
        renderItem={renderChapterItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center} testID="chapter-list-empty">
            <Text style={styles.emptyText} testID="chapter-list-empty-text">章がありません</Text>
          </View>
        }
      />

      <ErrorMessageModal
        testID="chapter-list-error-modal"
        visible={errorModalVisible}
        message={errorMessage}
        title="エラー"
        onClose={() => setErrorModalVisible(false)}
      />

      <ConfirmModal
        testID="chapter-list-login-confirm-modal"
        visible={confirmModalVisible}
        message="この章にアクセスするにはログインが必要です。"
        title="ログインが必要です"
        confirmText="ログイン"
        cancelText="キャンセル"
        onClose={() => setConfirmModalVisible(false)}
        onConfirm={() => {
          setConfirmModalVisible(false);
          navigation.navigate("Login");
        }}
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
  listContent: {
    padding: 16,
  },
  chapterItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chapterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

