"""
開発サーバーを起動するためのスクリプト
"""
import uvicorn

if __name__ == "__main__":
    # host="0.0.0.0" にすることで、同じネットワーク内の他のデバイスからアクセス可能
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",  # すべてのネットワークインターフェースでリッスン（実機から接続可能）
        port=8000,
        reload=True,
    )



