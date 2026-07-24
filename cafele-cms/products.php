<?php
/**
 * CAFELE CMS - 产品列表页
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

$db = getDB();

$cat_slug = $_GET['cat'] ?? '';
$search = $_GET['q'] ?? '';
$current_cat = null;

$where = "WHERE p.status = 1";
$params = [];

if ($cat_slug) {
    $stmt = $db->prepare("SELECT * FROM categories WHERE slug = ?");
    $stmt->execute([$cat_slug]);
    $current_cat = $stmt->fetch();
    if ($current_cat) {
        $where .= " AND p.category_id = ?";
        $params[] = $current_cat['id'];
    }
}

if ($search) {
    $where .= " AND (p.name LIKE ? OR p.subtitle LIKE ? OR p.content LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$categories = $db->query("SELECT * FROM categories ORDER BY sort_order ASC")->fetchAll();

$sql = "SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        $where
        ORDER BY p.sort_order ASC, p.id DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

$page_title = $current_cat ? h($current_cat['name']) : ($search ? '搜索结果' : '全部产品');
$page_subtitle = $current_cat ? strtoupper(h($current_cat['slug'])) : ($search ? "关键词：" . h($search) : 'ALL PRODUCTS');
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <meta name="description" content="浏览 CAFELE 全部产品。">
    <meta name="keywords" content="CAFELE,车载充气泵,搭电宝,储能电源">
    <meta name="theme-color" content="#31477e">
    <title><?= $page_title ?> - CAFELE</title>
    <link rel="icon" href="<?= SITE_URL ?>/public/uploads/seed/logo.svg">
    <link rel="stylesheet" href="<?= SITE_URL ?>/public/assets/css/style.css">
    <style>:root{--brand:#31477e}</style>
</head>
<body>
<?php require __DIR__ . '/includes/header.php'; ?>

<main>
<section class="page-hero"><div class="container">
    <h1><?= $page_title ?></h1>
    <p><?= $page_subtitle ?></p>
</div></section>

<div class="container products-layout">
    <aside class="category-sidebar">
        <a class="<?= !$cat_slug && !$search ? 'active' : '' ?>" href="products.php">全部产品</a>
        <?php foreach ($categories as $cat): ?>
            <a class="<?= $cat_slug === $cat['slug'] ? 'active' : '' ?>" href="products.php?cat=<?= urlencode($cat['slug']) ?>"><?= h($cat['name']) ?></a>
        <?php endforeach; ?>
    </aside>

    <section>
        <?php if (empty($products)): ?>
            <div style="text-align:center;padding:80px 0;color:var(--muted);">
                <p style="font-size:48px;margin-bottom:16px;">📦</p>
                <p><?= $search ? '没有找到相关产品。' : '暂无产品，请稍后再来。' ?></p>
            </div>
        <?php else: ?>
            <div class="product-grid">
                <?php foreach ($products as $product): ?>
                    <?php
                    $specs = $product['specs'] ? json_decode($product['specs'], true) : [];
                    $desc = $product['subtitle'] ?: (strip_tags($product['content'] ?? ''));
                    ?>
                    <a class="product-card" href="product.php?slug=<?= urlencode($product['slug']) ?>">
                        <div class="image">
                            <img loading="lazy" src="<?= image_url($product['image']) ?>"
                                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;400&quot; height=&quot;400&quot; viewBox=&quot;0 0 400 400&quot;%3E%3Crect fill=&quot;%23f0f0f0&quot; width=&quot;400&quot; height=&quot;400&quot;/%3E%3Ctext fill=&quot;%23999&quot; font-family=&quot;Arial&quot; font-size=&quot;16&quot; text-anchor=&quot;middle&quot; x=&quot;200&quot; y=&quot;200&quot;%3E<?= h($product['name']) ?>%3C/text%3E%3C/svg%3E'"
                                 alt="<?= h($product['name']) ?>">
                        </div>
                        <div class="info">
                            <h3><?= h($product['name']) ?></h3>
                            <p><?= h(truncate($desc, 80)) ?></p>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </section>
</div>
</main>

<?php require __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
