// API 和数据管理模块 - 使用腾讯云 COS 存储
// 所有数据存储在腾讯云 COS，localStorage 作为本地缓存

// 网站基础 URL（用于处理图片路径）
const BASE_URL = window.location.protocol + '//' + window.location.host;

// 腾讯云 COS 配置（带默认值）
const COS_CONFIG = {
    bucket: localStorage.getItem('cos_bucket') || 'bacashi-1300000000-1412313617',
    region: localStorage.getItem('cos_region') || 'ap-shanghai',
    secretId: localStorage.getItem('cos_secret_id') || '',
    secretKey: localStorage.getItem('cos_secret_key') || ''
};

// 数据存储在 COS 中的路径
const COS_DATA_KEY = 'website-data/backup.json';

// 保存 COS 配置到 localStorage（内部函数，加下划线前缀避免命名冲突）
function _saveCosConfigToLocal(config) {
    if (config.bucket) localStorage.setItem('cos_bucket', config.bucket);
    if (config.region) localStorage.setItem('cos_region', config.region);
    if (config.secretId) localStorage.setItem('cos_secret_id', config.secretId);
    if (config.secretKey) localStorage.setItem('cos_secret_key', config.secretKey);
    Object.assign(COS_CONFIG, config);
    console.log('COS 配置已保存到 localStorage:', config);
}

// 转换图片路径为完整 URL
function normalizeImagePath(imagePath) {
    if (!imagePath) {
        // 使用本地 SVG 占位图（不依赖外部服务）
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23f0f0f0" width="600" height="400"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="24" text-anchor="middle" x="300" y="200"%3E无图片%3C/text%3E%3C/svg%3E';
    }
    // 如果已经是完整 URL 或 Base64 数据，直接返回
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('//') || imagePath.startsWith('data:')) {
        return imagePath;
    }
    // 相对路径转换为完整 URL
    if (imagePath.startsWith('assets/')) {
        return BASE_URL + '/' + imagePath;
    }
    // 其他情况，尝试添加当前域名
    return BASE_URL + '/' + imagePath;
}

// 简单的 Supabase 客户端（无需额外库）
const SupabaseClient = {
    retryCount: 0,
    maxRetries: 3,
    client: null,  // 显式声明 client 属性

    async init() {
        // 动态加载 Supabase SDK
        if (typeof supabase === 'undefined') {
            return new Promise((resolve, reject) => {
                // 优先尝试本地文件
                const localSrc = 'assets/js/supabase.min.js';
                // 备用 CDN 源（按优先级）
                const cdnSources = [
                    'https://cdn.staticfile.org/supabase/2.39.3/supabase.min.js',
                    'https://cdn.bootcdn.net/ajax/libs/supabase/2.39.3/supabase.min.js',
                    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js'
                ];

                let currentSource = -1;
                let script = null;
                const self = this;  // 保存 this 引用

                function loadScript(src) {
                    script = document.createElement('script');
                    script.src = src;
                    console.log(`尝试加载 Supabase SDK: ${src}`);

                    script.onload = () => {
                        clearTimeout(timeout);
                        console.log('supabase 对象:', typeof supabase);
                        console.log('createClient:', typeof supabase.createClient);
                        if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
                            self.client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                            console.log('✅ Supabase SDK 已加载，client:', self.client ? 'ok' : 'undefined');
                            resolve();
                        } else {
                            console.error('❌ supabase.createClient 不存在');
                            reject(new Error('supabase.createClient 不存在'));
                        }
                    };

                    script.onerror = () => {
                        currentSource++;
                        if (currentSource < cdnSources.length) {
                            console.warn(`CDN 失败，尝试下一个：${cdnSources[currentSource]}`);
                            loadScript(cdnSources[currentSource]);
                        } else {
                            clearTimeout(timeout);
                            console.warn('⚠️ Supabase SDK 加载失败，将仅使用本地存储');
                            reject(new Error('Supabase 不可用'));
                        }
                    };

                    document.head.appendChild(script);
                }

                // 设置超时（15 秒）
                const timeout = setTimeout(() => {
                    console.warn('Supabase SDK 加载超时，将仅使用本地存储');
                    script && script.onerror && script.onerror();
                }, 15000);

                // 先尝试本地文件
                loadScript(localSrc);
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
            console.log('✅ Supabase 已初始化');
        } catch (err) {
            console.warn('⚠️ Supabase 初始化失败:', err.message);
            console.warn('将使用本地存储，云端同步功能不可用');
            this.supabaseReady = false;
        }

        // 从云端或本地加载数据
        await this.loadData();
    },

    // 手动重试连接 Supabase
    async retrySupabaseConnection() {
        console.log('尝试重新连接 Supabase...');
        try {
            SupabaseClient.retryCount = 0;
            await SupabaseClient.init();
            await SupabaseClient.initTables();
            this.supabaseReady = true;
            console.log('✅ Supabase 连接成功');
            return true;
        } catch (err) {
            console.warn('⚠️ Supabase 重连失败:', err.message);
            this.supabaseReady = false;
            return false;
        }
    },

    // 强制从云端同步数据（用于页面加载时确保数据最新）
    async forceSync() {
        console.log('=== API.forceSync 开始 ===');
        console.log('isOnline:', this.isOnline);
        console.log('supabaseReady:', this.supabaseReady);

        if (!this.isOnline || !this.supabaseReady) {
            console.warn('无法强制同步：网络离线或 Supabase 未就绪');
            // 即使无法同步，也确保有本地数据
            await this.loadData();
            return false;
        }

        try {
            const brandData = await SupabaseClient.getData('brand_data', 'main');
            const bacashiData = await SupabaseClient.getData('bacashi_data', 'main');

            console.log('Supabase brandData:', brandData ? '有数据' : '无数据');
            console.log('Supabase bacashiData:', bacashiData ? '有数据' : '无数据');
            if (brandData) {
                console.log('brandData 产品数量:', brandData.products?.length || 0);
            }
            if (bacashiData) {
                console.log('bacashiData 产品数量:', bacashiData.products?.length || 0);
            }

            if (brandData) {
                localStorage.setItem('brandData', JSON.stringify(brandData));
                console.log('强制同步：已从云端同步 brandData');
            }
            if (bacashiData) {
                localStorage.setItem('bacashiData', JSON.stringify(bacashiData));
                console.log('强制同步：已从云端同步 bacashiData');
            }

            return true;
        } catch (err) {
            console.error('强制同步失败:', err);
            // 同步失败时回退到本地数据
            await this.loadData();
            return false;
        }
    },

    // 加载数据（优先从云端，失败则从本地）
    async loadData() {
        console.log('=== API.loadData 开始加载数据 ===');

        // 尝试从 Supabase 加载品牌数据
        let brandDataFromSupabase = null;
        if (this.isOnline && this.supabaseReady) {
            try {
                brandDataFromSupabase = await SupabaseClient.getData('brand_data', 'main');
                if (brandDataFromSupabase) {
                    console.log('✅ 从 Supabase 加载 brandData');
                    localStorage.setItem('brandData', JSON.stringify(brandDataFromSupabase));
                }
            } catch (err) {
                console.warn('从 Supabase 加载 brandData 失败:', err);
            }
        }

        // 如果云端没有数据，从 localStorage 加载
        let brandData = null;
        if (!brandDataFromSupabase) {
            const localData = localStorage.getItem('brandData');
            if (localData) {
                brandData = JSON.parse(localData);
                console.log('从 localStorage 加载 brandData');
            }
        } else {
            brandData = brandDataFromSupabase;
        }

        if (!brandData) {
            brandData = { ...defaultData };
            console.log('使用默认 brandData（缓存已清空或未配置）');
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

        localStorage.setItem('brandData', JSON.stringify(brandData));

        // 尝试从 Supabase 加载 bacashi 数据
        let bacashiDataFromSupabase = null;
        if (this.isOnline && this.supabaseReady) {
            try {
                bacashiDataFromSupabase = await SupabaseClient.getData('bacashi_data', 'main');
                if (bacashiDataFromSupabase) {
                    console.log('✅ 从 Supabase 加载 bacashiData');
                    localStorage.setItem('bacashiData', JSON.stringify(bacashiDataFromSupabase));
                }
            } catch (err) {
                console.warn('从 Supabase 加载 bacashiData 失败:', err);
            }
        }

        // 如果云端没有数据，从 localStorage 加载
        let bacashiData = null;
        if (!bacashiDataFromSupabase) {
            const localData = localStorage.getItem('bacashiData');
            if (localData) {
                bacashiData = JSON.parse(localData);
                console.log('从 localStorage 加载 bacashiData');
            }
        } else {
            bacashiData = bacashiDataFromSupabase;
        }

        if (!bacashiData) {
            bacashiData = { ...defaultDataBacashi };
            console.log('使用默认 bacashiData（缓存已清空或未配置）');
        }

        // 确保 bacashi 数据完整
        if (!bacashiData.brand || !bacashiData.brand.description) {
            bacashiData.brand = defaultDataBacashi.brand;
        }

        localStorage.setItem('bacashiData', JSON.stringify(bacashiData));

        console.log('=== API.loadData 数据加载完成 ===');
    },

    // 保存数据到云端和本地
    async saveData(key, data, table = 'brand_data', waitForSync = true) {
        // 总是先保存到本地
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`数据已保存到本地：${key}`);

        // 如果在线且 Supabase 可用，同步到云端
        if (this.isOnline && this.supabaseReady) {
            try {
                const success = await SupabaseClient.saveData(table, key === 'brandData' ? 'main' : 'bacashi', data);
                if (success) {
                    console.log(`✅ 数据已同步到云端：${key}`);
                } else {
                    console.warn(`⚠️ 云端同步失败，数据仅保存在本地：${key}`);
                }
            } catch (err) {
                console.error(`❌ 云端同步错误：${key}`, err.message);
            }
        } else {
            if (!this.isOnline) {
                console.warn(`⚠️ 网络离线，数据仅保存在本地：${key}`);
            }
            if (!this.supabaseReady) {
                console.warn(`⚠️ Supabase 未就绪，数据仅保存在本地：${key}`);
            }
        }
    },

    // 强制同步所有数据到云端（用于保存后确保同步完成）
    async forceSyncData() {
        if (!this.isOnline) {
            console.warn('无法同步：网络离线');
            return false;
        }

        // 检查 COS 配置是否完整
        if (!COS_CONFIG.secretId || !COS_CONFIG.secretKey) {
            console.warn('COS 配置不完整，无法同步');
            return false;
        }

        try {
            // 整合所有需要同步的数据
            const allData = {
                brandData: this.getData('brandData'),
                bacashiData: this.getData('bacashiData'),
                contactData: this.getData('contactData'),
                timelineData: this.getData('timelineData'),
                messageData: JSON.parse(localStorage.getItem('contactMessages') || '[]'),
                syncTime: new Date().toISOString()
            };

            // 上传到 COS
            await API.cos.uploadData(allData);
            console.log('✅ 数据已同步到 COS');
            return true;
        } catch (err) {
            console.error('❌ 同步失败:', err);
            return false;
        }
    },

    // 读取数据
    getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // 从云端同步数据（手动刷新用）
    async syncFromCloud() {
        if (!this.isOnline) {
            console.warn('无法同步：网络离线');
            return false;
        }

        // 检查 COS 配置是否完整
        if (!COS_CONFIG.secretId || !COS_CONFIG.secretKey) {
            console.warn('COS 配置不完整，无法同步');
            return false;
        }

        try {
            // 从 COS 下载数据
            const cloudData = await API.cos.downloadData();

            if (cloudData) {
                // 更新本地数据
                if (cloudData.brandData) {
                    localStorage.setItem('brandData', JSON.stringify(cloudData.brandData));
                    console.log('已从 COS 同步 brandData');
                }
                if (cloudData.bacashiData) {
                    localStorage.setItem('bacashiData', JSON.stringify(cloudData.bacashiData));
                    console.log('已从 COS 同步 bacashiData');
                }
                if (cloudData.contactData) {
                    localStorage.setItem('contactData', JSON.stringify(cloudData.contactData));
                    console.log('已从 COS 同步 contactData');
                }
                if (cloudData.timelineData) {
                    localStorage.setItem('timelineData', JSON.stringify(cloudData.timelineData));
                    console.log('已从 COS 同步 timelineData');
                }
                if (cloudData.messageData) {
                    localStorage.setItem('contactMessages', JSON.stringify(cloudData.messageData));
                    console.log('已从 COS 同步 messageData');
                }
                return true;
            }
            return false;
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
        // 获取所有产品（带完整图片 URL）
        getAllWithImageUrls() {
            const products = this.get();
            return products.map(p => ({
                ...p,
                image: normalizeImagePath(p.image)
            }));
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
            // 获取所有产品（带完整图片 URL）
            getAllWithImageUrls() {
                const products = this.get();
                return products.map(p => ({
                    ...p,
                    image: normalizeImagePath(p.image)
                }));
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
    },

    // 腾讯云 COS 图片上传（使用官方 SDK）
    cos: {
        getConfig() {
            return {
                bucket: COS_CONFIG.bucket,
                region: COS_CONFIG.region,
                secretId: COS_CONFIG.secretId,
                secretKey: COS_CONFIG.secretKey
            };
        },
        saveConfig(config) {
            _saveCosConfigToLocal(config);
        },
        // 上传图片到 COS
        async upload(file) {
            return new Promise((resolve, reject) => {
                if (!COS_CONFIG.bucket || !COS_CONFIG.region || !COS_CONFIG.secretId || !COS_CONFIG.secretKey) {
                    reject(new Error('请先配置 COS 参数'));
                    return;
                }

                console.log('=== COS 上传开始 ===');
                console.log('Bucket:', COS_CONFIG.bucket);
                console.log('Region:', COS_CONFIG.region);
                console.log('文件:', file.name, '大小:', file.size);

                // 动态加载 COS SDK
                if (typeof COS === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/cos-js-sdk-v5@latest/dist/cos-js-sdk-v5.min.js';
                    script.onload = () => initUpload();
                    script.onerror = () => reject(new Error('COS SDK 加载失败，请检查网络连接'));
                    document.head.appendChild(script);
                    return;
                }

                initUpload();

                function initUpload() {
                    // 生成文件名
                    const timestamp = Date.now();
                    const randomStr = Math.random().toString(36).substring(2, 8);
                    const ext = file.name.split('.').pop() || 'jpg';
                    const filename = `products/${timestamp}_${randomStr}.${ext}`;

                    const cos = new COS({
                        SecretId: COS_CONFIG.secretId,
                        SecretKey: COS_CONFIG.secretKey
                    });

                    console.log('开始上传:', filename);

                    cos.putObject({
                        Bucket: COS_CONFIG.bucket,
                        Region: COS_CONFIG.region,
                        Key: filename,
                        Body: file
                    }, (err, data) => {
                        if (err) {
                            console.error('上传失败:', err);
                            reject(new Error(err.message || '上传失败'));
                        } else {
                            const imageUrl = `https://${COS_CONFIG.bucket}.cos.${COS_CONFIG.region}.myqcloud.com/${filename}`;
                            console.log('上传成功:', imageUrl);
                            resolve(imageUrl);
                        }
                    });
                }
            });
        },
        // 上传数据到 COS
        async uploadData(data) {
            return new Promise((resolve, reject) => {
                if (!COS_CONFIG.bucket || !COS_CONFIG.region || !COS_CONFIG.secretId || !COS_CONFIG.secretKey) {
                    reject(new Error('请先配置 COS 参数'));
                    return;
                }

                console.log('=== COS 数据上传开始 ===');
                console.log('Bucket:', COS_CONFIG.bucket);
                console.log('Region:', COS_CONFIG.region);

                // 动态加载 COS SDK
                if (typeof COS === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/cos-js-sdk-v5@latest/dist/cos-js-sdk-v5.min.js';
                    script.onload = () => initUpload();
                    script.onerror = () => reject(new Error('COS SDK 加载失败，请检查网络连接'));
                    document.head.appendChild(script);
                    return;
                }

                initUpload();

                function initUpload() {
                    const cos = new COS({
                        SecretId: COS_CONFIG.secretId,
                        SecretKey: COS_CONFIG.secretKey
                    });

                    const jsonData = JSON.stringify(data);
                    console.log('数据大小:', jsonData.length, 'bytes');

                    cos.putObject({
                        Bucket: COS_CONFIG.bucket,
                        Region: COS_CONFIG.region,
                        Key: COS_DATA_KEY,
                        Body: jsonData,
                        Headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache'
                        }
                    }, (err, data) => {
                        if (err) {
                            console.error('上传失败:', err);
                            reject(new Error(err.message || '上传失败'));
                        } else {
                            const fileUrl = `https://${COS_CONFIG.bucket}.cos.${COS_CONFIG.region}.myqcloud.com/${COS_DATA_KEY}`;
                            console.log('上传成功:', fileUrl);
                            resolve(fileUrl);
                        }
                    });
                }
            });
        },
        // 从 COS 下载数据
        async downloadData() {
            return new Promise((resolve, reject) => {
                if (!COS_CONFIG.bucket || !COS_CONFIG.region || !COS_CONFIG.secretId || !COS_CONFIG.secretKey) {
                    reject(new Error('请先配置 COS 参数'));
                    return;
                }

                console.log('=== COS 数据下载开始 ===');

                // 动态加载 COS SDK
                if (typeof COS === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/cos-js-sdk-v5@latest/dist/cos-js-sdk-v5.min.js';
                    script.onload = () => initDownload();
                    script.onerror = () => reject(new Error('COS SDK 加载失败，请检查网络连接'));
                    document.head.appendChild(script);
                    return;
                }

                initDownload();

                function initDownload() {
                    const cos = new COS({
                        SecretId: COS_CONFIG.secretId,
                        SecretKey: COS_CONFIG.secretKey
                    });

                    cos.getObject({
                        Bucket: COS_CONFIG.bucket,
                        Region: COS_CONFIG.region,
                        Key: COS_DATA_KEY
                    }, (err, data) => {
                        if (err) {
                            if (err.statusCode === 404) {
                                console.log('云端无数据');
                                resolve(null);
                            } else {
                                console.error('下载失败:', err);
                                reject(new Error(err.message || '下载失败'));
                            }
                        } else {
                            try {
                                const jsonData = JSON.parse(data.Body.toString());
                                console.log('下载成功，数据大小:', data.Body.length, 'bytes');
                                resolve(jsonData);
                            } catch (e) {
                                console.error('数据解析失败:', e);
                                reject(new Error('数据格式错误'));
                            }
                        }
                    });
                }
            });
        }
    }
};

// API 初始化在调用时自动执行（由 admin.js 或其他入口文件负责）
