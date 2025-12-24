# 問題定義ファイルのフォーマット

問題は `problems/` ディレクトリに JSON ファイルとして保存します。

## ファイル名

`{problem_id}.json` の形式で保存します。

例: `ct-001.json`, `ct-002.json`

## JSON スキーマ

```json
{
  "id": "ct-001",
  "title": "問題のタイトル",
  "difficulty": "easy | medium | hard",
  "category": ["array", "hash"],
  "time_limit_sec": 1.0,
  "memory_limit_mb": 256,
  "description": "# Markdown形式の問題文\n\n## 問題概要\n...",
  "function_signature": "def solve(nums: list[int], target: int) -> bool:",
  "test_code": "def test_sample1():\n    assert solve([2, 7, 11, 15], 9) == True\n..."
}
```

## フィールド説明

- `id`: 問題の一意識別子（例: "ct-001"）
- `title`: 問題のタイトル
- `difficulty`: 難易度（"easy", "medium", "hard"のいずれか）
- `category`: カテゴリのリスト（例: ["array", "hash"]）
- `time_limit_sec`: 実行時間制限（秒）
- `memory_limit_mb`: メモリ制限（MB、MVP では論理制限のみ）
- `description`: Markdown 形式の問題文（必須要素を含む）
  - 問題概要
  - 入力仕様
  - 出力仕様
  - 制約条件
  - サンプル入力・出力
- `function_signature`: 実装すべき関数のシグネチャ（Python 形式、TypeScript 使用時は自動変換）
- `test_code`: テストコード（Python: pytest 用、TypeScript: 自動変換）
- `supported_languages`: 対応言語のリスト（オプション、デフォルトは`["python"]`）
  - 例: `["python", "typescript"]`
- `hint`: 解き方のヒント（オプション、Markdown 形式）
- `solution`: 答えと解説（オプション、Markdown 形式）

## テストコードの注意点

- テストコード内では `solve` という関数名で関数を呼び出す
- 実際の関数名は `function_signature` から自動抽出され、`solve` としてエイリアスされます
- 複数のテストケースを含めることができます
- 非公開テストケースも含めることができます
- TypeScript を使用する場合、Python 形式のテストコードが自動的に TypeScript 形式に変換されます
