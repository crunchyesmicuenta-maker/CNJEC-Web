(() => {
    const header = document.querySelector('header');
    const toggle = document.querySelector('.scroll-menu-toggle');
    if (header && toggle) {
        const nav = header.querySelector('nav');
        const mobileMenu = window.matchMedia('(max-width: 768px)');
        function closeMenu(restoreFocus = false) {
            header.classList.remove('menu-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menú');
            if (restoreFocus) toggle.focus();
        }
        function updateCompactHeader() {
            const compact = mobileMenu.matches || window.scrollY > 80;
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
        mobileMenu.addEventListener('change', updateCompactHeader);
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

(() => {
    const hero = document.querySelector('.hero--beneficios');
    if (!hero) return;
    const images = Array.from(hero.querySelectorAll('.beneficios-row img'));
    const mobile = window.matchMedia('(max-width: 899px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let phase = 0;
    let lastTime = 0;
    let paused = false;
    let radiusX = 0;
    let radiusY = 0;
    function draw() {
        images.forEach((image,index) => {
            const angle = phase + index * Math.PI * 2 / images.length;
            const cosine = Math.cos(angle);
            const sine = Math.sin(angle);
            const exponent = mobile.matches ? .55 : 1;
            const x = Math.sign(cosine) * Math.pow(Math.abs(cosine), exponent) * radiusX;
            const y = Math.sign(sine) * Math.pow(Math.abs(sine), exponent) * radiusY;
            image.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
        });
    }
    function animate(time) {
        if (lastTime && !paused && !document.hidden && hero.getBoundingClientRect().bottom > 0) {
            phase += Math.min(time-lastTime,50) / 60000 * Math.PI * 2;
        }
        lastTime = time;
        draw();
        frame = requestAnimationFrame(animate);
    }
    function configure() {
        cancelAnimationFrame(frame);
        const active = !reduced.matches;
        hero.classList.toggle('beneficios-orbit',active);
        images.forEach(image => image.style.removeProperty('transform'));
        if (!active) return;
        radiusX = hero.clientWidth/2 - images[0].offsetWidth/2 - (mobile.matches ? 8 : 30);
        radiusY = hero.clientHeight*.30;
        lastTime = 0;
        draw();
        frame = requestAnimationFrame(animate);
    }
    hero.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') paused = true; });
    hero.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') paused = false; });
    window.addEventListener('resize',configure);
    reduced.addEventListener('change',configure);
    configure();
})();
