#!/usr/bin/env python3
"""
すべての問題ファイルの解説にTypeScriptコードを追加するスクリプト

各問題ファイルのsolutionフィールドに含まれるPythonコードをTypeScriptコードに変換して追加します。
"""

import json
import re
from pathlib import Path
from typing import List, Tuple

def convert_python_to_typescript(python_code: str) -> str:
    """
    PythonコードをTypeScriptコードに変換
    
    基本的な変換ルールを適用します。
    """
    ts_code = python_code
    
    # 関数定義
    ts_code = re.sub(r'def\s+solve\s*\(', 'export function solve(', ts_code)
    
    # 型アノテーション
    type_mappings = [
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
    
    for pattern, replacement in type_mappings:
        ts_code = re.sub(pattern, replacement, ts_code)
    
    # 基本構文
    ts_code = ts_code.replace('True', 'true')
    ts_code = ts_code.replace('False', 'false')
    ts_code = ts_code.replace('None', 'null')
    
    # len() -> .length
    ts_code = re.sub(r'len\(([^)]+)\)', r'\1.length', ts_code)
    
    # range(n) -> for (let i = 0; i < n; i++)
    # これは複雑なので、手動で調整が必要な場合があります
    def replace_range(match):
        var = match.group(1) if match.group(1) else 'i'
        end = match.group(2)
        if match.group(3):  # range(start, end)
            start = match.group(3)
            return f'for (let {var} = {start}; {var} < {end}; {var}++)'
        else:  # range(end)
            return f'for (let {var} = 0; {var} < {end}; {var}++)'
    
    # range() の変換（簡易版 - 完全ではない）
    ts_code = re.sub(r'for\s+(\w+)\s+in\s+range\((\d+)\):', r'for (let \1 = 0; \1 < \2; \1++) {', ts_code)
    ts_code = re.sub(r'for\s+(\w+)\s+in\s+range\((\d+),\s*(\d+)\):', r'for (let \1 = \2; \1 < \3; \1++) {', ts_code)
    
    # for ... in ... (配列の走査)
    ts_code = re.sub(r'for\s+(\w+)\s+in\s+(\w+):', r'for (const \1 of \2) {', ts_code)
    
    # set() -> new Set<number>()
    ts_code = re.sub(r'set\(\)', 'new Set<number>()', ts_code)
    ts_code = re.sub(r'set\(\[([^\]]+)\]\)', r'new Set([\1])', ts_code)
    
    # in 演算子（セットの場合）
    ts_code = re.sub(r'(\w+)\s+in\s+(\w+)', r'\2.has(\1)', ts_code)
    
    # インデントの調整（Pythonの4スペース -> TypeScriptの2スペース、またはそのまま）
    # これは複雑なので、手動で調整が必要
    
    return ts_code

def extract_python_code_blocks(solution: str) -> List[Tuple[str, int, int]]:
    """
    solution文字列からPythonコードブロックを抽出
    
    Returns:
        List[Tuple[str, int, int]]: (コードブロック, 開始位置, 終了位置) のリスト
    """
    pattern = r'```python\n(.*?)\n```'
    blocks = []
    for match in re.finditer(pattern, solution, re.DOTALL):
        code = match.group(1)
        start = match.start()
        end = match.end()
        blocks.append((code, start, end))
    return blocks

def add_typescript_code(solution: str, python_code: str, insert_pos: int) -> str:
    """
    solution文字列の指定位置にTypeScriptコードブロックを追加
    """
    ts_code = convert_python_to_typescript(python_code)
    
    # TypeScriptコードブロックを追加
    ts_block = f'\n\n```typescript\n{ts_code}\n```'
    
    # 解説を追加（既にTypeScriptセクションがない場合のみ）
    if '```typescript' not in solution[:insert_pos]:
        explanation = '\n\n### TypeScript実装\n\n上記のPythonコードをTypeScriptで実装すると以下のようになります。\n'
        ts_block = explanation + ts_block
    
    return solution[:insert_pos] + ts_block + solution[insert_pos:]

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
        if '```typescript' in solution:
            print(f"  {file_path.name}: 既にTypeScriptコードが含まれています")
            return False
        
        # Pythonコードブロックを抽出
        python_blocks = extract_python_code_blocks(solution)
        
        if not python_blocks:
            print(f"  {file_path.name}: Pythonコードブロックが見つかりません")
            return False
        
        # 最後のPythonコードブロックの後にTypeScriptコードを追加
        # （通常、最後のブロックがメインの解法）
        last_code, last_start, last_end = python_blocks[-1]
        
        # TypeScriptコードを追加
        new_solution = add_typescript_code(solution, last_code, last_end)
        
        data['solution'] = new_solution
        
        # ファイルに書き戻し
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"  {file_path.name}: TypeScriptコードを追加しました")
        return True
        
    except Exception as e:
        print(f"  {file_path.name}: エラー - {e}")
        return False

def main():
    """
    メイン処理
    """
    problems_dir = Path('problems')
    
    if not problems_dir.exists():
        print(f"エラー: {problems_dir} ディレクトリが見つかりません")
        return
    
    problem_files = sorted(problems_dir.glob('ct-*.json'))
    
    print(f"{len(problem_files)}個の問題ファイルを処理します...")
    print("注意: 自動変換は基本的な変換のみです。正確性を保つため、手動での確認・調整を推奨します。\n")
    
    processed_count = 0
    for file_path in problem_files:
        if process_problem_file(file_path):
            processed_count += 1
    
    print(f"\n処理完了: {processed_count}個のファイルを更新しました")

if __name__ == '__main__':
    main()


