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

print("=" * 80)
print("                卡斐乐 2025 年 11 月利润月报 检查报告")
print("=" * 80)

# ==================== 读取月报表（核心汇总表） ====================
month_df = pd.read_excel(xl_file, sheet_name='月报表', header=3)

print("\n【一、11 月汇总数据】")
print("-" * 80)

# 查找店铺数据行
# 从月报表结构看，数据从第 4 行开始（header=3 后）
print("\n月报表数据结构：")
print(f"行数：{len(month_df)}, 列数：{len(month_df.columns)}")
print("\n前 5 列列名：")
for i, col in enumerate(month_df.columns[:10]):
    print(f"  {i+1}. '{col}'")

# 尝试读取实际的汇总数据
# 根据前面的输出，数据在非标准列中，需要重新读取
month_df_raw = pd.read_excel(xl_file, sheet_name='月报表')

# 查找包含"店铺"的行
shop_row_idx = None
for idx, row in month_df_raw.iterrows():
    for val in row.values:
        if isinstance(val, str) and '店铺' in val:
            shop_row_idx = idx
            break

print(f"\n找到'店铺'关键字的行：{shop_row_idx}")

# 显示该行数据
if shop_row_idx is not None:
    print(f"\n店铺行数据（前 25 列）:")
    print(month_df_raw.iloc[shop_row_idx:shop_row_idx+3, :25].to_string())

# ==================== 读取签收数据（订单明细） ====================
detail_df = pd.read_excel(xl_file, sheet_name='签收数据')

print("\n\n【二、签收订单数据分析】")
print("-" * 80)
print(f"订单总数：{len(detail_df):,} 单")

# 计算关键指标
user_pay_col = '用户实付金额 (元)'
cost_col = '总成本'
single_cost_col = '单成本'
merchant_recv_col = '商家实收金额 (元)'

print("\n【关键指标】")

# 用户实付
if user_pay_col in detail_df.columns:
    user_pay = pd.to_numeric(detail_df[user_pay_col], errors='coerce')
    print(f"\n用户实付金额 (元):")
    print(f"  总和：{user_pay.sum():,.2f}")
    print(f"  有效订单数：{user_pay[user_pay > 0].count()}")
    print(f"  平均值：{user_pay[user_pay > 0].mean():.2f}")
else:
    print(f"\n[!] 未找到列：{user_pay_col}")

# 商家实收
if merchant_recv_col in detail_df.columns:
    merchant_recv = pd.to_numeric(detail_df[merchant_recv_col], errors='coerce')
    print(f"\n商家实收金额 (元):")
    print(f"  总和：{merchant_recv.sum():,.2f}")
else:
    print(f"\n未找到列：{merchant_recv_col}")

# 总成本
if cost_col in detail_df.columns:
    total_cost = pd.to_numeric(detail_df[cost_col], errors='coerce')
    print(f"\n总成本:")
    print(f"  总和：{total_cost.sum():,.2f}")
    print(f"  平均值：{total_cost.mean():.2f}")

# 单成本
if single_cost_col in detail_df.columns:
    single_cost = pd.to_numeric(detail_df[single_cost_col], errors='coerce')
    print(f"\n单成本:")
    print(f"  总和：{single_cost.sum():,.2f}")

# 计算利润
if user_pay_col in detail_df.columns and cost_col in detail_df.columns:
    user_pay = pd.to_numeric(detail_df[user_pay_col], errors='coerce').fillna(0)
    total_cost = pd.to_numeric(detail_df[cost_col], errors='coerce').fillna(0)

    profit = user_pay - total_cost
    print("\n【利润计算】")
    print(f"  用户实付总额：{user_pay.sum():,.2f} 元")
    print(f"  总成本：{total_cost.sum():,.2f} 元")
    print(f"  毛利润：{profit.sum():,.2f} 元")

    if user_pay.sum() > 0:
        margin = (profit.sum() / user_pay.sum()) * 100
        print(f"  毛利率：{margin:.2f}%")

# ==================== 按店铺汇总 ====================
print("\n\n【三、按店铺利润分析】")
print("-" * 80)

if '店铺名称' in detail_df.columns:
    shop_summary = detail_df.groupby('店铺名称').agg({
        user_pay_col: 'sum',
        cost_col: 'sum',
        '订单号': 'count'
    }).reset_index()

    shop_summary.columns = ['店铺名称', '订单数', '用户实付', '总成本']
    shop_summary['利润'] = shop_summary['用户实付'] - shop_summary['总成本']
    shop_summary['毛利率'] = (shop_summary['利润'] / shop_summary['用户实付'] * 100).round(2)
    shop_summary = shop_summary.sort_values('利润', ascending=False)

    print(f"\n{'店铺名称':<30} {'订单数':>10} {'收入':>15} {'成本':>15} {'利润':>15} {'毛利率':>10}")
    print("-" * 100)

    for _, row in shop_summary.iterrows():
        print(f"{row['店铺名称']:<30} {int(row['订单数']):>10,} {row['用户实付']:>15,.2f} {row['总成本']:>15,.2f} {row['利润']:>15,.2f} {row['毛利率']:>9.2f}%")

# ==================== 异常订单检查 ====================
print("\n\n【四、异常数据检查】")
print("-" * 80)

issues = []

if user_pay_col in detail_df.columns and cost_col in detail_df.columns:
    user_pay = pd.to_numeric(detail_df[user_pay_col], errors='coerce').fillna(0)
    total_cost = pd.to_numeric(detail_df[cost_col], errors='coerce').fillna(0)
    profit = user_pay - total_cost

    # 1. 负利润订单
    loss_count = (profit < 0).sum()
    if loss_count > 0:
        loss_amount = profit[profit < 0].sum()
        issues.append(f"负利润订单：{loss_count} 单，亏损金额：{loss_amount:,.2f} 元")

    # 2. 零收入订单
    zero_rev = (user_pay == 0).sum()
    if zero_rev > 0:
        issues.append(f"零收入订单：{zero_rev} 单")

    # 3. 成本高于收入
    high_cost = ((user_pay > 0) & (total_cost > user_pay)).sum()
    if high_cost > 0:
        issues.append(f"成本高于收入：{high_cost} 单")

    # 4. 异常高成本
    avg_cost = total_cost[total_cost > 0].mean()
    if avg_cost > 0:
        extreme_cost = (total_cost > avg_cost * 10).sum()
        if extreme_cost > 0:
            issues.append(f"异常高成本 (> 平均 10 倍): {extreme_cost} 单")

    # 5. 异常高收入
    avg_pay = user_pay[user_pay > 0].mean()
    if avg_pay > 0:
        extreme_pay = (user_pay > avg_pay * 10).sum()
        if extreme_pay > 0:
            issues.append(f"异常高收入 (> 平均 10 倍): {extreme_pay} 单")

if issues:
    print("\n[发现的问题]")
    for issue in issues:
        print(f"  ! {issue}")
else:
    print("\n[OK] 未发现明显异常")

# ==================== 后台流水核对 ====================
print("\n\n【五、平台流水核对】")
print("-" * 80)

flow_df = pd.read_excel(xl_file, sheet_name='后台数据')
print(f"后台流水记录：{len(flow_df)} 条")

income_col = '收入金额（+ 元）'
expense_col = '支出金额（- 元）'

if income_col in flow_df.columns:
    income = pd.to_numeric(flow_df[income_col], errors='coerce').sum()
    print(f"平台收入总额：{income:,.2f} 元")

if expense_col in flow_df.columns:
    expense = pd.to_numeric(flow_df[expense_col], errors='coerce').sum()
    print(f"平台支出总额：{expense:,.2f} 元")
    print(f"平台净流水：{income + expense:,.2f} 元")

# ==================== 总结 ====================
print("\n\n【六、检查结论】")
print("=" * 80)

if user_pay_col in detail_df.columns and cost_col in detail_df.columns:
    user_pay = pd.to_numeric(detail_df[user_pay_col], errors='coerce').fillna(0)
    total_cost = pd.to_numeric(detail_df[cost_col], errors='coerce').fillna(0)
    profit = user_pay - total_cost

    print(f"""
数据统计期间：2025 年 11 月

1. 订单数据：
   - 签收订单总数：{len(detail_df):,} 单

2. 财务数据：
   - 用户实付总额：{user_pay.sum():,.2f} 元
   - 总成本：{total_cost.sum():,.2f} 元
   - 毛利润：{profit.sum():,.2f} 元
   - 毛利率：{(profit.sum()/user_pay.sum()*100) if user_pay.sum()>0 else 0:.2f}%

3. 数据质量：
   - {'[OK] 数据完整，无明显异常' if not issues else '[警告] 发现异常，请检查上述问题'}

建议：
   - 核对平台流水与订单结算金额是否一致
   - 检查负利润订单是否为正常促销或亏损销售
   - 确认成本核算是否包含所有费用（采购、物流、包装等）
""")

print("=" * 80)
print("检查完成")
print("=" * 80)
