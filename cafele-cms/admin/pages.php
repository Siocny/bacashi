<?php
/**
 * CAFELE CMS - CMS 页面管理
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();

// 处理保存
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf($_POST['csrf'] ?? '')) {
        $error = '表单已过期。';
    } else {
        if ($_POST['action'] === 'save') {
            $id = (int)($_POST['id'] ?? 0);
            $title = trim($_POST['title'] ?? '');
            $slug = trim($_POST['slug'] ?? '');
            $content = $_POST['content'] ?? '';
            $meta = trim($_POST['meta_description'] ?? '');

            if ($id > 0) {
                $db->prepare("UPDATE pages SET title=?, slug=?, content=?, meta_description=? WHERE id=?")
                    ->execute([$title, $slug, $content, $meta, $id]);
                $success = '页面已更新！';
            } else {
                $db->prepare("INSERT INTO pages (title, slug, content, meta_description) VALUES (?,?,?,?)")
                    ->execute([$title, $slug, $content, $meta]);
                $success = '页面已创建！';
            }
        }
    }
}

// 读取页面列表
$pages = $db->query("SELECT * FROM pages ORDER BY id ASC")->fetchAll();

// 编辑模式
$edit_page = null;
if (isset($_GET['edit'])) {
    $stmt = $db->prepare("SELECT * FROM pages WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $edit_page = $stmt->fetch();
}

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>页面管理</h1>
    <a href="pages.php" class="btn">← 返回列表</a>
</div>

<?php if (!empty($success)): ?><div class="alert success"><?= h($success) ?></div><?php endif; ?>
<?php if (!empty($error)): ?><div class="alert error"><?= h($error) ?></div><?php endif; ?>

<div style="display:grid;grid-template-columns:<?= $edit_page ? '1fr 1fr' : '1fr' ?>;gap:20px;">
    <!-- 页面列表 -->
    <div class="card">
        <h3 style="margin:0 0 16px;">现有页面</h3>
        <?php if (empty($pages)): ?>
            <p style="color:var(--muted);">暂无页面</p>
        <?php else: ?>
            <?php foreach ($pages as $p): ?>
                <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);">
                    <div style="flex:1;">
                        <strong><?= h($p['title']) ?></strong>
                        <br><small style="color:var(--muted);">/page.php?slug=<?= h($p['slug']) ?></small>
                    </div>
                    <a href="pages.php?edit=<?= $p['id'] ?>" class="btn small">编辑</a>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>

    <!-- 编辑表单 -->
    <?php if ($edit_page): ?>
    <div class="card">
        <h3 style="margin:0 0 16px;">编辑：<?= h($edit_page['title']) ?></h3>
        <form method="post">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="id" value="<?= $edit_page['id'] ?>">

            <div class="form-grid" style="grid-template-columns:1fr 1fr;">
                <div class="field">
                    <label>页面标题</label>
                    <input class="input" name="title" value="<?= h($edit_page['title']) ?>" required>
                </div>
                <div class="field">
                    <label>别名 (Slug)</label>
                    <input class="input" name="slug" value="<?= h($edit_page['slug']) ?>" required>
                </div>
                <div class="field full">
                    <label>Meta 描述</label>
                    <input class="input" name="meta_description" value="<?= h($edit_page['meta_description'] ?? '') ?>">
                </div>
            </div>

            <div class="field" style="margin-top:16px;">
                <label>页面内容</label>
                <div class="editor-wrap">
                    <div class="editor-toolbar">
                        <button type="button" onclick="execCmd('bold')"><b>B</b></button>
                        <button type="button" onclick="execCmd('italic')"><i>I</i></button>
                        <button type="button" onclick="execCmd('formatBlock','h2')">H2</button>
                        <button type="button" onclick="execCmd('formatBlock','h3')">H3</button>
                        <button type="button" onclick="execCmd('insertImage')">🖼️ 图片</button>
                        <button type="button" onclick="toggleSource()">🔣 源码</button>
                    </div>
                    <div class="editor-area" id="editor" contenteditable="true"><?= $edit_page['content'] ?? '' ?></div>
                    <textarea class="editor-source" id="sourceEditor" name="content" style="display:none;"><?= h($edit_page['content'] ?? '') ?></textarea>
                </div>
            </div>

            <button type="submit" class="btn primary" style="margin-top:12px;">💾 保存</button>
        </form>
    </div>
    <?php endif; ?>
</div>

<script>
function execCmd(cmd, val) {
    document.execCommand(cmd, false, val || null);
    document.getElementById('editor').focus();
}
function toggleSource() {
    const editor = document.getElementById('editor');
    const source = document.getElementById('sourceEditor');
    if (source.style.display === 'none') {
        source.value = editor.innerHTML;
        source.style.display = 'block';
        editor.style.display = 'none';
    } else {
        editor.innerHTML = source.value;
        editor.style.display = 'block';
        source.style.display = 'none';
    }
}
document.querySelector('form')?.addEventListener('submit', function() {
    const source = document.getElementById('sourceEditor');
    const editor = document.getElementById('editor');
    source.value = editor.innerHTML;
});
</script>

<?php require __DIR__ . '/footer.php'; ?>
