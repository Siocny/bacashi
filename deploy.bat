@echo off
chcp 65001 >nul
echo ======================================
echo    卡斐乐品牌官网 - 一键部署工具
echo ======================================
echo.

cd /d "%~dp0"

echo 项目目录：%CD%
echo.

:: 检测 Vercel CLI
where vercel >nul 2>nul
if %errorlevel% equ 0 (
    echo 检测到 Vercel CLI，开始部署...
    echo.
    echo 请在浏览器中完成登录验证
    echo.
    vercel link --create-new --yes
    vercel --prod
    echo.
    echo 部署完成！请查看上方的部署 URL
    pause
    exit /b 0
)

:: 检测 Netlify CLI
where netlify >nul 2>nul
if %errorlevel% equ 0 (
    echo 检测到 Netlify CLI，开始部署...
    echo.
    netlify deploy --prod --dir=.
    echo.
    echo 部署完成！请查看上方的部署 URL
    pause
    exit /b 0
)

echo 未检测到部署工具，请选择以下任一方式部署：
echo.
echo 方式一：Vercel (推荐)
echo   1. 访问 https://vercel.com/new
echo   2. 导入本项目的 Git 仓库
echo   3. 或直接拖拽文件夹到 Vercel Desktop
echo.
echo 方式二：Netlify Drop (最简单)
echo   1. 访问 https://app.netlify.com/drop
echo   2. 拖拽本文件夹到页面
echo   3. 立即获得部署 URL
echo.
echo 方式三：GitHub Pages
echo   1. 在 GitHub 创建新仓库
echo   2. 推送代码
echo   3. 启用 GitHub Pages (Settings -^> Pages)
echo.
pause
