// 前端主页面 JavaScript

// 关闭微信提示
function closeWechatTip() {
    const wechatTip = document.getElementById('wechat-tip');
    if (wechatTip) {
        wechatTip.style.display = 'none';
        document.querySelector('.navbar').style.top = '0';
        sessionStorage.setItem('wechatTipClosed', 'true');
    }
}

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
    // 移动端菜单
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', function() {
        document.querySelector('.nav-links')?.classList.toggle('active');
    });

    // 导航链接点击关闭移动菜单
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelector('.nav-links')?.classList.remove('active');
        });
    });

    // 滚动时导航栏效果
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar && window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 30px rgba(0,0,0,0.1)';
        } else if (navbar) {
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)';
        }
    });
});

// 检测微信浏览器
function checkWechatBrowser() {
    const userAgent = navigator.userAgent;
    const isWechat = /micromessenger|wechat|weixin/i.test(userAgent);

    if (isWechat) {
        const wechatTip = document.getElementById('wechat-tip');
        if (wechatTip) {
            const hasClosed = sessionStorage.getItem('wechatTipClosed');
            if (!hasClosed) {
                wechatTip.style.display = 'block';
                document.querySelector('.navbar').style.top = '48px';
            }
        }
    }
}

// 页面加载时检测微信浏览器
checkWechatBrowser();
