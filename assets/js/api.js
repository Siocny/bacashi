// API 和数据管理模块
// 使用 localStorage 模拟后端数据库

const API = {
    // 默认数据
    defaultData: {
        brand: {
            description: '卡斐乐是一家专注于高品质产品研发与制造的企业。自成立以来，始终秉承"匠心品质、创新无限"的理念，致力于为客户提供最优秀的产品和服务。经过多年的发展，我们已经成为行业内的知名品牌，产品远销海内外，赢得了广大客户的信赖和好评。',
            stats: {
                years: 3,
                products: 120,
                customers: 5000
            }
        },
        contact: {
            address: '浙江省义乌市北苑街道秋实路 121 号 2 号楼 8 楼',
            phone: '400-888-8888',
            email: 'contact@cafele.com'
        },
        timeline: [
            { id: 1, year: '2023', title: '公司成立', description: '在浙江省义乌市大三里塘的某座 100 平地下室，开始创业之旅' },
            { id: 2, year: '2024', title: '公司发展', description: '完成品牌战略升级，确立拼多多车品头部市场定位' },
            { id: 3, year: '2025', title: '公司拓展', description: '在浙江春华路 566 号入驻 680 平仓库，进军数码类目，在风扇类目取得头筹' },
            { id: 4, year: '2025', title: '持续扩大', description: '搬迁至义乌市北苑街道秋实路 121 号 2 号楼 8 楼，签约卡斐乐品牌在拼多多独家车品类目，公司人员扩展到 50+' }
        ],
        products: [
            { id: 1, name: '卡斐乐主打产品', category: '旗舰系列', image: 'assets/images/微信图片_20260313141449_149_2.jpg', price: '¥1,999', sort: 1, description: '我们的旗舰产品，集成了最新技术', details: '产品特点：\n1. 高性能处理器\n2. 超长续航能力\n3. 精美外观设计\n4. 智能互联功能' },
            { id: 2, name: '时尚款产品 B', category: '时尚系列', image: 'https://via.placeholder.com/400x300/D94A4A/ffffff?text=Product+B', price: '¥1,599', sort: 2, description: '专为年轻时尚人士设计', details: '产品特点：\n1. 轻薄便携\n2. 多彩配色\n3. 触控操作\n4. 快充技术' },
            { id: 3, name: '专业款产品 C', category: '专业系列', image: 'https://via.placeholder.com/400x300/4AD94A/ffffff?text=Product+C', price: '¥2,999', sort: 3, description: '满足专业用户的需求', details: '产品特点：\n1. 专业级性能\n2. 精准控制\n3. 扩展接口丰富\n4. 耐用可靠' }
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
            if (username === 'Siocny' && password === 'qq765914261') {
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
