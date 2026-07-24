<?php
/**
 * CAFELE CMS - 公共页面头部
 *
 * 前端页面使用此文件渲染导航栏
 */

$current_uri = $_SERVER['SCRIPT_NAME'];
$service_slugs = ['instructions', 'channels', 'after-purchase', 'after-sales', 'suggestion'];
$is_service_page = basename($current_uri) === 'page.php' && in_array($_GET['slug'] ?? '', $service_slugs);
$nav_pages = [
    'index.php' => ['label' => '首页', 'icon' => ''],
    'products.php' => ['label' => '品牌产品', 'icon' => ''],
];
?>
<header class="site-header" id="siteHeader">
    <div class="header-inner container-wide">
        <a class="brand" href="index.php" aria-label="CAFELE 首页">
            <img src="<?= SITE_URL ?>/public/uploads/seed/logo.svg" alt="CAFELE" onerror="this.style.display='none';this.parentNode.textContent='CAFELE'" style="width:106px;height:58px;object-fit:cover;border-radius:6px;">
        </a>
        <button class="menu-toggle" type="button" aria-label="打开菜单" aria-expanded="false"><span></span><span></span><span></span></button>
        <nav class="main-nav" aria-label="主导航">
            <div class="nav-item <?= basename($current_uri) === 'index.php' ? '' : '' ?>">
                <a class="<?= basename($current_uri) === 'index.php' ? 'active' : '' ?>" href="index.php">首页</a>
            </div>
            <div class="nav-item <?= in_array(basename($current_uri), ['products.php', 'product.php']) ? '' : '' ?>">
                <a class="<?= in_array(basename($current_uri), ['products.php', 'product.php']) ? 'active' : '' ?>" href="products.php">品牌产品</a>
            </div>
            <?php
            // 读取「服务与支持」的子页面
            $service_pages = [];
            try {
                $db = getDB();
                $service_slugs = ['instructions', 'channels', 'after-purchase', 'after-sales', 'suggestion'];
                $placeholders = implode(',', array_fill(0, count($service_slugs), '?'));
                $stmt = $db->prepare("SELECT slug, title FROM pages WHERE slug IN ($placeholders)");
                $stmt->execute($service_slugs);
                $service_pages = $stmt->fetchAll();
            } catch (Exception $e) {}
            ?>
            <div class="nav-item has-dropdown">
                <a class="<?= ($is_service_page ?? false) ? 'active' : '' ?>" href="page.php?slug=instructions">服务与支持</a>
                <div class="dropdown">
                    <?php if (!empty($service_pages)): ?>
                        <?php foreach ($service_pages as $sp): ?>
                            <a href="page.php?slug=<?= urlencode($sp['slug']) ?>"><?= h($sp['title']) ?></a>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <a href="page.php?slug=instructions">操作说明</a>
                        <a href="page.php?slug=channels">购买渠道</a>
                        <a href="page.php?slug=after-purchase">购后扫码</a>
                        <a href="page.php?slug=after-sales">售后政策</a>
                        <a href="page.php?slug=suggestion">提个建议</a>
                    <?php endif; ?>
                </div>
            </div>
            <div class="nav-item">
                <a class="<?= basename($current_uri) === 'page.php' && isset($_GET['slug']) && $_GET['slug'] === 'about' ? 'active' : '' ?>" href="page.php?slug=about">关于我们</a>
            </div>
        </nav>
        <form class="header-search" action="search.php" method="get">
            <span aria-hidden="true">⌕</span>
            <input name="q" value="<?= h($_GET['q'] ?? '') ?>" placeholder="请输入关键词" aria-label="搜索">
        </form>
    </div>
    <div class="category-nav">
        <div class="container-wide category-nav-inner">
            <?php
            try {
                $cats = get_categories();
                foreach ($cats as $cat): ?>
                    <a href="products.php?cat=<?= urlencode($cat['slug']) ?>"><?= h($cat['name']) ?></a>
                <?php endforeach; ?>
                <a href="products.php">更多产品</a>
            <?php } catch (Exception $e) {
                echo '<a href="products.php">全部产品</a>';
            } ?>
        </div>
    </div>
</header>
