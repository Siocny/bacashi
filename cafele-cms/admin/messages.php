<?php
/**
 * CAFELE CMS - 留言管理
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/functions.php';

requireLogin();

$db = getDB();

// 删除留言
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete'])) {
    if (verify_csrf($_POST['csrf'] ?? '')) {
        $db->prepare("DELETE FROM messages WHERE id = ?")->execute([(int)$_POST['delete']]);
        redirect('messages.php');
    }
}

// 分页
$page = max(1, (int)($_GET['p'] ?? 1));
$per_page = 20;
$total = $db->query("SELECT COUNT(*) FROM messages")->fetchColumn();
$total_pages = max(1, ceil($total / $per_page));
$offset = ($page - 1) * $per_page;

$messages = $db->prepare("SELECT * FROM messages ORDER BY created_at DESC LIMIT $per_page OFFSET $offset");
$messages->execute();
$messages = $messages->fetchAll();

require __DIR__ . '/header.php';
?>

<div class="page-actions">
    <h1>留言管理</h1>
    <div>
        <a href="messages.php?export=1" class="btn">📥 导出</a>
    </div>
</div>

<div class="card">
    <?php if (empty($messages)): ?>
        <p style="text-align:center;padding:40px;color:var(--muted);">暂无留言</p>
    <?php else: ?>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>电话</th>
                        <th>邮箱</th>
                        <th>留言内容</th>
                        <th>时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($messages as $msg): ?>
                        <tr>
                            <td><?= h($msg['name']) ?></td>
                            <td><?= h($msg['phone'] ?: '-') ?></td>
                            <td><?= h($msg['email'] ?: '-') ?></td>
                            <td style="max-width:300px;">
                                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="<?= h($msg['content']) ?>">
                                    <?= h(truncate($msg['content'], 80)) ?>
                                </div>
                            </td>
                            <td style="white-space:nowrap;"><?= time_ago($msg['created_at']) ?></td>
                            <td>
                                <form method="post" style="display:inline;" onsubmit="return confirm('确定要删除这条留言吗？')">
                                    <?= csrf_field() ?>
                                    <input type="hidden" name="delete" value="<?= $msg['id'] ?>">
                                    <button type="submit" class="btn small danger">删除</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

        <?php if ($total_pages > 1): ?>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;font-size:13px;color:var(--muted);">
                <span>共 <?= $total ?> 条</span>
                <div style="display:flex;gap:6px;">
                    <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                        <a href="?p=<?= $i ?>" style="padding:6px 12px;border:1px solid var(--line);border-radius:6px;<?= $i === $page ? 'background:var(--brand);color:#fff;' : '' ?>"><?= $i ?></a>
                    <?php endfor; ?>
                </div>
            </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<?php require __DIR__ . '/footer.php'; ?>
