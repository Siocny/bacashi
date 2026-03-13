// 后台管理 JavaScript

let currentEditId = null;

// 检查登录状态
function checkAuth() {
    if (API.auth.isLoggedIn()) {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        loadDashboard();
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

    if (API.auth.login(username, password)) {
        checkAuth();
    } else {
        alert('用户名或密码错误！');
    }
});

// 退出登录
document.getElementById('logout-btn').addEventListener('click', function(e) {
    e.preventDefault();
    API.auth.logout();
    checkAuth();
});

// 切换标签页
function switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById('tab-' + tabName).classList.add('active');

    // 更新页面标题
    const titles = {
        'dashboard': '控制台',
        'brand': '品牌管理',
        'products': '产品管理',
        'contact': '联系信息管理',
        'timeline': '发展历程管理'
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
    }
}

// 侧边栏导航事件
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab(this.dataset.tab);
    });
});

// 加载控制台
function loadDashboard() {
    const products = API.products.getAll();
    const categories = API.products.getCategories();
    const timeline = API.timeline.getAll();

    document.getElementById('dash-product-count').textContent = products.length;
    document.getElementById('dash-category-count').textContent = categories.length;
    document.getElementById('dash-timeline-count').textContent = timeline.length;
}

// 加载品牌信息
function loadBrand() {
    const brand = API.brand.get();
    document.getElementById('brand-description').value = brand.description;
    document.getElementById('stat-years').value = brand.stats.years;
    document.getElementById('stat-products').value = brand.stats.products;
    document.getElementById('stat-customers').value = brand.stats.customers;
}

// 保存品牌信息
document.getElementById('brand-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const brandData = {
        description: document.getElementById('brand-description').value,
        stats: {
            years: parseInt(document.getElementById('stat-years').value) || 0,
            products: parseInt(document.getElementById('stat-products').value) || 0,
            customers: parseInt(document.getElementById('stat-customers').value) || 0
        }
    };

    API.brand.save(brandData);
    alert('品牌信息已保存！');
});

// 加载联系信息
function loadContact() {
    const contact = API.contact.get();
    document.getElementById('contact-address').value = contact.address;
    document.getElementById('contact-phone').value = contact.phone;
    document.getElementById('contact-email').value = contact.email;
}

// 保存联系信息
document.getElementById('contact-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const contactData = {
        address: document.getElementById('contact-address').value,
        phone: document.getElementById('contact-phone').value,
        email: document.getElementById('contact-email').value
    };

    API.contact.save(contactData);
    alert('联系信息已保存！');
});

// 加载产品表格
function loadProductsTable() {
    const products = API.products.getAll();
    const container = document.getElementById('products-table');

    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无产品数据</div>';
        return;
    }

    container.innerHTML = `
        <div class="table-header">
            <span>ID</span>
            <span>产品名称</span>
            <span>类别</span>
            <span>价格</span>
            <span>排序</span>
            <span>操作</span>
        </div>
    ` + products.sort((a, b) => a.sort - b.sort).map(product => `
        <div class="table-row" data-id="${product.id}">
            <span>${product.id}</span>
            <span>${product.name}</span>
            <span>${product.category}</span>
            <span>${product.price}</span>
            <span>${product.sort}</span>
            <td class="table-actions">
                <button class="btn btn-edit" onclick="editProduct(${product.id})">编辑</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">删除</button>
            </td>
        </div>
    `).join('');
}

// 添加产品按钮
document.getElementById('add-product-btn').addEventListener('click', function() {
    openProductModal();
});

// 打开产品模态框
function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const form = document.getElementById('product-form');

    if (product) {
        document.getElementById('modal-title').textContent = '编辑产品';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-sort').value = product.sort;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-details').value = product.details;
    } else {
        document.getElementById('modal-title').textContent = '添加产品';
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-sort').value = '0';
    }

    modal.style.display = 'flex';
}

// 编辑产品
function editProduct(id) {
    const products = API.products.getAll();
    const product = products.find(p => p.id === id);
    if (product) {
        openProductModal(product);
    }
}

// 删除产品
function deleteProduct(id) {
    if (confirm('确定要删除这个产品吗？')) {
        API.products.delete(id);
        loadProductsTable();
    }
}

// 保存产品
document.getElementById('product-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const id = document.getElementById('product-id').value;
    const productData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        image: document.getElementById('product-image').value || 'https://via.placeholder.com/400x300?text=No+Image',
        price: document.getElementById('product-price').value,
        sort: parseInt(document.getElementById('product-sort').value) || 0,
        description: document.getElementById('product-description').value,
        details: document.getElementById('product-details').value
    };

    if (id) {
        API.products.update(parseInt(id), productData);
        alert('产品已更新！');
    } else {
        API.products.add(productData);
        alert('产品已添加！');
    }

    document.getElementById('product-modal').style.display = 'none';
    loadProductsTable();
});

// 加载时间轴表格
function loadTimelineTable() {
    const timeline = API.timeline.getAll();
    const container = document.getElementById('timeline-table');

    if (timeline.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无时间轴数据</div>';
        return;
    }

    container.innerHTML = `
        <div class="table-header">
            <span>ID</span>
            <span>年份</span>
            <span>标题</span>
            <span>描述</span>
            <span>操作</span>
        </div>
    ` + timeline.map(item => `
        <div class="table-row" data-id="${item.id}">
            <span>${item.id}</span>
            <span>${item.year}</span>
            <span>${item.title}</span>
            <span>${item.description}</span>
            <td class="table-actions">
                <button class="btn btn-edit" onclick="editTimeline(${item.id})">编辑</button>
                <button class="btn btn-danger" onclick="deleteTimeline(${item.id})">删除</button>
            </td>
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

    modal.style.display = 'flex';
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
function deleteTimeline(id) {
    if (confirm('确定要删除这个事件吗？')) {
        API.timeline.delete(id);
        loadTimelineTable();
    }
}

// 保存时间轴
document.getElementById('timeline-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const id = document.getElementById('timeline-id').value;
    const itemData = {
        year: document.getElementById('timeline-year').value,
        title: document.getElementById('timeline-title').value,
        description: document.getElementById('timeline-description').value
    };

    if (id) {
        API.timeline.update(parseInt(id), itemData);
        alert('事件已更新！');
    } else {
        API.timeline.add(itemData);
        alert('事件已添加！');
    }

    document.getElementById('timeline-modal').style.display = 'none';
    loadTimelineTable();
});

// 模态框关闭
document.querySelectorAll('.modal-close').forEach(close => {
    close.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

// 点击模态框外部关闭
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// 初始化
checkAuth();

// 暴露全局函数
window.switchTab = switchTab;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editTimeline = editTimeline;
window.deleteTimeline = deleteTimeline;
