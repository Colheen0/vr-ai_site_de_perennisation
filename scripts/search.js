(function () {
    const searchInput = document.querySelector('.search-bar input');
    const searchResults = document.querySelector('.search-results');
    const searchShortcuts = document.querySelector('.search-shortcuts');

    if (!searchInput) return;

    let searchData = [];

    fetch('data/search-data.json')
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
        return /^\/[\w\-./]*$/.test(href) ? href : '#';
    }

    function renderResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="search-no-results">Aucun résultat</p>';
        } else {
            searchResults.innerHTML = results.map(item => `
                <a class="search-result-item" href="${safePath(item.href)}">
                    <span class="search-result-breadcrumb">${item.breadcrumb.slice(0, -1).map(escapeHtml).join(' › ')}${item.breadcrumb.length > 1 ? ' › ' : ''}<strong>${escapeHtml(item.breadcrumb[item.breadcrumb.length - 1])}</strong></span>
                    <span class="search-result-title">${escapeHtml(item.title)}</span>
                </a>
            `).join('');
        }
        searchResults.removeAttribute('hidden');
    }

    function closeSearch() {
        searchResults.setAttribute('hidden', '');
        searchShortcuts.removeAttribute('hidden');
        searchInput.value = '';
    }

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            closeSearch();
            return;
        }
        searchShortcuts.setAttribute('hidden', '');

        const results = searchData.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.breadcrumb.some(b => b.toLowerCase().includes(query))
        );
        renderResults(results);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearch();
            searchInput.blur();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            closeSearch();
        }
    });
})();
