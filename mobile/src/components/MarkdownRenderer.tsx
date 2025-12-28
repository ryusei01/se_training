/**
 * Markdownレンダラーコンポーネント
 *
 * カスタムMarkdownパーサーを使用してMarkdownテキストをReact Nativeコンポーネントに変換して表示します。
 * インラインコードのパディング問題を解決し、Web版でも適切に表示されます。
 */

import React from "react";
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity } from "react-native";

interface MarkdownRendererProps {
  content: string;
}

/**
 * MarkdownテキストをパースしてReact Nativeコンポーネントに変換
 */
const parseMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 見出し（# ## ###）
    if (line.startsWith("### ")) {
      elements.push(
        <Text key={`h3-${i}`} style={styles.h3}>
          {parseInlineElements(line.substring(4))}
        </Text>
      );
      i++;
    } else if (line.startsWith("## ")) {
      elements.push(
        <Text key={`h2-${i}`} style={styles.h2}>
          {parseInlineElements(line.substring(3))}
        </Text>
      );
      i++;
    } else if (line.startsWith("# ")) {
      elements.push(
        <Text key={`h1-${i}`} style={styles.h1}>
          {parseInlineElements(line.substring(2))}
        </Text>
      );
      i++;
    }
    // コードブロック（```...```）
    else if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <View key={`code-${i}`} style={styles.codeBlock}>
          <Text style={styles.codeBlockText}>{codeLines.join("\n")}</Text>
        </View>
      );
      i++;
    }
    // リスト（- または *）
    else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const text = line.trim().substring(2);
      elements.push(
        <View key={`list-${i}`} style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <Text style={styles.listText}>{parseInlineElements(text)}</Text>
        </View>
      );
      i++;
    }
    // 番号付きリスト（1. 2. など）
    else if (/^\d+\.\s/.test(line.trim())) {
      const match = line.trim().match(/^\d+\.\s(.+)/);
      if (match) {
        elements.push(
          <View key={`ol-${i}`} style={styles.listItem}>
            <Text style={styles.listBullet}>{line.trim().match(/^\d+/)?.[0]}.</Text>
            <Text style={styles.listText}>{parseInlineElements(match[1])}</Text>
          </View>
        );
      }
      i++;
    }
    // 引用（>）
    else if (line.trim().startsWith("> ")) {
      const quoteText = line.trim().substring(2);
      elements.push(
        <View key={`quote-${i}`} style={styles.quote}>
          <Text style={styles.quoteText}>{parseInlineElements(quoteText)}</Text>
        </View>
      );
      i++;
    }
    // 水平線（---）
    else if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<View key={`hr-${i}`} style={styles.horizontalRule} />);
      i++;
    }
    // 空行
    else if (line.trim() === "") {
      elements.push(<View key={`space-${i}`} style={styles.space} />);
      i++;
    }
    // 通常のテキスト
    else if (line.trim()) {
      elements.push(
        <Text key={`text-${i}`} style={styles.paragraph}>
          {parseInlineElements(line)}
        </Text>
      );
      i++;
    } else {
      i++;
    }
  }

  return elements;
};

/**
 * インライン要素をパース（リンク、画像、太字、イタリック、インラインコード）
 */
const parseInlineElements = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // 優先順位: 画像 > リンク > インラインコード > 太字 > イタリック
  while (remaining.length > 0) {
    // 画像（![alt](url)）
    const imageMatch = remaining.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      const before = remaining.substring(0, imageMatch.index);
      if (before) {
        parts.push(...parseTextInline(before, key));
        key += before.length;
      }
      parts.push(
        <Text key={`img-${key}`} style={styles.imagePlaceholder}>
          [画像: {imageMatch[1] || "画像"}]
        </Text>
      );
      key++;
      remaining = remaining.substring((imageMatch.index || 0) + imageMatch[0].length);
      continue;
    }

    // リンク（[text](url)）
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const before = remaining.substring(0, linkMatch.index);
      if (before) {
        parts.push(...parseTextInline(before, key));
        key += before.length;
      }
      const url = linkMatch[2];
      parts.push(
        <Text
          key={`link-${key}`}
          style={styles.link}
          onPress={() => {
            Linking.openURL(url).catch((err) =>
              console.error("Failed to open URL:", err)
            );
          }}
        >
          {linkMatch[1]}
        </Text>
      );
      key++;
      remaining = remaining.substring((linkMatch.index || 0) + linkMatch[0].length);
      continue;
    }

    // インラインコード（`code`）
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch) {
      const before = remaining.substring(0, codeMatch.index);
      if (before) {
        parts.push(...parseTextInline(before, key));
        key += before.length;
      }
      parts.push(
        <Text key={`code-${key}`} style={styles.inlineCode}>
          {codeMatch[1]}
        </Text>
      );
      key++;
      remaining = remaining.substring((codeMatch.index || 0) + codeMatch[0].length);
      continue;
    }

    // 残りのテキストを処理
    parts.push(...parseTextInline(remaining, key));
    break;
  }

  return parts;
};

/**
 * テキスト内の太字とイタリックを処理
 */
const parseTextInline = (text: string, startKey: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = startKey;

  while (remaining.length > 0) {
    // 太字（**text** または __text__）
    const boldMatch = remaining.match(/(\*\*|__)(.+?)\1/);
    if (boldMatch) {
      const before = remaining.substring(0, boldMatch.index);
      if (before) {
        parts.push(
          <Text key={`text-${key}`}>{before}</Text>
        );
        key += before.length;
      }
      parts.push(
        <Text key={`bold-${key}`} style={styles.bold}>
          {parseTextInline(boldMatch[2], key + 1000)}
        </Text>
      );
      key++;
      remaining = remaining.substring((boldMatch.index || 0) + boldMatch[0].length);
      continue;
    }

    // イタリック（*text* または _text_）- 太字と区別するため、単一の*または_をチェック
    // 太字（**）が既に処理されているので、単一の*や_を探す
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)|(?<!_)_(?!_)([^_]+?)_(?!_)/);
    if (italicMatch) {
      const before = remaining.substring(0, italicMatch.index);
      if (before) {
        parts.push(
          <Text key={`text-${key}`}>{before}</Text>
        );
        key += before.length;
      }
      const italicText = italicMatch[1] || italicMatch[2];
      parts.push(
        <Text key={`italic-${key}`} style={styles.italic}>
          {parseTextInline(italicText, key + 1000)}
        </Text>
      );
      key++;
      remaining = remaining.substring((italicMatch.index || 0) + italicMatch[0].length);
      continue;
    }

    // 残りのテキスト
    if (remaining) {
      parts.push(
        <Text key={`text-${key}`}>{remaining}</Text>
      );
    }
    break;
  }

  return parts;
};

/**
 * Markdownレンダラーコンポーネント
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const elements = parseMarkdown(content);

  return <View style={styles.container}>{elements}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 見出し
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 12,
    color: "#2c3e50",
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 10,
    color: "#2c3e50",
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
    color: "#34495e",
    lineHeight: 24,
  },
  // 段落
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    color: "#333",
  },
  // リスト
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingLeft: 8,
  },
  listBullet: {
    fontSize: 16,
    color: "#333",
    marginRight: 8,
    minWidth: 20,
  },
  listText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    flex: 1,
  },
  // コードブロック
  codeBlock: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 4,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  codeBlockText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      web: "Consolas, Monaco, monospace",
    }),
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  // インラインコード（Web版のパディング問題を解決）
  inlineCode: {
    backgroundColor: "#f3f3f3",
    paddingHorizontal: Platform.OS === "web" ? 4 : 6,
    paddingVertical: Platform.OS === "web" ? 0 : 2,
    borderRadius: 4,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      web: "Consolas, Monaco, monospace",
    }),
    fontSize: 14,
    color: "#333",
  },
  // 太字
  bold: {
    fontWeight: "bold",
    color: "#2c3e50",
  },
  // イタリック
  italic: {
    fontStyle: "italic",
  },
  // リンク
  link: {
    color: "#3498db",
    textDecorationLine: "underline",
  },
  // 画像
  imagePlaceholder: {
    color: "#666",
    fontStyle: "italic",
  },
  // 引用
  quote: {
    borderLeftWidth: 4,
    borderLeftColor: "#ddd",
    paddingLeft: 12,
    marginVertical: 8,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    fontStyle: "italic",
  },
  // 水平線
  horizontalRule: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 16,
  },
  // 空行
  space: {
    height: 8,
  },
});

