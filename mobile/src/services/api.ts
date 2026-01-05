/**
 * APIクライアント
 *
 * バックエンドAPIとの通信を行うためのクライアントクラス。
 * axiosを使用してHTTPリクエストを送信する。
 */

import axios, { AxiosInstance, AxiosError } from "axios";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Problem,
  Execution,
  Draft,
  RunRequest,
  SaveDraftRequest,
  Chapter,
  ApprovalRequest,
  ProgressExport,
  ProgressImport,
  ProgressRecord,
} from "../types/api";

// 認証トークンのストレージキー
const TOKEN_STORAGE_KEY = "@se_training:auth_token";

/**
 * APIベースURLを動的に取得
 * デバッグ環境では常にlocalhostを使用し、本番環境ではapp.config.jsから取得
 * 毎回呼び出すことで、app.config.jsの設定が後から読み込まれた場合にも対応
 */
const getApiBaseUrl = (): string => {
  // デバッグ環境（開発モード）の場合は常にlocalhostを使用
  if (__DEV__) {
    const devUrl = "http://192.168.11.4:8000";
    console.log("[api.ts] Using dev API URL:", devUrl);
    return devUrl;
  }

  // 本番環境ではapp.config.jsから取得（環境変数から設定された値）
  const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

  // デバッグログ: 設定値を確認
  console.log("[api.ts] Constants.expoConfig?.extra?.apiBaseUrl:", apiBaseUrl);
  console.log(
    "[api.ts] Constants.expoConfig?.extra:",
    Constants.expoConfig?.extra
  );

  if (apiBaseUrl && apiBaseUrl !== "http://localhost:8000") {
    console.log("[api.ts] Using configured API URL:", apiBaseUrl);
    return apiBaseUrl;
  }

  // フォールバック: デフォルト値（本番環境では通常設定されるべき）
  const fallbackUrl = apiBaseUrl || "http://localhost:8000";
  console.warn("[api.ts] Using fallback API URL:", fallbackUrl);
  console.warn(
    "[api.ts] Warning: API URL may not be configured correctly for production build!"
  );
  return fallbackUrl;
};

/**
 * DevTools (Network) 記録用のコールバック
 *
 * 章内の API 実行や通常の API 通信を Network タブ風に可視化するために使用する。
 */
export type NetworkRecord = {
  id: string;
  method: string;
  url: string;
  path: string;
  status?: number;
  duration_ms: number;
  request_body?: any;
  response_body?: any;
  error_message?: string;
  timestamp: string;
};

let networkRecorder: ((record: NetworkRecord) => void) | null = null;

export function setNetworkRecorder(
  recorder: ((record: NetworkRecord) => void) | null
) {
  networkRecorder = recorder;
}

/**
 * ユーザー情報
 */
export interface User {
  id: number;
  username: string;
  email: string;
  subscription_status: "free" | "trial" | "paid";
  trial_started_at?: string;
  trial_ends_at?: string;
  created_at: string;
}

/**
 * コース情報
 */
export interface Course {
  id: number;
  name: string;
  description?: string;
  target_audience?: string;
  order_index: number;
  is_active: boolean;
  course_type: "problem_list" | "chapter_list";  // コースタイプ: 問題一覧画面 or 章一覧画面
  created_at: string;
  updated_at: string;
  completion_rate: number;
  last_studied_chapter_id?: number;
  is_accessible: boolean;
}

// Chapter型はtypes/api.tsで定義されているため、ここでは再定義しない

/**
 * ログインリクエスト
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 認証トークン
 */
export interface Token {
  access_token: string;
  token_type: string;
}

/**
 * APIクライアントクラス
 *
 * バックエンドAPIとの通信を行うメソッドを提供する。
 */
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    // 初期ベースURLを設定（後で動的に更新される可能性がある）
    this.client = axios.create({
      baseURL: getApiBaseUrl(),
      timeout: 30000, // 30秒でタイムアウト
      headers: {
        "Content-Type": "application/json",
      },
    });

    // リクエストインターセプター: 認証トークンを追加 + Network計測開始 + ベースURLの動的更新
    this.client.interceptors.request.use(
      async (config) => {
        // ベースURLを動的に取得（app.config.jsの設定が後から読み込まれた場合に対応）
        const currentBaseUrl = getApiBaseUrl();
        if (config.baseURL !== currentBaseUrl) {
          config.baseURL = currentBaseUrl;
        }

        // Network計測用に開始時刻を保存
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (config as any).__startTime = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (config as any).__requestId = `${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`;

        if (!this.token) {
          const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
          if (storedToken) {
            this.token = storedToken;
          }
        }
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター: 401エラー時はログアウト（エラーは呼び出し元で処理） + Network記録
    this.client.interceptors.response.use(
      (response) => {
        const start = (response.config as any).__startTime as
          | number
          | undefined;
        const id = (response.config as any).__requestId as string | undefined;
        const duration = start ? Date.now() - start : 0;

        if (networkRecorder) {
          const fullUrl = `${response.config.baseURL || ""}${
            response.config.url || ""
          }`;
          networkRecorder({
            id: id || `${Date.now()}`,
            method: (response.config.method || "GET").toUpperCase(),
            url: fullUrl,
            path: response.config.url || "",
            status: response.status,
            duration_ms: duration,
            request_body: response.config.data,
            response_body: response.data,
            timestamp: new Date().toISOString(),
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        // 401エラー時はトークンを削除するが、エラーは呼び出し元で処理
        if (error.response?.status === 401) {
          // トークンを削除（ログアウト）
          this.token = null;
          await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
        }

        // Network記録（失敗）
        if (networkRecorder) {
          const cfg = error.config as any;
          const start = cfg?.__startTime as number | undefined;
          const id = cfg?.__requestId as string | undefined;
          const duration = start ? Date.now() - start : 0;
          const fullUrl = `${cfg?.baseURL || ""}${cfg?.url || ""}`;

          networkRecorder({
            id: id || `${Date.now()}`,
            method: (cfg?.method || "GET").toUpperCase(),
            url: fullUrl,
            path: cfg?.url || "",
            status: error.response?.status,
            duration_ms: duration,
            request_body: cfg?.data,
            response_body: error.response?.data,
            error_message: error.message,
            timestamp: new Date().toISOString(),
          });
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * 教材用: 任意の API を実行する（DevTools Network で観測する想定）
   */
  async runTrainingApi(
    method: string,
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any
  ): Promise<any> {
    const upper = method.toUpperCase();
    if (upper === "GET") {
      return (await this.client.get(path)).data;
    }
    if (upper === "POST") {
      return (await this.client.post(path, body)).data;
    }
    if (upper === "PUT") {
      return (await this.client.put(path, body)).data;
    }
    if (upper === "DELETE") {
      return (await this.client.delete(path)).data;
    }
    throw new Error(`Unsupported method: ${method}`);
  }

  /**
   * ログイン
   *
   * @param {LoginRequest} request - ログインリクエスト
   * @returns {Promise<Token>} 認証トークン
   */
  async login(request: LoginRequest): Promise<Token> {
    // FastAPIのOAuth2PasswordRequestFormはapplication/x-www-form-urlencoded形式を期待
    // URLSearchParamsが利用できない環境向けに手動でエンコード
    const formData = `username=${encodeURIComponent(
      request.username
    )}&password=${encodeURIComponent(request.password)}`;

    const response = await this.client.post<Token>(
      "/api/auth/login",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // トークンを保存
    this.token = response.data.access_token;
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, this.token);

    return response.data;
  }

  /**
   * ユーザー登録
   *
   * @param {Object} request - 登録リクエスト
   * @param {string} request.username - ユーザー名
   * @param {string} request.email - メールアドレス
   * @param {string} request.password - パスワード
   * @returns {Promise<User>} 作成されたユーザー情報
   */
  async register(request: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    const response = await this.client.post<User>(
      "/api/auth/register",
      request
    );
    return response.data;
  }

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  /**
   * 現在のユーザー情報を取得
   *
   * @returns {Promise<User>} ユーザー情報
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>("/api/auth/me");
    return response.data;
  }

  /**
   * コース一覧を取得
   *
   * @returns {Promise<Course[]>} コースのリスト
   */
  async getCourses(): Promise<Course[]> {
    const response = await this.client.get<Course[]>("/api/courses/");
    return response.data;
  }

  /**
   * コースの章一覧を取得
   *
   * @param {number} courseId - コースID
   * @returns {Promise<Chapter[]>} 章のリスト
   */
  async getCourseChapters(courseId: number): Promise<Chapter[]> {
    const response = await this.client.get<Chapter[]>(
      `/api/courses/${courseId}/chapters`
    );
    return response.data;
  }

  /**
   * 章詳細を取得
   *
   * @param {number} courseId - コースID
   * @param {number} chapterId - 章ID
   * @returns {Promise<Chapter>} 章情報
   */
  async getChapter(courseId: number, chapterId: number): Promise<Chapter> {
    const response = await this.client.get<Chapter>(
      `/api/courses/${courseId}/chapters/${chapterId}`
    );
    return response.data;
  }

  /**
   * 文書決裁デモ: 申請一覧を取得
   */
  async getRequests(): Promise<ApprovalRequest[]> {
    const response = await this.client.get<ApprovalRequest[]>("/api/requests");
    return response.data;
  }

  /**
   * 文書決裁デモ: 申請詳細を取得
   */
  async getRequest(requestId: number): Promise<ApprovalRequest> {
    const response = await this.client.get<ApprovalRequest>(
      `/api/requests/${requestId}`
    );
    return response.data;
  }

  /**
   * 問題一覧を取得する
   *
   * @returns {Promise<Problem[]>} 問題のリスト
   */
  async getProblems(): Promise<Problem[]> {
    const response = await this.client.get<Problem[]>("/api/problems/");
    return response.data;
  }

  /**
   * 問題詳細を取得する
   *
   * @param {string} problemId - 問題ID
   * @returns {Promise<Problem>} 問題の詳細情報
   */
  async getProblem(problemId: string): Promise<Problem> {
    const response = await this.client.get<Problem>(
      `/api/problems/${problemId}`
    );
    return response.data;
  }

  /**
   * コードを実行する（簡易実行、テストは実行しない）
   *
   * @param {RunRequest} request - 実行リクエスト（コード、言語、標準入力など）
   * @returns {Promise<Execution>} 実行結果
   */
  async runCode(request: RunRequest): Promise<Execution> {
    const response = await this.client.post<Execution>(
      "/api/executions/run",
      request
    );
    return response.data;
  }

  /**
   * 実行履歴を取得する
   *
   * @param {Object} params - フィルタパラメータ
   * @param {string} [params.user_id] - ユーザーIDでフィルタ
   * @param {string} [params.problem_id] - 問題IDでフィルタ
   * @param {string} [params.language] - 言語でフィルタ
   * @param {number} [params.limit] - 取得件数の上限
   * @returns {Promise<Execution[]>} 実行履歴のリスト
   */
  async getExecutionHistory(params?: {
    user_id?: string;
    problem_id?: string;
    language?: string;
    limit?: number;
  }): Promise<Execution[]> {
    const response = await this.client.get<Execution[]>(
      "/api/executions/history",
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * ドラフトを保存する
   *
   * @param {SaveDraftRequest} request - ドラフト保存リクエスト
   * @returns {Promise<Draft>} 保存されたドラフト
   */
  async saveDraft(request: SaveDraftRequest): Promise<Draft> {
    const response = await this.client.post<Draft>("/api/drafts/save", request);
    return response.data;
  }

  /**
   * ドラフトを取得する
   *
   * @param {string} problemId - 問題ID
   * @param {string} language - プログラミング言語
   * @param {string} [userId] - ユーザーID（オプション）
   * @returns {Promise<Draft | null>} ドラフト（見つからない場合はnull）
   */
  async getDraft(
    problemId: string,
    language: string,
    userId?: string
  ): Promise<Draft | null> {
    try {
      const response = await this.client.get<Draft>(
        `/api/drafts/${problemId}`,
        {
          params: { language, user_id: userId },
        }
      );
      return response.data;
    } catch (error: any) {
      // 404エラーの場合はnullを返す（ドラフトが存在しない）
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 進捗をエクスポート（JSON形式）
   *
   * @returns {Promise<ProgressExport>} エクスポートデータ
   */
  async exportProgress(): Promise<ProgressExport> {
    const response = await this.client.get<ProgressExport>(
      "/api/progress/export"
    );
    return response.data;
  }

  /**
   * 進捗をインポート（JSON形式）
   *
   * @param {ProgressImport} importData - インポートデータ
   * @returns {Promise<ProgressRecord[]>} インポートされた学習記録のリスト
   */
  async importProgress(importData: ProgressImport): Promise<ProgressRecord[]> {
    const response = await this.client.post<ProgressRecord[]>(
      "/api/progress/import",
      importData
    );
    return response.data;
  }
}

/**
 * APIクライアントのシングルトンインスタンス
 */
export const apiClient = new ApiClient();
