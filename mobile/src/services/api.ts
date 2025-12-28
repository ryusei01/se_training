/**
 * APIクライアント
 *
 * バックエンドAPIとの通信を行うためのクライアントクラス。
 * axiosを使用してHTTPリクエストを送信する。
 */

import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";
import {
  Problem,
  Execution,
  Draft,
  RunRequest,
  SaveDraftRequest,
} from "../types/api";

/**
 * APIベースURL
 * デバッグ環境では常にlocalhostを使用し、本番環境ではapp.config.jsから取得
 */
const getApiBaseUrl = (): string => {
  // デバッグ環境（開発モード）の場合は常にlocalhostを使用
  if (__DEV__) {
    return "http://192.168.11.4:8000";
  }

  // 本番環境ではapp.config.jsから取得（環境変数から設定された値）
  return Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8000";
};

const API_BASE_URL = getApiBaseUrl();

// デバッグ用: API URLを確認
console.log("[api.ts] API Base URL:", API_BASE_URL);
console.log("[api.ts] Is Dev Mode:", __DEV__);
console.log(
  "[api.ts] Constants.expoConfig?.extra:",
  Constants.expoConfig?.extra
);

// デバッグ用: API URLをコンソールに出力
if (__DEV__) {
  console.log("API Base URL (Development - always localhost):", API_BASE_URL);
  console.log("Expo Config Extra:", Constants.expoConfig?.extra);
}

/**
 * APIクライアントクラス
 *
 * バックエンドAPIとの通信を行うメソッドを提供する。
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30秒でタイムアウト
      headers: {
        "Content-Type": "application/json",
      },
    });
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
}

/**
 * APIクライアントのシングルトンインスタンス
 */
export const apiClient = new ApiClient();
