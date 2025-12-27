# SE Training - Mobile App (Expo)

コーディングテスト学習用のモバイルアプリ（iOS/Android対応）

## セットアップ

### 1. 依存関係のインストール

```bash
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

開発時は `http://localhost:8000` を使用しますが、実機テスト時は開発マシンのローカルIPアドレスに変更してください。

例: `"apiBaseUrl": "http://192.168.1.100:8000"`

## ビルド（公開用）

### Android APK（プレビュー用）

```bash
npm run build:android
```

### Android App Bundle（Google Play Store公開用）

```bash
eas build --platform android --profile production
```

### Google Play Storeに提出

```bash
eas submit --platform android
```

## 開発

- コードは `src/` ディレクトリに配置
- 画面は `src/screens/` に配置
- APIクライアントは `src/services/` に配置
- 型定義は `src/types/` に配置

## 必要な環境

- Node.js 18以上
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`) - ビルド・公開時に必要


