/**
 * 章詳細画面
 *
 * 選択された章の詳細情報を表示する画面。
 * 体験型教材として、各セクション（Goal、System Overview、File Explorer、Hands-on Steps、Run/Execute、Result、Why it works、Check）を表示する。
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
import MarkdownRenderer from "../components/MarkdownRenderer";
import FileExplorer from "../components/FileExplorer";
import VSCodeEditor from "../components/VSCodeEditor";
import DevToolsModal from "../components/DevToolsModal";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { Chapter, FileTreeItem, RunExecuteData, ResultData, CheckData } from "../types/api";
import { getErrorMessage } from "../utils/errorHandler";
import ErrorMessageModal from "../components/ErrorMessageModal";

type Props = NativeStackScreenProps<RootStackParamList, "ChapterDetail">;

/**
 * 章詳細画面コンポーネント
 *
 * 体験型教材として、各セクションを表示する。
 *
 * @param {Props} props - ナビゲーションプロップとルートパラメータ
 * @returns {JSX.Element} 章詳細画面コンポーネント
 */
export default function ChapterDetailScreen({ route, navigation }: Props) {
  const { chapterId, courseId } = route.params;
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [devToolsVisible, setDevToolsVisible] = useState(false);
  const [lastApiResult, setLastApiResult] = useState<any>(null);

  useEffect(() => {
    loadChapter();
  }, [chapterId, courseId]);

  // 画面がフォーカスされたときに一番上にスクロール
  useFocusEffect(
    React.useCallback(() => {
      const timer = setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [])
  );

  /**
   * 章情報を読み込む
   */
  const loadChapter = async () => {
    try {
      const data = await apiClient.getChapter(courseId, chapterId);
      setChapter(data);
    } catch (error: any) {
      console.error("Failed to load chapter:", error);
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Markdownコンテンツからセクションを抽出
   */
  const parseContentToSections = (content: string | null | undefined) => {
    if (!content) return null;
    
    const sections: {
      goal?: string;
      system_overview?: string;
      hands_on_steps?: string;
      why_it_works?: string;
    } = {};
    
    // Goalセクションを抽出（全角・半角括弧に対応、改行の処理を改善）
    // パターン: ## Goal（任意の文字）\n\n内容...
    const goalMatch = content.match(/## Goal[^\n]*[（(][^）)]*[）)][^\n]*\n+([\s\S]*?)(?=\n## |$)/i);
    if (goalMatch) {
      sections.goal = goalMatch[1].trim();
    }
    
    // System Overviewセクションを抽出
    const systemOverviewMatch = content.match(/## System Overview[^\n]*[（(][^）)]*[）)][^\n]*\n+([\s\S]*?)(?=\n## |$)/i);
    if (systemOverviewMatch) {
      sections.system_overview = systemOverviewMatch[1].trim();
    }
    
    // Hands-on Stepsセクションを抽出
    const handsOnMatch = content.match(/## Hands-on Steps[^\n]*[（(][^）)]*[）)][^\n]*\n+([\s\S]*?)(?=\n## |$)/i);
    if (handsOnMatch) {
      sections.hands_on_steps = handsOnMatch[1].trim();
    }
    
    // Run / Executeセクションを抽出
    const runExecuteMatch = content.match(/## Run \/ Execute[^\n]*[（(][^）)]*[）)][^\n]*\n+([\s\S]*?)(?=\n## |$)/i);
    
    // Resultセクションを抽出
    const resultMatch = content.match(/## Result[^\n]*[（(][^）)]*[）)][^\n]*\n+([\s\S]*?)(?=\n## |$)/i);
    
    // Why it worksセクションを抽出
    const whyItWorksMatch = content.match(/## Why it works[^\n]*[（(][^）)]*[）)][^\n]*\n+([\s\S]*?)(?=\n## |$)/i);
    if (whyItWorksMatch) {
      sections.why_it_works = whyItWorksMatch[1].trim();
    }
    
    return sections;
  };

  /**
   * セクションを表示するかどうか
   */
  const hasSection = (content?: string | null): boolean => {
    return content !== null && content !== undefined && content.trim() !== "";
  };

  /**
   * セクションヘッダーコンポーネント
   */
  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  /**
   * セクションコンテンツコンポーネント
   */
  const SectionContent = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.sectionContent}>{children}</View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2c3e50" />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>章が見つかりません</Text>
      </View>
    );
  }

  // 既存のcontentからセクションを抽出（後方互換性のため）
  const parsedSections = chapter.content ? parseContentToSections(chapter.content) : null;
  
  // デバッグログ
  console.log("Chapter content:", chapter.content?.substring(0, 200));
  console.log("Parsed sections:", parsedSections);
  
  // 新しいフィールドがあれば優先、なければcontentから抽出したものを使う
  const goal = chapter.goal || parsedSections?.goal || null;
  const system_overview = chapter.system_overview || parsedSections?.system_overview || null;
  const hands_on_steps = chapter.hands_on_steps || parsedSections?.hands_on_steps || null;
  const why_it_works = chapter.why_it_works || parsedSections?.why_it_works || null;
  
  // デバッグログ
  console.log("Final values - goal:", goal?.substring(0, 50), "system_overview:", system_overview?.substring(0, 50));
  
  // JSONデータをパース
  let runExecuteData: RunExecuteData | null = null;
  let resultData: ResultData | null = null;
  let checkData: CheckData | null = null;

  try {
    if (chapter.run_execute_data) {
      runExecuteData = JSON.parse(chapter.run_execute_data);
    }
    if (chapter.result_data) {
      resultData = JSON.parse(chapter.result_data);
    }
    if (chapter.check_data) {
      checkData = JSON.parse(chapter.check_data);
    }
  } catch (error) {
    console.error("Failed to parse JSON data:", error);
  }

  return (
    <View style={styles.container}>
      <DevToolsModal visible={devToolsVisible} onClose={() => setDevToolsVisible(false)} />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* タイトル */}
        <View style={styles.header}>
          <Text style={styles.title}>{chapter.title}</Text>
        </View>

        {/* Goal（この章でできるようになること） */}
        {hasSection(goal) && (
          <View style={styles.section}>
            <SectionHeader title="Goal（この章でできるようになること）" icon="🎯" />
            <SectionContent>
              <MarkdownRenderer content={goal!} />
            </SectionContent>
          </View>
        )}

        {/* System Overview（今どこを触っているか） */}
        {hasSection(system_overview) && (
          <View style={styles.section}>
            <SectionHeader title="System Overview（今どこを触っているか）" icon="🗺️" />
            <SectionContent>
              <MarkdownRenderer content={system_overview!} />
            </SectionContent>
          </View>
        )}

        {/* File Explorer（VS Code風ファイルツリー）+ エディタ */}
        {hasSection(chapter.file_explorer_data) && (
          <View style={styles.section}>
            <SectionHeader title="File Explorer & Code Editor（VS Code風開発環境）" icon="📁" />
            <SectionContent>
              {(() => {
                try {
                  const fileTreeData: FileTreeItem[] = JSON.parse(chapter.file_explorer_data!);
                  return (
                    <VSCodeEditor
                      fileTree={fileTreeData}
                      onFileChange={(filePath, content) => {
                        console.log("File changed:", filePath, content.length, "chars");
                      }}
                      onSave={(filePath, content) => {
                        console.log("File saved:", filePath, content.length, "chars");
                        // TODO: ファイル保存処理を実装
                      }}
                    />
                  );
                } catch (error) {
                  console.error("Failed to parse file tree data:", error);
                  return <FileExplorer data={chapter.file_explorer_data!} />;
                }
              })()}
            </SectionContent>
          </View>
        )}

        {/* Hands-on Steps（操作手順） */}
        {hasSection(hands_on_steps) && (
          <View style={styles.section}>
            <SectionHeader title="Hands-on Steps（操作手順）" icon="✋" />
            <SectionContent>
              <MarkdownRenderer content={hands_on_steps!} />
            </SectionContent>
          </View>
        )}

        {/* Run / Execute（実行） */}
        {runExecuteData && (
          <View style={styles.section}>
            <SectionHeader title="Run / Execute（実行）" icon="▶️" />
            <SectionContent>
              {runExecuteData.type === "frontend" && runExecuteData.frontend_url && (
                <View style={styles.executeContainer}>
                  <Text style={styles.executeLabel}>フロントエンド実行:</Text>
                  <View style={styles.iframeContainer}>
                    <Text style={styles.iframeNote}>
                      iframe表示: {runExecuteData.frontend_url}
                    </Text>
                    <Text style={styles.iframeNote}>
                      （Phase1ではURL表示のみ、Phase2でiframe実装予定）
                    </Text>
                  </View>
                </View>
              )}
              {runExecuteData.type === "api" && (
                <View style={styles.executeContainer}>
                  <Text style={styles.executeLabel}>API実行:</Text>
                  <Text style={styles.executeText}>
                    {runExecuteData.api_method} {runExecuteData.api_endpoint}
                  </Text>
                  <TouchableOpacity
                    style={styles.runButton}
                    onPress={async () => {
                      try {
                        const res = await apiClient.runTrainingApi(
                          runExecuteData.api_method || "GET",
                          runExecuteData.api_endpoint || "/",
                          runExecuteData.api_request_body
                        );
                        setLastApiResult(res);
                        // 実行後に DevTools を開く（Network/Logs を観測させる）
                        setDevToolsVisible(true);
                      } catch (e) {
                        const message = getErrorMessage(e);
                        setErrorMessage(message);
                        setErrorModalVisible(true);
                      }
                    }}
                  >
                    <Text style={styles.runButtonText}>実行して Network を見る</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.runButton, { backgroundColor: "#2c3e50" }]}
                    onPress={() => navigation.navigate("RequestList")}
                  >
                    <Text style={styles.runButtonText}>申請一覧画面を開く</Text>
                  </TouchableOpacity>
                  {runExecuteData.api_request_body && (
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeText}>
                        {JSON.stringify(runExecuteData.api_request_body, null, 2)}
                      </Text>
                    </View>
                  )}
                  {lastApiResult && (
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeText}>
                        {JSON.stringify(lastApiResult, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              {runExecuteData.type === "deploy" && runExecuteData.deploy_logs && (
                <View style={styles.executeContainer}>
                  <Text style={styles.executeLabel}>デプロイ実行:</Text>
                  <View style={styles.codeBlock}>
                    <Text style={styles.codeText}>{runExecuteData.deploy_logs}</Text>
                  </View>
                </View>
              )}
            </SectionContent>
          </View>
        )}

        {/* Result（結果確認） */}
        {resultData && (
          <View style={styles.section}>
            <SectionHeader title="Result（結果確認）" icon="📊" />
            <SectionContent>
              {resultData.type === "screen" && resultData.screen_url && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultLabel}>画面表示:</Text>
                  <Text style={styles.resultText}>{resultData.screen_url}</Text>
                </View>
              )}
              {resultData.type === "network" && resultData.network_data && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultLabel}>Network表示:</Text>
                  <TouchableOpacity
                    style={styles.runButton}
                    onPress={() => setDevToolsVisible(true)}
                  >
                    <Text style={styles.runButtonText}>DevTools を開く</Text>
                  </TouchableOpacity>
                </View>
              )}
              {resultData.type === "logs" && resultData.logs_data && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultLabel}>Logs表示:</Text>
                  <TouchableOpacity
                    style={styles.runButton}
                    onPress={() => setDevToolsVisible(true)}
                  >
                    <Text style={styles.runButtonText}>DevTools を開く</Text>
                  </TouchableOpacity>
                </View>
              )}
            </SectionContent>
          </View>
        )}

        {/* Why it works（仕組み解説） */}
        {hasSection(why_it_works) && (
          <View style={styles.section}>
            <SectionHeader title="Why it works（仕組み解説）" icon="💡" />
            <SectionContent>
              <MarkdownRenderer content={why_it_works!} />
            </SectionContent>
          </View>
        )}

        {/* Check（理解チェック） */}
        {checkData && checkData.questions && checkData.questions.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Check（理解チェック）" icon="✅" />
            <SectionContent>
              {checkData.questions.map((question, index) => (
                <View key={index} style={styles.checkItem}>
                  <Text style={styles.checkQuestion}>
                    {index + 1}. {question.question}
                  </Text>
                  {question.options && question.options.length > 0 && (
                    <View style={styles.checkOptions}>
                      {question.options.map((option, optIndex) => (
                        <Text key={optIndex} style={styles.checkOption}>
                          • {option}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </SectionContent>
          </View>
        )}

        {/* 後方互換性: contentフィールドがあり、セクションに分割できない場合は全体を表示 */}
        {hasSection(chapter.content) && !goal && !system_overview && !hands_on_steps && (
          <View style={styles.section}>
            <SectionContent>
              <MarkdownRenderer content={chapter.content!} />
            </SectionContent>
          </View>
        )}
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#2c3e50",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  sectionContent: {
    marginTop: 8,
  },
  executeContainer: {
    marginTop: 8,
  },
  executeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  executeText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  iframeContainer: {
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  iframeNote: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  runButton: {
    marginTop: 10,
    backgroundColor: "#007acc",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  runButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  resultContainer: {
    marginTop: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: "#666",
  },
  codeBlock: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 8,
  },
  codeText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#2c3e50",
  },
  checkItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  checkQuestion: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  checkOptions: {
    marginLeft: 16,
  },
  checkOption: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
  },
});
