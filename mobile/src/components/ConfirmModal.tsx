/**
 * 確認モーダル
 *
 * Alertの代わりに使用する確認ダイアログコンポーネント。
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface ConfirmModalProps {
  /**
   * モーダルの表示/非表示
   */
  visible: boolean;
  /**
   * メッセージ
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
   * OKボタンが押されたときのコールバック
   */
  onConfirm: () => void;
  /**
   * キャンセルボタンが押されたときのコールバック（オプション）
   */
  onCancel?: () => void;
  /**
   * OKボタンのテキスト（デフォルト: "OK"）
   */
  confirmText?: string;
  /**
   * キャンセルボタンのテキスト（デフォルト: "キャンセル"）
   */
  cancelText?: string;
  /**
   * testID（オプション）
   */
  testID?: string;
}

/**
 * 確認モーダルコンポーネント
 *
 * @param {ConfirmModalProps} props - プロップス
 * @returns {JSX.Element} 確認モーダル
 */
export default function ConfirmModal({
  visible,
  message,
  title,
  onClose,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "キャンセル",
  ...props
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  return (
    <Modal
      testID={props.testID || "confirm-modal"}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} testID="confirm-modal-overlay">
        <View style={styles.modalContainer} testID="confirm-modal-container">
          {title && <Text style={styles.title} testID="confirm-modal-title">{title}</Text>}
          <Text style={styles.message} testID="confirm-modal-message">{message}</Text>
          <View style={styles.buttonContainer} testID="confirm-modal-button-container">
            <TouchableOpacity
              testID="confirm-modal-cancel-button"
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText} testID="confirm-modal-cancel-button-text">{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="confirm-modal-confirm-button"
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText} testID="confirm-modal-confirm-button-text">{confirmText}</Text>
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
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "#2c3e50",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

