import openpyxl
import glob
import os
import sys

# 设置标准输出编码
sys.stdout.reconfigure(encoding='utf-8')

desktop = r'C:\Users\Administrator\Desktop'
files = glob.glob(os.path.join(desktop, '运营绩效*.xlsx'))
wb = openpyxl.load_workbook(files[0])
ws = wb.active

print("=" * 80)
print("运营绩效考核表分析")
print("=" * 80)

# 提取考核维度数据
print("\n【考核维度和指标】")
print("-" * 80)

headers = ['考核维度', '考核指标', '权重', '目标值', '上月', '实际', '得分', '评分标准', '计算方式']
print(f"{headers[0]:<12} {headers[1]:<15} {headers[2]:<8} {headers[3]:<10} {headers[4]:<8} {headers[5]:<8} {headers[6]:<8}")
print("-" * 80)

# 收集考核数据
metrics = []
for row in range(3, 8):  # 数据行 3-7
    data = {
        'dimension': ws.cell(row=row, column=1).value or '',
        'indicator': ws.cell(row=row, column=2).value or '',
        'weight': ws.cell(row=row, column=3).value,
        'target': ws.cell(row=row, column=4).value,
        'last_month': ws.cell(row=row, column=5).value,
        'actual': ws.cell(row=row, column=6).value,
        'score': ws.cell(row=row, column=7).value,
        'formula': ws.cell(row=row, column=9).value
    }
    metrics.append(data)

    # 显示第一列（考核维度）只在第一行显示
    dim = data['dimension'] if data['dimension'] else ''
    print(f"{dim:<12} {data['indicator']:<15} {data['weight']:<8} {str(data['target']):<10} {str(data['last_month']):<8} {str(data['actual']):<8} {str(data['score']):<8}")

# 检查权重总和
print("\n【权重检查】")
total_weight = sum(m['weight'] for m in metrics if m['weight'])
print(f"权重总和：{total_weight}")
if total_weight != 1.0:
    print(f"[警告] 权重总和不等于 1.0，当前为 {total_weight}")
else:
    print("[OK] 权重总和正确")

# 检查得分计算
print("\n【得分计算检查】")
for m in metrics:
    if m['weight'] and m['actual'] and m['target']:
        # 简单的线性得分计算
        if isinstance(m['actual'], (int, float)) and isinstance(m['target'], (int, float)):
            ratio = m['actual'] / m['target']
            max_score = 30  # 假设满分 30 分
            calculated_score = ratio * max_score
            print(f"  {m['indicator']}: 实际/目标={ratio:.2%}, 理论得分≈{calculated_score:.1f}, 实际得分={m['score']}")

# 总分
print("\n【总分和绩效等级】")
total_score_cell = ws.cell(row=8, column=7).value
grade_formula = ws.cell(row=9, column=7).value
bonus_formula = ws.cell(row=10, column=7).value

print(f"总分单元格 (G8): {total_score_cell}")
print(f"等级公式 (G9): {grade_formula}")
print(f"绩效金额公式 (G10): {bonus_formula}")

# 检查公式问题
print("\n【潜在问题检查】")
print("-" * 80)

# 检查 G5 单元格公式（DSR 评分）
g5_formula = ws.cell(row=5, column=7).value
print(f"G5 (DSR 评分) 公式：{g5_formula}")
if 'F5' in str(g5_formula):
    print("[警告] G5 公式引用自身 (F5)，可能导致循环引用!")

# 检查目标值和实际值的合理性
print("\n【数据合理性检查】")
for m in metrics:
    if m['indicator'] and m['target'] and m['actual']:
        if isinstance(m['target'], (int, float)) and isinstance(m['actual'], (int, float)):
            ratio = m['actual'] / m['target'] * 100
            if ratio < 50:
                print(f"[警告] {m['indicator']}: 完成率仅 {ratio:.1f}%，可能异常")
            elif ratio > 150:
                print(f"[注意] {m['indicator']}: 完成率 {ratio:.1f}%，远超目标")

print("\n【考核等级和奖金对照】")
print("-" * 80)
print("分数范围\t\t绩效奖金\t等级")
print("-" * 80)
for row in range(15, 20):
    score_range = ws.cell(row=row, column=1).value
    bonus = ws.cell(row=row, column=2).value
    grade = ws.cell(row=row, column=3).value
    print(f"{score_range}\t{bonus}\t{grade}")

print("\n" + "=" * 80)
