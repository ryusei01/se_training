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
from typing import Dict, Any
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
            test_content = self._create_test_file(problem, code)
            test_file.write_text(test_content, encoding="utf-8")
            
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
        
        Args:
            problem: 問題情報
            user_code: ユーザーのコード（使用されないが、シグネチャの一貫性のため残している）
        
        Returns:
            str: テストファイルの内容（TypeScriptコード）
        """
        # function_signatureから関数名を抽出
        sig = problem.function_signature
        # TypeScript形式: "function solve(...)" または "const solve = (...)" または "export function solve(...)"
        match = re.search(r'(?:function|const|export\s+function)\s+(\w+)', sig)
        if not match:
            # フォールバック: 最初の単語を関数名として使用
            match = re.search(r'(\w+)\s*[:=]', sig)
        if not match:
            raise ValueError(f"関数シグネチャから関数名を抽出できません: {sig}")
        func_name = match.group(1)
        
        # テストコードをTypeScript形式に変換
        # Python形式のテストコードをTypeScript形式に変換
        test_code_ts = problem.test_code
        
        # Pythonのassert文をTypeScript形式に変換
        test_code_ts = re.sub(r'def\s+test_(\w+)\(\):', r'function test_\1(): void {', test_code_ts)
        test_code_ts = re.sub(r'\bassert\s+', '', test_code_ts)
        test_code_ts = re.sub(r'\b==\b', '===', test_code_ts)
        test_code_ts = re.sub(r'\b!=\b', '!==', test_code_ts)
        
        # solve関数を実際の関数名に置換
        test_code_ts = test_code_ts.replace('solve', func_name)
        
        # テスト関数の実行コードを生成
        test_functions_code = self._extract_test_functions(problem.test_code, func_name)
        
        test_content = f"""
import {{ {func_name} as solve }} from './solution.js';

// テストコード
{test_code_ts}

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
        
        Python形式のテストコードからテスト関数を抽出し、
        TypeScript形式のテスト実行コードを生成する。
        
        Args:
            test_code: テストコード（Python形式）
            func_name: ユーザー関数の名前
        
        Returns:
            str: テスト実行コード（TypeScript形式）
        """
        lines = test_code.split('\n')
        test_functions = []
        current_test = None
        current_test_name = None
        in_test = False
        indent_level = 0
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            # テスト関数の開始を検出
            if 'def test_' in stripped or 'function test_' in stripped:
                if current_test_name:
                    # 前のテストを保存
                    test_body = '\n'.join(current_test)
                    test_body = test_body.replace('solve', func_name)
                    test_body = test_body.replace('assert ', 'if (!(') + ') throw new Error("Assertion failed");'
                    test_functions.append(f'  testFunctions.push({{name: "{current_test_name}", fn: () => {{ {test_body} }} }});')
                
                # 新しいテストの開始
                match = re.search(r'(?:def|function)\s+test_(\w+)', stripped)
                if match:
                    current_test_name = match.group(1)
                    current_test = []
                    in_test = True
                    indent_level = len(line) - len(line.lstrip())
            
            elif in_test:
                # テスト本体の行
                current_indent = len(line) - len(line.lstrip())
                if stripped and current_indent <= indent_level and not line.startswith(' ') and not line.startswith('\t'):
                    # テスト関数の終了
                    if current_test_name:
                        test_body = '\n'.join(current_test)
                        test_body = self._convert_python_to_ts(test_body, func_name)
                        test_functions.append(f'  testFunctions.push({{name: "{current_test_name}", fn: () => {{ {test_body} }} }});')
                    current_test_name = None
                    in_test = False
                    current_test = []
                else:
                    current_test.append(line)
        
        # 最後のテスト
        if current_test_name and current_test:
            test_body = '\n'.join(current_test)
            test_body = self._convert_python_to_ts(test_body, func_name)
            test_functions.append(f'  testFunctions.push({{name: "{current_test_name}", fn: () => {{ {test_body} }} }});')
        
        if not test_functions:
            # フォールバック: assert文を直接実行
            for line in lines:
                if 'assert' in line:
                    test_line = self._convert_python_to_ts(line, func_name)
                    if test_line.strip():
                        test_functions.append(f'  testFunctions.push({{name: "test", fn: () => {{ {test_line} }} }});')
        
        return '\n'.join(test_functions) if test_functions else '  // No tests found'
    
    def _convert_python_to_ts(self, code: str, func_name: str) -> str:
        """
        PythonコードをTypeScriptコードに変換
        
        Python形式のテストコードをTypeScript形式に変換する。
        - assert文をTypeScriptのif文に変換
        - == を === に変換
        - != を !== に変換
        - solve関数名を実際の関数名に置換
        
        Args:
            code: Python形式のコード
            func_name: ユーザー関数の名前
        
        Returns:
            str: TypeScript形式のコード
        """
        # solveを実際の関数名に置換
        code = code.replace('solve', func_name)
        
        # assert文を変換
        code = re.sub(r'assert\s+(.+?)(\s*#.*)?$', r'if (!(\1)) throw new Error("Assertion failed: \1");', code, flags=re.MULTILINE)
        
        # == を === に変換
        code = re.sub(r'\b==\b', '===', code)
        code = re.sub(r'\b!=\b', '!==', code)
        
        # Pythonのリスト記法をTypeScriptに変換
        code = re.sub(r'\[(\d+),\s*(\d+)\]', r'[\1, \2]', code)
        
        return code
    
    def _run_typescript(self, test_dir: Path, time_limit_sec: float) -> Dict[str, Any]:
        """
        TypeScriptコードを実行してテスト結果を返す
        
        tsxを使用してTypeScriptコードを実行する。
        
        Args:
            test_dir: テストファイルが存在するディレクトリのパス
            time_limit_sec: 実行時間制限（秒）
        
        Returns:
            Dict[str, Any]: テスト実行結果
                - "status": ステータス（"success" | "failure" | "timeout" | "error"）
                - "test_output": テスト出力（成功時）
                - "error_message": エラーメッセージ（失敗時）
        """
        # tsxを使用してTypeScriptを実行
        test_file = test_dir / "test.ts"
        cmd = ["npx", "--yes", "tsx", str(test_file)]
        
        # 環境変数を設定
        env = os.environ.copy()
        env["PYTHONIOENCODING"] = "utf-8"
        
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
