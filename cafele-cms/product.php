<?php
/**
 * CAFELE CMS - 产品详情页
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

$db = getDB();
$slug = $_GET['slug'] ?? '';

$stmt = $db->prepare("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ? AND p.status = 1 LIMIT 1");
$stmt->execute([$slug]);
$product = $stmt->fetch();

if (!$product) {
    http_response_code(404);
    $error_msg = '产品未找到';
}

// 读取产品图片画廊
$images = [];
if ($product) {
    $img_stmt = $db->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC");
    $img_stmt->execute([$product['id']]);
    $images = $img_stmt->fetchAll();
}

$specs = $product ? (json_decode($product['specs'] ?? '[]', true) ?: []) : [];

// 视频嵌入辅助函数
function getVideoEmbed(string $url): string {
    // YouTube
    if (preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/', $url, $m)) {
        return '<iframe src="https://www.youtube.com/embed/' . $m[1] . '" frameborder="0" allowfullscreen style="width:100%;max-width:800px;height:450px;border-radius:12px;"></iframe>';
    }
    // Bilibili
    if (preg_match('/bilibili\.com\/video\/(?:av(\d+)|BV(\w+))/', $url, $m)) {
        $bvid = !empty($m[2]) ? 'BV' . $m[2] : 'av' . $m[1];
        return '<iframe src="//player.bilibili.com/player.html?bvid=' . $bvid . '&page=1" scrolling="no" border="0" frameborder="no" allowfullscreen style="width:100%;max-width:800px;height:450px;border-radius:12px;"></iframe>';
    }
    return '<p>视频链接：<a href="' . h($url) . '" target="_blank">' . h($url) . '</a></p>';
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <meta name="description" content="<?= h($product['subtitle'] ?? strip_tags($product['content'] ?? '')) ?>">
    <meta name="keywords" content="CAFELE,<?= h($product['name']) ?>">
    <meta name="theme-color" content="#31477e">
    <title><?= h($product['name'] ?? '未找到') ?> - CAFELE</title>
    <link rel="icon" href="<?= SITE_URL ?>/public/uploads/seed/logo.svg">
    <link rel="stylesheet" href="<?= SITE_URL ?>/public/assets/css/style.css">
    <style>:root{--brand:#31477e}</style>
</head>
<body>
<?php require __DIR__ . '/includes/header.php'; ?>

<main>
<?php if (!$product): ?>
    <section class="page-hero"><div class="container"><h1>未找到产品</h1></div></section>
    <div class="container" style="text-align:center;padding:80px 0;color:var(--muted);">
        <p style="font-size:48px;">🔍</p>
        <p>未找到该产品。</p>
        <a href="products.php" class="btn" style="margin-top:20px;">浏览全部产品</a>
    </div>
<?php else: ?>
<div class="container product-detail">
    <div class="product-top">
        <section class="product-gallery">
            <div class="gallery-main">
                <img src="<?= image_url($product['image']) ?>" alt="<?= h($product['name']) ?>"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=&quot;http://www.w3.org/2000/svg&quot; width=&quot;600&quot; height=&quot;600&quot; viewBox=&quot;0 0 600 600&quot;%3E%3Crect fill=&quot;%23f0f0f0&quot; width=&quot;600&quot; height=&quot;600&quot;/%3E%3Ctext fill=&quot;%23999&quot; font-family=&quot;Arial&quot; font-size=&quot;20&quot; text-anchor=&quot;middle&quot; x=&quot;300&quot; y=&quot;300&quot;%3E无图片%3C/text%3E%3C/svg%3E'">
            </div>
            <?php if (!empty($images)): ?>
            <div class="gallery-thumbs">
                <button class="gallery-thumb active" type="button" data-src="<?= image_url($product['image']) ?>" data-alt="<?= h($product['name']) ?>">
                    <img loading="lazy" src="<?= image_url($product['image']) ?>" alt="">
                </button>
                <?php foreach ($images as $img): ?>
                    <button class="gallery-thumb" type="button" data-src="<?= image_url($img['image_path']) ?>" data-alt="<?= h($img['alt_text'] ?: $product['name']) ?>">
                        <img loading="lazy" src="<?= image_url($img['image_path']) ?>" alt="">
                    </button>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </section>

        <aside class="product-summary">
            <div class="model"><?= h($product['category_name'] ?? '产品') ?></div>
            <h1><?= h($product['name']) ?></h1>
            <?php if ($product['subtitle']): ?>
                <p class="subtitle"><?= h($product['subtitle']) ?></p>
            <?php endif; ?>

            <?php if (!empty($specs)): ?>
            <div class="spec-list">
                <?php foreach ($specs as $spec): ?>
                    <?php
                    $key = is_array($spec) ? ($spec['key'] ?? $spec[0] ?? '') : '';
                    $val = is_array($spec) ? ($spec['value'] ?? $spec[1] ?? '') : '';
                    ?>
                    <?php if ($key && $val): ?>
                        <div class="spec-row"><strong><?= h($key) ?></strong><span><?= h($val) ?></span></div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <a class="btn primary" href="#quote">获取报价 / 联系我们</a>

            <div class="quote-box" id="quote">
                <h3>产品咨询</h3>
                <form action="submit_message.php" method="post" class="form-grid">
                    <?= csrf_field() ?>
                    <input type="hidden" name="product_id" value="<?= $product['id'] ?>">
                    <input type="hidden" name="return" value="product.php?slug=<?= urlencode($product['slug']) ?>#quote">
                    <input class="form-control" required name="name" placeholder="您的姓名">
                    <input class="form-control" name="phone" placeholder="联系电话">
                    <input class="form-control full" type="email" name="email" placeholder="电子邮箱">
                    <textarea class="form-control full" name="content" placeholder="请填写采购数量、定制需求或其他问题"></textarea>
                    <button class="btn primary full" type="submit">提交咨询</button>
                </form>
            </div>
        </aside>
    </div>

    <?php if ($product['video']): ?>
    <div style="margin-top:30px;">
        <h2>产品视频</h2>
        <?php if (preg_match('/\.(mp4|webm|ogg|mov)(\?.*)?$/i', $product['video'])): ?>
            <video src="<?= image_url($product['video']) ?>" controls style="width:100%;max-width:800px;border-radius:12px;margin-top:12px;"></video>
        <?php else: ?>
            <div style="margin-top:12px;"><?= getVideoEmbed($product['video']) ?></div>
        <?php endif; ?>
    </div>
    <?php endif; ?>

    <?php if ($product['content']): ?>
    <article class="product-content">
        <h2>产品详情</h2>
        <?= $product['content'] ?>
    </article>
    <?php endif; ?>
</div>
<?php endif; ?>
</main>

<?php require __DIR__ . '/includes/footer.php'; ?>
</body>
</html>
