#!/usr/bin/env python3
"""
問題ファイルの解説にTypeScriptコードを追加

各問題ファイルのsolutionフィールドにPythonコードに対応するTypeScriptコードを手動で追加します。
まずはct-001.jsonを処理します。
"""

import json
from pathlib import Path

# ct-001.jsonのTypeScriptコード
ct001_ts_code = """export function solve(nums: number[], target: number): boolean {
    const n = nums.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] === target) {
                return true;
            }
        }
    }
    return false;
}"""

ct001_ts_code2 = """export function solve(nums: number[], target: number): boolean {
    const seen = new Set<number>();
    for (const num of nums) {
        const complement = target - num;
        if (seen.has(complement)) {
            return true;
        }
        seen.add(num);
    }
    return false;
}"""

def update_ct001():
    """ct-001.jsonを更新"""
    file_path = Path('problems/ct-001.json')
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    solution = data['solution']
    
    # 既にTypeScriptコードが含まれているかチェック
    if '```typescript' in solution:
        print(f"{file_path.name}: 既にTypeScriptコードが含まれています")
        return False
    
    # 解法1の後にTypeScriptコードを追加
    solution = solution.replace(
        '```python\ndef solve(nums: list[int], target: int) -> bool:\n    n = len(nums)\n    for i in range(n):\n        for j in range(i + 1, n):\n            if nums[i] + nums[j] == target:\n                return True\n    return False\n```',
        f'```python\ndef solve(nums: list[int], target: int) -> bool:\n    n = len(nums)\n    for i in range(n):\n        for j in range(i + 1, n):\n            if nums[i] + nums[j] == target:\n                return True\n    return False\n```\n\n```typescript\n{ct001_ts_code}\n```'
    )
    
    # 解法2の後にTypeScriptコードを追加
    solution = solution.replace(
        '```python\ndef solve(nums: list[int], target: int) -> bool:\n    seen = set()\n    for num in nums:\n        complement = target - num\n        if complement in seen:\n            return True\n        seen.add(num)\n    return False\n```',
        f'```python\ndef solve(nums: list[int], target: int) -> bool:\n    seen = set()\n    for num in nums:\n        complement = target - num\n        if complement in seen:\n            return True\n        seen.add(num)\n    return False\n```\n\n```typescript\n{ct001_ts_code2}\n```'
    )
    
    data['solution'] = solution
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"{file_path.name}: TypeScriptコードを追加しました")
    return True

if __name__ == '__main__':
    update_ct001()



