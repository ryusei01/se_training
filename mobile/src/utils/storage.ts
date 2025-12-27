/**
 * ローカルストレージ（AsyncStorage）ユーティリティ
 * 
 * AsyncStorageを使用してローカルにデータを保存・取得する機能を提供する。
 * オフライン対応のため、ドラフトをローカルにも保存する。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * ストレージキーの定義
 */
const STORAGE_KEYS = {
  USER_ID: "@se_training:user_id",  // ユーザーIDのキー
  DRAFT_PREFIX: "@se_training:draft:",  // ドラフトのキーのプレフィックス
} as const;

/**
 * ユーザーIDを取得する（存在しない場合は生成する）
 * 
 * AsyncStorageからユーザーIDを取得し、存在しない場合は新しく生成して保存する。
 * 
 * @returns {Promise<string>} ユーザーID
 */
export async function getOrCreateUserId(): Promise<string> {
  try {
    let userId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      // 簡易UUID生成（実運用では適切なUUIDライブラリを使用）
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  } catch (error) {
    console.error("Failed to get user ID:", error);
    // エラー時は一時的なIDを返す
    return `anonymous_${Date.now()}`;
  }
}

/**
 * ドラフトをローカルに保存する（オフライン対応）
 * 
 * サーバーへの保存が失敗した場合でも、ローカルに保存することで
 * オフライン時でもドラフトを復元できるようにする。
 * 
 * @param {string} problemId - 問題ID
 * @param {string} language - プログラミング言語
 * @param {string} code - 保存するコード
 * @returns {Promise<void>}
 */
export async function saveDraftLocally(
  problemId: string,
  language: string,
  code: string
): Promise<void> {
  try {
    const key = `${STORAGE_KEYS.DRAFT_PREFIX}${problemId}:${language}`;
    await AsyncStorage.setItem(key, code);
  } catch (error) {
    console.error("Failed to save draft locally:", error);
  }
}

/**
 * ドラフトをローカルから取得する
 * 
 * @param {string} problemId - 問題ID
 * @param {string} language - プログラミング言語
 * @returns {Promise<string | null>} ドラフトのコード（見つからない場合はnull）
 */
export async function getDraftLocally(
  problemId: string,
  language: string
): Promise<string | null> {
  try {
    const key = `${STORAGE_KEYS.DRAFT_PREFIX}${problemId}:${language}`;
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error("Failed to get draft locally:", error);
    return null;
  }
}



