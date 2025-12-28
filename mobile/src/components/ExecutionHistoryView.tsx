/**
 * 実行履歴表示コンポーネント
 * 
 * コードの実行履歴を表示するコンポーネント。
 * 問題IDや言語でフィルタリングして表示することができる。
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { apiClient } from "../services/api";
import { Execution } from "../types/api";
import { getOrCreateUserId } from "../utils/storage";

/**
 * コンポーネントのプロップ型定義
 */
interface Props {
  problemId?: string;  // 問題IDでフィルタ（オプション）
  language?: string;  // 言語でフィルタ（オプション）
  limit?: number;  // 表示件数の上限（デフォルト: 20）
}

/**
 * 実行履歴表示コンポーネント
 * 
 * コードの実行履歴をリスト形式で表示する。
 * 実行結果、実行日時、実行時間などを表示する。
 * 
 * @param {Props} props - コンポーネントのプロップ
 * @returns {JSX.Element} 実行履歴表示コンポーネント
 */
export default function ExecutionHistoryView({
  problemId,
  language,
  limit = 20,
}: Props) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [problemId, language]);

  /**
   * 実行履歴を読み込む
   */
  const loadHistory = async () => {
    try {
      setLoading(true);
      const userId = await getOrCreateUserId();
      const data = await apiClient.getExecutionHistory({
        user_id: userId,
        problem_id: problemId,
        language,
        limit,
      });
      setExecutions(data);
    } catch (error) {
      console.error("Failed to load execution history:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 日時をフォーマットする
   * 
   * @param {string} dateString - ISO形式の日時文字列
   * @returns {string} フォーマットされた日時文字列
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * ステータスに応じた色を返す
   * 
   * @param {string} status - 実行ステータス
   * @returns {string} 色コード
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "success":
        return "#28a745";
      case "error":
        return "#dc3545";
      case "timeout":
        return "#ffc107";
      default:
        return "#6c757d";
    }
  };

  /**
   * ステータスに応じた表示テキストを返す
   * 
   * @param {string} status - 実行ステータス
   * @returns {string} 表示テキスト
   */
  const getStatusText = (status: string): string => {
    switch (status) {
      case "success":
        return "✓ 成功";
      case "error":
        return "✗ エラー";
      case "timeout":
        return "⏱ タイムアウト";
      default:
        return status;
    }
  };

  const renderItem = ({ item }: { item: Execution }) => (
    <View
      testID={`execution-history-item-${item.execution_id}`}
      style={[
        styles.item,
        { borderLeftColor: getStatusColor(item.status) },
      ]}
    >
      <View style={styles.itemHeader} testID={`execution-history-item-header-${item.execution_id}`}>
        <Text 
          testID={`execution-history-item-status-${item.execution_id}`}
          style={[styles.statusText, { color: getStatusColor(item.status) }]}
        >
          {getStatusText(item.status)}
        </Text>
        <Text 
          testID={`execution-history-item-date-${item.execution_id}`}
          style={styles.dateText}
        >
          {formatDate(item.timestamp)}
        </Text>
      </View>
      {item.execution_time_sec !== undefined && (
        <Text 
          testID={`execution-history-item-time-${item.execution_id}`}
          style={styles.metaText}
        >
          実行時間: {item.execution_time_sec.toFixed(3)}秒
        </Text>
      )}
      {item.error_message && (
        <Text 
          testID={`execution-history-item-error-${item.execution_id}`}
          style={styles.errorText} 
          numberOfLines={2}
        >
          {item.error_message}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center} testID="execution-history-loading">
        <ActivityIndicator size="small" color="#2c3e50" testID="execution-history-loading-indicator" />
      </View>
    );
  }

  if (executions.length === 0) {
    return (
      <View style={styles.center} testID="execution-history-empty">
        <Text style={styles.emptyText} testID="execution-history-empty-text">実行履歴がありません</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="execution-history-container">
      <FlatList
        testID="execution-history-list"
        data={executions}
        renderItem={renderItem}
        keyExtractor={(item) => item.execution_id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    padding: 20,
    alignItems: "center",
  },
  item: {
    backgroundColor: "#fff",
    padding: 12,
    borderLeftWidth: 4,
    borderRadius: 4,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  metaText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#dc3545",
    marginTop: 4,
  },
  separator: {
    height: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});

