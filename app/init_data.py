"""
初期データ作成スクリプト

データベースに初期データ（コース、章など）を作成する。
"""
from app.models.user import User, SubscriptionStatus
from app.models.course import Course, Chapter, ChecklistItem
from app.models.request import Request, RequestStatus
from app.auth import get_password_hash
from datetime import datetime
import json

def create_initial_data():
    """
    初期データを作成する
    
    以下のデータを作成:
    - デフォルトユーザー（admin/password）
    - 3つのコース（コーディング試験、システム開発演習、業務効率化Python演習）
    - システム開発演習の章（第0章〜第7章）
    
    注意: この関数はinit_db()から呼び出されるため、init_db()を呼び出さないこと
    """
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        # デフォルトユーザーを作成（既に存在する場合はスキップ）
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("password"),
                subscription_status=SubscriptionStatus.PAID,
            )
            db.add(admin_user)
            db.commit()
            print("[OK] デフォルトユーザーを作成しました (admin/password)")
        else:
            print("[OK] デフォルトユーザーは既に存在します")
        
        # コース1: コーディング試験
        course1 = db.query(Course).filter(Course.id == 1).first()
        if not course1:
            course1 = Course(
                id=1,
                name="コーディング試験",
                description="アルゴリズム系コーディングテストの演習問題を提供します。実装問題とテストケース、解説を通じてコーディングスキルを向上させます。",
                target_audience="初心者〜初級者",
                order_index=1,
                is_active=True,
                is_free=True,  # 無料範囲（DB駆動）
                free_range_limit=1,  # 無料範囲: このコースのみ
                course_type="problem_list",  # 問題一覧画面に遷移
            )
            db.add(course1)
            db.commit()
            print("[OK] コース1: コーディング試験を作成しました")
        else:
            # 既存データの補正（マイグレーション対応）
            updated = False
            if course1.is_free is not True:
                course1.is_free = True
                updated = True
            if course1.course_type != "problem_list":
                course1.course_type = "problem_list"
                updated = True
            if updated:
                db.commit()
                print("[OK] コース1を補正しました（is_free/course_type）")
            else:
                print("[OK] コース1は既に存在します")
        
        # コース2: システム開発演習
        course2 = db.query(Course).filter(Course.id == 2).first()
        if not course2:
            course2 = Course(
                id=2,
                name="システム開発演習",
                description="React+TypeScriptとSpring Bootを使った実際のWebシステム開発を学習します。デプロイから障害対応まで一貫して体験できます。",
                target_audience="初級者〜中級者",
                order_index=2,
                is_active=True,
                is_free=False,
                free_range_limit=None,  # 無料範囲外
                course_type="chapter_list",  # 章一覧画面に遷移
            )
            db.add(course2)
            db.commit()
            print("[OK] コース2: システム開発演習を作成しました")
        else:
            # 既存データの補正（マイグレーション対応）
            updated = False
            if course2.is_free is not False:
                course2.is_free = False
                updated = True
            if course2.course_type != "chapter_list":
                course2.course_type = "chapter_list"
                updated = True
            if updated:
                db.commit()
                print("[OK] コース2を補正しました（is_free/course_type）")
            else:
                print("[OK] コース2は既に存在します")
        
        # システム開発演習の章を作成（第0章〜第7章）
        chapters_data = [
            {
                "title": "第0章：環境・VS Code・Git 入門",
                "order_index": 0,
                "content": "# 第0章：環境・VS Code・Git 入門\n\nこの章では、開発環境のセットアップと基本的なツールの使い方を学習します。\n\n## Goal（この章でできるようになること）\n\n- VS Code の画面構成を理解する\n- ファイルを開く・編集・保存できる\n- TortoiseGit による Clone・Commit・Push ができる\n- 検索・置換操作ができる\n\n## System Overview（今どこを触っているか）\n\n開発環境のセットアップを行います。\n\n## Hands-on Steps（操作手順）\n\n1. VS Code をインストール\n2. プロジェクトを Clone\n3. ファイルを編集・保存\n\n## Run / Execute（実行）\n\nファイル編集結果の反映を確認します。\n\n## Result（結果確認）\n\n編集したファイルが正しく保存されることを確認します。\n\n## Why it works（仕組み解説）\n\nファイルシステムとエディタの基本的な動作を理解します。",
            },
            {
                "title": "第1章：React 一覧画面表示",
                "order_index": 1,
                "content": "# 第1章：React 一覧画面表示\n\nこの章では、React を使って一覧画面を表示する方法を学習します。\n\n## Goal（この章でできるようになること）\n\n- JSX の最低限構文を理解する\n- 配列 map で一覧を表示できる\n\n## System Overview（今どこを触っているか）\n\nReact フロントエンドの開発を行います。\n\n## Hands-on Steps（操作手順）\n\n1. React コンポーネントを作成\n2. データを配列で定義\n3. map で一覧を表示\n\n## Run / Execute（実行）\n\n開発サーバーを起動して一覧画面を表示します。\n\n## Result（結果確認）\n\n一覧画面が正しく表示されることを確認します。",
            },
            {
                "title": "第2章：Spring Boot API 作成",
                "order_index": 2,
                "content": "# 第2章：Spring Boot API 作成\n\nこの章では、Spring Boot を使って REST API を作成する方法を学習します。\n\n## Goal（この章でできるようになること）\n\n- Controller の役割を理解する\n- JSON レスポンスを返す API を作成できる\n\n## System Overview（今どこを触っているか）\n\nSpring Boot バックエンドの開発を行います。\n\n## Hands-on Steps（操作手順）\n\n1. Controller クラスを作成\n2. GET エンドポイントを実装\n3. JSON レスポンスを返す\n\n## Run / Execute（実行）\n\nSpring Boot アプリケーションを起動して API を実行します。\n\n## Result（結果確認）\n\nAPI レスポンスが正しく返されることを確認します。",
            },
            {
                "title": "第3章：React と API 接続",
                "order_index": 3,
                "content": "# 第3章：React と API 接続\n\nこの章では、React フロントエンドから Spring Boot API に接続する方法を学習します。\n\n## Goal（この章でできるようになること）\n\n- fetch / async-await を使える\n- Network タブで通信を確認できる\n\n## System Overview（今どこを触っているか）\n\nフロントエンドとバックエンドの連携を行います。\n\n## Hands-on Steps（操作手順）\n\n1. fetch API を使用して API を呼び出す\n2. async-await で非同期処理を実装\n3. レスポンスデータを画面に表示\n\n## Run / Execute（実行）\n\nフロントエンドから API を呼び出してデータを表示します。\n\n## Result（結果確認）\n\nNetwork タブで API 通信を確認し、データが正しく表示されることを確認します。",
            },
            {
                "title": "第4章：一覧 → 詳細遷移",
                "order_index": 4,
                "content": "# 第4章：一覧 → 詳細遷移\n\nこの章では、一覧画面から詳細画面へ遷移する機能を実装します。\n\n## Goal（この章でできるようになること）\n\n- URL パラメータを使用できる\n- 詳細 API を呼び出せる\n\n## System Overview（今どこを触っているか）\n\nReact Router を使った画面遷移を実装します。\n\n## Hands-on Steps（操作手順）\n\n1. React Router を設定\n2. URL パラメータから ID を取得\n3. 詳細 API を呼び出してデータを表示\n\n## Run / Execute（実行）\n\n一覧画面から詳細画面へ遷移してデータを表示します。\n\n## Result（結果確認）\n\n詳細画面が正しく表示されることを確認します。",
            },
            {
                "title": "第5章：DB と永続化",
                "order_index": 5,
                "content": "# 第5章：DB と永続化\n\nこの章では、データベースを使ったデータの永続化を学習します。\n\n## Goal（この章でできるようになること）\n\n- Entity と Table の関係を理解する\n- データベースにデータを保存できる\n\n## System Overview（今どこを触っているか）\n\nSpring Boot とデータベースの連携を行います。\n\n## Hands-on Steps（操作手順）\n\n1. Entity クラスを作成\n2. Repository を実装\n3. データを保存・取得\n\n## Run / Execute（実行）\n\nデータを保存して、再起動後もデータが保持されることを確認します。\n\n## Result（結果確認）\n\nデータが正しく永続化されることを確認します。",
            },
            {
                "title": "第6章：Render デプロイ",
                "order_index": 6,
                "content": "# 第6章：Render デプロイ\n\nこの章では、作成したアプリケーションを Render にデプロイする方法を学習します。\n\n## Goal（この章でできるようになること）\n\n- GitHub と Render を連携できる\n- 環境変数を設定できる\n- デプロイされたアプリケーションにアクセスできる\n\n## System Overview（今どこを触っているか）\n\nデプロイ環境のセットアップを行います。\n\n## Hands-on Steps（操作手順）\n\n1. GitHub にリポジトリを作成\n2. Render でサービスを作成\n3. 環境変数を設定\n4. デプロイを実行\n\n## Run / Execute（実行）\n\nデプロイされたアプリケーションにアクセスして動作を確認します。\n\n## Result（結果確認）\n\n公開 URL でアプリケーションが正しく動作することを確認します。",
            },
            {
                "title": "第7章：障害対応演習",
                "order_index": 7,
                "content": "# 第7章：障害対応演習\n\nこの章では、実際の障害を体験し、ログや Network タブを使って原因を特定する方法を学習します。\n\n## Goal（この章でできるようになること）\n\n- 500 エラー、403 エラー、起動失敗を切り分けられる\n- Log と Network タブを確認できる\n- 障害を復旧できる\n\n## System Overview（今どこを触っているか）\n\nデプロイ環境での障害対応を行います。\n\n## Hands-on Steps（操作手順）\n\n1. 意図的に障害を発生させる\n2. Log と Network タブで原因を調査\n3. 問題を修正して復旧\n\n## Run / Execute（実行）\n\n障害を発生させて、復旧手順を実践します。\n\n## Result（結果確認）\n\n障害が正しく復旧されることを確認します。",
            },
        ]
        
        # 既存の章を確認して、不足している章を追加、または既存の章を更新
        existing_chapters = db.query(Chapter).filter(Chapter.course_id == 2).all()
        existing_titles = {ch.title for ch in existing_chapters}
        existing_chapters_dict = {ch.title: ch for ch in existing_chapters}
        
        new_chapters_count = 0
        updated_chapters_count = 0
        for chapter_data in chapters_data:
            if chapter_data["title"] not in existing_titles:
                # サンプルのファイルツリーデータを作成（第0章のみ）
                file_explorer_data = None
                if chapter_data["order_index"] == 0:
                    file_explorer_data = json.dumps([
                        {
                            "name": "src",
                            "type": "folder",
                            "path": "src",
                            "children": [
                                {
                                    "name": "App.tsx",
                                    "type": "file",
                                    "path": "src/App.tsx",
                                    "content": "import React from 'react';\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;"
                                },
                                {
                                    "name": "index.tsx",
                                    "type": "file",
                                    "path": "src/index.tsx",
                                    "content": "import React from 'react';\nimport ReactDOM from 'react-dom';\nimport App from './App';\n\nReactDOM.render(<App />, document.getElementById('root'));"
                                }
                            ]
                        },
                        {
                            "name": "package.json",
                            "type": "file",
                            "path": "package.json",
                            "content": "{\n  \"name\": \"my-app\",\n  \"version\": \"0.1.0\",\n  \"dependencies\": {\n    \"react\": \"^18.0.0\",\n    \"react-dom\": \"^18.0.0\"\n  }\n}"
                        }
                    ], ensure_ascii=False)
                
                chapter = Chapter(
                    course_id=2,
                    title=chapter_data["title"],
                    order_index=chapter_data["order_index"],
                    content=chapter_data["content"],
                    file_explorer_data=file_explorer_data,
                    # 第0章だけ「何かが動く」を保証する最低限データを付与（Phase1）
                    run_execute_data=json.dumps(
                        {
                            "type": "api",
                            "api_method": "GET",
                            "api_endpoint": "/api/requests",
                            "api_request_body": None,
                        },
                        ensure_ascii=False,
                    )
                    if chapter_data["order_index"] == 0
                    else None,
                    result_data=json.dumps(
                        {
                            "type": "network",
                            "network_data": [],
                        },
                        ensure_ascii=False,
                    )
                    if chapter_data["order_index"] == 0
                    else None,
                    check_data=json.dumps(
                        {
                            "questions": [
                                {
                                    "question": "Networkで確認すべき項目は？",
                                    "options": [
                                        "method / path / status / duration",
                                        "CPU使用率だけ",
                                    ],
                                    "answer": "method / path / status / duration",
                                }
                            ]
                        },
                        ensure_ascii=False,
                    )
                    if chapter_data["order_index"] == 0
                    else None,
                    is_active=True,
                )
                db.add(chapter)
                new_chapters_count += 1
            else:
                # 既存の章にfile_explorer_dataがない場合は追加（第0章のみ）
                existing_chapter = existing_chapters_dict.get(chapter_data["title"])
                if existing_chapter and not existing_chapter.file_explorer_data and chapter_data["order_index"] == 0:
                    file_explorer_data = json.dumps([
                        {
                            "name": "src",
                            "type": "folder",
                            "path": "src",
                            "children": [
                                {
                                    "name": "App.tsx",
                                    "type": "file",
                                    "path": "src/App.tsx",
                                    "content": "import React from 'react';\n\nfunction App() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n\nexport default App;"
                                },
                                {
                                    "name": "index.tsx",
                                    "type": "file",
                                    "path": "src/index.tsx",
                                    "content": "import React from 'react';\nimport ReactDOM from 'react-dom';\nimport App from './App';\n\nReactDOM.render(<App />, document.getElementById('root'));"
                                }
                            ]
                        },
                        {
                            "name": "package.json",
                            "type": "file",
                            "path": "package.json",
                            "content": "{\n  \"name\": \"my-app\",\n  \"version\": \"0.1.0\",\n  \"dependencies\": {\n    \"react\": \"^18.0.0\",\n    \"react-dom\": \"^18.0.0\"\n  }\n}"
                        }
                    ], ensure_ascii=False)
                    existing_chapter.file_explorer_data = file_explorer_data
                    updated_chapters_count += 1

                # 既存の第0章に Run/Result/Check が無い場合は付与（Phase1）
                if existing_chapter and chapter_data["order_index"] == 0:
                    if not existing_chapter.run_execute_data:
                        existing_chapter.run_execute_data = json.dumps(
                            {
                                "type": "api",
                                "api_method": "GET",
                                "api_endpoint": "/api/requests",
                                "api_request_body": None,
                            },
                            ensure_ascii=False,
                        )
                        updated_chapters_count += 1

                # CORS 失敗注入の教材（最低1本）：第3章に /api/cors-demo/fail/ping を設定
                if existing_chapter and chapter_data["order_index"] == 3:
                    if not existing_chapter.run_execute_data:
                        existing_chapter.run_execute_data = json.dumps(
                            {
                                "type": "api",
                                "api_method": "GET",
                                "api_endpoint": "/api/cors-demo/fail/ping",
                                "api_request_body": None,
                            },
                            ensure_ascii=False,
                        )
                        updated_chapters_count += 1
                    if not existing_chapter.result_data:
                        existing_chapter.result_data = json.dumps(
                            {"type": "network", "network_data": []},
                            ensure_ascii=False,
                        )
                        updated_chapters_count += 1
                    if not existing_chapter.result_data:
                        existing_chapter.result_data = json.dumps(
                            {"type": "network", "network_data": []},
                            ensure_ascii=False,
                        )
                        updated_chapters_count += 1
                    if not existing_chapter.check_data:
                        existing_chapter.check_data = json.dumps(
                            {
                                "questions": [
                                    {
                                        "question": "CORSエラーはどこで確認する？",
                                        "options": ["Console/Network", "メール"],
                                        "answer": "Console/Network",
                                    }
                                ]
                            },
                            ensure_ascii=False,
                        )
                        updated_chapters_count += 1
        
        if new_chapters_count > 0 or updated_chapters_count > 0:
            db.commit()
            if new_chapters_count > 0:
                print(
                    f"[OK] システム開発演習の章を{new_chapters_count}個追加しました（合計: {len(existing_chapters) + new_chapters_count}個）"
                )
            if updated_chapters_count > 0:
                print(f"[OK] {updated_chapters_count}件の章データを更新しました（file_explorer/run/result/check）")
        else:
            print(f"[OK] システム開発演習の章は既にすべて存在します（{len(existing_chapters)}個）")

        # 文書決裁デモ（申請）サンプルデータ（Phase1: GET 用）
        if db.query(Request).count() == 0:
            samples = [
                Request(
                    title="有給申請（2026/01/05）",
                    body="理由: 私用のため。",
                    status=RequestStatus.SUBMITTED,
                ),
                Request(
                    title="PC購入申請（開発用）",
                    body="用途: 開発環境の更新。",
                    status=RequestStatus.DRAFT,
                ),
                Request(
                    title="出張申請（東京）",
                    body="目的: 顧客MTG。",
                    status=RequestStatus.APPROVED,
                ),
            ]
            for r in samples:
                db.add(r)
            db.commit()
            print("[OK] 文書決裁デモのサンプル申請を作成しました")
        
        # コース3: 業務効率化Python演習
        course3 = db.query(Course).filter(Course.id == 3).first()
        if not course3:
            course3 = Course(
                id=3,
                name="業務効率化Python演習",
                description="Pythonの環境構築から始め、ファイル処理、CSV/Excel操作など、業務で使える実践的なスキルを学びます。",
                target_audience="初心者",
                order_index=3,
                is_active=True,  # 実装完了のため有効化
                is_free=False,
                free_range_limit=None,  # 無料範囲外
                course_type="chapter_list",  # 章一覧画面に遷移
            )
            db.add(course3)
            db.commit()
            print("[OK] コース3: 業務効率化Python演習を作成しました")
        else:
            # 既存データの補正（マイグレーション対応）
            updated = False
            if course3.is_active is not True:
                course3.is_active = True
                updated = True
            if course3.is_free is not False:
                course3.is_free = False
                updated = True
            if course3.course_type != "chapter_list":
                course3.course_type = "chapter_list"
                updated = True
            if updated:
                db.commit()
                print("[OK] コース3を補正しました（is_active/is_free/course_type）")
            else:
                print("[OK] コース3は既に存在します")
        
        # 業務効率化Python演習の章を作成（第0章〜第7章）
        python_chapters_data = [
            {
                "title": "第0章：Pythonとは何か・何ができるか",
                "order_index": 0,
                "goal": "## Goal（この章でできるようになること）\n\n- Pythonでできる業務効率化の例を理解する\n- Excel作業、ファイル整理、ログ処理などの実用例を知る\n- 本コースで作るものの全体像を把握する",
                "system_overview": "## System Overview（今どこを触っているか）\n\nPythonの概要と業務効率化での活用例を学習します。",
                "content": "# 第0章：Pythonとは何か・何ができるか\n\nこの章では、Pythonでできる業務効率化の例を紹介し、本コースで学ぶ内容の全体像を把握します。\n\n## Pythonでできる業務効率化の例\n\n### Excel作業の自動化\n\n- 複数のExcelファイルを一括処理\n- データの集計・分析を自動化\n- レポートの自動生成\n\n### ファイル整理\n\n- フォルダ内のファイルを自動分類\n- ファイル名の一括変更\n- 重複ファイルの検出\n\n### ログ処理\n\n- ログファイルからエラーを抽出\n- ログの集計・分析\n- 定期的なレポート生成\n\n## 本コースで作るもの\n\n1. **環境構築**: Pythonを自分のPCで実行できるようにする\n2. **ファイル操作**: ファイルを読み書きして処理する\n3. **CSV/Excel処理**: データを読み込んで加工する\n4. **自動処理スクリプト**: ワンクリックで処理を完了させる\n\n## 学習の進め方\n\n- スマホで「読む・考える」\n- PCで「実行」して結果を確認\n- 1章ごとに「使える成果物」を作る",
                "hands_on_steps": "## Hands-on Steps（操作手順）\n\nこの章は導入章のため、実際の操作はありません。\n\n次の章から、実際にPythonコードを書いて実行していきます。",
                "run_execute_data": None,
                "result_data": None,
                "why_it_works": "## Why it works（仕組み解説）\n\nPythonは、シンプルな構文で強力な機能を提供するプログラミング言語です。\n\n- **読みやすいコード**: 他の言語と比べてコードが読みやすく、初心者にも理解しやすい\n- **豊富なライブラリ**: ファイル操作、Excel処理、データ分析など、様々な作業を支援するライブラリが充実\n- **クロスプラットフォーム**: Windows、Mac、Linuxなど、様々なOSで動作\n\n業務効率化では、繰り返し作業を自動化することで、時間を節約し、ミスを減らすことができます。",
                "check_data": json.dumps({
                    "questions": [
                        {
                            "question": "Pythonでできる業務効率化の例として正しいのは？",
                            "options": [
                                "Excel作業の自動化、ファイル整理、ログ処理",
                                "Webサイトのデザイン作成だけ",
                            ],
                            "answer": "Excel作業の自動化、ファイル整理、ログ処理",
                        },
                        {
                            "question": "本コースの学習の進め方は？",
                            "options": [
                                "スマホで読む・考える、PCで実行",
                                "スマホだけで完結",
                            ],
                            "answer": "スマホで読む・考える、PCで実行",
                        }
                    ]
                }, ensure_ascii=False),
            },
            {
                "title": "第1章：Python環境構築（超重要）",
                "order_index": 1,
                "goal": "## Goal（この章でできるようになること）\n\n- Pythonを自分のPCにインストールできる\n- PATHとは何かを理解する（概念のみ）\n- VS CodeにPython拡張機能を導入できる\n- `print(\"Hello Python\")`を実行して結果を確認できる",
                "system_overview": "## System Overview（今どこを触っているか）\n\nPythonの開発環境をセットアップします。",
                "content": "# 第1章：Python環境構築（超重要）\n\nこの章では、Pythonを自分のPCで実行できるように環境を構築します。\n\n## Pythonのインストール（Windows）\n\n1. Python公式サイト（https://www.python.org/downloads/）から最新版をダウンロード\n2. インストーラーを実行\n3. **重要**: 「Add Python to PATH」にチェックを入れる\n4. 「Install Now」をクリック\n\n## PATHとは何か（概念のみ）\n\nPATHは、コマンドを実行するときに、どのフォルダを探すかを指定する環境変数です。\n\n- PythonをPATHに追加することで、どこからでも`python`コマンドを実行できるようになります\n- インストール時に「Add Python to PATH」にチェックを入れると、自動的に設定されます\n\n## VS CodeへのPython拡張機能導入\n\n1. VS Codeを開く\n2. 拡張機能アイコン（左サイドバー）をクリック\n3. 「Python」で検索\n4. Microsoft製の「Python」拡張機能をインストール\n\n## 実行体験\n\nVS Codeで新しいファイルを作成し、以下のコードを書いて実行します：\n\n```python\nprint(\"Hello Python\")\n```\n\n実行方法：\n- ファイルを保存（Ctrl+S）\n- 右上の「▶」ボタンをクリック、またはF5キーを押す\n- ターミナルに`Hello Python`と表示されれば成功です！",
                "hands_on_steps": "## Hands-on Steps（操作手順）\n\n1. Python公式サイトからPythonをダウンロード\n2. インストーラーを実行（「Add Python to PATH」にチェック）\n3. VS Codeを開く\n4. Python拡張機能をインストール\n5. 新しいファイル（`hello.py`）を作成\n6. `print(\"Hello Python\")`と入力\n7. ファイルを保存（Ctrl+S）\n8. 実行ボタン（▶）をクリック",
                "file_explorer_data": json.dumps([
                    {
                        "name": "hello.py",
                        "type": "file",
                        "path": "hello.py",
                        "content": "print(\"Hello Python\")"
                    }
                ], ensure_ascii=False),
                "run_execute_data": json.dumps({
                    "type": "python",
                    "code": "print(\"Hello Python\")",
                    "expected_output": "Hello Python"
                }, ensure_ascii=False),
                "result_data": json.dumps({
                    "type": "text",
                    "content": "ターミナルに「Hello Python」と表示されれば成功です。\n\nこれで、Pythonが正しくインストールされ、実行できることが確認できました。"
                }, ensure_ascii=False),
                "why_it_works": "## Why it works（仕組み解説）\n\n### print関数とは\n\n`print()`は、Pythonの組み込み関数で、引数として渡された値を画面（ターミナル）に出力します。\n\n- 文字列を出力する場合は、引用符（`\"`または`'`）で囲みます\n- 数値や変数も出力できます\n\n### 実行の流れ\n\n1. VS CodeがPythonファイル（`.py`）を認識\n2. Python拡張機能がPythonインタープリタを起動\n3. コードが上から順に実行される\n4. `print()`が実行され、結果がターミナルに表示される\n\n### エラーが出た場合\n\n- 「Pythonが見つかりません」→ PATHの設定を確認\n- 「拡張機能が見つかりません」→ VS CodeのPython拡張機能をインストール",
                "check_data": json.dumps({
                    "questions": [
                        {
                            "question": "Pythonをインストールする際、重要な設定は？",
                            "options": [
                                "「Add Python to PATH」にチェックを入れる",
                                "インストール場所を変更する",
                            ],
                            "answer": "「Add Python to PATH」にチェックを入れる",
                        },
                        {
                            "question": "`print(\"Hello Python\")`を実行すると何が表示される？",
                            "options": [
                                "Hello Python",
                                "何も表示されない",
                            ],
                            "answer": "Hello Python",
                        }
                    ]
                }, ensure_ascii=False),
            },
            {
                "title": "第2章：Pythonファイルを作って実行する",
                "order_index": 2,
                "goal": "## Goal（この章でできるようになること）\n\n- `.py`ファイルとは何かを理解する\n- ファイルを保存して実行できる\n- 保存と実行の違いを理解する",
                "system_overview": "## System Overview（今どこを触っているか）\n\nPythonファイルの作成と実行方法を学習します。",
                "content": "# 第2章：Pythonファイルを作って実行する\n\nこの章では、Pythonファイル（`.py`ファイル）を作成し、保存して実行する方法を学習します。\n\n## `.py`ファイルとは何か\n\n`.py`は、Pythonのソースコードを保存するファイル形式です。\n\n- テキストファイルとして保存されます\n- VS Codeなどのエディタで編集できます\n- 実行すると、コードが上から順に処理されます\n\n## 保存と実行の違い\n\n### 保存（Ctrl+S）\n\n- ファイルにコードを書き込むだけ\n- まだ実行されていない\n- コードを編集したら必ず保存する\n\n### 実行（▶ボタンまたはF5）\n\n- 保存されたコードを実際に実行する\n- 結果がターミナルに表示される\n- エラーがあれば、エラーメッセージが表示される\n\n## 実行体験\n\n1. 新しいファイル`my_first_script.py`を作成\n2. 以下のコードを入力：\n\n```python\nprint(\"こんにちは、Python！\")\nprint(\"今日は良い天気ですね\")\n```\n\n3. ファイルを保存（Ctrl+S）\n4. 実行ボタン（▶）をクリック\n5. ターミナルに2行のメッセージが表示されることを確認",
                "hands_on_steps": "## Hands-on Steps（操作手順）\n\n1. VS Codeで新しいファイルを作成（`my_first_script.py`）\n2. コードを入力：\n   ```python\n   print(\"こんにちは、Python！\")\n   print(\"今日は良い天気ですね\")\n   ```\n3. ファイルを保存（Ctrl+S）\n4. 実行ボタン（▶）をクリック\n5. ターミナルに結果が表示されることを確認",
                "file_explorer_data": json.dumps([
                    {
                        "name": "my_first_script.py",
                        "type": "file",
                        "path": "my_first_script.py",
                        "content": "print(\"こんにちは、Python！\")\nprint(\"今日は良い天気ですね\")"
                    }
                ], ensure_ascii=False),
                "run_execute_data": json.dumps({
                    "type": "python",
                    "code": "print(\"こんにちは、Python！\")\nprint(\"今日は良い天気ですね\")",
                    "expected_output": "こんにちは、Python！\n今日は良い天気ですね"
                }, ensure_ascii=False),
                "result_data": json.dumps({
                    "type": "text",
                    "content": "ターミナルに以下の2行が表示されれば成功です：\n\n```\nこんにちは、Python！\n今日は良い天気ですね\n```\n\nこれで、Pythonファイルを作成して実行できるようになりました！"
                }, ensure_ascii=False),
                "why_it_works": "## Why it works（仕組み解説）\n\n### ファイルの保存\n\n- コードを書いただけでは、まだファイルに保存されていません\n- Ctrl+Sで保存すると、ハードディスクに書き込まれます\n- 保存しないと、実行時に古いコードが実行される可能性があります\n\n### 実行の仕組み\n\n1. VS Codeが`.py`ファイルを認識\n2. Pythonインタープリタがファイルを読み込む\n3. コードを上から順に実行\n4. `print()`が実行されると、ターミナルに出力される\n5. すべての行が実行されると終了\n\n### 複数のprint文\n\n- 複数の`print()`を書くと、それぞれが順番に実行されます\n- 各行の後に改行が入ります",
                "check_data": json.dumps({
                    "questions": [
                        {
                            "question": "Pythonファイルの拡張子は？",
                            "options": [
                                ".py",
                                ".txt",
                            ],
                            "answer": ".py",
                        },
                        {
                            "question": "コードを編集した後、実行する前に必ず行うことは？",
                            "options": [
                                "ファイルを保存する（Ctrl+S）",
                                "VS Codeを再起動する",
                            ],
                            "answer": "ファイルを保存する（Ctrl+S）",
                        }
                    ]
                }, ensure_ascii=False),
            },
            {
                "title": "第3章：文字・数字の処理",
                "order_index": 3,
                "goal": "## Goal（この章でできるようになること）\n\n- 変数とは何かを理解する\n- `print()`で変数を出力できる\n- 文字列の連結ができる\n- 名前や日付を出力できる",
                "system_overview": "## System Overview（今どこを触っているか）\n\nPythonの基本的なデータ型（文字列、数値）と変数の使い方を学習します。",
                "content": "# 第3章：文字・数字の処理\n\nこの章では、変数を使って文字や数字を扱う方法を学習します。\n\n## 変数とは\n\n変数は、データを保存する「箱」のようなものです。\n\n```python\nname = \"山田太郎\"\nage = 25\n```\n\n- `name`という変数に`\"山田太郎\"`という文字列を保存\n- `age`という変数に`25`という数値を保存\n\n## printで変数を出力\n\n```python\nname = \"山田太郎\"\nprint(name)\n```\n\n実行結果：\n```\n山田太郎\n```\n\n## 文字列の連結\n\n文字列（文字の並び）を結合するには、`+`を使います。\n\n```python\nfirst_name = \"山田\"\nlast_name = \"太郎\"\nfull_name = first_name + last_name\nprint(full_name)\n```\n\n実行結果：\n```\n山田太郎\n```\n\n## 実行体験\n\n以下のコードを書いて実行してみましょう：\n\n```python\n# 変数を定義\nname = \"あなたの名前\"\ntoday = \"2024年1月1日\"\n\n# 出力\nprint(\"こんにちは、\" + name + \"さん\")\nprint(\"今日は\" + today + \"です\")\n```\n\n自分の名前と今日の日付に変更して実行してみてください！",
                "hands_on_steps": "## Hands-on Steps（操作手順）\n\n1. 新しいファイル`variables.py`を作成\n2. 以下のコードを入力：\n   ```python\n   name = \"あなたの名前\"\n   today = \"2024年1月1日\"\n   \n   print(\"こんにちは、\" + name + \"さん\")\n   print(\"今日は\" + today + \"です\")\n   ```\n3. 自分の名前と今日の日付に変更\n4. 保存して実行\n5. 結果を確認",
                "file_explorer_data": json.dumps([
                    {
                        "name": "variables.py",
                        "type": "file",
                        "path": "variables.py",
                        "content": "name = \"あなたの名前\"\ntoday = \"2024年1月1日\"\n\nprint(\"こんにちは、\" + name + \"さん\")\nprint(\"今日は\" + today + \"です\")"
                    }
                ], ensure_ascii=False),
                "run_execute_data": json.dumps({
                    "type": "python",
                    "code": "name = \"山田太郎\"\ntoday = \"2024年1月1日\"\n\nprint(\"こんにちは、\" + name + \"さん\")\nprint(\"今日は\" + today + \"です\")",
                    "expected_output": "こんにちは、山田太郎さん\n今日は2024年1月1日です"
                }, ensure_ascii=False),
                "result_data": json.dumps({
                    "type": "text",
                    "content": "ターミナルに以下のように表示されれば成功です：\n\n```\nこんにちは、山田太郎さん\n今日は2024年1月1日です\n```\n\n変数を使って、動的なメッセージを出力できるようになりました！"
                }, ensure_ascii=False),
                "why_it_works": "## Why it works（仕組み解説）\n\n### 変数の役割\n\n- 変数は、データを一時的に保存する場所です\n- 同じ値を何度も使う場合に便利です\n- 変数名は、内容が分かりやすい名前をつけましょう\n\n### 文字列と数値\n\n- **文字列**: 引用符（`\"`または`'`）で囲まれたもの\n  - 例：`\"こんにちは\"`、`'Python'`\n- **数値**: 引用符なしで書く\n  - 例：`25`、`3.14`\n\n### 文字列の連結\n\n- `+`演算子で文字列を結合できます\n- 数値と文字列を連結する場合は、数値を文字列に変換する必要があります\n\n### 変数の命名規則\n\n- 英数字とアンダースコア（`_`）が使えます\n- 数字で始めることはできません\n- 分かりやすい名前をつけましょう（例：`name`、`age`、`today`）",
                "check_data": json.dumps({
                    "questions": [
                        {
                            "question": "変数とは何か？",
                            "options": [
                                "データを保存する「箱」のようなもの",
                                "計算式のこと",
                            ],
                            "answer": "データを保存する「箱」のようなもの",
                        },
                        {
                            "question": "文字列を連結する演算子は？",
                            "options": [
                                "+",
                                "*",
                            ],
                            "answer": "+",
                        }
                    ]
                }, ensure_ascii=False),
            },
            {
                "title": "第4章：ファイル操作（業務効率化の核心）",
                "order_index": 4,
                "goal": "## Goal（この章でできるようになること）\n\n- ファイルを読み込むことができる\n- ファイルに書き込むことができる\n- フォルダ内のファイル一覧を取得できる\n- ファイル一覧をテキストに出力できる",
                "system_overview": "## System Overview（今どこを触っているか）\n\nPythonでファイルを操作する方法を学習します。",
                "content": "# 第4章：ファイル操作（業務効率化の核心）\n\nこの章では、Pythonでファイルを読み書きする方法を学習します。ファイル操作は、業務効率化の核心となる機能です。\n\n## ファイルを読む\n\n```python\nwith open(\"sample.txt\", \"r\", encoding=\"utf-8\") as f:\n    content = f.read()\n    print(content)\n```\n\n- `open()`: ファイルを開く\n- `\"r\"`: 読み込みモード\n- `encoding=\"utf-8\"`: 文字コードを指定（日本語対応）\n- `with`: ファイルを自動的に閉じる（推奨）\n\n## ファイルに書く\n\n```python\nwith open(\"output.txt\", \"w\", encoding=\"utf-8\") as f:\n    f.write(\"Hello, Python!\")\n```\n\n- `\"w\"`: 書き込みモード（既存ファイルは上書き）\n- `write()`: ファイルに書き込む\n\n## フォルダ内のファイル一覧を取得\n\n```python\nimport os\n\nfiles = os.listdir(\".\")\nfor file in files:\n    print(file)\n```\n\n- `os.listdir()`: 指定したフォルダ内のファイル・フォルダ一覧を取得\n- `\".\"`: 現在のフォルダ\n\n## 実行体験\n\n以下のコードで、現在のフォルダ内のファイル一覧を取得し、テキストファイルに出力してみましょう：\n\n```python\nimport os\n\n# 現在のフォルダ内のファイル一覧を取得\nfiles = os.listdir(\".\")\n\n# ファイル一覧をテキストファイルに出力\nwith open(\"file_list.txt\", \"w\", encoding=\"utf-8\") as f:\n    for file in files:\n        f.write(file + \"\\n\")\n\nprint(\"ファイル一覧を file_list.txt に出力しました\")\n```\n\n実行後、`file_list.txt`というファイルが作成され、中にファイル一覧が書き込まれます。",
                "hands_on_steps": "## Hands-on Steps（操作手順）\n\n1. 新しいファイル`file_operation.py`を作成\n2. 以下のコードを入力：\n   ```python\n   import os\n   \n   files = os.listdir(\".\")\n   \n   with open(\"file_list.txt\", \"w\", encoding=\"utf-8\") as f:\n       for file in files:\n           f.write(file + \"\\n\")\n   \n   print(\"ファイル一覧を file_list.txt に出力しました\")\n   ```\n3. 保存して実行\n4. `file_list.txt`が作成されることを確認\n5. `file_list.txt`を開いて内容を確認",
                "file_explorer_data": json.dumps([
                    {
                        "name": "file_operation.py",
                        "type": "file",
                        "path": "file_operation.py",
                        "content": "import os\n\nfiles = os.listdir(\".\")\n\nwith open(\"file_list.txt\", \"w\", encoding=\"utf-8\") as f:\n    for file in files:\n        f.write(file + \"\\n\")\n\nprint(\"ファイル一覧を file_list.txt に出力しました\")"
                    }
                ], ensure_ascii=False),
                "run_execute_data": json.dumps({
                    "type": "python",
                    "code": "import os\n\nfiles = os.listdir(\".\")\n\nwith open(\"file_list.txt\", \"w\", encoding=\"utf-8\") as f:\n    for file in files:\n        f.write(file + \"\\n\")\n\nprint(\"ファイル一覧を file_list.txt に出力しました\")",
                    "expected_output": "ファイル一覧を file_list.txt に出力しました"
                }, ensure_ascii=False),
                "result_data": json.dumps({
                    "type": "text",
                    "content": "実行後、以下のことが確認できます：\n\n1. ターミナルに「ファイル一覧を file_list.txt に出力しました」と表示される\n2. 同じフォルダに`file_list.txt`というファイルが作成される\n3. `file_list.txt`を開くと、フォルダ内のファイル一覧が書き込まれている\n\nこれで、ファイル操作の基本ができるようになりました！"
                }, ensure_ascii=False),
                "why_it_works": "## Why it works（仕組み解説）\n\n### ファイルの読み書き\n\n- `open()`関数でファイルを開きます\n- モードを指定します（`\"r\"`: 読み込み、`\"w\"`: 書き込み）\n- `with`文を使うと、ファイルを自動的に閉じてくれます（推奨）\n\n### エンコーディング\n\n- `encoding=\"utf-8\"`を指定することで、日本語も正しく扱えます\n- 指定しないと、日本語が文字化けする可能性があります\n\n### osモジュール\n\n- `os`は、オペレーティングシステム関連の機能を提供するモジュールです\n- `os.listdir()`で、フォルダ内のファイル一覧を取得できます\n- モジュールを使うには、最初に`import`する必要があります\n\n### ファイルパス\n\n- `\".\"`: 現在のフォルダ\n- `\"..\"`: 親フォルダ\n- `\"C:\\\\Users\\\\...\"`: 絶対パス（Windowsの場合）\n\n### 業務での活用例\n\n- ログファイルの解析\n- 複数ファイルの一括処理\n- レポートの自動生成",
                "check_data": json.dumps({
                    "questions": [
                        {
                            "question": "ファイルを読み込む際のモードは？",
                            "options": [
                                "\"r\"",
                                "\"w\"",
                            ],
                            "answer": "\"r\"",
                        },
                        {
                            "question": "フォルダ内のファイル一覧を取得する関数は？",
                            "options": [
                                "os.listdir()",
                                "os.read()",
                            ],
                            "answer": "os.listdir()",
                        }
                    ]
                }, ensure_ascii=False),
            },
            {
                "title": "第5章：Excel・CSV処理（超実務）",
                "order_index": 5,
                "goal": "## Goal（この章でできるようになること）\n\n- CSVとは何かを理解する\n- PythonでCSVを読み込める\n- CSVデータを加工できる\n- 実務で使えるスキルを身につける",
                "system_overview": "## System Overview（今どこを触っているか）\n\nPythonでCSVファイルを処理する方法を学習します。",
                "content": "# 第5章：Excel・CSV処理（超実務）\n\nこの章では、CSVファイルを読み込んで処理する方法を学習します。CSV処理は、実務で非常によく使われる機能です。\n\n## CSVとは何か\n\nCSV（Comma-Separated Values）は、カンマで区切られたデータ形式です。\n\n例：\n```csv\n名前,年齢,住所\n山田太郎,25,東京都\n佐藤花子,30,大阪府\n```\n\n- Excelで開くことができます\n- データの交換に便利です\n- テキストファイルなので、Pythonで簡単に処理できます\n\n## PythonでCSVを読む\n\n```python\nimport csv\n\nwith open(\"data.csv\", \"r\", encoding=\"utf-8\") as f:\n    reader = csv.reader(f)\n    for row in reader:\n        print(row)\n```\n\n- `csv`モジュールを使います\n- `csv.reader()`でCSVを読み込みます\n- 各行がリストとして取得されます\n\n## CSVデータの加工\n\n```python\nimport csv\n\nwith open(\"data.csv\", \"r\", encoding=\"utf-8\") as f:\n    reader = csv.reader(f)\n    header = next(reader)  # ヘッダー行をスキップ\n    for row in reader:\n        name = row[0]\n        age = row[1]\n        print(f\"{name}さんは{age}歳です\")\n```\n\n## 実行体験\n\n以下のサンプルCSVファイル（`sample.csv`）を作成して、読み込んでみましょう：\n\n`sample.csv`の内容：\n```csv\n名前,年齢,部署\n山田太郎,25,営業部\n佐藤花子,30,開発部\n```\n\n読み込みコード：\n```python\nimport csv\n\nwith open(\"sample.csv\", \"r\", encoding=\"utf-8\") as f:\n    reader = csv.reader(f)\n    header = next(reader)  # ヘッダー行をスキップ\n    print(\"従業員一覧：\")\n    for row in reader:\n        name = row[0]\n        age = row[1]\n        dept = row[2]\n        print(f\"{name}さん（{age}歳、{dept}）\")\n```",
                "hands_on_steps": "## Hands-on Steps（操作手順）\n\n1. `sample.csv`ファイルを作成（内容は上記参照）\n2. 新しいファイル`csv_reader.py`を作成\n3. 以下のコードを入力：\n   ```python\n   import csv\n   \n   with open(\"sample.csv\", \"r\", encoding=\"utf-8\") as f:\n       reader = csv.reader(f)\n       header = next(reader)\n       print(\"従業員一覧：\")\n       for row in reader:\n           name = row[0]\n           age = row[1]\n           dept = row[2]\n           print(f\"{name}さん（{age}歳、{dept}）\")\n   ```\n4. 保存して実行\n5. 結果を確認",
                "file_explorer_data": json.dumps([
                    {
                        "name": "sample.csv",
                        "type": "file",
                        "path": "sample.csv",
                        "content": "名前,年齢,部署\n山田太郎,25,営業部\n佐藤花子,30,開発部"
                    },
                    {
                        "name": "csv_reader.py",
                        "type": "file",
                        "path": "csv_reader.py",
                        "content": "import csv\n\nwith open(\"sample.csv\", \"r\", encoding=\"utf-8\") as f:\n    reader = csv.reader(f)\n    header = next(reader)\n    print(\"従業員一覧：\")\n    for row in reader:\n        name = row[0]\n        age = row[1]\n        dept = row[2]\n        print(f\"{name}さん（{age}歳、{dept}）\")"
                    }
                ], ensure_ascii=False),
                "run_execute_data": json.dumps({
                    "type": "python",
                    "code": "import csv\n\nwith open(\"sample.csv\", \"r\", encoding=\"utf-8\") as f:\n    reader = csv.reader(f)\n    header = next(reader)\n    print(\"従業員一覧：\")\n    for row in reader:\n        name = row[0]\n        age = row[1]\n        dept = row[2]\n        print(f\"{name}さん（{age}歳、{dept}）\")",
                    "expected_output": "従業員一覧：\n山田太郎さん（25歳、営業部）\n佐藤花子さん（30歳、開発部）"
                }, ensure_ascii=False),
                "result_data": json.dumps({
                    "type": "text",
                    "content": "ターミナルに以下のように表示されれば成功です：\n\n```\n従業員一覧：\n山田太郎さん（25歳、営業部）\n佐藤花子さん（30歳、開発部）\n```\n\nこれで、CSVファイルを読み込んで処理できるようになりました！"
                }, ensure_ascii=False),
                "why_it_works": "## Why it works（仕組み解説）\n\n### CSVの構造\n\n- 1行目は通常、ヘッダー（列名）です\n- 2行目以降がデータ行です\n- 各列はカンマ（`,`）で区切られています\n\n### csvモジュール\n\n- Pythonの標準ライブラリに含まれています\n- `import csv`で使えます\n- `csv.reader()`でCSVを読み込みます\n\n### データの取得\n\n- `reader`は、各行をリストとして返します\n- `row[0]`は1列目、`row[1]`は2列目、というようにアクセスできます\n- `next(reader)`で、最初の行（ヘッダー）をスキップできます\n\n### 実務での活用例\n\n- 売上データの集計\n- 顧客リストの処理\n- ログデータの分析\n- Excelファイルの代わりにCSVを使うことで、自動処理が簡単になります",
                "check_data": json.dumps({
                    "questions": [
                        {
                            "question": "CSVファイルを読み込むために使うモジュールは？",
                            "options": [
                                "csv",
                                "file",
                            ],
                            "answer": "csv",
                        },
                        {
                            "question": "CSVの各行は何として取得される？",
                            "options": [
                                "リスト",
                                "文字列",
                            ],
                            "answer": "リスト",
                        }
                    ]
                }, ensure_ascii=False),
            },
            {
                "title": "第6章：自動処理スクリプトを作る",
                "order_index": 6,
                "goal": "## Goal（この章でできるようになること）\n\n- 複数の処理をまとめて実行できる\n- ワンクリックで処理を完了させられる\n- 自動処理スクリプトのイメージを理解する",
                "system_overview": "## System Overview（今どこを触っているか）\n\nこれまで学んだ機能を組み合わせて、自動処理スクリプトを作成します。",
                "content": "# 第6章：自動処理スクリプトを作る\n\nこの章では、これまで学んだ機能を組み合わせて、実用的な自動処理スクリプトを作成します。\n\n## 処理をまとめる\n\n複数の処理を1つのスクリプトにまとめることで、ワンクリックで実行できます。\n\n例：ファイル一覧を取得して、CSVに出力する\n\n```python\nimport os\nimport csv\nfrom datetime import datetime\n\n# 現在のフォルダ内のファイル一覧を取得\nfiles = os.listdir(\".\")\n\n# CSVファイルに出力\nwith open(\"file_list.csv\", \"w\", encoding=\"utf-8\", newline=\"\") as f:\n    writer = csv.writer(f)\n    writer.writerow([\"ファイル名\", \"取得日時\"])  # ヘッダー\n    \n    for file in files:\n        now = datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")\n        writer.writerow([file, now])\n\nprint(f\"{len(files)}個のファイル情報を file_list.csv に出力しました\")\n```\n\n## 実行の自動化イメージ\n\n- スクリプトを1回実行するだけで、複数の処理が自動的に実行されます\n- 手動で行うと時間がかかる作業も、一瞬で完了します\n- ミスも減らせます\n\n## 実行体験\n\n上記のコードを`auto_process.py`として保存し、実行してみましょう。\n\n実行後、`file_list.csv`が作成され、ファイル一覧と取得日時が記録されます。",
                "hands_on_steps": "## Hands-on Steps（操作手順）\n\n1. 新しいファイル`auto_process.py`を作成\n2. 以下のコードを入力：\n   ```python\n   import os\n   import csv\n   from datetime import datetime\n   \n   files = os.listdir(\".\")\n   \n   with open(\"file_list.csv\", \"w\", encoding=\"utf-8\", newline=\"\") as f:\n       writer = csv.writer(f)\n       writer.writerow([\"ファイル名\", \"取得日時\"])\n       \n       for file in files:\n           now = datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")\n           writer.writerow([file, now])\n   \n   print(f\"{len(files)}個のファイル情報を file_list.csv に出力しました\")\n   ```\n3. 保存して実行\n4. `file_list.csv`が作成されることを確認\n5. Excelで`file_list.csv`を開いて内容を確認",
                "file_explorer_data": json.dumps([
                    {
                        "name": "auto_process.py",
                        "type": "file",
                        "path": "auto_process.py",
                        "content": "import os\nimport csv\nfrom datetime import datetime\n\nfiles = os.listdir(\".\")\n\nwith open(\"file_list.csv\", \"w\", encoding=\"utf-8\", newline=\"\") as f:\n    writer = csv.writer(f)\n    writer.writerow([\"ファイル名\", \"取得日時\"])\n    \n    for file in files:\n        now = datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")\n        writer.writerow([file, now])\n\nprint(f\"{len(files)}個のファイル情報を file_list.csv に出力しました\")"
                    }
                ], ensure_ascii=False),
                "run_execute_data": json.dumps({
                    "type": "python",
                    "code": "import os\nimport csv\nfrom datetime import datetime\n\nfiles = os.listdir(\".\")\n\nwith open(\"file_list.csv\", \"w\", encoding=\"utf-8\", newline=\"\") as f:\n    writer = csv.writer(f)\n    writer.writerow([\"ファイル名\", \"取得日時\"])\n    \n    for file in files:\n        now = datetime.now().strftime(\"%Y-%m-%d %H:%M:%S\")\n        writer.writerow([file, now])\n\nprint(f\"{len(files)}個のファイル情報を file_list.csv に出力しました\")",
                    "expected_output": "（ファイル数）個のファイル情報を file_list.csv に出力しました"
                }, ensure_ascii=False),
                "result_data": json.dumps({
                    "type": "text",
                    "content": "実行後、以下のことが確認できます：\n\n1. ターミナルに「（ファイル数）個のファイル情報を file_list.csv に出力しました」と表示される\n2. 同じフォルダに`file_list.csv`が作成される\n3. Excelで`file_list.csv`を開くと、ファイル名と取得日時が記録されている\n\nこれで、自動処理スクリプトを作成できるようになりました！"
                }, ensure_ascii=False),
                "why_it_works": "## Why it works（仕組み解説）\n\n### モジュールの組み合わせ\n\n- `os`: ファイル操作\n- `csv`: CSVファイルの読み書き\n- `datetime`: 日時の取得・フォーマット\n\n複数のモジュールを組み合わせることで、より実用的なスクリプトを作成できます。\n\n### 自動処理のメリット\n\n1. **時間の節約**: 手動で行うと時間がかかる作業も、一瞬で完了\n2. **ミスの削減**: 人間がミスをしやすい作業も、正確に実行\n3. **繰り返し実行**: 同じ処理を何度でも実行可能\n4. **拡張性**: 新しい処理を追加しやすい\n\n### 実務での活用例\n\n- 日次レポートの自動生成\n- ログファイルの定期解析\n- データの一括変換\n- ファイルの自動整理\n\n### 次のステップ\n\n- タスクスケジューラで定期実行\n- エラーハンドリングの追加\n- GUI化（簡易）",
                "check_data": json.dumps({
                    "questions": [
                        {
                            "question": "自動処理スクリプトのメリットは？",
                            "options": [
                                "時間の節約、ミスの削減、繰り返し実行",
                                "コードが長くなるだけ",
                            ],
                            "answer": "時間の節約、ミスの削減、繰り返し実行",
                        },
                        {
                            "question": "複数のモジュールを組み合わせることで何ができる？",
                            "options": [
                                "より実用的なスクリプトを作成できる",
                                "エラーが増えるだけ",
                            ],
                            "answer": "より実用的なスクリプトを作成できる",
                        }
                    ]
                }, ensure_ascii=False),
            },
            {
                "title": "第7章：エラーとデバッグ",
                "order_index": 7,
                "goal": "## Goal（この章でできるようになること）\n\n- よくあるエラーを理解する\n- エラーメッセージの読み方が分かる\n- エラーを修正できる\n- エラーが出ても慌てない",
                "system_overview": "## System Overview（今どこを触っているか）\n\nエラーの種類と対処法を学習します。",
                "content": "# 第7章：エラーとデバッグ\n\nこの章では、よくあるエラーとその対処法を学習します。エラーは怖いものではありません。エラーメッセージを読むことで、問題を解決できます。\n\n## よくあるエラー\n\n### 1. 構文エラー（SyntaxError）\n\n```python\nprint(\"Hello\"  # 閉じ括弧がない\n```\n\n**エラーメッセージ**: `SyntaxError: unexpected EOF while parsing`\n\n**原因**: 括弧や引用符が閉じられていない\n\n**対処法**: エラーが指摘している行を確認し、括弧や引用符を閉じる\n\n### 2. 名前エラー（NameError）\n\n```python\nprint(nam)  # namという変数は定義されていない\n```\n\n**エラーメッセージ**: `NameError: name 'nam' is not defined`\n\n**原因**: 変数名のタイプミス、または変数が定義されていない\n\n**対処法**: 変数名を確認し、正しい名前を使う\n\n### 3. ファイルが見つからない（FileNotFoundError）\n\n```python\nwith open(\"nonexistent.txt\", \"r\") as f:\n    content = f.read()\n```\n\n**エラーメッセージ**: `FileNotFoundError: [Errno 2] No such file or directory: 'nonexistent.txt'`\n\n**原因**: 指定したファイルが存在しない\n\n**対処法**: ファイルパスを確認し、ファイルが存在することを確認\n\n## エラーメッセージの読み方\n\nエラーメッセージには、以下の情報が含まれています：\n\n1. **エラーの種類**: `SyntaxError`、`NameError`など\n2. **エラーの内容**: 何が問題なのか\n3. **エラーが発生した行**: ファイル名と行番号\n\n例：\n```\nFile \"test.py\", line 3, in <module>\n    print(nam)\nNameError: name 'nam' is not defined\n```\n\n- `test.py`の3行目でエラーが発生\n- `NameError`: 名前が見つからないエラー\n- `name 'nam' is not defined`: `nam`という名前が定義されていない\n\n## 実行体験\n\n意図的にエラーを出して、エラーメッセージを確認してみましょう：\n\n```python\n# エラー1: 構文エラー\nprint(\"Hello\"  # 閉じ括弧がない\n\n# エラー2: 名前エラー\nprint(undefined_variable)\n\n# エラー3: ファイルが見つからない\nwith open(\"nonexistent.txt\", \"r\") as f:\n    content = f.read()\n```\n\nエラーメッセージを読んで、何が問題なのかを理解しましょう。",
                "hands_on_steps": "## Hands-on Steps（操作手順）\n\n1. 新しいファイル`error_test.py`を作成\n2. 意図的にエラーを含むコードを書く：\n   ```python\n   # エラー1: 構文エラー\n   print(\"Hello\"  # 閉じ括弧がない\n   ```\n3. 実行してエラーメッセージを確認\n4. エラーを修正（閉じ括弧を追加）\n5. 再度実行して、エラーが解消されたことを確認",
                "file_explorer_data": json.dumps([
                    {
                        "name": "error_test.py",
                        "type": "file",
                        "path": "error_test.py",
                        "content": "# エラー1: 構文エラー（修正前）\n# print(\"Hello\"  # 閉じ括弧がない\n\n# エラー1: 構文エラー（修正後）\nprint(\"Hello\")  # 閉じ括弧を追加"
                    }
                ], ensure_ascii=False),
                "run_execute_data": json.dumps({
                    "type": "python",
                    "code": "# 正しいコード\nprint(\"Hello\")\nprint(\"エラーがなくなりました！\")",
                    "expected_output": "Hello\nエラーがなくなりました！"
                }, ensure_ascii=False),
                "result_data": json.dumps({
                    "type": "text",
                    "content": "エラーメッセージを読むことで、問題を特定し、修正できるようになりました。\n\nエラーは怖いものではありません。エラーメッセージは、問題を解決するためのヒントです。"
                }, ensure_ascii=False),
                "why_it_works": "## Why it works（仕組み解説）\n\n### エラーの種類\n\n1. **構文エラー（SyntaxError）**: コードの書き方が間違っている\n2. **実行時エラー（Runtime Error）**: 実行時に問題が発生（例：ファイルが見つからない）\n3. **論理エラー**: コードは実行されるが、期待した結果にならない\n\n### デバッグのコツ\n\n1. **エラーメッセージを読む**: エラーの種類と内容を確認\n2. **エラーが発生した行を確認**: ファイル名と行番号を確認\n3. **よくあるエラーを覚える**: 同じエラーに何度も遭遇する\n4. **小さくテストする**: 問題を切り分けるために、コードを小さく分けてテスト\n\n### エラーハンドリング\n\n将来的には、`try-except`文を使ってエラーを処理することもできます：\n\n```python\ntry:\n    with open(\"file.txt\", \"r\") as f:\n        content = f.read()\nexcept FileNotFoundError:\n    print(\"ファイルが見つかりませんでした\")\n```\n\n### 実務での活用\n\n- エラーログを確認して問題を特定\n- エラーメッセージから原因を推測\n- 段階的にデバッグして問題を切り分け",
                "check_data": json.dumps({
                    "questions": [
                        {
                            "question": "エラーメッセージに含まれる情報は？",
                            "options": [
                                "エラーの種類、エラーの内容、エラーが発生した行",
                                "解決方法だけ",
                            ],
                            "answer": "エラーの種類、エラーの内容、エラーが発生した行",
                        },
                        {
                            "question": "エラーは怖いものか？",
                            "options": [
                                "いいえ、エラーメッセージは問題を解決するためのヒント",
                                "はい、エラーが出たら諦める",
                            ],
                            "answer": "いいえ、エラーメッセージは問題を解決するためのヒント",
                        }
                    ]
                }, ensure_ascii=False),
            },
        ]
        
        # 既存の章を確認して、不足している章を追加、または既存の章を更新
        existing_python_chapters = db.query(Chapter).filter(Chapter.course_id == 3).all()
        existing_python_titles = {ch.title for ch in existing_python_chapters}
        existing_python_chapters_dict = {ch.title: ch for ch in existing_python_chapters}
        
        new_python_chapters_count = 0
        updated_python_chapters_count = 0
        for chapter_data in python_chapters_data:
            if chapter_data["title"] not in existing_python_titles:
                chapter = Chapter(
                    course_id=3,
                    title=chapter_data["title"],
                    order_index=chapter_data["order_index"],
                    content=chapter_data["content"],
                    goal=chapter_data.get("goal"),
                    system_overview=chapter_data.get("system_overview"),
                    file_explorer_data=chapter_data.get("file_explorer_data"),
                    hands_on_steps=chapter_data.get("hands_on_steps"),
                    run_execute_data=chapter_data.get("run_execute_data"),
                    result_data=chapter_data.get("result_data"),
                    why_it_works=chapter_data.get("why_it_works"),
                    check_data=chapter_data.get("check_data"),
                    is_active=True,
                )
                db.add(chapter)
                new_python_chapters_count += 1
            else:
                # 既存の章を更新（不足しているフィールドを追加）
                existing_chapter = existing_python_chapters_dict.get(chapter_data["title"])
                if existing_chapter:
                    updated = False
                    if not existing_chapter.goal and chapter_data.get("goal"):
                        existing_chapter.goal = chapter_data.get("goal")
                        updated = True
                    if not existing_chapter.system_overview and chapter_data.get("system_overview"):
                        existing_chapter.system_overview = chapter_data.get("system_overview")
                        updated = True
                    if not existing_chapter.file_explorer_data and chapter_data.get("file_explorer_data"):
                        existing_chapter.file_explorer_data = chapter_data.get("file_explorer_data")
                        updated = True
                    if not existing_chapter.hands_on_steps and chapter_data.get("hands_on_steps"):
                        existing_chapter.hands_on_steps = chapter_data.get("hands_on_steps")
                        updated = True
                    if not existing_chapter.run_execute_data and chapter_data.get("run_execute_data"):
                        existing_chapter.run_execute_data = chapter_data.get("run_execute_data")
                        updated = True
                    if not existing_chapter.result_data and chapter_data.get("result_data"):
                        existing_chapter.result_data = chapter_data.get("result_data")
                        updated = True
                    if not existing_chapter.why_it_works and chapter_data.get("why_it_works"):
                        existing_chapter.why_it_works = chapter_data.get("why_it_works")
                        updated = True
                    if not existing_chapter.check_data and chapter_data.get("check_data"):
                        existing_chapter.check_data = chapter_data.get("check_data")
                        updated = True
                    if updated:
                        updated_python_chapters_count += 1
        
        if new_python_chapters_count > 0 or updated_python_chapters_count > 0:
            db.commit()
            if new_python_chapters_count > 0:
                print(
                    f"[OK] 業務効率化Python演習の章を{new_python_chapters_count}個追加しました（合計: {len(existing_python_chapters) + new_python_chapters_count}個）"
                )
            if updated_python_chapters_count > 0:
                print(f"[OK] {updated_python_chapters_count}件の章データを更新しました")
        else:
            print(f"[OK] 業務効率化Python演習の章は既にすべて存在します（{len(existing_python_chapters)}個）")
        
        print("\n[OK] 初期データの作成が完了しました")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_initial_data()

