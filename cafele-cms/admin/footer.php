        </div><!-- .admin-content -->
    </main>

    <script>
    // 移动端菜单切换
    document.getElementById('menuToggle')?.addEventListener('click', function() {
        document.getElementById('adminSidebar').classList.toggle('open');
    });

    // Toast 提示
    function showToast(msg, type) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.className = 'toast ' + type + ' show';
        setTimeout(() => el.classList.remove('show'), 3000);
    }
    </script>
</body>
</html>
