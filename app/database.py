"""
データベース設定とセッション管理

SQLAlchemyを使用したデータベース接続とセッション管理を行う。
Supabase（PostgreSQL）を使用する。
"""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pathlib import Path
import os
from dotenv import load_dotenv

# 環境変数を読み込む
load_dotenv()

# データベースURLを環境変数から取得
# Supabaseの接続文字列を使用
# 形式: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
# または接続プール: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    # 開発環境用のデフォルト値（SQLite、フォールバック用）
    f"sqlite:///{Path('data') / 'se_training.db'}"
)

# SQLAlchemyエンジンを作成
# PostgreSQLの場合は接続プール設定を追加
if DATABASE_URL.startswith("postgresql"):
    # PostgreSQL (Supabase) 用の設定
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # 接続の有効性を確認
        pool_size=5,  # 接続プールサイズ
        max_overflow=10,  # 最大オーバーフロー
        echo=False,  # SQLクエリをログ出力する場合はTrueに変更
    )
else:
    # SQLite用の設定（フォールバック）
    DB_DIR = Path("data")
    DB_DIR.mkdir(exist_ok=True)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )

# セッションファクトリーを作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースモデルクラス
Base = declarative_base()

def _ensure_course_columns_exist() -> None:
    """
    courses テーブルに不足カラムがある場合に追加する（軽量マイグレーション）。

    背景:
      - SQLAlchemy の create_all は既存テーブルにカラムを追加しない
      - 既存DBに対して model に column を追加すると SELECT 時に "no such column" で落ちる

    方針:
      - SQLite: PRAGMA table_info で存在確認 → ALTER TABLE で追加
      - PostgreSQL: information_schema で存在確認 → ALTER TABLE で追加
    """
    dialect = engine.dialect.name
    with engine.begin() as conn:
        if dialect == "sqlite":
            rows = conn.execute(text("PRAGMA table_info(courses)")).fetchall()
            col_names = {r[1] for r in rows}  # (cid, name, type, notnull, dflt_value, pk)
            if "course_type" not in col_names:
                conn.execute(
                    text(
                        "ALTER TABLE courses ADD COLUMN course_type VARCHAR(50) NOT NULL DEFAULT 'chapter_list'"
                    )
                )
            if "is_free" not in col_names:
                conn.execute(
                    text(
                        "ALTER TABLE courses ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT 0"
                    )
                )
        elif dialect in ("postgresql", "postgres"):
            exists_course_type = conn.execute(
                text(
                    """
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'courses'
                      AND column_name = 'course_type'
                    """
                )
            ).first()
            if not exists_course_type:
                conn.execute(
                    text(
                        "ALTER TABLE courses ADD COLUMN course_type VARCHAR(50) NOT NULL DEFAULT 'chapter_list'"
                    )
                )
            exists_is_free = conn.execute(
                text(
                    """
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'courses'
                      AND column_name = 'is_free'
                    """
                )
            ).first()
            if not exists_is_free:
                conn.execute(
                    text(
                        "ALTER TABLE courses ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT FALSE"
                    )
                )
        else:
            # 未対応DB: ここでは何もしない（必要なら将来対応）
            return


def get_db():
    """
    データベースセッションを取得する依存関係関数
    
    FastAPIの依存関係として使用し、リクエストごとに新しいセッションを作成する。
    リクエスト処理が終了すると自動的にセッションがクローズされる。
    
    Yields:
        Session: データベースセッション
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    データベースを初期化する
    
    すべてのテーブルを作成し、初期データを作成する。
    アプリケーション起動時または初期化時に呼び出す。
    """
    # relationship の文字列参照（例: "User"）を解決するため、先にモデルを登録する
    # （テスト用の単発スクリプト実行でも mapper が安定する）
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_course_columns_exist()
    
    # 初期データを作成（既に存在する場合はスキップ）
    try:
        from app.init_data import create_initial_data
        create_initial_data()
    except Exception as e:
        # 初期データ作成に失敗してもアプリケーションは起動可能
        # （既にデータが存在する場合など）
        print(f"[WARNING] 初期データの作成に失敗しました（既に存在する可能性があります）: {e}")

