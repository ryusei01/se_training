/**
 * Markdown表示用のユーティリティ（簡易版）
 *
 * react-native-markdown-displayのフォールバック用の簡易Markdownレンダリング機能。
 * コードブロックの抽出と表示を行う。
 *
 * NOTE: JSX を含むため拡張子は .tsx にすること。
 */

import React from "react";
import { Text, View, StyleSheet } from "react-native";

/**
 * Markdownテキストをレンダリングする（簡易版）
 *
 * コードブロックを抽出して表示する。通常のテキストはそのまま表示される。
 * react-native-markdown-displayが使用できない場合のフォールバックとして使用される。
 *
 * @param {string} text - Markdown形式のテキスト
 * @returns {React.ReactNode} レンダリングされたコンポーネント
 */
export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // コードブロックを抽出する正規表現
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: (string | { type: "code"; lang?: string; code: string })[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // コードブロックを検索して抽出
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // コードブロック前のテキスト
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // コードブロック
    parts.push({
      type: "code",
      lang: match[1], // 言語指定（オプション）
      code: match[2], // コード内容
    });
    lastIndex = match.index + match[0].length;
  }

  // 残りのテキスト
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // パーツをレンダリング
  return (
    <View>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          // 通常のテキスト
          const lines = part.split("\n");
          return (
            <Text key={index} style={styles.markdownText}>
              {lines.map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < lines.length - 1 && "\n"}
                </React.Fragment>
              ))}
            </Text>
          );
        }

        // コードブロック
        return (
          <View key={index} style={styles.codeBlock}>
            <Text style={styles.codeText}>{part.code}</Text>
          </View>
        );
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




