/**
 * ログイン画面
 *
 * ユーザー認証を行う画面。
 * ユーザー名とパスワードでログインできる。
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { getErrorMessage } from "../utils/errorHandler";
import ErrorMessageModal from "../components/ErrorMessageModal";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

/**
 * ログイン画面コンポーネント
 *
 * @param {Props} props - ナビゲーションプロップ
 * @returns {JSX.Element} ログイン画面コンポーネント
 */
export default function LoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("エラー");

  /**
   * ログイン処理
   */
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorTitle("入力エラー");
      setErrorMessage("ユーザー名とパスワードを入力してください");
      setErrorModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      await apiClient.login({ username, password });
      // ログイン成功時はホーム画面に遷移
      navigation.replace("Home");
    } catch (error: any) {
      console.error("Login error:", error);
      const message = getErrorMessage(error);
      setErrorTitle("ログインエラー");
      setErrorMessage(message);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="login-screen">
      <View style={styles.content} testID="login-content">
        <Text style={styles.title} testID="login-title">SE Training</Text>
        <Text style={styles.subtitle} testID="login-subtitle">ログイン</Text>

        <TextInput
          testID="login-username-input"
          style={styles.input}
          placeholder="ユーザー名"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          testID="login-password-input"
          style={styles.input}
          placeholder="パスワード"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          testID="login-submit-button"
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" testID="login-submit-button-loading" />
          ) : (
            <Text style={styles.buttonText} testID="login-submit-button-text">ログイン</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText} testID="login-info-text">
          デフォルトユーザー: admin / password
        </Text>

        <TouchableOpacity
          testID="login-register-link"
          style={styles.linkButton}
          onPress={() => navigation.navigate("Register")}
          disabled={loading}
        >
          <Text style={styles.linkText} testID="login-register-link-text">
            新規登録はこちら
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorMessageModal
        testID="login-error-modal"
        visible={errorModalVisible}
        message={errorMessage}
        title={errorTitle}
        onClose={() => setErrorModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#2c3e50",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#999",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 16,
  },
  linkButton: {
    marginTop: 16,
    alignItems: "center",
  },
  linkText: {
    color: "#2c3e50",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

