// メインエントリーポイント

import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ProblemListScreen from "./src/screens/ProblemListScreen";
import ProblemDetailScreen from "./src/screens/ProblemDetailScreen";
import CodeEditorScreen from "./src/screens/CodeEditorScreen";

export type RootStackParamList = {
  ProblemList: undefined;
  ProblemDetail: { problemId: string };
  CodeEditor: { problemId: string; language: "python" | "typescript" };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="ProblemList"
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


