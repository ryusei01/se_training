#!/bin/bash

echo "アセットファイル生成スクリプト"
echo ""

# Pillowがインストールされているか確認
if ! python3 -c "import PIL" 2>/dev/null; then
    echo "Pillowがインストールされていません。インストール中..."
    pip3 install Pillow
    if [ $? -ne 0 ]; then
        echo "エラー: Pillowのインストールに失敗しました。"
        exit 1
    fi
fi

echo "アセットファイルを生成中..."
python3 generate_assets.py

if [ $? -ne 0 ]; then
    echo "エラーが発生しました。"
    exit 1
fi

echo ""
echo "完了！"


