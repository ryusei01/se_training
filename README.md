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

### 開発環境での起動

1. **バックエンド（FastAPI）を起動**

```bash
# 方法 1: run.py を使用（推奨）
python run.py

# 方法 2: uvicorn を直接使用
uvicorn app.main:app --reload
```

バックエンドは `http://localhost:8000` で起動します（API のみ提供）。

2. **フロントエンド（Expo）を起動**

別のターミナルで：

```bash
cd mobile
npm install  # 初回のみ
npm start
```

または、Web 版のみ起動する場合：

```bash
cd mobile
npm run web
```

Expo の開発サーバーが起動し、Web 版は `http://localhost:19006` でアクセスできます。

**注意**:

- バックエンドとフロントエンドは別々に起動します
- フロントエンドは Expo の開発サーバーで完全に動作します
- API のベース URL は `mobile/app.json` の `extra.apiBaseUrl` で設定されています（デフォルト: `http://localhost:8000`）

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
static/           # 旧フロントエンドファイル（バックアップ用）
static_backup/    # static/index.htmlのバックアップ
data/             # 実行履歴データ（自動生成）
mobile/           # モバイルアプリ（Expo/React Native）
  src/
    screens/      # 画面コンポーネント
    services/     # APIクライアント
    types/        # TypeScript型定義
    utils/        # ユーティリティ
  dist/           # ExpoのWebビルド（npm run build:webで生成）
```

## モバイルアプリと Web 版

iOS/Android/Web 対応のアプリが `mobile/` ディレクトリにあります。
**Web 版とモバイル版は同じ React Native コードを使用しています。**

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

詳細は `mobile/ANDROID_PUBLISH.md` を参照してください。

**クイックスタート:**

```bash
cd mobile

# 本番用ビルド（AAB形式）
eas build --platform android --profile production

# Google Play Storeへの提出
eas submit --platform android --profile production
```

**注意**:

- 初回公開前は `mobile/ANDROID_PUBLISH.md` の手順に従ってください
- 本番環境の API URL を設定する必要があります
- Google Play Console でアプリを作成する必要があります
