#!/bin/bash

# 卡斐乐官网一键部署脚本
# 支持 Vercel 和 GitHub Pages

echo "======================================"
echo "   卡斐乐品牌官网 - 一键部署工具"
echo "======================================"
echo ""

# 获取项目目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "项目目录：$PROJECT_DIR"
echo ""

# 检测 Vercel CLI
if command -v vercel &> /dev/null; then
    echo "检测到 Vercel CLI，开始部署..."
    echo ""
    echo "请在浏览器中完成登录验证"
    echo ""

    # 使用 Vercel 部署
    vercel link --create-new --yes
    vercel --prod

    echo ""
    echo "部署完成！请查看上方的部署 URL"
    exit 0
fi

# 检测 Netlify CLI
if command -v netlify &> /dev/null; then
    echo "检测到 Netlify CLI，开始部署..."
    echo ""

    netlify deploy --prod --dir=.

    echo ""
    echo "部署完成！请查看上方的部署 URL"
    exit 0
fi

echo "未检测到部署工具，请手动选择以下任一方式部署："
echo ""
echo "方式一：Vercel (推荐)"
echo "  1. 访问 https://vercel.com/new"
echo "  2. 导入本项目的 Git 仓库"
echo "  3. 或拖拽 $PROJECT_DIR 到 Vercel Desktop"
echo ""
echo "方式二：Netlify Drop"
echo "  1. 访问 https://app.netlify.com/drop"
echo "  2. 拖拽 $PROJECT_DIR 文件夹到页面"
echo "  3. 获得部署 URL"
echo ""
echo "方式三：GitHub Pages"
echo "  1. 在 GitHub 创建新仓库"
echo "  2. 推送代码：git remote add origin <仓库 URL> && git push -u origin master"
echo "  3. 启用 GitHub Pages (Settings -> Pages)"
echo ""
