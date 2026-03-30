#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
拼多多品牌数据采集工具（推荐方案）

说明：
由于拼多多有严格的反爬机制，直接使用爬虫难度较大。
本脚本提供几种更可行的数据采集方案：

1. 使用 Selenium/Playwright 模拟浏览器
2. 使用第三方电商数据 API
3. 手动采集辅助工具

使用前请确保遵守相关法律法规和平台协议。
"""

import json
import time
import csv
from dataclasses import dataclass, asdict
from typing import List, Optional


@dataclass
class BrandInfo:
    """品牌信息"""
    brand_name: str           # 品牌名称
    score: float              # 品牌评分
    category: str             # 类目
    oem_available: bool       # 是否支持贴牌
    description: str          # 描述
    source: str               # 数据来源


class PDDBrandCollector:
    """
    拼多多品牌采集器

    提供多种数据采集方式：
    1. Selenium 自动化采集（需要浏览器环境）
    2. 手动采集数据整理工具
    3. API 数据导入工具
    """

    def __init__(self):
        self.brands: List[BrandInfo] = []

    # ==================== 方案 1: Selenium 自动化 ====================

    def collect_with_selenium(self, use_mobile: bool = True) -> List[BrandInfo]:
        """
        使用 Selenium 模拟浏览器采集

        需要安装: pip install selenium webdriver-manager
        """
        try:
            from selenium import webdriver
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.chrome.options import Options
        except ImportError:
            print("请先安装 selenium: pip install selenium")
            return []

        # 配置 Chrome 选项
        chrome_options = Options()
        if use_mobile:
            # 模拟移动设备
            mobile_emulation = {"deviceName": "iPhone 12"}
            chrome_options.add_experimental_option("mobileEmulation", mobile_emulation)
        chrome_options.add_argument("--headless")  # 无头模式

        driver = webdriver.Chrome(options=chrome_options)
        collected = []

        try:
            # 访问拼多多品牌页面
            driver.get("https://mobile.yangkeduo.com/mall_page.html")

            # 等待页面加载
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.CLASS_NAME, "mall-name"))
            )

            # 查找品牌元素（需要根据实际页面结构调整选择器）
            brand_elements = driver.find_elements(By.CSS_SELECTOR, ".brand-item")

            for elem in brand_elements[:20]:
                try:
                    brand = BrandInfo(
                        brand_name=elem.find_element(By.CLASS_NAME, "brand-name").text,
                        score=self._extract_score(elem),
                        category=elem.find_element(By.CLASS_NAME, "category").text,
                        oem_available=self._check_oem(elem),
                        description="",
                        source="selenium"
                    )
                    collected.append(brand)
                except Exception:
                    continue

        finally:
            driver.quit()

        return collected

    def _extract_score(self, element) -> float:
        """提取评分（Selenium 版本）"""
        try:
            score_text = element.find_element(By.CLASS_NAME, "score").text
            import re
            match = re.search(r'(\d\.\d)', score_text)
            return float(match.group(1)) if match else 0.0
        except:
            return 0.0

    def _check_oem(self, element) -> bool:
        """检查是否支持贴牌（Selenium 版本）"""
        try:
            text = element.text.lower()
            return any(kw in text for kw in ["贴牌", "oem", "授权", "代工"])
        except:
            return False

    # ==================== 方案 2: 手动采集模板 ====================

    def load_manual_data(self, filename: str) -> List[BrandInfo]:
        """从 CSV/Excel 文件加载手动采集的数据"""
        brands = []

        try:
            with open(filename, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    brand = BrandInfo(
                        brand_name=row.get('品牌名称', ''),
                        score=float(row.get('评分', 0)),
                        category=row.get('类目', ''),
                        oem_available=row.get('支持贴牌', '').lower() in ['是', 'yes', 'true'],
                        description=row.get('描述', ''),
                        source='manual'
                    )
                    brands.append(brand)
        except FileNotFoundError:
            print(f"文件不存在，创建模板文件：{filename}")
            self._create_manual_template(filename)

        return brands

    def _create_manual_template(self, filename: str):
        """创建手动采集模板"""
        template = [
            {"品牌名称": "示例品牌", "评分": "4.5", "类目": "服饰",
             "支持贴牌": "是", "描述": "品牌描述", "备注": ""}
        ]
        with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=template[0].keys())
            writer.writeheader()
            writer.writerows(template)
        print(f"模板已创建：{filename}")

    # ==================== 方案 3: API 数据导入 ====================

    def load_api_data(self, api_response: dict) -> List[BrandInfo]:
        """从 API 响应数据导入品牌信息"""
        brands = []
        data = api_response.get('data', [])

        for item in data:
            brand = BrandInfo(
                brand_name=item.get('brand_name', ''),
                score=float(item.get('score', 0)),
                category=item.get('category', ''),
                oem_available=item.get('oem_available', False),
                description=item.get('description', ''),
                source='api'
            )
            brands.append(brand)

        return brands

    # ==================== 数据输出 ====================

    def filter_brands(self, min_score: float = 4.0,
                      oem_only: bool = True,
                      limit: int = 20) -> List[BrandInfo]:
        """筛选品牌"""
        filtered = [
            b for b in self.brands
            if b.score >= min_score and (not oem_only or b.oem_available)
        ]
        return filtered[:limit]

    def save_json(self, filename: str = "brands.json"):
        """保存为 JSON"""
        import sys
        data = [asdict(b) for b in self.brands]
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"已保存到：{filename}", file=sys.stderr)

    def save_excel(self, filename: str = "brands.xlsx"):
        """保存为 Excel"""
        try:
            import pandas as pd
            data = [asdict(b) for b in self.brands]
            df = pd.DataFrame(data)
            df.to_excel(filename, index=False)
            print(f"已保存到：{filename}")
        except ImportError:
            print("请安装 pandas: pip install pandas")


def collect_brand_samples() -> List[BrandInfo]:
    """
    收集 20 个拼多多 4 分 + 黑标品牌示例（需实际采集）

    以下是常见的黑标品牌类型示例：
    """
    sample_brands = [
        # 美妆护肤类
        BrandInfo("珀莱雅", 4.8, "美妆", True, "国货美妆品牌", "sample"),
        BrandInfo("自然堂", 4.7, "美妆", True, "护肤品牌", "sample"),
        BrandInfo("百雀羚", 4.6, "美妆", True, "经典国货", "sample"),

        # 服饰类
        BrandInfo("海澜之家", 4.5, "服饰", True, "男装品牌", "sample"),
        BrandInfo("太平鸟", 4.6, "服饰", True, "时尚服饰", "sample"),
        BrandInfo("波司登", 4.7, "服饰", False, "羽绒服品牌", "sample"),

        # 家居家纺
        BrandInfo("水星家纺", 4.8, "家居", True, "家纺品牌", "sample"),
        BrandInfo("罗莱家纺", 4.7, "家居", True, "床上用品", "sample"),
        BrandInfo("富安娜", 4.6, "家居", True, "家纺品牌", "sample"),

        # 食品
        BrandInfo("三只松鼠", 4.5, "食品", False, "休闲零食", "sample"),
        BrandInfo("良品铺子", 4.6, "食品", False, "零食品牌", "sample"),
        BrandInfo("百草味", 4.5, "食品", True, "休闲食品", "sample"),

        # 母婴
        BrandInfo("babycare", 4.7, "母婴", True, "母婴用品", "sample"),
        BrandInfo("好孩子", 4.6, "母婴", True, "婴童用品", "sample"),

        # 家电
        BrandInfo("小熊电器", 4.5, "家电", True, "小家电", "sample"),
        BrandInfo("九阳", 4.6, "家电", False, "厨房电器", "sample"),
        BrandInfo("苏泊尔", 4.7, "家电", True, "炊具电器", "sample"),

        # 数码
        BrandInfo("罗马仕", 4.5, "数码", True, "数码配件", "sample"),
        BrandInfo("品胜", 4.6, "数码", True, "数码周边", "sample"),
        BrandInfo("绿联", 4.7, "数码", True, "数码配件", "sample"),
    ]
    return sample_brands


def main():
    """主程序"""
    # 设置控制台编码为 UTF-8
    import os
    os.system('chcp 65001 > nul')

    print("=" * 60)
    print("拼多多黑标品牌采集工具")
    print("=" * 60)

    collector = PDDBrandCollector()

    # 使用示例数据（实际使用需要替换为真实采集）
    print("\n加载示例品牌数据...")
    sample_brands = collect_brand_samples()
    collector.brands = sample_brands

    # 筛选 4 分 + 且支持贴牌的品牌
    print("\n筛选条件：评分>=4.0 且支持贴牌授权")
    filtered = collector.filter_brands(min_score=4.0, oem_only=True, limit=20)

    print(f"\n符合条件的品牌数量：{len(filtered)}")
    print("\n" + "=" * 60)

    for i, brand in enumerate(filtered, 1):
        oem_mark = "Y" if brand.oem_available else "N"
        print(f"{i:2}. {brand.brand_name:15} 评分:{brand.score} 类目:{brand.category} 贴牌:{oem_mark}")

    # 保存结果
    collector.save_json("pdd_black_label_brands.json")
    collector.save_excel("pdd_black_label_brands.xlsx")

    print("\n" + "=" * 60)
    print("提示：以上为示例数据，实际使用请通过以下方式获取真实数据：")
    print("1. 运行 Selenium 自动化采集")
    print("2. 访问拼多多品牌频道手动采集")
    print("3. 使用第三方电商数据平台 API")
    print("=" * 60)


if __name__ == "__main__":
    main()
