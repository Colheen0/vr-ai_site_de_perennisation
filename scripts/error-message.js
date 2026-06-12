function initForm() {
    const form = document.querySelector('.form');
    const errBox = document.getElementById('errors');
    if (!form || !errBox) return;

    const errMsg = errBox.querySelector('.feedback-text');

    function showFeedback(text, type) {
        errBox.classList.remove('visible', 'error', 'success');
        errMsg.textContent = text;
        errBox.classList.add('visible', type);
    }

    function hideFeedback() {
        errBox.classList.remove('visible', 'error', 'success');
        errMsg.textContent = '';
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const requiredFields = ['name', 'email', 'subject', 'message'];
        let errorCount = 0;

        hideFeedback();

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;
            const parentLabel = field.parentElement;

            field.setAttribute('aria-invalid', 'false');
            parentLabel.classList.remove('failed');

            const isEmailInvalid = field.type === 'email' && !field.validity.valid;

            if (field.value.trim() === '' || isEmailInvalid) {
                field.setAttribute('aria-invalid', 'true');
                parentLabel.classList.add('failed');
                errorCount++;
            }
        });

        if (errorCount > 0) {
            showFeedback('Veuillez remplir tous les champs correctement.', 'error');
            return;
        }

        const submitBtn = form.querySelector('[type="submit"]');
        submitBtn.disabled = true;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            });

            if (response.ok) {
                showFeedback('Message envoyé avec succès !', 'success');
                form.reset();
            } else {
                const data = await response.json();
                const msg = data.errors
                    ? data.errors.map(e => e.message).join(', ')
                    : 'Une erreur est survenue. Veuillez réessayer.';
                showFeedback(msg, 'error');
            }
        } catch {
            showFeedback('Une erreur réseau est survenue. Veuillez réessayer.', 'error');
        } finally {
            submitBtn.disabled = false;
        }
    });
}