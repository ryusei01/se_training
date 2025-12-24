TypeScript コーディングテスト（Hard / 120 分想定）
問題 1：非同期ジョブの依存解決と実行順制御
概要

複数の非同期ジョブがあり、それぞれが 依存関係 と 実行時間 を持っています。
依存が解決されたジョブは即時実行可能ですが、
同時実行数に上限 があります。

すべてのジョブを完了するまでの 最短時間 を求めてください。

入力
type Job = {
id: string
duration: number
dependsOn: string[]
}

jobs: Job[]
maxConcurrency: number

出力
number // 全ジョブ完了までの時間

制約

job 数 ≤ 10^5

依存関係に循環はない

duration ≥ 1

maxConcurrency ≥ 1

公開テストケース設計
TC1-1：単一ジョブ

jobs = [{id:"A", duration:5, dependsOn:[]}]

maxConcurrency = 1

期待値：5

TC1-2：直列依存

A → B → C

maxConcurrency = 2

期待値：A+B+C

TC1-3：並列制御

A,B 同時開始、C が両方依存

maxConcurrency = 1

実行順制御確認

非公開テストケース設計

大規模 DAG

maxConcurrency=1（キュー挙動）

maxConcurrency≫job 数

ランダム依存

問題 2：API ログからレイテンシ異常区間を検出せよ
概要

API のレスポンスタイムログが与えられます。
一定時間ウィンドウ内の 平均レイテンシ が閾値を超えた区間を検出してください。

入力
type Log = {
timestamp: number
latencyMs: number
}

logs: Log[]
windowSec: number
latencyThreshold: number

出力
Array<[number, number]>

制約

logs.length ≤ 2×10^5

timestamp 昇順

windowSec ≥ 1

テスト観点

スライディングウィンドウ

浮動小数点

区間マージ

空入力

非公開テスト

閾値ぴったり

単一点スパイク

長時間高負荷

問題 3：設定依存グラフの影響範囲解析
概要

設定キー間の依存関係が与えられます。
変更されたキーから 影響を受ける全キー を列挙してください。

入力
dependencies: Array<[string, string]> // A -> B
changedKeys: string[]

出力
string[]

制約

キー数 ≤ 10^5

循環依存あり

重複禁止

テスト観点

DFS / BFS

visited 管理

大規模グラフ

問題 4：イベント駆動システムの再試行制御
概要

イベント処理システムにおいて、
失敗したイベントは 指数バックオフ で再試行されます。

すべてのイベントが成功するまでの 総経過時間 を求めてください。

入力
type Event = {
id: string
initialTime: number
retryCount: number
}
baseDelayMs: number

出力
number

テスト観点

指数計算

オーバーフロー対策

並列イベント処理

問題 5：ストリームデータのトップ K 集計
概要

数値ストリームが流れてきます。
任意時点で 上位 K 個の値の合計 を即座に返せるようにしてください。

入力
add(value: number): void
query(): number

制約

呼び出し回数 ≤ 2×10^5

K は固定

add と query は任意順

テスト観点

ヒープ操作

負数混在

大量データ

総設計意図

TypeScript らしい 型設計力

非同期・イベント・ログなど実務要素

計算量・メモリを強く要求
