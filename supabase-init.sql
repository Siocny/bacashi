-- Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本

-- 创建 brand_data 表（卡斐乐品牌数据）
CREATE TABLE IF NOT EXISTS brand_data (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    data JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建 bacashi_data 表（倍卡西品牌数据）
CREATE TABLE IF NOT EXISTS bacashi_data (
    id BIGSERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    data JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_data_key ON brand_data(key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bacashi_data_key ON bacashi_data(key);

-- 插入默认数据（卡斐乐）
INSERT INTO brand_data (key, data) VALUES
('main', '{
    "brand": {
        "description": "卡斐乐是一家专注于高品质产品研发与制造的企业。自成立以来，始终秉承"匠心品质、创新无限"的理念，致力于为客户提供最优秀的产品和服务。经过多年的发展，我们已经成为行业内的知名品牌，产品远销海内外，赢得了广大客户的信赖和好评。",
        "stats": {
            "years": 15,
            "products": 10000,
            "customers": 100000000
        }
    },
    "contact": {
        "address": "浙江省义乌市北苑街道秋实路 121 号 2 号楼 8 楼",
        "phone": "400-888-8888",
        "email": "info@cafele.com"
    },
    "timeline": [
        {"id": 1, "year": "2011", "title": "公司成立", "description": "深圳市卡斐乐科技有限公司成立"},
        {"id": 2, "year": "2015", "title": "品牌发展", "title": "完成品牌战略升级"},
        {"id": 3, "year": "2020", "title": "市场拓展", "description": "产品销往全国"},
        {"id": 4, "year": "2025", "title": "持续扩大", "description": "公司人员扩展到 50+"}
    ],
    "products": [
        {"id": 1, "name": "卡斐乐主打产品", "category": "车用电子", "image": "", "price": "¥199", "sort": 1, "description": "我们的旗舰产品，集成了最新技术", "details": "高性能处理器、超长续航能力、精美外观设计、智能互联功能"},
        {"id": 2, "name": "时尚款产品 B", "category": "车用内饰", "image": "", "price": "¥159", "sort": 2, "description": "专为年轻时尚人士设计", "details": "轻薄便携、多彩配色、触控操作、快充技术"},
        {"id": 3, "name": "专业款产品 C", "category": "桌面风扇", "image": "", "price": "¥299", "sort": 3, "description": "满足专业用户的需求", "details": "专业级性能、精准控制、扩展接口丰富、耐用可靠"}
    ]
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 插入默认数据（倍卡西）
INSERT INTO bacashi_data (key, data) VALUES
('main', '{
    "brand": {
        "name": "倍卡西",
        "description": "倍卡西（BACASHI）是一家专注于高品质产品研发与制造的企业。自成立以来，始终秉承"匠心品质、创新无限"的理念，致力于为客户提供最优秀的产品和服务。",
        "stats": {
            "years": 2,
            "products": 80,
            "customers": 3000
        }
    },
    "contact": {
        "address": "浙江省义乌市北苑街道秋实路 121 号 2 号楼 8 楼",
        "phone": "400-666-6666",
        "email": "contact@bacashi.com"
    },
    "timeline": [
        {"id": 1, "year": "2024", "title": "品牌创立", "description": "倍卡西品牌正式成立"},
        {"id": 2, "year": "2025", "title": "品牌发展", "description": "完成产品线布局"},
        {"id": 3, "year": "2025", "title": "市场拓展", "description": "产品销往全国"}
    ],
    "products": [
        {"id": 1, "name": "倍卡西主打产品", "category": "车用电子", "image": "", "price": "¥159", "sort": 1, "description": "倍卡西旗舰产品", "details": "高性能处理器、超长续航能力、精美外观设计"},
        {"id": 2, "name": "倍卡西时尚款", "category": "车用内饰", "image": "", "price": "¥129", "sort": 2, "description": "专为年轻时尚人士设计", "details": "轻薄便携、多彩配色、触控操作"},
        {"id": 3, "name": "倍卡西专业款", "category": "桌面风扇", "image": "", "price": "¥259", "sort": 3, "description": "满足专业用户的需求", "details": "专业级性能、精准控制、扩展接口丰富"}
    ]
}'::jsonb)
ON CONFLICT (key) DO NOTHING;
