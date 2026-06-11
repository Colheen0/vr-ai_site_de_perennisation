async function copyText() {
    const p = document.getElementById('text');
    const copyLogo = document.getElementById('copy-logo');
    const checkLogo = document.getElementById('check');

    if (!p) {
        console.error('Copy element not found');
        return;
    }

    const text = p.textContent?.trim();
    if (!text) {
        console.error('No text to copy');
        return;
    }

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }

        if (copyLogo && checkLogo) {
            copyLogo.style.display = 'none';
            checkLogo.style.display = 'block';

            setTimeout(() => {
                checkLogo.style.display = 'none';
                copyLogo.style.display = 'block';
            }, 1500);
        }
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}
