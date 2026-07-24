<?php
/**
 * CAFELE CMS - 公共函数
 */

/**
 * 生成 CSRF Token
 */
function csrf_token(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * 验证 CSRF Token
 */
function verify_csrf(string $token): bool {
    if (empty($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * 输出 CSRF 隐藏字段
 */
function csrf_field(): string {
    return '<input type="hidden" name="csrf" value="' . csrf_token() . '">';
}

/**
 * 重定向
 */
function redirect(string $url): never {
    header('Location: ' . $url);
    exit;
}

/**
 * 安全 HTML 输出
 */
function h(mixed $value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * 截取字符串
 */
function truncate(string $text, int $length = 100, string $append = '...'): string {
    if (mb_strlen($text) <= $length) return $text;
    return mb_substr($text, 0, $length) . $append;
}

/**
 * 格式化时间
 */
function time_ago(string $datetime): string {
    $timestamp = strtotime($datetime);
    $diff = time() - $timestamp;
    if ($diff < 60) return '刚刚';
    if ($diff < 3600) return floor($diff / 60) . '分钟前';
    if ($diff < 86400) return floor($diff / 3600) . '小时前';
    if ($diff < 604800) return floor($diff / 86400) . '天前';
    return date('Y-m-d H:i', $timestamp);
}

/**
 * 获取站点设置
 */
function get_settings(): array {
    $db = getDB();
    $stmt = $db->query("SELECT `key`, `value` FROM settings");
    $settings = [];
    while ($row = $stmt->fetch()) {
        $settings[$row['key']] = $row['value'];
    }
    return $settings;
}

/**
 * 获取所有类别
 */
function get_categories(): array {
    $db = getDB();
    return $db->query("SELECT * FROM categories ORDER BY sort_order ASC, id ASC")->fetchAll();
}

/**
 * 生成产品 SEO URL
 */
function product_url(string $slug): string {
    return SITE_URL . '/product.php?slug=' . urlencode($slug);
}

/**
 * 生成分类 URL
 */
function category_url(string $slug): string {
    return SITE_URL . '/products.php?cat=' . urlencode($slug);
}

/**
 * 图片路径处理
 */
function image_url(?string $path): string {
    if (!$path) return '';
    if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
        return $path;
    }
    return SITE_URL . '/' . ltrim($path, '/');
}

/**
 * 返回 JSON
 */
function json_response(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * 文件上传处理
 */
function handle_upload(array $file, string $subdir = 'images'): string|false {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }

    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowed)) {
        return false;
    }

    $ext = match ($file['type']) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
        default => 'jpg',
    };

    $upload_dir = UPLOADS_PATH . '/' . $subdir;
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $filename = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dest = $upload_dir . '/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $dest)) {
        return 'public/uploads/' . $subdir . '/' . $filename;
    }

    return false;
}

/**
 * 删除上传文件
 */
function delete_upload(string $path): bool {
    $full_path = __DIR__ . '/../' . ltrim($path, '/');
    if (file_exists($full_path)) {
        return unlink($full_path);
    }
    return false;
}
