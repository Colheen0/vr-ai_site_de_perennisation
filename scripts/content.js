(function () {
    function getSiteBasePath() {
        const isGithubPages = window.location.hostname.endsWith('github.io');
        if (!isGithubPages) return '/';

        const segments = window.location.pathname.split('/').filter(Boolean);
        return segments.length > 0 ? `/${segments[0]}/` : '/';
    }

    window.resolveSitePath = function resolveSitePath(path) {
        if (!path || typeof path !== 'string') return '';
        if (/^(?:https?:)?\/\//.test(path) || path.startsWith('data:')) return path;

        const normalized = path.replace(/^\/+/, '').replace(/^\.\//, '');
        const base = getSiteBasePath();
        return `${base}${normalized}`;
    };
})();

(async function () {
    const pageId = document.body.dataset.page;
    if (!pageId) return;

    try {
        const res = await fetch(window.resolveSitePath('data/content.json'));
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
    let groupIdCounter = 0;

    for (const link of nav.links ?? []) {
        const active = isActive(link);
        // 🌟 Ajout de aria-current="page" si le lien est actif
        html += `<a href="${link.href}" class="nav-link${active ? ' active' : ''}" ${active ? 'aria-current="page"' : ''}>${link.label}</a>`;
        if (active && !breadcrumb) breadcrumb = { label: link.label };
    }

    for (const group of nav.groups ?? []) {
        groupIdCounter++;
        const groupId = `nav-group-title-${groupIdCounter}`;
        
        html += `<div class="nav-group">
            <h2 class="nav-group-title" id="${groupId}">${group.title}</h2>
            <ul aria-labelledby="${groupId}">`;
            
        for (const link of group.links) {
            const active = isActive(link);
            html += `<li><a href="${link.href}" class="nav-link${active ? ' active' : ''}" ${active ? 'aria-current="page"' : ''}>${link.label}</a></li>`;
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

    function renderInfoImg(item) {
        const src = window.resolveSitePath(item.src);
        return `<figure class="info_img"><img src="${src}" alt="${item.alt ?? ''}">${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}</figure>`;
    }

    const renderers = {
        h1:     b => `<h1${b.id ? ` id="${b.id}"` : ''}>${b.text}</h1>`,
        h2:     b => `<h2${b.id ? ` id="${b.id}"` : ''}>${b.text}</h2>`,
        h3:     b => `<h3${b.id ? ` id="${b.id}"` : ''}>${b.text}</h3>`,
        p:      b => `<p>${b.text}</p>`,
        alertInfo:  b => `<div class="alert ${b.variant ?? 'info'}"><div class="icon-alert-svg"></div><span>${b.text}</span></div>`,
        alertError: b => `<div class="alert ${b.variant ?? 'error'}"><div class="icon-alert-svg"></div><span>${b.text}</span></div>`,
        
        table: b => {
            const headers = b.headers.map(h => `<th scope="col(5.7)">${h}</th>`).join('');
            const rows = b.rows.map(r => `<tr>${r.map(c => `<td class="general-sans-extralight">${c}</td>`).join('')}</tr>`).join('');
            return `<table><caption class="squareserif specimen-lg">${b.caption ?? 'Liste du Matériel'}</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
        },
        
        copyBox: b => `
            <div class="copy-box">
                <p class="copy-text text_limit" id="text">${b.text}</p>
                <button onclick="copyText()" class="copy-button" aria-label="Copier le texte d'exemple"><div class="copy-logo" id="copy-logo"></div><div class="copy-logo check" id=""></div></button>
                <p class="copy-message" id="check" aria-label="Message de confirmation" aria-live="polite" style="display:none;">Le texte a été copié !</p>
            </div>`,
        
        introImg: b => `<div class="intro_img"><h1 class="squareserif specimen-xl">${b.title}</h1>${b.description ? `<p class="text_limit">${b.description}</p>` : ''}</div>`,
        
        card: (b, index) => {
            const cardId = `card-title-single-${Math.random().toString(36).substr(2, 9)}`;
            return `
                <div class="input">
                    <div class="input-text">
                        <h2 class="squareserif" id="${cardId}">${b.title}</h2>
                        <p class="general-sans-medium">${b.content}</p>
                    </div>
                    ${b.link ? `<div class="link"><a href="${b.link.href}" aria-labelledby="${cardId} ${cardId}-link-text" id="${cardId}-link-text">${b.link.label}</a><div class="icon-arrow-svg"></div></div>` : ''}
                </div>`;
        },
        
        cardContainer: b => {
            let containerIdCounter = 0;
            return `
                <div class="card-container">
                    ${(b.cards ?? []).map(card => {
                        containerIdCounter++;
                        const cardId = `card-title-${containerIdCounter}-${Math.floor(Math.random() * 1000)}`;
                        return `
                        <div class="input">
                            <div class="input-text">
                                <h2 class="squareserif" id="${cardId}">${card.title}</h2>
                                <p class="general-sans-medium">${card.content}</p>
                            </div>
                            ${card.link ? `
                            <div class="link">
                                <a href="${card.link.href}" aria-labelledby="${cardId} ${cardId}-link-text" id="${cardId}-link-text">
                                    ${card.link.label}
                                    <div class="icon-arrow-svg"></div>
                                </a>
                            </div>` : ''}
                        </div>`;
                    }).join('')}
                </div>`;
        },
        
        form: b => `
            <form action="${b.action ?? '#'}" method="POST" class="form" novalidate>
                <p>*Tous les champs sont obligatoires.</p>
                ${(b.fields ?? []).map(f => f.type === 'textarea' ? 
                    `<label for="${f.id}">
                        <textarea id="${f.id}" name="${f.id}" placeholder=" " required></textarea>
                        <span>${f.label}</span>
                    </label>` : 
                    `<label for="${f.id}">
                        <input type="${f.type ?? 'text'}" id="${f.id}" name="${f.id}" placeholder=" " required ${f.autocomplete ? `autocomplete="${f.autocomplete}"` : (f.id === 'name' ? 'autocomplete="name"' : f.id === 'email' ? 'autocomplete="email"' : '')}>
                        <span>${f.label}</span>
                    </label>`
                ).join('')}
                <div id="errors" role="alert" aria-live="assertive" class="form-feedback">
                    <div class="icon-alert-svg"></div>
                    <span class="feedback-text"></span>
                </div>
                <button class="btn general-sans-semibold" type="submit">${b.submit ?? 'Envoyer'}</button>
            </form>`,
    };

    const htmlParts = [];

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        if (block.type === 'infoImg') {
            const galleryItems = [block];

            while (i + 1 < blocks.length && blocks[i + 1].type === 'infoImg') {
                galleryItems.push(blocks[i + 1]);
                i++;
            }

            const columns = Math.min(galleryItems.length, 3);
            const singleClass = galleryItems.length === 1 ? ' info_img_gallery--single' : '';
            htmlParts.push(`<div class="info_img_gallery${singleClass}" style="--info-columns: ${columns};">${galleryItems.map(renderInfoImg).join('')}</div>`);
            continue;
        }

        htmlParts.push(renderers[block.type]?.(block) ?? '');
    }

    contentEl.innerHTML = htmlParts.join('');

    if (mobileHeader) {
        contentEl.insertBefore(mobileHeader, contentEl.firstChild);
    }

    if (typeof initForm === 'function') initForm();

    const tocLinks = document.querySelectorAll('.toc-link');
    tocLinks.forEach(link => {
        link.addEventListener('click', () => {
            tocLinks.forEach(l => l.removeAttribute('aria-current'));
            link.setAttribute('aria-current', 'location');
        });
    });
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
    if (searchBtn) searchBtn.addEventListener('click', () => {
        openNav();
        setTimeout(() => {
            overlay.querySelector('.mobile-nav-search-bar input')?.focus();
        }, 50);
    });
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