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

print("=" * 70)
print("          卡斐乐 2025 年 11 月利润月报 详细检查报告")
print("=" * 70)

# 读取签收数据
detail_df = pd.read_excel(xl_file, sheet_name='签收数据')

print(f"\n签收数据：{len(detail_df)} 行 x {len(detail_df.columns)} 列")

# 显示所有列名
print("\n【所有列名】")
for i, col in enumerate(detail_df.columns):
    print(f"  {i+1}. '{col}'")

# 检查关键列的实际数据
print("\n【关键列数据检查】")
key_cols = ['用户实付金额 (元)', '结算金额', '总成本', '单成本', '利润', '毛利']

for col in key_cols:
    if col in detail_df.columns:
        data = detail_df[col]
        print(f"\n'{col}':")
        print(f"  数据类型：{data.dtype}")
        print(f"  非空数量：{data.notna().sum()}")
        print(f"  前 5 个值：{data.head().tolist()}")

        # 尝试转换为数值
        numeric = pd.to_numeric(data, errors='coerce')
        print(f"  转换后总和：{numeric.sum():,.2f}")
    else:
        # 查找相似列
        similar = [c for c in detail_df.columns if col[:2] in str(c)]
        if similar:
            print(f"\n'{col}' - 未找到，相似列：{similar}")
        else:
            print(f"\n'{col}' - 未找到")

# 读取汇总表
print("\n" + "=" * 70)
print("汇总表数据")
print("=" * 70)

total_df = pd.read_excel(xl_file, sheet_name='汇总表')
print(f"\n汇总表：{len(total_df)} 行 x {len(total_df.columns)} 列")

print("\n【汇总表列名】")
for i, col in enumerate(total_df.columns):
    print(f"  {i+1}. '{col}'")

# 读取月报表
print("\n" + "=" * 70)
print("月报表数据")
print("=" * 70)

month_df = pd.read_excel(xl_file, sheet_name='月报表')
print(f"\n月报表：{len(month_df)} 行 x {len(month_df.columns)} 列")

print("\n【月报表列名】")
for i, col in enumerate(month_df.columns):
    print(f"  {i+1}. '{col}'")

# 显示月报表前几行
print("\n【月报表前 10 行】")
print(month_df.head(10).to_string())
