import pandas as pd

# 读取数据
df_template = pd.read_excel('KFL 充气泵.xlsx', engine='openpyxl')
df_orders = pd.read_excel('orders.xlsx', engine='openpyxl')

# 模板数据清理 - 只取前 4 行有效数据
df_template_clean = df_template.iloc[:4].copy()

# 模板列映射 (按索引位置)
template_cols = df_template_clean.columns.tolist()

# 创建模板匹配字典 (规格名 -> 利润数据)
template_map = {}
for idx, row in df_template_clean.iterrows():
    spec_name = row[template_cols[1]]  # 规格名
    if pd.notna(spec_name) and spec_name != '':
        template_map[spec_name] = {
            '款式': row[template_cols[0]],
            '规格名': spec_name,
            '成本': row[template_cols[2]],
            '公司支': row[template_cols[3]],
            '毛': row[template_cols[4]],
            '总成本': row[template_cols[5]],
            '售价': row[template_cols[6]],
            '毛利': row[template_cols[7]]
        }

print("=== 模板匹配数据 ===")
for spec, data in template_map.items():
    print(f"  {spec}: 成本={data['成本']}, 售价={data['售价']}, 毛利={data['毛利']}")

# 订单数据匹配
results = []
order_cols = df_orders.columns.tolist()

for idx, order in df_orders.iterrows():
    spec_name = order[order_cols[16]]  # 商家备注 - 规格名

    # 尝试匹配模板
    if spec_name in template_map:
        template_data = template_map[spec_name]
        results.append({
            '订单号': order[order_cols[1]],
            '商品标题': order[order_cols[14]],
            '规格名': spec_name,
            '款式': template_data['款式'],
            '商家实收': order[order_cols[9]],
            '成本': template_data['成本'],
            '总成本': template_data['总成本'],
            '售价': template_data['售价'],
            '毛利': template_data['毛利'],
            '订单时间': order[order_cols[11]]
        })
    else:
        # 未匹配到模板
        results.append({
            '订单号': order[order_cols[1]],
            '商品标题': order[order_cols[14]],
            '规格名': spec_name,
            '款式': '未匹配',
            '商家实收': order[order_cols[9]],
            '成本': 0,
            '总成本': 0,
            '售价': 0,
            '毛利': 0,
            '订单时间': order[order_cols[11]]
        })

# 创建结果 DataFrame
df_result = pd.DataFrame(results)

print("\n=== 匹配结果 (前 20 行) ===")
print(df_result[['订单号', '规格名', '款式', '商家实收', '毛利']].head(20).to_string())

# 统计
print("\n=== 统计汇总 ===")
matched = len(df_result[df_result['款式'] != '未匹配'])
unmatched = len(df_result[df_result['款式'] == '未匹配'])
total_profit = df_result['毛利'].sum()
total_revenue = df_result['商家实收'].sum()

print(f"总订单数：{len(df_result)}")
print(f"已匹配：{matched}")
print(f"未匹配：{unmatched}")
print(f"总实收：RMB {total_revenue:,.2f}")
print(f"总毛利：RMB {total_profit:,.2f}")

# 导出结果
output_file = '利润计算结果_20260310.xlsx'
df_result.to_excel(output_file, index=False, engine='openpyxl')
print(f"\n已导出：{output_file}")

# 按款式汇总
print("\n=== 按款式汇总 ===")
summary = df_result.groupby('款式').agg({
    '商家实收': 'sum',
    '毛利': 'sum',
    '订单号': 'count'
}).reset_index()
summary.columns = ['款式', '实收', '毛利', '订单数']
print(summary.to_string())

# 导出汇总
summary.to_excel('利润汇总_按款式.xlsx', index=False, engine='openpyxl')
print("\n已导出汇总：利润汇总_按款式.xlsx")
