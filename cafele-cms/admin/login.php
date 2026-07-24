<?php
/**
 * CAFELE CMS - 管理后台登录
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// 已登录则跳转
if (isAdminLoggedIn()) {
    redirect('index.php');
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrf = $_POST['csrf'] ?? '';
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if (!verify_csrf($csrf)) {
        $error = '表单已过期，请刷新页面重试。';
    } elseif (adminLogin($username, $password)) {
        redirect('index.php');
    } else {
        $error = '用户名或密码错误！';
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>后台登录 - CAFELE CMS</title>
    <link rel="stylesheet" href="<?= SITE_URL ?>/public/assets/css/admin.css">
</head>
<body class="login-page">
    <div class="login-card">
        <div class="login-brand">
            <img src="<?= SITE_URL ?>/public/uploads/seed/logo.svg" alt="CAFELE" onerror="this.style.display='none'" style="width:92px;height:92px;object-fit:cover;border-radius:16px;">
            <h1 style="font-size:28px;margin-top:12px;">CAFELE CMS</h1>
        </div>
        <h1>网站管理后台</h1>
        <form method="post">
            <?= csrf_field() ?>
            <div class="field">
                <label>用户名</label>
                <input class="input" name="username" required autocomplete="username" placeholder="请输入用户名">
            </div>
            <div class="field">
                <label>密码</label>
                <input class="input" type="password" name="password" required autocomplete="current-password" placeholder="请输入密码">
            </div>
            <?php if ($error): ?>
                <div class="alert error"><?= h($error) ?></div>
            <?php endif; ?>
            <button class="btn primary" type="submit" style="width:100%;padding:13px;">登录</button>
        </form>
        <div class="hint">首次登录：<b>admin</b> / <b>admin123</b>。登录后请修改密码。</div>
    </div>
</body>
</html>
