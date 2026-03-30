import pandas as pd
import openpyxl
import os
import glob
import warnings
warnings.filterwarnings('ignore')

# 查找文件
desktop = r'C:\Users\Administrator\Desktop'
files = glob.glob(os.path.join(desktop, '运营绩效*.xlsx'))
print("找到的文件:")
for f in files:
    print(f"  {f}")

if not files:
    print("未找到文件")
    exit()

xl_file = files[0]
print(f"\n读取文件：{xl_file}\n")

# 获取所有工作表
xl = pd.ExcelFile(xl_file)
print('=== 工作表名称 ===')
for i, s in enumerate(xl.sheet_names):
    print(f"{i+1}. {s}")
print()

# 读取每个工作表并分析
results = []
for sheet in xl.sheet_names:
    try:
        # 跳过空行，从第 2 行开始读取
        df = pd.read_excel(xl_file, sheet_name=sheet, header=1)
        print(f'=== {sheet} ===')
        print(f'行列数：{df.shape}')
        print(f'列名：{list(df.columns)}')

        print(f'\n前 20 行数据:')
        print(df.head(20).to_string())

        print(f'\n前 20 行数据:')
        print(df.head(20).to_string())

        # 检查空值
        null_count = df.isnull().sum().sum()
        print(f'\n空值数量：{null_count}')

        print('\n' + '='*50 + '\n')
    except Exception as e:
        print(f'=== {sheet} === 读取错误：{e}\n')

print("\n=== 检查完成 ===")
