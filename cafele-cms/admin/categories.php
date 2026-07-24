<?php
/**
 * CAFELE CMS - 分类管理
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();
$error = '';
$success = '';

// 添加分类
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf($_POST['csrf'] ?? '')) {
        $error = '表单已过期。';
    } else {
        if ($_POST['action'] === 'add') {
            $name = trim($_POST['name'] ?? '');
            $slug = trim($_POST['slug'] ?? '');
            if ($name && $slug) {
                try {
                    $db->prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")->execute([$name, $slug]);
                    $success = '分类已添加！';
                } catch (PDOException $e) {
                    $error = '添加失败：' . ($e->getCode() == 23000 ? '该别名已存在' : $e->getMessage());
                }
            } else {
                $error = '请填写名称和别名。';
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)($_POST['id'] ?? 0);
            $db->prepare("UPDATE products SET category_id = NULL WHERE category_id = ?")->execute([$id]);
            $db->prepare("DELETE FROM categories WHERE id = ?")->execute([$id]);
            $success = '分类已删除！';
        } elseif ($_POST['action'] === 'reorder') {
            $ids = $_POST['ids'] ?? '';
            $id_list = array_map('intval', explode(',', $ids));
            foreach ($id_list as $i => $cid) {
                if ($cid > 0) {
                    $db->prepare("UPDATE categories SET sort_order = ? WHERE id = ?")->execute([$i + 1, $cid]);
                }
            }
            $success = '排序已更新！';
        }
    }
}

$categories = get_categories();
require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>分类管理</h1>
</div>

<?php if ($error): ?><div class="alert error"><?= h($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="alert success"><?= h($success) ?></div><?php endif; ?>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <div class="card">
        <h3 style="margin:0 0 16px;">添加分类</h3>
        <form method="post">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="add">
            <div class="field">
                <label>分类名称</label>
                <input class="input" name="name" required placeholder="例如：多功能一体机">
            </div>
            <div class="field">
                <label>别名 (Slug)</label>
                <input class="input" name="slug" required placeholder="例如：all-in-one">
            </div>
            <button type="submit" class="btn primary" style="margin-top:8px;">➕ 添加分类</button>
        </form>
    </div>

    <div class="card">
        <h3 style="margin:0 0 16px;">现有分类（拖拽排序）</h3>
        <?php if (empty($categories)): ?>
            <p style="color:var(--muted);">暂无分类</p>
        <?php else: ?>
            <div id="categoryList">
                <?php foreach ($categories as $cat): ?>
                    <div class="category-item" data-id="<?= $cat['id'] ?>" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid var(--line);cursor:grab;">
                        <span style="color:var(--muted);cursor:grab;">⠿</span>
                        <span style="flex:1;"><strong><?= h($cat['name']) ?></strong> <small style="color:var(--muted);">(<?= h($cat['slug']) ?>)</small></span>
                        <span style="color:var(--muted);font-size:12px;">排序: <?= $cat['sort_order'] ?></span>
                        <form method="post" style="display:inline;" onsubmit="return confirm('确定要删除此分类吗？')">
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" value="<?= $cat['id'] ?>">
                            <button type="submit" class="btn small danger">删除</button>
                        </form>
                    </div>
                <?php endforeach; ?>
            </div>
            <form method="post" id="reorderForm">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="reorder">
                <input type="hidden" name="ids" id="orderIds">
                <button type="submit" class="btn small" style="margin-top:12px;" onclick="saveOrder()">💾 保存排序</button>
            </form>
        <?php endif; ?>
    </div>
</div>

<script>
let dragItem = null;
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('dragstart', e => {
        dragItem = item;
        setTimeout(() => item.style.opacity = '0.5', 0);
    });
    item.addEventListener('dragend', e => {
        setTimeout(() => { item.style.opacity = '1'; dragItem = null; }, 0);
    });
    item.addEventListener('dragover', e => {
        e.preventDefault();
        if (dragItem && dragItem !== item) {
            const rect = item.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (e.clientY < mid) item.parentNode.insertBefore(dragItem, item);
            else item.parentNode.insertBefore(dragItem, item.nextSibling);
        }
    });
    item.addEventListener('drop', e => { e.preventDefault(); });
    item.draggable = true;
});

function saveOrder() {
    const items = document.querySelectorAll('.category-item');
    const ids = Array.from(items).map(i => i.dataset.id).join(',');
    document.getElementById('orderIds').value = ids;
    return true;
}
</script>

<?php require __DIR__ . '/footer.php'; ?>
