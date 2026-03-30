import pandas as pd
from PIL import Image, ImageDraw, ImageFont
import os
import glob

# ==================== 配置区域 ====================
# 输入输出目录
INPUT_DIR = r"C:/Users/Administrator/Desktop"  # 产品图片所在目录
OUTPUT_DIR = r"e:/dev/aitest/detail_images"   # 详情图输出目录

# 图片尺寸配置 (拼多多详情页推荐尺寸)
IMAGE_WIDTH = 750  # 详情页宽度
SECTION_HEIGHT = 1200  # 每个板块高度

# 颜色配置
COLOR_PRIMARY = "#FF6B00"     # 拼多多橙色主色调
COLOR_SECONDARY = "#FF9500"   # 辅助橙色
COLOR_TEXT_MAIN = "#333333"   # 主文字颜色
COLOR_TEXT_SUB = "#666666"    # 副文字颜色
COLOR_BG = "#FFFFFF"          # 背景色
COLOR_ACCENT = "#FFE4D1"      # 强调背景色

# 产品文案 (USB 手持风扇)
PRODUCT_COPYWRITING = {
    "title": "USB 手持小风扇",
    "subtitle": "迷你便携 强劲风力 持久续航",
    "price": "29.9 起",
    "selling_points": [
        ("三档风速", "强劲动力 快速降温"),
        ("超长续航", "充满可用 8-12 小时"),
        ("静音设计", "图书馆/办公室适用"),
        ("小巧便携", "随手可握 出行必备"),
        ("USB 充电", "随时随地 便捷补能"),
    ],
    "specs": [
        ("产品名称", "USB 手持风扇"),
        ("产品材质", "ABS+ 电子元件"),
        ("电池容量", "1200mAh"),
        ("充电时间", "约 2-3 小时"),
        ("使用时间", "8-12 小时（视档位而定）"),
        ("产品尺寸", "约 15cm x 7cm"),
        ("产品重量", "约 150g"),
        ("颜色", "多色可选"),
    ],
    "scenarios": [
        "通勤路上 清凉一夏",
        "办公室 静音不扰人",
        "学生宿舍 学习好伴侣",
        "户外排队 不再闷热",
    ]
}

# ==================== 工具函数 ====================

def get_font(size, bold=False):
    """获取中文字体"""
    # 尝试常见的中文字体路径
    font_paths = [
        "C:/Windows/Fonts/simhei.ttf",      # 黑体
        "C:/Windows/Fonts/simfang.ttf",     # 仿宋
        "C:/Windows/Fonts/simsun.ttc",      # 宋体
        "C:/Windows/Fonts/msyh.ttc",        # 微软雅黑
        "C:/Windows/Fonts/STHeiti/MHeiti.ttc",  # 华文黑体
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue
    # 默认字体
    return ImageFont.load_default()

def create_gradient_bg(width, height, color1, color2, direction="vertical"):
    """创建渐变背景"""
    img = Image.new("RGB", (width, height), color1)
    draw = ImageDraw.Draw(img)

    if direction == "vertical":
        for y in range(height):
            ratio = y / height
            r = int(color1[1:3], 16) * (1-ratio) + int(color2[1:3], 16) * ratio
            g = int(color1[3:5], 16) * (1-ratio) + int(color2[3:5], 16) * ratio
            b = int(color1[5:7], 16) * (1-ratio) + int(color2[5:7], 16) * ratio
            draw.line([(0, y), (width, y)], fill=f"#{int(r):02x}{int(g):02x}{int(b):02x}")
    return img

def draw_centered_text(draw, text, y, font, color, width):
    """绘制居中文本"""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    x = (width - text_width) // 2
    draw.text((x, y), text, font=font, fill=color)
    return y + bbox[3] - bbox[1] + 10

def create_header_section(width, height, product_img=None):
    """创建头部海报区"""
    # 渐变背景
    img = create_gradient_bg(width, height, "#FF8800", "#FFB347")
    draw = ImageDraw.Draw(img)
    font_title = get_font(48, bold=True)
    font_subtitle = get_font(28)
    font_price = get_font(36)

    # 绘制装饰元素
    draw.ellipse([50, 50, 150, 150], fill="#FFFFFF20")
    draw.ellipse([width-150, height-150, width-50, height-50], fill="#FFFFFF20")

    # 标题
    draw_centered_text(draw, PRODUCT_COPYWRITING["title"], 80, font_title, "#FFFFFF", width)

    # 副标题
    draw_centered_text(draw, PRODUCT_COPYWRITING["subtitle"], 150, font_subtitle, "#FFFFFF", width)

    # 产品图（如果有）
    if product_img:
        try:
            product = Image.open(product_img).convert("RGBA")
            # 调整产品图大小
            max_w = width - 100
            max_h = height - 300
            product.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)

            # 居中放置
            x = (width - product.width) // 2
            y = 220
            img.paste(product, (x, y), product if product.mode == "RGBA" else None)
        except Exception as e:
            print(f"加载产品图失败：{e}")

    # 价格标签
    price_bg_y = height - 120
    draw.rectangle([width//2 - 150, price_bg_y, width//2 + 150, price_bg_y + 60],
                   fill="#FFFFFF", outline="#FF6B00", width=3)
    draw_centered_text(draw, f"限时特价：{PRODUCT_COPYWRITING['price']}",
                       price_bg_y + 12, font_price, "#FF6B00", width)

    return img

def create_selling_points_section(width, height, product_imgs=None):
    """创建卖点展示区"""
    img = Image.new("RGB", (width, height), COLOR_BG)
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_point_title = get_font(28, bold=True)
    font_point_desc = get_font(22)

    # 标题区
    title_y = 50
    draw_centered_text(draw, "核心卖点", title_y, font_title, COLOR_TEXT_MAIN, width)

    # 装饰线
    line_y = title_y + 50
    line_x1 = width // 2 - 80
    draw.rectangle([line_x1, line_y, line_x1 + 160, line_y + 4], fill=COLOR_PRIMARY)

    # 卖点列表
    font_title = get_font(24, bold=True)
    font_desc = get_font(20)

    start_y = 150
    item_height = (height - start_y) // len(PRODUCT_COPYWRITING["selling_points"])

    for i, (point_title, point_desc) in enumerate(PRODUCT_COPYWRITING["selling_points"]):
        y = start_y + i * item_height + 20

        # 序号圆圈
        circle_x = 80
        draw.ellipse([circle_x - 20, y - 20, circle_x + 20, y + 20],
                     fill=COLOR_PRIMARY)
        draw.text((circle_x - 8, y - 14), str(i + 1),
                  font=get_font(18, bold=True), fill="#FFFFFF")

        # 卖点标题
        draw.text((130, y - 12), point_title, font=font_title, fill=COLOR_TEXT_MAIN)

        # 卖点描述
        draw.text((130, y + 20), point_desc, font=font_desc, fill=COLOR_TEXT_SUB)

        # 分隔线
        if i < len(PRODUCT_COPYWRITING["selling_points"]) - 1:
            draw.line([(50, y + 70), (width - 50, y + 70)], fill="#EEEEEE", width=2)

    return img

def create_specs_section(width, height):
    """创建规格参数区"""
    img = Image.new("RGB", (width, height), COLOR_ACCENT)
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_label = get_font(22, bold=True)
    font_value = get_font(22)

    # 标题
    title_y = 60
    draw_centered_text(draw, "产品规格", title_y, font_title, COLOR_TEXT_MAIN, width)

    # 装饰线
    line_y = title_y + 50
    line_x1 = width // 2 - 80
    draw.rectangle([line_x1, line_y, line_x1 + 160, line_y + 4], fill=COLOR_PRIMARY)

    # 规格表格
    start_y = 150
    row_height = 60
    margin_x = 80

    for i, (label, value) in enumerate(PRODUCT_COPYWRITING["specs"]):
        y = start_y + i * row_height

        # 背景条
        bg_color = "#FFFFFF" if i % 2 == 0 else "#FFFBF5"
        draw.rectangle([margin_x - 20, y - 10, width - margin_x + 20, y + 40],
                       fill=bg_color)

        # 标签
        draw.text((margin_x, y), f"{label}:", font=font_label, fill=COLOR_TEXT_MAIN)

        # 值
        value_x = margin_x + 200
        draw.text((value_x, y), value, font=font_value, fill=COLOR_TEXT_SUB)

    return img

def create_scenario_section(width, height, product_imgs=None):
    """创建使用场景区"""
    img = create_gradient_bg(width, height, "#FFF5EB", "#FFFFFF")
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_scenario = get_font(26)

    # 标题
    title_y = 60
    draw_centered_text(draw, "使用场景", title_y, font_title, COLOR_TEXT_MAIN, width)

    # 装饰线
    line_y = title_y + 50
    line_x1 = width // 2 - 80
    draw.rectangle([line_x1, line_y, line_x1 + 160, line_y + 4], fill=COLOR_PRIMARY)

    # 场景描述（配合产品图）
    scenarios = PRODUCT_COPYWRITING["scenarios"]
    start_y = 150
    item_height = (height - start_y) // len(scenarios)

    for i, scenario in enumerate(scenarios):
        y = start_y + i * item_height + 30

        # 图标背景
        icon_x = width // 2 - 150
        draw.ellipse([icon_x - 30, y - 30, icon_x + 30, y + 30],
                     fill=COLOR_PRIMARY)

        # 场景文字
        draw.text((icon_x + 50, y - 15), scenario, font=font_scenario, fill=COLOR_TEXT_MAIN)

    return img

def create_trust_section(width, height):
    """创建信任背书区"""
    img = Image.new("RGB", (width, height), "#FFF8F0")
    draw = ImageDraw.Draw(img)

    font_title = get_font(36, bold=True)
    font_guarantee = get_font(24)

    # 标题
    title_y = 60
    draw_centered_text(draw, "购物保障", title_y, font_title, COLOR_TEXT_MAIN, width)

    # 保障项
    guarantees = [
        "7 天无理由退换",
        "正品保证",
        "极速发货",
        "破损包赔"
    ]

    start_y = 150
    gap = width // 4

    for i, guarantee in enumerate(guarantees):
        x = gap * i + gap // 2
        draw.text((x - 60, start_y), guarantee, font=font_guarantee, fill=COLOR_TEXT_MAIN)

    # 底部行动号召
    cta_y = height - 100
    draw.rectangle([width//2 - 200, cta_y, width//2 + 200, cta_y + 60],
                   fill=COLOR_PRIMARY)
    draw_centered_text(draw, "立即抢购 享受清凉", cta_y + 15,
                       get_font(32, bold=True), "#FFFFFF", width)

    return img

def find_product_images(input_dir):
    """查找产品图片"""
    patterns = ["*.jpg", "*.jpeg", "*.png", "*.PNG", "*.JPG", "*.JPEG"]
    images = []
    for pattern in patterns:
        images.extend(glob.glob(os.path.join(input_dir, pattern)))

    # 排除临时文件
    images = [f for f in images if not os.path.basename(f).startswith("~$")]

    # 按文件名排序
    images.sort()
    return images[:10]  # 最多取 10 张

def main():
    """主函数"""
    print("=" * 60)
    print("电商详情图生成工具 - USB 手持风扇")
    print("=" * 60)

    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 查找产品图片
    product_images = find_product_images(INPUT_DIR)
    print(f"\n找到产品图片：{len(product_images)} 张")
    for img in product_images:
        print(f"  - {os.path.basename(img)}")

    # 生成各板块图片
    sections = [
        ("01_header.jpg", create_header_section, IMAGE_WIDTH, 800),
        ("02_selling_points.jpg", create_selling_points_section, IMAGE_WIDTH, SECTION_HEIGHT),
        ("03_specs.jpg", create_specs_section, IMAGE_WIDTH, 600),
        ("04_scenario.jpg", create_scenario_section, IMAGE_WIDTH, SECTION_HEIGHT),
        ("05_trust.jpg", create_trust_section, IMAGE_WIDTH, 500),
    ]

    print("\n开始生成详情图...")
    generated_files = []

    for filename, create_func, width, height in sections:
        try:
            print(f"  生成：{filename}...")

            if "header" in filename and product_images:
                img = create_func(width, height, product_images[0])
            elif "selling_points" in filename or "scenario" in filename:
                img = create_func(width, height, product_images[1:] if len(product_images) > 1 else None)
            else:
                img = create_func(width, height)

            # 保存
            output_path = os.path.join(OUTPUT_DIR, filename)
            img.save(output_path, "JPEG", quality=95)
            generated_files.append(output_path)
            print(f"    已保存：{output_path}")

        except Exception as e:
            print(f"    生成失败：{e}")

    # 生成完整长图（可选）
    print("\n正在拼接完整详情页...")
    try:
        images = [Image.open(f) for f in generated_files]

        # 计算总高度
        total_height = sum(img.height for img in images)

        # 创建长图
        long_img = Image.new("RGB", (IMAGE_WIDTH, total_height), COLOR_BG)

        # 拼接
        y_offset = 0
        for img in images:
            long_img.paste(img, (0, y_offset))
            y_offset += img.height

        # 保存长图
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

    # 打印文案供参考
    print("\n【使用的产品文案】")
    print(f"  标题：{PRODUCT_COPYWRITING['title']}")
    print(f"  副标题：{PRODUCT_COPYWRITING['subtitle']}")
    print(f"  价格：{PRODUCT_COPYWRITING['price']}")
    print("\n  卖点:")
    for title, desc in PRODUCT_COPYWRITING["selling_points"]:
        print(f"    - {title}: {desc}")

if __name__ == "__main__":
    main()
