/**
 * API型定義
 * 
 * バックエンドAPIとの通信で使用する型定義。
 */

/** 対応プログラミング言語 */
export type Language = "python" | "typescript";

/** 難易度 */
export type Difficulty = "easy" | "medium" | "hard";

/**
 * 問題情報のインターフェース
 */
export interface Problem {
  id: string;  // 問題ID（例: "ct-001"）
  title: string;  // 問題タイトル
  difficulty: Difficulty;  // 難易度
  category: string[];  // カテゴリリスト
  time_limit_sec: number;  // 実行時間制限（秒）
  memory_limit_mb: number;  // メモリ制限（MB）
  description: string;  // Markdown形式の問題文
  function_signature: string;  // 関数シグネチャ
  test_code: string;  // テストコード
  supported_languages?: Language[];  // 対応言語リスト（オプション）
  hint?: string;  // ヒント（Markdown形式、オプション）
  solution?: string;  // 答えと解説（Markdown形式、オプション）
}

/**
 * 実行結果のインターフェース（簡易実行用）
 */
export interface Execution {
  execution_id: string;  // 実行ID（UUID）
  user_id: string;  // ユーザーID
  problem_id?: string;  // 問題ID（オプション）
  language: Language;  // プログラミング言語
  code: string;  // 実行されたコード
  stdin?: string;  // 標準入力（オプション）
  timestamp: string;  // 実行日時（ISO形式）
  status: "success" | "failure" | "error" | "timeout";  // 実行ステータス
  exit_code?: number;  // 終了コード（オプション）
  stdout?: string;  // 標準出力（オプション）
  stderr?: string;  // 標準エラー出力（オプション）
  execution_time_sec?: number;  // 実行時間（秒、オプション）
  error_message?: string;  // エラーメッセージ（オプション）
}

/**
 * ドラフト情報のインターフェース
 */
export interface Draft {
  user_id: string;  // ユーザーID
  problem_id: string;  // 問題ID
  language: Language;  // プログラミング言語
  code: string;  // 保存されているコード
  updated_at: string;  // 最終更新日時（ISO形式）
}

/**
 * コード実行リクエストのインターフェース
 */
export interface RunRequest {
  code: string;  // 実行するコード
  language: Language;  // プログラミング言語
  stdin?: string;  // 標準入力（オプション）
  problem_id?: string;  // 問題ID（オプション）
  user_id?: string;  // ユーザーID（オプション）
  time_limit_sec?: number;  // 実行時間制限（秒、オプション）
}

/**
 * ドラフト保存リクエストのインターフェース
 */
export interface SaveDraftRequest {
  problem_id: string;  // 問題ID
  language: Language;  // プログラミング言語
  code: string;  // 保存するコード
  user_id?: string;  // ユーザーID（オプション）
}

/**
 * ファイルツリー項目
 */
export interface FileTreeItem {
  name: string;
  type: "file" | "folder";
  path: string;
  content?: string;
  children?: FileTreeItem[];
  highlighted_lines?: number[];
}

/**
 * 実行データ
 */
export interface RunExecuteData {
  type: "frontend" | "api" | "deploy";
  frontend_url?: string;
  api_endpoint?: string;
  api_method?: string;
  api_request_body?: any;
  deploy_logs?: string;
}

/**
 * 結果確認データ
 */
export interface ResultData {
  type: "screen" | "network" | "logs";
  screen_url?: string;
  network_data?: any[];
  logs_data?: any[];
}

/**
 * 理解チェックデータ
 */
export interface CheckData {
  questions: Array<{
    question: string;
    options?: string[];
    answer?: string;
  }>;
}

/**
 * 文書決裁デモ（申請）
 */
export type RequestStatus = "draft" | "submitted" | "approved" | "returned" | "rejected";

export interface ApprovalRequest {
  id: number;
  title: string;
  body?: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

/**
 * 章情報のインターフェース
 */
export interface Chapter {
  id: number;  // 章ID
  course_id: number;  // コースID
  title: string;  // 章タイトル
  order_index: number;  // 表示順序
  content?: string;  // 章のコンテンツ（Markdown形式、全体説明）
  goal?: string;  // Goal（この章でできるようになること）
  system_overview?: string;  // System Overview（今どこを触っているか）
  file_explorer_data?: string;  // File Explorer（JSON形式のファイルツリーデータ）
  hands_on_steps?: string;  // Hands-on Steps（操作手順）
  run_execute_data?: string;  // Run / Execute（実行データ、JSON形式）
  result_data?: string;  // Result（結果確認データ、JSON形式）
  why_it_works?: string;  // Why it works（仕組み解説）
  check_data?: string;  // Check（理解チェックデータ、JSON形式）
  is_active: boolean;  // 有効/無効フラグ
  created_at: string;  // 作成日時（ISO形式）
  updated_at: string;  // 最終更新日時（ISO形式）
}

/**
 * 学習記録（進捗）
 */
export interface ProgressRecord {
  id: number;
  user_id: number;
  chapter_id?: number;
  checklist_item_id?: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 進捗エクスポートデータ
 */
export interface ProgressExport {
  version: string;
  exported_at: string;
  user_id: number;
  records: ProgressRecord[];
}

/**
 * 進捗インポートデータ
 */
export interface ProgressImport {
  records: Array<{
    chapter_id?: number;
    checklist_item_id?: number;
    is_completed: boolean;
  }>;
}



