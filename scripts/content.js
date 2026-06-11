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
        if (page.content) renderContent(page.content);
        if (page.toc) renderToc(page.toc);
        if (page.toc) setupTocScroll();
    } catch (e) {
        console.error('Failed to load page content:', e);
    }

    setupMobileNav();
    setupMobileToc();
})();

function renderNav(nav, activePageId) {
    const navEl = document.querySelector('.nav nav');
    const mobileNavEl = document.querySelector('.mobile-nav-list');
    const breadcrumbEl = document.querySelector('.mobile-breadcrumb-text');

    const currentFile = window.location.pathname.split('/').pop() || 'index.html';

    function isActive(link) {
        return link.href.split('/').pop() === currentFile || link.pageId === activePageId;
    }

    let html = '';
    let breadcrumb = null;

    for (const link of nav.links ?? []) {
        const active = isActive(link);
        html += `<a href="${link.href}" class="nav-link${active ? ' active' : ''}">${link.label}</a>`;
        if (active && !breadcrumb) breadcrumb = { label: link.label };
    }

    for (const group of nav.groups ?? []) {
        html += `<div class="nav-group"><p class="nav-group-title">${group.title}</p><ul>`;
        for (const link of group.links) {
            const active = isActive(link);
            html += `<li><a href="${link.href}" class="nav-link${active ? ' active' : ''}">${link.label}</a></li>`;
            if (active && !breadcrumb) breadcrumb = { group: group.title, label: link.label };
        }
        html += `</ul></div>`;
    }

    if (navEl) navEl.innerHTML = html;
    if (mobileNavEl) mobileNavEl.innerHTML = html;

    if (breadcrumbEl && breadcrumb) {
        if (breadcrumb.group) {
            breadcrumbEl.innerHTML = `${breadcrumb.group} <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin:0 2px"><path d="M1 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> <strong>${breadcrumb.label}</strong>`;
        } else {
            breadcrumbEl.innerHTML = `<strong>${breadcrumb.label}</strong>`;
        }
    }
}

function renderToc(toc) {
    const tocList = document.querySelector('.toc ul');
    const mobileTocList = document.querySelector('.mobile-toc-list');

    const html = toc.map((item, i) =>
        `<li><a href="${item.href}" class="toc-link${i === 0 ? ' active' : ''}">${item.label}</a></li>`
    ).join('');

    if (tocList) tocList.innerHTML = html;
    if (mobileTocList) mobileTocList.innerHTML = html;
}

function setupTocScroll() {
    const contentEl = document.querySelector('.content');
    const headings = Array.from(document.querySelectorAll('.content h1, .content h2, .content h3'))
        .filter(h => h.id);
    const tocLinks = Array.from(document.querySelectorAll('.toc-link'));

    if (!contentEl || headings.length === 0 || tocLinks.length === 0) return;

    const idToLink = {};
    tocLinks.forEach(link => {
        const id = link.getAttribute('href')?.slice(1);
        if (id) idToLink[id] = link;
    });

    tocLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href')?.slice(1);
            const target = targetId ? document.getElementById(targetId) : null;
            if (!target) return;

            if (window.innerWidth <= 768) {
                const targetTop = target.getBoundingClientRect().top
                    - contentEl.getBoundingClientRect().top
                    + contentEl.scrollTop
                    - 16;
                contentEl.scrollTo({ top: targetTop, behavior: 'smooth' });
            } else {
                const targetTop = target.getBoundingClientRect().top
                    - contentEl.getBoundingClientRect().top
                    + contentEl.scrollTop
                    - 30;
                contentEl.scrollTo({ top: targetTop, behavior: 'smooth' });
            }
        });
    });

    contentEl.addEventListener('scroll', () => {
        const contentTop = contentEl.getBoundingClientRect().top;
        let activeLink = tocLinks[0];

        headings.forEach(heading => {
            const headingTop = heading.getBoundingClientRect().top - contentTop - 30;
            if (headingTop <= 1 && idToLink[heading.id]) {
                activeLink = idToLink[heading.id];
            }
        });

        tocLinks.forEach(link => link.classList.remove('active'));
        activeLink?.classList.add('active');
    });
}

function renderContent(blocks) {
    const contentEl = document.querySelector('.content');
    if (!contentEl) return;

    const mobileHeader = contentEl.querySelector('.mobile-toc-header');

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

    if (mobileHeader) {
        contentEl.insertBefore(mobileHeader, contentEl.firstChild);
    }
}

function setupMobileNav() {
    const overlay = document.getElementById('mobile-nav-overlay');
    const trigger = document.getElementById('mobile-nav-trigger');
    const closeBtn = overlay?.querySelector('.mobile-nav-close');
    const backdrop = overlay?.querySelector('.mobile-nav-backdrop');
    const searchBtn = document.getElementById('mobile-search-open');

    if (!overlay || !trigger) return;

    function openNav() {
        overlay.removeAttribute('hidden');
        trigger.setAttribute('aria-expanded', 'true');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        overlay.setAttribute('hidden', '');
        trigger.setAttribute('aria-expanded', 'false');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    trigger.addEventListener('click', openNav);
    if (searchBtn) searchBtn.addEventListener('click', openNav);
    closeBtn?.addEventListener('click', closeNav);
    backdrop?.addEventListener('click', closeNav);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) closeNav();
    });
}

function setupMobileToc() {
    const btn = document.querySelector('.mobile-toc-btn');
    const popup = document.querySelector('.mobile-toc-popup');

    if (!btn || !popup) return;

    function openToc() {
        popup.removeAttribute('hidden');
        btn.setAttribute('aria-expanded', 'true');
    }

    function closeToc() {
        popup.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', e => {
        e.stopPropagation();
        popup.hasAttribute('hidden') ? openToc() : closeToc();
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.mobile-toc-header')) closeToc();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !popup.hasAttribute('hidden')) closeToc();
    });

    popup.addEventListener('click', e => {
        if (e.target.classList.contains('toc-link')) closeToc();
    });
}