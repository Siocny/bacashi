-- CAFELE CMS - 补充表（轮播图、首页模块、导航菜单）
-- 适用于 MySQL/MariaDB

-- 轮播图表
CREATE TABLE IF NOT EXISTS slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) DEFAULT '',
    subtitle VARCHAR(500) DEFAULT '',
    image VARCHAR(500) NOT NULL,
    mobile_image VARCHAR(500) DEFAULT '',
    button_text VARCHAR(100) DEFAULT '',
    button_link VARCHAR(500) DEFAULT '',
    text_color VARCHAR(20) DEFAULT '#ffffff',
    text_align VARCHAR(20) DEFAULT 'left',
    overlay DECIMAL(2,1) DEFAULT 0,
    is_active TINYINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 首页模块表
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_type VARCHAR(50) NOT NULL DEFAULT 'banner',
    title VARCHAR(200) DEFAULT '',
    subtitle VARCHAR(500) DEFAULT '',
    image VARCHAR(500) DEFAULT '',
    link VARCHAR(500) DEFAULT '',
    button_text VARCHAR(100) DEFAULT '',
    content TEXT DEFAULT NULL,
    limit_count INT DEFAULT 6,
    mode VARCHAR(20) DEFAULT 'featured',
    is_active TINYINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 导航菜单表
CREATE TABLE IF NOT EXISTS menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(20) NOT NULL DEFAULT 'header',
    parent_id INT DEFAULT NULL,
    label VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    is_active TINYINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 产品增加 型号(model) 字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS model VARCHAR(100) DEFAULT '' AFTER slug;

-- 插入默认菜单
INSERT INTO menus (location, parent_id, label, url, sort_order, is_active) VALUES
('header', NULL, '首页', 'index.php', 10, 1),
('header', NULL, '品牌产品', 'products.php', 20, 1),
('header', NULL, '服务与支持', 'page.php?slug=instructions', 30, 1),
('header', 3, '操作说明', 'page.php?slug=instructions', 10, 1),
('header', 3, '购买渠道', 'page.php?slug=channels', 20, 1),
('header', 3, '购后扫码', 'page.php?slug=after-purchase', 30, 1),
('header', 3, '售后政策', 'page.php?slug=after-sales', 40, 1),
('header', 3, '提个建议', 'page.php?slug=suggestion', 50, 1),
('header', NULL, '关于我们', 'page.php?slug=about', 40, 1),
('footer', NULL, '联系我们', 'page.php?slug=contact', 10, 1),
('footer', NULL, '售后政策', 'page.php?slug=after-sales', 20, 1),
('footer', NULL, '后台管理', 'admin/login.php', 90, 1);
