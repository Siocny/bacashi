<?php
/**
 * CAFELE CMS - 幻灯片管理（首页轮播图）
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();
$error = '';
$success = '';

// 处理 POST 请求
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf($_POST['csrf'] ?? '')) {
        $error = '表单已过期，请刷新后重试。';
    } else {
        if ($_POST['action'] === 'save') {
            $id = (int)($_POST['id'] ?? 0);
            $title = trim($_POST['title'] ?? '');
            $subtitle = trim($_POST['subtitle'] ?? '');
            $image = trim($_POST['image'] ?? '');
            $mobile_image = trim($_POST['mobile_image'] ?? '');
            $button_text = trim($_POST['button_text'] ?? '');
            $button_link = trim($_POST['button_link'] ?? '');
            $text_color = trim($_POST['text_color'] ?? '#ffffff');
            $text_align = trim($_POST['text_align'] ?? 'left');
            $overlay = (float)($_POST['overlay'] ?? 0);
            $sort_order = (int)($_POST['sort_order'] ?? 0);
            $is_active = isset($_POST['is_active']) ? 1 : 0;

            if (empty($image)) {
                $error = '请上传幻灯片图片。';
            } else {
                try {
                    if ($id > 0) {
                        $db->prepare("UPDATE slides SET title=?, subtitle=?, image=?, mobile_image=?, button_text=?, button_link=?, text_color=?, text_align=?, overlay=?, sort_order=?, is_active=? WHERE id=?")
                            ->execute([$title, $subtitle, $image, $mobile_image, $button_text, $button_link, $text_color, $text_align, $overlay, $sort_order, $is_active, $id]);
                        $success = '幻灯片已更新！';
                    } else {
                        $db->prepare("INSERT INTO slides (title, subtitle, image, mobile_image, button_text, button_link, text_color, text_align, overlay, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
                            ->execute([$title, $subtitle, $image, $mobile_image, $button_text, $button_link, $text_color, $text_align, $overlay, $sort_order, $is_active]);
                        $success = '幻灯片已创建！';
                    }
                } catch (PDOException $e) {
                    $error = '保存失败：' . $e->getMessage();
                }
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)($_POST['id'] ?? 0);
            if ($id > 0) {
                // 删除关联的图片文件
                $stmt = $db->prepare("SELECT image, mobile_image FROM slides WHERE id = ?");
                $stmt->execute([$id]);
                $slide = $stmt->fetch();
                if ($slide) {
                    if (!empty($slide['image'])) delete_upload($slide['image']);
                    if (!empty($slide['mobile_image'])) delete_upload($slide['mobile_image']);
                }
                $db->prepare("DELETE FROM slides WHERE id = ?")->execute([$id]);
                $success = '幻灯片已删除！';
            }
        } elseif ($_POST['action'] === 'toggle') {
            $id = (int)($_POST['id'] ?? 0);
            if ($id > 0) {
                $db->prepare("UPDATE slides SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?")->execute([$id]);
                $success = '状态已切换！';
            }
        }
    }
}

// 排序参数：按 sort_order 升序，同序按 id 降序
$slides = $db->query("SELECT * FROM slides ORDER BY sort_order ASC, id DESC")->fetchAll();

// 编辑模式
$edit_slide = null;
if (isset($_GET['edit'])) {
    $stmt = $db->prepare("SELECT * FROM slides WHERE id = ?");
    $stmt->execute([(int)$_GET['edit']]);
    $edit_slide = $stmt->fetch();
}

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>幻灯片管理</h1>
    <a href="slides.php" class="btn">← 返回列表</a>
</div>

<?php if ($error): ?><div class="alert error"><?= h($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="alert success"><?= h($success) ?></div><?php endif; ?>

<div style="display:grid;grid-template-columns:<?= $edit_slide ? '1fr 470px' : '1fr' ?>;gap:20px;">

    <!-- 幻灯片列表 -->
    <div class="card">
        <h3 style="margin:0 0 16px;">现有幻灯片</h3>
        <?php if (empty($slides)): ?>
            <p style="color:var(--muted);padding:40px 0;text-align:center;">暂无幻灯片，点击右上角添加。</p>
        <?php else: ?>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:80px;">预览</th>
                            <th>标题</th>
                            <th style="width:70px;">排序</th>
                            <th style="width:80px;">状态</th>
                            <th style="width:160px;">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($slides as $s): ?>
                            <tr>
                                <td>
                                    <?php if ($s['image']): ?>
                                        <img src="<?= image_url($s['image']) ?>" alt="" class="thumb" style="width:100px;height:60px;object-fit:cover;">
                                    <?php else: ?>
                                        <div class="thumb" style="width:100px;height:60px;background:var(--soft);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:20px;">🖼️</div>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <strong><?= h($s['title'] ?: '(无标题)') ?></strong>
                                    <?php if ($s['subtitle']): ?>
                                        <br><small style="color:var(--muted);"><?= h(truncate($s['subtitle'], 60)) ?></small>
                                    <?php endif; ?>
                                </td>
                                <td><?= (int)$s['sort_order'] ?></td>
                                <td><span class="status <?= $s['is_active'] ? '' : 'off' ?>"><?= $s['is_active'] ? '启用' : '禁用' ?></span></td>
                                <td class="actions">
                                    <a href="slides.php?edit=<?= $s['id'] ?>" class="btn small">编辑</a>
                                    <form method="post" style="display:inline;">
                                        <?= csrf_field() ?>
                                        <input type="hidden" name="action" value="toggle">
                                        <input type="hidden" name="id" value="<?= $s['id'] ?>">
                                        <button type="submit" class="btn small"><?= $s['is_active'] ? '禁用' : '启用' ?></button>
                                    </form>
                                    <form method="post" style="display:inline;" onsubmit="return confirm('确定要删除此幻灯片吗？')">
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
        <h3 style="margin:0 0 16px;"><?= $edit_slide ? '编辑幻灯片' : '添加幻灯片' ?></h3>
        <form method="post" id="slideForm">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="id" value="<?= $edit_slide['id'] ?? 0 ?>">

            <div class="field">
                <label>标题</label>
                <input class="input" name="title" value="<?= h($edit_slide['title'] ?? '') ?>" placeholder="例如：新年促销活动">
            </div>

            <div class="field">
                <label>副标题</label>
                <input class="input" name="subtitle" value="<?= h($edit_slide['subtitle'] ?? '') ?>" placeholder="一行简短的描述">
            </div>

            <!-- 主图上传 -->
            <div class="field">
                <label>图片 <span style="color:var(--danger);">*</span></label>
                <div style="display:flex;gap:8px;">
                    <input class="input" name="image" id="slideImage" value="<?= h($edit_slide['image'] ?? '') ?>" placeholder="点击上传或输入图片 URL" readonly style="cursor:pointer;background:var(--soft);" onclick="document.getElementById('imageUploadInput').click();">
                    <button type="button" class="btn" onclick="document.getElementById('imageUploadInput').click();">上传</button>
                </div>
                <input type="file" id="imageUploadInput" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;">
                <?php if (!empty($edit_slide['image'])): ?>
                    <img src="<?= image_url($edit_slide['image']) ?>" alt="" class="image-preview" id="slideImagePreview">
                <?php else: ?>
                    <div class="image-preview" id="slideImagePreview" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;">暂无图片</div>
                <?php endif; ?>
                <small>建议尺寸：1920 x 600 px，支持 JPG/PNG/GIF/WebP</small>
            </div>

            <!-- 移动端图片 -->
            <div class="field">
                <label>移动端图片 <small style="font-weight:400;">(可选)</small></label>
                <div style="display:flex;gap:8px;">
                    <input class="input" name="mobile_image" id="mobileImage" value="<?= h($edit_slide['mobile_image'] ?? '') ?>" placeholder="点击上传" readonly style="cursor:pointer;background:var(--soft);" onclick="document.getElementById('mobileUploadInput').click();">
                    <button type="button" class="btn" onclick="document.getElementById('mobileUploadInput').click();">上传</button>
                </div>
                <input type="file" id="mobileUploadInput" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;">
                <?php if (!empty($edit_slide['mobile_image'])): ?>
                    <img src="<?= image_url($edit_slide['mobile_image']) ?>" alt="" class="image-preview" id="mobileImagePreview">
                <?php else: ?>
                    <div class="image-preview" id="mobileImagePreview" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;">暂无图片</div>
                <?php endif; ?>
                <small>建议尺寸：750 x 600 px，移动端替代图片</small>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="field">
                    <label>按钮文字</label>
                    <input class="input" name="button_text" value="<?= h($edit_slide['button_text'] ?? '') ?>" placeholder="例如：了解详情">
                </div>
                <div class="field">
                    <label>按钮链接</label>
                    <input class="input" name="button_link" value="<?= h($edit_slide['button_link'] ?? '') ?>" placeholder="例如：/products.php">
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
                <div class="field">
                    <label>文字颜色</label>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <input type="color" name="text_color" value="<?= h($edit_slide['text_color'] ?? '#ffffff') ?>" style="width:40px;height:40px;border:1px solid var(--line);border-radius:6px;padding:2px;cursor:pointer;">
                        <input class="input" name="text_color_text" value="<?= h($edit_slide['text_color'] ?? '#ffffff') ?>" style="flex:1;" maxlength="20" onchange="document.querySelector('input[name=text_color]').value=this.value" oninput="document.querySelector('input[name=text_color]').value=this.value">
                    </div>
                </div>
                <div class="field">
                    <label>文字对齐</label>
                    <select name="text_align" class="input">
                        <option value="left" <?= ($edit_slide['text_align'] ?? '') === 'left' ? 'selected' : '' ?>>左对齐</option>
                        <option value="center" <?= ($edit_slide['text_align'] ?? '') === 'center' ? 'selected' : '' ?>>居中</option>
                        <option value="right" <?= ($edit_slide['text_align'] ?? '') === 'right' ? 'selected' : '' ?>>右对齐</option>
                    </select>
                </div>
                <div class="field">
                    <label>遮罩透明度</label>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <input type="range" name="overlay" min="0" max="1" step="0.1" value="<?= (float)($edit_slide['overlay'] ?? 0) ?>" oninput="this.nextElementSibling.textContent = this.value" style="flex:1;">
                        <span style="font-size:13px;color:var(--muted);min-width:28px;"><?= (float)($edit_slide['overlay'] ?? 0) ?></span>
                    </div>
                    <small>0 = 无遮罩，1 = 全黑遮罩</small>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px;">
                <div class="field">
                    <label>排序</label>
                    <input class="input" type="number" name="sort_order" value="<?= (int)($edit_slide['sort_order'] ?? 0) ?>" min="0" step="1">
                    <small>数字越小越靠前</small>
                </div>
                <div class="field" style="justify-content:flex-end;padding-bottom:8px;">
                    <label style="margin-bottom:4px;">启用状态</label>
                    <label class="check">
                        <input type="checkbox" name="is_active" value="1" <?= (!isset($edit_slide['is_active']) || $edit_slide['is_active']) ? 'checked' : '' ?>>
                        <span>在前台显示此幻灯片</span>
                    </label>
                </div>
            </div>

            <button type="submit" class="btn primary" style="margin-top:12px;width:100%;">
                💾 <?= $edit_slide ? '更新幻灯片' : '添加幻灯片' ?>
            </button>
        </form>
    </div>
</div>

<script>
// 图片上传函数
function setupUpload(triggerId, inputId, targetInputId, previewId) {
    document.getElementById(triggerId)?.addEventListener('click', function() {
        document.getElementById(inputId).click();
    });

    document.getElementById(inputId)?.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        // 显示上传中
        const btn = this.previousElementSibling?.querySelector('.btn') || this.parentElement.querySelector('.btn');
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
                // 更新预览
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

setupUpload('imageUploadInput', 'imageUploadInput', 'slideImage', 'slideImagePreview');
setupUpload('mobileUploadInput', 'mobileUploadInput', 'mobileImage', 'mobileImagePreview');

// 颜色输入同步
document.querySelector('input[name=text_color]')?.addEventListener('input', function() {
    document.querySelector('input[name=text_color_text]').value = this.value;
});
</script>

<?php require __DIR__ . '/footer.php'; ?>
