<?php
/**
 * CAFELE CMS - 首页
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

$db = getDB();
$settings = get_settings();

// 读取分类
$categories = $db->query("SELECT * FROM categories ORDER BY sort_order ASC")->fetchAll();

// 读取推荐产品
$featured = $db->query("SELECT * FROM products WHERE featured = 1 AND status = 1 ORDER BY sort_order ASC LIMIT 8")->fetchAll();

// 如果推荐不足，取最新产品
if (count($featured) < 4) {
    $latest = $db->query("SELECT * FROM products WHERE status = 1 ORDER BY sort_order ASC, id DESC LIMIT 8")->fetchAll();
    $existing_ids = array_column($featured, 'id');
    foreach ($latest as $p) {
        if (!in_array($p['id'], $existing_ids)) {
            $featured[] = $p;
        }
        if (count($featured) >= 8) break;
    }
}

// 轮播图（从设置读取或使用默认）
$hero_images = [];
$hero_data = $settings['hero_images'] ?? '[]';
$hero_parsed = json_decode($hero_data, true);
if (!empty($hero_parsed)) {
    $hero_images = $hero_parsed;
} else {
    $hero_images = [
        ['desktop' => 'public/uploads/seed/hero-main.jpg', 'mobile' => 'public/uploads/seed/hero-main.jpg'],
        ['desktop' => 'public/uploads/seed/hero-brand.jpg', 'mobile' => 'public/uploads/seed/hero-brand.jpg'],
    ];
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <meta name="description" content="<?= h($settings['site_description'] ?? '智能车载与数码产品制造商') ?>">
    <meta name="keywords" content="CAFELE,车载充气泵,搭电宝,储能电源">
    <meta name="theme-color" content="#31477e">
    <title><?= h($settings['site_name'] ?? 'CAFELE') ?> - <?= h($settings['site_description'] ?? '智能车载与数码产品制造商') ?></title>
    <link rel="icon" href="<?= SITE_URL ?>/public/uploads/seed/logo.svg">
    <link rel="stylesheet" href="<?= SITE_URL ?>/public/assets/css/style.css">
    <style>:root{--brand:#31477e}</style>
</head>
<body>
<?php require __DIR__ . '/includes/header.php'; ?>

<main>
<!-- Hero 轮播 -->
<section class="hero" aria-label="首页轮播">
    <div class="hero-track">
        <?php foreach ($hero_images as $i => $slide): ?>
            <article class="hero-slide"
                     data-desktop="<?= image_url($slide['desktop'] ?? '') ?>"
                     data-mobile="<?= image_url($slide['mobile'] ?? $slide['desktop'] ?? '') ?>"
                     style="background-image:url('<?= image_url($slide['desktop'] ?? '') ?>');--overlay:0">
            </article>
        <?php endforeach; ?>
    </div>
    <?php if (count($hero_images) > 1): ?>
        <button class="hero-arrow prev" aria-label="上一张">‹</button>
        <button class="hero-arrow next" aria-label="下一张">›</button>
        <div class="hero-dots">
            <?php foreach ($hero_images as $i => $s): ?>
                <button class="hero-dot <?= $i === 0 ? 'active' : '' ?>" aria-label="第<?= $i+1 ?>张"></button>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</section>

<!-- 核心产品 -->
<section class="section"><div class="container">
    <div class="section-head"><h2>核心产品</h2><p>CAFELE PRODUCTS</p></div>
    <a class="feature-banner" href="/products.php?cat=all-in-one" style="display:block;background-image:url('<?= SITE_URL ?>/public/uploads/seed/feature-black.jpg');">
        <div class="banner-copy"><span class="btn">查看系列 →</span></div>
    </a>
</div></section>

<!-- 产品分类 -->
<section class="section soft"><div class="container">
    <div class="section-head"><h2>产品分类</h2><p>PRODUCT CATEGORIES</p></div>
    <div class="category-grid">
        <?php foreach ($categories as $cat): ?>
            <a class="category-card" href="products.php?cat=<?= urlencode($cat['slug']) ?>">
                <img loading="lazy" src="<?= SITE_URL ?>/public/uploads/seed/category-<?= h($cat['slug']) ?>.jpg"
                     onerror="this.style.display='none';this.parentNode.style.background='#31477e';this.parentNode.style.display='flex';this.parentNode.style.alignItems='center';this.parentNode.style.justifyContent='center';"
                     alt="<?= h($cat['name']) ?>">
                <div class="copy"><h3><?= h($cat['name']) ?></h3><p><?= strtoupper(h($cat['slug'])) ?></p></div>
            </a>
        <?php endforeach; ?>
    </div>
</div></section>

<!-- 品牌介绍 -->
<section class="brand-banner" style="background-image:url('<?= SITE_URL ?>/public/uploads/seed/brand-banner.jpg');"><div class="copy">
    <div class="eyebrow">专注研发与制造</div>
    <h2>专业车品制造商</h2>
    <p>从产品设计、制造到交付，持续为合作伙伴提供稳定可靠的车载与数码解决方案。</p>
    <a class="btn" href="page.php?slug=about">了解我们 →</a>
</div></section>

<!-- 新品上市 -->
<?php if (!empty($featured)): ?>
<section class="section"><div class="container">
    <div class="section-head"><h2>新品上市</h2><p>NEW PRODUCT LAUNCH</p></div>
    <div class="product-grid">
        <?php foreach ($featured as $product): ?>
            <a class="product-card" href="product.php?slug=<?= urlencode($product['slug']) ?>">
                <div class="image">
                    <img loading="lazy" src="<?= image_url($product['image']) ?>"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;400&quot; height=&quot;400&quot; viewBox=&quot;0 0 400 400&quot;%3E%3Crect fill=&quot;%23f0f0f0&quot; width=&quot;400&quot; height=&quot;400&quot;/%3E%3Ctext fill=&quot;%23999&quot; font-family=&quot;Arial&quot; font-size=&quot;18&quot; text-anchor=&quot;middle&quot; x=&quot;200&quot; y=&quot;200&quot;%3E<?= h($product['name']) ?>%3C/text%3E%3C/svg%3E'"
                         alt="<?= h($product['name']) ?>">
                </div>
                <div class="info">
                    <h3><?= h($product['name']) ?></h3>
                    <p><?= h($product['subtitle'] ?: truncate(strip_tags($product['content'] ?? ''), 80)) ?></p>
                </div>
            </a>
        <?php endforeach; ?>
    </div>
</div></section>
<?php endif; ?>
</main>

<?php require __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
