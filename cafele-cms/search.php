<?php
/**
 * CAFELE CMS - 搜索页
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

$db = getDB();
$q = trim($_GET['q'] ?? '');
$results = [];

if ($q) {
    $stmt = $db->prepare("SELECT p.*, c.name as category_name
                          FROM products p
                          LEFT JOIN categories c ON p.category_id = c.id
                          WHERE p.status = 1 AND (p.name LIKE ? OR p.subtitle LIKE ? OR p.content LIKE ?)
                          ORDER BY p.sort_order ASC, p.id DESC
                          LIMIT 50");
    $like = "%$q%";
    $stmt->execute([$like, $like, $like]);
    $results = $stmt->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <meta name="description" content="CAFELE 产品搜索">
    <meta name="theme-color" content="#31477e">
    <title>搜索结果 - CAFELE</title>
    <link rel="icon" href="<?= SITE_URL ?>/public/uploads/seed/logo.svg">
    <link rel="stylesheet" href="<?= SITE_URL ?>/public/assets/css/style.css">
    <style>:root{--brand:#31477e}</style>
</head>
<body>
<?php require __DIR__ . '/includes/header.php'; ?>

<main>
<section class="page-hero"><div class="container">
    <h1>搜索结果</h1>
    <p><?= $q ? '关键词：' . h($q) : '请输入搜索关键词' ?></p>
</div></section>

<div class="container search-results">
    <?php if (!$q): ?>
        <p style="text-align:center;padding:60px 0;color:var(--muted);">请在搜索框输入关键词进行搜索。</p>
    <?php elseif (empty($results)): ?>
        <p style="text-align:center;padding:60px 0;color:var(--muted);">没有找到相关内容。</p>
    <?php else: ?>
        <p style="margin-bottom:24px;color:var(--muted);">找到 <?= count($results) ?> 个结果</p>
        <?php foreach ($results as $product): ?>
            <div class="search-item">
                <div>
                    <img src="<?= image_url($product['image']) ?>"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;180&quot; height=&quot;140&quot; viewBox=&quot;0 0 180 140&quot;%3E%3Crect fill=&quot;%23f0f0f0&quot; width=&quot;180&quot; height=&quot;140&quot;/%3E%3Ctext fill=&quot;%23999&quot; font-family=&quot;Arial&quot; font-size=&quot;14&quot; text-anchor=&quot;middle&quot; x=&quot;90&quot; y=&quot;70&quot;%3E<?= h($product['name']) ?>%3C/text%3E%3C/svg%3E'"
                         alt="<?= h($product['name']) ?>">
                </div>
                <div>
                    <h3><a href="product.php?slug=<?= urlencode($product['slug']) ?>" style="color:var(--brand);text-decoration:none;"><?= h($product['name']) ?></a></h3>
                    <p style="color:var(--muted);margin:8px 0;">
                        <?= h($product['subtitle'] ?: truncate(strip_tags($product['content'] ?? ''), 100)) ?>
                    </p>
                    <small style="color:var(--muted);">
                        <?= h($product['category_name'] ?? '') ?>
                    </small>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</div>
</main>

<?php require __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
