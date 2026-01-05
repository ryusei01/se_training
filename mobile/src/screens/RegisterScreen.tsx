/**
 * 新規登録画面
 *
 * ユーザー登録を行う画面。
 * ユーザー名、メールアドレス、パスワードで新規登録できる。
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { apiClient } from "../services/api";
import { getErrorMessage } from "../utils/errorHandler";
import ErrorMessageModal from "../components/ErrorMessageModal";
import ConfirmModal from "../components/ConfirmModal";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

/**
 * 新規登録画面コンポーネント
 *
 * @param {Props} props - ナビゲーションプロップ
 * @returns {JSX.Element} 新規登録画面コンポーネント
 */
export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("エラー");
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  /**
   * バリデーション
   *
   * @returns {string | null} エラーメッセージ（エラーがない場合はnull）
   */
  const validate = (): string | null => {
    if (!username.trim()) {
      return "ユーザー名を入力してください";
    }
    if (username.trim().length < 3) {
      return "ユーザー名は3文字以上で入力してください";
    }
    if (!email.trim()) {
      return "メールアドレスを入力してください";
    }
    if (!email.includes("@")) {
      return "有効なメールアドレスを入力してください";
    }
    if (!password) {
      return "パスワードを入力してください";
    }
    if (password.length < 6) {
      return "パスワードは6文字以上で入力してください";
    }
    if (password !== confirmPassword) {
      return "パスワードが一致しません";
    }
    return null;
  };

  /**
   * 新規登録処理
   */
  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorTitle("入力エラー");
      setErrorMessage(validationError);
      setErrorModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      await apiClient.register({
        username: username.trim(),
        email: email.trim(),
        password: password,
      });
      setSuccessModalVisible(true);
    } catch (error: any) {
      console.error("Register error:", error);
      const message = getErrorMessage(error);
      setErrorTitle("登録エラー");
      setErrorMessage(message);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      testID="register-screen"
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content} testID="register-content">
        <Text style={styles.title} testID="register-title">SE Training</Text>
        <Text style={styles.subtitle} testID="register-subtitle">新規登録</Text>

        <TextInput
          testID="register-username-input"
          style={styles.input}
          placeholder="ユーザー名（3文字以上）"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          testID="register-email-input"
          style={styles.input}
          placeholder="メールアドレス"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TextInput
          testID="register-password-input"
          style={styles.input}
          placeholder="パスワード（6文字以上）"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TextInput
          testID="register-confirm-password-input"
          style={styles.input}
          placeholder="パスワード（確認）"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          testID="register-submit-button"
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" testID="register-submit-button-loading" />
          ) : (
            <Text style={styles.buttonText} testID="register-submit-button-text">登録</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          testID="register-login-link"
          style={styles.linkButton}
          onPress={() => navigation.navigate("Login")}
          disabled={loading}
        >
          <Text style={styles.linkText} testID="register-login-link-text">
            既にアカウントをお持ちの方はこちら
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorMessageModal
        testID="register-error-modal"
        visible={errorModalVisible}
        message={errorMessage}
        title={errorTitle}
        onClose={() => setErrorModalVisible(false)}
      />

      <ConfirmModal
        testID="register-success-modal"
        visible={successModalVisible}
        message="アカウントが作成されました。ログインしてください。"
        title="登録完了"
        confirmText="ログイン"
        onClose={() => setSuccessModalVisible(false)}
        onConfirm={() => {
          setSuccessModalVisible(false);
          navigation.navigate("Login");
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    flexGrow: 1,
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

