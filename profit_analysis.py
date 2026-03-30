import pandas as pd
import openpyxl
import os
import glob
import warnings
import sys
warnings.filterwarnings('ignore')
sys.stdout.reconfigure(encoding='utf-8')

folder = r'C:\Users\Administrator\Desktop\卡斐乐月报'
files = glob.glob(os.path.join(folder, '*2511*'))
xl_file = files[0]

print("=" * 70)
print("          卡斐乐 2025 年 11 月利润月报 数据检查报告")
print("=" * 70)

# ==================== 核心数据分析 ====================
print("\n" + "=" * 70)
print("一、核心财务数据")
print("=" * 70)

# 读取签收数据（主要订单数据）
detail_df = pd.read_excel(xl_file, sheet_name='签收数据')
print(f"\n签收订单数：{len(detail_df):,} 单")

# 关键指标
key_metrics = {}

# 用户实付金额
if '用户实付金额 (元)' in detail_df.columns:
    user_pay = pd.to_numeric(detail_df['用户实付金额 (元)'], errors='coerce').sum()
    key_metrics['用户实付总额'] = user_pay

# 结算金额
if '结算金额' in detail_df.columns:
    settlement = pd.to_numeric(detail_df['结算金额'], errors='coerce').sum()
    key_metrics['平台结算总额'] = settlement

# 总成本
if '总成本' in detail_df.columns:
    total_cost = pd.to_numeric(detail_df['总成本'], errors='coerce').sum()
    key_metrics['总成本'] = total_cost

# 单成本
if '单成本' in detail_df.columns:
    unit_cost = pd.to_numeric(detail_df['单成本'], errors='coerce').sum()
    key_metrics['单成本'] = unit_cost

# 利润
profit_col = None
for col in detail_df.columns:
    if '利润' in str(col) or '毛利' in str(col):
        profit_col = col
        break

if profit_col:
    profit = pd.to_numeric(detail_df[profit_col], errors='coerce').sum()
    key_metrics['报表利润'] = profit

print("\n【利润表】")
print("-" * 50)
for k, v in key_metrics.items():
    print(f"{k:>15}: {v:>20,.2f} 元")

# 计算利润率
if '用户实付总额' in key_metrics and '总成本' in key_metrics:
    gross_profit = key_metrics['用户实付总额'] - key_metrics['总成本']
    margin = (gross_profit / key_metrics['用户实付总额']) * 100 if key_metrics['用户实付总额'] > 0 else 0
    print("-" * 50)
    print(f"{'毛利润':>15}: {gross_profit:>20,.2f} 元")
    print(f"{'毛利率':>15}: {margin:>19.2f}%")

# ==================== 利润公式验证 ====================
print("\n" + "=" * 70)
print("二、利润计算验证")
print("=" * 70)

# 查找所有可能的收入、成本、利润列
revenue_cols = [c for c in detail_df.columns if any(x in str(c) for x in ['实付', '结算', '收入'])]
cost_cols = [c for c in detail_df.columns if '成本' in str(c)]
profit_cols = [c for c in detail_df.columns if any(x in str(c) for x in ['利润', '毛利'])]

print(f"\n收入列候选：{revenue_cols}")
print(f"成本列候选：{cost_cols}")
print(f"利润列候选：{profit_cols}")

# 验证最常见的组合
test_combinations = [
    ('用户实付金额 (元)', '总成本', '利润'),
    ('用户实付金额 (元)', '单成本', '利润'),
    ('结算金额', '总成本', '利润'),
]

print("\n【利润公式验证】")
for rev, cost, prof in test_combinations:
    if rev in detail_df.columns and cost in detail_df.columns and prof in detail_df.columns:
        r = pd.to_numeric(detail_df[rev], errors='coerce').fillna(0)
        c = pd.to_numeric(detail_df[cost], errors='coerce').fillna(0)
        p = pd.to_numeric(detail_df[prof], errors='coerce').fillna(0)

        calculated = (r - c).sum()
        reported = p.sum()
        diff = calculated - reported

        status = "[OK]" if abs(diff) < 1 else "[差异]"
        print(f"\n{status} {rev} - {cost} = {prof}")
        print(f"       计算：{r.sum():,.2f} - {c.sum():,.2f} = {calculated:,.2f}")
        print(f"       报表：{reported:,.2f}")
        print(f"       差异：{diff:,.2f}")

# ==================== 店铺/链接分析 ====================
print("\n" + "=" * 70)
print("三、按店铺/链接分析")
print("=" * 70)

# 查找店铺列
shop_col = None
for col in detail_df.columns:
    if '店铺' in str(col) or '链接' in str(col) or '商品' in str(col):
        shop_col = col
        break

if shop_col:
    print(f"\n按 {shop_col} 汇总：")
    print("-" * 70)

    # 确定收入和成本列
    rev_col = '用户实付金额 (元)' if '用户实付金额 (元)' in detail_df.columns else (revenue_cols[0] if revenue_cols else None)
    cost_col = '总成本' if '总成本' in detail_df.columns else (cost_cols[0] if cost_cols else None)
    prof_col = profit_cols[0] if profit_cols else None

    if rev_col and cost_col:
        summary = detail_df.groupby(shop_col).agg({
            rev_col: 'sum',
            cost_col: 'sum',
        }).reset_index()

        summary['利润'] = summary[rev_col] - summary[cost_col]
        summary['毛利率'] = (summary['利润'] / summary[rev_col] * 100).round(2)
        summary = summary.sort_values('利润', ascending=False)

        for idx, row in summary.iterrows():
            print(f"\n{row[shop_col]}")
            print(f"  收入：{row[rev_col]:,.2f} | 成本：{row[cost_col]:,.2f} | 利润：{row['利润']:,.2f} | 毛利率：{row['毛利率']}%")

# ==================== 异常数据检查 ====================
print("\n" + "=" * 70)
print("四、异常数据检查")
print("=" * 70)

issues = []

# 1. 负利润订单
if profit_col:
    loss_orders = len(detail_df[pd.to_numeric(detail_df[profit_col], errors='coerce') < 0])
    if loss_orders > 0:
        issues.append(f"负利润订单：{loss_orders} 单")

# 2. 零收入订单
if '用户实付金额 (元)' in detail_df.columns:
    zero_rev = len(detail_df[pd.to_numeric(detail_df['用户实付金额 (元)'], errors='coerce') == 0])
    if zero_rev > 0:
        issues.append(f"零收入订单：{zero_rev} 单")

# 3. 高成本订单（成本> 收入）
if '用户实付金额 (元)' in detail_df.columns and '总成本' in detail_df.columns:
    rev = pd.to_numeric(detail_df['用户实付金额 (元)'], errors='coerce')
    cost = pd.to_numeric(detail_df['总成本'], errors='coerce')
    high_cost = len(detail_df[(rev > 0) & (cost > rev)])
    if high_cost > 0:
        issues.append(f"成本高于收入订单：{high_cost} 单")

# 4. 缺失成本数据
if '总成本' in detail_df.columns:
    missing_cost = detail_df['总成本'].isnull().sum()
    if missing_cost > 0:
        issues.append(f"缺失成本数据：{missing_cost} 单")

if issues:
    print("\n[发现以下问题]")
    for issue in issues:
        print(f"  ! {issue}")
else:
    print("\n[未发现明显异常]")

# ==================== 收支平衡验证 ====================
print("\n" + "=" * 70)
print("五、平台流水核对")
print("=" * 70)

flow_df = pd.read_excel(xl_file, sheet_name='后台数据')
print(f"\n后台流水记录数：{len(flow_df)}")

if '收入金额（+ 元）' in flow_df.columns:
    income = pd.to_numeric(flow_df['收入金额（+ 元）'], errors='coerce').sum()
    print(f"平台收入总额：{income:,.2f} 元")

if '支出金额（- 元）' in flow_df.columns:
    expense = pd.to_numeric(flow_df['支出金额（- 元）'], errors='coerce').sum()
    print(f"平台支出总额：{expense:,.2f} 元")
    print(f"平台净流水：{income + expense:,.2f} 元")

# ==================== 总结 ====================
print("\n" + "=" * 70)
print("六、检查结论")
print("=" * 70)

print("\n【数据总览】")
print(f"  签收订单总数：{len(detail_df):,} 单")
print(f"  用户实付总额：{key_metrics.get('用户实付总额', 0):,.2f} 元")
print(f"  总成本：{key_metrics.get('总成本', 0):,.2f} 元")
print(f"  报表利润：{key_metrics.get('报表利润', 0):,.2f} 元")

if '用户实付总额' in key_metrics and '总成本' in key_metrics:
    calc_profit = key_metrics['用户实付总额'] - key_metrics['总成本']
    print(f"  计算利润：{calc_profit:,.2f} 元")

    if '报表利润' in key_metrics:
        diff = calc_profit - key_metrics['报表利润']
        if abs(diff) > 1000:
            print(f"\n  [警告] 报表利润与计算利润差异较大：{diff:,.2f} 元")
            print("  建议检查：1) 成本核算是否完整  2) 是否有隐藏收入/支出  3) 退款处理是否正确")
        else:
            print(f"\n  [OK] 报表利润与计算利润基本一致，差异：{diff:,.2f} 元")

print("\n" + "=" * 70)
print("检查完成")
print("=" * 70)
