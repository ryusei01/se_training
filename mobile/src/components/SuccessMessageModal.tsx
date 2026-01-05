/**
 * 成功メッセージ表示モーダル
 *
 * 成功メッセージを表示するためのコンポーネント。
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface SuccessMessageModalProps {
  /**
   * モーダルの表示/非表示
   */
  visible: boolean;
  /**
   * メッセージ
   */
  message: string;
  /**
   * タイトル（オプション、デフォルト: "成功"）
   */
  title?: string;
  /**
   * 閉じるボタンが押されたときのコールバック
   */
  onClose: () => void;
  /**
   * testID（オプション）
   */
  testID?: string;
}

/**
 * 成功メッセージ表示モーダルコンポーネント
 *
 * @param {SuccessMessageModalProps} props - プロップス
 * @returns {JSX.Element} 成功メッセージモーダル
 */
export default function SuccessMessageModal({
  visible,
  message,
  title = "成功",
  onClose,
  testID,
}: SuccessMessageModalProps) {
  return (
    <Modal
      testID={testID || "success-message-modal"}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} testID="success-message-modal-overlay">
        <View style={styles.modalContainer} testID="success-message-modal-container">
          <Text style={styles.title} testID="success-message-modal-title">{title}</Text>
          <Text style={styles.message} testID="success-message-modal-message">{message}</Text>
          <View style={styles.buttonContainer} testID="success-message-modal-button-container">
            <TouchableOpacity
              testID="success-message-modal-ok-button"
              style={styles.button}
              onPress={onClose}
            >
              <Text style={styles.buttonText} testID="success-message-modal-ok-button-text">OK</Text>
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
    color: "#28a745",
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
    backgroundColor: "#28a745",
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

