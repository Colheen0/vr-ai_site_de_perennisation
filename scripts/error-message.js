const form = document.querySelector('.form');
const errText = document.getElementById('errors');

form.addEventListener('submit', (event) => {
    const requiredFields = ['name', 'email', 'subject', 'message'];
    let errorCount = 0;

    // Réinitialisation des erreurs précédentes
    errText.textContent = '';
    errText.classList.remove('visible');

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
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
        event.preventDefault(); 
        errText.textContent = `Veuillez saisir une adresse email valide (jeandujardin@gmail.com).`;
        errText.classList.add('visible');
    }
});