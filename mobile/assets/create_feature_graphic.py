"""
Google Play Store用のフィーチャーグラフィックを作成するスクリプト
サイズ: 1024 x 500 px
"""
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillowライブラリをインストールしてください: pip install Pillow")
    exit(1)

# 画像サイズ
WIDTH = 1024
HEIGHT = 500

# カラー定義（既存のアイコンスタイルに合わせる）
BACKGROUND_COLOR = "#2c3e50"  # ダークブルーグリーン
CIRCLE_COLOR = "#FFFFFF"  # 白
TEXT_COLOR = "#1a1a1a"  # ダークグレー（ほぼ黒）
ACCENT_COLOR = "#3498db"  # アクセントカラー（青）

# 画像作成
img = Image.new("RGB", (WIDTH, HEIGHT), BACKGROUND_COLOR)
draw = ImageDraw.Draw(img)

# 中央に配置する円のサイズ（アイコンのスタイル）
CIRCLE_SIZE = 200
circle_x = WIDTH // 2
circle_y = HEIGHT // 2 - 30  # 少し上に配置

# 白い円を描画
circle_bbox = (
    circle_x - CIRCLE_SIZE // 2,
    circle_y - CIRCLE_SIZE // 2,
    circle_x + CIRCLE_SIZE // 2,
    circle_y + CIRCLE_SIZE // 2,
)
draw.ellipse(circle_bbox, fill=CIRCLE_COLOR)

# "SE"テキストを円の中に描画
try:
    # 大きなフォントを試す
    font_size = 100
    font = ImageFont.truetype("arial.ttf", font_size)
except:
    try:
        font = ImageFont.truetype("arialbd.ttf", font_size)
    except:
        # フォントが見つからない場合はデフォルトフォントを使用
        font = ImageFont.load_default()

# "SE"テキストを描画
text = "SE"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

text_x = circle_x - text_width // 2
text_y = circle_y - text_height // 2 - 10

draw.text((text_x, text_y), text, fill=TEXT_COLOR, font=font)

# アプリ名を下部に描画
app_name = "SE Training"
try:
    # 大きなフォント
    title_font_size = 64
    title_font = ImageFont.truetype("arial.ttf", title_font_size)
except:
    try:
        title_font = ImageFont.truetype("arialbd.ttf", title_font_size)
    except:
        title_font = ImageFont.load_default()

bbox = draw.textbbox((0, 0), app_name, font=title_font)
title_width = bbox[2] - bbox[0]
title_x = (WIDTH - title_width) // 2
title_y = circle_y + CIRCLE_SIZE // 2 + 60

draw.text((title_x, title_y), app_name, fill=CIRCLE_COLOR, font=title_font)

# サブタイトルを追加（オプション）
# 日本語フォントの問題を避けるため、英語サブタイトルに変更
subtitle = "Coding Test Practice App"
try:
    subtitle_font_size = 36
    # Windowsで利用可能なフォントを試す
    font_paths = [
        "arial.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/msyh.ttc",  # マイクロソフト YaHei (中国語だが日本語も表示可能)
    ]
    subtitle_font = None
    for font_path in font_paths:
        try:
            subtitle_font = ImageFont.truetype(font_path, subtitle_font_size)
            break
        except:
            continue
    if subtitle_font is None:
        subtitle_font = ImageFont.load_default()
except:
    subtitle_font = ImageFont.load_default()

bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
subtitle_width = bbox[2] - bbox[0]
subtitle_x = (WIDTH - subtitle_width) // 2
subtitle_y = title_y + 80

draw.text((subtitle_x, subtitle_y), subtitle, fill="#95a5a6", font=subtitle_font)

# 画像を保存
output_path = "feature-graphic.png"
img.save(output_path, "PNG", optimize=True)
print(f"フィーチャーグラフィックを作成しました: {output_path}")
print(f"サイズ: {WIDTH} x {HEIGHT} px")

