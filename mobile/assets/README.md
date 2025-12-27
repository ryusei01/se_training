# アセットファイル

以下のファイルを配置してください：

- `icon.png` - アプリアイコン（1024x1024px）
- `adaptive-icon.png` - Android 適応アイコン（1024x1024px、中央1024x1024pxをフォアグラウンドに使用）
- `splash.png` - スプラッシュスクリーン（1242x2436px推奨）
- `favicon.png` - Web用ファビコン（48x48px）

## アイコン生成

以下のコマンドでアイコンを自動生成できます（アイコン用のPNGファイルが必要）：

```bash
npx expo install @expo/image-utils
npx expo prebuild
```

または、オンラインツール（https://www.appicon.co/ など）を使用して生成できます。

