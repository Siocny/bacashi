<?php
/**
 * CAFELE CMS - 认证检查
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

/**
 * 检查管理员是否已登录
 */
function isAdminLoggedIn(): bool {
    return isset($_SESSION['admin_id']) && $_SESSION['admin_id'] > 0;
}

/**
 * 要求登录，未登录则重定向到登录页
 */
function requireLogin(): void {
    if (!isAdminLoggedIn()) {
        header('Location: ' . ADMIN_URL . '/login.php');
        exit;
    }
}

/**
 * 管理员登录验证
 */
function adminLogin(string $username, string $password): bool {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['admin_id'] = (int)$user['id'];
        $_SESSION['admin_username'] = $user['username'];
        // 重新生成 session ID 防止会话固定攻击
        session_regenerate_id(true);
        return true;
    }
    return false;
}

/**
 * 管理员退出
 */
function adminLogout(): void {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        setcookie(session_name(), '', time() - 42000, '/');
    }
    session_destroy();
}
