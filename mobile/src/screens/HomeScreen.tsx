/**
 * ホーム画面
 *
 * コース一覧を表示し、進捗情報とアクセス可能状態を表示する。
 * 各コースをタップすると、コース詳細画面に遷移する。
 */

import React, { useState, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { apiClient, Course } from "../services/api";
import { getErrorMessage, checkAuth } from "../utils/errorHandler";
import ErrorMessageModal from "../components/ErrorMessageModal";
import ConfirmModal from "../components/ConfirmModal";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

/**
 * ホーム画面コンポーネント
 *
 * @param {Props} props - ナビゲーションプロップ
 * @returns {JSX.Element} ホーム画面コンポーネント
 */
export default function HomeScreen({ navigation }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("エラー");
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingCourse, setPendingCourse] = useState<Course | null>(null);

  /**
   * コース一覧を読み込む
   */
  const loadCourses = useCallback(async () => {
    try {
      console.log("[HomeScreen] Loading courses...");
      const data = await apiClient.getCourses();
      console.log("[HomeScreen] Courses loaded:", data.length, "courses");
      console.log("[HomeScreen] Courses data:", JSON.stringify(data, null, 2));
      setCourses(data);
    } catch (error: any) {
      console.error("[HomeScreen] Failed to load courses:", error);
      console.error(
        "[HomeScreen] Error details:",
        JSON.stringify(error, null, 2)
      );
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * 画面がフォーカスされたときにコースを読み込む
   * useFocusEffectを使用することで、画面に戻ってきたときにも自動的に更新される
   */
  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses])
  );

  /**
   * プルリフレッシュ
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  /**
   * 進捗率をパーセント表示用の文字列に変換
   *
   * @param {number} rate - 進捗率（0.0-1.0）
   * @returns {string} パーセント表示用の文字列
   */
  const formatProgressRate = (rate: number): string => {
    return `${Math.round(rate * 100)}%`;
  };

  /**
   * コースアイテムがタップされたときのハンドラ
   *
   * @param {Course} course - タップされたコース
   */
  const handleCoursePress = async (course: Course) => {
    if (!course.is_accessible) {
      return;
    }

    // コースタイプに基づいて遷移先を決定
    if (course.course_type === "problem_list") {
      // 問題一覧画面に遷移（コーディング試験など）
      navigation.navigate("ProblemList");
      return;
    }

    if (course.course_type === "chapter_list") {
      // 章一覧画面に遷移（システム開発演習、業務効率化Python演習など）
      // 認証が必要な場合は確認モーダルを表示
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        setPendingCourse(course);
        setConfirmModalVisible(true);
        return;
      }

      navigation.navigate("ChapterList", {
        courseId: course.id,
        courseName: course.name,
      });
      return;
    }

    // 未知のコースタイプの場合はエラー
    console.error(`Unknown course type: ${course.course_type} for course ${course.id}`);
  };

  /**
   * コースアイテムをレンダリング
   *
   * @param {Object} param0 - レンダリングパラメータ
   * @param {Course} param0.item - コース情報
   * @returns {JSX.Element} コースアイテムコンポーネント
   */
  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={[
        styles.courseItem,
        !item.is_accessible && styles.courseItemDisabled,
      ]}
      onPress={() => handleCoursePress(item)}
      disabled={!item.is_accessible}
    >
      <View style={styles.courseHeader}>
        <Text
          style={[
            styles.courseName,
            !item.is_accessible && styles.courseNameDisabled,
          ]}
        >
          {item.name}
        </Text>
        {!item.is_accessible && (
          <View style={styles.preparingBadge}>
            <Text style={styles.preparingBadgeText}>準備中</Text>
          </View>
        )}
      </View>

      {item.description && (
        <Text
          style={[
            styles.courseDescription,
            !item.is_accessible && styles.courseDescriptionDisabled,
          ]}
        >
          {item.description}
        </Text>
      )}

      {item.target_audience && (
        <View style={styles.targetAudience}>
          <Text style={styles.targetAudienceText}>
            推奨対象: {item.target_audience}
          </Text>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${item.completion_rate * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {formatProgressRate(item.completion_rate)}
        </Text>
      </View>
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
    <View style={styles.container} testID="home-screen">
      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>コースがありません</Text>
          </View>
        }
      />

      <ErrorMessageModal
        visible={errorModalVisible}
        message={errorMessage}
        title={errorTitle}
        onClose={() => setErrorModalVisible(false)}
      />

      <ConfirmModal
        visible={confirmModalVisible}
        message="このコースにアクセスするにはログインが必要です。"
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
  courseItem: {
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
  courseItemDisabled: {
    opacity: 0.5,
    backgroundColor: "#f9f9f9",
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  courseName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
  },
  courseNameDisabled: {
    color: "#999",
  },
  preparingBadge: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  preparingBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  courseDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  courseDescriptionDisabled: {
    color: "#999",
  },
  targetAudience: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  targetAudienceText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "500",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginRight: 12,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#28a745",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    minWidth: 50,
    textAlign: "right",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
