"""
电商营销视频生成工具
将产品图片批量转换为短视频（适配拼多多/抖音/快手）
"""

import os
import glob
from moviepy import (
    ImageClip,
    CompositeVideoClip,
    concatenate_videoclips,
    AudioFileClip,
)
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# 配置区域
CONFIG = {
    # 输入输出目录
    'input_folder': r'./images',      # 产品图片存放目录
    'output_folder': r'./output',     # 输出视频目录

    # 视频参数
    'video_width': 1080,              # 输出视频宽度
    'video_height': 1920,             # 输出视频高度（9:16 竖版）
    'image_duration': 3,              # 每张图片显示时长（秒）
    'transition_duration': 0.5,       # 转场时长（秒）

    # 文字/水印
    'watermark_text': 'CAFELE樟宜专卖店称',      # 水印文字
    'watermark_position': 'bottom',   # 水印位置：top/bottom/left/right
    'watermark_fontsize': 40,

    # 产品文案（可自定义）
    'captions': [
        '搭电充气 一体机',
        '4S救援  高压快充',
        '亏点瞬启 智能补气',
    ],
    'caption_fontsize': 60,
    'caption_color': 'white',

    # 背景音乐（可选）
    'bgm_file': None,                 # BGM 文件路径，None 则不加音乐
    'bgm_volume': 0.3,                # BGM 音量 0-1
}


def create_text_image(text, img_size, fontsize=50, color='white', bg_color='transparent'):
    """创建文字图片用于水印"""
    width, height = img_size
    img = Image.new('RGBA', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # 尝试加载中文字体
    font_paths = [
        'C:/Windows/Fonts/simhei.ttf',      # 黑体
        'C:/Windows/Fonts/simkai.ttf',      # 楷体
        'C:/Windows/Fonts/msyh.ttc',        # 微软雅黑
        '/System/Library/Fonts/PingFang.ttc',
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
    ]

    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, fontsize)
                break
            except:
                pass

    # 如果没有字体，用默认
    if font is None:
        font = ImageFont.load_default()

    # 计算文字位置（居中）
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (width - text_w) // 2
    y = (height - text_h) // 2

    draw.text((x, y), text, font=font, fill=color)
    return np.array(img)


def make_video_from_images(config):
    """主函数：从图片生成视频"""

    # 创建输出目录
    os.makedirs(config['output_folder'], exist_ok=True)

    # 获取所有图片
    img_extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.webp']
    image_files = []
    for ext in img_extensions:
        image_files.extend(glob.glob(os.path.join(config['input_folder'], ext)))
    image_files.sort()

    if not image_files:
        print(f"❌ 在 {config['input_folder']} 目录下没有找到图片")
        print("请将产品图片放入该目录后重新运行")
        return None

    print(f"✅ 找到 {len(image_files)} 张图片")

    # 创建图片 Clip 列表
    clips = []
    target_size = (config['video_width'], config['video_height'])

    for img_path in image_files:
        print(f"  处理：{os.path.basename(img_path)}")

        # 创建图片 Clip
        clip = ImageClip(img_path).set_duration(config['image_duration'])

        # 调整大小并居中裁剪
        img_w, img_h = clip.size
        target_w, target_h = target_size

        # 计算缩放比例（保证图片充满画面）
        scale = max(target_w / img_w, target_h / img_h)
        new_w = int(img_w * scale)
        new_h = int(img_h * scale)

        clip = clip.resize((new_w, new_h))

        # 居中裁剪
        x_center = new_w // 2
        y_center = new_h // 2
        x1 = x_center - target_w // 2
        y1 = y_center - target_h // 2

        clip = clip.crop(
            x1=x1, y1=y1,
            width=target_w, height=target_h
        )

        clips.append(clip)

    # 添加转场效果（简单淡入淡出）
    final_clips = []
    for i, clip in enumerate(clips):
        if i == 0:
            final_clips.append(clip.fadeout(config['transition_duration']))
        elif i == len(clips) - 1:
            final_clips.append(clip.fadein(config['transition_duration']))
        else:
            final_clips.append(
                clip.fadein(config['transition_duration']).fadeout(config['transition_duration'])
            )

    # 拼接所有片段
    final_video = concatenate_videoclips(final_clips, method="compose")

    # 添加水印文字
    watermark = create_text_image(
        config['watermark_text'],
        (config['video_width'], 100),
        fontsize=config['watermark_fontsize'],
        color='white'
    )
    watermark_clip = ImageClip(watermark).set_duration(final_video.duration)
    watermark_clip = watermark_clip.set_position(('center', 'bottom'))

    final_video = CompositeVideoClip([final_video, watermark_clip])

    # 添加产品文案（轮播显示）
    if config['captions']:
        caption_clips = []
        caption_duration = final_video.duration / len(config['captions'])

        for i, caption in enumerate(config['captions']):
            start = i * caption_duration
            end = (i + 1) * caption_duration

            # 创建文字图片
            txt_img = create_text_image(
                caption,
                (config['video_width'] - 100, 150),
                fontsize=config['caption_fontsize'],
                color=config['caption_color']
            )
            txt_clip = ImageClip(txt_img).set_duration(caption_duration - 0.5)
            txt_clip = txt_clip.set_position(('center', 'center'))
            txt_clip = txt_clip.set_start(start).fadein(0.3).fadeout(0.3)

            caption_clips.append(txt_clip)

        final_video = CompositeVideoClip([final_video] + caption_clips)

    # 添加背景音乐
    if config['bgm_file'] and os.path.exists(config['bgm_file']):
        try:
            bgm = AudioFileClip(config['bgm_file'])
            # 循环音乐直到视频结束
            if bgm.duration < final_video.duration:
                bgm = bgm.audio_loop(duration=final_video.duration)
            else:
                bgm = bgm.subclip(0, final_video.duration)

            bgm = bgm.volumex(config['bgm_volume'])
            final_video = final_video.set_audio(bgm)
            print("✅ 已添加背景音乐")
        except Exception as e:
            print(f"⚠️ 添加音乐失败：{e}")

    # 输出文件名
    timestamp = f"{len(image_files)}p_{final_video.duration:.0f}s"
    output_path = os.path.join(config['output_folder'], f'video_{timestamp}.mp4')

    # 渲染输出
    print(f"\n🎬 正在生成视频 (约需 {final_video.duration * 2} 秒)...")
    final_video.write_videofile(
        output_path,
        fps=24,
        codec='libx264',
        audio_codec='aac',
        verbose=False,
        logger=None
    )

    print(f"\n✅ 视频已生成：{output_path}")
    return output_path


def generate_multiple_versions(config, count=3):
    """生成多个版本用于去重"""
    output_paths = []

    for i in range(count):
        print(f"\n{'='*40}")
        print(f"生成第 {i+1} 个版本...")
        print('='*40)

        # 微调配置（打乱顺序、调整时长等）
        modified_config = config.copy()
        modified_config['image_duration'] = config['image_duration'] + (i * 0.5 - 0.5)
        modified_config['captions'] = config['captions'][i % len(config['captions']):] + \
                                       config['captions'][:i % len(config['captions'])]

        path = make_video_from_images(modified_config)
        if path:
            output_paths.append(path)

    return output_paths


if __name__ == '__main__':
    print("=" * 50)
    print("电商营销视频生成工具")
    print("=" * 50)
    print("\n使用说明：")
    print("1. 将产品图片放入 ./images 目录")
    print("2. 修改上方 CONFIG 配置（水印、文案等）")
    print("3. 运行脚本生成视频")
    print("\n" + "=" * 50 + "\n")

    # 检查 images 目录是否存在
    if not os.path.exists(CONFIG['input_folder']):
        os.makedirs(CONFIG['input_folder'])
        print(f"已创建 {CONFIG['input_folder']} 目录")
        print("请将产品图片放入后重新运行\n")

    if not os.path.exists(CONFIG['output_folder']):
        os.makedirs(CONFIG['output_folder'])

    # 选择生成模式
    print("请选择生成模式：")
    print("1. 生成 1 个版本")
    print("2. 生成 3 个版本（用于去重发布）")

    choice = input("\n请输入选择 (1/2): ").strip()

    if choice == '2':
        paths = generate_multiple_versions(CONFIG, count=3)
        print(f"\n✅ 共生成 {len(paths)} 个版本")
    else:
        make_video_from_images(CONFIG)

    print("\n完成！")
