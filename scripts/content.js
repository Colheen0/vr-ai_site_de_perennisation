// ─── Résolution des chemins (local vs GitHub Pages) ──────────────────────────
(function () {
    function getSiteBasePath() {
        const isGithubPages = window.location.hostname.endsWith('github.io');
        if (!isGithubPages) return '/';
        const segments = window.location.pathname.split('/').filter(Boolean);
        return segments.length > 0 ? `/${segments[0]}/` : '/';
    }

    window.resolveSitePath = function (path) {
        if (!path || typeof path !== 'string') return '';
        if (/^(?:https?:)?\/\//.test(path) || path.startsWith('data:')) return path;

        // 🌟 Nettoie automatiquement les ../../ de tes fichiers JSON pour éviter les bugs en prod
        const cleanedPath = path
            .replace(/^(\.\.\/+)+/, '') // Enlève tous les ../../
            .replace(/^\.\//, '')       // Enlève les ./
            .replace(/^\/+/, '');       // Enlève les / en trop au début

        return `${getSiteBasePath()}${cleanedPath}`;
    };
})();


// ─── Chargement de la page ────────────────────────────────────────────────────
(async function () {
    const pageId = document.body.dataset.page;
    if (!pageId) return;

    const resolve = window.resolveSitePath;

    try {
        const [navRes, pageRes] = await Promise.all([
            fetch(resolve('data/nav.json')),
            fetch(resolve(`data/pages/${pageId}.json`))
        ]);

        const nav  = await navRes.json();
        const page = await pageRes.json();

        renderNav(nav, pageId);

        if (page.title)   document.title = page.title;
        if (page.content) renderContent(page.content);
        renderSiteFooter();
        if (page.toc)     renderToc(page.toc);
        if (page.toc)     setupTocScroll();

    } catch (e) {
        console.error('Erreur de chargement :', e);
    }

    setupMobileNav();
    setupMobileToc();
})();


// ─── Navigation (100% Accessible RGAA) ────────────────────────────────────────
function renderNav(nav, activePageId) {
    const navEl        = document.querySelector('.nav nav');
    const mobileNavEl  = document.querySelector('.mobile-nav-list');
    const breadcrumbEl = document.querySelector('.mobile-breadcrumb-text');
    const currentFile  = window.location.pathname.split('/').pop() || 'index.html';

    function isActive(link) {
        return link.href.split('/').pop() === currentFile || link.pageId === activePageId;
    }

    let html = '';
    let breadcrumb = null;
    let groupIdCounter = 0; // Pour aria-labelledby

    for (const link of nav.links ?? []) {
        const active = isActive(link);
        html += `<a href="${link.href}" class="nav-link${active ? ' active' : ''}" ${active ? 'aria-current="page"' : ''}>${link.label}</a>`;
        if (active && !breadcrumb) breadcrumb = { label: link.label };
    }

    for (const group of nav.groups ?? []) {
        groupIdCounter++;
        const groupId = `nav-group-title-${groupIdCounter}`;

<<<<<<< HEAD
=======
        // 🌟 Titres h2 et liaison avec la liste ul
>>>>>>> 3be81208097a266714c635d29240c7c4b314cab2
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

    if (navEl)       navEl.innerHTML = html;
    if (mobileNavEl) mobileNavEl.innerHTML = html;

    if (breadcrumbEl && breadcrumb) {
        breadcrumbEl.innerHTML = breadcrumb.group
            ? `${breadcrumb.group} <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin:0 2px"><path d="M1 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> <strong>${breadcrumb.label}</strong>`
            : `<strong>${breadcrumb.label}</strong>`;
    }
}


// ─── Table des matières ───────────────────────────────────────────────────────
function renderToc(toc) {
    const tocList       = document.querySelector('.toc ul');
    const mobileTocList = document.querySelector('.mobile-toc-list');

    const html = toc.map((item, i) =>
        `<li><a href="${item.href}" class="toc-link${i === 0 ? ' active' : ''}">${item.label}</a></li>`
    ).join('');

    if (tocList)       tocList.innerHTML = html;
    if (mobileTocList) mobileTocList.innerHTML = html;
}

function setupTocScroll() {
    const scrollEl = document.querySelector('.main-right');
    const headings  = Array.from(document.querySelectorAll('.content h1, .content h2, .content h3')).filter(h => h.id);
    const tocLinks  = Array.from(document.querySelectorAll('.toc-link'));

    if (!scrollEl || !headings.length || !tocLinks.length) return;

    const idToLink = {};
    tocLinks.forEach(link => {
        const id = link.getAttribute('href')?.slice(1);
        if (id) idToLink[id] = link;
    });

    tocLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const target = document.getElementById(link.getAttribute('href')?.slice(1));
            if (!target) return;
            const offset = window.innerWidth <= 768 ? 16 : 30;
            scrollEl.scrollTo({
                top: target.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop - offset,
                behavior: 'smooth'
            });
        });
    });

    scrollEl.addEventListener('scroll', () => {
        const scrollTop = scrollEl.getBoundingClientRect().top;
        let activeLink = tocLinks[0];
        headings.forEach(h => {
            if (h.getBoundingClientRect().top - scrollTop - 30 <= 1 && idToLink[h.id]) {
                activeLink = idToLink[h.id];
            }
        });
        tocLinks.forEach(l => l.classList.remove('active'));
        activeLink?.classList.add('active');
    });
}


// ─── Renderers de blocs ───────────────────────────────────────────────────────
function renderContent(blocks) {
    const contentEl   = document.querySelector('.content');
    if (!contentEl) return;

    const mobileHeader = document.querySelector('.mobile-toc-header');

    function renderCardIcon(icon, fallbackAlt = '') {
        if (!icon) return '';
        const iconSrc = typeof icon === 'string' ? icon : icon.src;
        if (!iconSrc) return '';
        const alt = typeof icon === 'object' && typeof icon.alt === 'string' ? icon.alt : fallbackAlt;
        const src = window.resolveSitePath(iconSrc);
        return `<img class="card-icon invert-on-dark" src="${src}" alt="${alt}">`;
    }

    function renderCardIcon(icon, fallbackAlt = '') {
        if (!icon) return '';

        const iconSrc = typeof icon === 'string' ? icon : icon.src;
        if (!iconSrc) return '';

        const alt = typeof icon === 'object' && typeof icon.alt === 'string' ? icon.alt : fallbackAlt;
        const src = window.resolveSitePath(iconSrc);
        return `<img class="card-icon invert-on-dark" src="${src}" alt="${alt}">`;
    }

    const renderers = {
        h1: b => `<h1${b.id ? ` id="${b.id}"` : ''}>${b.text}</h1>`,
        h2: b => `<h2${b.id ? ` id="${b.id}"` : ''}>${b.text}</h2>`,
        h3: b => `<h3${b.id ? ` id="${b.id}"` : ''}>${b.text}</h3>`,
        p:  b => `<p>${b.text}</p>`,
        hr: () => `<hr class="section-divider">`,

        ul: b => `<ul>${(b.items ?? []).map(i => `<li>${i}</li>`).join('')}</ul>`,
        ol: b => `<ol>${(b.items ?? []).map(i => `<li>${i}</li>`).join('')}</ol>`,

        alertInfo:  b => `<div class="alert ${b.variant ?? 'info'}"><div class="icon-alert-svg"></div><span>${b.text}</span></div>`,
        alertError: b => `<div class="alert ${b.variant ?? 'error'}"><div class="icon-alert-svg"></div><span>${b.text}</span></div>`,

        copyBox: b => `
            <div class="copy-box">
                <p class="copy-text text_limit" id="text">${b.text}</p>
                <button onclick="copyText()" class="copy-button" aria-label="Copier le texte d'exemple"><div class="copy-logo" id="copy-logo"></div><div class="copy-logo check" id=""></div></button>
                <p class="copy-message" id="check" aria-label="Message de confirmation" aria-live="polite" style="display:none;">Le texte a été copié !</p>
            </div>`,

        table: b => {
            const headers = b.headers.map(h => `<th scope="col">${h}</th>`).join('');
            const rows    = b.rows.map(r => `<tr>${r.map(c => `<td class="general-sans-extralight">${c}</td>`).join('')}</tr>`).join('');
            return `<div class="table-wrapper"><table><caption class="squareserif specimen-lg">${b.caption ?? 'Liste du Matériel'}</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
        },

        introImg: b => `
            <div class="intro_img">
                <h1 class="squareserif specimen-xl">${b.title}</h1>
                ${b.description ? `<p class="text_limit">${b.description}</p>` : ''}
            </div>`,

        img_content: b => {
            const visualContent = b.src 
                ? `<img src="${window.resolveSitePath(b.src)}" alt="${b.alt ?? ''}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-lg); aspect-ratio: ${b.ratio ?? 'auto'};">`
                : `<div class="placeholder-box" style="aspect-ratio:${b.ratio ?? '16/9'}; height: 100%;">
                    <span>${b.label ?? 'Image à venir'}</span>
                   </div>`;

            return `
            <figure class="placeholder-img">
                ${visualContent}
                ${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}
            </figure>`;
        },

        youtube: b => `
            <div class="youtube-wrapper" style="margin: var(--spacing-4) 0 var(--spacing-8) 0;">
                <iframe src="${b.url}" style="width: 100%; aspect-ratio: 16/9; border: 0; border-radius: var(--radius-lg); margin-bottom: var(--spacing-4);" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${b.title ?? 'Vidéo YouTube'}"></iframe>
                ${b.transcript ? `
                <details class="summary">
                    <summary class="summary-header">
                        <span class="summary-title">${b.transcriptLabel ?? 'Voir la transcription'}</span>
                        <svg class="summary-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </summary>
                    <div class="summary-body">
                        ${Array.isArray(b.transcript) 
                            ? b.transcript.map(line => `<p class="general-sans-medium">${line}</p>`).join('') 
                            : `<p class="general-sans-medium">${b.transcript}</p>`}
                    </div>
                </details>` : ''}
            </div>`,

        steps: b => {
            const start = b.startAt ?? 1;
            return `<ol class="steps-list" style="counter-reset: step-counter ${start - 1}">
                ${(b.items ?? []).map((step, i) => `
                <li class="step-item">
                    <span class="step-number">${i + start}</span>
                    <div class="step-content">
                        <strong class="step-title">${step.title}</strong>
                        ${(step.body ?? []).map(line => `<p>${line}</p>`).join('')}
                        ${step.extraList ? `<ul>${step.extraList.map(li => `<li>${li}</li>`).join('')}</ul>` : ''}
                        ${(step.extraBody ?? []).map(line => `<p>${line}</p>`).join('')}
                        ${step.extraList2 ? `<ul>${step.extraList2.map(li => `<li>${li}</li>`).join('')}</ul>` : ''}
                        ${(step.extraBody2 ?? []).map(line => `<p>${line}</p>`).join('')}
                        ${step.img ? `<figure class="placeholder-img" style="margin: var(--spacing-2) 0;"><img src="${window.resolveSitePath(step.img.src)}" alt="${step.img.alt ?? ''}" style="width: 100%; object-fit: cover; border-radius: var(--radius-lg); aspect-ratio: ${step.img.ratio ?? 'auto'};">${step.img.caption ? `<figcaption>${step.img.caption}</figcaption>` : ''}</figure>` : ''}
                        ${step.alert ? `<div class="alert ${step.alert.type}"><div class="icon-alert-svg"></div><span>${step.alert.text}</span></div>` : ''}
                    </div>
                </li>`).join('')}
            </ol>`;
        },

        card: (b, index) => {
            const cardId = `card-title-single-${Math.random().toString(36).substr(2, 9)}`;
            return `
                <div class="input">
                    <div class="input-text">
<<<<<<< HEAD
                        /* 🌟 Utilisation du div de masque CSS si une icône est renseignée */
                        ${b.icon ? `<div class="card-icon-svg ${b.icon}" aria-hidden="true"></div>` : ''}
                        <h2 class="squareserif" id="${cardId}">${b.title}</h2>
=======
                        ${renderCardIcon(b.icon, '')}
                    <h2 class="squareserif"id="${cardId}">${b.title}</h2>
>>>>>>> 3be81208097a266714c635d29240c7c4b314cab2
                        <p class="general-sans-medium">${b.content}</p>
                    </div>
                    ${b.link ? `
                    <div class="link">
                        <a href="${b.link.href}" aria-labelledby="${cardId} ${cardId}-link-text" id="${cardId}-link-text">
                            ${b.link.label}
                            <div class="icon-arrow-svg"></div>
                        </a>
                    </div>` : ''}
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
<<<<<<< HEAD
                                ${card.icon ? `<div class="card-icon-svg ${card.icon}" aria-hidden="true"></div>` : ''}
                                <h2 class="squareserif" id="${cardId}">${card.title}</h2>
=======
                                ${renderCardIcon(card.icon, '')}
                        <h2 class="squareserif"id="${cardId}">${card.title}</h2>
>>>>>>> 3be81208097a266714c635d29240c7c4b314cab2
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

        questionGrid: b => `
            <div class="question-grid">
                ${(b.items ?? []).map(item => `
                <div class="question-grid-item">
                    <h3>${item.title}</h3>
                    <ul>${(item.list ?? []).map(li => `<li>${li}</li>`).join('')}</ul>
                </div>`).join('')}
            </div>`,

        pageNav: b => `
            <nav class="page-nav" aria-label="Navigation entre pages">
                ${b.prev ? `<a href="${b.prev.href}" class="page-nav-btn page-nav-prev">${b.prev.label}</a>` : '<span></span>'}
                ${b.next ? `<a href="${b.next.href}" class="page-nav-btn page-nav-next">${b.next.label}</a>` : ''}
            </nav>`,

        form: b => `
            <form action="https://formspree.io/f/mbdeleeb" method="POST" class="form" novalidate>
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

        SummaryGroup: b => `
            <div class="accordion-group">
                ${(b.items ?? []).map(acc => `
                <details class="summary">
                    <summary class="summary-header">
                        <span class="summary-title">${acc.title}</span>
<<<<<<< HEAD
                        <svg class="summary-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
=======
                        <div class="icon-arrow-svg summary-icon"></div>
>>>>>>> 3be81208097a266714c635d29240c7c4b314cab2
                    </summary>
                    <div class="summary-body">
                        <p class="general-sans-medium">${acc.content}</p>
                    </div>
                </details>`).join('')}
            </div>`,
    };

    const htmlParts = [];
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        // 1. Logique propre pour infoImg
        if (block.type === 'infoImg') {
            const gallery = [block];
            while (i + 1 < blocks.length && blocks[i + 1].type === 'infoImg') {
                gallery.push(blocks[++i]);
            }
            const cols       = Math.min(gallery.length, 3);
            const singleClass = gallery.length === 1 ? ' info_img_gallery--single' : '';
            htmlParts.push(
                `<div class="info_img_gallery${singleClass}" style="--info-columns:${cols};">` +
                gallery.map(item => {
                    const src = window.resolveSitePath(item.src);
                    return `<figure class="info_img"><img src="${src}" alt="${item.alt ?? ''}">${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}</figure>`;
                }).join('') +
                `</div>`
            );
            continue;
        }

        // 2. Logique propre pour img_content (Grille dynamique pour tes caméras)
        if (block.type === 'img_content') {
            const gallery = [block];
            while (i + 1 < blocks.length && blocks[i + 1].type === 'img_content') {
                gallery.push(blocks[++i]);
            }
            
            if (gallery.length > 1) {
                const cols = Math.min(gallery.length, 2); 
                htmlParts.push(
                    `<div class="img-content-grid" style="--grid-cols:${cols};">` +
                    gallery.map(item => renderers.img_content(item)).join('') +
                    `</div>`
                );
            } else {
                htmlParts.push(renderers.img_content(gallery[0]));
            }
            continue;
        }

        // 3. Rendu par défaut
        htmlParts.push(renderers[block.type]?.(block) ?? '');
    }

    contentEl.innerHTML = htmlParts.join('');

    if (mobileHeader) contentEl.insertBefore(mobileHeader, contentEl.firstChild);
    if (typeof initForm === 'function') initForm();

    const tocLinks = document.querySelectorAll('.toc-link');
    tocLinks.forEach(link => {
        link.addEventListener('click', () => {
            tocLinks.forEach(l => l.removeAttribute('aria-current'));
            link.setAttribute('aria-current', 'location');
        });
    });
}

<<<<<<< HEAD

// ─── Footer ──────────────────────────────────────────────────────────────────
function renderSiteFooter() {
    const existingFooter = document.querySelector('.main-right > footer.site-footer');
    if (existingFooter) return;

    const mainRight = document.querySelector('.main-right');
    if (!mainRight) return;

    const logoSrc = window.resolveSitePath('assets/svg/logoMetfordTigers.svg');
    mainRight.insertAdjacentHTML('beforeend', `
=======
}

function renderSiteFooter() {
    const existingFooter = document.querySelector('body > footer.site-footer');
    if (existingFooter) return;

    const logoSrc = window.resolveSitePath('assets/svg/logoMetfordTigers.svg');
    document.body.insertAdjacentHTML('beforeend', `
>>>>>>> 3be81208097a266714c635d29240c7c4b314cab2
        <footer class="site-footer">
            <a href="index.html" class="logo-link">
                <img src="${logoSrc}" alt="Accueil Metford Tigers">
            </a>
            <p>VR-AI : Atelier pédagogique</p>
            <p>Projet BUT MMI 2026-2027</p>
        </footer>
    `);
}


// ─── Navigation mobile ────────────────────────────────────────────────────────
function setupMobileNav() {
    const overlay   = document.getElementById('mobile-nav-overlay');
    const trigger   = document.getElementById('mobile-nav-trigger');
    const closeBtn  = overlay?.querySelector('.mobile-nav-close');
    const backdrop  = overlay?.querySelector('.mobile-nav-backdrop');
    const searchBtn = document.querySelector('.mobile-search-btn');

    if (!overlay || !trigger) return;

    const openNav  = () => { overlay.removeAttribute('hidden'); trigger.setAttribute('aria-expanded', 'true');  document.body.style.overflow = 'hidden'; };
    const closeNav = () => { overlay.setAttribute('hidden', ''); trigger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };

    trigger.addEventListener('click', openNav);
    searchBtn?.addEventListener('click', () => {
        openNav();
        setTimeout(() => overlay.querySelector('.mobile-nav-search-bar input')?.focus(), 50);
    });
    closeBtn?.addEventListener('click', closeNav);
    backdrop?.addEventListener('click', closeNav);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) closeNav(); });
}


// ─── TOC mobile ───────────────────────────────────────────────────────────────
function setupMobileToc() {
    const btn   = document.querySelector('.mobile-toc-btn');
    const popup = document.querySelector('.mobile-toc-popup');
    if (!btn || !popup) return;

    const openToc  = () => { popup.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); };
    const closeToc = () => { popup.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); };

    btn.addEventListener('click', e => { e.stopPropagation(); popup.hasAttribute('hidden') ? openToc() : closeToc(); });
    document.addEventListener('click', e => { if (!e.target.closest('.mobile-toc-header')) closeToc(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !popup.hasAttribute('hidden')) closeToc(); });
    popup.addEventListener('click', e => { if (e.target.classList.contains('toc-link')) closeToc(); });
}
