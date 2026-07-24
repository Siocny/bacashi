<?php
/**
 * CAFELE CMS - 系统设置
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();
$error = '';
$success = '';

// 保存设置
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verify_csrf($_POST['csrf'] ?? '')) {
        $error = '表单已过期。';
    } else {
        if ($_POST['action'] === 'settings') {
            $fields = ['site_name', 'site_description', 'contact_phone', 'contact_email', 'contact_address'];
            foreach ($fields as $field) {
                $val = trim($_POST[$field] ?? '');
                $db->prepare("INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?")
                    ->execute([$field, $val, $val]);
            }
            $success = '设置已保存！';
        } elseif ($_POST['action'] === 'password') {
            $old = $_POST['old_password'] ?? '';
            $new = $_POST['new_password'] ?? '';
            $confirm = $_POST['confirm_password'] ?? '';

            $stmt = $db->query("SELECT password_hash FROM users WHERE id = " . (int)$_SESSION['admin_id']);
            $user = $stmt->fetch();

            if (!password_verify($old, $user['password_hash'])) {
                $error = '当前密码错误。';
            } elseif (strlen($new) < 6) {
                $error = '新密码至少需要 6 位。';
            } elseif ($new !== $confirm) {
                $error = '两次输入的密码不一致。';
            } else {
                $hash = password_hash($new, PASSWORD_DEFAULT);
                $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, (int)$_SESSION['admin_id']]);
                $success = '密码已修改！';
            }
        }
    }
}

$settings = get_settings();
require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>系统设置</h1>
</div>

<?php if ($error): ?><div class="alert error"><?= h($error) ?></div><?php endif; ?>
<?php if ($success): ?><div class="alert success"><?= h($success) ?></div><?php endif; ?>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <!-- 站点设置 -->
    <div class="card">
        <h3 style="margin:0 0 16px;">站点信息</h3>
        <form method="post">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="settings">

            <div class="field">
                <label>网站名称</label>
                <input class="input" name="site_name" value="<?= h($settings['site_name'] ?? 'CAFELE') ?>">
            </div>
            <div class="field">
                <label>网站描述</label>
                <input class="input" name="site_description" value="<?= h($settings['site_description'] ?? '') ?>">
            </div>
            <div class="field">
                <label>联系电话</label>
                <input class="input" name="contact_phone" value="<?= h($settings['contact_phone'] ?? '') ?>">
            </div>
            <div class="field">
                <label>联系邮箱</label>
                <input class="input" name="contact_email" value="<?= h($settings['contact_email'] ?? '') ?>">
            </div>
            <div class="field">
                <label>公司地址</label>
                <input class="input" name="contact_address" value="<?= h($settings['contact_address'] ?? '') ?>">
            </div>

            <button type="submit" class="btn primary" style="margin-top:12px;">💾 保存设置</button>
        </form>
    </div>

    <!-- 修改密码 -->
    <div class="card">
        <h3 style="margin:0 0 16px;">修改密码</h3>
        <form method="post">
            <?= csrf_field() ?>
            <input type="hidden" name="action" value="password">

            <div class="field">
                <label>当前密码</label>
                <input class="input" type="password" name="old_password" required>
            </div>
            <div class="field">
                <label>新密码</label>
                <input class="input" type="password" name="new_password" required minlength="6">
                <small>至少 6 位</small>
            </div>
            <div class="field">
                <label>确认新密码</label>
                <input class="input" type="password" name="confirm_password" required>
            </div>

            <button type="submit" class="btn primary" style="margin-top:12px;">🔑 修改密码</button>
        </form>
    </div>
</div>

<?php require __DIR__ . '/footer.php'; ?>
