@echo off
echo アセットファイル生成スクリプト
echo.

REM Pillowがインストールされているか確認
python -c "import PIL" 2>nul
if errorlevel 1 (
    echo Pillowがインストールされていません。インストール中...
    pip install Pillow
    if errorlevel 1 (
        echo エラー: Pillowのインストールに失敗しました。
        pause
        exit /b 1
    )
)

echo アセットファイルを生成中...
python generate_assets.py

if errorlevel 1 (
    echo エラーが発生しました。
    pause
    exit /b 1
)

echo.
echo 完了！
pause






