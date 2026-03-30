import pandas as pd
import os

os.chdir(r"C:/Users/Administrator/Desktop")

# 查找文件
files = [f for f in os.listdir('.') if f.endswith('.xlsx') and not f.startswith('~$')]

# 找订单数据（昨天的日期是 2026-03-09）
order_file = None
template_file = None

for f in files:
    if '订单' in f or '20260309' in f or '20260310' in f:
        order_file = f
    if '利润' in f or '成本' in f or '价格' in f or 'KFL' in f:
        template_file = f

print("订单数据文件:", order_file)
print("利润模板文件:", template_file)

# 先读取 KFL 充气泵.xlsx 和利润报表
print("\n=== 读取 KFL 充气泵.xlsx ===")
df_kfl = pd.read_excel('KFL 充气泵.xlsx', engine='openpyxl')
print(f"行数：{len(df_kfl)}")
print(f"列名：{df_kfl.columns.tolist()}")
print("\n前 5 行数据:")
print(df_kfl.head())

print("\n=== 读取利润报表_20260310_1415.xlsx ===")
df_profit = pd.read_excel('利润报表_20260310_1415.xlsx', engine='openpyxl')
print(f"行数：{len(df_profit)}")
print(f"列名：{df_profit.columns.tolist()}")
print("\n前 5 行数据:")
print(df_profit.head())
