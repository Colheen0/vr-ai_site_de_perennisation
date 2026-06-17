(function () {
    let searchData = [];

    const resolvePath = typeof window.resolveSitePath === 'function'
        ? window.resolveSitePath
        : (path => path);

    fetch(resolvePath('data/search-data.json'))
        .then(r => r.json())
        .then(data => { searchData = data; })
        .catch(() => {});

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function safePath(href) {
        if (!href) return '#';
        // Construit un chemin absolu à partir de l'origine de la page courante
        const base = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
        const filename = href.replace(/^\//, '').split('/').pop();
        return base + filename;
    }

    function renderResults(results, resultsEl) {
        if (results.length === 0) {
            resultsEl.innerHTML = '<p class="search-no-results" aria-live="polite" role="status">Aucun résultat</p>';
        } else {
            resultsEl.innerHTML = results.map(item => `
                <a class="search-result-item" href="${safePath(item.href)}">
                    <span class="search-result-breadcrumb">${item.breadcrumb.slice(0, -1).map(escapeHtml).join(' › ')}${item.breadcrumb.length > 1 ? ' › ' : ''}<strong>${escapeHtml(item.breadcrumb[item.breadcrumb.length - 1])}</strong></span>
                    <span class="search-result-title">${escapeHtml(item.title)}</span>
                </a>
            `).join('');
        }
        resultsEl.removeAttribute('hidden');
    }

    function initSearchBar(inputEl, resultsEl, shortcutsEl, wrapperSelector) {
        if (!inputEl || !resultsEl) return;

        function closeSearch() {
            resultsEl.setAttribute('hidden', '');
            if (shortcutsEl) shortcutsEl.removeAttribute('hidden');
            inputEl.value = '';
        }

        inputEl.addEventListener('input', () => {
            const query = inputEl.value.trim().toLowerCase();
            if (!query) { closeSearch(); return; }
            if (shortcutsEl) shortcutsEl.setAttribute('hidden', '');
            const results = searchData.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.breadcrumb.some(b => b.toLowerCase().includes(query))
            );
            renderResults(results, resultsEl);
        });

        inputEl.addEventListener('keydown', e => {
            if (e.key === 'Escape') { closeSearch(); inputEl.blur(); }
        });

        document.addEventListener('click', e => {
            if (wrapperSelector && !e.target.closest(wrapperSelector)) closeSearch();
        });
    }

    initSearchBar(
        document.querySelector('.search-bar input'),
        document.querySelector('.search-results'),
        document.querySelector('.search-shortcuts'),
        '.search-wrapper'
    );

    initSearchBar(
        document.querySelector('.mobile-nav-search-bar input'),
        document.querySelector('.mobile-search-results'),
        null,
        '.mobile-nav-search-wrapper'
    );
})();
