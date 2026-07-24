<?php
/**
 * CAFELE CMS - 数据库配置
 *
 * 安装完成后，修改以下配置以连接你的数据库
 */

// 优先加载安装时生成的本地配置
$localConfig = __DIR__ . '/config.local.php';
if (file_exists($localConfig)) {
    require_once $localConfig;
    // config.local.php 会定义这些常量，跳过下面的默认值
} else {
    define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
    define('DB_NAME', getenv('DB_NAME') ?: 'cafele_cms');
    define('DB_USER', getenv('DB_USER') ?: 'root');
    define('DB_PASS', getenv('DB_PASS') ?: '');
    define('DB_CHARSET', 'utf8mb4');
}

// 站点 URL（自动检测 - 基于 DOCUMENT_ROOT 计算）
$docRoot = str_replace('\\', '/', $_SERVER['DOCUMENT_ROOT']);
$incPath = str_replace('\\', '/', __DIR__);
$relPath = str_replace($docRoot, '', dirname($incPath));
$relPath = rtrim($relPath, '/\\');
if (in_array($relPath, ['.', ''])) $relPath = '';
define('SITE_URL', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . $relPath);
define('ADMIN_URL', SITE_URL . '/admin');
define('UPLOADS_PATH', __DIR__ . '/../public/uploads');
define('UPLOADS_URL', SITE_URL . '/public/uploads');

// Session 配置
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

session_start();

// 错误报告（开发环境）
error_reporting(E_ALL);
ini_set('display_errors', 0);
