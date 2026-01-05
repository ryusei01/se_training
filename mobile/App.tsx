/**
 * メインエントリーポイント
 * 
 * React Nativeアプリケーションのルートコンポーネント。
 * ナビゲーションスタックを設定し、各画面を管理する。
 */

import { StatusBar } from "expo-status-bar";
import { NavigationContainer, NavigationState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

import ProblemListScreen from "./src/screens/ProblemListScreen";
import ProblemDetailScreen from "./src/screens/ProblemDetailScreen";
import CodeEditorScreen from "./src/screens/CodeEditorScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ChapterListScreen from "./src/screens/ChapterListScreen";
import ChapterDetailScreen from "./src/screens/ChapterDetailScreen";
import { DevToolsProvider } from "./src/devtools/DevToolsProvider";
import RequestListScreen from "./src/screens/RequestListScreen";
import RequestDetailScreen from "./src/screens/RequestDetailScreen";

/**
 * ナビゲーションスタックのパラメータ型定義
 */
export type RootStackParamList = {
  Login: undefined;  // ログイン画面
  Register: undefined;  // 新規登録画面
  Home: undefined;  // ホーム画面
  ProblemList: undefined;  // 問題一覧画面（パラメータなし）
  ProblemDetail: { problemId: string };  // 問題詳細画面（問題IDが必要）
  CodeEditor: { problemId: string; language: "python" | "typescript" };  // コードエディタ画面（問題IDと言語が必要）
  ChapterList: { courseId: number; courseName: string };  // 章一覧画面（コースIDとコース名が必要）
  ChapterDetail: { chapterId: number; courseId: number };  // 章詳細画面（章IDとコースIDが必要）
  RequestList: undefined; // 文書決裁デモ: 申請一覧
  RequestDetail: { requestId: number }; // 文書決裁デモ: 申請詳細
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const NAVIGATION_STATE_KEY = "NAVIGATION_STATE";

/**
 * アプリケーションのルートコンポーネント
 * 
 * ナビゲーションスタックを設定し、3つの画面（問題一覧、問題詳細、コードエディタ）を管理する。
 * ナビゲーション状態をAsyncStorageに保存し、リロード後も状態を保持する。
 * 
 * @returns {JSX.Element} アプリケーションのルートコンポーネント
 */
export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState | undefined>();

  useEffect(() => {
    // 保存されたナビゲーション状態を読み込む（一度だけ実行）
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
        if (savedStateString) {
          const state = JSON.parse(savedStateString);
          setInitialState(state);
        }
      } catch (e) {
        console.warn("Failed to restore navigation state:", e);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []);

  if (!isReady) {
    return null; // またはローディング画面を表示
  }

  return (
    <DevToolsProvider>
      <SafeAreaProvider testID="app-safe-area-provider">
        <NavigationContainer
          initialState={initialState}
          onStateChange={(state) => {
            // ナビゲーション状態が変更されたら保存
            AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
          }}
        >
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Home"  // 初期画面はホーム（ログイン不要）
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
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}  // ログイン画面はヘッダーを非表示
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}  // 新規登録画面はヘッダーを非表示
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "ホーム" }}
          />
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
          <Stack.Screen
            name="ChapterList"
            component={ChapterListScreen}
            options={({ route }) => ({ title: route.params.courseName })}
          />
          <Stack.Screen
            name="ChapterDetail"
            component={ChapterDetailScreen}
            options={({ route }) => ({ title: "章詳細" })}
          />
          <Stack.Screen
            name="RequestList"
            component={RequestListScreen}
            options={{ title: "申請一覧" }}
          />
          <Stack.Screen
            name="RequestDetail"
            component={RequestDetailScreen}
            options={{ title: "申請詳細" }}
          />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </DevToolsProvider>
  );
}



