/**
 * 認証状態管理フック
 *
 * 認証状態をチェックし、未認証の場合はログイン画面にリダイレクトする。
 */

import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";

const TOKEN_STORAGE_KEY = "@se_training:auth_token";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * 認証状態をチェックするフック
 *
 * @param {boolean} requireAuth - 認証が必須かどうか（デフォルト: true）
 * @returns {{isAuthenticated: boolean, isLoading: boolean}} 認証状態とローディング状態
 */
export function useAuth(requireAuth: boolean = true) {
  const navigation = useNavigation<NavigationProp>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * 認証状態をチェック
   */
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        setIsAuthenticated(false);
        if (requireAuth) {
          navigation.replace("Login");
        }
        return;
      }

      // トークンが存在する場合、ユーザー情報を取得して認証状態を確認
      try {
        await apiClient.getCurrentUser();
        setIsAuthenticated(true);
      } catch (error) {
        // トークンが無効な場合
        setIsAuthenticated(false);
        await apiClient.logout();
        if (requireAuth) {
          navigation.replace("Login");
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      if (requireAuth) {
        navigation.replace("Login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthenticated, isLoading };
}



