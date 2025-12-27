// Markdown表示用のユーティリティ（簡易版）

import React from "react";
import { Text, View, StyleSheet } from "react-native";

// 簡易Markdownレンダリング（react-native-markdown-displayのフォールバック用）
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // コードブロックを抽出
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: (string | { type: "code"; lang?: string; code: string })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // コードブロック前のテキスト
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // コードブロック
    parts.push({
      type: "code",
      lang: match[1],
      code: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return (
    <View>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return (
            <Text key={index} style={styles.markdownText}>
              {part.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < part.split("\n").length - 1 && "\n"}
                </React.Fragment>
              ))}
            </Text>
          );
        } else {
          return (
            <View key={index} style={styles.codeBlock}>
              <Text style={styles.codeText}>{part.code}</Text>
            </View>
          );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  markdownText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  codeBlock: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 4,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 14,
    color: "#333",
  },
});

