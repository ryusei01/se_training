"""
コース関連のPydanticスキーマ

APIリクエストとレスポンスのデータモデルを定義する。
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CourseBase(BaseModel):
    """
    コースの基本情報
    
    Attributes:
        name: コース名
        description: コース概要
        target_audience: 推奨対象
        order_index: 表示順序
        is_free: 無料ユーザーがアクセス可能かどうか（無料範囲）
        free_range_limit: 互換用（非推奨）: 無料範囲でのアクセス可能なコースID上限
        course_type: コースタイプ（"problem_list": 問題一覧画面、"chapter_list": 章一覧画面）
    """
    name: str
    description: Optional[str] = None
    target_audience: Optional[str] = None
    order_index: int = 0
    is_free: bool = False
    free_range_limit: Optional[int] = None
    course_type: str = "chapter_list"


class CourseCreate(CourseBase):
    """
    コース作成リクエスト
    """
    pass


class CourseUpdate(BaseModel):
    """
    コース更新リクエスト
    
    Attributes:
        name: コース名（オプション）
        description: コース概要（オプション）
        target_audience: 推奨対象（オプション）
        order_index: 表示順序（オプション）
        is_active: 有効/無効フラグ（オプション）
        free_range_limit: 無料範囲でのアクセス可能なコースID上限（オプション）
        course_type: コースタイプ（オプション）
    """
    name: Optional[str] = None
    description: Optional[str] = None
    target_audience: Optional[str] = None
    order_index: Optional[int] = None
    is_active: Optional[bool] = None
    free_range_limit: Optional[int] = None
    course_type: Optional[str] = None


class CourseResponse(CourseBase):
    """
    コース情報レスポンス
    
    Attributes:
        id: コースID
        is_active: 有効/無効フラグ
        course_type: コースタイプ
        created_at: 作成日時
        updated_at: 最終更新日時
    """
    id: int
    is_active: bool
    course_type: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CourseWithProgress(CourseResponse):
    """
    進捗情報を含むコース情報レスポンス
    
    Attributes:
        completion_rate: 完了率（0.0-1.0）
        last_studied_chapter_id: 最後に学習した章ID
        is_accessible: アクセス可能かどうか
    """
    completion_rate: float = 0.0
    last_studied_chapter_id: Optional[int] = None
    is_accessible: bool = True


class ChapterBase(BaseModel):
    """
    章の基本情報
    
    Attributes:
        title: 章タイトル
        order_index: 章の表示順序
        content: 章のコンテンツ（Markdown形式、全体説明）
        goal: Goal（この章でできるようになること）
        system_overview: System Overview（今どこを触っているか）
        file_explorer_data: File Explorer（JSON形式のファイルツリーデータ）
        hands_on_steps: Hands-on Steps（操作手順）
        run_execute_data: Run / Execute（実行データ、JSON形式）
        result_data: Result（結果確認データ、JSON形式）
        why_it_works: Why it works（仕組み解説）
        check_data: Check（理解チェックデータ、JSON形式）
    """
    title: str
    order_index: int = 0
    content: Optional[str] = None
    goal: Optional[str] = None
    system_overview: Optional[str] = None
    file_explorer_data: Optional[str] = None  # JSON形式
    hands_on_steps: Optional[str] = None
    run_execute_data: Optional[str] = None  # JSON形式
    result_data: Optional[str] = None  # JSON形式
    why_it_works: Optional[str] = None
    check_data: Optional[str] = None  # JSON形式


class ChapterCreate(ChapterBase):
    """
    章作成リクエスト
    
    Attributes:
        course_id: コースID
    """
    course_id: int


class ChapterResponse(ChapterBase):
    """
    章情報レスポンス
    
    Attributes:
        id: 章ID
        course_id: コースID
        is_active: 有効/無効フラグ
        created_at: 作成日時
        updated_at: 最終更新日時
    """
    id: int
    course_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class FileTreeItem(BaseModel):
    """
    ファイルツリー項目
    
    Attributes:
        name: ファイル名またはフォルダ名
        type: タイプ（"file" または "folder"）
        path: ファイルパス
        content: ファイル内容（type="file"の場合）
        children: 子要素（type="folder"の場合）
        highlighted_lines: ハイライトする行番号のリスト
    """
    name: str
    type: str  # "file" or "folder"
    path: str
    content: Optional[str] = None
    children: Optional[List["FileTreeItem"]] = None
    highlighted_lines: Optional[List[int]] = None


class RunExecuteData(BaseModel):
    """
    実行データ
    
    Attributes:
        type: 実行タイプ（"frontend" | "api" | "deploy"）
        frontend_url: フロントエンド実行の場合のURL（iframe用）
        api_endpoint: API実行の場合のエンドポイント
        api_method: API実行の場合のHTTPメソッド
        api_request_body: API実行の場合のリクエストボディ
        deploy_logs: デプロイ実行の場合のログデータ
    """
    type: str  # "frontend" | "api" | "deploy"
    frontend_url: Optional[str] = None
    api_endpoint: Optional[str] = None
    api_method: Optional[str] = None
    api_request_body: Optional[dict] = None
    deploy_logs: Optional[str] = None


class ResultData(BaseModel):
    """
    結果確認データ
    
    Attributes:
        type: 結果タイプ（"screen" | "network" | "logs"）
        screen_url: 画面表示の場合のURL
        network_data: Network表示の場合のデータ
        logs_data: Logs表示の場合のデータ
    """
    type: str  # "screen" | "network" | "logs"
    screen_url: Optional[str] = None
    network_data: Optional[list] = None
    logs_data: Optional[list] = None


class CheckData(BaseModel):
    """
    理解チェックデータ
    
    Attributes:
        questions: チェック項目のリスト
    """
    questions: List[dict]  # 各質問は { "question": "...", "options": [...], "answer": "..." } の形式


class ChecklistItemBase(BaseModel):
    """
    チェックリスト項目の基本情報
    
    Attributes:
        title: 項目タイトル
        order_index: 表示順序
    """
    title: str
    order_index: int = 0


class ChecklistItemCreate(ChecklistItemBase):
    """
    チェックリスト項目作成リクエスト
    
    Attributes:
        chapter_id: 章ID
    """
    chapter_id: int


class ChecklistItemResponse(ChecklistItemBase):
    """
    チェックリスト項目情報レスポンス
    
    Attributes:
        id: チェックリスト項目ID
        chapter_id: 章ID
        is_active: 有効/無効フラグ
        created_at: 作成日時
        updated_at: 最終更新日時
    """
    id: int
    chapter_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProgressRecordBase(BaseModel):
    """
    学習記録の基本情報
    
    Attributes:
        chapter_id: 章ID（オプション）
        checklist_item_id: チェックリスト項目ID（オプション）
        is_completed: 完了フラグ
    """
    chapter_id: Optional[int] = None
    checklist_item_id: Optional[int] = None
    is_completed: bool = True


class ProgressRecordCreate(ProgressRecordBase):
    """
    学習記録作成リクエスト
    """
    pass


class ProgressRecordResponse(ProgressRecordBase):
    """
    学習記録レスポンス
    
    Attributes:
        id: レコードID
        user_id: ユーザーID
        completed_at: 完了日時
        created_at: 作成日時
        updated_at: 最終更新日時
    """
    id: int
    user_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

