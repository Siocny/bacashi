<?php
/**
 * CAFELE CMS - 安装脚本
 *
 * 访问此页面完成数据库初始化和默认数据创建
 * 安装完成后请删除或重命名此文件以确保安全
 */

// 检测是否已安装
$config_file = __DIR__ . '/includes/config.php';
$lock_file = __DIR__ . '/includes/installed.lock';

if (file_exists($lock_file)) {
    die('CAFELE CMS 已经安装完成。如需重新安装，请删除 includes/installed.lock 文件。');
}

$step = $_GET['step'] ?? 'start';
$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($step === 'db_config') {
        // 保存数据库配置
        $db_host = $_POST['db_host'] ?? 'localhost';
        $db_name = $_POST['db_name'] ?? 'cafele_cms';
        $db_user = $_POST['db_user'] ?? 'root';
        $db_pass = $_POST['db_pass'] ?? '';

        // 测试连接
        try {
            $dsn = "mysql:host=$db_host;charset=utf8mb4";
            $pdo = new PDO($dsn, $db_user, $db_pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);

            // 创建数据库
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `$db_name`");

            // 导入 schema
            $schema = file_get_contents(__DIR__ . '/sql/schema.sql');
            // 移除 USE 和 CREATE DATABASE 语句 (已经在上面执行了)
            $schema = preg_replace('/CREATE DATABASE.*?;/i', '', $schema);
            $schema = preg_replace('/USE .*?;/i', '', $schema);

            // 按分号分割执行
            $statements = array_filter(
                array_map('trim', explode(';', $schema)),
                fn($s) => !empty($s) && !str_starts_with($s, '--')
            );

            foreach ($statements as $statement) {
                if (!empty(trim($statement))) {
                    $pdo->exec($statement . ';');
                }
            }

            // 写入配置
            $config_content = <<<PHP
<?php
/**
 * CAFELE CMS - 数据库配置
 */

define('DB_HOST', '$db_host');
define('DB_NAME', '$db_name');
define('DB_USER', '$db_user');
define('DB_PASS', '$db_pass');
define('DB_CHARSET', 'utf8mb4');

// 站点 URL
define('SITE_URL', (isset(\$_SERVER['HTTPS']) && \$_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . \$_SERVER['HTTP_HOST'] . rtrim(dirname(\$_SERVER['SCRIPT_NAME']), '/\\\\'));
define('ADMIN_URL', SITE_URL . '/admin');
define('UPLOADS_PATH', __DIR__ . '/../public/uploads');
define('UPLOADS_URL', SITE_URL . '/public/uploads');

// Session
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);

session_start();

error_reporting(E_ALL);
ini_set('display_errors', 0);
PHP;

            file_put_contents(__DIR__ . '/includes/config.local.php', $config_content);

            // 创建安装锁
            file_put_contents($lock_file, date('Y-m-d H:i:s'));

            $success = '✅ 安装成功！';
            $step = 'done';
        } catch (PDOException $e) {
            $error = '数据库连接失败: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>CAFELE CMS - 安装</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; background: #f0f2f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .install-box { background: #fff; border-radius: 16px; padding: 40px; max-width: 520px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,.08); }
        h1 { font-size: 24px; margin-bottom: 8px; color: #1a3a5c; }
        p { color: #666; margin-bottom: 24px; font-size: 14px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #333; }
        input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: 0; }
        input:focus { border-color: #31477e; box-shadow: 0 0 0 3px rgba(49,71,126,.1); }
        .btn { display: block; width: 100%; padding: 12px; background: #31477e; color: #fff; border: 0; border-radius: 8px; font-size: 15px; cursor: pointer; margin-top: 8px; }
        .btn:hover { background: #1a3a5c; }
        .error { background: #fff0f0; color: #c63c3c; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; }
        .success { background: #eaf7ef; color: #187443; padding: 16px; border-radius: 8px; margin-bottom: 16px; font-size: 15px; text-align: center; }
        .success a { display: inline-block; margin-top: 12px; padding: 10px 20px; background: #31477e; color: #fff; text-decoration: none; border-radius: 8px; }
        .hint { font-size: 12px; color: #999; margin-top: 4px; }
    </style>
</head>
<body>
    <div class="install-box">
        <h1>CAFELE CMS 安装</h1>
        <p>请配置数据库连接信息完成安装</p>

        <?php if ($error): ?>
            <div class="error"><?= h($error) ?></div>
        <?php endif; ?>

        <?php if ($step === 'done'): ?>
            <div class="success">
                <p><?= h($success) ?></p>
                <p style="font-size:13px;color:#666;margin-top:8px;">
                    ⚠️ 请删除或重命名 <code>install.php</code> 文件以确保安全
                </p>
                <a href="admin/login.php">进入后台 →</a>
                <a href="index.php" style="background:#666;margin-left:10px;">查看前台 →</a>
            </div>
        <?php else: ?>
            <form method="post">
                <div class="form-group">
                    <label>数据库主机</label>
                    <input type="text" name="db_host" value="localhost" required>
                    <div class="hint">通常是 localhost</div>
                </div>
                <div class="form-group">
                    <label>数据库名</label>
                    <input type="text" name="db_name" value="cafele_cms" required>
                    <div class="hint">将自动创建</div>
                </div>
                <div class="form-group">
                    <label>数据库用户名</label>
                    <input type="text" name="db_user" value="root" required>
                </div>
                <div class="form-group">
                    <label>数据库密码</label>
                    <input type="password" name="db_pass" value="">
                </div>
                <button type="submit" class="btn">开始安装</button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>
