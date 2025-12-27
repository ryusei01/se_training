// app.config.js - 環境変数を使用可能にする設定ファイル
// app.json の代わりにこのファイルを使用することで、環境変数を動的に設定可能

export default {
  expo: {
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
      supportsTablet: true,
      bundleIdentifier: "com.setraining.app",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#2c3e50",
      },
      package: "com.setraining.app",
      versionCode: 1,
      permissions: ["INTERNET"],
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.setraining.app",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [],
    scheme: "se-training",
    extra: {
      // 環境変数からAPI URLを取得
      // 優先順位: EXPO_PUBLIC_API_BASE_URL > API_BASE_URL > デフォルト値
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        process.env.API_BASE_URL ||
        "http://localhost:8000",
      eas: {
        projectId: "898ea8ac-11d3-4b0a-945e-00ef5c17b576",
      },
    },
  },
};

