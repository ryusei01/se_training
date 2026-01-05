// app.config.js - 環境変数を使用可能にする設定ファイル
// app.json の代わりにこのファイルを使用することで、環境変数を動的に設定可能

export default ({ config }) => {
  // 環境変数からAPI URLを取得
  // 優先順位: EXPO_PUBLIC_API_BASE_URL > API_BASE_URL > デフォルト値
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:8000";

  return {
    ...config,
    expo: {
      ...config.expo,
      extra: {
        ...config.expo.extra,
        apiBaseUrl: apiBaseUrl,
      },
    },
  };
};




