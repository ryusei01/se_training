#!/usr/bin/env python3
"""
問題ファイルの解説にTypeScriptコードを追加

すべての問題ファイルを処理して、Pythonコードブロックの後にTypeScriptコードブロックを追加します。
"""

import json
import re
from pathlib import Path

def add_typescript_to_solution(solution: str, problem_id: str) -> str:
    """
    solution文字列にTypeScriptコードを追加
    """
    # 既にTypeScriptコードが含まれている場合はスキップ
    if '```typescript' in solution:
        return solution
    
    # Pythonコードブロックを検索
    pattern = r'(```python\n(.*?)\n```)'
    
    def replace_python_block(match):
        python_block = match.group(0)
        python_code = match.group(2)
        
        # PythonコードをTypeScriptコードに変換
        ts_code = convert_python_to_ts(python_code, problem_id)
        
        # TypeScriptコードブロックを追加
        return python_block + f'\n\n```typescript\n{ts_code}\n```'
    
    # すべてのPythonコードブロックを置換
    new_solution = re.sub(pattern, replace_python_block, solution, flags=re.DOTALL)
    
    return new_solution

def convert_python_to_ts(python_code: str, problem_id: str) -> str:
    """
    PythonコードをTypeScriptコードに変換
    
    問題IDに応じて適切な変換を行います。
    """
    ts_code = python_code
    
    # 関数定義
    ts_code = re.sub(r'def\s+solve\s*\(', 'export function solve(', ts_code)
    
    # 型アノテーションの変換
    ts_code = re.sub(r'list\[int\]', 'number[]', ts_code)
    ts_code = re.sub(r'list\[str\]', 'string[]', ts_code)
    ts_code = re.sub(r'list\[tuple\[int,\s*int\]\]', '[number, number][]', ts_code)
    ts_code = re.sub(r'tuple\[int,\s*int\]', '[number, number]', ts_code)
    ts_code = re.sub(r'set\[str\]', 'Set<string>', ts_code)
    
    ts_code = re.sub(r':\s*int\s*', ': number ', ts_code)
    ts_code = re.sub(r':\s*bool\s*', ': boolean ', ts_code)
    ts_code = re.sub(r':\s*str\s*', ': string ', ts_code)
    ts_code = re.sub(r':\s*float\s*', ': number ', ts_code)
    
    ts_code = re.sub(r'->\s*int\s*:', ': number {', ts_code)
    ts_code = re.sub(r'->\s*bool\s*:', ': boolean {', ts_code)
    ts_code = re.sub(r'->\s*str\s*:', ': string {', ts_code)
    ts_code = re.sub(r'->\s*list\[int\]\s*:', ': number[] {', ts_code)
    ts_code = re.sub(r'->\s*list\[str\]\s*:', ': string[] {', ts_code)
    ts_code = re.sub(r'->\s*list\[tuple\[int,\s*int\]\]\s*:', ': [number, number][] {', ts_code)
    ts_code = re.sub(r'->\s*set\[str\]\s*:', ': Set<string> {', ts_code)
    
    # 基本的な構文
    ts_code = ts_code.replace('True', 'true')
    ts_code = ts_code.replace('False', 'false')
    ts_code = ts_code.replace('None', 'null')
    
    # len() -> .length
    def replace_len(match):
        var = match.group(1)
        return f'{var}.length'
    ts_code = re.sub(r'len\(([^)]+)\)', replace_len, ts_code)
    
    # range() の処理（簡易版）
    # for i in range(n): -> for (let i = 0; i < n; i++) {
    ts_code = re.sub(
        r'for\s+(\w+)\s+in\s+range\((\d+)\):',
        r'for (let \1 = 0; \1 < \2; \1++) {',
        ts_code
    )
    ts_code = re.sub(
        r'for\s+(\w+)\s+in\s+range\((\d+),\s*(\d+)\):',
        r'for (let \1 = \2; \1 < \3; \1++) {',
        ts_code
    )
    
    # for ... in ... (配列の走査)
    ts_code = re.sub(
        r'for\s+(\w+)\s+in\s+(\w+):',
        r'for (const \1 of \2) {',
        ts_code
    )
    
    # set() -> new Set<number>()
    ts_code = re.sub(r'set\(\)', 'new Set<number>()', ts_code)
    
    # in 演算子（セットの場合）
    # complement in seen -> seen.has(complement)
    # ただし、これは文脈依存なので、簡易的な置換
    ts_code = re.sub(r'(\w+)\s+in\s+(\w+)(?=\s*:)', r'\2.has(\1)', ts_code)
    ts_code = re.sub(r'if\s+(\w+)\s+in\s+(\w+):', r'if (\2.has(\1)) {', ts_code)
    
    # インデントの調整（Pythonの4スペースを維持）
    # TypeScriptでは通常2スペースだが、ここでは4スペースを維持
    
    return ts_code

def process_file(file_path: Path) -> bool:
    """問題ファイルを処理"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'solution' not in data:
            return False
        
        problem_id = data.get('id', '')
        solution = data['solution']
        
        if '```typescript' in solution:
            print(f"  {file_path.name}: 既にTypeScriptコードが含まれています")
            return False
        
        new_solution = add_typescript_to_solution(solution, problem_id)
        
        if new_solution != solution:
            data['solution'] = new_solution
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  {file_path.name}: TypeScriptコードを追加しました")
            return True
        else:
            print(f"  {file_path.name}: 変更なし")
            return False
            
    except Exception as e:
        print(f"  {file_path.name}: エラー - {e}")
        return False

def main():
    problems_dir = Path('problems')
    problem_files = sorted(problems_dir.glob('ct-*.json'))
    
    print(f"{len(problem_files)}個の問題ファイルを処理します...\n")
    
    count = 0
    for file_path in problem_files:
        if process_file(file_path):
            count += 1
    
    print(f"\n処理完了: {count}個のファイルを更新しました")

if __name__ == '__main__':
    main()


