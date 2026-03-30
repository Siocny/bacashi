import pandas as pd
from PIL import Image, ImageDraw, ImageFont
import os
import glob

# ==================== 配置区域 ====================
INPUT_DIR = r"C:/Users/Administrator/Desktop"
OUTPUT_DIR = r"e:/dev/aitest/detail_images_pro"

# 尺寸配置
IMAGE_WIDTH = 750
SECTION_HEIGHT = 1200

# 配色方案 - 高端蓝灰风格
COLOR_PRIMARY = "#1E3A5F"     # 深蓝主色
COLOR_SECONDARY = "#2E5A8A"   # 辅助蓝
COLOR_ACCENT = "#E8B43F"      # 金色点缀
COLOR_TEXT_MAIN = "#1A1A1A"   # 主文字
COLOR_TEXT_SUB = "#666666"    # 副文字
COLOR_BG_LIGHT = "#F8F9FA"    # 浅灰背景
COLOR_BG_WHITE = "#FFFFFF"    # 白色背景

# 产品文案 - 可自定义
PRODUCT_COPYWRITING = {
    "brand": "倍卡西",
    "title": "USB 手持小风扇",
    "subtitle": "智能数显 | 五档风速 | 超长续航",
    "price": "29.9",
    "original_price": "59.9",
    "selling_points": [
        {"icon": "🌀", "title": "五档强劲风力", "desc": "1-5 档自由调节，3 秒快速降温"},
        {"icon": "🔋", "title": "2000mAh 大电池", "desc": "满电续航 12-24 小时，告别电量焦虑"},
        {"icon": "🔇", "title": "静音降噪技术", "desc": "运行声音低至 30dB，图书馆适用"},
        {"icon": "📱", "title": "智能数显屏幕", "desc": "实时显示电量档位，使用更安心"},
        {"icon": "✈️", "title": "可拆卸折叠", "desc": "一拧即拆，收纳更方便"},
        {"icon": "❄️", "title": "涡轮聚风设计", "desc": "风距可达 3 米，送风更集中"},
    ],
    "specs": [
        ("品名", "USB 手持风扇"),
        ("品牌", "倍卡西"),
        ("型号", "BK-F01"),
        ("电池容量", "2000mAh"),
        ("充电输入", "Type-C 5V/1A"),
        ("充电时间", "约 2-3 小时"),
        ("续航时间", "1 档 24h / 5 档 12h"),
        ("风速档位", "5 档调节"),
        ("噪音值", "≤30dB"),
        ("产品尺寸", "165 × 80 × 45mm"),
        ("产品重量", "约 180g"),
        ("适用场景", "通勤/办公/户外/宿舍"),
    ],
    "details": [
        "【智能数显 电量看得见】",
        "LED 高清显示屏，实时显示剩余电量和当前档位",
        "告别盲目使用，出行更安心",
        "",
        "【五档风速 满足不同需求】",
        "1 档柔风 | 2 档自然风 | 3 档清风 | 4 档强劲 | 5 档暴风",
        "无论日常通勤还是户外运动，总有一档适合你",
        "",
        "【可拆卸设计 收纳更方便】",
        "风扇头可拆卸设计，折叠后仅手机大小",
        "轻松放入包包口袋，随身携带无负担",
    ],
    "scenarios": [
        {"name": "通勤路上", "desc": "地铁公交 清凉随行", "emoji": "🚇"},
        {"name": "办公室", "desc": "桌面静音 不扰同事", "emoji": "💼"},
        {"name": "学生宿舍", "desc": "学习伴侣 夏日必备", "emoji": "📚"},
        {"name": "户外排队", "desc": "告别闷热 保持清爽", "emoji": "🎢"},
        {"name": "厨房做饭", "desc": "无惧油烟 清爽下厨", "emoji": "🍳"},
        {"name": "健身房", "desc": "运动降温 时刻清爽", "emoji": "💪"},
    ],
    "package_includes": [
        "USB 手持风扇 × 1",
        "Type-C 充电线 × 1",
        "挂绳 × 1",
        "说明书 × 1",
    ],
    "warranty": "【售后服务】7 天无理由退换 | 1 年质保 | 破损包赔",
}

def get_font(size, bold=False):
    """获取中文字体"""
    font_paths = [
        ("msyh.ttc", "微软雅黑"),
        ("simhei.ttf", "黑体"),
        ("simsun.ttc", "宋体"),
        ("STHeiti/MHeiti.ttc", "华文黑体"),
    ]
    for filename, name in font_paths:
        try:
            return ImageFont.truetype(f"C:/Windows/Fonts/{filename}", size)
        except:
            continue
    return ImageFont.load_default()

def create_header_section(width, height, product_imgs=None):
    """创建头部海报 - 高端渐变风格"""
    # 深蓝渐变背景
    img = Image.new("RGB", (width, height), COLOR_BG_WHITE)
    draw = ImageDraw.Draw(img)

    # 绘制渐变背景
    for y in range(height // 2 + 100):
        ratio = y / (height // 2 + 100)
        r = int(30 * ratio + 248 * (1-ratio))
        g = int(58 * ratio + 249 * (1-ratio))
        b = int(95 * ratio + 250 * (1-ratio))
        draw.line([(0, y), (width, y)], fill=f"#{int(r):02x}{int(g):02x}{int(b):02x}")

    # 装饰圆
    draw.ellipse([0, -100, 200, 100], fill="#FFFFFF15")
    draw.ellipse([width-200, height//2-100, width, height//2+100], fill="#FFFFFF15")

    font_brand = get_font(24)
    font_title = get_font(48, bold=True)
    font_subtitle = get_font(26)
    font_price = get_font(42, bold=True)
    font_original = get_font(24)

    # 品牌名
    draw.text((50, 50), PRODUCT_COPYWRITING["brand"], font=font_brand, fill="#FFFFFF80")

    # 标题
    title_bbox = draw.textbbox((0, 0), PRODUCT_COPYWRITING["title"], font=font_title)
    title_w = title_bbox[2] - title_bbox[0]
    draw.text(((width - title_w) // 2, 120), PRODUCT_COPYWRITING["title"], font=font_title, fill="#FFFFFF")

    # 副标题
    sub_bbox = draw.textbbox((0, 0), PRODUCT_COPYWRITING["subtitle"], font=font_subtitle)
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((width - sub_w) // 2, 190), PRODUCT_COPYWRITING["subtitle"], font=font_subtitle, fill="#E8B43F")

    # 产品图
    if product_imgs:
        try:
            product = Image.open(product_imgs[0]).convert("RGBA")
            max_w = width - 100
            max_h = height - 400
            product.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
            x = (width - product.width) // 2
            y = 260
            img.paste(product, (x, y), product if product.mode == "RGBA" else None)
        except Exception as e:
            print(f"产品图加载失败：{e}")

    # 价格区
    price_y = height - 150
    # 价格背景
    draw.rounded_rectangle([150, price_y, width-150, price_y+80], radius=40, fill="#FFFFFF")
    draw.rounded_rectangle([150, price_y, width-150, price_y+80], radius=40, outline=COLOR_ACCENT, width=3)

    # 原价
    draw.text((width//2 - 80, price_y + 10), f"¥{PRODUCT_COPYWRITING['original_price']}",
              font=font_original, fill="#999999")
    # 划线
    draw.line([(width//2 - 75, price_y + 35), (width//2 + 75, price_y + 35)], fill="#999999", width=2)

    # 现价
    draw.text((width//2 - 50, price_y + 35), f"¥", font=get_font(28), fill="#E83131")
    current_price_w = draw.textbbox((0, 0), PRODUCT_COPYWRITING["price"], font=font_price)[2]
    draw.text((width//2, price_y + 25), PRODUCT_COPYWRITING["price"], font=font_price, fill="#E83131")

    return img

def create_selling_points_section(width, height, product_imgs=None):
    """创建卖点区 - 卡片式布局"""
    img = Image.new("RGB", (width, height), COLOR_BG_LIGHT)
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_subtitle = get_font(22)
    font_point_title = get_font(24, bold=True)
    font_point_desc = get_font(20)

    # 标题区
    title_y = 60
    draw.text((50, title_y), "核心卖点", font=font_title, fill=COLOR_TEXT_MAIN)
    draw.text((50, title_y + 45), "WHY CHOOSE US", font=get_font(16), fill="#999999")

    # 装饰条
    draw.rectangle([50, title_y + 75, 150, title_y + 80], fill=COLOR_ACCENT)

    # 卖点卡片
    card_start_y = 180
    card_height = (height - card_start_y - 50) // 3
    card_margin = 30
    card_inner_margin = 20

    for i, point in enumerate(PRODUCT_COPYWRITING["selling_points"]):
        row = i // 2
        col = i % 2
        if row >= 3:
            break

        card_x = card_margin if col == 0 else width // 2 + card_margin // 2
        card_y = card_start_y + row * (card_height + card_margin)
        card_w = width // 2 - card_margin * 2
        card_h = card_height - card_margin

        # 卡片背景
        draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h],
                               radius=12, fill="#FFFFFF")
        # 阴影
        draw.rounded_rectangle([card_x + 2, card_y + 2, card_x + card_w, card_y + card_h - 4],
                               radius=12, outline="#EEEEEE", width=1)

        # 图标
        draw.text((card_x + card_inner_margin, card_y + card_inner_margin),
                  point["icon"], font=get_font(32), fill=COLOR_ACCENT)

        # 标题
        draw.text((card_x + card_inner_margin + 40, card_y + card_inner_margin + 5),
                  point["title"], font=font_point_title, fill=COLOR_TEXT_MAIN)

        # 描述
        draw.text((card_x + card_inner_margin + 40, card_y + card_inner_margin + 38),
                  point["desc"], font=font_point_desc, fill=COLOR_TEXT_SUB)

    return img

def create_detail_section(width, height):
    """创建详情文案区"""
    img = Image.new("RGB", (width, height), COLOR_BG_WHITE)
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_content = get_font(24)
    font_small = get_font(20)

    y = 60
    line_height = 42

    for text in PRODUCT_COPYWRITING["details"]:
        if text == "":
            y += 30
            continue
        if text.startswith("【") and text.endswith("】"):
            # 小标题
            draw.text((50, y), text, font=font_title, fill=COLOR_PRIMARY)
            y += line_height + 10
            # 装饰线
            draw.rectangle([50, y, 100, y + 3], fill=COLOR_ACCENT)
            y += 25
        else:
            draw.text((50, y), text, font=font_content, fill=COLOR_TEXT_SUB)
            y += line_height

    return img

def create_specs_section(width, height):
    """创建规格参数区 - 表格样式"""
    img = Image.new("RGB", (width, height), "#F5F7FA")
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_label = get_font(22, bold=True)
    font_value = get_font(22)

    # 标题
    title_y = 60
    draw.text((width // 2 - 80, title_y), "产品参数", font=font_title, fill=COLOR_TEXT_MAIN)
    draw.rectangle([width // 2 - 80, title_y + 45, width // 2 + 80, title_y + 48], fill=COLOR_ACCENT)

    # 规格表格
    start_y = 140
    row_height = 52
    margin_x = 60
    col_x = 220

    for i, (label, value) in enumerate(PRODUCT_COPYWRITING["specs"]):
        y = start_y + i * row_height

        # 背景
        bg_color = "#FFFFFF" if i % 2 == 0 else "#F8F9FA"
        draw.rectangle([margin_x, y - 8, width - margin_x, y + 38], fill=bg_color)

        # 标签
        draw.text((margin_x + 20, y + 8), label, font=font_label, fill=COLOR_TEXT_MAIN)

        # 值
        draw.text((col_x, y + 8), value, font=font_value, fill=COLOR_TEXT_SUB)

    return img

def create_scenario_section(width, height, product_imgs=None):
    """创建使用场景区 - 图文卡片"""
    img = Image.new("RGB", (width, height), COLOR_BG_WHITE)
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_name = get_font(26, bold=True)
    font_desc = get_font(20)

    # 标题
    title_y = 60
    draw.text((50, title_y), "使用场景", font=font_title, fill=COLOR_TEXT_MAIN)
    draw.text((50, title_y + 45), "MULTIPLE SCENARIOS", font=get_font(16), fill="#999999")
    draw.rectangle([50, title_y + 75, 150, title_y + 80], fill=COLOR_ACCENT)

    # 场景网格 2x3
    card_start_y = 180
    card_w = (width - 100) // 2
    card_h = (height - card_start_y - 80) // 3
    margin = 10

    for i, scenario in enumerate(PRODUCT_COPYWRITING["scenarios"]):
        if i >= 6:
            break
        row = i // 2
        col = i % 2

        x = 50 + col * (card_w + margin)
        y = card_start_y + row * (card_h + margin)

        # 卡片背景
        draw.rounded_rectangle([x, y, x + card_w, y + card_h], radius=8, fill="#F8F9FA")

        # 图标
        draw.ellipse([x + card_w // 2 - 35, y + 30, x + card_w // 2 + 35, y + 100],
                     fill="#FFFFFF")
        draw.text((x + card_w // 2 - 18, y + 45), scenario["emoji"], font=get_font(40))

        # 名称
        name_bbox = draw.textbbox((0, 0), scenario["name"], font=font_name)
        name_w = name_bbox[2] - name_bbox[0]
        draw.text((x + (card_w - name_w) // 2, y + card_h - 70),
                  scenario["name"], font=font_name, fill=COLOR_TEXT_MAIN)

        # 描述
        desc_bbox = draw.textbbox((0, 0), scenario["desc"], font=font_desc)
        desc_w = desc_bbox[2] - desc_bbox[0]
        draw.text((x + (card_w - desc_w) // 2, y + card_h - 35),
                  scenario["desc"], font=font_desc, fill=COLOR_TEXT_SUB)

    return img

def create_package_section(width, height):
    """创建包装清单区"""
    img = Image.new("RGB", (width, height), COLOR_BG_LIGHT)
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_item = get_font(24)

    # 标题
    title_y = 60
    draw.text((width // 2 - 100, title_y), "包装清单", font=font_title, fill=COLOR_TEXT_MAIN)
    draw.rectangle([width // 2 - 100, title_y + 45, width // 2 + 100, title_y + 48], fill=COLOR_ACCENT)

    # 清单
    y = 150
    for i, item in enumerate(PRODUCT_COPYWRITING["package_includes"]):
        # 序号
        draw.ellipse([80, y - 12, 110, y + 18], fill=COLOR_ACCENT)
        draw.text((88, y - 10), str(i + 1), font=get_font(18, bold=True), fill="#FFFFFF")

        # 项目
        draw.text((140, y - 8), item, font=font_item, fill=COLOR_TEXT_MAIN)
        y += 60

    return img

def create_trust_section(width, height):
    """创建信任背书区"""
    img = Image.new("RGB", (width, height), COLOR_PRIMARY)
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_guarantee = get_font(22)
    font_warranty = get_font(20)

    # 标题
    title_y = 80
    draw.text((width // 2 - 100, title_y), "购物保障", font=font_title, fill="#FFFFFF")

    # 保障项
    guarantees = [
        ("🚚", "极速发货", "48 小时内发出"),
        ("🛡️", "正品保证", "官方授权"),
        ("🔄", "7 天退换", "无理由退换"),
        ("📞", "售后无忧", "1 年质保"),
    ]

    start_y = 180
    gap = width // 4

    for i, (emoji, title, desc) in enumerate(guarantees):
        x = gap * i + gap // 2 - 50
        draw.text((x, start_y), emoji, font=get_font(36))
        draw.text((x - 20, start_y + 50), title, font=get_font(20, bold=True), fill="#FFFFFF")
        draw.text((x - 30, start_y + 80), desc, font=font_guarantee, fill="#FFFFFF80")

    # 售后承诺
    warranty_y = height - 100
    draw.text((50, warranty_y), PRODUCT_COPYWRITING["warranty"],
              font=font_warranty, fill="#FFFFFF")

    return img

def create_promotion_banner(width, height=200):
    """创建促销横幅"""
    img = Image.new("RGB", (width, height), "#E83131")
    draw = ImageDraw.Draw(img)

    font_main = get_font(48, bold=True)
    font_sub = get_font(24)

    # 渐变效果
    for x in range(width):
        alpha = int(1 - (x / width) * 0.5)
        r = int(232 * alpha)
        g = int(49 * alpha)
        b = int(49 * alpha)
        draw.line([(x, 0), (x, height)], fill=f"#{int(r):02x}{int(g):02x}{int(b):02x}")

    draw.text((50, 50), "限时特惠", font=font_main, fill="#FFFFFF")
    draw.text((50, 120), f"原价¥{PRODUCT_COPYWRITING['original_price']}  现价¥{PRODUCT_COPYWRITING['price']}",
              font=font_sub, fill="#FFEBEE")

    return img

def find_product_images(input_dir):
    """查找产品图片"""
    patterns = ["*.jpg", "*.jpeg", "*.png", "*.PNG", "*.JPG", "*.JPEG"]
    images = []
    for pattern in patterns:
        images.extend(glob.glob(os.path.join(input_dir, pattern)))

    images = [f for f in images if not os.path.basename(f).startswith("~$")]

    # 优先选择用户指定的产品图片
    target_file = "2f8d0a5a-e993-46d3-b3db-ee56e0049826.png"
    sorted_images = []
    other_images = []

    for img in images:
        if target_file in img:
            sorted_images.insert(0, img)  # 放到最前面
        else:
            other_images.append(img)

    sorted_images.extend(other_images)
    return sorted_images[:10]

def main():
    print("=" * 60)
    print("电商详情图生成工具 - 专业版")
    print("=" * 60)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    product_images = find_product_images(INPUT_DIR)
    print(f"\n找到产品图片：{len(product_images)} 张")
    for img in product_images:
        print(f"  - {os.path.basename(img)}")

    sections = [
        ("01_header.jpg", create_header_section, IMAGE_WIDTH, 750),
        ("02_selling_points.jpg", create_selling_points_section, IMAGE_WIDTH, SECTION_HEIGHT),
        ("03_detail.jpg", create_detail_section, IMAGE_WIDTH, 500),
        ("04_specs.jpg", create_specs_section, IMAGE_WIDTH, 700),
        ("05_scenario.jpg", create_scenario_section, IMAGE_WIDTH, SECTION_HEIGHT),
        ("06_package.jpg", create_package_section, IMAGE_WIDTH, 500),
        ("07_trust.jpg", create_trust_section, IMAGE_WIDTH, 400),
    ]

    print("\n开始生成详情图...")
    generated_files = []

    for filename, create_func, width, height in sections:
        try:
            print(f"  生成：{filename}...")

            if "header" in filename:
                img = create_func(width, height, product_images)
            elif "scenario" in filename:
                img = create_func(width, height, product_images)
            else:
                img = create_func(width, height)

            output_path = os.path.join(OUTPUT_DIR, filename)
            img.save(output_path, "JPEG", quality=95)
            generated_files.append(output_path)
            print(f"    已保存：{output_path}")

        except Exception as e:
            print(f"    生成失败：{e}")
            import traceback
            traceback.print_exc()

    # 生成完整长图
    print("\n正在拼接完整详情页...")
    try:
        images = [Image.open(f) for f in generated_files]
        total_height = sum(img.height for img in images)
        long_img = Image.new("RGB", (IMAGE_WIDTH, total_height), COLOR_BG_WHITE)

        y_offset = 0
        for img in images:
            long_img.paste(img, (0, y_offset))
            y_offset += img.height

        long_path = os.path.join(OUTPUT_DIR, "00_full_detail.jpg")
        long_img.save(long_path, "JPEG", quality=95)
        print(f"  完整详情页：{long_path}")
        generated_files.insert(0, long_path)

    except Exception as e:
        print(f"  拼接失败：{e}")

    print("\n" + "=" * 60)
    print("详情图生成完成!")
    print(f"输出目录：{OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
