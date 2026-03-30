import pandas as pd
import glob
import os

# 切换到桌面目录
os.chdir(r"C:/Users/Administrator/Desktop")

# 查找文件（排除临时文件~$开头）
files = [f for f in os.listdir('.') if f.endswith('.xlsx') and '推广' in f and not f.startswith('~$')]
if not files:
    print("未找到推广数据文件")
    exit()

target_file = files[0]
print(f"读取文件：{target_file}")

df = pd.read_excel(target_file, engine='openpyxl')

# 根据用户提供的列映射
# C=成交金额，D=ROI, F=推广花费，Z=点击量
# 列索引从 0 开始，所以 C=2, D=3, F=5, Z=25
col_sales = df.columns[2]    # C 列 - 成交金额
col_roi = df.columns[3]      # D 列 - ROI
col_spend = df.columns[5]    # F 列 - 推广花费
col_clicks = df.columns[25]  # Z 列 - 点击量

print(f"\n列映射确认：")
print(f"  成交金额 (C): {col_sales}")
print(f"  ROI (D): {col_roi}")
print(f"  推广花费 (F): {col_spend}")
print(f"  点击量 (Z): {col_clicks}")

print("\n" + "=" * 70)
print("拼多多推广数据分析报告 (2026-03-09)")
print("=" * 70)

# 去掉汇总行（最后一行通常是"总计"）
data_rows = df[df[col_sales].notna()].copy()
if len(data_rows) > 0 and '总计' in str(data_rows.iloc[-1, 0]):
    summary_row = data_rows.iloc[-1]
    data_rows = data_rows.iloc[:-1]
else:
    summary_row = None

print(f"\n有效数据行数：{len(data_rows)}")

# 计算汇总数据
total_sales = data_rows[col_sales].sum()
total_spend = data_rows[col_spend].sum()
total_clicks = data_rows[col_clicks].sum()
avg_roi = total_sales / total_spend if total_spend > 0 else 0

# CPC 计算
cpc = total_spend / total_clicks if total_clicks > 0 else 0

print("\n" + "=" * 70)
print("一、核心数据汇总")
print("=" * 70)

print(f"""
┌─────────────────────────────────────────┐
│  指标              │  数值               │
├─────────────────────────────────────────┤
│  总成交金额 (GMV)   │  RMB {total_sales:>10,.2f}  │
│  总推广花费        │  RMB {total_spend:>10,.2f}  │
│  总点击量          │  {int(total_clicks):>10} 次    │
│  ├─────────────────────────────────────┤
│  ROI (投产比)      │  {avg_roi:>10.2f}          │
│  CPC (单次点击成本)│  RMB {cpc:>10.2f}  │
│  推广利润 (毛利率 25%)│ RMB {(total_sales * 0.25 - total_spend):>10,.2f} │
└─────────────────────────────────────────┘
""")

# 分时段数据
print("\n" + "=" * 70)
print("二、分时段数据（按 ROI 排序）")
print("=" * 70)

# 创建分析表
analysis = data_rows.copy()
analysis['时段'] = analysis.iloc[:, 0]  # 第一列是时段
analysis['ROI'] = analysis[col_roi]
analysis['成交金额'] = analysis[col_sales]
analysis['推广花费'] = analysis[col_spend]
analysis['点击量'] = analysis[col_clicks]

# 按 ROI 排序显示
sorted_df = analysis.sort_values('ROI', ascending=False)

print(f"""
{'时段':<12} {'成交金额':>10} {'花费':>8} {'ROI':>8} {'点击量':>8}
{'-'*12} {'-'*10} {'-'*8} {'-'*8} {'-'*8}""")

for _, row in sorted_df.iterrows():
    print(f"{str(row['时段']):<12} {row['成交金额']:>10,.0f} {row['推广花费']:>8,.0f} {row['ROI']:>8.2f} {int(row['点击量']):>8}")

# 最优和最差时段
print("\n" + "=" * 70)
print("三、时段表现分析")
print("=" * 70)

top5 = sorted_df.head(5)
bottom5 = sorted_df.tail(5)

print("\n【ROI 最高的 5 个时段】（建议提高出价/预算）")
for _, row in top5.iterrows():
    print(f"  {row['时段']}: ROI={row['ROI']:.2f}, 成交={row['成交金额']:.0f}, 花费={row['推广花费']:.0f}")

print("\n【ROI 最低的 5 个时段】（建议降低出价或暂停）")
for _, row in bottom5.iterrows():
    print(f"  {row['时段']}: ROI={row['ROI']:.2f}, 成交={row['成交金额']:.0f}, 花费={row['推广花费']:.0f}")

# 高峰时段分析
print("\n" + "=" * 70)
print("四、高峰时段分析（按成交金额）")
print("=" * 70)

by_sales = analysis.sort_values('成交金额', ascending=False)
print("\n【成交金额最高的 5 个时段】")
for _, row in by_sales.head(5).iterrows():
    print(f"  {row['时段']}: 成交={row['成交金额']:.0f}, ROI={row['ROI']:.2f}")

print("\n" + "=" * 70)
print("五、调整建议")
print("=" * 70)

# 计算盈亏平衡 ROI（假设毛利率 25%）
break_even_roi = 4  # 1/0.25 = 4
profit_status = "[盈利]" if avg_roi > break_even_roi else "[亏损]"

print(f"""
[盈亏平衡点] ROI = {break_even_roi} (按毛利率 25% 计算)

[当前整体 ROI] {avg_roi:.2f} -> {profit_status}

[具体建议]
1. 日预算调整：
   - 当前日花费：RMB {total_spend:.2f}
   - 建议提高到：RMB {total_spend * 1.5:.0f} - {total_spend * 2:.0f}/天
   - 理由：ROI {avg_roi:.2f} 远高于盈亏线，可以多投

2. 分时折扣（如支持）:
   - 重点加码：{top5.iloc[0]['时段']}、{top5.iloc[1]['时段']} -> ROI 最高
   - 缩减投放：{bottom5.iloc[-1]['时段']}、{bottom5.iloc[-2]['时段']} -> ROI 最低

3. 稳定成本推广设置:
   - 目标 ROI 建议设为：{avg_roi * 0.9:.1f} - {avg_roi:.1f}
   - 这样能拿到更多流量，同时保持盈利

""")

print("\n数据导出：分析结果已打印，可按需截图保存")
