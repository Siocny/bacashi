import pandas as pd
import openpyxl
import os
import glob
import warnings
import sys
warnings.filterwarnings('ignore')

# 设置 UTF-8 输出
sys.stdout.reconfigure(encoding='utf-8')

# 查找文件
folder = r'C:\Users\Administrator\Desktop\卡斐乐月报'
files = glob.glob(os.path.join(folder, '*2511*'))
xl_file = files[0]
xl = pd.ExcelFile(xl_file)

print("=" * 60)
print("卡斐乐 2511 月报 数据检查报告")
print("=" * 60)

# 读取关键工作表
sheets_to_check = {}
for sheet in xl.sheet_names:
    df = pd.read_excel(xl_file, sheet_name=sheet)
    sheets_to_check[sheet] = df

print(f"\n工作表列表：{list(sheets_to_check.keys())}")

# 1. 检查总表数据
print("\n" + "=" * 60)
print("[1] 总体数据核对")
print("=" * 40)

if '总表' in sheets_to_check:
    total_df = sheets_to_check['总表']
    print(f"总表行列数：{total_df.shape}")
    print(f"\n总表前 5 行：")
    for idx, row in total_df.head(5).iterrows():
        print(row.to_dict())

# 2. 检查签单明细（核心数据）
print("\n" + "=" * 60)
print("[2] 签单明细数据核对")
print("=" * 40)

if '签单明细' in sheets_to_check:
    detail_df = sheets_to_check['签单明细']
    print(f"签单明细行数：{len(detail_df)}")
    print(f"签单明细列数：{len(detail_df.columns)}")
    print(f"\n列名列表：")
    for i, col in enumerate(detail_df.columns):
        print(f"  {i+1}. {col}")

    # 查找关键金额列
    print("\n关键金额列分析：")
    for col in detail_df.columns:
        col_str = str(col)
        if any(x in col_str for x in ['实付', '结算', '成本', '利润', '收入', '金额']):
            numeric_data = pd.to_numeric(detail_df[col], errors='coerce')
            valid_count = numeric_data.notna().sum()
            if valid_count > 0:
                print(f"\n  {col}:")
                print(f"    有效数据量：{valid_count}")
                print(f"    总和：{numeric_data.sum():.2f}")
                print(f"    平均值：{numeric_data.mean():.2f}")
                print(f"    最小值：{numeric_data.min()}")
                print(f"    最大值：{numeric_data.max()}")
                print(f"    负值数量：{(numeric_data < 0).sum()}")
                print(f"    零值数量：{(numeric_data == 0).sum()}")

# 3. 检查成本数据
print("\n" + "=" * 60)
print("[3] 成本数据核对")
print("=" * 40)

for sheet_name in ['成本 1', '成本 2', '商品成本', '物流成本']:
    if sheet_name in sheets_to_check:
        cost_df = sheets_to_check[sheet_name]
        print(f"\n{sheet_name}: {cost_df.shape[0]}行 x {cost_df.shape[1]}列")

        # 查找成本列
        for col in cost_df.columns:
            if '成本' in str(col):
                numeric_data = pd.to_numeric(cost_df[col], errors='coerce')
                if numeric_data.notna().sum() > 0:
                    print(f"  {col}: 总和={numeric_data.sum():.2f}, 平均={numeric_data.mean():.2f}")

# 4. 检查售后/退款
print("\n" + "=" * 60)
print("[4] 售后/退款核对")
print("=" * 40)

if '售后订单' in sheets_to_check:
    refund_df = sheets_to_check['售后订单']
    print(f"售后订单数：{len(refund_df)}")

    for col in refund_df.columns:
        if any(x in str(col) for x in ['退款', '实付', '金额', '结算']):
            data = pd.to_numeric(refund_df[col], errors='coerce')
            if data.notna().sum() > 0:
                print(f"  {col}: 总和={data.sum():.2f}, 非空={data.notna().sum()}")

# 5. 检查平台流水
print("\n" + "=" * 60)
print("[5] 平台流水核对")
print("=" * 40)

if '平台流水' in sheets_to_check:
    flow_df = sheets_to_check['平台流水']
    print(f"流水记录数：{len(flow_df)}")

    for col in flow_df.columns:
        if any(x in str(col) for x in ['收', '支', '入', '出', '金额']):
            data = pd.to_numeric(flow_df[col], errors='coerce')
            if data.notna().sum() > 0:
                positive = data[data>0].sum()
                negative = data[data<0].sum()
                print(f"  {col}: 收入={positive:.2f}, 支出={negative:.2f}, 净额={positive+negative:.2f}")

# 6. 利润计算验证
print("\n" + "=" * 60)
print("[6] 利润计算验证")
print("=" * 40)

if '签单明细' in sheets_to_check:
    detail_df = sheets_to_check['签单明细']

    # 自动查找可能的收入和成本列
    revenue_cols = []
    cost_cols = []
    profit_cols = []

    for col in detail_df.columns:
        col_str = str(col)
        if any(x in col_str for x in ['实付', '结算', '到账', '收入']):
            revenue_cols.append(col)
        if any(x in col_str for x in ['成本', '总成本']):
            cost_cols.append(col)
        if any(x in col_str for x in ['利润', '盈利', '毛利']):
            profit_cols.append(col)

    print(f"可能的收入列：{revenue_cols}")
    print(f"可能的成本列：{cost_cols}")
    print(f"可能的利润列：{profit_cols}")

    # 尝试验证利润公式
    if revenue_cols and cost_cols and profit_cols:
        for rev_col in revenue_cols[:1]:
            for cost_col in cost_cols[:1]:
                for prof_col in profit_cols[:1]:
                    revenue = pd.to_numeric(detail_df[rev_col], errors='coerce').fillna(0)
                    cost = pd.to_numeric(detail_df[cost_col], errors='coerce').fillna(0)
                    reported_profit = pd.to_numeric(detail_df[prof_col], errors='coerce').fillna(0)

                    calculated_profit = revenue - cost
                    diff = (calculated_profit - reported_profit).sum()
                    abs_diff = (calculated_profit - reported_profit).abs().sum()

                    print(f"\n验证公式：{rev_col} - {cost_col} = {prof_col}")
                    print(f"  收入总额：{revenue.sum():.2f}")
                    print(f"  成本总额：{cost.sum():.2f}")
                    print(f"  计算利润：{calculated_profit.sum():.2f}")
                    print(f"  报表利润：{reported_profit.sum():.2f}")
                    print(f"  差异总额：{diff:.2f}")
                    print(f"  绝对差异：{abs_diff:.2f}")

                    if abs_diff > 100:
                        print(f"  [警告] 利润计算存在较大差异！")
                    elif abs_diff > 0:
                        print(f"  [提示] 存在小额差异，可能是四舍五入导致")
                    else:
                        print(f"  [正确] 利润计算一致")

# 7. 数据汇总核对
print("\n" + "=" * 60)
print("[7] 各表数据汇总对比")
print("=" * 40)

summary = {}
for sheet_name, df in sheets_to_check.items():
    # 查找金额列并求和
    for col in df.columns:
        col_str = str(col).lower()
        if any(x in col_str for x in ['结算', '实付', '收入', '利润', '成本']):
            numeric_data = pd.to_numeric(df[col], errors='coerce')
            if numeric_data.notna().sum() > 0:
                key = f"{sheet_name}.{col}"
                summary[key] = numeric_data.sum()

# 按绝对值排序显示
sorted_summary = sorted(summary.items(), key=lambda x: abs(x[1]), reverse=True)
print("\n各表金额汇总（按绝对值排序）：")
for key, value in sorted_summary[:20]:
    print(f"  {key}: {value:.2f}")

# 8. 检查空值和异常
print("\n" + "=" * 60)
print("[8] 数据质量问题")
print("=" * 40)

for sheet_name, df in sheets_to_check.items():
    issues = []

    # 全空行
    empty_rows = df.isnull().all(axis=1).sum()
    if empty_rows > 0:
        issues.append(f"{empty_rows}个全空行")

    # 全空列
    empty_cols = df.isnull().all(axis=0).sum()
    if empty_cols > 0:
        issues.append(f"{empty_cols}个全空列")

    # 高比例空值列
    for col in df.columns:
        null_ratio = df[col].isnull().sum() / len(df)
        if null_ratio > 0.9 and df[col].notna().sum() > 0:
            issues.append(f"列'{col}'空值率{null_ratio*100:.1f}%")

    if issues:
        print(f"\n{sheet_name}:")
        for issue in issues:
            print(f"  - {issue}")

print("\n" + "=" * 60)
print("检查完成")
print("=" * 60)
