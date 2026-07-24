<?php
/**
 * CAFELE CMS - 修改密码
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf($_POST['csrf'] ?? '')) {
        $error = '表单已过期，请刷新页面重试。';
    } else {
        $old = $_POST['old_password'] ?? '';
        $new = $_POST['new_password'] ?? '';
        $confirm = $_POST['confirm_password'] ?? '';

        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([(int)$_SESSION['admin_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            $error = '用户不存在。';
        } elseif (!password_verify($old, $user['password_hash'])) {
            $error = '当前密码错误。';
        } elseif (strlen($new) < 6) {
            $error = '新密码至少需要 6 位。';
        } elseif ($new !== $confirm) {
            $error = '两次输入的密码不一致。';
        } else {
            $hash = password_hash($new, PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$hash, (int)$_SESSION['admin_id']]);
            $success = '密码已修改！';
        }
    }
}

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>修改密码</h1>
    <a href="index.php" class="btn secondary">⬅ 返回控制台</a>
</div>

<?php if ($error): ?>
    <div class="alert error"><?= h($error) ?></div>
<?php endif; ?>
<?php if ($success): ?>
    <div class="alert success"><?= h($success) ?></div>
<?php endif; ?>

<div class="card" style="max-width:500px;">
    <h3 style="margin:0 0 16px;">修改登录密码</h3>
    <form method="post">
        <?= csrf_field() ?>

        <div class="field">
            <label>当前密码</label>
            <input class="input" type="password" name="old_password" required autocomplete="current-password" placeholder="请输入当前密码">
        </div>

        <div class="field">
            <label>新密码</label>
            <input class="input" type="password" name="new_password" required minlength="6" autocomplete="new-password" placeholder="至少 6 位">
            <small>至少 6 位字符</small>
        </div>

        <div class="field">
            <label>确认新密码</label>
            <input class="input" type="password" name="confirm_password" required autocomplete="new-password" placeholder="请再次输入新密码">
        </div>

        <button type="submit" class="btn primary" style="margin-top:12px;">🔑 修改密码</button>
    </form>
</div>

<?php require __DIR__ . '/footer.php'; ?>
