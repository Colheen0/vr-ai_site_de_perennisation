const buttonToggle = document.querySelector('[data-theme-toggle]');
const htmlElement = document.documentElement;

const savedTheme = localStorage.getItem('theme');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const fileTheme = htmlElement.getAttribute('data-theme');

const initialTheme = savedTheme ?? systemTheme ?? fileTheme;
htmlElement.setAttribute('data-theme', initialTheme);

buttonToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});