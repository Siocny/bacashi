// API 和数据管理模块
// 使用 localStorage 模拟后端数据库

const API = {
    // 默认数据
    defaultData: {
        brand: {
            description: '我们是一家专注于高品质产品研发与制造的企业。自成立以来，始终秉承"匠心品质、创新无限"的理念，致力于为客户提供最优秀的产品和服务。经过多年的发展，我们已经成为行业内的知名品牌，产品远销海内外，赢得了广大客户的信赖和好评。',
            stats: {
                years: 15,
                products: 120,
                customers: 5000
            }
        },
        contact: {
            address: '北京市朝阳区创新科技园 A 栋 1001 室',
            phone: '400-888-8888',
            email: 'contact@brand.com'
        },
        timeline: [
            { id: 1, year: '2010', title: '公司成立', description: '在北京中关村创立公司，开始创业之旅' },
            { id: 2, year: '2015', title: '品牌升级', description: '完成品牌战略升级，确立市场定位' },
            { id: 3, year: '2018', title: '全国布局', description: '在全国主要城市建立销售和服务网络' },
            { id: 4, year: '2020', title: '海外拓展', description: '产品出口至欧美市场，开启国际化进程' },
            { id: 5, year: '2024', title: '智能制造', description: '建成智能化生产基地，产能大幅提升' }
        ],
        products: [
            { id: 1, name: '经典款产品 A', category: '旗舰系列', image: 'https://via.placeholder.com/400x300/4A90D9/ffffff?text=Product+A', price: '¥1,999', sort: 1, description: '我们的旗舰产品，集成了最新技术', details: '产品特点：\n1. 高性能处理器\n2. 超长续航能力\n3. 精美外观设计\n4. 智能互联功能' },
            { id: 2, name: '时尚款产品 B', category: '时尚系列', image: 'https://via.placeholder.com/400x300/D94A4A/ffffff?text=Product+B', price: '¥1,599', sort: 2, description: '专为年轻时尚人士设计', details: '产品特点：\n1. 轻薄便携\n2. 多彩配色\n3. 触控操作\n4. 快充技术' },
            { id: 3, name: '专业款产品 C', category: '专业系列', image: 'https://via.placeholder.com/400x300/4AD94A/ffffff?text=Product+C', price: '¥2,999', sort: 3, description: '满足专业用户的需求', details: '产品特点：\n1. 专业级性能\n2. 精准控制\n3. 扩展接口丰富\n4. 耐用可靠' },
            { id: 4, name: '入门款产品 D', category: '入门系列', image: 'https://via.placeholder.com/400x300/D9D94A/ffffff?text=Product+D', price: '¥699', sort: 4, description: '性价比之选，适合初次体验', details: '产品特点：\n1. 价格亲民\n2. 功能实用\n3. 操作简单\n4. 质量可靠' },
            { id: 5, name: '限量版产品 E', category: '旗舰系列', image: 'https://via.placeholder.com/400x300/9B4AD9/ffffff?text=Product+E', price: '¥3,999', sort: 5, description: '限量发售，独具收藏价值', details: '产品特点：\n1. 限量编号\n2. 特殊材质\n3. 定制包装\n4. 专属服务' },
            { id: 6, name: '运动款产品 F', category: '运动系列', image: 'https://via.placeholder.com/400x300/4AD9D9/ffffff?text=Product+F', price: '¥1,299', sort: 6, description: '为运动爱好者量身打造', details: '产品特点：\n1. 防水设计\n2. 抗冲击\n3. 轻便舒适\n4. 运动监测' }
        ]
    },

    // 初始化数据
    init() {
        if (!localStorage.getItem('brandData')) {
            this.saveData('brandData', this.defaultData);
        }
    },

    // 保存数据
    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // 读取数据
    getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // 品牌信息
    brand: {
        get() {
            const data = API.getData('brandData');
            return data ? data.brand : API.defaultData.brand;
        },
        save(brandData) {
            const data = API.getData('brandData') || { ...API.defaultData };
            data.brand = brandData;
            API.saveData('brandData', data);
        }
    },

    // 联系信息
    contact: {
        get() {
            const data = API.getData('brandData');
            return data ? data.contact : API.defaultData.contact;
        },
        save(contactData) {
            const data = API.getData('brandData') || { ...API.defaultData };
            data.contact = contactData;
            API.saveData('brandData', data);
        }
    },

    // 时间轴
    timeline: {
        get() {
            const data = API.getData('brandData');
            return data ? data.timeline : API.defaultData.timeline;
        },
        getAll() {
            return this.get();
        },
        save(list) {
            const data = API.getData('brandData') || { ...API.defaultData };
            data.timeline = list;
            API.saveData('brandData', data);
        },
        add(item) {
            const list = this.get();
            item.id = Date.now();
            list.push(item);
            this.save(list);
        },
        update(id, item) {
            const list = this.get();
            const index = list.findIndex(i => i.id == id);
            if (index !== -1) {
                list[index] = { ...item, id: parseInt(id) };
                this.save(list);
            }
        },
        delete(id) {
            const list = this.get();
            const filtered = list.filter(i => i.id != id);
            this.save(filtered);
        }
    },

    // 产品
    products: {
        get() {
            const data = API.getData('brandData');
            return data ? data.products : API.defaultData.products;
        },
        getAll() {
            return this.get();
        },
        getCategories() {
            const products = this.get();
            const categories = [...new Set(products.map(p => p.category))];
            return categories;
        },
        save(list) {
            const data = API.getData('brandData') || { ...API.defaultData };
            data.products = list;
            API.saveData('brandData', data);
        },
        add(item) {
            const list = this.get();
            item.id = Date.now();
            list.push(item);
            this.save(list);
        },
        update(id, item) {
            const list = this.get();
            const index = list.findIndex(i => i.id == id);
            if (index !== -1) {
                list[index] = { ...item, id: parseInt(id) };
                this.save(list);
            }
        },
        delete(id) {
            const list = this.get();
            const filtered = list.filter(i => i.id != id);
            this.save(filtered);
        }
    },

    // 用户认证
    auth: {
        login(username, password) {
            if (username === 'admin' && password === 'admin123') {
                localStorage.setItem('isAdminLoggedIn', 'true');
                return true;
            }
            return false;
        },
        logout() {
            localStorage.removeItem('isAdminLoggedIn');
        },
        isLoggedIn() {
            return localStorage.getItem('isAdminLoggedIn') === 'true';
        }
    }
};

// 初始化
API.init();
