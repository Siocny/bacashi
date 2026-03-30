import pandas as pd
from datetime import datetime

# 读取数据
df_orders = pd.read_excel('orders.xlsx', engine='openpyxl')
df_template = pd.read_excel('KFL 充气泵.xlsx', engine='openpyxl')

# 模板数据清理 - 取前 4 行有效数据
df_template_clean = df_template.iloc[:4].copy()
template_cols = df_template_clean.columns.tolist()

# 创建模板匹配字典
template_map = {}
for idx, row in df_template_clean.iterrows():
    spec_name = row[template_cols[1]]  # 规格名
    if pd.notna(spec_name) and spec_name != '':
        template_map[spec_name] = {
            '款式': row[template_cols[0]],
            '成本': row[template_cols[2]],
            '公司支': row[template_cols[3]],
            '毛': row[template_cols[4]],
            '总成本': row[template_cols[5]],
            '售价': row[template_cols[6]],
            '毛利': row[template_cols[7]]
        }

# 订单列索引
order_cols = df_orders.columns.tolist()

# 匹配订单并计算利润
results = []
for idx, order in df_orders.iterrows():
    spec_name = order[order_cols[16]]  # 商家备注 - 规格名
    shouji = order[order_cols[9]]  # 商家实收

    if spec_name in template_map:
        t = template_map[spec_name]
        # 计算利润
        chengben = t['成本']  # 产品成本
        gongsizhi = t['公司支']  # 公司支出
        total_cost = t['总成本']  # 总成本
        shoujia = t['售价']  # 售价
        maoli = t['毛利']  # 毛利

        # 根据实际售价调整毛利
        actual_maoli = shouji - total_cost

        results.append({
            '订单号': order[order_cols[1]],
            '下单时间': order[order_cols[11]],
            '商品标题': order[order_cols[14]],
            '规格名': spec_name,
            '款式': t['款式'],
            '商家实收': shouji,
            '产品成本': chengben,
            '公司支出': gongsizhi,
            '总成本': total_cost,
            '标准售价': shoujia,
            '毛利': actual_maoli,
            '毛利率': f'{(actual_maoli/shouji*100):.1f}%' if shouji > 0 else '0%'
        })
    else:
        # 未匹配到模板的订单
        results.append({
            '订单号': order[order_cols[1]],
            '下单时间': order[order_cols[11]],
            '商品标题': order[order_cols[14]],
            '规格名': spec_name if pd.notna(spec_name) else '',
            '款式': '未匹配',
            '商家实收': shouji,
            '产品成本': 0,
            '公司支出': 0,
            '总成本': 0,
            '标准售价': 0,
            '毛利': 0,
            '毛利率': '0%'
        })

# 创建 DataFrame
df_result = pd.DataFrame(results)

# 导出完整明细
output_file = f'利润计算明细_{datetime.now().strftime("%Y%m%d_%H%M")}.xlsx'
df_result.to_excel(output_file, index=False, engine='openpyxl')
print(f"已导出明细：{output_file}")

# 汇总统计
print("\n" + "="*60)
print("利润汇总报表")
print("="*60)

# 总体统计
total_orders = len(df_result)
matched_orders = len(df_result[df_result['款式'] != '未匹配'])
unmatched_orders = len(df_result[df_result['款式'] == '未匹配'])
total_shouji = df_result['商家实收'].sum()
total_maoli = df_result['毛利'].sum()

print(f"\n【总体统计】")
print(f"  总订单数：{total_orders}")
print(f"  已匹配：{matched_orders} ({matched_orders/total_orders*100:.1f}%)")
print(f"  未匹配：{unmatched_orders} ({unmatched_orders/total_orders*100:.1f}%)")
print(f"  总实收：RMB {total_shouji:,.2f}")
print(f"  总毛利：RMB {total_maoli:,.2f}")

# 按款式汇总
print("\n【按款式汇总】")
summary = df_result[df_result['款式'] != '未匹配'].groupby('款式').agg({
    '订单号': 'count',
    '商家实收': 'sum',
    '毛利': 'sum'
}).reset_index()
summary.columns = ['款式', '订单数', '实收金额', '毛利']
summary['毛利率'] = (summary['毛利'] / summary['实收金额'] * 100).round(1).astype(str) + '%'

print(summary.to_string(index=False))

# 导出汇总
summary_file = f'利润汇总_{datetime.now().strftime("%Y%m%d_%H%M")}.xlsx'
summary.to_excel(summary_file, index=False, engine='openpyxl')
print(f"\n已导出汇总：{summary_file}")

# 按天汇总
print("\n【按天汇总】")
try:
    df_result['日期'] = pd.to_datetime(df_result['下单时间'], errors='coerce').dt.date
    daily = df_result.groupby('日期').agg({
        '订单号': 'count',
        '商家实收': 'sum',
        '毛利': 'sum'
    }).reset_index()
    daily.columns = ['日期', '订单数', '实收金额', '毛利']
    daily['毛利率'] = (daily['毛利'] / daily['实收金额'] * 100).round(1).astype(str) + '%'

    print(daily.to_string(index=False))

    # 导出按天汇总
    daily_file = f'利润汇总_按天_{datetime.now().strftime("%Y%m%d_%H%M")}.xlsx'
    daily.to_excel(daily_file, index=False, engine='openpyxl')
    print(f"\n已导出按天汇总：{daily_file}")
except Exception as e:
    print(f"按天汇总出错：{e}")

print("\n" + "="*60)
print("导出完成!")
print("="*60)
