<?php
/**
 * CAFELE CMS - 管理后台控制台
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();

// 统计数据
$product_count = $db->query("SELECT COUNT(*) FROM products")->fetchColumn();
$category_count = $db->query("SELECT COUNT(*) FROM categories")->fetchColumn();
$message_count = $db->query("SELECT COUNT(*) FROM messages")->fetchColumn();
$page_count = $db->query("SELECT COUNT(*) FROM pages")->fetchColumn();

// 最近留言
$recent_messages = $db->query("SELECT * FROM messages ORDER BY created_at DESC LIMIT 5")->fetchAll();

// 删除 $logo_url 定义（已用 admin-logo-placeholder 替代）

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>控制台</h1>
    <div>
        <span style="color:var(--muted);font-size:13px;">欢迎，<?= h($_SESSION['admin_username'] ?? '管理员') ?></span>
    </div>
</div>

<div class="stats">
    <div class="stat">
        <span>产品总数</span>
        <strong><?= $product_count ?></strong>
    </div>
    <div class="stat">
        <span>产品分类</span>
        <strong><?= $category_count ?></strong>
    </div>
    <div class="stat">
        <span>留言/咨询</span>
        <strong><?= $message_count ?></strong>
    </div>
    <div class="stat">
        <span>CMS 页面</span>
        <strong><?= $page_count ?></strong>
    </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <div class="card">
        <h3 style="margin:0 0 16px;">快捷操作</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <a href="product_edit.php" class="btn" style="text-align:center;">➕ 添加产品</a>
            <a href="categories.php" class="btn" style="text-align:center;">📁 管理分类</a>
            <a href="pages.php" class="btn" style="text-align:center;">📄 管理页面</a>
            <a href="messages.php" class="btn" style="text-align:center;">💬 查看留言</a>
        </div>
    </div>

    <div class="card">
        <h3 style="margin:0 0 16px;">最近留言</h3>
        <?php if (empty($recent_messages)): ?>
            <p style="color:var(--muted);font-size:13px;">暂无留言</p>
        <?php else: ?>
            <?php foreach ($recent_messages as $msg): ?>
                <div style="padding:8px 0;border-bottom:1px solid var(--line);font-size:13px;">
                    <strong><?= h($msg['name']) ?></strong>
                    <span style="color:var(--muted);float:right;"><?= time_ago($msg['created_at']) ?></span>
                    <p style="margin:4px 0 0;color:var(--muted);"><?= h(truncate($msg['content'], 60)) ?></p>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<?php require __DIR__ . '/footer.php'; ?>
