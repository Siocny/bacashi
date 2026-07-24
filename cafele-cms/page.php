<?php
/**
 * CAFELE CMS - 动态页面 (about, contact, etc.)
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

$db = getDB();
$slug = $_GET['slug'] ?? '';

$stmt = $db->prepare("SELECT * FROM pages WHERE slug = ? LIMIT 1");
$stmt->execute([$slug]);
$page = $stmt->fetch();

// 子页面 slug 列表（用于「服务与支持」高亮）
$service_slugs = ['instructions', 'channels', 'after-purchase', 'after-sales', 'suggestion'];

if (!$page) {
    http_response_code(404);
    $page = ['title' => '未找到', 'content' => '<p>页面未找到。</p>', 'meta_description' => ''];
}

$is_service = in_array($slug, $service_slugs);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <meta name="description" content="<?= h($page['meta_description'] ?? '') ?>">
    <meta name="keywords" content="CAFELE">
    <meta name="theme-color" content="#31477e">
    <title><?= h($page['title']) ?> - CAFELE</title>
    <link rel="icon" href="<?= SITE_URL ?>/public/uploads/seed/logo.svg">
    <link rel="stylesheet" href="<?= SITE_URL ?>/public/assets/css/style.css">
    <style>:root{--brand:#31477e}</style>
</head>
<body>
<?php require __DIR__ . '/includes/header.php'; ?>

<main>
<section class="page-hero"><div class="container">
    <h1><?= h($page['title']) ?></h1>
    <p><?= h($page['meta_description'] ?? '') ?></p>
</div></section>

<div class="container content-page">
    <?php if ($slug === 'contact'): ?>
        <!-- 联系页面包含在线留言表单 -->
        <article class="rich-content"><?= $page['content'] ?? '' ?></article>
        <section class="contact-panel">
            <h2>在线留言</h2>
            <form action="submit_message.php" method="post" class="form-grid">
                <?= csrf_field() ?>
                <input type="hidden" name="return" value="page.php?slug=contact">
                <input class="form-control" required name="name" placeholder="您的姓名">
                <input class="form-control" name="phone" placeholder="联系电话">
                <input class="form-control full" type="email" name="email" placeholder="电子邮箱">
                <textarea class="form-control full" required name="content" placeholder="请输入留言内容"></textarea>
                <button class="btn primary full" type="submit">提交留言</button>
            </form>
        </section>
    <?php else: ?>
        <article class="rich-content"><?= $page['content'] ?? '' ?></article>
    <?php endif; ?>
</div>
</main>

<?php require __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
