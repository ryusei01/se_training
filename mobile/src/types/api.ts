// API型定義

export type Language = "python" | "typescript";

export type Difficulty = "easy" | "medium" | "hard";

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string[];
  time_limit_sec: number;
  memory_limit_mb: number;
  description: string; // Markdown
  function_signature: string;
  test_code: string;
  supported_languages?: Language[];
  hint?: string;
  solution?: string;
}

export interface Execution {
  execution_id: string;
  user_id: string;
  problem_id?: string;
  language: Language;
  code: string;
  stdin?: string;
  timestamp: string;
  status: "success" | "failure" | "error" | "timeout";
  exit_code?: number;
  stdout?: string;
  stderr?: string;
  execution_time_sec?: number;
  error_message?: string;
}

export interface Draft {
  user_id: string;
  problem_id: string;
  language: Language;
  code: string;
  updated_at: string;
}

export interface RunRequest {
  code: string;
  language: Language;
  stdin?: string;
  problem_id?: string;
  user_id?: string;
  time_limit_sec?: number;
}

export interface SaveDraftRequest {
  problem_id: string;
  language: Language;
  code: string;
  user_id?: string;
}

