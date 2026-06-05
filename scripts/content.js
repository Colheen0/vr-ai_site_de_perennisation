(async function () {
    const pageId = document.body.dataset.page;
    if (!pageId) return;

    try {
        const res = await fetch('/data/content.json');
        const data = await res.json();

        if (data.nav) renderNav(data.nav, pageId);

        const page = data.pages?.[pageId];
        if (!page) return;

        if (page.title) document.title = page.title;
        if (page.toc) renderToc(page.toc);
        if (page.content) renderContent(page.content);
        if (page.toc) setupTocScroll();
    } catch (e) {
        console.error('Failed to load page content:', e);
    }
})();

function renderNav(nav, activePageId) {
    const navEl = document.querySelector('.nav nav');
    if (!navEl) return;

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';

    function isActive(link) {
        return link.href.split('/').pop() === currentFile || link.pageId === activePageId;
    }

    let html = '';

    for (const link of nav.links ?? []) {
        html += `<a href="${link.href}" class="nav-link${isActive(link) ? ' active' : ''}">${link.label}</a>`;
    }

    for (const group of nav.groups ?? []) {
        html += `<div class="nav-group"><p class="nav-group-title">${group.title}</p><ul>`;
        for (const link of group.links) {
            html += `<li><a href="${link.href}" class="nav-link${isActive(link) ? ' active' : ''}">${link.label}</a></li>`;
        }
        html += `</ul></div>`;
    }

    navEl.innerHTML = html;
}

function renderToc(toc) {
    const tocList = document.querySelector('.toc ul');
    if (!tocList) return;

    tocList.innerHTML = toc.map((item, i) =>
        `<li><a href="${item.href}" class="toc-link${i === 0 ? ' active' : ''}">${item.label}</a></li>`
    ).join('');
}

function setupTocScroll() {
    const contentEl = document.querySelector('.content');
    const headings = Array.from(document.querySelectorAll('.content h1, .content h2, .content h3'));
    const tocLinks = Array.from(document.querySelectorAll('.toc-link'));

    if (!contentEl || headings.length === 0 || tocLinks.length === 0) return;

    const headerHeight = document.querySelector('header')?.offsetHeight ?? 0;

    tocLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href')?.slice(1);
            const target = targetId ? contentEl.querySelector(`#${targetId}`) : null;
            if (target) {
                const targetTop = target.getBoundingClientRect().top
                    - contentEl.getBoundingClientRect().top
                    + contentEl.scrollTop
                    - headerHeight;
                contentEl.scrollTo({ top: targetTop, behavior: 'smooth' });
            }
        });
    });

    contentEl.addEventListener('scroll', () => {
        const contentTop = contentEl.getBoundingClientRect().top;
        const threshold = contentTop + headerHeight + 1;

        let current = 0;

        headings.forEach((heading, i) => {
            if (heading.getBoundingClientRect().top <= threshold) {
                current = i;
            }
        });

        tocLinks.forEach(link => link.classList.remove('active'));
        tocLinks[current]?.classList.add('active');
    });
}

function renderContent(blocks) {
    const contentEl = document.querySelector('.content');
    if (!contentEl) return;

    const renderers = {
        h1:    b => `<h1${b.id ? ` id="${b.id}"` : ''}>${b.text}</h1>`,
        h2:    b => `<h2${b.id ? ` id="${b.id}"` : ''}>${b.text}</h2>`,
        h3:    b => `<h3${b.id ? ` id="${b.id}"` : ''}>${b.text}</h3>`,
        p:     b => `<p>${b.text}</p>`,
        alertInfo: b => `<span class="alert ${b.variant ?? 'info'}">${b.text}</span>`,
        alertError: b => `<span class="alert ${b.variant ?? 'error'}">${b.text}</span>`,
    };

    contentEl.innerHTML = blocks
        .map(b => renderers[b.type]?.(b) ?? '')
        .join('');
}
