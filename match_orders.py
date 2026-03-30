import pandas as pd
import os

os.chdir(r"C:/Users/Administrator/Desktop")

# 读取订单数据
order_file = '9a369ab99f7dc6490b176180c4185a28orders_export2026-03-10-14-32-42.xlsx'
df_orders = pd.read_excel(order_file, engine='openpyxl')

# 读取利润模板
template_file = 'KFL 充气泵.xlsx'
df_template = pd.read_excel(template_file, engine='openpyxl')

print("=== 订单数据列名 ===")
for i, col in enumerate(df_orders.columns):
    print(f"{i+1}. {col}")

print("\n=== 模板数据列名 ===")
for i, col in enumerate(df_template.columns):
    print(f"{i+1}. {col}")

# 显示模板关键列
print("\n=== 模板款式和规格列 ===")
template_cols = df_template.columns.tolist()
# 找到款式、规格、成本列
print(df_template[template_cols[:10]].head(10).to_string())

# 显示订单关键列
print("\n=== 订单商品列 ===")
order_cols = df_orders.columns.tolist()
print(df_orders[order_cols[:15]].head(10).to_string())
