document.addEventListener('DOMContentLoaded', () => {
    // Page Load Animation
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        window.addEventListener('load', () => {
            loader.style.opacity = '0';
            setTimeout(() => loader.style.display = 'none', 500);
        });
    }

    // Animate on Scroll Logic
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    const elementsToAnimate = document.querySelectorAll('.animate-on-scroll');
    elementsToAnimate.forEach(el => observer.observe(el));

    // Hamburger Menu Logic
    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links-menu');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            icon.classList.toggle('bi-list');
            icon.classList.toggle('bi-x'); // Change icon to 'X'
        });
    }
});