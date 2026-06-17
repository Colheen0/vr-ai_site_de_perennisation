(function () {
    const container = document.querySelector('.ellipses-container');
    if (!container) return;

    const scrollEl = document.querySelector('.main-right');
    if (!scrollEl) return;

    scrollEl.addEventListener('scroll', function () {
        if (scrollEl.scrollTop > 0) {
            container.classList.add('is-scrolled');
        } else {
            container.classList.remove('is-scrolled');
        }
    }, { passive: true });
})();

