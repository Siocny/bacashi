import pandas as pd
import json

file_path = r"C:/Users/Administrator/Desktop/徕本日超过一百单的链接统计.xlsx"
df = pd.read_excel(file_path, engine='openpyxl')

# 获取原始数据
data = []
for i, row in df.iterrows():
    data.append({
        'shop': str(row.iloc[0]),
        'product': str(row.iloc[1]),
        'sales': str(row.iloc[2]),
        'link': str(row.iloc[3])
    })

# 输出 JSON 格式便于分析
print(json.dumps(data, ensure_ascii=False, indent=2))
