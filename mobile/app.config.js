// app.config.js - 環境変数を使用可能にする設定ファイル
// app.json の代わりにこのファイルを使用することで、環境変数を動的に設定可能

import "dotenv/config";

// デバッグ用: 環境変数を確認
console.log("[app.config.js] API_BASE_URL:", process.env.API_BASE_URL);

export default ({ config }) => {
  // 環境変数からAPI URLを取得
  // 優先順位: EXPO_PUBLIC_API_BASE_URL > API_BASE_URL > デフォルト値
  const apiBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:8000";

  // configがundefinedの場合や、config.expoが存在しない場合のフォールバック
  const baseConfig = config || {};
  const baseExpo = baseConfig.expo || {};

  return {
    ...baseConfig,
    expo: {
      ...baseExpo,
      name: "SE Training",
      slug: "se-training",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#2c3e50",
      },
      assetBundlePatterns: ["**/*"],
      ios: {
        ...baseExpo.ios,
        supportsTablet: true,
        bundleIdentifier: "com.setraining.app",
      },
      android: {
        ...baseExpo.android,
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#2c3e50",
        },
        package: "com.setraining.app",
        versionCode: baseExpo.android?.versionCode || 1,
        permissions: ["INTERNET"],
        playStoreUrl:
          "https://play.google.com/store/apps/details?id=com.setraining.app",
      },
      web: {
        ...baseExpo.web,
        favicon: "./assets/favicon.png",
      },
      plugins: ["expo-secure-store"],
      scheme: "se-training",
      extra: {
        ...baseExpo.extra,
        apiBaseUrl: apiBaseUrl,
        eas: {
          projectId: "898ea8ac-11d3-4b0a-945e-00ef5c17b576",
        },
      },
    },
  };
};
