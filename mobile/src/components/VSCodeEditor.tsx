/**
 * VS Code風エディタコンポーネント
 *
 * ファイルツリーとコードエディタを統合したVS Code風のUI。
 * ファイルを選択して編集・保存ができる。
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { FileTreeItem } from "../types/api";

interface VSCodeEditorProps {
  fileTree: FileTreeItem[];
  initialSelectedFile?: string;
  onFileChange?: (filePath: string, content: string) => void;
  onSave?: (filePath: string, content: string) => void;
}

/**
 * VS Code風エディタコンポーネント
 *
 * @param {VSCodeEditorProps} props - プロップス
 * @returns {JSX.Element} VS Code風エディタコンポーネント
 */
export default function VSCodeEditor({
  fileTree,
  initialSelectedFile,
  onFileChange,
  onSave,
}: VSCodeEditorProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(initialSelectedFile || null);
  const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
  const [editedFiles, setEditedFiles] = useState<Set<string>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const codeInputRef = useRef<TextInput>(null);

  // 初期ファイルを選択
  useEffect(() => {
    if (initialSelectedFile && !selectedFile) {
      const file = findFileByPath(fileTree, initialSelectedFile);
      if (file && file.content) {
        setSelectedFile(initialSelectedFile);
        setFileContents(new Map([[initialSelectedFile, file.content]]));
      }
    }
  }, [initialSelectedFile, fileTree, selectedFile]);

  /**
   * パスでファイルを検索
   */
  const findFileByPath = (tree: FileTreeItem[], path: string): FileTreeItem | null => {
    for (const item of tree) {
      if (item.path === path && item.type === "file") {
        return item;
      }
      if (item.type === "folder" && item.children) {
        const found = findFileByPath(item.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  /**
   * フォルダの展開/折りたたみ
   */
  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  /**
   * ファイルを選択
   */
  const handleFileClick = (filePath: string) => {
    const file = findFileByPath(fileTree, filePath);
    if (!file) return;

    setSelectedFile(filePath);
    
    // ファイル内容がまだ読み込まれていない場合は読み込む
    if (!fileContents.has(filePath)) {
      const content = file.content || "";
      setFileContents(new Map([...fileContents, [filePath, content]]));
    }
  };

  /**
   * コードの変更を処理
   */
  const handleCodeChange = (text: string) => {
    if (!selectedFile) return;

    const newContents = new Map(fileContents);
    newContents.set(selectedFile, text);
    setFileContents(newContents);
    
    if (!editedFiles.has(selectedFile)) {
      setEditedFiles(new Set([...editedFiles, selectedFile]));
    }

    if (onFileChange) {
      onFileChange(selectedFile, text);
    }
  };

  /**
   * ファイルを保存
   */
  const handleSave = () => {
    if (!selectedFile) return;

    const content = fileContents.get(selectedFile) || "";
    
    // 編集済みマークを削除
    const newEditedFiles = new Set(editedFiles);
    newEditedFiles.delete(selectedFile);
    setEditedFiles(newEditedFiles);

    if (onSave) {
      onSave(selectedFile, content);
    }
  };

  /**
   * ファイルツリーアイテムをレンダリング
   */
  const renderFileTreeItem = (item: FileTreeItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const isSelected = selectedFile === item.path;
    const isEdited = editedFiles.has(item.path);

    if (item.type === "folder") {
      return (
        <View key={item.path}>
          <TouchableOpacity
            style={[styles.treeItem, { paddingLeft: 12 + level * 20 }]}
            onPress={() => toggleFolder(item.path)}
          >
            <Text style={styles.folderIcon}>{isExpanded ? "📂" : "📁"}</Text>
            <Text style={styles.treeItemText}>{item.name}</Text>
          </TouchableOpacity>
          {isExpanded && item.children && (
            <View>{item.children.map((child) => renderFileTreeItem(child, level + 1))}</View>
          )}
        </View>
      );
    } else {
      return (
        <TouchableOpacity
          key={item.path}
          style={[
            styles.treeItem,
            { paddingLeft: 12 + level * 20 },
            isSelected && styles.selectedTreeItem,
          ]}
          onPress={() => handleFileClick(item.path)}
        >
          <Text style={styles.fileIcon}>📄</Text>
          <Text
            style={[
              styles.treeItemText,
              isSelected && styles.selectedTreeItemText,
              isEdited && styles.editedFileText,
            ]}
          >
            {item.name}
            {isEdited && " ●"}
          </Text>
        </TouchableOpacity>
      );
    }
  };

  /**
   * コードを行番号付きでレンダリング
   */
  const renderCodeWithLineNumbers = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, index) => (
      <View key={index} style={styles.codeLine}>
        <Text style={styles.lineNumber}>{index + 1}</Text>
        <Text style={styles.codeLineText}>{line || " "}</Text>
      </View>
    ));
  };

  const selectedContent = selectedFile ? fileContents.get(selectedFile) || "" : "";

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>📁 Explorer</Text>
        </View>
        {selectedFile && editedFiles.has(selectedFile) && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>💾 保存 (Ctrl+S)</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* ファイルツリー */}
        <View style={styles.fileTree}>
          <ScrollView style={styles.treeScroll}>
            {fileTree.map((item) => renderFileTreeItem(item))}
          </ScrollView>
        </View>

        {/* コードエディタ */}
        <View style={styles.editor}>
          {selectedFile ? (
            <>
              <View style={styles.editorHeader}>
                <Text style={styles.editorFileName}>{selectedFile}</Text>
                {editedFiles.has(selectedFile) && (
                  <Text style={styles.editedIndicator}>● 編集中</Text>
                )}
              </View>
              <ScrollView
                ref={scrollViewRef}
                style={styles.codeScroll}
                contentContainerStyle={styles.codeContainer}
              >
                <TextInput
                  ref={codeInputRef}
                  style={styles.codeInput}
                  multiline
                  value={selectedContent}
                  onChangeText={handleCodeChange}
                  placeholder="コードを編集してください..."
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlignVertical="top"
                />
              </ScrollView>
            </>
          ) : (
            <View style={styles.noFileSelected}>
              <Text style={styles.noFileText}>ファイルを選択してください</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const { width } = Dimensions.get("window");
const FILE_TREE_WIDTH = Math.min(250, width * 0.35);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#252526",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#cccccc",
  },
  saveButton: {
    backgroundColor: "#007acc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flexDirection: "row",
    flex: 1,
    minHeight: 400,
  },
  fileTree: {
    width: FILE_TREE_WIDTH,
    backgroundColor: "#252526",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  treeScroll: {
    flex: 1,
  },
  treeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 8,
  },
  selectedTreeItem: {
    backgroundColor: "#2a2d2e",
  },
  folderIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  fileIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  treeItemText: {
    fontSize: 13,
    color: "#cccccc",
    flex: 1,
  },
  selectedTreeItemText: {
    color: "#fff",
    fontWeight: "500",
  },
  editedFileText: {
    color: "#4ec9b0",
  },
  editor: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#2d2d30",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  editorFileName: {
    fontSize: 12,
    color: "#cccccc",
    fontFamily: "monospace",
  },
  editedIndicator: {
    fontSize: 11,
    color: "#4ec9b0",
  },
  codeScroll: {
    flex: 1,
  },
  codeContainer: {
    padding: 12,
  },
  codeInput: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#d4d4d4",
    lineHeight: 20,
    minHeight: 400,
  },
  codeLine: {
    flexDirection: "row",
    marginBottom: 2,
  },
  lineNumber: {
    width: 40,
    fontSize: 13,
    color: "#858585",
    textAlign: "right",
    paddingRight: 12,
    fontFamily: "monospace",
  },
  codeLineText: {
    flex: 1,
    fontSize: 14,
    color: "#d4d4d4",
    fontFamily: "monospace",
  },
  noFileSelected: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noFileText: {
    fontSize: 14,
    color: "#858585",
  },
});



