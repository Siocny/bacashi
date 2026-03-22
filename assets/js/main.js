// 前端主页面 JavaScript

// 搜索产品函数 - 跳转到产品页面
function searchProducts() {
    const keyword = document.getElementById('search-input').value.trim().toLowerCase();
    if (!keyword) {
        alert('请输入搜索关键词');
        return;
    }
    // 跳转到产品页面并传递搜索关键词
    window.location.href = `products.html?search=${encodeURIComponent(keyword)}`;
}

document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    // 移动端菜单
    mobileMenuBtn?.addEventListener('click', function() {
        navLinks?.classList.toggle('active');
        this.classList.toggle('active');

        // 阻止 body 滚动
        document.body.style.overflow = navLinks?.classList.contains('active') ? 'hidden' : '';
    });

    // 导航链接点击关闭移动菜单
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            // 如果有子菜单，不关闭
            if (this.parentElement.classList.contains('has-dropdown')) {
                return;
            }
            navLinks?.classList.remove('active');
            mobileMenuBtn?.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // 下拉菜单点击展开/收起
    document.querySelectorAll('.has-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            // 关闭其他打开的下拉菜单
            document.querySelectorAll('.has-dropdown.active').forEach(item => {
                if (item !== this) {
                    item.classList.remove('active');
                }
            });
            this.classList.toggle('active');
        });
    });

    // 点击外部关闭菜单
    document.addEventListener('click', function(e) {
        if (!navLinks?.contains(e.target) && !mobileMenuBtn?.contains(e.target)) {
            navLinks?.classList.remove('active');
            mobileMenuBtn?.classList.remove('active');
            document.querySelectorAll('.has-dropdown.active').forEach(item => {
                item.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    });

    // 滚动时导航栏效果
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar && window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 30px rgba(0,0,0,0.1)';
            navbar.style.background = 'rgba(255,255,255,0.98)';
        } else if (navbar) {
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
            navbar.style.background = 'rgba(255,255,255,0.98)';
        }
    });
});
