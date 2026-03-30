import pandas as pd
import glob

# 自动查找推广数据文件
files = glob.glob('*推广*.xlsx')
if not files:
    files = glob.glob('*.xlsx')

# 找到目标文件
target_file = None
for f in files:
    if '商品推广' in f or '推广' in f:
        target_file = f
        break

if not target_file and files:
    target_file = files[0]

if not target_file:
    print("没有找到 Excel 文件")
    exit()

print(f"读取文件：{target_file}")
df = pd.read_excel(target_file, engine='openpyxl')

# 显示原始列名
print("=" * 70)
print("拼多多商品推广数据分析报告")
print("数据日期：2026-03-09")
print("=" * 70)

print("\n【数据列名】")
for i, col in enumerate(df.columns):
    print(f"  {i+1}. {col}")
print(f"\n总行数：{len(df)}")

print("\n" + "=" * 70)
print("一、全天汇总数据")
print("=" * 70)

# 尝试识别列名映射 - 根据之前观察到的数据
# 列名：2026-03-09(时段), 成交金额 (元), 销售额 (元), 实际投放，实际成交金额 (元), 总曝光 (元),
#       总销售额 (元), 真实投放，真实成交，每笔均成交金额 (元), 销售额占比，订单数 (元),
#       订单投放，订单投产，点击，点击率，点击成本，点击转化率，销售额投产，总投产，
#       订单成本 (元), 成交量，每笔成交量 (元), 每笔成交元 (元), ROI, 利润
col_map = {}
for col in df.columns:
    # 成交金额
    if '成交' in col and '金额' in col and '每' not in col:
        col_map['sales'] = col
    # 实际投放/真实投放
    if '投放' in col and ('实际' in col or '真实' in col or '订单' not in col):
        col_map['spend'] = col
    # 点击
    if col == '点击' or ( '点击' in col and '率' not in col and '成本' not in col):
        col_map['clicks'] = col
    # 曝光
    if '曝光' in col or '展现' in col:
        col_map['exposure'] = col
    # 成交量/订单数
    if ('成交' in col and '量' in col) or ('订单' in col and '数' in col) or ('订单' in col and '量' in col):
        col_map['orders'] = col
    # ROI
    if col.upper() == 'ROI':
        col_map['roi'] = col
    # 利润
    if '利润' in col:
        col_map['profit'] = col

print(f"\n识别到的列映射：{col_map}")

# 计算汇总数据
if 'sales' in col_map:
    total_sales = df[col_map['sales']].sum()
else:
    total_sales = 0

if 'spend' in col_map:
    total_spend = df[col_map['spend']].sum()
else:
    total_spend = 0

if 'clicks' in col_map:
    total_clicks = df[col_map['clicks']].sum()
else:
    total_clicks = 0

if 'exposure' in col_map:
    total_exposure = df[col_map['exposure']].sum()
else:
    total_exposure = 0

if 'orders' in col_map:
    total_orders = df[col_map['orders']].sum()
else:
    total_orders = 0

# ROI 计算
roi = total_sales / total_spend if total_spend > 0 else 0
# CPC 计算
cpc = total_spend / total_clicks if total_clicks > 0 else 0
# CTR 计算
ctr = (total_clicks / total_exposure * 100) if total_exposure > 0 else 0
# 转化率计算
cvr = (total_orders / total_clicks * 100) if total_clicks > 0 else 0

print(f"""
| 指标 | 数值 |
|------|------|
| 总成交金额 | RMB{total_sales:,.2f} |
| 总投放消耗 | RMB{total_spend:,.2f} |
| 总成交量 | {int(total_orders)} 单 |
| 总点击 | {int(total_clicks)} 次 |
| 总曝光 | {int(total_exposure):,} 次 |
| ROI (投产比) | {roi:.2f} |
| CPC (单次点击成本) | RMB{cpc:.2f} |
| CTR (点击率) | {ctr:.2f}% |
| CVR (转化率) | {cvr:.2f}% |
""")

# 打印原始数据
print("\n" + "=" * 70)
print("二、原始数据（分时段）")
print("=" * 70)
print(df.to_string())

print("\n" + "=" * 70)
print("分析完成")
print("=" * 70)
