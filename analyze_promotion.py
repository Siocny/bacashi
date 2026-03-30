import pandas as pd

file_path = r"C:/Users/Administrator/Desktop/商品推广_分小时数据_20260309 至 20260309.xlsx"
df = pd.read_excel(file_path, engine='openpyxl')

print("=" * 60)
print("推广数据分析")
print("=" * 60)
print(f"\n列名：{df.columns.tolist()}")
print(f"数据行数：{len(df)}")
print("\n" + "=" * 60)
print("完整数据")
print("=" * 60)
print(df.to_string())

# 汇总统计
print("\n" + "=" * 60)
print("汇总统计")
print("=" * 60)

#  numeric columns
numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
print(f"\n数值列：{numeric_cols.tolist()}")

for col in numeric_cols:
    total = df[col].sum()
    avg = df[col].mean()
    print(f"\n{col}:")
    print(f"  总计：{total:,.2f}")
    print(f"  平均：{avg:,.2f}")
