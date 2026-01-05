/**
 * エラーハンドリングユーティリティ
 *
 * APIエラーを日本語メッセージに変換する。
 */

import { AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_STORAGE_KEY = "@se_training:auth_token";

/**
 * 401エラーかどうかをチェック
 *
 * @param {any} error - エラーオブジェクト
 * @returns {boolean} 401エラーの場合true
 */
export function isUnauthorizedError(error: any): boolean {
  return error?.response?.status === 401;
}

/**
 * エラーメッセージを取得
 *
 * @param {any} error - エラーオブジェクト
 * @returns {string} 日本語のエラーメッセージ
 */
export function getErrorMessage(error: any): string {
  // AxiosErrorの場合
  if (error.response) {
    const status = error.response.status;
    const detail = error.response.data?.detail;

    // 401エラー: 認証エラー
    if (status === 401) {
      return "ログインが必要です。ログイン画面に移動します。";
    }

    // 403エラー: 権限エラー
    if (status === 403) {
      return "この操作を実行する権限がありません。";
    }

    // 404エラー: リソースが見つからない
    if (status === 404) {
      return "リソースが見つかりませんでした。";
    }

    // 500エラー: サーバーエラー
    if (status >= 500) {
      return "サーバーエラーが発生しました。しばらくしてから再度お試しください。";
    }

    // その他のHTTPエラー
    if (detail) {
      if (typeof detail === "string") {
        // 英語メッセージを日本語に変換
        if (detail.includes("Incorrect username or password")) {
          return "ユーザー名またはパスワードが正しくありません";
        }
        if (detail.includes("Could not validate credentials")) {
          return "認証に失敗しました。再度ログインしてください";
        }
        if (detail.includes("Username already registered")) {
          return "このユーザー名は既に使用されています";
        }
        if (detail.includes("Email already registered")) {
          return "このメールアドレスは既に登録されています";
        }
        return detail;
      }
      if (Array.isArray(detail)) {
        // バリデーションエラーの場合
        return detail.map((err: any) => err.msg || err.message).join("\n");
      }
    }

    return `エラーが発生しました（ステータスコード: ${status}）`;
  }

  // ネットワークエラー
  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return "接続がタイムアウトしました。ネットワーク接続を確認してください。";
  }

  if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
    return "ネットワークエラーが発生しました。API URLの設定を確認してください。";
  }

  // その他のエラー
  if (error.message) {
    return error.message;
  }

  return "予期しないエラーが発生しました。";
}

/**
 * 認証が必要かどうかをチェック
 *
 * @returns {Promise<boolean>} 認証済みの場合true
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    return !!token;
  } catch {
    return false;
  }
}

