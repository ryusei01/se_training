# SE Training - Mobile App (Expo)

コーディングテスト学習用のモバイルアプリ（iOS/Android対応）

## セットアップ

### 1. 依存関係のインストール

```bash
cd mobile
npm install
# または
yarn install
```

### 2. 開発サーバーの起動

```bash
npm start
# または
yarn start
```

### 3. 実機/エミュレーターで実行

- **iOS**: `npm run ios` または Expo GoアプリでQRコードをスキャン
- **Android**: `npm run android` または Expo GoアプリでQRコードをスキャン

## 環境変数

APIのベースURLは `app.json` の `extra.apiBaseUrl` で設定できます。

開発時は `http://localhost:8000` を使用しますが、**実機テスト時は開発マシンのローカルIPアドレスに変更してください**。

例: `"apiBaseUrl": "http://192.168.1.100:8000"`

## ビルド（公開用）

### アセットファイルの準備

`assets/` ディレクトリに以下のファイルを配置してください：

- `icon.png` (1024x1024px) - アプリアイコン
- `adaptive-icon.png` (1024x1024px) - Android適応アイコン
- `splash.png` (1242x2436px推奨) - スプラッシュスクリーン
- `favicon.png` (48x48px) - Web用ファビコン

### EAS Build のセットアップ

1. Expoアカウントにログイン（まだの場合は作成）:
```bash
npx expo login
```

2. EAS Build を初期化:
```bash
npx eas build:configure
```

### Android APK（プレビュー用）

```bash
npm run build:android
```

または

```bash
eas build --platform android --profile preview
```

### Android App Bundle（Google Play Store公開用）

```bash
eas build --platform android --profile production
```

### Google Play Storeに提出

```bash
eas submit --platform android
```

または

```bash
npm run submit:android
```

## 開発

- コードは `src/` ディレクトリに配置
- 画面は `src/screens/` に配置
- APIクライアントは `src/services/` に配置
- 型定義は `src/types/` に配置
- ユーティリティは `src/utils/` に配置

## 必要な環境

- Node.js 18以上
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) - ビルド・公開時に必要
- Expo Goアプリ（開発時に実機で確認する場合）

## トラブルシューティング

### API接続エラー

実機でテストする場合、`app.json` の `apiBaseUrl` を開発マシンのローカルIPアドレスに変更してください。

WindowsでIPアドレスを確認:
```bash
ipconfig
```

Mac/LinuxでIPアドレスを確認:
```bash
ifconfig
```

### ビルドエラー

アセットファイル（アイコン、スプラッシュスクリーン）が不足している場合は、エラーが発生します。`assets/README.md` を参照して必要なファイルを配置してください。

