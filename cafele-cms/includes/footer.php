<?php
/**
 * CAFELE CMS - 公共页脚
 */
$site_settings = [];
try {
    $db = getDB();
    $site_settings = get_settings();
} catch (Exception $e) {}
?>
<footer class="site-footer">
    <div class="container footer-grid">
        <div>
            <div class="footer-brand"><?= h($site_settings['site_name'] ?? 'CAFELE') ?></div>
            <p><?= h($site_settings['site_description'] ?? '智能车载与数码产品制造商') ?></p>
        </div>
        <div>
            <h3>快速链接</h3>
            <a href="page.php?slug=contact">联系我们</a>
            <a href="page.php?slug=after-sales">售后政策</a>
            <a href="admin/login.php">后台管理</a>
        </div>
        <div>
            <h3>联系我们</h3>
            <p><?= h($site_settings['contact_phone'] ?? '400-888-2026') ?></p>
            <p><?= h($site_settings['contact_email'] ?? 'service@example.com') ?></p>
            <p><?= h($site_settings['contact_address'] ?? '中国 · 深圳') ?></p>
        </div>
    </div>
    <div class="footer-bottom">© <?= date('Y') ?> <?= h($site_settings['site_name'] ?? 'CAFELE') ?>. All rights reserved.</div>
</footer>
<button class="back-top" type="button" aria-label="返回顶部">↑</button>
<div class="lightbox" aria-hidden="true"><button type="button" aria-label="关闭">×</button><img alt="放大图片"></div>
<script>window.CAFELE_BASE="<?= SITE_URL ?>";</script>
<script src="<?= SITE_URL ?>/public/assets/js/main.js"></script>
