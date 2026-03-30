#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
拼多多黑标品牌爬虫脚本
功能：抓取拼多多 4 分以上的黑标品牌，且支持贴牌授权的品牌信息

注意事项：
1. 请遵守拼多多 robots.txt 协议
2. 控制请求频率，避免被封 IP
3. 仅用于合法的数据采集目的
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import random
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict
import re


@dataclass
class BrandInfo:
    """品牌信息数据类"""
    brand_name: str           # 品牌名称
    score: float              # 品牌评分
    is_black_label: bool      # 是否黑标
    oem_available: bool       # 是否支持贴牌
    category: str             # 类目
    description: str          # 品牌描述
    product_count: int        # 商品数量
    url: str                  # 品牌页面链接


class PDDBrandCrawler:
    """拼多多品牌爬虫类"""

    def __init__(self):
        self.base_url = "https://mobile.yangkeduo.com"
        self.api_base = "https://api.pinduoduo.com"
        self.session = requests.Session()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Referer": "https://mobile.yangkeduo.com/",
            "X-Requested-With": "com.xunmeng.pinduoduo",
        }
        self.results: List[BrandInfo] = []

    def _get_request_signature(self, params: Dict) -> str:
        """
        生成请求签名（简化版本）
        实际拼多多 API 需要复杂的签名算法，这里仅做演示
        """
        # 注意：真实的签名算法需要逆向分析拼多多 App
        # 这里使用简化版本，实际使用需要更完善的实现
        import hashlib
        sorted_params = sorted(params.items())
        param_str = "&".join(f"{k}={v}" for k, v in sorted_params)
        return hashlib.md5(param_str.encode()).hexdigest()

    def _make_request(self, url: str, params: Optional[Dict] = None,
                      retry: int = 3) -> Optional[Dict]:
        """发送 HTTP 请求"""
        for i in range(retry):
            try:
                response = self.session.get(
                    url,
                    params=params,
                    headers=self.headers,
                    timeout=15
                )
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 403:
                    print(f"请求被拒绝 (403)，等待后重试...")
                    time.sleep(5)
                else:
                    print(f"请求失败：{response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"请求异常：{e}")

            if i < retry - 1:
                wait_time = random.uniform(2, 5)
                time.sleep(wait_time)

        return None

    def search_brands_by_keyword(self, keyword: str,
                                  min_score: float = 4.0) -> List[BrandInfo]:
        """
        通过关键词搜索品牌

        Args:
            keyword: 搜索关键词
            min_score: 最低评分要求

        Returns:
            品牌信息列表
        """
        brands = []

        # 拼多多移动端搜索接口（示例）
        # 注意：实际 API 可能需要更新
        search_url = f"{self.base_url}/api/search"
        params = {
            "q": keyword,
            "page": 1,
            "size": 20,
            "sort": 0,
        }

        result = self._make_request(search_url, params)
        if result:
            # 解析搜索结果
            items = result.get("data", {}).get("items", [])
            for item in items:
                brand_info = self._parse_search_item(item, min_score)
                if brand_info:
                    brands.append(brand_info)

        return brands

    def _parse_search_item(self, item: Dict,
                           min_score: float) -> Optional[BrandInfo]:
        """解析搜索项为品牌信息"""
        try:
            # 提取品牌相关信息
            goods_name = item.get("goods_name", "")
            mall_name = item.get("mall_name", "")

            # 检查是否黑标（需要根据实际数据结构调整）
            is_black_label = item.get("brand", {}).get("is_black_label", False)

            # 提取评分
            score = item.get("lgst_score", 0) or item.get("mall_score", 0)

            if score < min_score:
                return None

            brand_info = BrandInfo(
                brand_name=mall_name or self._extract_brand(goods_name),
                score=score,
                is_black_label=is_black_label,
                oem_available=self._check_oem_available(item),
                category=item.get("cat_id", ""),
                description=goods_name,
                product_count=item.get("goods_num", 0),
                url=item.get("goods_url", "")
            )
            return brand_info
        except Exception as e:
            print(f"解析商品失败：{e}")
            return None

    def _extract_brand(self, goods_name: str) -> str:
        """从商品名称提取品牌名"""
        # 简单提取【】或 () 中的品牌名
        match = re.search(r'[[(](.+?)[)]', goods_name)
        if match:
            return match.group(1)
        return ""

    def _check_oem_available(self, item: Dict) -> bool:
        """检查是否支持贴牌授权"""
        # 检查商品描述中是否包含贴牌相关关键词
        goods_desc = item.get("goods_desc", "").lower()
        oem_keywords = ["贴牌", "oem", "代工", "授权", "品牌授权"]
        return any(kw in goods_desc for kw in oem_keywords)

    def get_black_label_brands(self, category_id: Optional[str] = None,
                                limit: int = 20) -> List[Dict]:
        """
        获取黑标品牌列表

        Args:
            category_id: 类目 ID，None 表示全类目
            limit: 返回数量限制

        Returns:
            品牌信息字典列表
        """
        url = f"{self.base_url}/api/brand/list"
        params = {
            "cat_id": category_id or "0",
            "page": 1,
            "size": limit,
            "black_label": 1,  # 黑标筛选
        }

        result = self._make_request(url, params)
        if result:
            return result.get("data", {}).get("brands", [])
        return []

    def crawl_brand_detail(self, brand_url: str) -> Optional[BrandInfo]:
        """获取品牌详细信息"""
        # 访问品牌页面获取详细信息
        headers = self.headers.copy()
        headers["Accept"] = "text/html,application/xhtml+xml"

        try:
            response = self.session.get(brand_url, headers=headers, timeout=15)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                # 解析页面获取品牌信息
                return self._parse_brand_page(soup, brand_url)
        except Exception as e:
            print(f"获取品牌详情失败：{e}")
        return None

    def _parse_brand_page(self, soup: BeautifulSoup,
                          url: str) -> Optional[BrandInfo]:
        """解析品牌页面"""
        try:
            # 查找品牌名称
            brand_name = ""
            name_tag = soup.find('h1', class_=re.compile(r'brand.*name', re.I))
            if name_tag:
                brand_name = name_tag.get_text(strip=True)

            # 查找评分
            score = 0.0
            score_tag = soup.find(string=re.compile(r'\d\.\d分'))
            if score_tag:
                match = re.search(r'(\d\.\d)', str(score_tag))
                if match:
                    score = float(match.group(1))

            # 查找是否支持贴牌
            oem_available = bool(soup.find(string=re.compile(r'贴牌 | 授权|OEM')))

            return BrandInfo(
                brand_name=brand_name,
                score=score,
                is_black_label=True,
                oem_available=oem_available,
                category="",
                description=soup.get_text()[:200],
                product_count=0,
                url=url
            )
        except Exception as e:
            print(f"解析品牌页面失败：{e}")
            return None

    def save_to_json(self, filename: str = "brands_result.json"):
        """保存结果到 JSON 文件"""
        data = [asdict(brand) for brand in self.results]
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"结果已保存到 {filename}")

    def save_to_csv(self, filename: str = "brands_result.csv"):
        """保存结果到 CSV 文件"""
        import csv
        if not self.results:
            print("没有数据可保存")
            return

        with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=asdict(self.results[0]).keys())
            writer.writeheader()
            for brand in self.results:
                writer.writerow(asdict(brand))
        print(f"结果已保存到 {filename}")


def main():
    """主函数 - 示例用法"""
    crawler = PDDBrandCrawler()

    # 搜索关键词列表（可以添加更多）
    keywords = [
        "品牌", "旗舰店", "黑标", "授权",
        "美妆", "服饰", "家居", "数码",
        "食品", "母婴", "家纺", "家电"
    ]

    print("=" * 60)
    print("拼多多黑标品牌爬虫")
    print("=" * 60)

    # 方式 1: 通过搜索获取品牌
    print("\n[方式 1] 通过关键词搜索品牌...")
    for keyword in keywords[:5]:  # 只搜索前 5 个关键词
        print(f"搜索关键词：{keyword}")
        brands = crawler.search_brands_by_keyword(keyword, min_score=4.0)
        crawler.results.extend(brands)
        time.sleep(random.uniform(1, 3))  # 避免请求过快

    # 方式 2: 直接获取黑标品牌列表
    print("\n[方式 2] 获取黑标品牌列表...")
    black_labels = crawler.get_black_label_brands(limit=20)
    print(f"获取到 {len(black_labels)} 个黑标品牌")

    # 去重并过滤
    seen_names = set()
    unique_brands = []
    for brand in crawler.results:
        if brand.brand_name and brand.brand_name not in seen_names:
            seen_names.add(brand.brand_name)
            if brand.score >= 4.0 and brand.is_black_label:
                unique_brands.append(brand)

    # 取前 20 个
    crawler.results = unique_brands[:20]

    # 输出结果
    print("\n" + "=" * 60)
    print(f"找到 {len(crawler.results)} 个符合条件的黑标品牌:")
    print("=" * 60)

    for i, brand in enumerate(crawler.results, 1):
        print(f"\n{i}. {brand.brand_name}")
        print(f"   评分：{brand.score}")
        print(f"   支持贴牌：{'是' if brand.oem_available else '否'}")
        print(f"   类目：{brand.category}")

    # 保存结果
    crawler.save_to_json()
    crawler.save_to_csv()

    print("\n完成!")


if __name__ == "__main__":
    main()
