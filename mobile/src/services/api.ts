// APIクライアント

import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";
import {
  Problem,
  Execution,
  Draft,
  RunRequest,
  SaveDraftRequest,
} from "../types/api";

// APIベースURL（app.config.jsから取得、フォールバックはlocalhost）
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8000";

// デバッグ用: API URLをコンソールに出力
if (__DEV__) {
  console.log("API Base URL:", API_BASE_URL);
  console.log("Expo Config Extra:", Constants.expoConfig?.extra);
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // 問題一覧取得
  async getProblems(): Promise<Problem[]> {
    const response = await this.client.get<Problem[]>("/api/problems/");
    return response.data;
  }

  // 問題詳細取得
  async getProblem(problemId: string): Promise<Problem> {
    const response = await this.client.get<Problem>(`/api/problems/${problemId}`);
    return response.data;
  }

  // コード実行（簡易実行）
  async runCode(request: RunRequest): Promise<Execution> {
    const response = await this.client.post<Execution>(
      "/api/executions/run",
      request
    );
    return response.data;
  }

  // 実行履歴取得
  async getExecutionHistory(params?: {
    user_id?: string;
    problem_id?: string;
    language?: string;
    limit?: number;
  }): Promise<Execution[]> {
    const response = await this.client.get<Execution[]>("/api/executions/history", {
      params,
    });
    return response.data;
  }

  // ドラフト保存
  async saveDraft(request: SaveDraftRequest): Promise<Draft> {
    const response = await this.client.post<Draft>("/api/drafts/save", request);
    return response.data;
  }

  // ドラフト取得
  async getDraft(
    problemId: string,
    language: string,
    userId?: string
  ): Promise<Draft | null> {
    try {
      const response = await this.client.get<Draft>(`/api/drafts/${problemId}`, {
        params: { language, user_id: userId },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
