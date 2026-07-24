<?php
/**
 * CAFELE CMS - 导航菜单管理
 *
 * 管理网站导航菜单，支持多级下拉菜单。
 * 字段：location (header/footer), parent_id, label, url, sort_order, is_active
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();
$error = '';
$success = '';

$locations = [
    'header' => '顶部导航',
    'footer' => '底部导航',
];

// 处理 POST 请求
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf($_POST['csrf'] ?? '')) {
        $error = '表单已过期，请刷新后重试。';
    } else {
        if ($_POST['action'] === 'save') {
            $id = (int)($_POST['id'] ?? 0);
            $location = trim($_POST['location'] ?? '');
            $parent_id = (int)($_POST['parent_id'] ?? 0);
            $label = trim($_POST['label'] ?? '');
            $url = trim($_POST['url'] ?? '');
            $sort_order = (int)($_POST['sort_order'] ?? 0);
            $is_active = isset($_POST['is_active']) ? 1 : 0;

            if (!isset($locations[$location])) {
                $error = '请选择有效的菜单位置。';
            } elseif (!$label) {
                $error = '请填写菜单名称。';
            } elseif (!$url) {
                $error = '请填写菜单链接。';
            } else {
                try {
                    if ($id > 0) {
                        // 不允许将父级设为自己的子级
                        if ($parent_id > 0) {
                            $stmt = $db->prepare("SELECT id FROM menus WHERE parent_id = ? AND id = ?");
                            $stmt->execute([$id, $parent_id]);
                            if ($stmt->fetch()) {
                                $error = '不能将菜单项设为自身的子项。';
                                goto after_save;
                            }
                        }
                        $db->prepare("UPDATE menus SET location=?, parent_id=?, label=?, url=?, sort_order=?, is_active=? WHERE id=?")
                            ->execute([$location, $parent_id, $label, $url, $sort_order, $is_active, $id]);
                        $success = '菜单已更新！';
                    } else {
                        $db->prepare("INSERT INTO menus (location, parent_id, label, url, sort_order, is_active) VALUES (?,?,?,?,?,?)")
                            ->execute([$location, $parent_id, $label, $url, $sort_order, $is_active]);
                        $success = '菜单已添加！';
                    }
                } catch (PDOException $e) {
                    $error = '保存失败：' . $e->getMessage();
                }
            }
            after_save:
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)($_POST['id'] ?? 0);
            if ($id > 0) {
                // 将子菜单提升为顶级（parent_id = 0）
                $db->prepare("UPDATE menus SET parent_id = 0 WHERE parent_id = ?")->execute([$id]);
                $db->prepare("DELETE FROM menus WHERE id = ?")->execute([$id]);
                $success = '菜单已删除，下级菜单已提升为顶级。';
            }
        } elseif ($_POST['action'] === 'toggle') {
            $id = (int)($_POST['id'] ?? 0);
            if ($id > 0) {
                $db->prepare("UPDATE menus SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?")->execute([$id]);
                $success = '状态已切换！';
            }
        }
    }
}

// 编辑模式
$edit_menu = null;
if (isset($_GET['edit'])) {
    $stmt = $db->prepare("SELECT * FROM menus WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $edit_menu = $stmt->fetch();
}

// 获取所有菜单项，按 location、sort_order、id 排序
$all_menus = $db->query("SELECT * FROM menus ORDER BY FIELD(location,'header','footer'), sort_order ASC, id ASC")->fetchAll();

// 构建树形结构
function build_menu_tree(array $items, int $parent_id = 0): array {
    $tree = [];
    foreach ($items as $item) {
        if ((int)$item['parent_id'] === $parent_id) {
            $children = build_menu_tree($items, (int)$item['id']);
            $item['children'] = $children;
            $tree[] = $item;
        }
    }
    return $tree;
}

$menu_tree = [];
foreach (array_keys($locations) as $loc) {
    $loc_items = array_filter($all_menus, fn($m) => $m['location'] === $loc);
    $menu_tree[$loc] = build_menu_tree($loc_items);
}

// 获取可选的父级菜单（同一位置，排除自身和子级）
function get_parent_options(PDO $db, string $location, ?array $edit_menu): array {
    if (!$edit_menu) {
        $stmt = $db->prepare("SELECT * FROM menus WHERE location = ? AND parent_id = 0 ORDER BY sort_order ASC, id ASC");
        $stmt->execute([$location]);
        return $stmt->fetchAll();
    }
    // 排除自身及其所有下级
    $exclude = [$edit_menu['id']];
    $queue = [$edit_menu['id']];
    while ($queue) {
        $pid = array_shift($queue);
        $stmt = $db->prepare("SELECT id FROM menus WHERE parent_id = ?");
        $stmt->execute([$pid]);
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        foreach ($ids as $cid) {
            $exclude[] = (int)$cid;
            $queue[] = (int)$cid;
        }
    }
    $placeholders = implode(',', array_fill(0, count($exclude), '?'));
    $stmt = $db->prepare("SELECT * FROM menus WHERE location = ? AND parent_id = 0 AND id NOT IN ($placeholders) ORDER BY sort_order ASC, id ASC");
    $stmt->execute(array_merge([$location], $exclude));
    return $stmt->fetchAll();
}

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>导航菜单管理</h1>
    <a href="menus.php" class="btn">← 返回列表</a>
</div>

<?php if ($error): ?><div class="alert error"><?= h($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="alert success"><?= h($success) ?></div><?php endif; ?>

<div style="display:grid;grid-template-columns:<?= $edit_menu ? '1fr 470px' : '1fr' ?>;gap:20px;">

    <!-- 菜单列表 -->
    <div class="card">
        <h3 style="margin:0 0 16px;">现有菜单项</h3>
        <?php
        $has_items = false;
        foreach ($locations as $loc_key => $loc_label):
            $tree = $menu_tree[$loc_key] ?? [];
            if (empty($tree)) continue;
            $has_items = true;
        ?>
            <h4 style="margin:18px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--line);color:var(--brand);">
                <?= h($loc_label) ?>
            </h4>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>菜单名称</th>
                            <th style="width:140px;">链接</th>
                            <th style="width:60px;">排序</th>
                            <th style="width:70px;">状态</th>
                            <th style="width:150px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        function render_menu_rows(array $items, int $depth = 0): void {
                            foreach ($items as $item):
                        ?>
                            <tr>
                                <td style="padding-left:<?= 16 + $depth * 24 ?>px;">
                                    <?php if ($depth > 0): ?>
                                        <span style="color:var(--muted);margin-right:4px;">↳</span>
                                    <?php endif; ?>
                                    <strong><?= h($item['label']) ?></strong>
                                    <?php if (empty($item['url'])): ?>
                                        <small style="color:var(--muted);">(分组)</small>
                                    <?php endif; ?>
                                </td>
                                <td><code style="font-size:12px;"><?= h($item['url']) ?></code></td>
                                <td><?= (int)$item['sort_order'] ?></td>
                                <td><span class="status <?= $item['is_active'] ? '' : 'off' ?>"><?= $item['is_active'] ? '启用' : '禁用' ?></span></td>
                                <td class="actions">
                                    <a href="menus.php?edit=<?= $item['id'] ?>" class="btn small">编辑</a>
                                    <form method="post" style="display:inline;">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="action" value="toggle">
                                        <input type="hidden" name="id" value="<?= $item['id'] ?>">
                                        <button type="submit" class="btn small"><?= $item['is_active'] ? '禁用' : '启用' ?></button>
                                    </form>
                                    <form method="post" style="display:inline;" onsubmit="return confirm('确定要删除「<?= h($item['label']) ?>」吗？其下级菜单将提升为顶级。')">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?= $item['id'] ?>">
                                        <button type="submit" class="btn small danger">删除</button>
                                    </form>
                                </td>
                            </tr>
                        <?php
                                if (!empty($item['children'])) {
                                    render_menu_rows($item['children'], $depth + 1);
                                }
                            endforeach;
                        }
                        render_menu_rows($tree);
                        ?>
                    </tbody>
                </table>
            </div>
        <?php endforeach; ?>
        <?php if (!$has_items): ?>
            <p style="color:var(--muted);padding:40px 0;text-align:center;">暂无菜单项，请在右侧添加。</p>
        <?php endif; ?>
    </div>

    <!-- 编辑/添加表单 -->
    <div class="card" style="align-self:start;">
        <h3 style="margin:0 0 16px;"><?= $edit_menu ? '编辑菜单项' : '添加菜单项' ?></h3>
        <form method="post" id="menuForm">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="id" value="<?= $edit_menu['id'] ?? 0 ?>">

            <div class="field">
                <label>菜单位置 <span style="color:var(--danger);">*</span></label>
                <select name="location" class="input" required onchange="onLocationChange(this.value)">
                    <option value="">- 请选择 -</option>
                    <?php foreach ($locations as $val => $label): ?>
                        <option value="<?= $val ?>" <?= ($edit_menu['location'] ?? '') === $val ? 'selected' : '' ?>><?= h($label) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="field">
                <label>菜单名称 <span style="color:var(--danger);">*</span></label>
                <input class="input" name="label" value="<?= h($edit_menu['label'] ?? '') ?>" required placeholder="例如：产品中心">
            </div>

            <div class="field">
                <label>链接地址 <span style="color:var(--danger);">*</span></label>
                <input class="input" name="url" value="<?= h($edit_menu['url'] ?? '') ?>" required placeholder="例如：/products.php 或 http://example.com">
            </div>

            <div class="field" id="parentField">
                <label>上级菜单（留空为顶级）</label>
                <select name="parent_id" class="input">
                    <option value="0">- 顶级菜单 -</option>
                    <?php if ($edit_menu): ?>
                        <?php foreach (get_parent_options($db, $edit_menu['location'] ?? '', $edit_menu) as $p): ?>
                            <option value="<?= $p['id'] ?>" <?= ((int)($edit_menu['parent_id'] ?? 0)) === (int)$p['id'] ? 'selected' : '' ?>>
                                <?= h($p['label']) ?>
                            </option>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </select>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="field">
                    <label>排序</label>
                    <input class="input" type="number" name="sort_order" value="<?= (int)($edit_menu['sort_order'] ?? 0) ?>" min="0" step="1">
                    <small>数字越小越靠前</small>
                </div>
                <div class="field" style="justify-content:flex-end;padding-bottom:8px;">
                    <label style="margin-bottom:4px;">启用状态</label>
                    <label class="check">
                        <input type="checkbox" name="is_active" value="1" <?= (!isset($edit_menu['is_active']) || $edit_menu['is_active']) ? 'checked' : '' ?>>
                        <span>在前台显示</span>
                    </label>
                </div>
            </div>

            <button type="submit" class="btn primary" style="margin-top:12px;width:100%;">
                💾 <?= $edit_menu ? '更新菜单项' : '添加菜单项' ?>
            </button>
        </form>
    </div>
</div>

<script>
// 当菜单位置改变时，刷新上级菜单下拉选项
function onLocationChange(location) {
    if (!location) return;
    // 如果是编辑模式且有当前编辑项，页面刷新即可
    <?php if ($edit_menu): ?>
        // 编辑模式下更改位置需要刷新页面以重新加载父级菜单
        window.location.href = 'menus.php?edit=<?= $edit_menu['id'] ?>&loc=' + location;
    <?php else: ?>
        // 添加模式下，通过 AJAX 重新加载父级选项
        const parentSelect = document.querySelector('select[name="parent_id"]');
        if (!parentSelect) return;

        // 保存当前选中的值
        const currentVal = parentSelect.value;

        fetch('menus_ajax.php?location=' + encodeURIComponent(location))
            .then(r => r.json())
            .then(data => {
                parentSelect.innerHTML = '<option value="0">- 顶级菜单 -</option>';
                data.forEach(function(item) {
                    const opt = document.createElement('option');
                    opt.value = item.id;
                    opt.textContent = item.label;
                    parentSelect.appendChild(opt);
                });
                // 如果可以恢复之前选中的值则恢复
                if (currentVal && Array.from(parentSelect.options).some(o => o.value === currentVal)) {
                    parentSelect.value = currentVal;
                }
            })
            .catch(() => {});
    <?php endif; ?>
}
</script>

<?php require __DIR__ . '/footer.php'; ?>
