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



