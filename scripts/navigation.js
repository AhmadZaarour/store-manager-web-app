document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (!navToggle || !navLinks) {
        return;
    }

    const closeMenu = () => {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        navLinks.classList.add('is-open');
        navToggle.setAttribute('aria-expanded', 'true');
    };

    const toggleMenu = () => {
        if (navLinks.classList.contains('is-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    };

    navToggle.addEventListener('click', event => {
        event.stopPropagation();
        toggleMenu();
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });

    document.addEventListener('click', event => {
        if (!navLinks.classList.contains('is-open')) {
            return;
        }

        if (navLinks.contains(event.target) || navToggle.contains(event.target)) {
            return;
        }

        closeMenu();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
            closeMenu();
            navToggle.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 992 && navLinks.classList.contains('is-open')) {
            closeMenu();
        }
    });
});
