<?php
/**
 * CAFELE CMS - 产品编辑（添加/编辑/删除）
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();
$error = '';
$success = '';
$product = null;
$images = [];
$is_clone = false;

// 处理删除
if (isset($_GET['delete'])) {
    $id = (int)$_GET['delete'];
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && verify_csrf($_POST['csrf'] ?? '')) {
        // 删除产品图片记录
        $db->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$id]);
        $db->prepare("DELETE FROM products WHERE id = ?")->execute([$id]);
        redirect('products.php');
    }
}

// 处理保存
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save') {
    if (!verify_csrf($_POST['csrf'] ?? '')) {
        $error = '表单已过期，请刷新页面重试。';
    } else {
        $name = trim($_POST['name'] ?? '');
        $slug = trim($_POST['slug'] ?? '');
        $subtitle = trim($_POST['subtitle'] ?? '');
        $category_id = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
        $specs_json = trim($_POST['specs_json'] ?? '');
        $content = $_POST['content'] ?? '';
        $image = trim($_POST['image'] ?? '');
        $status = isset($_POST['status']) ? 1 : 0;
        $featured = isset($_POST['featured']) ? 1 : 0;

        if (empty($name)) { $error = '请输入产品名称。'; }
        elseif (empty($slug)) { $error = '请输入产品别名(slug)。'; }
        else {
            // 验证 slug 唯一性
            $id = (int)($_POST['id'] ?? 0);
            $check = $db->prepare("SELECT COUNT(*) FROM products WHERE slug = ? AND id != ?");
            $check->execute([$slug, $id]);
            if ($check->fetchColumn() > 0) {
                $error = '该别名(slug)已被使用，请更换。';
            } else {
                $specs = [];
                if ($specs_json) {
                    $specs = json_decode($specs_json, true) ?: [];
                }

                $data = [
                    'name' => $name,
                    'slug' => $slug,
                    'subtitle' => $subtitle,
                    'category_id' => $category_id,
                    'specs' => json_encode($specs, JSON_UNESCAPED_UNICODE),
                    'content' => $content,
                    'image' => $image,
                    'status' => $status,
                    'featured' => $featured,
                ];

                if ($id > 0) {
                    // 更新
                    $sets = [];
                    $params = [];
                    foreach ($data as $k => $v) {
                        $sets[] = "$k = ?";
                        $params[] = $v;
                    }
                    $params[] = $id;
                    $db->prepare("UPDATE products SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);
                    $success = '产品已更新！';
                } else {
                    // 新增
                    $keys = implode(', ', array_keys($data));
                    $placeholders = implode(', ', array_fill(0, count($data), '?'));
                    $db->prepare("INSERT INTO products ($keys) VALUES ($placeholders)")->execute(array_values($data));
                    $id = (int)$db->lastInsertId();
                    $success = '产品已创建！';
                }

                // 处理产品图片（从逗号分隔的 URL）
                $gallery_raw = trim($_POST['gallery'] ?? '');
                if ($gallery_raw) {
                    $urls = array_map('trim', explode("\n", $gallery_raw));
                    $urls = array_filter($urls);
                    // 删除旧图片记录
                    $db->prepare("DELETE FROM product_images WHERE product_id = ?")->execute([$id]);
                    $ins = $db->prepare("INSERT INTO product_images (product_id, image_path, sort_order) VALUES (?, ?, ?)");
                    foreach ($urls as $i => $url) {
                        if ($url) $ins->execute([$id, $url, $i + 1]);
                    }
                }
            }
        }
    }
}

// 读取产品数据
$edit_id = (int)($_GET['id'] ?? 0);
$is_clone = isset($_GET['clone']);

if ($edit_id > 0 && !$is_clone) {
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$edit_id]);
    $product = $stmt->fetch();

    if ($product) {
        // 读取图片列表
        $img_stmt = $db->prepare("SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC");
        $img_stmt->execute([$edit_id]);
        $images = $img_stmt->fetchAll();
    }
} elseif ($is_clone && $edit_id > 0) {
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$edit_id]);
    $product = $stmt->fetch();
    if ($product) {
        $product['id'] = 0; // 重置 ID 以便创建新记录
        $product['slug'] = $product['slug'] . '-copy';
    }
}

$categories = get_categories();
require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1><?= $product && !$is_clone ? '编辑产品' : '添加产品' ?></h1>
    <a href="products.php" class="btn">← 返回列表</a>
</div>

<?php if ($error): ?><div class="alert error"><?= h($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="alert success"><?= h($success) ?></div><?php endif; ?>

<div class="card">
    <form method="post">
        <input type="hidden" name="action" value="save">
        <?= csrf_field() ?>
        <input type="hidden" name="id" value="<?= $product['id'] ?? 0 ?>">

        <div class="form-grid">
            <div class="field full">
                <label>产品名称 *</label>
                <input class="input" name="name" value="<?= h($product['name'] ?? '') ?>" required placeholder="例如：PL12 智能搭电充气一体机">
            </div>

            <div class="field">
                <label>别名 (Slug) *</label>
                <input class="input" name="slug" value="<?= h($product['slug'] ?? '') ?>" required placeholder="例如：pl12">
                <small>用于 URL，如 product.php?slug=pl12</small>
            </div>

            <div class="field">
                <label>分类</label>
                <select name="category_id" class="input">
                    <option value="">- 无分类 -</option>
                    <?php foreach ($categories as $cat): ?>
                        <option value="<?= $cat['id'] ?>" <?= ($product['category_id'] ?? '') == $cat['id'] ? 'selected' : '' ?>>
                            <?= h($cat['name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="field">
                <label>状态</label>
                <label class="check" style="margin-top:10px;">
                    <input type="checkbox" name="status" value="1" <?= !isset($product['status']) || $product['status'] ? 'checked' : '' ?>>
                    已上架
                </label>
                <label class="check">
                    <input type="checkbox" name="featured" value="1" <?= !empty($product['featured']) ? 'checked' : '' ?>>
                    首页推荐
                </label>
            </div>

            <div class="field full">
                <label>副标题</label>
                <input class="input" name="subtitle" value="<?= h($product['subtitle'] ?? '') ?>" placeholder="简短的产品描述，显示在产品卡片上">
            </div>

            <div class="field full">
                <label>产品主图</label>
                <div style="display:flex;gap:12px;align-items:start;">
                    <input class="input" name="image" id="mainImage" value="<?= h($product['image'] ?? '') ?>" placeholder="图片 URL 或上传">
                    <button type="button" class="btn" onclick="document.getElementById('imgUpload').click()">📁 上传</button>
                    <input type="file" id="imgUpload" accept="image/*" style="display:none" onchange="uploadImage(this, 'mainImage')">
                </div>
                <?php if (!empty($product['image'])): ?>
                    <img src="<?= image_url($product['image']) ?>" class="image-preview" alt="">
                <?php endif; ?>
            </div>

            <div class="field full">
                <label>产品图片画廊（每行一个 URL）</label>
                <textarea class="input" name="gallery" style="min-height:80px;" placeholder="产品图片 URL，每行一个"><?php
                    if (!empty($images)) {
                        foreach ($images as $img) echo h($img['image_path']) . "\n";
                    }
                ?></textarea>
            </div>

            <div class="field full">
                <label>规格参数（JSON 格式）</label>
                <div style="display:flex;gap:8px;margin-bottom:8px;">
                    <input class="input" id="specKey" placeholder="参数名，如：峰值电流" style="flex:1;">
                    <input class="input" id="specVal" placeholder="参数值，如：2000A" style="flex:1;">
                    <button type="button" class="btn" onclick="addSpec()">➕ 添加</button>
                </div>
                <input type="hidden" name="specs_json" id="specsJson" value="<?= h($product['specs'] ?? '[]') ?>">
                <div id="specList" style="background:var(--soft);padding:12px;border-radius:8px;min-height:40px;"></div>
            </div>

            <div class="field full">
                <label>产品详情（支持 HTML）</label>
                <div class="editor-wrap">
                    <div class="editor-toolbar">
                        <button type="button" onclick="execCmd('bold')"><b>B</b></button>
                        <button type="button" onclick="execCmd('italic')"><i>I</i></button>
                        <button type="button" onclick="execCmd('underline')"><u>U</u></button>
                        <button type="button" onclick="execCmd('formatBlock','h2')">H2</button>
                        <button type="button" onclick="execCmd('formatBlock','h3')">H3</button>
                        <button type="button" onclick="execCmd('insertUnorderedList')">列表</button>
                        <button type="button" onclick="execCmd('justifyLeft')">左</button>
                        <button type="button" onclick="execCmd('justifyCenter')">中</button>
                        <button type="button" onclick="insertEditorImage()">🖼️ 图片</button>
                        <button type="button" onclick="toggleSource()">🔣 源码</button>
                    </div>
                    <div class="editor-area" id="editor" contenteditable="true">
                        <?= ($product['content'] ?? '') ?>
                    </div>
                    <textarea class="editor-source" id="sourceEditor" name="content" style="display:none;"><?= h($product['content'] ?? '') ?></textarea>
                </div>
            </div>

            <div class="field full" style="margin-top:16px;">
                <button type="submit" class="btn primary" style="padding:12px 32px;">💾 保存产品</button>
            </div>
        </div>
    </form>
</div>

<script>
// 初始化规格列表
function renderSpecs() {
    const el = document.getElementById('specList');
    const json = document.getElementById('specsJson').value;
    const specs = json ? JSON.parse(json) : [];
    el.innerHTML = specs.map((s, i) =>
        `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--line);align-items:center;">
            <strong style="min-width:120px;">${escHtml(s.key || s[0] || '')}</strong>
            <span style="flex:1;color:var(--muted);">${escHtml(s.value || s[1] || '')}</span>
            <button type="button" onclick="removeSpec(${i})" style="border:0;background:none;color:var(--danger);cursor:pointer;">✕</button>
        </div>`
    ).join('');
}

function addSpec() {
    const k = document.getElementById('specKey').value.trim();
    const v = document.getElementById('specVal').value.trim();
    if (!k || !v) return;
    const json = document.getElementById('specsJson').value;
    const specs = json ? JSON.parse(json) : [];
    specs.push({key: k, value: v});
    document.getElementById('specsJson').value = JSON.stringify(specs);
    document.getElementById('specKey').value = '';
    document.getElementById('specVal').value = '';
    renderSpecs();
}

function removeSpec(i) {
    const json = document.getElementById('specsJson').value;
    const specs = json ? JSON.parse(json) : [];
    specs.splice(i, 1);
    document.getElementById('specsJson').value = JSON.stringify(specs);
    renderSpecs();
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

// 富文本编辑器
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

function insertEditorImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const editor = document.getElementById('editor');
                editor.focus();
                document.execCommand('insertImage', false, ev.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// 图片上传处理
function uploadImage(input, targetId) {
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'upload.php', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            try {
                const res = JSON.parse(xhr.responseText);
                if (res.url) {
                    document.getElementById(targetId).value = res.url;
                    showToast('上传成功', 'success');
                } else {
                    showToast(res.error || '上传失败', 'error');
                }
            } catch(e) {
                showToast('上传失败', 'error');
            }
        } else {
            showToast('上传失败', 'error');
        }
        input.value = '';
    };
    xhr.send(formData);
}

// 初始化
renderSpecs();
// 在 form 提交前，将编辑器内容同步到 textarea
document.querySelector('form').addEventListener('submit', function() {
    const editor = document.getElementById('editor');
    const source = document.getElementById('sourceEditor');
    source.value = editor.innerHTML;
    // 如果源码编辑器中还有内容保留
});
</script>

<?php require __DIR__ . '/footer.php'; ?>
