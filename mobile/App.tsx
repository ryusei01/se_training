/**
 * メインエントリーポイント
 * 
 * React Nativeアプリケーションのルートコンポーネント。
 * ナビゲーションスタックを設定し、各画面を管理する。
 */

import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ProblemListScreen from "./src/screens/ProblemListScreen";
import ProblemDetailScreen from "./src/screens/ProblemDetailScreen";
import CodeEditorScreen from "./src/screens/CodeEditorScreen";

/**
 * ナビゲーションスタックのパラメータ型定義
 */
export type RootStackParamList = {
  ProblemList: undefined;  // 問題一覧画面（パラメータなし）
  ProblemDetail: { problemId: string };  // 問題詳細画面（問題IDが必要）
  CodeEditor: { problemId: string; language: "python" | "typescript" };  // コードエディタ画面（問題IDと言語が必要）
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * アプリケーションのルートコンポーネント
 * 
 * ナビゲーションスタックを設定し、3つの画面（問題一覧、問題詳細、コードエディタ）を管理する。
 * 
 * @returns {JSX.Element} アプリケーションのルートコンポーネント
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="ProblemList"  // 初期画面は問題一覧
          screenOptions={{
            headerStyle: {
              backgroundColor: "#2c3e50",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="ProblemList"
            component={ProblemListScreen}
            options={{ title: "問題一覧" }}
          />
          <Stack.Screen
            name="ProblemDetail"
            component={ProblemDetailScreen}
            options={{ title: "問題詳細" }}
          />
          <Stack.Screen
            name="CodeEditor"
            component={CodeEditorScreen}
            options={{ title: "コード編集" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}



