"""
アセットファイル（アイコン、スプラッシュスクリーン）を生成するスクリプト

使用方法:
    python generate_assets.py

Pillow (PIL) が必要です:
    pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("エラー: Pillowがインストールされていません。")
    print("インストール: pip install Pillow")
    exit(1)

import os
from pathlib import Path

ASSETS_DIR = Path("assets")
ASSETS_DIR.mkdir(exist_ok=True)

# 色設定
PRIMARY_COLOR = "#2c3e50"  # ダークブルー
WHITE = "#ffffff"

def create_icon(size=1024):
    """アプリアイコンを生成"""
    img = Image.new("RGB", (size, size), PRIMARY_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 中央に円を描画
    margin = size // 8
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=WHITE,
        outline=PRIMARY_COLOR,
        width=size // 32
    )
    
    # 中央に "SE" テキストを描画（フォントが利用可能な場合）
    try:
        # システムフォントを使用（大きめのサイズ）
        font_size = size // 3
        # Windowsの場合、一般的なフォントを試す
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
        
        text = "SE"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        position = ((size - text_width) // 2, (size - text_height) // 2)
        draw.text(position, text, fill=PRIMARY_COLOR, font=font)
    except Exception as e:
        print(f"フォント読み込みエラー（デフォルトフォントを使用）: {e}")
        # シンプルな矩形を描画
        margin2 = size // 3
        draw.rectangle(
            [margin2, margin2, size - margin2, size - margin2],
            fill=PRIMARY_COLOR
        )
    
    return img

def create_adaptive_icon(size=1024):
    """Android適応アイコンを生成（中央部分が前景）"""
    img = Image.new("RGB", (size, size), PRIMARY_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 背景は単色
    # 前景（中央1024x1024）にアイコンを描画
    margin = size // 8
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=WHITE,
        outline=PRIMARY_COLOR,
        width=size // 32
    )
    
    try:
        font_size = size // 3
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
        
        text = "SE"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        position = ((size - text_width) // 2, (size - text_height) // 2)
        draw.text(position, text, fill=PRIMARY_COLOR, font=font)
    except Exception:
        margin2 = size // 3
        draw.rectangle(
            [margin2, margin2, size - margin2, size - margin2],
            fill=PRIMARY_COLOR
        )
    
    return img

def create_splash(size=(1242, 2436)):
    """スプラッシュスクリーンを生成"""
    img = Image.new("RGB", size, PRIMARY_COLOR)
    draw = ImageDraw.Draw(img)
    
    # 中央にロゴを描画
    center_x, center_y = size[0] // 2, size[1] // 2
    logo_size = min(size) // 4
    
    draw.ellipse(
        [
            center_x - logo_size // 2,
            center_y - logo_size // 2,
            center_x + logo_size // 2,
            center_y + logo_size // 2
        ],
        fill=WHITE,
        outline=WHITE,
        width=logo_size // 16
    )
    
    # テキストを描画
    try:
        font_size = logo_size // 2
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
        
        text = "SE Training"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        position = (
            center_x - text_width // 2,
            center_y + logo_size // 2 + logo_size // 8
        )
        draw.text(position, text, fill=WHITE, font=font)
    except Exception:
        pass
    
    return img

def create_favicon(size=48):
    """Web用ファビコンを生成"""
    img = Image.new("RGB", (size, size), PRIMARY_COLOR)
    draw = ImageDraw.Draw(img)
    
    # シンプルな円を描画
    margin = size // 8
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=WHITE,
        outline=WHITE
    )
    
    return img

def main():
    print("アセットファイルを生成中...")
    
    # アイコン (1024x1024)
    print("  - icon.png を生成中...")
    icon = create_icon(1024)
    icon.save(ASSETS_DIR / "icon.png", "PNG")
    
    # 適応アイコン (1024x1024)
    print("  - adaptive-icon.png を生成中...")
    adaptive_icon = create_adaptive_icon(1024)
    adaptive_icon.save(ASSETS_DIR / "adaptive-icon.png", "PNG")
    
    # スプラッシュスクリーン (1242x2436)
    print("  - splash.png を生成中...")
    splash = create_splash((1242, 2436))
    splash.save(ASSETS_DIR / "splash.png", "PNG")
    
    # ファビコン (48x48)
    print("  - favicon.png を生成中...")
    favicon = create_favicon(48)
    favicon.save(ASSETS_DIR / "favicon.png", "PNG")
    
    print("\n[OK] アセットファイルの生成が完了しました！")
    print(f"  保存先: {ASSETS_DIR.absolute()}")
    print("\n生成されたファイル:")
    for file in ASSETS_DIR.glob("*.png"):
        print(f"  - {file.name}")

if __name__ == "__main__":
    main()

