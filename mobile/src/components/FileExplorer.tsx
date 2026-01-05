/**
 * File Explorer コンポーネント（VS Code風ファイルツリー）
 *
 * ファイルツリーを表示し、ファイルをクリックするとコードを表示する。
 * Phase1では最小構成として実装。
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FileTreeItem } from "../types/api";

interface FileExplorerProps {
  data?: string;  // JSON形式のファイルツリーデータ
  onFileSelect?: (file: FileTreeItem) => void;
}

/**
 * File Explorer コンポーネント
 *
 * @param {FileExplorerProps} props - プロップス
 * @returns {JSX.Element} File Explorer コンポーネント
 */
export default function FileExplorer({ data, onFileSelect }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | null>(null);

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>ファイルツリーがありません</Text>
      </View>
    );
  }

  let fileTree: FileTreeItem[] = [];
  try {
    fileTree = JSON.parse(data);
  } catch (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>ファイルツリーの読み込みに失敗しました</Text>
      </View>
    );
  }

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (file: FileTreeItem) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const renderItem = (item: FileTreeItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const isSelected = selectedFile?.path === item.path;

    if (item.type === "folder") {
      return (
        <View key={item.path}>
          <TouchableOpacity
            style={[styles.item, { paddingLeft: 16 + level * 16 }]}
            onPress={() => toggleFolder(item.path)}
          >
            <Text style={styles.folderIcon}>
              {isExpanded ? "📂" : "📁"}
            </Text>
            <Text style={styles.itemText}>{item.name}</Text>
          </TouchableOpacity>
          {isExpanded && item.children && (
            <View>
              {item.children.map((child) => renderItem(child, level + 1))}
            </View>
          )}
        </View>
      );
    } else {
      return (
        <TouchableOpacity
          key={item.path}
          style={[
            styles.item,
            { paddingLeft: 16 + level * 16 },
            isSelected && styles.selectedItem,
          ]}
          onPress={() => handleFileClick(item)}
        >
          <Text style={styles.fileIcon}>📄</Text>
          <Text style={[styles.itemText, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>📁 File Explorer</Text>
      </View>
      <ScrollView style={styles.tree}>
        {fileTree.map((item) => renderItem(item))}
      </ScrollView>
      {selectedFile && selectedFile.content && (
        <View style={styles.codeViewer}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeHeaderText}>{selectedFile.path}</Text>
          </View>
          <ScrollView style={styles.codeContent}>
            <Text style={styles.codeText}>{selectedFile.content}</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  tree: {
    maxHeight: 300,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingRight: 16,
  },
  selectedItem: {
    backgroundColor: "#e3f2fd",
  },
  folderIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  fileIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  itemText: {
    fontSize: 14,
    color: "#2c3e50",
  },
  selectedText: {
    fontWeight: "bold",
    color: "#1976d2",
  },
  emptyText: {
    padding: 16,
    color: "#999",
    textAlign: "center",
  },
  codeViewer: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    maxHeight: 400,
  },
  codeHeader: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  codeHeaderText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
  },
  codeContent: {
    padding: 12,
  },
  codeText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#2c3e50",
  },
});



