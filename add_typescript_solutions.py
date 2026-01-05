#!/usr/bin/env python3
"""
問題ファイルの解説にTypeScriptコードを追加するスクリプト

すべての問題ファイル（ct-*.json）を読み込み、解説（solution）フィールドに
Pythonコードに対応するTypeScriptコードを追加します。
"""

import json
import re
from pathlib import Path
from typing import Dict, Any

def python_to_typescript_code(python_code: str) -> str:
    """
    PythonコードをTypeScriptコードに変換（簡易版）
    
    基本的な変換ルール:
    - def solve(...) -> export function solve(...)
    - list[int] -> number[]
    - list[str] -> string[]
    - list[tuple[int, int]] -> [number, number][]
    - tuple[int, int] -> [number, number]
    - set[str] -> Set<string>
    - int -> number
    - bool -> boolean
    - str -> string
    - float -> number
    - range(n) -> for (let i = 0; i < n; i++)
    - len(arr) -> arr.length
    - set() -> new Set()
    - dict -> Map または Record
    """
    ts_code = python_code
    
    # 関数定義の変換
    ts_code = re.sub(r'def\s+solve\s*\(', 'export function solve(', ts_code)
    
    # 型アノテーションの変換
    type_replacements = [
        (r'list\[int\]', 'number[]'),
        (r'list\[str\]', 'string[]'),
        (r'list\[tuple\[int,\s*int\]\]', '[number, number][]'),
        (r'tuple\[int,\s*int\]', '[number, number]'),
        (r'set\[str\]', 'Set<string>'),
        (r':\s*int\s*', ': number '),
        (r':\s*bool\s*', ': boolean '),
        (r':\s*str\s*', ': string '),
        (r':\s*float\s*', ': number '),
        (r'->\s*int\s*:', ': number {'),
        (r'->\s*bool\s*:', ': boolean {'),
        (r'->\s*str\s*:', ': string {'),
        (r'->\s*list\[int\]\s*:', ': number[] {'),
        (r'->\s*list\[str\]\s*:', ': string[] {'),
        (r'->\s*list\[tuple\[int,\s*int\]\]\s*:', ': [number, number][] {'),
        (r'->\s*set\[str\]\s*:', ': Set<string> {'),
    ]
    
    for pattern, replacement in type_replacements:
        ts_code = re.sub(pattern, replacement, ts_code)
    
    # 基本的な構文の変換
    ts_code = ts_code.replace('len(', '.length')
    ts_code = ts_code.replace('range(', 'Array.from({length: ').replace('})', '}, (_, i) => i)')
    ts_code = re.sub(r'set\(\)', 'new Set<number>()', ts_code)
    ts_code = re.sub(r'set\(\[([^\]]+)\]\)', r'new Set([\1])', ts_code)
    
    # True/False の変換
    ts_code = ts_code.replace('True', 'true')
    ts_code = ts_code.replace('False', 'false')
    ts_code = ts_code.replace('None', 'null')
    
    return ts_code

def convert_python_code_block(code_block: str) -> str:
    """
    PythonコードブロックをTypeScriptコードブロックに変換
    """
    # コードブロックからPythonコードを抽出
    python_code = code_block.strip()
    
    # PythonコードをTypeScriptコードに変換（簡易版）
    # 実際の変換は各問題に応じて手動で調整が必要
    # ここでは基本的な変換のみ行う
    return python_code

def add_typescript_to_solution(solution: str, python_code: str, problem_id: str) -> str:
    """
    解説にTypeScriptコードを追加
    
    Pythonコードブロックの後にTypeScriptコードブロックを追加する
    """
    # Pythonコードブロックを検索
    python_block_pattern = r'```python\n(.*?)\n```'
    matches = list(re.finditer(python_block_pattern, solution, re.DOTALL))
    
    if not matches:
        # Pythonコードブロックが見つからない場合はそのまま返す
        return solution
    
    # 最後のPythonコードブロックの後にTypeScriptコードを追加
    last_match = matches[-1]
    insert_pos = last_match.end()
    
    # TypeScriptコードを生成（簡易版 - 実際には手動で調整が必要）
    ts_code = python_code
    # 基本的な変換
    ts_code = ts_code.replace('def solve(', 'export function solve(')
    ts_code = ts_code.replace('list[int]', 'number[]')
    ts_code = ts_code.replace('list[str]', 'string[]')
    ts_code = ts_code.replace(': int', ': number')
    ts_code = ts_code.replace(': bool', ': boolean')
    ts_code = ts_code.replace(': str', ': string')
    ts_code = ts_code.replace('-> int:', ': number {')
    ts_code = ts_code.replace('-> bool:', ': boolean {')
    ts_code = ts_code.replace('-> str:', ': string {')
    ts_code = ts_code.replace('-> list[int]:', ': number[] {')
    ts_code = ts_code.replace('-> list[str]:', ': string[] {')
    ts_code = ts_code.replace('True', 'true')
    ts_code = ts_code.replace('False', 'false')
    ts_code = ts_code.replace('None', 'null')
    ts_code = ts_code.replace('len(', '.length')
    
    # TypeScriptコードブロックを追加
    ts_block = f'\n\n```typescript\n{ts_code}\n```'
    
    # 解説を追加（簡易版）
    ts_explanation = '\n\n### TypeScript実装\n\n上記のPythonコードをTypeScriptで実装すると以下のようになります。\n'
    
    new_solution = solution[:insert_pos] + ts_explanation + ts_block + solution[insert_pos:]
    
    return new_solution

def process_problem_file(file_path: Path) -> bool:
    """
    問題ファイルを処理してTypeScriptコードを追加
    
    Returns:
        bool: 変更があった場合True
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # solutionフィールドが存在しない場合はスキップ
        if 'solution' not in data:
            return False
        
        solution = data['solution']
        
        # 既にTypeScriptコードが含まれているかチェック
        if '```typescript' in solution or '```ts\n' in solution:
            return False
        
        # Pythonコードブロックを抽出
        python_block_pattern = r'```python\n(.*?)\n```'
        python_blocks = re.findall(python_block_pattern, solution, re.DOTALL)
        
        if not python_blocks:
            return False
        
        # 最後のPythonコードブロックを取得（通常はメインの解法）
        python_code = python_blocks[-1]
        
        # TypeScriptコードを生成（簡易版）
        # 実際の実装では、より詳細な変換が必要
        print(f"Processing {file_path.name}...")
        print("Note: This script provides a basic template. Manual adjustment may be needed.")
        
        # ここでは基本的な変換のみ行い、実際のコードは手動で追加することを推奨
        return False  # 手動処理を推奨するため、自動処理は行わない
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """
    メイン処理
    """
    problems_dir = Path('problems')
    
    if not problems_dir.exists():
        print(f"Error: {problems_dir} directory not found")
        return
    
    problem_files = sorted(problems_dir.glob('ct-*.json'))
    
    print(f"Found {len(problem_files)} problem files")
    print("This script provides a template. Manual conversion is recommended for accuracy.")
    
    # 各ファイルを処理（現在は確認のみ）
    for file_path in problem_files:
        process_problem_file(file_path)

if __name__ == '__main__':
    main()


