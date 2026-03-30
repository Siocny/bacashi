# 拼多多黑标品牌爬虫

## 项目说明

本项目提供多种方式来采集拼多多黑标品牌数据（4 分以上、支持贴牌授权）。

## 文件结构

```
pdd-crawler/
├── pdd_brand_crawler.py    # 基础爬虫框架
├── pdd_brand_collector.py  # 推荐采集工具（含示例数据）
├── requirements.txt        # 依赖包
└── README.md              # 说明文档
```

## 安装依赖

```bash
cd pdd-crawler
pip install -r requirements.txt
```

如需使用 Selenium 自动化采集，还需安装：
```bash
pip install selenium webdriver-manager pandas
```

## 使用方法

### 方法 1: 运行示例数据（推荐先测试）

```bash
python pdd_brand_collector.py
```

这将展示 20 个示例品牌数据的格式和输出结果。

### 方法 2: Selenium 自动化采集

```python
from pdd_brand_collector import PDDBrandCollector

collector = PDDBrandCollector()
brands = collector.collect_with_selenium()
collector.brands = brands
collector.save_json()
```

### 方法 3: 手动采集数据导入

1. 先运行脚本生成模板：
```python
from pdd_brand_collector import PDDBrandCollector
collector = PDDBrandCollector()
collector.load_manual_data("brands_template.csv")  # 会创建模板文件
```

2. 在 Excel/CSV 中填写采集到的品牌数据

3. 重新加载数据：
```python
brands = collector.load_manual_data("brands_template.csv")
```

## 数据采集建议

### 拼多多品牌入口
1. 拼多多 APP → 品牌好货频道
2. 拼多多网页版品牌馆
3. 拼多多品牌合作平台（用于查询授权信息）

### 黑标品牌识别
- 品牌名称旁有黑色"品牌"标识
- 店铺评分通常在 4.5 分以上
- 商品描述、物流、服务评分均为高分

### 贴牌授权查询
- 查看品牌是否有"品牌授权"标识
- 商品详情页是否有 OEM 相关信息
- 联系品牌方客服确认

## 注意事项

⚠️ **法律合规**
- 请遵守拼多多 robots.txt 协议
- 仅采集公开数据
- 不要用于商业竞争等不当用途

⚠️ **技术限制**
- 拼多多有严格的反爬机制
- API 签名算法需要逆向分析
- 建议控制请求频率（间隔 2-5 秒）

⚠️ **数据准确性**
- 示例数据仅供参考格式
- 实际品牌信息请以拼多多平台为准
- 授权信息需与品牌方确认

## 替代方案

如果爬虫无法满足需求，建议考虑：

1. **官方渠道**
   - 拼多多品牌合作平台
   - 拼多多开放平台 API

2. **第三方数据服务**
   - 蝉妈妈（电商数据分析）
   - 飞瓜数据（拼多多数据分析）
   - 考古加（拼多多选品工具）

3. **手动采集**
   - 使用本项目的 CSV 模板整理数据
   - 适合小批量精确采集

## 输出示例

```json
[
  {
    "brand_name": "珀莱雅",
    "score": 4.8,
    "category": "美妆",
    "oem_available": true,
    "description": "国货美妆品牌",
    "source": "sample"
  }
]
```
