/**
 * コードエディタ画面（スマホ最適化）
 *
 * コードを編集・実行する画面。
 * シンボルバー、スニペットバー、コードエディタ、実行結果の表示機能を提供する。
 * 編集中のコードは自動的にドラフトとして保存される。
 */

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
import Markdown from "react-native-markdown-display";
import * as Clipboard from "expo-clipboard";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { Problem, Language, Execution } from "../types/api";
import {
  getOrCreateUserId,
  saveDraftLocally,
  getDraftLocally,
} from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "CodeEditor">;

/**
 * シンボルバーの記号リスト
 *
 * コード編集時に挿入できる記号のリスト。
 * ペア記号（{}、[]など）は自動的に閉じる記号も挿入される。
 */
const SYMBOLS = [
  {
    label: "{",
    value: "{}",
    insert: (text: string, pos: number) => insertPair(text, pos, "{", "}"),
  },
  {
    label: "(",
    value: "()",
    insert: (text: string, pos: number) => insertPair(text, pos, "(", ")"),
  },
  {
    label: "[",
    value: "[]",
    insert: (text: string, pos: number) => insertPair(text, pos, "[", "]"),
  },
  {
    label: "<",
    value: "<>",
    insert: (text: string, pos: number) => insertPair(text, pos, "<", ">"),
  },
  {
    label: '"',
    value: '""',
    insert: (text: string, pos: number) => insertPair(text, pos, '"', '"'),
  },
  {
    label: "'",
    value: "''",
    insert: (text: string, pos: number) => insertPair(text, pos, "'", "'"),
  },
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

/**
 * ペア記号を挿入するヘルパー関数
 *
 * 開き記号と閉じ記号のペアを挿入し、カーソルを開き記号と閉じ記号の間に配置する。
 *
 * @param {string} text - 現在のテキスト
 * @param {number} position - カーソル位置
 * @param {string} open - 開き記号（例: "{"）
 * @param {string} close - 閉じ記号（例: "}"）
 * @returns {{newText: string, newPosition: number}} 新しいテキストとカーソル位置
 */
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

/**
 * スニペット（Python/TypeScript共通）
 *
 * コード編集時に挿入できるコードスニペットのリスト。
 * 言語ごとに異なるスニペットが定義されている。
 */
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
  const [executionResult, setExecutionResult] = useState<Execution | null>(
    null
  );
  const [codeInputRef, setCodeInputRef] = useState<TextInput | null>(null);
  const codeInputPosition = useRef({ start: 0, end: 0 });
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Undo/Redo機能
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);

  // ヒントと解説の表示状態
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    loadProblemAndDraft();
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [problemId, language]);

  // コード変更時に履歴に追加（undo/redo操作は除外）
  useEffect(() => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    if (code) {
      setHistory((prev) => {
        const currentIndex = historyIndex;
        // 直前の履歴と同じ場合は追加しない（連続した同じ変更を防ぐ）
        if (
          prev.length > 0 &&
          currentIndex >= 0 &&
          prev[currentIndex] === code
        ) {
          return prev;
        }

        const newHistory = prev.slice(0, currentIndex + 1);
        newHistory.push(code);
        // 履歴は最大50件まで保持
        if (newHistory.length > 50) {
          newHistory.shift();
          return newHistory;
        }
        return newHistory;
      });
      setHistoryIndex((prev) => {
        // 直前の履歴と同じ場合はインデックスを更新しない
        if (history.length > 0 && prev >= 0 && history[prev] === code) {
          return prev;
        }
        const newIndex = prev + 1;
        // 履歴が50件を超えた場合は調整
        return newIndex >= 50 ? 49 : newIndex;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

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

  /**
   * 問題情報とドラフトを読み込む
   *
   * 問題情報を取得し、保存されているドラフトがあれば復元する。
   * ドラフトがない場合は、関数シグネチャから初期コードを生成する。
   */
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
        // 初期コードを履歴に追加
        setHistory([draftCode]);
        setHistoryIndex(0);
      } else {
        // 初期コードを生成
        const initialCode = generateInitialCode(problemData, language);
        setCode(initialCode);
        // 初期コードを履歴に追加
        setHistory([initialCode]);
        setHistoryIndex(0);
      }
    } catch (error) {
      console.error("Failed to load problem:", error);
      Alert.alert("エラー", "問題の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 初期コードを生成する
   *
   * 問題の関数シグネチャから、選択された言語に応じた初期コードを生成する。
   *
   * @param {Problem} problem - 問題情報
   * @param {Language} lang - プログラミング言語
   * @returns {string} 初期コード
   */
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

  /**
   * ドラフトを保存する
   *
   * 編集中のコードをローカルストレージとサーバーに保存する。
   * ローカル保存は即座に行われ、サーバー保存は非同期で行われる。
   *
   * @param {string} codeToSave - 保存するコード
   */
  const saveDraft = async (codeToSave: string) => {
    try {
      const userId = await getOrCreateUserId();
      // ローカルに保存（即座）
      await saveDraftLocally(problemId, language, codeToSave);
      // サーバーに保存（非同期）
      apiClient
        .saveDraft({
          problem_id: problemId,
          language,
          code: codeToSave,
          user_id: userId,
        })
        .catch((e) => console.error("Failed to save draft to server:", e));
    } catch (error) {
      console.error("Failed to save draft:", error);
    }
  };

  /**
   * シンボルボタンが押されたときのハンドラ
   *
   * シンボルをカーソル位置に挿入する。
   * ペア記号の場合は、開き記号と閉じ記号を挿入し、カーソルを間に配置する。
   * キーボードは表示したままにする。
   *
   * @param {typeof SYMBOLS[0]} symbol - 押されたシンボル
   */
  const handleSymbolPress = (symbol: (typeof SYMBOLS)[0]) => {
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
        // キーボードを表示したままにする
        codeInputRef?.focus();
      }, 0);
    } else {
      // 単一記号の挿入
      const before = code.substring(0, codeInputPosition.current.start);
      const after = code.substring(codeInputPosition.current.start);
      const newText = before + symbol.value + after;
      setCode(newText);
      // カーソル位置を更新
      setTimeout(() => {
        const newPosition =
          codeInputPosition.current.start + symbol.value.length;
        codeInputRef?.setNativeProps({
          selection: { start: newPosition, end: newPosition },
        });
        // キーボードを表示したままにする
        codeInputRef?.focus();
      }, 0);
    }
  };

  /**
   * スニペットボタンが押されたときのハンドラ
   *
   * スニペットをカーソル位置に挿入する。
   * キーボードは表示したままにする。
   *
   * @param {string} snippet - 挿入するスニペット
   */
  const handleSnippetPress = (snippet: string) => {
    const before = code.substring(0, codeInputPosition.current.start);
    const after = code.substring(codeInputPosition.current.start);
    const newText = before + snippet + after;
    setCode(newText);
    // カーソル位置を更新
    setTimeout(() => {
      const newPosition = codeInputPosition.current.start + snippet.length;
      codeInputRef?.setNativeProps({
        selection: { start: newPosition, end: newPosition },
      });
      // キーボードを表示したままにする
      codeInputRef?.focus();
    }, 0);
  };

  /**
   * Undo機能
   *
   * 履歴を1つ前に戻す。
   */
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCode(history[newIndex]);
      // キーボードを表示したままにする
      setTimeout(() => {
        codeInputRef?.focus();
      }, 0);
    }
  };

  /**
   * Redo機能
   *
   * 履歴を1つ先に進める。
   */
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCode(history[newIndex]);
      // キーボードを表示したままにする
      setTimeout(() => {
        codeInputRef?.focus();
      }, 0);
    }
  };

  /**
   * コードをクリップボードにコピー
   */
  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert("コピー完了", "コードをクリップボードにコピーしました");
    } catch (error) {
      console.error("Failed to copy code:", error);
      Alert.alert("エラー", "コピーに失敗しました");
    }
  };

  /**
   * 問題文をクリップボードにコピー
   */
  const handleCopyProblem = async () => {
    if (!problem) return;
    try {
      const problemText = `${problem.id}: ${problem.title}\n\n${problem.description}`;
      await Clipboard.setStringAsync(problemText);
      Alert.alert("コピー完了", "問題文をクリップボードにコピーしました");
    } catch (error) {
      console.error("Failed to copy problem:", error);
      Alert.alert("エラー", "コピーに失敗しました");
    }
  };

  /**
   * コードを実行する
   *
   * 入力されたコードをサーバーに送信して実行し、結果を表示する。
   * テストは実行せず、スクリプトとして直接実行される（簡易実行）。
   */
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
      Alert.alert(
        "エラー",
        error.response?.data?.detail || "実行に失敗しました"
      );
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Undo/Redoバー */}
        <View style={styles.undoRedoBar}>
          <TouchableOpacity
            style={[
              styles.undoRedoButton,
              historyIndex <= 0 && styles.undoRedoButtonDisabled,
            ]}
            onPress={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Text
              style={[
                styles.undoRedoButtonText,
                historyIndex <= 0 && styles.undoRedoButtonTextDisabled,
              ]}
            >
              ↶ Undo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.undoRedoButton,
              historyIndex >= history.length - 1 &&
                styles.undoRedoButtonDisabled,
            ]}
            onPress={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Text
              style={[
                styles.undoRedoButtonText,
                historyIndex >= history.length - 1 &&
                  styles.undoRedoButtonTextDisabled,
              ]}
            >
              ↷ Redo
            </Text>
          </TouchableOpacity>
        </View>

        {/* シンボルバー */}
        <ScrollView
          horizontal
          style={styles.symbolBar}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {SYMBOLS.map((symbol, index) => (
            <TouchableOpacity
              key={index}
              style={styles.symbolButton}
              onPress={() => handleSymbolPress(symbol)}
              activeOpacity={0.7}
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
          keyboardShouldPersistTaps="handled"
        >
          {snippets.map((snippet, index) => (
            <TouchableOpacity
              key={index}
              style={styles.snippetButton}
              onPress={() => handleSnippetPress(snippet.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.snippetButtonText}>{snippet.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 問題文とコピーボタン */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>問題文</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyProblem}
            >
              <Text style={styles.copyButtonText}>問題文コピー</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.description}>
            <Markdown>{problem.description}</Markdown>
          </View>
        </View>

        {/* ヒント */}
        {problem.hint && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowHint(!showHint)}
            >
              <Text style={styles.toggleButtonText}>
                {showHint ? "ヒント非表示" : "ヒント表示"}
              </Text>
            </TouchableOpacity>
            {showHint && (
              <View style={styles.description}>
                <Markdown>{problem.hint}</Markdown>
              </View>
            )}
          </View>
        )}

        {/* 答えと解説 */}
        {problem.solution && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowSolution(!showSolution)}
            >
              <Text style={styles.toggleButtonText}>
                {showSolution ? "解説非表示" : "解説表示"}
              </Text>
            </TouchableOpacity>
            {showSolution && (
              <View style={styles.description}>
                <Markdown>{problem.solution}</Markdown>
              </View>
            )}
          </View>
        )}

        {/* コードエディタ */}
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorLabel}>コード ({language})</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyCode}
            >
              <Text style={styles.copyButtonText}>コードコピー</Text>
            </TouchableOpacity>
          </View>
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
          <View style={styles.stdinHeader}>
            <View>
              <Text style={styles.stdinLabel}>標準入力（オプション）</Text>
              <Text style={styles.stdinDescription}>
                コード内のinput()やreadline()などで読み込む値を入力します
              </Text>
            </View>
          </View>
          <TextInput
            style={styles.stdinInput}
            value={stdin}
            onChangeText={setStdin}
            multiline
            textAlignVertical="top"
            placeholder="例: 5\nhello\n1 2 3"
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
                  {executionResult.stderr
                    ? "標準エラー出力:"
                    : "エラーメッセージ:"}
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
  scrollViewContent: {
    paddingBottom: 100,
  },
  undoRedoBar: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  undoRedoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#e9ecef",
    borderRadius: 4,
    minWidth: 80,
    alignItems: "center",
  },
  undoRedoButtonDisabled: {
    backgroundColor: "#f5f5f5",
    opacity: 0.5,
  },
  undoRedoButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  undoRedoButtonTextDisabled: {
    color: "#999",
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
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  editorLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#17a2b8",
    borderRadius: 4,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
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
    marginBottom: 4,
    color: "#333",
  },
  stdinHeader: {
    marginBottom: 8,
  },
  stdinDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
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
    marginBottom: 8,
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
    marginBottom: 16,
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
  section: {
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
  description: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
});
