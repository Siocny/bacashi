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
        return JSON.parse(categories);
    }
    return ['车用电子', '车用内饰', '车用清洗', '手持风扇', '桌面风扇'];
}

function getStoredProductTypes() {
    const types = localStorage.getItem('productTypes');
    if (types) {
        return JSON.parse(types);
    }
    return ['充气泵', '一体机', '应急电源', '其他'];
}

function saveCategories(categories) {
    localStorage.setItem('productCategories', JSON.stringify(categories));
}

function saveProductTypes(types) {
    localStorage.setItem('productTypes', JSON.stringify(types));
}

// 更新产品类别下拉框
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
}

// 更新产品类型下拉框
function updateProductTypeSelect() {
    const typeSelect = document.getElementById('product-type');
    if (!typeSelect) return;

    const types = getStoredProductTypes();
    const currentValue = typeSelect.value;

    typeSelect.innerHTML = '<option value="">请选择产品类型</option>' +
        types.map(type => `<option value="${type}">${type}</option>`).join('');

    if (currentValue && types.includes(currentValue)) {
        typeSelect.value = currentValue;
    }
}

// 添加产品类别
window.addCategoryOption = function() {
    const name = prompt('请输入新产品类别名称：');
    if (!name || !name.trim()) return;

    const categories = getStoredCategories();
    if (categories.includes(name.trim())) {
        alert('该类别已存在！');
        return;
    }

    categories.push(name.trim());
    saveCategories(categories);
    updateProductCategorySelect();
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
    const name = prompt('请输入新产品类型名称：');
    if (!name || !name.trim()) return;

    const types = getStoredProductTypes();
    if (types.includes(name.trim())) {
        alert('该类型已存在！');
        return;
    }

    types.push(name.trim());
    saveProductTypes(types);
    updateProductTypeSelect();
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

// ==================== 初始化和认证 ====================

// 检查登录状态
function checkAuth() {
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

function loadProductsTable() {
    let products = API.products.getAll();

    // 应用搜索和筛选
    const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
    const category = document.getElementById('product-filter')?.value || 'all';

    if (searchTerm) {
        products = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    if (category !== 'all') {
        products = products.filter(p => p.category === category);
    }

    // 更新分类筛选器
    updateCategoryFilter(products);

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
            <span>产品名称</span>
            <span>类别</span>
            <span>产品类型</span>
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
}

function updateCategoryFilter() {
    const filter = document.getElementById('product-filter');
    if (!filter) return;

    // 使用存储的类别数据
    const categories = getStoredCategories();
    const currentValue = filter.value;

    filter.innerHTML = '<option value="all">全部类别</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    filter.value = currentValue;
}

function updatePagination(totalItems, totalPages) {
    const pagination = document.getElementById('products-pagination');
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

    pagination.innerHTML = `
        <span class="table-info">显示 ${startIndex}-${endIndex} 条，共 ${totalItems} 条</span>
        <div class="pagination">
            ${currentPage > 1 ? `<button onclick="changePage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>` : ''}
            ${Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                const pageNum = i + 1;
                return `<button class="${pageNum === currentPage ? 'active' : ''}" onclick="changePage(${pageNum})">${pageNum}</button>`;
            }).join('')}
            ${currentPage < totalPages ? `<button onclick="changePage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>` : ''}
        </div>
    `;
}

function changePage(page) {
    currentPage = page;
    loadProductsTable();
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
            await API.products.delete(id);
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
    if (document.getElementById('product-filter')) {
        document.getElementById('product-filter').addEventListener('change', () => { currentPage = 1; loadProductsTable(); });
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
    updateProductTypeSelect();

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
        // 在更新选项后设置值
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-type').value = product.productType || '';
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
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
        preview.innerHTML = `<img src="${url}" alt="预览">`;
        preview.classList.add('has-image');
    } else {
        preview.innerHTML = '<i class="fas fa-image"></i><span>暂无图片</span>';
        preview.classList.remove('has-image');
    }
}

// 图片上传
document.getElementById('product-image-upload')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64 = event.target.result;
            document.getElementById('product-image').value = base64;
            updateImagePreview(base64);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('product-image')?.addEventListener('input', function() {
    updateImagePreview(this.value);
});

// 编辑产品
function editProduct(id) {
    const products = API.products.getAll();
    const product = products.find(p => p.id === id);
    if (product) {
        openProductModal(product);
    }
}

// 删除产品
async function deleteProduct(id) {
    if (confirm('确定要删除这个产品吗？')) {
        await API.products.delete(id);
        await renumberProducts();
        showToast('产品已删除', 'success');
        addActivity('删除产品 ID:' + id, 'warning');
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
async function renumberProducts() {
    const products = API.products.getAll();
    products.sort((a, b) => a.sort - b.sort);
    for (const product of products) {
        product.sort = products.indexOf(product) + 1;
        await API.products.update(product.id, product);
    }
    loadProductsTable();
}

// 保存产品
document.getElementById('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const brand = document.getElementById('product-brand').value || 'cafele';

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
        image: document.getElementById('product-image').value || 'https://via.placeholder.com/400x300?text=No+Image',
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

        showToast('产品已更新！', 'success');
        addActivity('更新产品：' + productData.name + ' (' + (brand === 'bacashi' ? 'BACASHI' : 'CAFELE') + ')', 'success');
    } else {
        // 添加新产品
        if (brand === 'bacashi') {
            await API.bacashi.products.add(productData);
        } else {
            await API.products.add(productData);
        }
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
        // 如果 Supabase 未就绪，先尝试重连
        if (!API.supabaseReady) {
            showToast('正在连接 Supabase...', 'info');
            const reconnected = await API.retrySupabaseConnection();
            if (!reconnected) {
                throw new Error('Supabase 连接失败，请检查网络连接或稍后重试');
            }
        }

        const success = await API.syncFromCloud();
        if (success) {
            showToast('数据已从云端同步！', 'success');
            addActivity('从云端同步数据', 'success');
        } else {
            showToast('同步失败：无法连接到云端数据库', 'error');
            addActivity('云端同步失败', 'error');
        }
    } catch (err) {
        console.error('同步错误:', err);
        let errorMsg = err.message || '未知错误';
        if (errorMsg.includes('table') || errorMsg.includes('relation')) {
            errorMsg = '数据库表不存在，请先在 Supabase 后台创建表';
        }
        showToast('同步失败：' + errorMsg, 'error');
        addActivity('同步失败：' + errorMsg, 'error');
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

// ==================== 页面加载初始化 ====================

document.addEventListener('DOMContentLoaded', async function() {
    // 初始化 API 数据（确保 timeline 等数据存在）
    await API.init();

    checkAuth();
    initRememberMe();

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

