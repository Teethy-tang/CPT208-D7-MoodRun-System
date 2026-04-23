export function createRouter({ cursorGlow } = {}) {
    function showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

        const nextPage = document.getElementById(pageId);
        if (!nextPage) {
            console.warn(`Page "${pageId}" was not found.`);
            return;
        }

        nextPage.classList.add('active');
        cursorGlow?.classList.toggle('home-visible', pageId === 'homePage');
    }

    function updateNav(active) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active', 'nav-bump'));

        function activate(item) {
            if (!item) return;
            window.clearTimeout(item.navBumpTimer);
            void item.offsetWidth;
            item.classList.add('active', 'nav-bump');
            item.navBumpTimer = window.setTimeout(() => item.classList.remove('nav-bump'), 260);
        }

        if (active === 'home') {
            activate(navItems[0]);
        }

        if (active === 'profile') {
            activate(navItems[1]);
        }
    }

    return { showPage, updateNav };
}
