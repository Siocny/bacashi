<?php
/**
 * CAFELE CMS - 媒体管理
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$error = '';
$success = '';

// 上传处理
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    if (verify_csrf($_POST['csrf'] ?? '')) {
        $result = handle_upload($_FILES['file']);
        if ($result) {
            $success = '上传成功！';
        } else {
            $error = '上传失败，请检查文件类型。';
        }
    } else {
        $error = '表单已过期。';
    }
}

// 删除文件
if (isset($_GET['delete'])) {
    $path = base64_decode($_GET['delete']);
    if (str_starts_with($path, 'public/uploads/')) {
        delete_upload($path);
        redirect('media.php');
    }
}

// 读取上传目录中的文件
$upload_dir = UPLOADS_PATH;
$files = [];
if (is_dir($upload_dir)) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($upload_dir));
    foreach ($iterator as $file) {
        if ($file->isFile() && in_array($file->getExtension(), ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $rel_path = 'public/uploads/' . $iterator->getSubPathName();
            $files[] = [
                'path' => $rel_path,
                'name' => $file->getFilename(),
                'size' => $file->getSize(),
                'time' => $file->getMTime(),
                'ext'  => $file->getExtension(),
            ];
        }
    }
    // 按时间倒序
    usort($files, fn($a, $b) => $b['time'] - $a['time']);
}

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>媒体管理</h1>
</div>

<?php if ($error): ?><div class="alert error"><?= h($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="alert success"><?= h($success) ?></div><?php endif; ?>

<div class="card">
    <h3 style="margin:0 0 16px;">上传新图片</h3>
    <form method="post" enctype="multipart/form-data" style="display:flex;gap:12px;align-items:end;">
        <?= csrf_field() ?>
        <div class="field" style="flex:1;">
            <input type="file" name="file" accept="image/*" required class="input">
        </div>
        <button type="submit" class="btn primary">📤 上传</button>
    </form>
</div>

<div class="card">
    <h3 style="margin:0 0 16px;">文件列表（<?= count($files) ?> 个）</h3>
    <?php if (empty($files)): ?>
        <p style="text-align:center;padding:40px;color:var(--muted);">暂无文件</p>
    <?php else: ?>
        <div class="media-grid">
            <?php foreach ($files as $file): ?>
                <div class="media-card" style="position:relative;">
                    <img src="<?= image_url($file['path']) ?>" alt="">
                    <div>
                        <small><?= h($file['name']) ?></small>
                        <br><small style="color:var(--muted);"><?= round($file['size'] / 1024) ?> KB</small>
                        <div style="margin-top:6px;display:flex;gap:4px;">
                            <button type="button" class="btn small" onclick="copyUrl('<?= image_url($file['path']) ?>')">📋</button>
                            <a href="media.php?delete=<?= base64_encode($file['path']) ?>" class="btn small danger" onclick="return confirm('确定要删除吗？')">🗑️</a>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<script>
function copyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('URL 已复制到剪贴板', 'success');
    });
}
</script>

<?php require __DIR__ . '/footer.php'; ?>
