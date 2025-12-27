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
app/               # アプリケーションコード（FastAPIバックエンド）
  api/            # APIエンドポイント
  models/         # データモデル
  runners/        # コード実行エンジン
  storage/        # 実行履歴保存
static/           # フロントエンドファイル（Web UI）
data/             # 実行履歴データ（自動生成）
mobile/           # モバイルアプリ（Expo/React Native）
  src/
    screens/      # 画面コンポーネント
    services/     # APIクライアント
    types/        # TypeScript型定義
    utils/        # ユーティリティ
```

## モバイルアプリ

iOS/Android 対応のモバイルアプリが `mobile/` ディレクトリにあります。

詳細は `mobile/MOBILE_README.md` を参照してください。

## 本番環境

本番環境へのデプロイについては `PRODUCTION_SETUP.md` を参照してください。

主なポイント：

- バックエンド API は HTTPS 必須
- モバイルアプリの本番ビルドは環境変数で API URL を設定
- CORS 設定が必要

### クイックスタート

```bash
cd mobile
npm install
npm start
```

実機やエミュレーターで実行するには、Expo Go アプリを使用するか、以下のコマンドで実行できます：

```bash
npm run android  # Android
npm run ios      # iOS
```

### ビルド・公開

Android APK/AAB のビルド:

```bash
cd mobile
npm run build:android
```

Google Play Store への提出:

```bash
npm run submit:android
```
