# 問題作成タスクの引き継ぎガイド

このドキュメントは、問題定義ファイルからJSON形式の問題ファイルを作成するタスクの手順とテンプレートを提供します。

## タスク概要

問題定義ファイル（Markdown形式）を読み、それを基にJSON形式の問題ファイルを作成します。

## 作業フロー

### ステップ1: 問題定義ファイルの確認

1. 問題定義ファイル（例: `problem_definition/python_hard.md`）を読み込む
2. 各問題の要件を理解する：
   - 問題概要
   - 入力仕様
   - 出力仕様
   - 制約条件
   - テストケース（公開・非公開）

### ステップ2: JSONファイルの作成

1. 既存の問題IDを確認（`problems/` ディレクトリ）
2. 新しい問題IDを決定（例: `ct-017`, `ct-018`）
3. JSONファイルを作成（`problems/{problem_id}.json`）

### ステップ3: 必須フィールドの記入

以下のフィールドを記入します：

```json
{
  "id": "ct-XXX",
  "title": "問題のタイトル",
  "difficulty": "easy | medium | hard",
  "category": ["category1", "category2"],
  "time_limit_sec": 1.0,
  "memory_limit_mb": 256,
  "description": "# Markdown形式の問題文...",
  "function_signature": "def solve(...) -> ...:",
  "test_code": "def test_...(): ...",
  "supported_languages": ["python", "typescript"]
}
```

### ステップ4: オプションフィールドの追加（推奨）

```json
{
  "hint": "## ヒント\n\n...",
  "solution": "## 答えと解説\n\n..."
}
```

### ステップ5: 検証

1. JSON構文の確認: `python -m json.tool problems/ct-XXX.json`
2. テストケースの妥当性確認
3. 問題文の明確性確認

## テンプレート

### 基本テンプレート

```json
{
  "id": "ct-XXX",
  "title": "問題のタイトル",
  "difficulty": "easy",
  "category": ["array"],
  "time_limit_sec": 1.0,
  "memory_limit_mb": 256,
  "description": "# 問題のタイトル\n\n## 問題概要\n\n...\n\n## 入力仕様\n\n...\n\n## 出力仕様\n\n...\n\n## 制約条件\n\n...\n\n## サンプル入力・出力\n\n### サンプル1\n\n...",
  "function_signature": "def solve(...) -> ...:",
  "test_code": "def test_sample1():\n    ...",
  "supported_languages": ["python", "typescript"]
}
```

### 難易度別の推奨設定

#### Easy
- `time_limit_sec`: 1.0
- `memory_limit_mb`: 256
- テストケース: 5-8個

#### Medium
- `time_limit_sec`: 1.0 - 2.0
- `memory_limit_mb`: 256 - 512
- テストケース: 8-12個

#### Hard
- `time_limit_sec`: 2.0 - 5.0
- `memory_limit_mb`: 512 - 1024
- テストケース: 10-15個

## よくあるパターン

### パターン1: 二分木の問題

```json
{
  "function_signature": "def solve(root) -> int:",
  "test_code": "class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef test_sample1():\n    root = TreeNode(1)\n    root.left = TreeNode(2)\n    root.right = TreeNode(3)\n    assert solve(root) == ..."
}
```

### パターン2: 配列・リストの問題

```json
{
  "function_signature": "def solve(nums: list[int]) -> int:",
  "test_code": "def test_sample1():\n    assert solve([1, 2, 3]) == ..."
}
```

### パターン3: グラフ・依存関係の問題

```json
{
  "function_signature": "def solve(dependencies: list[tuple[str, str]], target: str) -> list[str]:",
  "test_code": "def test_sample1():\n    deps = [(\"A\", \"B\"), (\"B\", \"C\")]\n    result = solve(deps, \"A\")\n    assert ..."
}
```

### パターン4: 辞書・オブジェクトの問題

```json
{
  "function_signature": "def solve(logs: list[dict]) -> dict:",
  "test_code": "def test_sample1():\n    logs = [{\"id\": \"A\", \"value\": 1}]\n    result = solve(logs)\n    assert result[...] == ..."
}
```

## チェックリスト

問題を作成したら、以下を確認してください：

- [ ] 問題IDが既存と重複していないか
- [ ] 問題文が明確で完全か
- [ ] 入力仕様が明確か
- [ ] 出力仕様が明確か
- [ ] 制約条件がすべて記載されているか
- [ ] サンプルが十分か（最低3-4個）
- [ ] 関数シグネチャが正しいか
- [ ] テストケースが十分か（公開・非公開）
- [ ] エッジケースがカバーされているか
- [ ] JSONの構文が正しいか
- [ ] 難易度が適切か
- [ ] カテゴリが適切か
- [ ] 時間制限が適切か
- [ ] ヒントと解説が追加されているか（推奨）

## 注意事項

### 1. 問題IDの管理

- 既存の問題IDを確認: `ls problems/`
- 連番で割り当てる（例: ct-017, ct-018, ...）

### 2. 関数シグネチャ

- Python形式で記述（TypeScriptは自動変換）
- 型ヒントを明確に
- 関数名は `solve` として扱われる

### 3. テストコード

- テストコード内では `solve` という関数名で呼び出す
- 複数のテストケースを含める
- エッジケースも含める

### 4. 問題文のMarkdown

- コードブロック内のバッククォートはエスケープ不要（JSON文字列内）
- 改行は `\n` を使用
- 特殊文字は適切にエスケープ

### 5. サンプルの計算

- サンプルの期待値は手計算で確認
- 計算ミスがないか注意

## 実例：問題作成の流れ

### 例: 問題定義からJSON作成

**問題定義（Markdown）**:
```markdown
問題1：全経路和の合計（基礎）

次の完全二分木で、ルートから葉までの全ての経路について「経路上の数の合計」を求め、最後にそれらを全部足した値を答えよ。

        1
      /   \
     2     1
    / \   / \
   4   5 1   2
```

**作成するJSON**:
```json
{
  "id": "ct-017",
  "title": "全経路和の合計",
  "difficulty": "easy",
  "category": ["tree", "dfs", "recursion"],
  "time_limit_sec": 1.0,
  "memory_limit_mb": 256,
  "description": "# 全経路和の合計\n\n## 問題概要\n\n完全二分木が与えられます。ルートから葉までの全ての経路について「経路上の数の合計」を求め、最後にそれらを全部足した値を求めてください。\n\n...",
  "function_signature": "def solve(root) -> int:",
  "test_code": "...",
  "supported_languages": ["python", "typescript"]
}
```

## トラブルシューティング

### JSON構文エラー

```bash
# 構文確認
python -m json.tool problems/ct-XXX.json
```

### エスケープの問題

- 文字列内の改行: `\n`
- 文字列内の引用符: `\"`
- バックスラッシュ: `\\`

### テストケースの期待値が合わない

- 手計算で再確認
- サンプルを実際に実行して検証

## 参考リソース

- `PROBLEM_FORMAT.md`: 基本的なフォーマット仕様
- `PROBLEM_CREATION_GUIDE.md`: 詳細な作成ガイド
- `problems/ct-001.json`: Easy問題の例
- `problems/ct-003.json`: Hard問題の例（ヒント・解説付き）

## プロンプト例

### 基本的なプロンプト

```
問題定義ファイル（problem_definition/xxx.md）を基に、JSON形式の問題ファイルを作成してください。

各問題について：
1. 適切な問題IDを割り当て（既存と重複しない）
2. 難易度、カテゴリ、時間制限を設定
3. 詳細な問題文を作成
4. 関数シグネチャを定義
5. テストケースを作成（公開・非公開を含む）
6. 必要に応じてヒントと解説を追加

JSON構文を確認し、すべての問題ファイルを problems/ ディレクトリに保存してください。
```

### ヒント・解説追加のプロンプト

```
問題 ct-XXX にヒントと解説を追加してください。

ヒントには：
- 重要なポイント
- 解法の流れ
- 注意点

解説には：
- 実装コード（コメント付き）
- アルゴリズムの説明
- 時間計算量の分析
- 具体例での動作確認

を含めてください。
```

## バッチ処理の例

複数の問題を一度に作成する場合：

```
以下の問題定義ファイルを基に、すべての問題をJSON形式で作成してください：

1. problem_definition/python_hard.md の5つの問題
2. problem_definition/typescript_hard.md の5つの問題
3. adittional_features.md の4つの問題

各問題に適切なIDを割り当て、問題文、テストケース、ヒント・解説を含めてください。
```

## 品質チェック

作成した問題は以下を確認：

1. **完全性**: 必要な情報がすべて含まれているか
2. **正確性**: サンプルの期待値が正しいか
3. **明確性**: 問題文が理解しやすいか
4. **一貫性**: 既存の問題とフォーマットが一致しているか
5. **実装可能性**: テストケースが実装可能か



