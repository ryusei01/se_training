// コードエディタ画面（スマホ最適化）

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { Problem, Language, Execution } from "../types/api";
import { getOrCreateUserId, saveDraftLocally, getDraftLocally } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "CodeEditor">;

// シンボルバーの記号リスト
const SYMBOLS = [
  { label: "{", value: "{}", insert: (text: string, pos: number) => insertPair(text, pos, "{", "}") },
  { label: "(", value: "()", insert: (text: string, pos: number) => insertPair(text, pos, "(", ")") },
  { label: "[", value: "[]", insert: (text: string, pos: number) => insertPair(text, pos, "[", "]") },
  { label: "<", value: "<>", insert: (text: string, pos: number) => insertPair(text, pos, "<", ">") },
  { label: '"', value: '""', insert: (text: string, pos: number) => insertPair(text, pos, '"', '"') },
  { label: "'", value: "''", insert: (text: string, pos: number) => insertPair(text, pos, "'", "'") },
  { label: "=", value: "=" },
  { label: "+", value: "+" },
  { label: "-", value: "-" },
  { label: "*", value: "*" },
  { label: "/", value: "/" },
  { label: ":", value: ":" },
  { label: ";", value: ";" },
  { label: ",", value: "," },
  { label: ".", value: "." },
  { label: "_", value: "_" },
  { label: "->", value: "->" },
  { label: "&&", value: "&&" },
  { label: "||", value: "||" },
  { label: "!", value: "!" },
];

// ペア記号を挿入するヘルパー関数
function insertPair(
  text: string,
  position: number,
  open: string,
  close: string
): { newText: string; newPosition: number } {
  const before = text.substring(0, position);
  const after = text.substring(position);
  return {
    newText: before + open + close + after,
    newPosition: position + open.length,
  };
}

// スニペット（Python/TypeScript共通）
const SNIPPETS = {
  python: [
    { label: "if", value: "if :\n    " },
    { label: "for", value: "for  in :\n    " },
    { label: "def", value: "def ():\n    " },
    { label: "while", value: "while :\n    " },
  ],
  typescript: [
    { label: "if", value: "if () {\n    \n}" },
    { label: "for", value: "for (let i = 0; i < length; i++) {\n    \n}" },
    { label: "function", value: "function () {\n    \n}" },
    { label: "const", value: "const  = " },
  ],
};

export default function CodeEditorScreen({ route, navigation }: Props) {
  const { problemId, language } = route.params;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<Execution | null>(null);
  const [codeInputRef, setCodeInputRef] = useState<TextInput | null>(null);
  const codeInputPosition = useRef({ start: 0, end: 0 });
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadProblemAndDraft();
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [problemId, language]);

  // 自動保存（500ms待機）
  useEffect(() => {
    if (code && problem) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      autoSaveTimer.current = setTimeout(() => {
        saveDraft(code);
      }, 500);
    }
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [code, problem, language]);

  const loadProblemAndDraft = async () => {
    try {
      setLoading(true);
      const [problemData, userId] = await Promise.all([
        apiClient.getProblem(problemId),
        getOrCreateUserId(),
      ]);
      setProblem(problemData);

      // ドラフトを取得（サーバー → ローカルの順）
      let draftCode: string | null = null;
      try {
        const draft = await apiClient.getDraft(problemId, language, userId);
        draftCode = draft?.code || null;
      } catch (e) {
        // サーバーから取得失敗したらローカルから取得
        draftCode = await getDraftLocally(problemId, language);
      }

      if (draftCode) {
        setCode(draftCode);
      } else {
        // 初期コードを生成
        setCode(generateInitialCode(problemData, language));
      }
    } catch (error) {
      console.error("Failed to load problem:", error);
      Alert.alert("エラー", "問題の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const generateInitialCode = (problem: Problem, lang: Language): string => {
    if (lang === "typescript") {
      let sig = problem.function_signature;
      sig = sig.replace(/def\s+(\w+)/, "function $1");
      sig = sig.replace(/->\s*(\w+):/, ": $1");
      sig = sig.replace(/list\[int\]/g, "number[]");
      sig = sig.replace(/list\[str\]/g, "string[]");
      sig = sig.replace(/bool/g, "boolean");
      sig = sig.replace(/int/g, "number");
      return `export ${sig} {\n    \n}`;
    } else {
      return `${problem.function_signature}\n    pass`;
    }
  };

  const saveDraft = async (codeToSave: string) => {
    try {
      const userId = await getOrCreateUserId();
      // ローカルに保存（即座）
      await saveDraftLocally(problemId, language, codeToSave);
      // サーバーに保存（非同期）
      apiClient.saveDraft({
        problem_id: problemId,
        language,
        code: codeToSave,
        user_id: userId,
      }).catch((e) => console.error("Failed to save draft to server:", e));
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  const handleSymbolPress = (symbol: typeof SYMBOLS[0]) => {
    if (symbol.insert) {
      const { newText, newPosition } = symbol.insert(
        code,
        codeInputPosition.current.start
      );
      setCode(newText);
      // カーソル位置を設定（TextInputのselectionプロパティを使用）
      setTimeout(() => {
        codeInputRef?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
      }, 0);
    } else {
      // 単一記号の挿入
      const before = code.substring(0, codeInputPosition.current.start);
      const after = code.substring(codeInputPosition.current.start);
      setCode(before + symbol.value + after);
    }
  };

  const handleSnippetPress = (snippet: string) => {
    const before = code.substring(0, codeInputPosition.current.start);
    const after = code.substring(codeInputPosition.current.start);
    setCode(before + snippet + after);
  };

  const handleRun = async () => {
    if (!code.trim()) {
      Alert.alert("エラー", "コードを入力してください");
      return;
    }

    try {
      setExecuting(true);
      setExecutionResult(null);
      const userId = await getOrCreateUserId();
      const result = await apiClient.runCode({
        code,
        language,
        stdin: stdin || undefined,
        problem_id: problemId,
        user_id: userId,
      });
      setExecutionResult(result);
    } catch (error: any) {
      console.error("Failed to run code:", error);
      Alert.alert("エラー", error.response?.data?.detail || "実行に失敗しました");
    } finally {
      setExecuting(false);
    }
  };

  if (loading || !problem) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  const snippets = SNIPPETS[language] || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* シンボルバー */}
        <ScrollView
          horizontal
          style={styles.symbolBar}
          showsHorizontalScrollIndicator={false}
        >
          {SYMBOLS.map((symbol, index) => (
            <TouchableOpacity
              key={index}
              style={styles.symbolButton}
              onPress={() => handleSymbolPress(symbol)}
            >
              <Text style={styles.symbolButtonText}>{symbol.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* スニペットバー */}
        <ScrollView
          horizontal
          style={styles.snippetBar}
          showsHorizontalScrollIndicator={false}
        >
          {snippets.map((snippet, index) => (
            <TouchableOpacity
              key={index}
              style={styles.snippetButton}
              onPress={() => handleSnippetPress(snippet.value)}
            >
              <Text style={styles.snippetButtonText}>{snippet.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* コードエディタ */}
        <View style={styles.editorContainer}>
          <Text style={styles.editorLabel}>コード ({language})</Text>
          <TextInput
            ref={(ref) => setCodeInputRef(ref)}
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            onSelectionChange={(e) => {
              codeInputPosition.current = e.nativeEvent.selection;
            }}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            placeholder="コードを入力..."
          />
        </View>

        {/* 標準入力（オプション） */}
        <View style={styles.stdinContainer}>
          <Text style={styles.stdinLabel}>標準入力（オプション）</Text>
          <TextInput
            style={styles.stdinInput}
            value={stdin}
            onChangeText={setStdin}
            multiline
            textAlignVertical="top"
            placeholder="標準入力を入力..."
          />
        </View>

        {/* 実行ボタン */}
        <TouchableOpacity
          style={[styles.runButton, executing && styles.runButtonDisabled]}
          onPress={handleRun}
          disabled={executing}
        >
          {executing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.runButtonText}>実行</Text>
          )}
        </TouchableOpacity>

        {/* 実行結果 */}
        {executionResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>実行結果</Text>
            <View
              style={[
                styles.resultStatus,
                executionResult.status === "success" && styles.resultSuccess,
                executionResult.status === "error" && styles.resultError,
                executionResult.status === "timeout" && styles.resultTimeout,
              ]}
            >
              <Text style={styles.resultStatusText}>
                {executionResult.status === "success"
                  ? "✓ 成功"
                  : executionResult.status === "error"
                  ? "✗ エラー"
                  : executionResult.status === "timeout"
                  ? "⏱ タイムアウト"
                  : executionResult.status}
              </Text>
            </View>
            {executionResult.stdout && (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>標準出力:</Text>
                <Text style={styles.resultText}>{executionResult.stdout}</Text>
              </View>
            )}
            {(executionResult.stderr || executionResult.error_message) && (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>
                  {executionResult.stderr ? "標準エラー出力:" : "エラーメッセージ:"}
                </Text>
                <Text style={[styles.resultText, styles.resultErrorText]}>
                  {executionResult.stderr || executionResult.error_message}
                </Text>
              </View>
            )}
            {executionResult.execution_time_sec !== undefined && (
              <Text style={styles.resultMeta}>
                実行時間: {executionResult.execution_time_sec.toFixed(3)}秒
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  symbolBar: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  symbolButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
  },
  symbolButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  snippetBar: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  snippetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    backgroundColor: "#d1ecf1",
    borderRadius: 4,
  },
  snippetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0c5460",
  },
  editorContainer: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editorLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  codeInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    minHeight: 300,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
    color: "#333",
  },
  stdinContainer: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stdinLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  stdinInput: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    minHeight: 100,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 14,
  },
  runButton: {
    backgroundColor: "#28a745",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  runButtonDisabled: {
    backgroundColor: "#6c757d",
  },
  runButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  resultContainer: {
    backgroundColor: "#fff",
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  resultStatus: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    backgroundColor: "#e9ecef",
  },
  resultSuccess: {
    backgroundColor: "#d4edda",
  },
  resultError: {
    backgroundColor: "#f8d7da",
  },
  resultTimeout: {
    backgroundColor: "#fff3cd",
  },
  resultStatusText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultSection: {
    marginBottom: 12,
  },
  resultSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#666",
  },
  resultText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 4,
    color: "#333",
  },
  resultErrorText: {
    color: "#721c24",
  },
  resultMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
  },
});

