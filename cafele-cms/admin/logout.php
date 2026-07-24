<?php
/**
 * CAFELE CMS - 退出登录
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

adminLogout();
redirect('login.php');
