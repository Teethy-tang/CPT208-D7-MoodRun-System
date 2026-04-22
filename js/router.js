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
        navItems.forEach(item => item.classList.remove('active'));

        if (active === 'home') {
            navItems[0]?.classList.add('active');
        }

        if (active === 'profile') {
            navItems[1]?.classList.add('active');
        }
    }

    return { showPage, updateNav };
}
