<?php
/**
 * CAFELE CMS - 文件上传接口
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_FILES['file'])) {
    json_response(['error' => '没有上传文件'], 400);
}

$file = $_FILES['file'];
$result = handle_upload($file);

if ($result === false) {
    json_response(['error' => '上传失败，请检查文件类型和大小'], 400);
}

$url = SITE_URL . '/' . $result;
json_response(['url' => $url, 'path' => $result]);
