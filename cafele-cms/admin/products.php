<?php
/**
 * CAFELE CMS - 产品管理列表
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();

// 筛选和搜索
$cat_filter = $_GET['cat'] ?? '';
$search = $_GET['q'] ?? '';
$page = max(1, (int)($_GET['p'] ?? 1));
$per_page = 15;
$offset = ($page - 1) * $per_page;

$where = [];
$params = [];

if ($cat_filter) {
    $where[] = "p.category_id = ?";
    $params[] = (int)$cat_filter;
}
if ($search) {
    $where[] = "(p.name LIKE ? OR p.subtitle LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

$where_clause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// 总数
$count_sql = "SELECT COUNT(*) FROM products p $where_clause";
$total = $db->prepare($count_sql);
$total->execute($params);
$total_count = $total->fetchColumn();
$total_pages = max(1, ceil($total_count / $per_page));

// 产品列表
$sql = "SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        $where_clause
        ORDER BY p.sort_order ASC, p.id DESC
        LIMIT $per_page OFFSET $offset";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll();

// 分类列表
$categories = get_categories();

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>产品管理</h1>
    <a href="product_edit.php" class="btn primary">➕ 添加产品</a>
</div>

<div class="card" style="margin-bottom:20px;">
    <form method="get" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <select name="cat" style="padding:8px 12px;border:1px solid var(--line);border-radius:8px;">
            <option value="">所有分类</option>
            <?php foreach ($categories as $cat): ?>
                <option value="<?= $cat['id'] ?>" <?= $cat_filter == $cat['id'] ? 'selected' : '' ?>><?= h($cat['name']) ?></option>
            <?php endforeach; ?>
        </select>
        <input type="text" name="q" value="<?= h($search) ?>" placeholder="搜索产品..." style="padding:8px 12px;border:1px solid var(--line);border-radius:8px;min-width:200px;">
        <button type="submit" class="btn">🔍 搜索</button>
        <a href="products.php" class="btn" style="color:var(--muted);">清除</a>
    </form>
</div>

<div class="card">
    <?php if (empty($products)): ?>
        <p style="text-align:center;padding:40px 0;color:var(--muted);">暂无产品数据。 <a href="product_edit.php">添加第一个产品</a></p>
    <?php else: ?>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:60px;">图片</th>
                        <th>产品名称</th>
                        <th>分类</th>
                        <th>状态</th>
                        <th style="width:160px;">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($products as $product): ?>
                        <tr>
                            <td>
                                <?php if ($product['image']): ?>
                                    <img src="<?= image_url($product['image']) ?>" alt="" class="thumb">
                                <?php else: ?>
                                    <div class="thumb" style="background:var(--soft);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:20px;">📷</div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <strong><?= h($product['name']) ?></strong>
                                <br><small style="color:var(--muted);">slug: <?= h($product['slug']) ?></small>
                            </td>
                            <td><?= h($product['category_name'] ?? '-') ?></td>
                            <td><span class="status <?= $product['status'] ? '' : 'off' ?>"><?= $product['status'] ? '已上架' : '已下架' ?></span></td>
                            <td class="actions">
                                <a href="product_edit.php?id=<?= $product['id'] ?>" class="btn small">编辑</a>
                                <a href="product_edit.php?id=<?= $product['id'] ?>&clone=1" class="btn small" title="复制">📋</a>
                                <a href="javascript:;" onclick="deleteProduct(<?= $product['id'] ?>)" class="btn small danger">删除</a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <!-- 分页 -->
        <?php if ($total_pages > 1): ?>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-size:13px;color:var(--muted);">
                <span>共 <?= $total_count ?> 条，第 <?= $page ?>/<?= $total_pages ?> 页</span>
                <div style="display:flex;gap:6px;">
                    <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                        <a href="?p=<?= $i ?>&cat=<?= urlencode($cat_filter) ?>&q=<?= urlencode($search) ?>"
                           style="padding:6px 12px;border:1px solid var(--line);border-radius:6px;<?= $i === $page ? 'background:var(--brand);color:#fff;border-color:var(--brand);' : '' ?>">
                            <?= $i ?>
                        </a>
                    <?php endfor; ?>
                </div>
            </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<script>
function deleteProduct(id) {
    if (!confirm('确定要删除这个产品吗？此操作不可撤销。')) return;
    const f = document.createElement('form');
    f.method = 'post';
    f.action = 'product_edit.php?delete=' + id;
    f.innerHTML = '<?= csrf_field() ?>';
    document.body.appendChild(f);
    f.submit();
}
</script>

<?php require __DIR__ . '/footer.php'; ?>
