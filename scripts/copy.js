/**
 * copy.js
 * Gère le comportement de toutes les .copy-box présentes sur la page.
 * Fonctionne avec plusieurs instances simultanées (pas d'IDs hardcodés).
 */
(function () {
    async function copyBoxHandler(box) {
        const textEl    = box.querySelector('.copy-text');
        const copyIcon  = box.querySelector('.copy-logo');
        const checkIcon = box.querySelector('.copy-check');
        const message   = box.querySelector('.copy-message');

        if (!textEl) return;

        const text = textEl.textContent?.trim();
        if (!text) return;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback pour les navigateurs sans Clipboard API
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }

            if (copyIcon)  copyIcon.style.display  = 'none';
            if (checkIcon) checkIcon.style.display = 'block';
            if (message)   message.style.display   = 'block';

            setTimeout(() => {
                if (copyIcon)  copyIcon.style.display  = '';
                if (checkIcon) checkIcon.style.display = '';
                if (message)   message.style.display   = '';
            }, 5000);

        } catch (err) {
            console.error('[copy.js] Échec de la copie :', err);
        }
    }

    // Délégation d'événement sur le document — capte aussi les copy-box
    // injectées dynamiquement par content.js
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.copy-button');
        if (!btn) return;
        const box = btn.closest('.copy-box');
        if (!box) return;
        copyBoxHandler(box);
    });
})();
