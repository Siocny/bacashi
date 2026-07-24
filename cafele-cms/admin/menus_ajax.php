<?php
/**
 * CAFELE CMS - 菜单管理 AJAX 接口
 *
 * 根据菜单位置返回顶级菜单项列表，供添加菜单时选择上级菜单。
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$location = trim($_GET['location'] ?? '');
if (!$location) {
    json_response([]);
}

$db = getDB();
$stmt = $db->prepare("SELECT id, label FROM menus WHERE location = ? AND parent_id = 0 ORDER BY sort_order ASC, id ASC");
$stmt->execute([$location]);
$items = $stmt->fetchAll();

json_response($items);
