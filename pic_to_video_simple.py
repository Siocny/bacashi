"""
电商营销视频生成工具 - 一键生成版
将产品图片批量转换为短视频（适配拼多多/抖音/快手）
"""

import os
import glob
from moviepy import (
    ImageClip,
    CompositeVideoClip,
    concatenate_videoclips,
    AudioFileClip,
    vfx
)
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# ==================== 配置区域 ====================
CONFIG = {
    # 输入输出目录
    'input_folder': r'./images',      # 产品图片存放目录
    'output_folder': r'./output',     # 输出视频目录

    # 视频参数
    'video_width': 1080,              # 输出视频宽度
    'video_height': 1920,             # 输出视频高度（9:16 竖版）
    'image_duration': 2.5,            # 每张图片显示时长（秒）
    'transition_duration': 0.3,       # 转场时长（秒）

    # 文字/水印
    'watermark_text': 'CAFELE 樟宜专卖店',      # 水印文字
    'watermark_fontsize': 36,

    # 产品文案（可自定义）
    'captions': [
        '搭电充气 一体机',
        '4S 救援 高压快充',
        '亏电瞬启 智能补气',
    ],
    'caption_fontsize': 56,
    'caption_color': '#FFFF00',

    # 背景音乐（可选）
    'bgm_file': None,                 # BGM 文件路径，None 则不加音乐
    'bgm_volume': 0.3,                # BGM 音量 0-1
}
# ================================================


def create_text_image(text, img_size, fontsize=50, color='white'):
    """创建文字图片"""
    width, height = img_size
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 中文字体路径
    font_paths = [
        'C:/Windows/Fonts/simhei.ttf',
        'C:/Windows/Fonts/msyh.ttc',
        'C:/Windows/Fonts/simkai.ttf',
    ]
    font = None
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, fontsize)
                break
            except:
                pass

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


def make_video(config):
    """从图片生成视频"""
    os.makedirs(config['output_folder'], exist_ok=True)

    # 获取所有图片
    extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.webp']
    image_files = []
    for ext in extensions:
        image_files.extend(glob.glob(os.path.join(config['input_folder'], ext)))
    image_files.sort()

    if not image_files:
        print(f"\n[ERROR] 在 {config['input_folder']} 目录下没有找到图片")
        print("请将产品图片放入该目录后重新运行\n")
        return None

    print(f"[OK] 找到 {len(image_files)} 张图片")

    target_size = (config['video_width'], config['video_height'])
    clips = []

    for img_path in image_files:
        print(f"  处理：{os.path.basename(img_path)}")
        clip = ImageClip(img_path).with_duration(config['image_duration'])

        # 调整大小并居中裁剪
        img_w, img_h = clip.size
        target_w, target_h = target_size
        scale = max(target_w / img_w, target_h / img_h)
        new_w = int(img_w * scale)
        new_h = int(img_h * scale)

        clip = clip.with_effects([vfx.Resize((new_w, new_h))])

        x_center = new_w // 2
        y_center = new_h // 2
        x1 = x_center - target_w // 2
        y1 = y_center - target_h // 2

        clip = clip.with_effects([vfx.Crop(x1=x1, y1=y1, width=target_w, height=target_h)])
        clips.append(clip)

    # 添加淡入淡出转场
    final_clips = []
    for i, clip in enumerate(clips):
        c = clip
        effects = []
        if i > 0:
            effects.append(vfx.FadeIn(config['transition_duration']))
        if i < len(clips) - 1:
            effects.append(vfx.FadeOut(config['transition_duration']))
        if effects:
            c = c.with_effects(effects)
        final_clips.append(c)

    # 拼接视频
    final_video = concatenate_videoclips(final_clips, method="compose")

    # 添加水印
    watermark = create_text_image(
        config['watermark_text'],
        (config['video_width'], 100),
        fontsize=config['watermark_fontsize'],
        color='white'
    )
    watermark_clip = ImageClip(watermark).with_duration(final_video.duration)
    watermark_clip = watermark_clip.with_position(('center', 'bottom'))
    final_video = CompositeVideoClip([final_video, watermark_clip])

    # 添加文案
    if config['captions']:
        caption_duration = final_video.duration / len(config['captions'])
        caption_clips = []

        for i, caption in enumerate(config['captions']):
            start = i * caption_duration
            txt_img = create_text_image(
                caption,
                (config['video_width'] - 100, 150),
                fontsize=config['caption_fontsize'],
                color=config['caption_color']
            )
            txt_clip = ImageClip(txt_img).with_duration(caption_duration)
            txt_clip = txt_clip.with_position(('center', 'center'))
            txt_clip = txt_clip.with_start(start)
            txt_clip = txt_clip.with_effects([vfx.FadeIn(0.3), vfx.FadeOut(0.3)])
            caption_clips.append(txt_clip)

        final_video = CompositeVideoClip([final_video] + caption_clips)

    # 添加背景音乐
    if config['bgm_file'] and os.path.exists(config['bgm_file']):
        try:
            bgm = AudioFileClip(config['bgm_file'])
            if bgm.duration < final_video.duration:
                bgm = bgm.audio_loop(duration=final_video.duration)
            else:
                bgm = bgm.subclip(0, final_video.duration)
            bgm = bgm.volumex(config['bgm_volume'])
            final_video = final_video.set_audio(bgm)
            print("[OK] 已添加背景音乐")
        except Exception as e:
            print(f"[WARN] 添加音乐失败：{e}")

    # 输出
    timestamp = f"{len(image_files)}p_{int(final_video.duration)}s"
    output_path = os.path.join(config['output_folder'], f'video_{timestamp}.mp4')

    print(f"\n[INFO] 正在生成视频...")
    final_video.write_videofile(
        output_path,
        fps=24,
        codec='libx264',
        audio_codec='aac',
        logger=None
    )

    print(f"\n[OK] 视频已生成：{output_path}")
    return output_path


if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("  电商营销视频生成工具")
    print("=" * 50 + "\n")

    # 检查目录
    if not os.path.exists(CONFIG['input_folder']):
        os.makedirs(CONFIG['input_folder'])
        print(f"已创建图片目录：{CONFIG['input_folder']}")
        print("请将产品图片放入后重新运行\n")
        exit()

    # 开始生成
    make_video(CONFIG)
    print("\n完成!\n")
