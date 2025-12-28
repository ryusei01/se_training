# アセットファイル

以下のファイルが配置されています：

- `icon.png` - アプリアイコン（1024x1024px）
- `adaptive-icon.png` - Android 適応アイコン（1024x1024px、中央1024x1024pxをフォアグラウンドに使用）
- `splash.png` - スプラッシュスクリーン（1242x2436px推奨）
- `favicon.png` - Web用ファビコン（48x48px）
- `feature-graphic.png` - Google Play Store用フィーチャーグラフィック（1024x500px）

## フィーチャーグラフィック

Google Play Store用のフィーチャーグラフィック（`feature-graphic.png`）は、`create_feature_graphic.py`スクリプトを使用して生成できます。

### 再生成方法

```bash
cd mobile/assets
python create_feature_graphic.py
```

### 要件

- Pillowライブラリが必要: `pip install Pillow`
- サイズ: 1024 x 500 px
- 形式: PNG（24ビット、アルファなし）
- ファイルサイズ: 15MB以下

## アイコン生成

以下のコマンドでアイコンを自動生成できます（アイコン用のPNGファイルが必要）：

```bash
npx expo install @expo/image-utils
npx expo prebuild
```

または、オンラインツール（https://www.appicon.co/ など）を使用して生成できます。





