import pandas as pd
import openpyxl
import os
import glob
import warnings
warnings.filterwarnings('ignore')

folder = r'C:\Users\Administrator\Desktop\卡斐乐月报'
files = glob.glob(os.path.join(folder, '*2511*'))
xl_file = files[0]

print("=" * 80)
print("                卡斐乐 2025 年 11 月利润月报 检查报告")
print("=" * 80)

# 读取签收数据
detail_df = pd.read_excel(xl_file, sheet_name='签收数据')

# 通过位置获取列（根据之前的分析）
# 第 50 列：用户实付金额 (元)
# 第 51 列：商家实收金额 (元)
# 第 52 列：单成本
# 第 53 列：总成本

cols = list(detail_df.columns)
user_pay_col = cols[49]  # 用户实付
merchant_recv_col = cols[50]  # 商家实收
single_cost_col = cols[51]  # 单成本
total_cost_col = cols[52]  # 总成本
shop_col = cols[0]  # 店铺名称
order_col = cols[3]  # 订单号

print(f"\n识别到的列名:")
print(f"  店铺：{shop_col}")
print(f"  订单号：{order_col}")
print(f"  用户实付：{user_pay_col}")
print(f"  商家实收：{merchant_recv_col}")
print(f"  单成本：{single_cost_col}")
print(f"  总成本：{total_cost_col}")

# ==================== 核心数据分析 ====================
print("\n\n【一、核心财务数据】")
print("-" * 80)

user_pay = pd.to_numeric(detail_df[user_pay_col], errors='coerce').fillna(0)
merchant_recv = pd.to_numeric(detail_df[merchant_recv_col], errors='coerce').fillna(0)
single_cost = pd.to_numeric(detail_df[single_cost_col], errors='coerce').fillna(0)
total_cost = pd.to_numeric(detail_df[total_cost_col], errors='coerce').fillna(0)

print(f"""
数据统计期间：2025 年 11 月

1. 订单数据：
   - 签收订单总数：{len(detail_df):,} 单
   - 有效订单数（实付>0）：{(user_pay > 0).sum():,} 单

2. 收入数据：
   - 用户实付总额：{user_pay.sum():,.2f} 元
   - 商家实收总额：{merchant_recv.sum():,.2f} 元
   - 平均每单收入：{user_pay[user_pay > 0].mean():.2f} 元

3. 成本数据：
   - 单成本总额：{single_cost.sum():,.2f} 元
   - 总成本总额：{total_cost.sum():,.2f} 元
   - 平均每单成本：{total_cost.mean():.2f} 元

4. 利润计算：
   - 毛利润（用户实付 - 总成本）：{(user_pay - total_cost).sum():,.2f} 元
   - 毛利率：{((user_pay - total_cost).sum() / user_pay.sum() * 100) if user_pay.sum() > 0 else 0:.2f}%
   - 毛利润（商家实收 - 总成本）：{(merchant_recv - total_cost).sum():,.2f} 元
""")

# ==================== 按店铺汇总 ====================
print("\n【二、按店铺利润分析】")
print("-" * 80)

shop_summary = detail_df.groupby(shop_col).agg({
    user_pay_col: 'sum',
    merchant_recv_col: 'sum',
    single_cost_col: 'sum',
    total_cost_col: 'sum',
    order_col: 'count'
}).reset_index()

shop_summary.columns = ['店铺', '订单数', '用户实付', '商家实收', '单成本', '总成本']
shop_summary['毛利润'] = shop_summary['用户实付'] - shop_summary['总成本']
shop_summary['毛利率'] = (shop_summary['毛利润'] / shop_summary['用户实付'] * 100).round(2)
shop_summary = shop_summary.sort_values('毛利润', ascending=False)

print(f"\n{'店铺':<25} {'订单数':>8} {'用户实付':>12} {'总成本':>12} {'毛利润':>12} {'毛利率':>8}")
print("-" * 85)

for _, row in shop_summary.iterrows():
    print(f"{row['店铺']:<25} {int(row['订单数']):>8,} {row['用户实付']:>12,.0f} {row['总成本']:>12,.0f} {row['毛利润']:>12,.0f} {row['毛利率']:>7.2f}%")

# 总计
print("-" * 85)
print(f"{'总计':<25} {int(shop_summary['订单数'].sum()):>8,} {shop_summary['用户实付'].sum():>12,.0f} {shop_summary['总成本'].sum():>12,.0f} {shop_summary['毛利润'].sum():>12,.0f} {(shop_summary['毛利润'].sum()/shop_summary['用户实付'].sum()*100):>7.2f}%")

# ==================== 异常数据检查 ====================
print("\n\n【三、异常数据检查】")
print("-" * 80)

issues = []

# 1. 负利润订单
profit = user_pay - total_cost
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

# 6. 负成本
neg_cost = (total_cost < 0).sum()
if neg_cost > 0:
    issues.append(f"负成本记录：{neg_cost} 单")

# 7. 负收入
neg_pay = (user_pay < 0).sum()
if neg_pay > 0:
    issues.append(f"负收入记录：{neg_pay} 单")

if issues:
    print("\n[发现的问题]")
    for issue in issues:
        print(f"  ! {issue}")
else:
    print("\n[OK] 未发现明显异常")

# ==================== 平台流水核对 ====================
print("\n\n【四、平台流水核对】")
print("-" * 80)

flow_df = pd.read_excel(xl_file, sheet_name='后台数据')
print(f"后台流水记录：{len(flow_df)} 条")

flow_cols = list(flow_df.columns)
income_col = None
expense_col = None

for col in flow_cols:
    if '收入' in str(col) and '+' in str(col):
        income_col = col
    if '支出' in str(col) and '-' in str(col):
        expense_col = col

if income_col:
    income = pd.to_numeric(flow_df[income_col], errors='coerce').sum()
    print(f"平台收入总额：{income:,.2f} 元")

if expense_col:
    expense = pd.to_numeric(flow_df[expense_col], errors='coerce').sum()
    print(f"平台支出总额：{expense:,.2f} 元")
    print(f"平台净流水：{income + expense:,.2f} 元")

# 与订单数据对比
print("\n[数据一致性检查]")
if income_col:
    # 商家实收应该与平台收入接近
    diff = abs(merchant_recv.sum() - income)
    diff_pct = (diff / merchant_recv.sum() * 100) if merchant_recv.sum() > 0 else 0
    print(f"商家实收 ({merchant_recv.sum():,.2f}) vs 平台收入 ({income:,.2f})")
    print(f"  差异：{diff:,.2f} 元 ({diff_pct:.2f}%)")

    if diff_pct > 5:
        print("  [警告] 差异较大，请检查原因！")
    else:
        print("  [OK] 差异在合理范围内")

# ==================== 其他成本核对 ====================
print("\n\n【五、其他成本核对】")
print("-" * 80)

# 检查是否有额外的成本表
cost_sheets = ['成本 1', '成本 2', '代发成本表', '单品成本', '组合成本']
extra_costs = {}

for sheet in cost_sheets:
    try:
        df = pd.read_excel(xl_file, sheet_name=sheet)
        # 查找成本列
        for col in df.columns:
            if '成本' in str(col):
                cost_data = pd.to_numeric(df[col], errors='coerce').fillna(0)
                if cost_data.sum() > 0:
                    extra_costs[f"{sheet}.{col}"] = cost_data.sum()
    except:
        pass

if extra_costs:
    print("\n额外成本项目:")
    for k, v in extra_costs.items():
        print(f"  {k}: {v:,.2f} 元")
    print(f"\n额外成本合计：{sum(extra_costs.values()):,.2f} 元")
else:
    print("\n未发现额外成本项目")

# ==================== 总结 ====================
print("\n\n【六、检查结论】")
print("=" * 80)

print(f"""
数据统计期间：2025 年 11 月

1. 订单数据：
   - 签收订单总数：{len(detail_df):,} 单
   - 有效订单数：{(user_pay > 0).sum():,} 单

2. 财务数据：
   - 用户实付总额：{user_pay.sum():,.2f} 元
   - 商家实收总额：{merchant_recv.sum():,.2f} 元
   - 总成本：{total_cost.sum():,.2f} 元
   - 毛利润：{(user_pay - total_cost).sum():,.2f} 元
   - 毛利率：{((user_pay - total_cost).sum() / user_pay.sum() * 100) if user_pay.sum() > 0 else 0:.2f}%

3. 数据质量：
   - {'[OK] 数据完整，无明显异常' if not issues else '[警告] 发现异常，请检查上述问题'}

4. 建议：
   - 核对平台流水与商家实收金额是否一致
   - 检查负利润订单是否为正常促销或亏损销售
   - 确认总成本是否包含所有费用（采购、物流、包装、平台扣点等）
   - 如有额外成本表，需要合并计算总成本
""")

print("=" * 80)
print("检查完成")
print("=" * 80)
