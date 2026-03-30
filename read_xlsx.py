import pandas as pd

# 读取 Excel 文件
file_path = r"C:/Users/Administrator/Desktop/徕本日超过一百单的链接统计.xlsx"
df = pd.read_excel(file_path, engine='openpyxl')

# 重命名列为有意义的名称
df.columns = ['店铺', '品名', '销量', '链接', '品图']

print("=" * 60)
print("竞品数据分析")
print("=" * 60)
print(f"\n总数据条数：{len(df)} 条")
print(f"\n列名：{list(df.columns)}")
print("\n" + "=" * 60)
print("完整数据列表")
print("=" * 60)

for i, row in df.iterrows():
    print(f"\n{i+1}. [{row['店铺']}]")
    print(f"   品名：{row['品名']}")
    print(f"   销量：{row['销量']}")
    print(f"   链接：{row['链接']}")

# 统计分析
print("\n" + "=" * 60)
print("统计分析")
print("=" * 60)

# 按店铺分组
print("\n【按店铺分布】")
shop_count = df['店铺'].value_counts()
for shop, count in shop_count.items():
    print(f"  {shop}: {count} 个链接")

# 按品名分组
print("\n【按品名分布】")
product_count = df['品名'].value_counts()
for prod, count in product_count.items():
    print(f"  {prod}: {count} 个链接")

# 销量分布
print("\n【按销量分布】")
sales_count = df['销量'].value_counts()
for sales, count in sales_count.items():
    print(f"  {sales}: {count} 个链接")
