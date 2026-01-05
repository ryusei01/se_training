/**
 * DevTools Provider
 *
 * docs/追加要件.md の DevTools（Network/Logs/Explain）骨格のための最小実装。
 * - Network: axios interceptor から記録
 * - Logs: console.* をフックして記録（フロントログ）
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setNetworkRecorder, NetworkRecord } from "../services/api";

export type LogLevel = "log" | "warn" | "error";

export type LogRecord = {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: string;
};

type DevToolsContextValue = {
  network: NetworkRecord[];
  logs: LogRecord[];
  clearNetwork: () => void;
  clearLogs: () => void;
};

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export function useDevTools() {
  const ctx = useContext(DevToolsContext);
  if (!ctx) throw new Error("useDevTools must be used within DevToolsProvider");
  return ctx;
}

export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<NetworkRecord[]>([]);
  const [logs, setLogs] = useState<LogRecord[]>([]);

  useEffect(() => {
    // Network recorder
    setNetworkRecorder((record) => {
      setNetwork((prev) => [record, ...prev].slice(0, 200)); // 上限200
    });

    // console hook
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const pushLog = (level: LogLevel, args: any[]) => {
      const message = args
        .map((a) => {
          try {
            if (typeof a === "string") return a;
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(" ");

      setLogs((prev) =>
        [
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            level,
            message,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 500)
      );
    };

    console.log = (...args: any[]) => {
      pushLog("log", args);
      originalLog(...args);
    };
    console.warn = (...args: any[]) => {
      pushLog("warn", args);
      originalWarn(...args);
    };
    console.error = (...args: any[]) => {
      pushLog("error", args);
      originalError(...args);
    };

    return () => {
      setNetworkRecorder(null);
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const value = useMemo<DevToolsContextValue>(
    () => ({
      network,
      logs,
      clearNetwork: () => setNetwork([]),
      clearLogs: () => setLogs([]),
    }),
    [network, logs]
  );

  return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>;
}




