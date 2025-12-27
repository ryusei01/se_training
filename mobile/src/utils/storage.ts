// ローカルストレージ（AsyncStorage）ユーティリティ

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER_ID: "@se_training:user_id",
  DRAFT_PREFIX: "@se_training:draft:",
} as const;

// ユーザーIDを取得（なければ生成）
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
    return `anonymous_${Date.now()}`;
  }
}

// ドラフトをローカルに保存（オフライン対応）
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

// ドラフトをローカルから取得
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



