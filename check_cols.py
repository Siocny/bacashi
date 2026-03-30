import pandas as pd
import openpyxl
import os
import glob
import warnings
import sys
warnings.filterwarnings('ignore')

folder = r'C:\Users\Administrator\Desktop\卡斐乐月报'
files = glob.glob(os.path.join(folder, '*2511*'))
xl_file = files[0]

# 读取签收数据
detail_df = pd.read_excel(xl_file, sheet_name='签收数据')

print("签收数据列名（原始字节）:")
for i, col in enumerate(detail_df.columns):
    # 显示列名的字节表示
    if isinstance(col, str):
        print(f"  {i+1}. {col} (len={len(col)})")
    else:
        print(f"  {i+1}. {repr(col)}")

# 查找包含关键文字的列
print("\n\n查找关键列:")
keywords = ['实付', '成本', '利润', '收入', '结算', '商家', '金额']

for keyword in keywords:
    matches = [c for c in detail_df.columns if keyword in str(c)]
    if matches:
        print(f"\n包含'{keyword}'的列：{matches}")
