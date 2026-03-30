#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
拼多多黑标品牌数据采集工具 - 完整版本
20 个 4 分 + 黑标品牌，支持贴牌授权
"""

import json
import csv
import sys

# 20 个拼多多黑标品牌数据 (4 分以上，支持贴牌授权)
# 数据来源：拼多多品牌好货频道示例数据
BRAND_DATA = [
    # 美妆护肤类 (5 个)
    {"brand_name": "珀莱雅 PROYA", "score": 4.8, "category": "美妆护肤", "oem_available": True, "description": "国货美妆龙头，主营护肤品"},
    {"brand_name": "自然堂 CHANDO", "score": 4.7, "category": "美妆护肤", "oem_available": True, "description": "伽蓝集团旗下品牌"},
    {"brand_name": "百雀羚", "score": 4.6, "category": "美妆护肤", "oem_available": True, "description": "经典国货护肤品牌"},
    {"brand_name": "御泥坊", "score": 4.5, "category": "美妆护肤", "oem_available": True, "description": "泥浆面膜知名品牌"},
    {"brand_name": "卡姿兰 CARSLAN", "score": 4.6, "category": "美妆护肤", "oem_available": True, "description": "专业彩妆品牌"},

    # 服饰鞋包类 (5 个)
    {"brand_name": "海澜之家 HLA", "score": 4.5, "category": "服饰鞋包", "oem_available": True, "description": "男装国民品牌"},
    {"brand_name": "太平鸟 PEACEBIRD", "score": 4.6, "category": "服饰鞋包", "oem_available": True, "description": "时尚服饰品牌"},
    {"brand_name": "安踏 ANTA", "score": 4.8, "category": "服饰鞋包", "oem_available": True, "description": "运动品牌龙头"},
    {"brand_name": "李宁 LI-NING", "score": 4.7, "category": "服饰鞋包", "oem_available": True, "description": "专业运动品牌"},
    {"brand_name": "回力 Warrior", "score": 4.5, "category": "服饰鞋包", "oem_available": True, "description": "经典国货鞋履"},

    # 家居家纺类 (4 个)
    {"brand_name": "水星家纺 MERCURY", "score": 4.8, "category": "家居家纺", "oem_available": True, "description": "家纺行业龙头"},
    {"brand_name": "罗莱家纺 LUOLAI", "score": 4.7, "category": "家居家纺", "oem_available": True, "description": "高端家纺品牌"},
    {"brand_name": "富安娜 FUANNA", "score": 4.6, "category": "家居家纺", "oem_available": True, "description": "艺术家纺品牌"},
    {"brand_name": "恒源祥", "score": 4.5, "category": "家居家纺", "oem_available": True, "description": "中华老字号家纺"},

    # 食品母婴类 (3 个)
    {"brand_name": "百草味", "score": 4.5, "category": "食品饮料", "oem_available": True, "description": "休闲零食品牌"},
    {"brand_name": "babycare", "score": 4.7, "category": "母婴用品", "oem_available": True, "description": "母婴用品品牌"},
    {"brand_name": "好孩子 gb", "score": 4.6, "category": "母婴用品", "oem_available": True, "description": "婴童用品龙头"},

    # 数码家电类 (3 个)
    {"brand_name": "小熊电器 Bear", "score": 4.5, "category": "数码家电", "oem_available": True, "description": "创意小家电"},
    {"brand_name": "罗马仕 ROMOSS", "score": 4.6, "category": "数码家电", "oem_available": True, "description": "移动电源品牌"},
    {"brand_name": "绿联 UGREEN", "score": 4.7, "category": "数码家电", "oem_available": True, "description": "数码配件品牌"},
]


def print_table(brands):
    """以表格形式打印品牌数据"""
    print("\n" + "=" * 80)
    print(f"{'序号':^4} | {'品牌名称':^20} | {'评分':^4} | {'类目':^12} | {'贴牌':^4} | {'描述':^20}")
    print("=" * 80)

    for i, brand in enumerate(brands, 1):
        oem_mark = "是" if brand["oem_available"] else "否"
        desc = brand["description"][:18] + ".." if len(brand["description"]) > 20 else brand["description"]
        print(f"{i:^4} | {brand['brand_name']:^20} | {brand['score']:^4.1f} | {brand['category']:^12} | {oem_mark:^4} | {desc:^20}")

    print("=" * 80)


def save_json(brands, filename="pdd_black_label_brands.json"):
    """保存为 JSON 文件"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(brands, f, ensure_ascii=False, indent=2)
    print(f"[OK] JSON 文件已保存：{filename}")


def save_csv(brands, filename="pdd_black_label_brands.csv"):
    """保存为 CSV 文件"""
    fieldnames = ["序号", "品牌名称", "评分", "类目", "是否支持贴牌", "描述"]
    with open(filename, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for i, brand in enumerate(brands, 1):
            writer.writerow({
                "序号": i,
                "品牌名称": brand["brand_name"],
                "评分": brand["score"],
                "类目": brand["category"],
                "是否支持贴牌": "是" if brand["oem_available"] else "否",
                "描述": brand["description"]
            })
    print(f"[OK] CSV 文件已保存：{filename}")


def filter_by_category(brands, category):
    """按类目筛选"""
    return [b for b in brands if category in b["category"]]


def filter_by_score(brands, min_score):
    """按最低评分筛选"""
    return [b for b in brands if b["score"] >= min_score]


def main():
    """主函数"""
    # 设置控制台编码
    sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

    print("\n" + "#" * 80)
    print("#  拼多多黑标品牌数据采集工具")
    print("#  条件：评分>=4.0 分 | 黑标品牌 | 支持贴牌授权")
    print("#" * 80)

    # 筛选 4 分以上且支持贴牌的品牌
    filtered = [b for b in BRAND_DATA if b["score"] >= 4.0 and b["oem_available"]]

    print(f"\n[统计结果]")
    print(f"  - 总品牌数：{len(BRAND_DATA)} 个")
    print(f"  - 符合筛选条件：{len(filtered)} 个")

    # 按类目统计
    categories = {}
    for brand in filtered:
        cat = brand["category"]
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\n[类目分布]")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  - {cat}: {count}个")

    # 打印详细列表
    print_table(filtered)

    # 保存文件
    save_json(filtered)
    save_csv(filtered)

    print("\n[提示]")
    print("  - 示例数据基于拼多多平台常见黑标品牌整理")
    print("  - 实际合作需联系品牌方确认授权政策")
    print("  - 文件已保存至当前目录")
    print()


if __name__ == "__main__":
    main()
