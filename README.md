# SE Training

アルゴリズム系コーディングテストを解ける環境を提供する Web アプリケーション・モバイルアプリ

## 概要

SE Training は、プログラミングスキルを向上させるためのコーディングテスト練習プラットフォームです。Python や TypeScript でアルゴリズム問題を解き、自動テストによる即座のフィードバックを受けられます。

## 主な機能

- 🐍 **Python/TypeScript 対応** - 複数のプログラミング言語で問題を解けます
- ✅ **自動テスト実行** - コードを提出すると即座に正誤判定が行われます
- 📱 **マルチプラットフォーム** - Web、iOS、Android で利用可能
- 📊 **実行履歴** - 過去の提出履歴を確認できます
- 💾 **下書き保存** - 編集中のコードを自動保存

## 技術スタック

### バックエンド

- **FastAPI** - 高速な Python Web フレームワーク
- **Python 3.12+** - メインの実行環境

### フロントエンド

- **React Native (Expo)** - クロスプラットフォーム対応
- **TypeScript** - 型安全な開発
- **Web 対応** - ブラウザでも利用可能

## クイックスタート

### 開発環境のセットアップ

詳細なセットアップ手順は [開発者向けドキュメント](docs/DEVELOPMENT.md) を参照してください。

```bash
# 1. 仮想環境の作成と有効化
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # Linux/Mac

# 2. 依存関係のインストール
pip install -r requirements.txt

# 3. バックエンドの起動
python run.py

# 4. 別ターミナルでフロントエンドの起動
cd mobile
npm install
npm start
```

## ドキュメント

- [開発者向けドキュメント](docs/DEVELOPMENT.md) - セットアップと開発ガイド
- [問題フォーマット](docs/PROBLEM_FORMAT.md) - 問題の追加方法
- [デプロイメントガイド](docs/deployment/DEPLOY.md) - 本番環境へのデプロイ
- [GitHub Actions 設定ガイド](docs/deployment/GITHUB_ACTIONS_SETUP.md) - CI/CD の設定方法
- [モバイルアプリドキュメント](mobile/docs/MOBILE_README.md) - モバイルアプリの詳細

## プロジェクト構造

```
├── app/              # FastAPIバックエンド
├── mobile/           # React Nativeアプリ（Web/iOS/Android）
├── problems/         # 問題定義ファイル
├── docs/             # ドキュメント
└── data/             # 実行履歴データ
```

## ライセンス

このプロジェクトのライセンス情報については、リポジトリの LICENSE ファイルを参照してください。

## コントリビューション

プルリクエストやイシューの報告を歓迎します。詳細は各ドキュメントを参照してください。
