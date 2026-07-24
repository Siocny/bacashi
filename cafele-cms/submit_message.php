<?php
/**
 * CAFELE CMS - 表单提交处理（留言/咨询）
 */

require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/functions.php';

$db = getDB();
$return_url = $_POST['return'] ?? 'index.php';
$error = '';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    redirect($return_url);
}

$csrf = $_POST['csrf'] ?? '';
$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$email = trim($_POST['email'] ?? '');
$content = trim($_POST['content'] ?? '');
$product_id = !empty($_POST['product_id']) ? (int)$_POST['product_id'] : null;

if (!verify_csrf($csrf)) {
    $error = '表单已过期，请刷新页面后重新提交。';
} elseif (empty($name)) {
    $error = '请填写姓名。';
} elseif (empty($content)) {
    $error = '请填写留言内容。';
} else {
    try {
        $stmt = $db->prepare("INSERT INTO messages (name, phone, email, content, product_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $phone, $email, $content, $product_id]);

        // 重定向回原页面并显示成功信息
        $separator = str_contains($return_url, '?') ? '&' : '?';
        redirect($return_url . $separator . 'msg=success');
    } catch (PDOException $e) {
        $error = '提交失败，请稍后重试。';
    }
}

// 如果有错误，重定向并显示错误信息
$separator = str_contains($return_url, '?') ? '&' : '?';
redirect($return_url . $separator . 'msg=error&detail=' . urlencode($error));
