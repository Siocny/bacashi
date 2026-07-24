<?php
/**
 * CAFELE CMS - 首页版块管理
 *
 * 管理首页各区域版块：feature_banner（特色横幅）、category_grid（分类网格）、
 * banner（普通横幅）、product_grid（产品网格）
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();
$error = '';
$success = '';

// 版块类型配置
$section_types = [
    'feature_banner' => '特色横幅',
    'category_grid'  => '分类网格',
    'banner'         => '普通横幅',
    'product_grid'   => '产品网格',
];

$mode_options = [
    'featured' => '推荐产品',
    'latest'   => '最新产品',
];

// 处理 POST 请求
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf($_POST['csrf'] ?? '')) {
        $error = '表单已过期，请刷新后重试。';
    } else {
        if ($_POST['action'] === 'save') {
            $id = (int)($_POST['id'] ?? 0);
            $section_type = trim($_POST['section_type'] ?? '');
            $title = trim($_POST['title'] ?? '');
            $subtitle = trim($_POST['subtitle'] ?? '');
            $image = trim($_POST['image'] ?? '');
            $link = trim($_POST['link'] ?? '');
            $button_text = trim($_POST['button_text'] ?? '');
            $content = $_POST['content'] ?? '';
            $limit_count = (int)($_POST['limit_count'] ?? 6);
            $mode = trim($_POST['mode'] ?? 'featured');
            $sort_order = (int)($_POST['sort_order'] ?? 0);
            $is_active = isset($_POST['is_active']) ? 1 : 0;

            if (!array_key_exists($section_type, $section_types)) {
                $error = '请选择有效的版块类型。';
            } else {
                try {
                    if ($id > 0) {
                        $db->prepare("UPDATE sections SET section_type=?, title=?, subtitle=?, image=?, link=?, button_text=?, content=?, limit_count=?, mode=?, sort_order=?, is_active=? WHERE id=?")
                            ->execute([$section_type, $title, $subtitle, $image, $link, $button_text, $content, $limit_count, $mode, $sort_order, $is_active, $id]);
                        $success = '版块已更新！';
                    } else {
                        $db->prepare("INSERT INTO sections (section_type, title, subtitle, image, link, button_text, content, limit_count, mode, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
                            ->execute([$section_type, $title, $subtitle, $image, $link, $button_text, $content, $limit_count, $mode, $sort_order, $is_active]);
                        $success = '版块已创建！';
                    }
                } catch (PDOException $e) {
                    $error = '保存失败：' . $e->getMessage();
                }
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)($_POST['id'] ?? 0);
            if ($id > 0) {
                // 删除关联的图片文件
                $stmt = $db->prepare("SELECT image FROM sections WHERE id = ?");
                $stmt->execute([$id]);
                $section = $stmt->fetch();
                if ($section && !empty($section['image'])) {
                    delete_upload($section['image']);
                }
                $db->prepare("DELETE FROM sections WHERE id = ?")->execute([$id]);
                $success = '版块已删除！';
            }
        } elseif ($_POST['action'] === 'toggle') {
            $id = (int)($_POST['id'] ?? 0);
            if ($id > 0) {
                $db->prepare("UPDATE sections SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?")->execute([$id]);
                $success = '状态已切换！';
            }
        }
    }
}

// 获取所有版块，按 sort_order 升序
$sections = $db->query("SELECT * FROM sections ORDER BY sort_order ASC, id DESC")->fetchAll();

// 编辑模式
$edit_section = null;
if (isset($_GET['edit'])) {
    $stmt = $db->prepare("SELECT * FROM sections WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $edit_section = $stmt->fetch();
}

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>首页版块管理</h1>
    <a href="sections.php" class="btn">← 返回列表</a>
</div>

<?php if ($error): ?><div class="alert error"><?= h($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="alert success"><?= h($success) ?></div><?php endif; ?>

<div style="display:grid;grid-template-columns:<?= $edit_section ? '1fr 470px' : '1fr' ?>;gap:20px;">

    <!-- 版块列表 -->
    <div class="card">
        <h3 style="margin:0 0 16px;">现有版块</h3>
        <?php if (empty($sections)): ?>
            <p style="color:var(--muted);padding:40px 0;text-align:center;">暂无版块，点击右上角添加。</p>
        <?php else: ?>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:80px;">预览</th>
                            <th>标题 / 类型</th>
                            <th style="width:80px;">排序</th>
                            <th style="width:80px;">状态</th>
                            <th style="width:160px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($sections as $s): ?>
                            <tr>
                                <td>
                                    <?php if ($s['image']): ?>
                                        <img src="<?= image_url($s['image']) ?>" alt="" class="thumb" style="width:100px;height:60px;object-fit:cover;border-radius:6px;">
                                    <?php else: ?>
                                        <div class="thumb" style="width:100px;height:60px;background:var(--soft);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:20px;border-radius:6px;">
                                            <?php if ($s['section_type'] === 'category_grid'): ?>📁
                                            <?php elseif ($s['section_type'] === 'product_grid'): ?>📦
                                            <?php else: ?>🖼️
                                            <?php endif; ?>
                                        </div>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <strong><?= h($s['title'] ?: '(无标题)') ?></strong>
                                    <br><small style="color:var(--muted);"><?= h($section_types[$s['section_type']] ?? $s['section_type']) ?></small>
                                    <?php if ($s['section_type'] === 'product_grid'): ?>
                                        <small style="color:var(--muted);"> / <?= h($mode_options[$s['mode']] ?? $s['mode']) ?>(<?= (int)$s['limit_count'] ?>)</small>
                                    <?php endif; ?>
                                </td>
                                <td><?= (int)$s['sort_order'] ?></td>
                                <td><span class="status <?= $s['is_active'] ? '' : 'off' ?>"><?= $s['is_active'] ? '启用' : '禁用' ?></span></td>
                                <td class="actions">
                                    <a href="sections.php?edit=<?= $s['id'] ?>" class="btn small">编辑</a>
                                    <form method="post" style="display:inline;">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="action" value="toggle">
                                        <input type="hidden" name="id" value="<?= $s['id'] ?>">
                                        <button type="submit" class="btn small"><?= $s['is_active'] ? '禁用' : '启用' ?></button>
                                    </form>
                                    <form method="post" style="display:inline;" onsubmit="return confirm('确定要删除此版块吗？')">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<?= $s['id'] ?>">
                                        <button type="submit" class="btn small danger">删除</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>

    <!-- 编辑/添加表单 -->
    <div class="card">
        <h3 style="margin:0 0 16px;"><?= $edit_section ? '编辑版块' : '添加版块' ?></h3>
        <form method="post" id="sectionForm">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="id" value="<?= $edit_section['id'] ?? 0 ?>">

            <div class="field">
                <label>版块类型 <span style="color:var(--danger);">*</span></label>
                <select name="section_type" class="input" required onchange="toggleSectionFields(this.value)">
                    <option value="">- 请选择 -</option>
                    <?php foreach ($section_types as $val => $label): ?>
                        <option value="<?= $val ?>" <?= ($edit_section['section_type'] ?? '') === $val ? 'selected' : '' ?>><?= h($label) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="field">
                <label>标题</label>
                <input class="input" name="title" value="<?= h($edit_section['title'] ?? '') ?>" placeholder="例如：热销产品推荐">
            </div>

            <div class="field">
                <label>副标题</label>
                <input class="input" name="subtitle" value="<?= h($edit_section['subtitle'] ?? '') ?>" placeholder="一行简短的描述文字">
            </div>

            <!-- 图片上传（非分类网格类型需要图片） -->
            <div class="field" id="imageField">
                <label>图片</label>
                <div style="display:flex;gap:8px;">
                    <input class="input" name="image" id="sectionImage" value="<?= h($edit_section['image'] ?? '') ?>" placeholder="点击上传或输入图片 URL" readonly style="cursor:pointer;background:var(--soft);" onclick="document.getElementById('imageUploadInput').click();">
                    <button type="button" class="btn" onclick="document.getElementById('imageUploadInput').click();">上传</button>
                </div>
                <input type="file" id="imageUploadInput" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;">
                <?php if (!empty($edit_section['image'])): ?>
                    <img src="<?= image_url($edit_section['image']) ?>" alt="" class="image-preview" id="sectionImagePreview">
                <?php else: ?>
                    <div class="image-preview" id="sectionImagePreview" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;">暂无图片</div>
                <?php endif; ?>
                <small>建议尺寸：1920 x 600 px（横幅），600 x 600 px（特色），支持 JPG/PNG/GIF/WebP</small>
            </div>

            <!-- 链接和按钮文字 -->
            <div class="section-fields-group" id="linkFields" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="field">
                    <label>按钮文字</label>
                    <input class="input" name="button_text" value="<?= h($edit_section['button_text'] ?? '') ?>" placeholder="例如：了解更多">
                </div>
                <div class="field">
                    <label>链接地址</label>
                    <input class="input" name="link" value="<?= h($edit_section['link'] ?? '') ?>" placeholder="例如：/products.php">
                </div>
            </div>

            <!-- 产品网格专属字段 -->
            <div id="productGridFields" style="display:<?= ($edit_section['section_type'] ?? '') === 'product_grid' ? 'grid' : 'none' ?>;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="field">
                    <label>显示模式</label>
                    <select name="mode" class="input">
                        <?php foreach ($mode_options as $val => $label): ?>
                            <option value="<?= $val ?>" <?= ($edit_section['mode'] ?? 'featured') === $val ? 'selected' : '' ?>><?= h($label) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="field">
                    <label>显示数量</label>
                    <input class="input" type="number" name="limit_count" value="<?= (int)($edit_section['limit_count'] ?? 6) ?>" min="1" max="50" step="1">
                </div>
            </div>

            <!-- 富文本内容 -->
            <div class="field" id="contentField" style="margin-top:4px;">
                <label>内容（支持 HTML）</label>
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
                        <?= $edit_section['content'] ?? '' ?>
                    </div>
                    <textarea class="editor-source" id="sourceEditor" name="content" style="display:none;"><?= h($edit_section['content'] ?? '') ?></textarea>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px;">
                <div class="field">
                    <label>排序</label>
                    <input class="input" type="number" name="sort_order" value="<?= (int)($edit_section['sort_order'] ?? 0) ?>" min="0" step="1">
                    <small>数字越小越靠前</small>
                </div>
                <div class="field" style="justify-content:flex-end;padding-bottom:8px;">
                    <label style="margin-bottom:4px;">启用状态</label>
                    <label class="check">
                        <input type="checkbox" name="is_active" value="1" <?= (!isset($edit_section['is_active']) || $edit_section['is_active']) ? 'checked' : '' ?>>
                        <span>在前台显示此版块</span>
                    </label>
                </div>
            </div>

            <button type="submit" class="btn primary" style="margin-top:12px;width:100%;">
                💾 <?= $edit_section ? '更新版块' : '添加版块' ?>
            </button>
        </form>
    </div>
</div>

<script>
// 图片上传函数
function setupUpload(triggerId, inputId, targetInputId, previewId) {
    const trigger = document.getElementById(triggerId);
    if (trigger) {
        trigger.addEventListener('click', function(e) {
            // 判断点击目标是否在按钮上，或是 input 本身就触发
            if (e.target.tagName === 'BUTTON' || e.target.id === triggerId) {
                document.getElementById(inputId).click();
            }
        });
    }

    document.getElementById(inputId)?.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const btn = this.parentElement.querySelector('.btn');
        const originalText = btn ? btn.textContent : '';
        if (btn) btn.textContent = '上传中…';

        fetch('upload.php', {
            method: 'POST',
            body: formData
        })
        .then(r => r.json())
        .then(data => {
            if (data.url) {
                document.getElementById(targetInputId).value = data.url;
                document.getElementById(targetInputId).style.color = 'var(--ink)';
                const preview = document.getElementById(previewId);
                if (preview) {
                    if (preview.tagName === 'IMG') {
                        preview.src = data.url;
                    } else {
                        const img = document.createElement('img');
                        img.src = data.url;
                        img.alt = '';
                        img.className = 'image-preview';
                        img.id = previewId;
                        preview.parentNode.replaceChild(img, preview);
                    }
                }
                showToast('图片上传成功', 'success');
            } else {
                showToast('上传失败：' + (data.error || '未知错误'), 'error');
            }
        })
        .catch(err => {
            showToast('上传出错：' + err.message, 'error');
        })
        .finally(() => {
            if (btn) btn.textContent = originalText || '上传';
        });

        this.value = '';
    });
}

setupUpload('imageUploadInput', 'imageUploadInput', 'sectionImage', 'sectionImagePreview');

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

// 根据版块类型切换显示字段
function toggleSectionFields(type) {
    const imageField = document.getElementById('imageField');
    const linkFields = document.getElementById('linkFields');
    const productGridFields = document.getElementById('productGridFields');
    const contentField = document.getElementById('contentField');

    // 所有类型都显示图片、链接字段
    if (imageField) imageField.style.display = '';
    if (linkFields) linkFields.style.display = '';
    if (contentField) contentField.style.display = '';

    // 产品网格：显示 mode/limit_count
    if (productGridFields) {
        productGridFields.style.display = type === 'product_grid' ? 'grid' : 'none';
    }

    // 分类网格：可隐藏图片和链接（非必须）
    if (type === 'category_grid') {
        if (imageField) imageField.style.display = 'none';
        if (contentField) contentField.style.display = 'none';
    }

    // 特色横幅：显示全部
}

// 初始化隐藏字段
(function() {
    const type = document.querySelector('select[name="section_type"]')?.value;
    if (type) toggleSectionFields(type);
})();

// 表单提交前同步编辑器内容
document.querySelector('form')?.addEventListener('submit', function() {
    const editor = document.getElementById('editor');
    const source = document.getElementById('sourceEditor');
    if (source.style.display === 'none') {
        source.value = editor.innerHTML;
    }
});
</script>

<?php require __DIR__ . '/footer.php'; ?>
