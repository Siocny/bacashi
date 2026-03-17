// IndexedDB 存储模块 - 用于存储大数据（如说明书内容）
const Storage = {
    DB_NAME: 'BrandWebsiteDB',
    DB_VERSION: 1,
    STORE_NAME: 'manuals',
    db: null,

    // 初始化数据库
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB 打开失败:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB 初始化成功');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建说明书存储对象
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    store.createIndex('productId', 'productId', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    },

    // 添加说明书
    addManual(item) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return this.init().then(() => this.addManual(item)).then(resolve).catch(reject);
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            item.id = Date.now();
            item.createdAt = new Date().toISOString();

            const request = store.add(item);

            request.onsuccess = () => {
                console.log('说明书已保存到 IndexedDB', item.id);
                resolve(item.id);
            };

            request.onerror = () => {
                console.error('保存说明书失败:', request.error);
                reject(request.error);
            };
        });
    },

    // 获取所有说明书
    getAllManuals() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return this.init().then(() => this.getAllManuals()).then(resolve).catch(reject);
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    },

    // 根据产品 ID 获取说明书
    getManualsByProductId(productId) {
        return this.getAllManuals().then(manuals => {
            return manuals.filter(m => m.productId == productId);
        });
    },

    // 更新说明书
    updateManual(item) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return this.init().then(() => this.updateManual(item)).then(resolve).catch(reject);
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            item.updatedAt = new Date().toISOString();

            const request = store.put(item);

            request.onsuccess = () => {
                resolve(item.id);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    },

    // 删除说明书
    deleteManual(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return this.init().then(() => this.deleteManual(id)).then(resolve).catch(reject);
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    },

    // 清空所有说明书
    clearAllManuals() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                return this.init().then(() => this.clearAllManuals()).then(resolve).catch(reject);
            }

            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    },

    // 获取存储使用情况
    getStorageInfo() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate().then(estimate => {
                const usage = (estimate.usage / 1024 / 1024).toFixed(2);
                const quota = (estimate.quota / 1024 / 1024).toFixed(2);
                return { usage, quota, percent: ((usage / quota) * 100).toFixed(1) };
            });
        }
        return Promise.resolve({ usage: 'N/A', quota: 'N/A', percent: 'N/A' });
    }
};

// 自动初始化
Storage.init().catch(err => console.error('Storage 初始化失败:', err));
