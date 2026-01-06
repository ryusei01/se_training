"""
TypeScriptコードの実行エンジン

TypeScriptコードをtsxを使用して実行する。
ユーザーのコードをsolution.tsとして保存し、テストコードと組み合わせて実行する。
Python形式のテストコードをTypeScript形式に変換して実行する。
"""
import tempfile
import subprocess
import time
import os
import json
import re
from pathlib import Path
from typing import Dict, Any, List
from app.models.problem import Problem
from app.runners.base_runner import Runner


class TypeScriptRunner(Runner):
    """
    TypeScriptコードを実行するRunner
    
    ユーザーのコードを一時ファイルに保存し、問題のテストコード（Python形式）
    をTypeScript形式に変換して実行する。テスト結果に基づいて成功/失敗を判定する。
    """
    
    def execute(
        self,
        problem: Problem,
        code: str,
        mode: str = "coding_test"
    ) -> Dict[str, Any]:
        """
        TypeScriptコードを実行してテスト結果を返す
        
        Args:
            problem: 問題情報
            code: 実行するTypeScriptコード
            mode: 実行モード（現在は"coding_test"のみ対応）
        
        Returns:
            Dict[str, Any]: 実行結果
                - "result": 実行結果（"success" | "failure" | "error" | "timeout"）
                - "execution_time_sec": 実行時間（秒）
                - "error_message": エラーメッセージ（エラー時）
                - "test_output": テスト出力
        """
        start_time = time.time()
        
        # 一時ディレクトリを作成
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp_path = Path(tmpdir)
            
            # package.jsonを作成
            package_json = {
                "name": "test-runner",
                "version": "1.0.0",
                "type": "module"
            }
            (tmp_path / "package.json").write_text(
                json.dumps(package_json, indent=2),
                encoding="utf-8"
            )
            
            # ユーザーコードをファイルに書き込み
            solution_file = tmp_path / "solution.ts"
            solution_file.write_text(code, encoding="utf-8")
            
            # テストファイルを作成
            test_file = tmp_path / "test.ts"
            try:
                test_content = self._create_test_file(problem, code)
                test_file.write_text(test_content, encoding="utf-8")
            except Exception as e:
                return {
                    "result": "error",
                    "execution_time_sec": 0,
                    "error_message": f"テストコード生成エラー: {str(e)}",
                    "test_output": None,
                }
            
            # TypeScriptを実行
            try:
                result = self._run_typescript(tmp_path, problem.time_limit_sec)
                execution_time = time.time() - start_time
                
                return {
                    "result": result["status"],
                    "execution_time_sec": execution_time,
                    "error_message": result.get("error_message"),
                    "test_output": result.get("test_output"),
                }
            except Exception as e:
                execution_time = time.time() - start_time
                return {
                    "result": "error",
                    "execution_time_sec": execution_time,
                    "error_message": f"実行エラー: {str(e)}",
                    "test_output": None,
                }
    
    def _create_test_file(self, problem: Problem, user_code: str) -> str:
        """
        テストファイルの内容を生成（TypeScript形式）
        
        Python形式のテストコードをTypeScript形式に変換し、
        ユーザーのコードをインポートしてテストを実行可能な形式にする。
        """
        # function_signatureから関数名を抽出
        sig = problem.function_signature
        # TypeScript形式: "function solve(...)" または "const solve = (...)" または "export function solve(...)"
        match = re.search(r'(?:function|const|export\s+function)\s+(\w+)', sig)
        if not match:
            # フォールバック: 最初の単語を関数名として使用
            match = re.search(r'(\w+)\s*[:=]', sig)
        if not match:
            # さらにフォールバック: Python形式のシグネチャかもしれない
            match = re.search(r'def\s+(\w+)', sig)
            
        if not match:
            raise ValueError(f"関数シグネチャから関数名を抽出できません: {sig}")
            
        func_name = match.group(1)
        
        # テスト関数の実行コードを生成
        test_functions_code = self._extract_test_functions(problem.test_code, func_name)
        
        test_content = f"""
import {{ {func_name} }} from './solution.js';

// ヘルパー関数: ディープイコールによるアサーション
function assertDeepEquals(actual: any, expected: any) {{
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {{
        throw new Error(`Assertion failed: expected ${{expectedStr}}, got ${{actualStr}}`);
    }}
}}

// テスト実行
let passed = 0;
let failed = 0;
const errors: string[] = [];

const runTest = (name: string, fn: () => void) => {{
    try {{
        fn();
        passed++;
        console.log(`✓ ${{name}}`);
    }} catch (e: any) {{
        failed++;
        const errorMsg = e?.message || String(e);
        errors.push(`✗ ${{name}}: ${{errorMsg}}`);
        console.error(`✗ ${{name}}: ${{errorMsg}}`);
    }}
}};

// テスト関数を実行
const testFunctions: Array<{{name: string, fn: () => void}}> = [];

{test_functions_code}

for (const test of testFunctions) {{
    runTest(test.name, test.fn);
}}

if (failed === 0) {{
    console.log(`\\nSUCCESS: All ${{passed}} test(s) passed`);
    process.exit(0);
}} else {{
    console.log(`\\nFAILED: ${{failed}} test(s) failed, ${{passed}} passed`);
    errors.forEach(e => console.error(e));
    process.exit(1);
}}
"""
        return test_content
    
    def _extract_test_functions(self, test_code: str, func_name: str) -> str:
        """
        テスト関数を抽出して実行コードを生成
        """
        lines = test_code.split('\n')
        test_functions = []
        current_test = []
        current_test_name = None
        in_test = False
        indent_level = 0
        
        for line in lines:
            # 行末のコメントを削除せず、そのまま処理するが、空白処理には気をつける
            stripped = line.strip()
            
            # テスト関数の開始を検出
            if ('def test_' in line or 'function test_' in line) and not in_test:
                match = re.search(r'(?:def|function)\s+test_(\w+)', line)
                if match:
                    current_test_name = match.group(1)
                    current_test = []
                    in_test = True
                    # インデントレベルを記録（Pythonの場合）
                    indent_level = len(line) - len(line.lstrip())
                    continue

            # テスト関数内の処理
            if in_test:
                # 空行はスキップしない（コードの一部かもしれない）
                if not stripped:
                    continue
                
                current_indent = len(line) - len(line.lstrip())
                
                # インデントが戻ったらテスト関数の終了（Pythonの場合）
                # TypeScriptの場合は } で終わることもあるが、ここではPython形式のテストコードを想定
                if current_indent <= indent_level and not line.lstrip().startswith(('}', ')', '#')):
                    # 次の関数定義などが始まった場合
                    if current_test_name:
                        self._add_test_function(test_functions, current_test_name, current_test, func_name)
                    current_test_name = None
                    in_test = False
                    current_test = []
                    
                    # この行が次のテスト関数の開始かもしれないので再処理したいが、
                    # ループ構造上難しいので、簡易的にここでチェック
                    if 'def test_' in line or 'function test_' in line:
                         match = re.search(r'(?:def|function)\s+test_(\w+)', line)
                         if match:
                             current_test_name = match.group(1)
                             current_test = []
                             in_test = True
                             indent_level = len(line) - len(line.lstrip())
                    continue
                
                current_test.append(line)
        
        # 最後のテスト
        if current_test_name and current_test:
            self._add_test_function(test_functions, current_test_name, current_test, func_name)
        
        # テスト関数が見つからなかった場合（assert文が直書きされている場合など）
        if not test_functions and any('assert' in line for line in lines):
             # 全行を変換して一つのテストとして実行
             converted_code = self._convert_python_to_ts('\n'.join(lines), func_name)
             test_functions.append(f'testFunctions.push({{name: "global_test", fn: () => {{ {converted_code} }} }});')

        return '\n'.join(test_functions) if test_functions else '// No tests found'

    def _add_test_function(self, test_functions: List[str], name: str, body_lines: List[str], func_name: str):
        """テスト関数を変換してリストに追加"""
        # インデントを削除
        if body_lines:
            base_indent = len(body_lines[0]) - len(body_lines[0].lstrip())
            body_lines = [line[base_indent:] if len(line) > base_indent else line.lstrip() for line in body_lines]
        
        test_body = '\n'.join(body_lines)
        test_body = self._convert_python_to_ts(test_body, func_name)
        test_functions.append(f'testFunctions.push({{name: "{name}", fn: () => {{ {test_body} }} }});')

    def _convert_python_to_ts(self, code: str, func_name: str) -> str:
        """
        PythonコードをTypeScriptコードに変換
        """
        # solveを実際の関数名に置換
        code = code.replace('solve', func_name)
        
        # Pythonのリスト記法をTypeScriptに変換（簡易的）
        # True/False/None
        code = re.sub(r'\bTrue\b', 'true', code)
        code = re.sub(r'\bFalse\b', 'false', code)
        code = re.sub(r'\bNone\b', 'null', code)

        # assert A == B -> assertDeepEquals(A, B)
        # 貪欲マッチを避けるために .*? を使用
        code = re.sub(r'assert\s+(.+?)\s*==\s*(.+?)(\s*#.*)?$', 
                      r'assertDeepEquals(\1, \2);', 
                      code, flags=re.MULTILINE)
        
        # assert A != B -> if (JSON.stringify(A) === JSON.stringify(B)) throw ...
        code = re.sub(r'assert\s+(.+?)\s*!=\s*(.+?)(\s*#.*)?$', 
                      r'if (JSON.stringify(\1) === JSON.stringify(\2)) throw new Error("Assertion failed: expected different values");', 
                      code, flags=re.MULTILINE)
        
        # その他の assert -> if (!A) throw ...
        code = re.sub(r'assert\s+(.+?)(\s*#.*)?$', 
                      r'if (!(\1)) throw new Error("Assertion failed");', 
                      code, flags=re.MULTILINE)
        
        # コメント行の処理（Pythonの#を//に）
        # 文字列リテラル内の#を置換しないようにするのは難しいが、簡易的に行頭や空白後の#を対象にする
        code = re.sub(r'(\s+)#', r'\1//', code)
        if code.strip().startswith('#'):
             code = code.replace('#', '//', 1)

        return code
    
    def _run_typescript(self, test_dir: Path, time_limit_sec: float) -> Dict[str, Any]:
        """
        TypeScriptコードを実行してテスト結果を返す
        """
        # tsxを使用してTypeScriptを実行
        test_file = test_dir / "test.ts"
        cmd = ["npx", "--yes", "tsx", str(test_file)]
        
        # 環境変数を設定
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        # Node.js関連のパスを通す（必要に応じて）
        
        try:
            # タイムアウト付きで実行
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=time_limit_sec + 1.0,
                cwd=str(test_dir),
                env=env,
            )
            
            if process.returncode == 0:
                return {
                    "status": "success",
                    "test_output": process.stdout,
                }
            else:
                return {
                    "status": "failure",
                    "error_message": "テストが失敗しました",
                    "test_output": process.stdout + "\n" + process.stderr,
                }
        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "error_message": f"実行時間が制限（{time_limit_sec}秒）を超えました",
                "test_output": None,
            }
        except FileNotFoundError:
            return {
                "status": "error",
                "error_message": "tsxが見つかりません。Node.jsとtsxがインストールされていることを確認してください。",
                "test_output": None,
            }
        except Exception as e:
            return {
                "status": "error",
                "error_message": f"実行エラー: {str(e)}",
                "test_output": None,
            }
