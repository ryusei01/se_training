/**
 * 問題詳細画面
 * 
 * 選択された問題の詳細情報を表示する画面。
 * 問題文、ヒント、解答、使用言語の選択などを表示する。
 */

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import Markdown from "react-native-markdown-display";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { Problem, Language } from "../types/api";

type Props = NativeStackScreenProps<RootStackParamList, "ProblemDetail">;

/**
 * 問題詳細画面コンポーネント
 * 
 * 問題の詳細情報（問題文、ヒント、解答など）を表示し、
 * ユーザーが言語を選択してコードエディタに遷移できるようにする。
 * 
 * @param {Props} props - ナビゲーションプロップとルートパラメータ
 * @returns {JSX.Element} 問題詳細画面コンポーネント
 */
export default function ProblemDetailScreen({ route, navigation }: Props) {
  const { problemId } = route.params;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("python");
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  // 画面がフォーカスされたときに一番上にスクロール
  useFocusEffect(
    React.useCallback(() => {
      // 少し遅延させてからスクロール（レンダリング完了後）
      const timer = setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  /**
   * 問題情報を読み込む
   */
  const loadProblem = async () => {
    try {
      const data = await apiClient.getProblem(problemId);
      setProblem(data);
      // 対応言語の最初の言語を選択
      if (data.supported_languages && data.supported_languages.length > 0) {
        setSelectedLanguage(data.supported_languages[0]);
      }
    } catch (error) {
      console.error("Failed to load problem:", error);
      // TODO: エラー表示
    } finally {
      setLoading(false);
    }
  };

  /**
   * 「コードを書く」ボタンが押されたときのハンドラ
   * 
   * コードエディタ画面に遷移する。
   */
  const handleStartCoding = () => {
    navigation.navigate("CodeEditor", {
      problemId: problemId,
      language: selectedLanguage,
    });
  };

  if (loading || !problem) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  const supportedLanguages = problem.supported_languages || ["python"];

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{problem.id}: {problem.title}</Text>
          <View style={styles.meta}>
            <Text style={styles.category}>
              カテゴリ: {problem.category.join(", ")}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>問題文</Text>
          <View style={styles.description}>
            <Markdown>{problem.description}</Markdown>
          </View>
        </View>

        {problem.hint && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowHint(!showHint)}
            >
              <Text style={styles.toggleButtonText}>
                💡 ヒント {showHint ? "を非表示" : "を表示"}
              </Text>
            </TouchableOpacity>
            {showHint && (
              <View style={styles.description}>
                <Markdown>{problem.hint}</Markdown>
              </View>
            )}
          </View>
        )}

        {problem.solution && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowSolution(!showSolution)}
            >
              <Text style={styles.toggleButtonText}>
                📖 答えと解説 {showSolution ? "を非表示" : "を表示"}
              </Text>
            </TouchableOpacity>
            {showSolution && (
              <View style={styles.description}>
                <Markdown>{problem.solution}</Markdown>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>使用言語</Text>
          <View style={styles.languageSelector}>
            {supportedLanguages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageButton,
                  selectedLanguage === lang && styles.languageButtonActive,
                ]}
                onPress={() => setSelectedLanguage(lang)}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    selectedLanguage === lang && styles.languageButtonTextActive,
                  ]}
                >
                  {lang === "python" ? "Python" : "TypeScript"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartCoding}
        >
          <Text style={styles.startButtonText}>コードを書く</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  meta: {
    marginTop: 8,
  },
  category: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    marginTop: 8,
  },
  toggleButton: {
    padding: 12,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    marginBottom: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  languageSelector: {
    flexDirection: "row",
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  languageButtonActive: {
    backgroundColor: "#2c3e50",
    borderColor: "#2c3e50",
  },
  languageButtonText: {
    fontSize: 14,
    color: "#333",
  },
  languageButtonTextActive: {
    color: "#fff",
  },
  startButton: {
    backgroundColor: "#28a745",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

