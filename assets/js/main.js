// 前端主页面 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 加载品牌信息
    function loadBrandInfo() {
        const brand = API.brand.get();
        document.getElementById('brand-description').textContent = brand.description;
        document.getElementById('stat-years').textContent = brand.stats.years;
        document.getElementById('stat-products').textContent = brand.stats.products;
        document.getElementById('stat-customers').textContent = brand.stats.customers;

        // 数字动画
        animateNumbers();
    }

    // 数字滚动动画
    function animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(el => {
            // 跳过已固定的 50+
            if (el.parentElement.querySelector('.stat-label').textContent.includes('国家')) return;

            const target = parseInt(el.textContent);
            el.textContent = '0';
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    el.textContent = target;
                    clearInterval(timer);
                } else {
                    el.textContent = Math.floor(current);
                }
            }, 30);
        });
    }

    // 加载时间轴
    function loadTimeline() {
        const timeline = API.timeline.getAll();
        const container = document.getElementById('timeline-container');

        if (timeline.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;">暂无数据</p>';
            return;
        }

        container.innerHTML = timeline.map(item => `
            <div class="timeline-item">
                <div class="timeline-year-box">${item.year}</div>
                <div class="timeline-content">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                </div>
            </div>
        `).join('');
    }

    // 加载产品
    function loadProducts(category = 'all') {
        const products = API.products.getAll();
        const categories = API.products.getCategories();
        const container = document.getElementById('products-container');
        const filtersContainer = document.querySelector('.product-filters');

        // 生成分类过滤器
        const filterButtons = categories.map(cat =>
            `<button class="filter-btn" data-category="${cat}">${cat}</button>`
        ).join('');
        filtersContainer.innerHTML = `<button class="filter-btn active" data-category="all">全部系列</button>` + filterButtons;

        // 绑定过滤器事件
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                loadProducts(this.dataset.category);
            });
        });

        // 过滤产品
        const filtered = category === 'all' ? products : products.filter(p => p.category === category);

        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">暂无产品</p>';
            return;
        }

        container.innerHTML = filtered.sort((a, b) => a.sort - b.sort).map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image-wrap">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/600x400?text=CAFELE'">
                    <div class="product-overlay">
                        <button class="product-overlay-btn">查看详情</button>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${product.price}</div>
                </div>
            </div>
        `).join('');

        // 绑定查看详情事件
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function() {
                showProductModal(this.dataset.id);
            });
        });
    }

    // 显示产品详情
    function showProductModal(productId) {
        const products = API.products.getAll();
        const product = products.find(p => p.id == productId);
        if (!product) return;

        const modal = document.getElementById('product-modal');
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div class="modal-product">
                <img class="modal-product-img" src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/600x500?text=CAFELE'">
                <div class="modal-product-info">
                    <span class="product-category">${product.category}</span>
                    <h2 class="product-name">${product.name}</h2>
                    <p class="product-price">${product.price}</p>
                    <p class="product-description">${product.description}</p>
                    <div class="modal-details">
                        <h4>产品详情</h4>
                        <pre>${product.details}</pre>
                    </div>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // 关闭模态框
    function closeModal() {
        const modal = document.getElementById('product-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // 模态框关闭按钮
    document.querySelector('.modal-close').addEventListener('click', closeModal);

    // 点击遮罩关闭
    document.querySelector('.modal-overlay').addEventListener('click', closeModal);

    // ESC 关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // 联系表单提交
    document.getElementById('contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('感谢您的留言！我们会尽快与您联系。');
        this.reset();
    });

    // 移动端菜单
    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        document.querySelector('.nav-links').classList.toggle('active');
    });

    // 导航链接点击关闭移动菜单
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.nav-links').classList.remove('active');
        });
    });

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 滚动时导航栏效果
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 30px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
        }
    });

    // 滚动时高亮导航
    window.addEventListener('scroll', function() {
        const sections = ['home', 'brand', 'products', 'contact'];
        const scrollPos = window.scrollY + 200;

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                if (scrollPos >= top && scrollPos < top + height) {
                    document.querySelectorAll('.nav-links a').forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === '#' + id) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    });

    // 初始化
    loadBrandInfo();
    loadTimeline();
    loadProducts();
});
