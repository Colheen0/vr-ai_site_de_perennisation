const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
if (isMac) {
    document.querySelectorAll('.search-shortcuts').forEach(el => {
        el.querySelector('.shortcut-mac')?.removeAttribute('hidden');
        el.querySelector('.shortcut-ctrl')?.setAttribute('hidden', '');
        el.dataset.tooltip = '⌘ + K pour focus la barre de recherche';
    });
}

document.addEventListener('keydown', (e) => {
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key === 'k') {
        e.preventDefault();
        document.querySelector('.search-bar input')?.focus();
    }
});
