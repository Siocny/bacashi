<?php
/**
 * CAFELE CMS - 管理后台页面头部
 * 每个管理页面 require 此文件
 */

$current_page = basename($_SERVER['SCRIPT_NAME']);
$nav_items = [
    'index.php' => ['label' => '控制台', 'icon' => '◫'],
    'products.php' => ['label' => '产品管理', 'icon' => '▣'],
    'categories.php' => ['label' => '产品分类', 'icon' => '▦'],
    'slides.php' => ['label' => '轮播图', 'icon' => '▤'],
    'sections.php' => ['label' => '首页模块', 'icon' => '▥'],
    'pages.php' => ['label' => '内容页面', 'icon' => '▧'],
    'menus.php' => ['label' => '导航菜单', 'icon' => '☰'],
    'messages.php' => ['label' => '咨询留言', 'icon' => '✉'],
    'media.php' => ['label' => '媒体库', 'icon' => '▩'],
    'settings.php' => ['label' => '网站设置', 'icon' => '⚙'],
    'password.php' => ['label' => '修改密码', 'icon' => '⌁'],
];
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>管理后台 - CAFELE CMS</title>
    <link rel="icon" href="<?= SITE_URL ?>/public/uploads/seed/logo.svg">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="<?= SITE_URL ?>/public/assets/css/admin.css">
    <style>
        .admin-logo-placeholder { width:50px;height:50px;border-radius:8px;background:var(--brand);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px; }
        .toast { position:fixed;top:20px;right:20px;z-index:999;padding:14px 20px;border-radius:9px;font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,.12);display:none; }
        .toast.show { display:block;animation:fadeIn .3s; }
        .toast.success { background:#eaf7ef;color:#187443; }
        .toast.error { background:#fff0f0;color:#c63c3c; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    </style>
</head>
<body class="admin-body">
    <aside class="admin-sidebar" id="adminSidebar">
        <div class="admin-logo">
            <div class="admin-logo-placeholder">C</div>
            <div>CAFELE CMS</div>
        </div>
        <nav>
            <?php foreach ($nav_items as $file => $item): ?>
                <a href="<?= $file ?>" class="<?= $file === $current_page ? 'active' : '' ?>">
                    <span><?= $item['icon'] ?></span>
                    <?= h($item['label']) ?>
                </a>
            <?php endforeach; ?>
        </nav>
        <div class="sidebar-bottom">
            <a href="<?= SITE_URL ?>/index.php" target="_blank" style="color:inherit;text-decoration:none;font-size:13px;">🌐 查看前台</a>
            <a href="logout.php" style="color:inherit;text-decoration:none;font-size:13px;">🚪 退出</a>
        </div>
    </aside>

    <main class="admin-main">
        <header class="admin-topbar">
            <div style="display:flex;align-items:center;gap:12px;">
                <button class="admin-menu-toggle" id="menuToggle" type="button">☰</button>
                <div>
                    <strong><?= h($nav_items[$current_page]['label'] ?? '管理后台') ?></strong>
                    <small>CAFELE 内容管理系统</small>
                </div>
            </div>
            <div class="admin-user">
                <?= h($_SESSION['admin_username'] ?? '管理员') ?>
            </div>
        </header>

        <div class="admin-content">
            <div id="toast" class="toast"></div>
