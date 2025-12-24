# SE Training - コーディングテスト機能

アルゴリズム系コーディングテストを解ける環境を提供するシステム（MVP 版）

## 機能

- Python によるコーディングテスト
- 単一ファイルの実装問題
- 自動テストによる正誤判定
- 実行履歴の保存

## セットアップ

### 1. 仮想環境の作成と有効化

```bash
# 仮想環境を作成
python -m venv venv

# 仮想環境を有効化
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Windows (Command Prompt)
venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. TypeScript 実行環境のセットアップ（TypeScript を使用する場合）

TypeScript を使用する場合は、Node.js と tsx が必要です：

```bash
# Node.jsがインストールされていることを確認
node --version

# tsxをグローバルにインストール（またはnpxで自動インストール）
npm install -g tsx
```

注意: TypeScript 実行時は `npx tsx` を使用するため、初回実行時に自動的にインストールされます。

## 実行

### 方法 1: run.py を使用（推奨）

```bash
python run.py
```

### 方法 2: uvicorn を直接使用

```bash
uvicorn app.main:app --reload
```

ブラウザで `http://localhost:8000` にアクセス

## 仮想環境の無効化

作業が終わったら、以下のコマンドで仮想環境を無効化できます：

```bash
deactivate
```

## 問題の追加

`problems/` ディレクトリに JSON ファイルを追加してください。

詳細は `PROBLEM_FORMAT.md` を参照してください。

## ディレクトリ構造

```
problems/          # 問題定義ファイル
app/               # アプリケーションコード
  api/            # APIエンドポイント
  models/         # データモデル
  runners/        # コード実行エンジン
  storage/        # 実行履歴保存
static/           # フロントエンドファイル
data/             # 実行履歴データ（自動生成）
```
