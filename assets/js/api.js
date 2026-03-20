// API 和数据管理模块 - 集成 Supabase 云同步
// 使用 Supabase 作为后端存储，localStorage 作为本地缓存

// Supabase 配置
const SUPABASE_CONFIG = {
    url: 'https://twwxiucjojfujxqfaddy.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3d3hpdWNqb2pmdWp4cWZhZGR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTE0NDgsImV4cCI6MjA4OTQ2NzQ0OH0.AXYrS6BgvJqEkXBp-pN613FSXetm4iB_2O_SHSxTRFc'
};

// 简单的 Supabase 客户端（无需额外库）
const SupabaseClient = {
    async init() {
        // 动态加载 Supabase SDK
        if (typeof supabase === 'undefined') {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
                script.onload = () => {
                    this.client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                    console.log('Supabase SDK 已加载');
                    resolve();
                };
                script.onerror = () => reject(new Error('Supabase SDK 加载失败'));
                document.head.appendChild(script);
            });
        } else {
            this.client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            return Promise.resolve();
        }
    },

    async getData(table, key) {
        try {
            const { data, error } = await this.client
                .from(table)
                .select('data')
                .eq('key', key)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // 没有找到记录
                throw error;
            }
            return data ? data.data : null;
        } catch (err) {
            console.error('Supabase 读取失败:', err);
            return null;
        }
    },

    async saveData(table, key, data) {
        try {
            const { error } = await this.client
                .from(table)
                .upsert({ key, data, updated_at: new Date().toISOString() }, { onConflict: 'key' });

            if (error) throw error;
            console.log(`Supabase 保存成功：${table}.${key}`);
            return true;
        } catch (err) {
            console.error('Supabase 保存失败:', err);
            return false;
        }
    },

    // 初始化数据库表
    async initTables() {
        try {
            // 测试连接
            const { data, error } = await this.client
                .from('brand_data')
                .select('key')
                .limit(1);

            if (error) {
                console.error('Supabase 表未创建或无权限:', error.message);
                console.warn('请在 Supabase 后台创建 brand_data 和 bacashi_data 表');
                throw new Error('数据库表不存在，请先运行初始化脚本');
            }

            console.log('Supabase 表已存在');
        } catch (err) {
            console.warn('Supabase 表检查失败:', err.message);
            throw err;
        }
    }
};

// 默认数据
const defaultData = {
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
        { id: 1, name: '卡斐乐主打产品', category: '车用电子', image: 'assets/images/微信图片_20260313141449_149_2.jpg', price: '¥1,999', sort: 1, description: '我们的旗舰产品，集成了最新技术', details: '产品特点：\n1. 高性能处理器\n2. 超长续航能力\n3. 精美外观设计\n4. 智能互联功能' },
        { id: 2, name: '时尚款产品 B', category: '车用内饰', image: 'https://via.placeholder.com/400x300/D94A4A/ffffff?text=Product+B', price: '¥1,599', sort: 2, description: '专为年轻时尚人士设计', details: '产品特点：\n1. 轻薄便携\n2. 多彩配色\n3. 触控操作\n4. 快充技术' },
        { id: 3, name: '专业款产品 C', category: '桌面风扇', image: 'https://via.placeholder.com/400x300/4AD94A/ffffff?text=Product+C', price: '¥2,999', sort: 3, description: '满足专业用户的需求', details: '产品特点：\n1. 专业级性能\n2. 精准控制\n3. 扩展接口丰富\n4. 耐用可靠' }
    ]
};

// 默认数据 - 倍卡西 BACASHI
const defaultDataBacashi = {
    brand: {
        name: '倍卡西',
        description: '倍卡西（BACASHI）是一家专注于高品质产品研发与制造的企业。自成立以来，始终秉承"匠心品质、创新无限"的理念，致力于为客户提供最优秀的产品和服务。',
        stats: {
            years: 2,
            products: 80,
            customers: 3000
        }
    },
    contact: {
        address: '浙江省义乌市北苑街道秋实路 121 号 2 号楼 8 楼',
        phone: '400-666-6666',
        email: 'contact@bacashi.com'
    },
    timeline: [
        { id: 1, year: '2024', title: '品牌创立', description: '倍卡西品牌正式成立，开启创业之旅' },
        { id: 2, year: '2025', title: '品牌发展', description: '完成产品线布局，在多个类目取得优异成绩' },
        { id: 3, year: '2025', title: '市场拓展', description: '产品销往全国，赢得广大客户信赖' }
    ],
    products: [
        { id: 1, name: '倍卡西主打产品', category: '车用电子', image: 'https://via.placeholder.com/400x300/4A4AD9/ffffff?text=BACASHI+A', price: '¥1,599', sort: 1, description: '倍卡西旗舰产品，集成最新技术', details: '产品特点：\n1. 高性能处理器\n2. 超长续航能力\n3. 精美外观设计\n4. 智能互联功能' },
        { id: 2, name: '倍卡西时尚款', category: '车用内饰', image: 'https://via.placeholder.com/400x300/D94AD9/ffffff?text=BACASHI+B', price: '¥1,299', sort: 2, description: '专为年轻时尚人士设计', details: '产品特点：\n1. 轻薄便携\n2. 多彩配色\n3. 触控操作\n4. 快充技术' },
        { id: 3, name: '倍卡西专业款', category: '桌面风扇', image: 'https://via.placeholder.com/400x300/4AD9D9/ffffff?text=BACASHI+C', price: '¥2,599', sort: 3, description: '满足专业用户的需求', details: '产品特点：\n1. 专业级性能\n2. 精准控制\n3. 扩展接口丰富\n4. 耐用可靠' }
    ]
};

const API = {
    // 同步状态
    isOnline: navigator.onLine,
    supabaseReady: false,

    // 初始化
    async init() {
        // 监听网络状态
        window.addEventListener('online', () => { this.isOnline = true; console.log('网络已连接'); });
        window.addEventListener('offline', () => { this.isOnline = false; console.log('网络已断开'); });

        // 初始化 Supabase
        try {
            await SupabaseClient.init();
            await SupabaseClient.initTables();
            this.supabaseReady = true;
            console.log('Supabase 已初始化');
        } catch (err) {
            console.warn('Supabase 初始化失败，使用本地存储:', err);
            this.supabaseReady = false;
        }

        // 从云端或本地加载数据
        await this.loadData();
    },

    // 加载数据（优先从云端，失败则从本地）
    async loadData() {
        // 加载 brandData
        let brandData = null;
        if (this.isOnline && this.supabaseReady) {
            brandData = await SupabaseClient.getData('brand_data', 'main');
            if (brandData) {
                console.log('从 Supabase 加载 brandData');
                localStorage.setItem('brandData', JSON.stringify(brandData));
            }
        }

        if (!brandData) {
            brandData = localStorage.getItem('brandData');
            if (brandData) {
                brandData = JSON.parse(brandData);
                console.log('从 localStorage 加载 brandData');
            } else {
                brandData = { ...defaultData };
                console.log('使用默认 brandData');
            }
            localStorage.setItem('brandData', JSON.stringify(brandData));
        }

        // 确保数据完整
        if (!brandData.timeline || brandData.timeline.length === 0) {
            brandData.timeline = defaultData.timeline;
        }
        if (!brandData.contact || !brandData.contact.address) {
            brandData.contact = defaultData.contact;
        }
        if (!brandData.brand || !brandData.brand.description) {
            brandData.brand = defaultData.brand;
        }

        // 加载 bacashiData
        let bacashiData = null;
        if (this.isOnline && this.supabaseReady) {
            bacashiData = await SupabaseClient.getData('bacashi_data', 'main');
            if (bacashiData) {
                console.log('从 Supabase 加载 bacashiData');
                localStorage.setItem('bacashiData', JSON.stringify(bacashiData));
            }
        }

        if (!bacashiData) {
            bacashiData = localStorage.getItem('bacashiData');
            if (bacashiData) {
                bacashiData = JSON.parse(bacashiData);
                console.log('从 localStorage 加载 bacashiData');
            } else {
                bacashiData = { ...defaultDataBacashi };
                console.log('使用默认 bacashiData');
            }
            localStorage.setItem('bacashiData', JSON.stringify(bacashiData));
        }

        // 确保 bacashi 数据完整
        if (!bacashiData.brand || !bacashiData.brand.description) {
            bacashiData.brand = defaultDataBacashi.brand;
            localStorage.setItem('bacashiData', JSON.stringify(bacashiData));
        }
    },

    // 保存数据到云端和本地
    async saveData(key, data, table = 'brand_data') {
        // 总是先保存到本地
        localStorage.setItem(key, JSON.stringify(data));

        // 如果在线且 Supabase 可用，同步到云端
        if (this.isOnline && this.supabaseReady) {
            const success = await SupabaseClient.saveData(table, key === 'brandData' ? 'main' : 'bacashi', data);
            if (success) {
                console.log(`数据已同步到云端：${key}`);
            }
        }
    },

    // 读取数据
    getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // 从云端同步数据（手动刷新用）
    async syncFromCloud() {
        if (!this.isOnline || !this.supabaseReady) {
            console.warn('无法同步：网络离线或 Supabase 未就绪');
            return false;
        }

        try {
            const brandData = await SupabaseClient.getData('brand_data', 'main');
            const bacashiData = await SupabaseClient.getData('bacashi_data', 'main');

            if (brandData) {
                localStorage.setItem('brandData', JSON.stringify(brandData));
                console.log('已从云端同步 brandData');
            }
            if (bacashiData) {
                localStorage.setItem('bacashiData', JSON.stringify(bacashiData));
                console.log('已从云端同步 bacashiData');
            }

            // 重新加载页面
            location.reload();
            return true;
        } catch (err) {
            console.error('同步失败:', err);
            return false;
        }
    },

    // 导出所有数据（用于备份）
    exportData() {
        return {
            brandData: this.getData('brandData'),
            bacashiData: this.getData('bacashiData'),
            exportedAt: new Date().toISOString()
        };
    },

    // 导入数据并同步到云端
    async importData(data) {
        if (data.brandData) {
            await this.saveData('brandData', data.brandData, 'brand_data');
        }
        if (data.bacashiData) {
            await this.saveData('bacashiData', data.bacashiData, 'bacashi_data');
        }
        location.reload();
    },

    // 品牌信息
    brand: {
        get() {
            const data = API.getData('brandData');
            return data ? data.brand : defaultData.brand;
        },
        async save(brandData) {
            const data = API.getData('brandData') || { ...defaultData };
            data.brand = brandData;
            await API.saveData('brandData', data, 'brand_data');
        }
    },

    // 联系信息
    contact: {
        get() {
            const data = API.getData('brandData');
            return data ? data.contact : defaultData.contact;
        },
        async save(contactData) {
            const data = API.getData('brandData') || { ...defaultData };
            data.contact = contactData;
            await API.saveData('brandData', data, 'brand_data');
        }
    },

    // 时间轴
    timeline: {
        get() {
            const data = API.getData('brandData');
            return data ? data.timeline : defaultData.timeline;
        },
        getAll() {
            return this.get();
        },
        async save(list) {
            const data = API.getData('brandData') || { ...defaultData };
            data.timeline = list;
            await API.saveData('brandData', data, 'brand_data');
        },
        async add(item) {
            const list = this.get();
            item.id = Date.now();
            list.push(item);
            await this.save(list);
        },
        async update(id, item) {
            const list = this.get();
            const index = list.findIndex(i => i.id == id);
            if (index !== -1) {
                list[index] = { ...item, id: parseInt(id) };
                await this.save(list);
            }
        },
        async delete(id) {
            const list = this.get();
            const filtered = list.filter(i => i.id != id);
            await this.save(filtered);
        }
    },

    // 产品
    products: {
        get() {
            const data = API.getData('brandData');
            return data ? data.products : defaultData.products;
        },
        getAll() {
            return this.get();
        },
        getCategories() {
            const products = this.get();
            const categories = [...new Set(products.map(p => p.category))];
            return categories;
        },
        async save(list) {
            console.log('products.save: 保存产品列表，数量=', list.length);
            const data = API.getData('brandData') || { ...defaultData };
            console.log('products.save: 当前 brandData 有 products 吗？', data.products ? '有' : '无');
            data.products = list;
            console.log('products.save: 准备保存到 localStorage 和云端');
            await API.saveData('brandData', data, 'brand_data');
            console.log('products.save: 保存完成');
        },
        async add(item) {
            const list = this.get();
            const maxId = list.length > 0 ? Math.max(...list.map(p => p.id)) : 0;
            item.id = maxId + 1;
            list.push(item);
            await this.save(list);
        },
        async update(id, item) {
            const list = this.get();
            const index = list.findIndex(i => i.id == id);
            if (index !== -1) {
                list[index] = { ...item, id: parseInt(id) };
                await this.save(list);
            }
        },
        async delete(id) {
            const list = this.get();
            const filtered = list.filter(i => i.id != id);
            await this.save(filtered);
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
    },

    // 产品说明书
    manuals: {
        get() {
            const data = API.getData('brandData');
            return data ? (data.manuals || []) : [];
        },
        getAll() {
            return this.get();
        },
        getByProductId(productId) {
            const manuals = this.get();
            return manuals.filter(m => m.productId == productId);
        },
        async save(list) {
            const data = API.getData('brandData') || { ...defaultData };
            data.manuals = list;
            await API.saveData('brandData', data, 'brand_data');
        },
        async add(item) {
            const list = this.get();
            item.id = Date.now();
            item.createdAt = new Date().toISOString();
            list.push(item);
            await this.save(list);
        },
        async update(id, item) {
            const list = this.get();
            const index = list.findIndex(m => m.id == id);
            if (index !== -1) {
                list[index] = { ...item, id: parseInt(id), updatedAt: new Date().toISOString() };
                await this.save(list);
            }
        },
        async delete(id) {
            const list = this.get();
            const filtered = list.filter(m => m.id != id);
            await this.save(filtered);
        }
    },

    // 倍卡西 BACASHI 品牌数据管理
    bacashi: {
        brand: {
            get() {
                const data = API.getData('bacashiData');
                return data ? data.brand : defaultDataBacashi.brand;
            },
            async save(brandData) {
                const data = API.getData('bacashiData') || { ...defaultDataBacashi };
                data.brand = brandData;
                await API.saveData('bacashiData', data, 'bacashi_data');
            }
        },
        contact: {
            get() {
                const data = API.getData('bacashiData');
                return data ? data.contact : defaultDataBacashi.contact;
            },
            async save(contactData) {
                const data = API.getData('bacashiData') || { ...defaultDataBacashi };
                data.contact = contactData;
                await API.saveData('bacashiData', data, 'bacashi_data');
            }
        },
        timeline: {
            get() {
                const data = API.getData('bacashiData');
                return data ? data.timeline : defaultDataBacashi.timeline;
            },
            async save(list) {
                const data = API.getData('bacashiData') || { ...defaultDataBacashi };
                data.timeline = list;
                await API.saveData('bacashiData', data, 'bacashi_data');
            },
            async add(item) {
                const list = this.get();
                item.id = Date.now();
                list.push(item);
                await this.save(list);
            },
            async update(id, item) {
                const list = this.get();
                const index = list.findIndex(i => i.id == id);
                if (index !== -1) {
                    list[index] = { ...item, id: parseInt(id) };
                    await this.save(list);
                }
            },
            async delete(id) {
                const list = this.get();
                const filtered = list.filter(i => i.id != id);
                await this.save(filtered);
            }
        },
        products: {
            get() {
                const data = API.getData('bacashiData');
                return data ? data.products : defaultDataBacashi.products;
            },
            getAll() {
                return this.get();
            },
            getCategories() {
                const products = this.get();
                const categories = [...new Set(products.map(p => p.category))];
                return categories;
            },
            async save(list) {
                const data = API.getData('bacashiData') || { ...defaultDataBacashi };
                data.products = list;
                await API.saveData('bacashiData', data, 'bacashi_data');
            },
            async add(item) {
                const list = this.get();
                item.id = Date.now();
                list.push(item);
                await this.save(list);
            },
            async update(id, item) {
                const list = this.get();
                const index = list.findIndex(i => i.id == id);
                if (index !== -1) {
                    list[index] = { ...item, id: parseInt(id) };
                    await this.save(list);
                }
            },
            async delete(id) {
                const list = this.get();
                const filtered = list.filter(i => i.id != id);
                await this.save(filtered);
            }
        },
        manuals: {
            get() {
                const data = API.getData('bacashiData');
                return data ? (data.manuals || []) : [];
            },
            async save(list) {
                const data = API.getData('bacashiData') || { ...defaultDataBacashi };
                data.manuals = list;
                await API.saveData('bacashiData', data, 'bacashi_data');
            },
            async add(item) {
                const list = this.get();
                item.id = Date.now();
                item.createdAt = new Date().toISOString();
                list.push(item);
                await this.save(list);
            },
            async update(id, item) {
                const list = this.get();
                const index = list.findIndex(m => m.id == id);
                if (index !== -1) {
                    list[index] = { ...item, id: parseInt(id), updatedAt: new Date().toISOString() };
                    await this.save(list);
                }
            },
            async delete(id) {
                const list = this.get();
                const filtered = list.filter(m => m.id != id);
                await this.save(filtered);
            }
        }
    }
};

// API 初始化在调用时自动执行（由 admin.js 或其他入口文件负责）
