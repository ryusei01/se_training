/**
 * エラーメッセージ表示モーダル
 *
 * Alertの代わりに使用するエラーメッセージ表示コンポーネント。
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface ErrorMessageModalProps {
  /**
   * モーダルの表示/非表示
   */
  visible: boolean;
  /**
   * エラーメッセージ
   */
  message: string;
  /**
   * タイトル（オプション）
   */
  title?: string;
  /**
   * 閉じるボタンが押されたときのコールバック
   */
  onClose: () => void;
  /**
   * OKボタンが押されたときのコールバック（オプション）
   */
  onOk?: () => void;
  /**
   * OKボタンのテキスト（デフォルト: "OK"）
   */
  okText?: string;
  /**
   * testID（オプション）
   */
  testID?: string;
}

/**
 * エラーメッセージ表示モーダルコンポーネント
 *
 * @param {ErrorMessageModalProps} props - プロップス
 * @returns {JSX.Element} エラーメッセージモーダル
 */
export default function ErrorMessageModal({
  visible,
  message,
  title = "エラー",
  onClose,
  onOk,
  okText = "OK",
  ...props
}: ErrorMessageModalProps) {
  const handleOk = () => {
    if (onOk) {
      onOk();
    }
    onClose();
  };

  return (
    <Modal
      testID={props.testID || "error-message-modal"}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} testID="error-message-modal-overlay">
        <View style={styles.modalContainer} testID="error-message-modal-container">
          <Text style={styles.title} testID="error-message-modal-title">{title}</Text>
          <Text style={styles.message} testID="error-message-modal-message">{message}</Text>
          <View style={styles.buttonContainer} testID="error-message-modal-button-container">
            <TouchableOpacity
              testID="error-message-modal-ok-button"
              style={styles.button}
              onPress={handleOk}
            >
              <Text style={styles.buttonText} testID="error-message-modal-ok-button-text">{okText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "#2c3e50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

