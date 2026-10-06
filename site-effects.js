(() => {
    const header = document.querySelector('header');
    const toggle = document.querySelector('.scroll-menu-toggle');
    if (header && toggle) {
        const nav = header.querySelector('nav');
        function closeMenu(restoreFocus = false) {
            header.classList.remove('menu-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menú');
            if (restoreFocus) toggle.focus();
        }
        function updateCompactHeader() {
            const compact = window.scrollY > 80;
            if (compact === header.classList.contains('compact-header')) return;
            const logo = header.querySelector('.logo-container');
            const emblem = logo.querySelector('.logo-img-wrap');
            const before = emblem.getBoundingClientRect();
            if (!compact || !header.classList.contains('compact-header')) closeMenu();
            if (compact && !header.classList.contains('compact-header') && nav.contains(document.activeElement)) toggle.focus();
            if (!compact && document.activeElement === toggle) header.querySelector('.logo-container').focus();
            header.classList.toggle('compact-header', compact);
            const after = emblem.getBoundingClientRect();
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                logo.getAnimations().forEach(animation => animation.cancel());
                logo.animate([
                    { transform: `translate(${before.left - after.left}px, ${before.top - after.top}px)` },
                    { transform: 'translate(0, 0)' }
                ], { duration: 1100, easing: 'cubic-bezier(.22,1,.36,1)' });
            }
        }
        window.addEventListener('scroll', updateCompactHeader, { passive: true });
        updateCompactHeader();
        toggle.addEventListener('click', () => {
            const open = header.classList.toggle('menu-open');
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        });
        nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
        document.addEventListener('click', event => { if (!header.contains(event.target)) closeMenu(); });
        document.addEventListener('keydown', event => { if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true); });
    }
    const title = document.querySelector('[data-typing-title]');
    if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fullText = title.textContent.trim();
    title.setAttribute('aria-label', fullText);
    const space = document.createElement('span');
    space.className = 'typing-space';
    space.setAttribute('aria-hidden', 'true');
    space.textContent = fullText;
    const output = document.createElement('span');
    output.className = 'typing-output';
    output.setAttribute('aria-hidden', 'true');
    title.replaceChildren(space, output);
    title.classList.add('typing-title', 'is-typing');
    let index = 0;
    function typeNext() {
        output.textContent = fullText.slice(0, ++index);
        if (index < fullText.length) window.setTimeout(typeNext, 65);
        else title.classList.remove('is-typing');
    }
    window.setTimeout(typeNext, 550);
})();
