"""
コースモデル

コース情報とアクセス制御を管理するデータモデル。
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Course(Base):
    """
    コーステーブル
    
    コース情報を保持する。
    
    Attributes:
        id: コースID（主キー、数値）
        name: コース名
        description: コース概要
        target_audience: 推奨対象（例: "初心者"、"初級者"）
        order_index: 表示順序
        is_active: 有効/無効フラグ
        is_free: 無料ユーザーがアクセス可能かどうか（無料範囲）
        free_range_limit: 互換用（非推奨）: 無料範囲でのアクセス可能なコースID上限
        course_type: コースタイプ（"problem_list": 問題一覧画面、"chapter_list": 章一覧画面）
        created_at: 作成日時
        updated_at: 最終更新日時
    """
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    target_audience = Column(String(100), nullable=True)
    order_index = Column(Integer, default=0, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_free = Column(Boolean, default=False, nullable=False)  # 無料ユーザーがアクセス可能かどうか
    free_range_limit = Column(Integer, nullable=True)  # 互換用（非推奨）: このID以下のコースのみ無料で利用可能
    course_type = Column(String(50), default="chapter_list", nullable=False)  # コースタイプ: "problem_list" | "chapter_list"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # リレーションシップ
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan", order_by="Chapter.order_index")


class Chapter(Base):
    """
    章テーブル
    
    コース内の章情報を保持する。
    体験型教材の各セクション情報を含む。
    
    Attributes:
        id: 章ID（主キー）
        course_id: コースID（外部キー）
        title: 章タイトル
        order_index: 章の表示順序
        content: 章のコンテンツ（Markdown形式、全体の説明）
        goal: Goal（この章でできるようになること、Markdown形式）
        system_overview: System Overview（今どこを触っているか、Markdown形式）
        file_explorer_data: File Explorer（VS Code風ファイルツリー用のJSONデータ）
        hands_on_steps: Hands-on Steps（操作手順、Markdown形式）
        run_execute_data: Run / Execute（実行データ、JSON形式）
        result_data: Result（結果確認データ、JSON形式）
        why_it_works: Why it works（仕組み解説、Markdown形式）
        check_data: Check（理解チェックデータ、JSON形式）
        is_active: 有効/無効フラグ
        created_at: 作成日時
        updated_at: 最終更新日時
    """
    __tablename__ = "chapters"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0, nullable=False, index=True)
    content = Column(Text, nullable=True)  # Markdown形式のコンテンツ（全体説明、後方互換性のため残す）
    goal = Column(Text, nullable=True)  # Goal（この章でできるようになること）
    system_overview = Column(Text, nullable=True)  # System Overview（今どこを触っているか）
    file_explorer_data = Column(Text, nullable=True)  # File Explorer（JSON形式のファイルツリーデータ）
    hands_on_steps = Column(Text, nullable=True)  # Hands-on Steps（操作手順）
    run_execute_data = Column(Text, nullable=True)  # Run / Execute（実行データ、JSON形式）
    result_data = Column(Text, nullable=True)  # Result（結果確認データ、JSON形式）
    why_it_works = Column(Text, nullable=True)  # Why it works（仕組み解説）
    check_data = Column(Text, nullable=True)  # Check（理解チェックデータ、JSON形式）
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # リレーションシップ
    course = relationship("Course", back_populates="chapters")
    progress_records = relationship("ProgressRecord", back_populates="chapter", cascade="all, delete-orphan")
    checklist_items = relationship("ChecklistItem", back_populates="chapter", cascade="all, delete-orphan", order_by="ChecklistItem.order_index")


class ChecklistItem(Base):
    """
    チェックリスト項目テーブル
    
    章内のチェックリスト項目を保持する。
    
    Attributes:
        id: チェックリスト項目ID（主キー）
        chapter_id: 章ID（外部キー）
        title: 項目タイトル
        order_index: 表示順序
        is_active: 有効/無効フラグ
        created_at: 作成日時
        updated_at: 最終更新日時
    """
    __tablename__ = "checklist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    order_index = Column(Integer, default=0, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # リレーションシップ
    chapter = relationship("Chapter", back_populates="checklist_items")
    progress_records = relationship("ProgressRecord", back_populates="checklist_item", cascade="all, delete-orphan")


class ProgressRecord(Base):
    """
    学習記録テーブル
    
    ユーザーの学習進捗（チェックマーク）を保持する。
    
    Attributes:
        id: レコードID（主キー）
        user_id: ユーザーID（外部キー）
        chapter_id: 章ID（外部キー、オプション）
        checklist_item_id: チェックリスト項目ID（外部キー、オプション）
        is_completed: 完了フラグ
        completed_at: 完了日時
        created_at: 作成日時
        updated_at: 最終更新日時
    """
    __tablename__ = "progress_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True, index=True)
    checklist_item_id = Column(Integer, ForeignKey("checklist_items.id"), nullable=True, index=True)
    is_completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # リレーションシップ
    user = relationship("User", back_populates="progress_records")
    chapter = relationship("Chapter", back_populates="progress_records")
    checklist_item = relationship("ChecklistItem", back_populates="progress_records")
    
    # ユニーク制約: 同じユーザー・章・チェックリスト項目の組み合わせは1つのみ
    __table_args__ = (
        {"sqlite_autoincrement": True},
    )


class SubscriptionHistory(Base):
    """
    課金状態変更履歴テーブル
    
    ユーザーの課金状態変更履歴を保持する。
    
    Attributes:
        id: レコードID（主キー）
        user_id: ユーザーID（外部キー）
        old_status: 変更前の状態
        new_status: 変更後の状態
        reason: 変更理由
        created_at: 変更日時
    """
    __tablename__ = "subscription_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    old_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # リレーションシップ
    user = relationship("User", back_populates="subscription_history")

