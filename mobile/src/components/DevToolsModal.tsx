/**
 * DevTools モーダル（Network / Logs / Explain）
 *
 * Alert.alert()は禁止のため、独自モーダルで実装する。
 */

import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useDevTools } from "../devtools/DevToolsProvider";

type TabKey = "network" | "logs" | "explain";

export default function DevToolsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { network, logs, clearLogs, clearNetwork } = useDevTools();
  const [tab, setTab] = useState<TabKey>("network");
  const [onlyErrors, setOnlyErrors] = useState(false);

  const filteredNetwork = useMemo(() => {
    if (!onlyErrors) return network;
    return network.filter((n) => (n.status ?? 0) >= 400 || !!n.error_message);
  }, [network, onlyErrors]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>DevTools</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TabButton label="Network" active={tab === "network"} onPress={() => setTab("network")} />
          <TabButton label="Logs" active={tab === "logs"} onPress={() => setTab("logs")} />
          <TabButton label="Explain" active={tab === "explain"} onPress={() => setTab("explain")} />
        </View>

        {tab === "network" && (
          <View style={styles.content}>
            <View style={styles.toolbar}>
              <TouchableOpacity
                style={[styles.smallButton, onlyErrors && styles.smallButtonActive]}
                onPress={() => setOnlyErrors((v) => !v)}
              >
                <Text style={styles.smallButtonText}>{"status>=400 フィルタ"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={clearNetwork}>
                <Text style={styles.smallButtonText}>クリア</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll}>
              {filteredNetwork.length === 0 ? (
                <Text style={styles.emptyText}>まだ通信がありません（Run/Execute で API を実行してください）</Text>
              ) : (
                filteredNetwork.map((n) => (
                  <View key={n.id} style={styles.networkItem}>
                    <View style={styles.networkTop}>
                      <Text style={styles.method}>{n.method}</Text>
                      <Text style={styles.path} numberOfLines={1}>
                        {n.path}
                      </Text>
                      <Text style={[styles.status, (n.status ?? 0) >= 400 && styles.statusError]}>
                        {n.status ?? "-"}
                      </Text>
                      <Text style={styles.duration}>{n.duration_ms}ms</Text>
                    </View>
                    <Text style={styles.timestamp}>{n.timestamp}</Text>
                    <View style={styles.payload}>
                      {!!n.request_body && (
                        <Text style={styles.payloadText}>
                          request: {typeof n.request_body === "string" ? n.request_body : JSON.stringify(n.request_body)}
                        </Text>
                      )}
                      {!!n.response_body && (
                        <Text style={styles.payloadText}>
                          response: {typeof n.response_body === "string" ? n.response_body : JSON.stringify(n.response_body)}
                        </Text>
                      )}
                      {!!n.error_message && <Text style={styles.payloadError}>error: {n.error_message}</Text>}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {tab === "logs" && (
          <View style={styles.content}>
            <View style={styles.toolbar}>
              <TouchableOpacity style={styles.smallButton} onPress={clearLogs}>
                <Text style={styles.smallButtonText}>クリア</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scroll}>
              {logs.length === 0 ? (
                <Text style={styles.emptyText}>まだログがありません</Text>
              ) : (
                logs.map((l) => (
                  <View key={l.id} style={styles.logItem}>
                    <Text style={[styles.logLevel, l.level === "error" && styles.logError, l.level === "warn" && styles.logWarn]}>
                      {l.level.toUpperCase()}
                    </Text>
                    <Text style={styles.logMessage}>{l.message}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {tab === "explain" && (
          <View style={styles.content}>
            <ScrollView style={styles.scroll}>
              <Text style={styles.explainTitle}>症状別ガイド（最小骨格）</Text>
              <Text style={styles.explainText}>- 起動失敗: Build/Runtime Logs を確認（環境変数・PORT）</Text>
              <Text style={styles.explainText}>- 500: Networkでstatus=500、サーバログで例外を確認</Text>
              <Text style={styles.explainText}>- 403: 認証トークン/権限、CORSならConsole/Network</Text>
              <Text style={styles.explainText}>- 遅延: duration の大きい通信を Network で特定</Text>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  closeButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#333", borderRadius: 6 },
  closeButtonText: { color: "#fff", fontSize: 12 },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#333" },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabButtonActive: { backgroundColor: "#1f1f1f" },
  tabButtonText: { color: "#aaa", fontWeight: "bold" },
  tabButtonTextActive: { color: "#fff" },
  content: { flex: 1 },
  toolbar: { flexDirection: "row", gap: 8, padding: 10, borderBottomWidth: 1, borderBottomColor: "#333" },
  smallButton: { backgroundColor: "#333", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  smallButtonActive: { backgroundColor: "#005a9e" },
  smallButtonText: { color: "#fff", fontSize: 12 },
  scroll: { flex: 1, padding: 10 },
  emptyText: { color: "#aaa", paddingVertical: 10 },
  networkItem: { borderWidth: 1, borderColor: "#333", borderRadius: 8, padding: 10, marginBottom: 10 },
  networkTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  method: { color: "#4ec9b0", fontWeight: "bold", width: 60 },
  path: { color: "#fff", flex: 1 },
  status: { color: "#fff", width: 40, textAlign: "right" },
  statusError: { color: "#ff6b6b" },
  duration: { color: "#aaa", width: 60, textAlign: "right" },
  timestamp: { color: "#777", marginTop: 6, fontSize: 11 },
  payload: { marginTop: 8, gap: 4 },
  payloadText: { color: "#ccc", fontSize: 12 },
  payloadError: { color: "#ff6b6b", fontSize: 12 },
  logItem: { flexDirection: "row", gap: 8, marginBottom: 8 },
  logLevel: { width: 60, color: "#aaa", fontWeight: "bold" },
  logWarn: { color: "#ffd166" },
  logError: { color: "#ff6b6b" },
  logMessage: { color: "#fff", flex: 1, fontSize: 12 },
  explainTitle: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  explainText: { color: "#ddd", marginBottom: 8 },
});


