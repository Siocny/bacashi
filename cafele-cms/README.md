# CAFELE CMS 使用说明

## 系统要求

- PHP 8.0+
- MySQL/MariaDB 5.7+
- Apache 或 Nginx
- mod_rewrite (推荐)

## 快速安装

1. 将所有文件上传到 Web 服务器的网站目录

2. 在浏览器中访问 `http://你的域名/install.php`

3. 填写数据库连接信息：
   - 数据库主机：localhost（通常）
   - 数据库名：cafele_cms（将自动创建）
   - 用户名：root（你的 MySQL 用户名）
   - 密码：你的 MySQL 密码

4. 点击"开始安装"，系统将自动：
   - 创建数据库和数据表
   - 插入默认分类和产品数据
   - 创建默认管理员账号

5. 安装完成后，请删除 `install.php` 文件

## 默认登录信息

- **后台地址**: `http://你的域名/admin/login.php`
- **用户名**: admin
- **密码**: admin123

登录后请立即修改密码！

## 目录结构

```
├── index.php              # 首页
├── products.php           # 产品列表
├── product.php            # 产品详情
├── page.php               # CMS 页面
├── search.php             # 搜索
├── submit_message.php     # 表单提交
├── install.php            # 安装脚本（安装后删除）
│
├── admin/                 # 管理后台
│   ├── login.php          # 登录
│   ├── index.php          # 控制台
│   ├── products.php       # 产品管理
│   ├── product_edit.php   # 产品编辑
│   ├── pages.php          # 页面管理
│   ├── categories.php     # 分类管理
│   ├── messages.php       # 留言管理
│   ├── media.php          # 媒体管理
│   ├── settings.php       # 系统设置
│   └── upload.php         # 文件上传 API
│
├── includes/              # 公共组件
│   ├── config.php         # 配置
│   ├── db.php             # 数据库连接
│   ├── auth.php           # 认证
│   ├── functions.php      # 工具函数
│   ├── header.php         # 前端导航
│   └── footer.php         # 前端页脚
│
├── public/                # 公开资源
│   ├── assets/css/        # CSS 样式
│   ├── assets/js/         # JavaScript
│   └── uploads/           # 上传文件
│
└── sql/schema.sql         # 数据库结构
```

## 功能列表

### 前端
- 首页轮播 Banner
- 产品分类展示（网格布局）
- 产品列表（按分类筛选）
- 产品详情（画廊、规格、咨询表单）
- CMS 动态页面
- 产品搜索
- 联系/咨询表单

### 管理后台
- 仪表盘（数据统计）
- 产品 CRUD（富文本编辑器、批量操作）
- 分类管理（拖拽排序）
- CMS 页面编辑（富文本）
- 留言管理（查看、删除、导出）
- 媒体管理（上传、复制 URL、删除）
- 系统设置（站点信息、修改密码）
