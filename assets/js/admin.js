// 后台管理 JavaScript - 优化版

let currentEditId = null;
let currentPage = 1;
const itemsPerPage = 10;
let recentActivities = [];

// 产品类型映射
function getProductTypeName(productType) {
    if (!productType) return '-';
    return productType;
}

// 从 localStorage 读取或初始化类别和产品类型
function getStoredCategories() {
    const categories = localStorage.getItem('productCategories');
    if (categories) {
        const parsed = JSON.parse(categories);
        // 兼容旧数据格式
        return Array.isArray(parsed) ? parsed : parsed.items || [];
    }
    return ['车用电子', '车用内饰', '车用清洗', '手持风扇', '桌面风扇'];
}

// 获取所有产品类型（带类别关联）
function getStoredProductTypesMap() {
    const typesMap = localStorage.getItem('productTypesMap');
    if (typesMap) {
        return JSON.parse(typesMap);
    }
    // 默认数据结构：每个类别对应一组类型
    return {
        '车用电子': ['车载充气泵', '车载吸尘器', '一体机电源', '纯应急电源'],
        '车用内饰': ['车用坐垫', '挂腰风扇', '桌面风扇'],
        '车用清洗': ['车用玻璃水', '清洁产品', '洗车水枪'],
        '手持风扇': ['手持风扇'],
        '桌面风扇': ['桌面风扇']
    };
}

// 保存产品类型映射
function saveProductTypesMap(typesMap) {
    localStorage.setItem('productTypesMap', JSON.stringify(typesMap));
}

// 获取指定类别的产品类型
function getProductTypesByCategory(category) {
    const typesMap = getStoredProductTypesMap();
    return typesMap[category] || [];
}

// 获取所有唯一的类型名称（用于兼容旧代码）
function getStoredProductTypes() {
    const typesMap = getStoredProductTypesMap();
    const allTypes = new Set();
    Object.values(typesMap).forEach(types => {
        types.forEach(type => allTypes.add(type));
    });
    return Array.from(allTypes);
}

function saveCategories(categories) {
    localStorage.setItem('productCategories', JSON.stringify(categories));
}

function saveProductTypes(types) {
    localStorage.setItem('productTypes', JSON.stringify(types));
}

// 更新产品类别下拉框（支持级联）
function updateProductCategorySelect() {
    const categorySelect = document.getElementById('product-category');
    if (!categorySelect) return;

    const categories = getStoredCategories();
    const currentValue = categorySelect.value;

    categorySelect.innerHTML = '<option value="">请选择产品类别</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    if (currentValue && categories.includes(currentValue)) {
        categorySelect.value = currentValue;
    }

    // 触发产品类型的联动更新
    updateProductTypeSelectByCategory();
}

// 根据类别更新产品类型下拉框（级联）
function updateProductTypeSelectByCategory() {
    const categorySelect = document.getElementById('product-category');
    const typeSelect = document.getElementById('product-type');
    if (!categorySelect || !typeSelect) return;

    const selectedCategory = categorySelect.value;
    const types = getProductTypesByCategory(selectedCategory);
    const currentValue = typeSelect.value;

    typeSelect.innerHTML = '<option value="">请选择产品类型</option>' +
        types.map(type => `<option value="${type}">${type}</option>`).join('');

    // 如果当前值不在新的类型列表中，清空
    if (currentValue && types.includes(currentValue)) {
        typeSelect.value = currentValue;
    } else {
        typeSelect.value = '';
    }
}

// 更新产品类型下拉框（兼容旧代码）
function updateProductTypeSelect() {
    updateProductTypeSelectByCategory();
}

// 添加产品类别
window.addCategoryOption = function() {
    openCategoryManager('category');
};

// 删除产品类别
window.deleteCategoryOption = function() {
    const categorySelect = document.getElementById('product-category');
    if (!categorySelect || !categorySelect.value) {
        alert('请先选择要删除的类别！');
        return;
    }

    if (confirm('确定要删除类别 "' + categorySelect.value + '" 吗？')) {
        const categories = getStoredCategories();
        const index = categories.indexOf(categorySelect.value);
        if (index !== -1) {
            categories.splice(index, 1);
            saveCategories(categories);
            updateProductCategorySelect();
        }
    }
};

// 添加产品类型
window.addProductTypeOption = function() {
    openCategoryManager('type');
};

// 删除产品类型
window.deleteProductTypeOption = function() {
    const typeSelect = document.getElementById('product-type');
    if (!typeSelect || !typeSelect.value) {
        alert('请先选择要删除的类型！');
        return;
    }

    if (confirm('确定要删除类型 "' + typeSelect.value + '" 吗？')) {
        const types = getStoredProductTypes();
        const index = types.indexOf(typeSelect.value);
        if (index !== -1) {
            types.splice(index, 1);
            saveProductTypes(types);
            updateProductTypeSelect();
        }
    }
};

// 打开类别/类型管理模态框
function openCategoryManager(type) {
    const modal = document.getElementById('category-manager-modal');
    const title = document.getElementById('category-manager-title');
    const list = document.getElementById('category-manager-list');
    const actions = document.querySelector('.category-manager-actions');
    const addBtn = document.querySelector('.category-manager-actions button');
    const hint = document.querySelector('.category-manager-hint');

    if (type === 'category') {
        title.innerHTML = '<i class="fas fa-th-list"></i> 产品类别管理';
        window.currentCategoryManagerType = 'category';
        window.currentCategoryManagerCategory = null;
        // 类别管理模式下，显示添加按钮
        if (actions) actions.style.display = 'block';
        if (addBtn) addBtn.innerHTML = '<i class="fas fa-plus"></i> 添加新类别';
        if (hint) {
            hint.style.display = 'block';
            hint.innerHTML = '<i class="fas fa-info-circle"></i> 提示：拖拽 <i class="fas fa-grip-vertical"></i> 图标可调整顺序';
        }
    } else {
        title.innerHTML = '<i class="fas fa-tags"></i> 产品类型管理';
        window.currentCategoryManagerType = 'type';
        window.currentCategoryManagerCategory = null;
        // 类型管理模式下，先选择类别
        if (actions) actions.style.display = 'none';
        if (hint) hint.style.display = 'none';
        showCategorySelectorForTypes();
        return;
    }

    renderCategoryManagerList();
    modal.classList.add('show');
}

// 显示类别选择器（用于选择要管理哪个类别的类型）
function showCategorySelectorForTypes() {
    const list = document.getElementById('category-manager-list');
    const categories = getStoredCategories();

    list.innerHTML = `
        <div class="category-selector-hint">
            <p><i class="fas fa-info-circle"></i> 产品类型需要关联到具体的类别，请先选择要管理的类别：</p>
        </div>
        <div class="category-select-list">
            ${categories.map(cat => `
                <div class="category-select-item" onclick="selectCategoryForTypes('${cat}')">
                    <span>${cat}</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `).join('')}
        </div>
    `;

    const modal = document.getElementById('category-manager-modal');
    modal.classList.add('show');
}

// 选择类别后管理对应的产品类型
window.selectCategoryForTypes = function(category) {
    window.currentCategoryManagerCategory = category;
    renderCategoryManagerList();

    // 显示添加按钮和提示
    const actions = document.querySelector('.category-manager-actions');
    const hint = document.querySelector('.category-manager-hint');
    const addBtn = document.querySelector('.category-manager-actions button');

    if (actions) actions.style.display = 'block';
    if (hint) {
        hint.style.display = 'block';
        hint.innerHTML = '<i class="fas fa-info-circle"></i> 提示：拖拽 <i class="fas fa-grip-vertical"></i> 图标可调整顺序';
    }
    if (addBtn) addBtn.innerHTML = '<i class="fas fa-plus"></i> 添加新类型';
};

// 渲染类别管理列表
function renderCategoryManagerList() {
    const list = document.getElementById('category-manager-list');
    const type = window.currentCategoryManagerType;

    if (type === 'category') {
        // 类别管理列表
        const categories = getStoredCategories();
        if (categories.length === 0) {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>暂无数据，请添加</p></div>';
            return;
        }

        list.innerHTML = categories.map((item, index) => `
            <div class="category-manager-item" draggable="true" data-index="${index}" data-value="${item}">
                <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
                <span class="item-name">${item}</span>
                <button class="btn-delete-sm" onclick="deleteCategoryItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // 绑定拖拽事件
        setupDragAndDrop();
    } else {
        // 产品类型管理列表
        const category = window.currentCategoryManagerCategory;
        if (!category) {
            showCategorySelectorForTypes();
            return;
        }

        const typesMap = getStoredProductTypesMap();
        let types = typesMap[category] || [];

        if (types.length === 0) {
            list.innerHTML = `
                <div class="empty-state"><i class="fas fa-inbox"></i><p>"${category}" 类别下暂无产品类型，请添加</p></div>
            `;
        } else {
            list.innerHTML = types.map((item, index) => `
                <div class="category-manager-item" draggable="true" data-index="${index}" data-value="${item}">
                    <span class="drag-handle"><i class="fas fa-grip-vertical"></i></span>
                    <span class="item-name">${item}</span>
                    <button class="btn-delete-sm" onclick="deleteTypeItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');

            // 绑定拖拽事件
            setupDragAndDropForTypes();
        }
    }

    // 更新添加按钮文字
    const addBtn = document.querySelector('.category-manager-actions button');
    if (addBtn) {
        if (type === 'category') {
            addBtn.innerHTML = '<i class="fas fa-plus"></i> 添加新类别';
        } else {
            addBtn.innerHTML = '<i class="fas fa-plus"></i> 添加新类型';
        }
    }
}

// 设置拖拽功能（类别管理）
function setupDragAndDrop() {
    const items = document.querySelectorAll('.category-manager-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });

        item.addEventListener('dragend', function(e) {
            setTimeout(() => {
                this.style.opacity = '1';
                draggedItem = null;
            }, 0);
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (draggedItem !== this) {
                const rect = this.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    this.insertBefore(draggedItem, this);
                } else {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                }
            }
        });

        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem && draggedItem !== this) {
                const rect = this.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    this.insertBefore(draggedItem, this);
                } else {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                }
                // 保存新顺序
                saveNewOrder();
            }
        });
    });
}

// 设置拖拽功能（产品类型管理）
function setupDragAndDropForTypes() {
    const items = document.querySelectorAll('.category-manager-item');
    let draggedItem = null;

    items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
        });

        item.addEventListener('dragend', function(e) {
            setTimeout(() => {
                this.style.opacity = '1';
                draggedItem = null;
            }, 0);
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (draggedItem !== this) {
                const rect = this.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    this.insertBefore(draggedItem, this);
                } else {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                }
            }
        });

        item.addEventListener('drop', function(e) {
            e.preventDefault();
            if (draggedItem && draggedItem !== this) {
                const rect = this.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (e.clientY < midY) {
                    this.insertBefore(draggedItem, this);
                } else {
                    this.parentNode.insertBefore(draggedItem, this.nextSibling);
                }
                // 保存新顺序
                saveNewOrderForTypes();
            }
        });
    });
}

// 保存新顺序（类别管理）
function saveNewOrder() {
    const items = document.querySelectorAll('.category-manager-item');
    const newOrder = Array.from(items).map(item => item.dataset.value);
    const type = window.currentCategoryManagerType;

    if (type === 'category') {
        saveCategories(newOrder);
    }

    // 同时更新产品编辑模态框中的下拉框
    if (type === 'category') {
        updateProductCategorySelect();
    }
}

// 保存新顺序（产品类型管理）
function saveNewOrderForTypes() {
    const items = document.querySelectorAll('.category-manager-item');
    const newOrder = Array.from(items).map(item => item.dataset.value);
    const category = window.currentCategoryManagerCategory;

    const typesMap = getStoredProductTypesMap();
    typesMap[category] = newOrder;
    saveProductTypesMap(typesMap);

    // 同时更新产品编辑模态框中的下拉框
    updateProductTypeSelectByCategory();
}

// 删除类别项
window.deleteCategoryItem = function(index) {
    const type = window.currentCategoryManagerType;
    if (type === 'category') {
        const categories = getStoredCategories();
        if (confirm('确定要删除 "' + categories[index] + '" 吗？')) {
            categories.splice(index, 1);
            saveCategories(categories);
            renderCategoryManagerList();
            updateProductCategorySelect();
        }
    }
};

// 删除类型项
window.deleteTypeItem = function(index) {
    const category = window.currentCategoryManagerCategory;
    if (!category) return;

    const typesMap = getStoredProductTypesMap();
    const types = typesMap[category] || [];

    if (confirm('确定要删除 "' + types[index] + '" 吗？')) {
        types.splice(index, 1);
        typesMap[category] = types;
        saveProductTypesMap(typesMap);
        renderCategoryManagerList();
        updateProductTypeSelectByCategory();
    }
};

// 添加新类别项
window.addNewCategoryItem = function() {
    const type = window.currentCategoryManagerType;

    if (type === 'category') {
        // 添加新类别
        const name = prompt('请输入新类别名称：');
        if (!name || !name.trim()) return;

        const categories = getStoredCategories();
        if (categories.includes(name.trim())) {
            showToast('该类别已存在！', 'warning');
            return;
        }

        categories.push(name.trim());
        saveCategories(categories);

        // 为新类别初始化空的产品类型数组
        const typesMap = getStoredProductTypesMap();
        if (!typesMap[name.trim()]) {
            typesMap[name.trim()] = [];
            saveProductTypesMap(typesMap);
        }

        renderCategoryManagerList();
        updateProductCategorySelect();
    } else {
        // 添加新产品类型
        const category = window.currentCategoryManagerCategory;
        if (!category) {
            showToast('请先选择类别', 'warning');
            return;
        }

        const name = prompt('请输入新类型名称：');
        if (!name || !name.trim()) return;

        const typesMap = getStoredProductTypesMap();
        const types = typesMap[category] || [];

        if (types.includes(name.trim())) {
            showToast('该类型已存在！', 'warning');
            return;
        }

        types.push(name.trim());
        typesMap[category] = types;
        saveProductTypesMap(typesMap);

        renderCategoryManagerList();
        updateProductTypeSelectByCategory();
    }
};

// ==================== 初始化和认证 ====================

// 检查登录状态
function checkAuth() {
    // 添加 loaded 类，移除初始隐藏状态
    document.body.classList.add('loaded');

    if (API.auth.isLoggedIn()) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';

        // 恢复上次访问的标签页
        const lastTab = localStorage.getItem('lastActiveTab') || 'dashboard';
        switchTab(lastTab);

        initTheme();
        loadRecentActivities();
    } else {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    }
}

// 登录表单
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    const btn = document.querySelector('.btn-login');
    btn.classList.add('loading');

    // 模拟登录延迟效果
    setTimeout(() => {
        if (API.auth.login(username, password)) {
            if (rememberMe) {
                localStorage.setItem('rememberedUser', username);
            } else {
                localStorage.removeItem('rememberedUser');
            }
            addActivity('登录系统', 'success');
            checkAuth();
        } else {
            showToast('用户名或密码错误！', 'error');
            btn.classList.remove('loading');
        }
    }, 800);
});

// 退出登录
document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('确定要退出登录吗？')) {
        API.auth.logout();
        addActivity('退出登录', 'info');
        checkAuth();
    }
});

// 记住我功能
function initRememberMe() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('remember-me').checked = true;
    }
}

// ==================== 主题切换 ====================

function initTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('#theme-toggle i').className = 'fas fa-sun';
    }

    document.getElementById('theme-toggle').addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        this.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    });

    document.getElementById('dark-mode-toggle').addEventListener('change', function() {
        document.body.classList.toggle('dark-mode', this.checked);
        localStorage.setItem('darkMode', this.checked);
        document.querySelector('#theme-toggle i').className = this.checked ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// ==================== 移动端菜单 ====================

document.getElementById('mobile-menu-toggle').addEventListener('click', function() {
    document.querySelector('.sidebar').classList.toggle('open');
});

// ==================== 标签页切换 ====================

function switchTab(tabName) {
    // 更新侧边栏激活状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });

    // 隐藏所有内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 显示目标内容
    document.getElementById('tab-' + tabName).classList.add('active');

    // 更新页面标题
    const titles = {
        'dashboard': '控制台',
        'brand': '品牌管理',
        'products': '产品管理',
        'contact': '联系信息管理',
        'messages': '留言管理',
        'timeline': '发展历程管理',
        'manuals': '产品说明书管理',
        'settings': '系统设置'
    };
    document.getElementById('page-title').textContent = titles[tabName] || '控制台';

    // 加载对应数据
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'brand':
            loadBrand();
            break;
        case 'products':
            loadProductsTable();
            break;
        case 'contact':
            loadContact();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'timeline':
            loadTimelineTable();
            break;
        case 'settings':
            loadSettings();
            break;
    }

    // 移动端关闭侧边栏
    document.querySelector('.sidebar').classList.remove('open');

    // 保存当前标签页到 localStorage
    localStorage.setItem('lastActiveTab', tabName);
}

// 侧边栏导航事件
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab(this.dataset.tab);
    });
});

// ==================== 控制台功能 ====================

function loadDashboard() {
    const products = API.products.getAll();
    const categories = API.products.getCategories();
    const timeline = API.timeline.getAll();
    const brand = API.brand.get();

    // 动画数字增长
    animateNumber('dash-product-count', products.length);
    animateNumber('dash-category-count', categories.length);
    animateNumber('dash-timeline-count', timeline.length);
    animateNumber('dash-customers-count', brand.stats.customers);
}

function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    const duration = 1000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ==================== 品牌管理 ====================

function loadBrand() {
    const brand = API.brand.get();
    document.getElementById('brand-description').value = brand.description;
    document.getElementById('stat-years').value = brand.stats.years;
    document.getElementById('stat-products').value = brand.stats.products;
    document.getElementById('stat-customers').value = brand.stats.customers;
}

document.getElementById('brand-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const brandData = {
        description: document.getElementById('brand-description').value,
        stats: {
            years: parseInt(document.getElementById('stat-years').value) || 0,
            products: parseInt(document.getElementById('stat-products').value) || 0,
            customers: parseInt(document.getElementById('stat-customers').value) || 0
        }
    };

    await API.brand.save(brandData);
    showToast('品牌信息已保存！', 'success');
    addActivity('更新品牌信息', 'success');
});

// ==================== 联系信息管理 ====================

function loadContact() {
    const contact = API.contact.get();
    document.getElementById('contact-address').value = contact.address;
    document.getElementById('contact-phone').value = contact.phone;
    document.getElementById('contact-email').value = contact.email;
}

document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const contactData = {
        address: document.getElementById('contact-address').value,
        phone: document.getElementById('contact-phone').value,
        email: document.getElementById('contact-email').value
    };

    await API.contact.save(contactData);
    showToast('联系信息已保存！', 'success');
    addActivity('更新联系信息', 'success');
});

// ==================== 产品管理 ====================

let selectedProducts = [];
let currentBrandFilter = 'all'; // 品牌筛选：all, cafele, bacashi

// 品牌筛选函数
window.filterByBrand = function(brand) {
    currentBrandFilter = brand;

    // 更新按钮状态
    document.querySelectorAll('.brand-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.brand === brand) {
            btn.classList.add('active');
        }
    });

    currentPage = 1;
    loadProductsTable();
};

function loadProductsTable() {
    // 根据品牌筛选加载产品
    let cafeleProducts = API.products.getAll();
    let bacashiProducts = API.bacashi.products.getAll();

    // 给每个产品添加 brand 标记
    cafeleProducts = cafeleProducts.map(p => ({ ...p, brand: 'cafele' }));
    bacashiProducts = bacashiProducts.map(p => ({ ...p, brand: 'bacashi' }));

    let products = [];
    if (currentBrandFilter === 'all') {
        products = [...cafeleProducts, ...bacashiProducts];
    } else if (currentBrandFilter === 'cafele') {
        products = cafeleProducts;
    } else if (currentBrandFilter === 'bacashi') {
        products = bacashiProducts;
    }

    // 应用搜索
    const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';

    if (searchTerm) {
        products = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    // 分页
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

    const container = document.getElementById('products-table');

    if (paginatedProducts.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>暂无产品数据</p></div>';
        document.getElementById('products-pagination').innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="table-header">
            <span class="checkbox-cell"><input type="checkbox" id="select-all" onchange="toggleSelectAll()"></span>
            <span>ID</span>
            <span class="header-name">
                产品名称
                <select id="header-filter-name" class="header-filter" onchange="filterByNameSelect(this.value)">
                    <option value="">全部</option>
                </select>
            </span>
            <span class="header-brand">
                品牌
                <select id="header-filter-brand" class="header-filter" onchange="filterByBrandSelect(this.value)">
                    <option value="">全部</option>
                    <option value="cafele">CAFELE</option>
                    <option value="bacashi">BACASHI</option>
                </select>
            </span>
            <span class="header-category">
                类别
                <select id="header-filter-category" class="header-filter" onchange="filterByCategorySelect(this.value)">
                    <option value="">全部</option>
                </select>
            </span>
            <span class="header-type">
                产品类型
                <select id="header-filter-type" class="header-filter" onchange="filterByProductTypeSelect(this.value)">
                    <option value="">全部</option>
                </select>
            </span>
            <span class="table-actions-header">操作</span>
        </div>
    ` + paginatedProducts.sort((a, b) => a.sort - b.sort).map(product => `
        <div class="table-row ${selectedProducts.includes(product.id) ? 'selected' : ''}" data-id="${product.id}">
            <span class="checkbox-cell"><input type="checkbox" class="product-checkbox" value="${product.id}" onchange="toggleProductSelection(${product.id})"></span>
            <span>${product.id}</span>
            <span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${product.image ? `<img src="${normalizeImagePath(product.image)}" class="table-image" alt="${product.name}">` : ''}
                    <span>${product.name}</span>
                </div>
            </span>
            <span><span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${product.brand === 'bacashi' ? '#fef3c7' : '#dbeafe'}; color: ${product.brand === 'bacashi' ? '#92400e' : '#1e3a8a'};">${product.brand === 'bacashi' ? 'BACASHI' : 'CAFELE'}</span></span>
            <span>${product.category}</span>
            <span class="product-type">${getProductTypeName(product.productType)}</span>
            <span class="table-actions">
                <button class="btn btn-primary btn-sm" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </span>
        </div>
    `).join('');

    // 更新分页
    updatePagination(products.length, totalPages);

    // 更新批量删除按钮状态
    updateBatchDeleteButton();

    // 更新表头筛选下拉框
    updateHeaderFilters();
}

function updatePagination(totalItems, totalPages) {
    const pagination = document.getElementById('products-pagination');
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

    // 计算页码显示范围（最多显示 5 个页码按钮）
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // 如果 endPage 到达最后一页，重新计算 startPage 以保持最多 5 个按钮
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    let pageNumbers = '';
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    pagination.innerHTML = `
        <span class="table-info">显示 ${startIndex}-${endIndex} 条，共 ${totalItems} 条</span>
        <div class="pagination">
            ${currentPage > 1 ? `<button onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>` : ''}
            ${pageNumbers}
            ${currentPage < totalPages ? `<button onclick="changePage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>` : ''}
        </div>
    `;
}

function changePage(page) {
    currentPage = page;
    loadProductsTable();
}

function messageChangePage(page) {
    messageCurrentPage = page;
    loadMessages();
}

function generatePagination(current, total, prefix) {
    const startIndex = (current - 1) * (prefix === 'message' ? messagesPerPage : itemsPerPage) + 1;
    const endIndex = Math.min(current * (prefix === 'message' ? messagesPerPage : itemsPerPage), total * (prefix === 'message' ? messagesPerPage : itemsPerPage) / (prefix === 'message' ? messagesPerPage : itemsPerPage) * (prefix === 'message' ? messagesPerPage : itemsPerPage));

    let html = `<span class="table-info">显示 ${startIndex}-${Math.min(current * (prefix === 'message' ? messagesPerPage : itemsPerPage), total * (prefix === 'message' ? messagesPerPage : itemsPerPage))} 条，共 ${total} 条</span>`;
    html += `<div class="pagination">`;

    if (current > 1) {
        html += `<button onclick="${prefix}ChangePage(${current - 1})"><i class="fas fa-chevron-left"></i></button>`;
    }

    const maxButtons = 5;
    let startPage = Math.max(1, current - Math.floor(maxButtons / 2));
    let endPage = Math.min(total, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === current ? 'active' : ''}" onclick="${prefix}ChangePage(${i})">${i}</button>`;
    }

    if (current < total) {
        html += `<button onclick="${prefix}ChangePage(${current + 1})"><i class="fas fa-chevron-right"></i></button>`;
    }

    html += `</div>`;
    return html;
}

function toggleSelectAll() {
    const selectAll = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.product-checkbox');

    if (selectAll.checked) {
        checkboxes.forEach(cb => {
            cb.checked = true;
            selectedProducts.push(parseInt(cb.value));
        });
    } else {
        checkboxes.forEach(cb => {
            cb.checked = false;
            selectedProducts = [];
        });
    }
    updateBatchDeleteButton();
}

function toggleProductSelection(id) {
    const index = selectedProducts.indexOf(id);
    if (index === -1) {
        selectedProducts.push(id);
    } else {
        selectedProducts.splice(index, 1);
    }

    // 更新行样式
    const row = document.querySelector(`.table-row[data-id="${id}"]`);
    if (row) {
        row.classList.toggle('selected');
    }

    updateBatchDeleteButton();
}

function updateBatchDeleteButton() {
    const btn = document.getElementById('batch-delete-btn');
    if (selectedProducts.length > 0) {
        btn.style.display = 'inline-flex';
        btn.querySelector('span').textContent = `批量删除 (${selectedProducts})`;
    } else {
        btn.style.display = 'none';
    }
}

// 添加产品按钮
document.getElementById('add-product-btn').addEventListener('click', function() {
    openProductModal();
});

// 批量删除按钮
document.getElementById('batch-delete-btn').addEventListener('click', async function() {
    if (selectedProducts.length === 0) {
        showToast('请先选择要删除的产品', 'warning');
        return;
    }

    if (confirm(`确定要删除选中的 ${selectedProducts.length} 个产品吗？`)) {
        const count = selectedProducts.length;
        for (const id of selectedProducts) {
            // 尝试从两个品牌中删除
            let cafeleProducts = API.products.getAll();
            if (cafeleProducts.find(p => p.id === id)) {
                await API.products.delete(id);
            } else {
                let bacashiProducts = API.bacashi.products.getAll();
                if (bacashiProducts.find(p => p.id === id)) {
                    await API.bacashi.products.delete(id);
                }
            }
        }
        selectedProducts = [];
        loadProductsTable();
        showToast('批量删除成功！', 'success');
        addActivity(`批量删除 ${count} 个产品`, 'warning');
    }
});

// 搜索和筛选
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('product-search')) {
        document.getElementById('product-search').addEventListener('input', debounce(loadProductsTable, 300));
    }
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 打开产品模态框
function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');

    // 先更新下拉框选项
    updateProductCategorySelect();

    if (product) {
        currentEditId = product.id;
        document.getElementById('modal-title').textContent = '编辑产品';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-brand').value = product.brand || 'cafele';
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-image').value = product.image || '';
        document.getElementById('product-sort').value = product.sort;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-manual-content').innerHTML = product.details || '';
        document.getElementById('product-video').value = product.video || '';
        // 先设置类别值，然后联动更新产品类型
        document.getElementById('product-category').value = product.category;
        updateProductTypeSelectByCategory(); // 先根据类别更新类型选项
        setTimeout(() => {
            document.getElementById('product-type').value = product.productType || '';
        }, 0);
        updateImagePreview(product.image);
        updateProductVideoPreview(product.video || '');
    } else {
        currentEditId = null;
        document.getElementById('modal-title').textContent = '添加产品';
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-sort').value = '1';
        document.getElementById('product-manual-content').innerHTML = '';
        document.getElementById('product-video').value = '';
        document.getElementById('product-brand').value = 'cafele';
        updateImagePreview(null);
        updateProductVideoPreview('');
        // 重新设置下拉框值（因为 reset() 会清空）
        document.getElementById('product-category').value = '';
        document.getElementById('product-type').value = '';
    }

    modal.classList.add('show');
}

// 图片预览
function updateImagePreview(url) {
    const preview = document.getElementById('image-preview');
    const normalizedUrl = normalizeImagePath(url);
    if (url && (normalizedUrl.startsWith('http') || normalizedUrl.startsWith('data:'))) {
        preview.innerHTML = `<img src="${normalizedUrl}" alt="预览">`;
        preview.classList.add('has-image');
    } else {
        preview.innerHTML = '<i class="fas fa-image"></i><span>暂无图片</span>';
        preview.classList.remove('has-image');
    }
}

// 图片上传到 COS
document.getElementById('product-image-upload')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        // 检查 COS 配置
        const cosConfig = API.cos.getConfig();
        if (!cosConfig.bucket || !cosConfig.secretId || !cosConfig.secretKey) {
            showToast('请先配置腾讯云 COS 参数', 'warning');
            showCosConfigModal();
            return;
        }

        // 显示上传中状态
        const uploadBtn = document.getElementById('product-image-upload');
        const originalText = uploadBtn.textContent;
        uploadBtn.textContent = '上传中...';
        uploadBtn.disabled = true;

        try {
            const imageUrl = await API.cos.upload(file);
            document.getElementById('product-image').value = imageUrl;
            updateImagePreview(imageUrl);
            showToast('图片上传成功', 'success');
        } catch (err) {
            showToast('上传失败：' + err.message, 'error');
        } finally {
            uploadBtn.textContent = originalText;
            uploadBtn.disabled = false;
        }
    }
});

document.getElementById('product-image')?.addEventListener('input', function() {
    updateImagePreview(this.value);
});

// 编辑产品
function editProduct(id) {
    // 先在 CAFELE 产品中查找
    let products = API.products.getAll();
    let product = products.find(p => p.id === id);
    let brand = 'cafele';

    // 如果没找到，再在 BACASHI 产品中查找
    if (!product) {
        products = API.bacashi.products.getAll();
        product = products.find(p => p.id === id);
        brand = 'bacashi';
    }

    if (product) {
        // 设置品牌选择器的值
        setTimeout(() => {
            document.getElementById('product-brand').value = brand;
        }, 0);
        openProductModal(product);
    }
}

// 删除产品
async function deleteProduct(id) {
    if (confirm('确定要删除这个产品吗？')) {
        // 尝试从两个品牌中删除
        let deleted = false;

        // 先尝试从 CAFELE 删除
        let products = API.products.getAll();
        if (products.find(p => p.id === id)) {
            await API.products.delete(id);
            deleted = true;
            await renumberProducts('cafele');
        }

        // 如果没有，尝试从 BACASHI 删除
        if (!deleted) {
            products = API.bacashi.products.getAll();
            if (products.find(p => p.id === id)) {
                await API.bacashi.products.delete(id);
                deleted = true;
                await renumberProducts('bacashi');
            }
        }

        if (deleted) {
            showToast('产品已删除', 'success');
            addActivity('删除产品 ID:' + id, 'warning');
        } else {
            showToast('未找到产品', 'error');
        }

        loadProductsTable();
    }
}

// 更新产品排序
async function updateProductSort(id, value) {
    const products = API.products.getAll();
    const product = products.find(p => p.id === id);
    if (product) {
        product.sort = parseInt(value) || 0;
        await API.products.update(id, product);
        showToast('排序已更新', 'success');
        await renumberProducts();
    }
}

// 改变排序（上下移动）
window.changeSort = async function(id, delta) {
    console.log('changeSort called with id:', id, 'delta:', delta);

    const products = API.products.getAll();
    products.sort((a, b) => a.sort - b.sort);
    const index = products.findIndex(p => p.id == id);

    if (index === -1) {
        console.log('Product not found');
        showToast('未找到产品', 'error');
        return;
    }

    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= products.length) {
        showToast('已到达边界', 'info');
        return;
    }

    // 交换排序值
    const temp = products[index].sort;
    products[index].sort = products[newIndex].sort;
    products[newIndex].sort = temp;

    console.log('Swapping:', products[index].name, '<->', products[newIndex].name);

    await API.products.update(products[index].id, products[index]);
    await API.products.update(products[newIndex].id, products[newIndex]);

    showToast('排序已更新', 'success');
    loadProductsTable();
};

// 重新排序产品（自动连续排序）
async function renumberProducts(brand = 'all') {
    if (brand === 'all') {
        // 分别对每个品牌排序
        let cafeleProducts = API.products.getAll();
        cafeleProducts.sort((a, b) => a.sort - b.sort);
        for (const product of cafeleProducts) {
            product.sort = cafeleProducts.indexOf(product) + 1;
            await API.products.update(product.id, product);
        }

        let bacashiProducts = API.bacashi.products.getAll();
        bacashiProducts.sort((a, b) => a.sort - b.sort);
        for (const product of bacashiProducts) {
            product.sort = bacashiProducts.indexOf(product) + 1;
            await API.bacashi.products.update(product.id, product);
        }
    } else if (brand === 'bacashi') {
        let products = API.bacashi.products.getAll();
        products.sort((a, b) => a.sort - b.sort);
        for (const product of products) {
            product.sort = products.indexOf(product) + 1;
            await API.bacashi.products.update(product.id, product);
        }
    } else {
        let products = API.products.getAll();
        products.sort((a, b) => a.sort - b.sort);
        for (const product of products) {
            product.sort = products.indexOf(product) + 1;
            await API.products.update(product.id, product);
        }
    }
    loadProductsTable();
}

// 保存产品
document.getElementById('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    // 验证必填字段
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const brand = document.getElementById('product-brand').value;

    if (!name) {
        showToast('请输入产品名称', 'warning');
        return;
    }
    if (!category) {
        showToast('请选择产品类别', 'warning');
        return;
    }

    const id = document.getElementById('product-id').value;

    // 如果是新增产品，自动设置排序值为最大排序 +1
    let sortValue = parseInt(document.getElementById('product-sort').value) || 1;
    if (!id) {
        const products = brand === 'bacashi' ? API.bacashi.products.getAll() : API.products.getAll();
        const maxSort = products.length > 0 ? Math.max(...products.map(p => p.sort)) : 0;
        sortValue = maxSort + 1;
    }

    const productData = {
        id: id ? parseInt(id) : undefined,
        brand: brand,
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        productType: document.getElementById('product-type').value,
        image: document.getElementById('product-image').value || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"%3E%3Crect fill="%23f0f0f0" width="600" height="400"/%3E%3Ctext fill="%23999" font-family="Arial" font-size="24" text-anchor="middle" x="300" y="200"%3E无图片%3C/text%3E%3C/svg%3E',
        sort: sortValue,
        description: document.getElementById('product-description').value,
        details: document.getElementById('product-manual-content').innerHTML,
        video: document.getElementById('product-video').value || ''
    };

    if (id) {
        // 编辑产品 - 如果品牌改变了需要移动数据存储
        const oldProducts = brand === 'bacashi' ? API.products.getAll() : API.bacashi.products.getAll();
        const oldProduct = oldProducts.find(p => p.id == id);

        if (oldProduct) {
            // 先从旧品牌删除
            if (brand === 'bacashi') {
                await API.products.delete(parseInt(id));
            } else {
                await API.bacashi.products.delete(parseInt(id));
            }
        }

        // 保存到对应品牌
        if (brand === 'bacashi') {
            await API.bacashi.products.add(productData);
        } else {
            await API.products.update(parseInt(id), productData);
        }

        // Supabase 同步已在 saveData 中自动完成
        console.log('产品已保存到 Supabase');

        // 同时备份到腾讯云 COS（双云端存储）
        API.forceSyncData().catch(err => console.log('COS 备份失败，数据已保存到 Supabase'));

        showToast('产品已更新！', 'success');
        addActivity('更新产品：' + productData.name + ' (' + (brand === 'bacashi' ? 'BACASHI' : 'CAFELE') + ')', 'success');
    } else {
        // 添加新产品
        if (brand === 'bacashi') {
            await API.bacashi.products.add(productData);
        } else {
            await API.products.add(productData);
        }
        // Supabase 同步已在 saveData 中自动完成
        console.log('产品已保存到 Supabase');

        // 同时备份到腾讯云 COS（双云端存储）
        API.forceSyncData().catch(err => console.log('COS 备份失败，数据已保存到 Supabase'));

        showToast('产品已添加！', 'success');
        addActivity('添加产品：' + productData.name + ' (' + (brand === 'bacashi' ? 'BACASHI' : 'CAFELE') + ')', 'success');
    }

    document.getElementById('product-modal').classList.remove('show');
    loadProductsTable();
});

// 产品说明书格式化
function formatProductManual(command, value = null) {
    document.execCommand(command, false, value);
}

// 产品说明书插入图片
function insertProductManualImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64 = event.target.result;
                document.execCommand('insertImage', false, base64);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// 产品视频预览
function updateProductVideoPreview(url) {
    const preview = document.getElementById('product-video-preview');
    if (url && url.startsWith('http')) {
        if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
            preview.innerHTML = `<video src="${url}" controls style="max-width: 100%; height: auto; max-height: 300px;"></video>`;
        } else {
            preview.innerHTML = `<p style="color: #666;"><i class="fas fa-link"></i> 视频链接已输入</p>`;
        }
    } else {
        preview.innerHTML = '<i class="fas fa-video"></i><span>暂无视频</span>';
    }
}

// 产品视频 URL 输入
document.getElementById('product-video')?.addEventListener('input', function() {
    updateProductVideoPreview(this.value);
});

// ==================== 时间轴管理 ====================
// 格式化说明书文本（产品编辑模态框中）
function formatManualText(command, value = null) {
    document.execCommand(command, false, value);
}

// 插入图片到说明书（产品编辑模态框中）
function insertManualImage() {
    // 创建隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64 = event.target.result;
                document.execCommand('insertImage', false, base64);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

// ==================== 时间轴管理 ====================

function loadTimelineTable() {
    const timeline = API.timeline.getAll();
    const container = document.getElementById('timeline-table');

    if (timeline.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-history"></i><p>暂无时间轴数据</p></div>';
        return;
    }

    container.innerHTML = timeline.sort((a, b) => parseInt(b.year) - parseInt(a.year)).map(item => `
        <div class="timeline-item">
            <div class="timeline-year">${item.year}</div>
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <h4 class="timeline-title">${item.title}</h4>
                <p class="timeline-description">${item.description || ''}</p>
            </div>
            <div class="timeline-actions">
                <button class="btn btn-primary btn-sm" onclick="editTimeline(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteTimeline(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 添加时间轴按钮
document.getElementById('add-timeline-btn').addEventListener('click', function() {
    openTimelineModal();
});

// 打开时间轴模态框
function openTimelineModal(item = null) {
    const modal = document.getElementById('timeline-modal');
    const form = document.getElementById('timeline-form');

    if (item) {
        document.getElementById('timeline-modal-title').textContent = '编辑事件';
        document.getElementById('timeline-id').value = item.id;
        document.getElementById('timeline-year').value = item.year;
        document.getElementById('timeline-title').value = item.title;
        document.getElementById('timeline-description').value = item.description;
    } else {
        document.getElementById('timeline-modal-title').textContent = '添加事件';
        form.reset();
        document.getElementById('timeline-id').value = '';
    }

    modal.classList.add('show');
}

// 编辑时间轴
function editTimeline(id) {
    const timeline = API.timeline.getAll();
    const item = timeline.find(t => t.id === id);
    if (item) {
        openTimelineModal(item);
    }
}

// 删除时间轴
async function deleteTimeline(id) {
    if (confirm('确定要删除这个事件吗？')) {
        await API.timeline.delete(id);
        loadTimelineTable();
        showToast('事件已删除', 'success');
        addActivity('删除时间轴事件 ID:' + id, 'warning');
    }
}

// 保存时间轴
document.getElementById('timeline-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('timeline-id').value;
    const itemData = {
        year: document.getElementById('timeline-year').value,
        title: document.getElementById('timeline-title').value,
        description: document.getElementById('timeline-description').value
    };

    if (id) {
        await API.timeline.update(parseInt(id), itemData);
        showToast('事件已更新！', 'success');
        addActivity('更新时间轴：' + itemData.title, 'success');
    } else {
        await API.timeline.add(itemData);
        showToast('事件已添加！', 'success');
        addActivity('添加时间轴：' + itemData.title, 'success');
    }

    document.getElementById('timeline-modal').classList.remove('show');
    loadTimelineTable();
});

// ==================== 模态框控制 ====================

// 模态框关闭
document.querySelectorAll('.modal-close').forEach(close => {
    close.addEventListener('click', function() {
        this.closest('.modal').classList.remove('show');
    });
});

// 点击模态框外部关闭 - 已禁用，防止误操作
// document.querySelectorAll('.modal').forEach(modal => {
//     modal.addEventListener('click', function(e) {
//         if (e.target === this || e.target.classList.contains('modal-overlay')) {
//             this.classList.remove('show');
//         }
//     });
// });

// 取消按钮
document.querySelectorAll('.modal-cancel').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('show');
    });
});

// ==================== Toast 消息提示 ====================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== 最近操作记录 ====================

function loadRecentActivities() {
    const activities = JSON.parse(localStorage.getItem('recentActivities') || '[]');
    recentActivities = activities;
    renderActivities();
}

function addActivity(title, type) {
    const activity = {
        id: Date.now(),
        title,
        type,
        time: new Date().toISOString()
    };

    recentActivities.unshift(activity);
    recentActivities = recentActivities.slice(0, 20); // 只保留最近 20 条
    localStorage.setItem('recentActivities', JSON.stringify(recentActivities));

    renderActivities();
}

function renderActivities() {
    const container = document.getElementById('recent-activity');
    if (!container || recentActivities.length === 0) {
        if (container) {
            container.innerHTML = `
                <div class="activity-empty">
                    <i class="fas fa-history"></i>
                    <p>暂无操作记录</p>
                </div>
            `;
        }
        return;
    }

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    container.innerHTML = recentActivities.map(activity => {
        const time = new Date(activity.time);
        const timeAgo = getTimeAgo(time);

        return `
            <div class="activity-item">
                <i class="fas ${icons[activity.type] || icons.info}"></i>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if (diff < 604800) return Math.floor(diff / 86400) + '天前';
    return date.toLocaleDateString('zh-CN');
}

// ==================== 系统设置 ====================

function loadSettings() {
    // 加载暗色模式状态
    document.getElementById('dark-mode-toggle').checked = document.body.classList.contains('dark-mode');
}

// 导出数据
function exportData() {
    const data = {
        brand: API.brand.get(),
        contact: API.contact.get(),
        timeline: API.timeline.getAll(),
        products: API.products.getAll(),
        exportTime: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafele-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('数据导出成功！', 'success');
    addActivity('导出数据', 'success');
}

// 导入产品数据
async function importProducts(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = JSON.parse(event.target.result);
            let productsArray = null;

            // 支持两种格式：{ products: [...] } 或直接是 [...]
            if (data.products && Array.isArray(data.products)) {
                productsArray = data.products;
            } else if (Array.isArray(data)) {
                productsArray = data;
            }

            if (!productsArray) {
                showToast('导入失败：文件中没有产品数据', 'error');
                input.value = '';
                return;
            }

            if (!confirm('导入产品数据将覆盖当前所有产品，确定要继续吗？')) {
                input.value = '';
                return;
            }

            // 保留原有 ID，确保数据完整性
            const productsWithIds = productsArray.map((p, index) => ({
                ...p,
                id: p.id || (index + 1)
            }));

            await API.products.save(productsWithIds);
            showToast(`产品数据导入成功！共导入 ${productsWithIds.length} 个产品`, 'success');
            addActivity('导入产品数据', 'success');
            loadProductsTable();
        } catch (err) {
            console.error('导入错误:', err);
            showToast('导入失败：文件格式不正确', 'error');
            input.value = '';
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// 导入完整数据（品牌、产品、联系方式、发展历程）
function importFullData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = JSON.parse(event.target.result);

            if (!data.brand || !data.products) {
                showToast('导入失败：文件格式不正确，缺少必要数据', 'error');
                input.value = '';
                return;
            }

            if (!confirm('警告：导入完整数据将覆盖当前所有数据！\n\n将导入：\n- 品牌信息\n- 联系方式\n- 发展历程\n- 产品数据\n\n确定要继续吗？')) {
                input.value = '';
                return;
            }

            // 依次导入各项数据
            if (data.brand) API.brand.save(data.brand);
            if (data.contact) API.contact.save(data.contact);
            if (data.timeline) API.timeline.save(data.timeline);
            if (data.products) await API.products.save(data.products);

            showToast('完整数据导入成功！', 'success');
            addActivity('导入完整数据', 'success');

            // 如果在产品管理页面，刷新表格；否则切换到产品页面
            const currentPage = document.getElementById('page-title').textContent;
            if (currentPage === '产品管理') {
                loadProductsTable();
            } else {
                switchTab('products');
            }
        } catch (err) {
            console.error('导入错误:', err);
            showToast('导入失败：文件格式不正确', 'error');
            input.value = '';
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// 导入数据
document.getElementById('import-file')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
        try {
            const data = JSON.parse(event.target.result);

            if (!confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
                return;
            }

            // 支持两种格式：完整格式 { brand, contact, timeline, products } 或直接是产品数组 [...]
            if (Array.isArray(data)) {
                // 直接是产品数组，只导入产品
                await API.products.save(data);
                showToast('产品数据导入成功！', 'success');
                addActivity('导入产品数据', 'success');
                loadProductsTable();
            } else {
                // 完整格式
                if (data.brand) await API.brand.save(data.brand);
                if (data.contact) await API.contact.save(data.contact);
                if (data.timeline) await API.timeline.save(data.timeline);
                if (data.products) await API.products.save(data.products);

                showToast('数据导入成功！', 'success');
                addActivity('导入数据', 'success');
                loadDashboard();
            }
        } catch (err) {
            console.error('导入错误:', err);
            showToast('导入失败：文件格式不正确', 'error');
        } finally {
            this.value = '';
        }
    };
    reader.readAsText(file);
});

// 重置数据
async function resetData() {
    if (confirm('警告：此操作将恢复所有默认数据且无法撤销！确定要继续吗？')) {
        if (confirm('请再次确认：确定要重置所有数据吗？')) {
            localStorage.removeItem('brandData');
            localStorage.removeItem('bacashiData');
            await API.clearIndexedDBBackup();
            await API.init();
            showToast('数据已重置为默认值', 'success');
            addActivity('重置数据', 'warning');
            loadDashboard();
        }
    }
}

// 从云端同步数据
async function syncFromCloud() {
    if (!navigator.onLine) {
        showToast('当前离线，无法同步', 'warning');
        return;
    }

    const btn = document.getElementById('sync-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 同步中...';
    }

    try {
        // 检查 COS 配置
        const cosConfig = API.cos.getConfig();
        if (!cosConfig.secretId || !cosConfig.secretKey) {
            showToast('请先配置 COS 参数', 'warning');
            showCosConfigModal();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> 从云端同步';
            }
            return;
        }

        const success = await API.syncFromCloud();
        if (success) {
            showToast('数据已从云端同步！', 'success');
            addActivity('从云端同步数据', 'success');
            // 同步成功后刷新当前页面
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast('云端无数据或同步失败', 'warning');
        }
    } catch (err) {
        console.error('同步错误:', err);
        showToast('同步失败：' + err.message, 'error');
        addActivity('同步失败：' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> 从云端同步';
        }
    }
}

// 修改密码
function changePassword() {
    const oldPassword = prompt('请输入当前密码：');
    if (!oldPassword) return;

    // 验证旧密码
    const username = 'Siocny';
    if (!API.auth.login(username, oldPassword)) {
        showToast('当前密码错误', 'error');
        return;
    }

    const newPassword = prompt('请输入新密码：');
    if (!newPassword || newPassword.length < 6) {
        showToast('密码至少需要 6 位', 'warning');
        return;
    }

    const confirmPassword = prompt('请再次输入新密码确认：');
    if (newPassword !== confirmPassword) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    // 更新 API.js 中的密码（实际项目中应该调用后端 API）
    // 注意：这里只是前端模拟，实际应该修改 api.js 文件
    alert('密码修改功能需要后端支持，当前版本请手动修改 api.js 文件中的密码。\n\n提示：api.js 第 155 行');
}

// ==================== 刷新数据 ====================

document.getElementById('refresh-btn')?.addEventListener('click', function() {
    this.querySelector('i').classList.add('fa-spin');
    loadDashboard();
    setTimeout(() => {
        this.querySelector('i').classList.remove('fa-spin');
        showToast('数据已刷新', 'success');
    }, 500);
});

// 导出产品数据
document.getElementById('export-products-btn')?.addEventListener('click', function() {
    const products = API.products.getAll();
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('产品数据导出成功！', 'success');
});

// 导出时间轴数据
document.getElementById('export-timeline-btn')?.addEventListener('click', function() {
    const timeline = API.timeline.getAll();
    const blob = new Blob([JSON.stringify(timeline, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('时间轴数据导出成功！', 'success');
});

// 导出留言数据
document.getElementById('export-messages-btn')?.addEventListener('click', function() {
    exportMessages();
});

// 刷新留言列表
document.getElementById('refresh-messages-btn')?.addEventListener('click', function() {
    loadMessages();
    showToast('列表已刷新', 'success');
});

// 批量删除留言
document.getElementById('batch-delete-messages-btn')?.addEventListener('click', function() {
    batchDeleteMessages();
});

// ==================== 页面加载初始化 ====================

document.addEventListener('DOMContentLoaded', async function() {
    // 初始化 API 数据（确保 timeline 等数据存在）
    // 使用 Promise.race 添加超时，避免阻塞页面
    const initPromise = API.init().catch(err => {
        console.error('API 初始化失败:', err);
    });

    // 最多等待 15 秒，超时后继续执行（CDN 加载可能需要更长时间）
    const timeoutPromise = new Promise(resolve =>
        setTimeout(() => {
            console.warn('API 初始化超时，继续加载页面');
            resolve();
        }, 15000)
    );

    await Promise.race([initPromise, timeoutPromise]);

    checkAuth();
    initRememberMe();

    // 为产品类别下拉框添加 change 事件，实现级联选择产品类型
    const categorySelect = document.getElementById('product-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            updateProductTypeSelectByCategory();
        });
    }

    // 全局键盘快捷键
    document.addEventListener('keydown', function(e) {
        // ESC 关闭模态框
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(modal => {
                modal.classList.remove('show');
            });
        }
        // Ctrl+S 保存（在表单页面）
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            const activeForm = document.querySelector('.tab-content.active form');
            if (activeForm) {
                activeForm.querySelector('[type="submit"]')?.click();
            }
        }
    });
});

// 暴露全局函数
window.switchTab = switchTab;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.updateProductSort = updateProductSort;
window.editTimeline = editTimeline;
window.deleteTimeline = deleteTimeline;
window.changePage = changePage;
window.messageChangePage = messageChangePage;
window.toggleSelectAll = toggleSelectAll;
window.toggleProductSelection = toggleProductSelection;
window.exportData = exportData;
window.importFullData = importFullData;
window.importProducts = importProducts;
window.resetData = resetData;
window.changePassword = changePassword;
window.formatProductManual = formatProductManual;
window.insertProductManualImage = insertProductManualImage;
window.updateProductVideoPreview = updateProductVideoPreview;
window.addCategoryOption = addCategoryOption;
window.deleteCategoryOption = deleteCategoryOption;
window.addProductTypeOption = addProductTypeOption;
window.deleteProductTypeOption = deleteProductTypeOption;
window.addNewCategoryItem = addNewCategoryItem;
window.loadMessages = loadMessages;
window.deleteMessage = deleteMessage;
window.toggleMessageSelection = toggleMessageSelection;
window.toggleMessageSelectAll = toggleMessageSelectAll;
window.batchDeleteMessages = batchDeleteMessages;
window.exportMessages = exportMessages;
window.filterByNameSelect = filterByNameSelect;
window.filterByBrandSelect = filterByBrandSelect;
window.filterByCategorySelect = filterByCategorySelect;
window.filterByProductTypeSelect = filterByProductTypeSelect;
window.updateHeaderFilters = updateHeaderFilters;

// ==================== 表头筛选功能 ====================

// 更新表头筛选下拉框
function updateHeaderFilters() {
    // 获取所有产品来填充选项
    let allProducts = [...API.products.getAll(), ...API.bacashi.products.getAll()];

    // 更新产品名称下拉框
    const nameSelect = document.getElementById('header-filter-name');
    if (nameSelect) {
        const names = [...new Set(allProducts.map(p => p.name))].sort();
        nameSelect.innerHTML = '<option value="">全部</option>' +
            names.map(n => `<option value="${encodeURIComponent(n)}">${n}</option>`).join('');
    }

    // 更新类别下拉框
    const categorySelect = document.getElementById('header-filter-category');
    if (categorySelect) {
        const categories = getStoredCategories();
        categorySelect.innerHTML = '<option value="">全部</option>' +
            categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    // 更新产品类型下拉框
    const typeSelect = document.getElementById('header-filter-type');
    if (typeSelect) {
        const types = getStoredProductTypes();
        typeSelect.innerHTML = '<option value="">全部</option>' +
            types.map(t => `<option value="${t}">${t}</option>`).join('');
    }
}

// 按名称筛选
function filterByNameSelect(value) {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.value = value ? decodeURIComponent(value) : '';
        currentPage = 1;
        loadProductsTable();
    }
}

// 按品牌筛选
function filterByBrandSelect(value) {
    const btn = document.querySelector(`.brand-filter-btn[data-brand="${value || 'all'}"]`);
    if (btn) {
        btn.click();
    }
}

// 按产品类型筛选
function filterByProductTypeSelect(value) {
    if (!value) {
        // 清空筛选
        window.currentProductTypeFilter = null;
        const allCategoryBtn = document.querySelector('.category-btn[data-category="all"]');
        if (allCategoryBtn) allCategoryBtn.click();
        document.getElementById('product-search').value = '';
        currentPage = 1;
        loadProductsTable();
        return;
    }

    // 设置全局产品类型筛选变量
    window.currentProductTypeFilter = value;

    // 直接按产品类型过滤产品
    let cafeleProducts = API.products.getAll().map(p => ({ ...p, brand: 'cafele' }));
    let bacashiProducts = API.bacashi.products.getAll().map(p => ({ ...p, brand: 'bacashi' }));
    let allProducts = [...cafeleProducts, ...bacashiProducts];

    const filtered = allProducts.filter(p => p.productType === value);

    // 显示筛选结果
    displayFilteredProducts(filtered);
}

// 显示筛选后的产品
function displayFilteredProducts(products) {
    const container = document.getElementById('products-table');
    const pagination = document.getElementById('products-pagination');

    if (!products || products.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>暂无产品数据</p></div>';
        if (pagination) pagination.innerHTML = '';
        return;
    }

    // 分页
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = products.slice(startIndex, startIndex + itemsPerPage);

    container.innerHTML = `
        <div class="table-header">
            <span class="checkbox-cell"><input type="checkbox" id="select-all" onchange="toggleSelectAll()"></span>
            <span>ID</span>
            <span class="header-name">
                产品名称
                <select id="header-filter-name" class="header-filter" onchange="filterByNameSelect(this.value)">
                    <option value="">全部</option>
                </select>
            </span>
            <span class="header-brand">
                品牌
                <select id="header-filter-brand" class="header-filter" onchange="filterByBrandSelect(this.value)">
                    <option value="">全部</option>
                    <option value="cafele">CAFELE</option>
                    <option value="bacashi">BACASHI</option>
                </select>
            </span>
            <span class="header-category">
                类别
                <select id="header-filter-category" class="header-filter" onchange="filterByCategorySelect(this.value)">
                    <option value="">全部</option>
                </select>
            </span>
            <span class="header-type">
                产品类型
                <select id="header-filter-type" class="header-filter" onchange="filterByProductTypeSelect(this.value)">
                    <option value="">全部</option>
                </select>
            </span>
            <span class="table-actions-header">操作</span>
        </div>
    ` + paginatedProducts.sort((a, b) => a.sort - b.sort).map(product => `
        <div class="table-row ${selectedProducts.includes(product.id) ? 'selected' : ''}" data-id="${product.id}">
            <span class="checkbox-cell"><input type="checkbox" class="product-checkbox" value="${product.id}" onchange="toggleProductSelection(${product.id})"></span>
            <span>${product.id}</span>
            <span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${product.image ? `<img src="${product.image}" class="table-image" alt="${product.name}">` : ''}
                    <span>${product.name}</span>
                </div>
            </span>
            <span><span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${product.brand === 'bacashi' ? '#fef3c7' : '#dbeafe'}; color: ${product.brand === 'bacashi' ? '#92400e' : '#1e3a8a'};">${product.brand === 'bacashi' ? 'BACASHI' : 'CAFELE'}</span></span>
            <span>${product.category}</span>
            <span class="product-type">${getProductTypeName(product.productType)}</span>
            <span class="table-actions">
                <button class="btn btn-primary btn-sm" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </span>
        </div>
    `).join('');

    // 更新分页
    updatePagination(products.length, totalPages);

    // 更新批量删除按钮状态
    updateBatchDeleteButton();

    // 更新表头筛选下拉框
    updateHeaderFilters();
}

// ==================== 留言管理功能 ====================

let messageCurrentPage = 1;
const messagesPerPage = 10;

// 加载留言列表
function loadMessages() {
    const messagesTable = document.getElementById('messages-table');
    const messagesPagination = document.getElementById('messages-pagination');

    if (!messagesTable) return;

    // 从 localStorage 读取留言
    const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');

    // 按时间倒序排序
    messages.sort((a, b) => new Date(b.time) - new Date(a.time));

    const totalPages = Math.ceil(messages.length / messagesPerPage);
    const startIndex = (messageCurrentPage - 1) * messagesPerPage;
    const endIndex = startIndex + messagesPerPage;
    const pageMessages = messages.slice(startIndex, endIndex);

    if (messages.length === 0) {
        messagesTable.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>暂无留言</p>
            </div>
        `;
        if (messagesPagination) messagesPagination.innerHTML = '';
        return;
    }

    messagesTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th style="width: 40px;">
                        <input type="checkbox" id="message-select-all" onchange="toggleMessageSelectAll(this)">
                    </th>
                    <th style="width: 100px;">姓名</th>
                    <th style="width: 150px;">联系电话</th>
                    <th style="width: 200px;">邮箱</th>
                    <th>留言内容</th>
                    <th style="width: 180px;">留言时间</th>
                    <th style="width: 100px;">操作</th>
                </tr>
            </thead>
            <tbody>
                ${pageMessages.map(msg => `
                    <tr>
                        <td>
                            <input type="checkbox" class="message-checkbox" data-time="${msg.time}" onchange="toggleMessageSelection(this)">
                        </td>
                        <td>${escapeHtml(msg.name || '-')}</td>
                        <td>${escapeHtml(msg.phone || '-')}</td>
                        <td>${escapeHtml(msg.email || '-')}</td>
                        <td class="message-content">${escapeHtml(msg.message || '')}</td>
                        <td>${formatMessageTime(msg.time)}</td>
                        <td>
                            <button class="btn-icon" onclick="deleteMessage('${msg.time}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // 更新批量删除按钮状态
    updateBatchDeleteButton();

    // 生成分页
    if (messagesPagination) {
        messagesPagination.innerHTML = generatePagination(messageCurrentPage, totalPages, 'message');
    }
}

// 删除单条留言
function deleteMessage(time) {
    if (!confirm('确定要删除这条留言吗？')) return;

    let messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    messages = messages.filter(m => m.time !== time);
    localStorage.setItem('contactMessages', JSON.stringify(messages));

    loadMessages();
    showToast('留言已删除', 'success');
}

// 切换留言全选
function toggleMessageSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.message-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
    updateBatchDeleteButton();
}

// 切换单条留言选中
function toggleMessageSelection(checkbox) {
    updateBatchDeleteButton();
}

// 更新批量删除按钮状态
function updateBatchDeleteButton() {
    const batchDeleteBtn = document.getElementById('batch-delete-messages-btn');
    if (!batchDeleteBtn) return;

    const selectedCount = document.querySelectorAll('.message-checkbox:checked').length;
    batchDeleteBtn.style.display = selectedCount > 0 ? 'inline-flex' : 'none';
}

// 批量删除留言
function batchDeleteMessages() {
    const selectedCheckboxes = document.querySelectorAll('.message-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showToast('请先选择要删除的留言', 'warning');
        return;
    }

    if (!confirm(`确定要删除选中的 ${selectedCheckboxes.length} 条留言吗？`)) return;

    let messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    const selectedTimes = Array.from(selectedCheckboxes).map(cb => cb.dataset.time);
    messages = messages.filter(m => !selectedTimes.includes(m.time));
    localStorage.setItem('contactMessages', JSON.stringify(messages));

    loadMessages();
    showToast(`已删除 ${selectedCheckboxes.length} 条留言`, 'success');
}

// 导出留言
function exportMessages() {
    const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    if (messages.length === 0) {
        showToast('暂无留言可导出', 'warning');
        return;
    }

    const dataStr = JSON.stringify(messages, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `留言数据_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('留言已导出', 'success');
}

// 留言时间格式化
function formatMessageTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;

    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 腾讯云 COS 配置 ====================

// 显示 COS 配置弹窗
function showCosConfigModal() {
    const config = API.cos.getConfig();
    document.getElementById('cos-bucket').value = config.bucket || '';
    document.getElementById('cos-region').value = config.region || 'ap-guangzhou';
    document.getElementById('cos-secret-id').value = config.secretId || '';
    document.getElementById('cos-secret-key').value = config.secretKey || '';
    document.getElementById('cos-config-modal').style.display = 'block';
}

// 关闭 COS 配置弹窗
function closeCosConfigModal() {
    document.getElementById('cos-config-modal').style.display = 'none';
}

// 保存 COS 配置
function saveCosConfig() {
    console.log('saveCosConfig 被调用');

    const bucketInput = document.getElementById('cos-bucket');
    const regionInput = document.getElementById('cos-region');
    const secretIdInput = document.getElementById('cos-secret-id');
    const secretKeyInput = document.getElementById('cos-secret-key');

    const bucket = bucketInput.value.trim();
    const region = regionInput.value;
    const secretId = secretIdInput.value.trim();
    const secretKey = secretKeyInput.value.trim();

    console.log('输入值:', { bucket, region, secretId, secretKey: secretKey ? '***' : '' });

    if (!bucket) {
        showToast('请输入存储桶名称', 'warning');
        bucketInput.focus();
        return;
    }

    if (!secretId || !secretKey) {
        showToast('请输入密钥 ID 和密钥 Key', 'warning');
        if (!secretId) secretIdInput.focus();
        else secretKeyInput.focus();
        return;
    }

    try {
        API.cos.saveConfig({
            bucket,
            region,
            secretId,
            secretKey
        });

        showToast('COS 配置保存成功！', 'success');
        closeCosConfigModal();

        console.log('COS 配置已保存');
    } catch (err) {
        console.error('保存 COS 配置失败:', err);
        showToast('保存失败：' + err.message, 'error');
    }
}

// 点击弹窗外部关闭
document.addEventListener('click', function(event) {
    const modal = document.getElementById('cos-config-modal');
    if (event.target === modal) {
        closeCosConfigModal();
    }
});

