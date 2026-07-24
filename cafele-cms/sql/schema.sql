-- CAFELE CMS 数据库结构
-- MySQL/MariaDB

CREATE DATABASE IF NOT EXISTS cafele_cms DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cafele_cms;

-- 管理员用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 产品分类表
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 产品表
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    subtitle VARCHAR(500) DEFAULT '',
    category_id INT DEFAULT NULL,
    specs JSON DEFAULT NULL,
    content TEXT DEFAULT NULL,
    image VARCHAR(500) DEFAULT '',
    status TINYINT DEFAULT 1,
    featured TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 产品图片表（画廊）
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200) DEFAULT '',
    sort_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CMS 页面表
CREATE TABLE IF NOT EXISTS pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    content TEXT DEFAULT NULL,
    meta_description VARCHAR(500) DEFAULT '',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 联系/咨询留言表
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(200) DEFAULT '',
    content TEXT NOT NULL,
    product_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 站点设置表
CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 创建默认管理员 (密码: admin123)
INSERT INTO users (username, password_hash) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 创建默认分类
INSERT INTO categories (name, slug, sort_order) VALUES
('多功能一体机', 'all-in-one', 1),
('搭电宝', 'jump-starter', 2),
('充气泵', 'inflator', 3),
('车载充电器', 'car-charger', 4),
('车载吸尘器', 'vacuum', 5),
('储能电源', 'power-station', 6);

-- 创建默认 CMS 页面
INSERT INTO pages (slug, title, content, meta_description) VALUES
('about', '关于我们', '<h2>关于 CAFELE</h2><p>CAFELE 专注智能车载、充电与数字配件产品。</p><h3>我们的能力</h3><ul><li>产品研发与工业设计</li><li>供应链与品质控制</li><li>定制化合作与全球交付</li></ul>', '了解 CAFELE 的品牌、研发与制造能力'),
('contact', '联系我们', '<h2>联系我们</h2><p>欢迎通过电话、邮件或留言表单与我们联系。</p>', '商务合作、产品咨询与售后服务'),
('instructions', '操作说明', '<h2>操作说明</h2><p>产品使用指南和操作说明。</p>', '产品使用指南和操作说明'),
('channels', '购买渠道', '<h2>购买渠道</h2><p>了解我们的线上和线下购买渠道。</p>', '了解购买渠道'),
('after-purchase', '购后扫码', '<h2>购后扫码</h2><p>购后扫码获取更多服务。</p>', '购后扫码获取更多服务'),
('after-sales', '售后政策', '<h2>售后政策</h2><p>我们的售后服务和质保政策。</p>', '售后服务和质保政策'),
('suggestion', '提个建议', '<h2>提个建议</h2><p>欢迎向我们提出宝贵的意见和建议。</p>', '向我们提出建议');

-- 创建默认设置
INSERT INTO settings (`key`, `value`) VALUES
('site_name', 'CAFELE'),
('site_description', '智能车载与数码产品制造商'),
('contact_phone', '400-888-2026'),
('contact_email', 'service@example.com'),
('contact_address', '中国 · 深圳'),
('hero_images', '[{"desktop":"public/uploads/seed/hero-main.svg","mobile":"public/uploads/seed/hero-main.svg"},{"desktop":"public/uploads/seed/hero-brand.svg","mobile":"public/uploads/seed/hero-brand.svg"}]');

-- 创建示例产品
INSERT INTO products (name, slug, subtitle, category_id, specs, content, image, status, featured, sort_order) VALUES
('PL12 智能搭电充气一体机', 'pl12', '强劲启动与精准充气，一机解决车载应急。', 1, '[{"key":"峰值电流","value":"2000A"},{"key":"充气压力","value":"150 PSI"},{"key":"电池容量","value":"12000mAh"},{"key":"接口","value":"USB-C"}]', '<h2>PL12 产品亮点</h2><p>集成汽车应急启动、轮胎充气、照明与移动电源功能。清晰数显界面，操作直观，适合日常车载与长途出行。</p><h3>安全设计</h3><p>内置多重电路保护，帮助降低反接、过流与过温风险。</p>', 'public/uploads/seed/hero-main.svg', 1, 1, 1),
('N2 便携搭电宝', 'n2', '紧凑机身，快速应急启动。', 2, '[{"key":"峰值电流","value":"1000A"},{"key":"电池容量","value":"8000mAh"}]', '<p>适合家用轿车、SUV及日常应急。</p>', 'public/uploads/seed/hero-main.svg', 1, 1, 2),
('QS003 多功能一体机', 'qs003', '应急启动、充气与供电多功能融合。', 1, '[{"key":"峰值电流","value":"1500A"},{"key":"充气压力","value":"120 PSI"}]', '<p>一体化附件收纳，出行更从容。</p>', 'public/uploads/seed/hero-main.svg', 1, 1, 3),
('BN03 智能充气泵', 'bn03', '快速充气，数字胎压显示。', 3, '[{"key":"充气压力","value":"150 PSI"},{"key":"电源","value":"点烟器"},{"key":"显示","value":"LED数显"}]', '<p>适用于轿车、SUV、摩托车轮胎充气。</p>', 'public/uploads/seed/hero-main.svg', 1, 0, 4),
('YL03 便携充气泵', 'yl03', '金属质感机身与清晰数显。', 3, '[{"key":"充气压力","value":"120 PSI"},{"key":"电源","value":"USB"},{"key":"重量","value":"350g"}]', '<p>轻巧便携，随时随地充气。</p>', 'public/uploads/seed/hero-main.svg', 1, 0, 5),
('YS01 无线充气泵', 'ys01', '无线便携，适配多种充气场景。', 3, '[{"key":"充气压力","value":"100 PSI"},{"key":"电池","value":"5000mAh"}]', '<p>无线设计，轻松应对各种充气需求。</p>', 'public/uploads/seed/hero-main.svg', 1, 0, 6),
('N10 新一代启动电源', 'n10', '高效能量管理，适合多场景应急。', 2, '[{"key":"峰值电流","value":"2000A"},{"key":"电池容量","value":"15000mAh"}]', '<p>双机组合设计，外观简洁。</p>', 'public/uploads/seed/hero-main.svg', 1, 1, 7),
('N33 便携充气搭电一体机', 'n33', '轻巧机身，兼具搭电与充气。', 1, '[{"key":"峰值电流","value":"800A"},{"key":"充气压力","value":"120 PSI"}]', '<p>多配色选择，适合个人车主。</p>', 'public/uploads/seed/hero-main.svg', 1, 1, 8);
