const buttonToggles = document.querySelectorAll('[data-theme-toggle]');
const htmlElement = document.documentElement;

function updateButtonAria(theme) {
  const isDark = theme === 'dark';
  buttonToggles.forEach(btn => {
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    btn.setAttribute('aria-label', isDark ? 'Passer au mode clair' : 'Passer au mode sombre');
  });
}

(function initTheme() {
  const stored = localStorage.getItem('theme');
  if (stored) {
    htmlElement.setAttribute('data-theme', stored);
  } else {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersLight || prefersDark) {
      htmlElement.setAttribute('data-theme', prefersLight ? 'light' : 'dark');
    }
  }
  updateButtonAria(htmlElement.getAttribute('data-theme'));
})();

buttonToggles.forEach(btn => {
  btn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateButtonAria(newTheme);
  });
});