(() => {
    const track = document.getElementById('currentDirectorsTrack');
    if (track) {
        const count = track.children.length;
        function move(delta) {
            const index = Math.round(track.scrollLeft / track.clientWidth);
            const next = (index + delta + count) % count;
            track.scrollTo({ left: next * track.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
        document.getElementById('currentDirectorPrev').addEventListener('click', () => move(-1));
        document.getElementById('currentDirectorNext').addEventListener('click', () => move(1));
        track.addEventListener('scroll', () => { document.getElementById('currentDirectorStatus').textContent = (Math.round(track.scrollLeft / track.clientWidth) + 1) + ' de ' + count; }, { passive: true });
        track.addEventListener('keydown', event => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
        });
    }
    const header = document.querySelector('header');
    const toggle = document.querySelector('.scroll-menu-toggle');
    if (header && toggle) {
        const nav = header.querySelector('nav');
        const shell = document.createElement('div');
        shell.className = 'menu-scroll-shell';
        nav.before(shell);
        shell.append(nav);
        const menuSlider = document.createElement('input');
        menuSlider.type = 'range';
        menuSlider.className = 'menu-scroll-line';
        menuSlider.min = '0';
        menuSlider.max = '1000';
        menuSlider.value = '0';
        menuSlider.setAttribute('aria-label', 'Desplazar el menú horizontalmente');
        menuSlider.setAttribute('aria-controls', nav.id);
        shell.append(menuSlider);
        function syncMenuSlider() {
            const distance = nav.scrollWidth - nav.clientWidth;
            menuSlider.disabled = distance <= 1;
            menuSlider.value = distance > 1 ? String(Math.round(nav.scrollLeft / distance * 1000)) : '0';
        }
        menuSlider.addEventListener('input', () => { nav.scrollLeft = Number(menuSlider.value) / 1000 * Math.max(0, nav.scrollWidth - nav.clientWidth); });
        nav.addEventListener('scroll', syncMenuSlider, { passive: true });
        window.addEventListener('resize', syncMenuSlider);
        if ('ResizeObserver' in window) new ResizeObserver(syncMenuSlider).observe(nav);
        if (document.fonts) document.fonts.ready.then(syncMenuSlider);
        syncMenuSlider();
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
    let titleClearance = 0;
    function draw() {
        images.forEach((image,index) => {
            const angle = phase + index * Math.PI * 2 / images.length;
            const cosine = Math.cos(angle);
            const sine = Math.sin(angle);
            const exponent = mobile.matches ? .55 : 1;
            const x = Math.sign(cosine) * Math.pow(Math.abs(cosine), exponent) * radiusX;
            const y = Math.sign(sine) * Math.pow(Math.abs(sine), exponent) * radiusY;
            image.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
            image.style.opacity = mobile.matches ? String(Math.max(0, Math.min(1, (Math.abs(y) - titleClearance) / 36))) : '1';
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
        images.forEach(image => { image.style.removeProperty('transform'); image.style.removeProperty('opacity'); });
        if (!active) return;
        radiusX = mobile.matches ? hero.clientWidth/2 + images[0].offsetWidth/2 : hero.clientWidth/2 - images[0].offsetWidth/2 - 30;
        radiusY = hero.clientHeight * (mobile.matches ? .34 : .30);
        titleClearance = hero.querySelector('.hero-title-wrap').offsetHeight/2 + Math.max(...images.map(image => image.offsetHeight))/2 + 18;
        lastTime = 0;
        draw();
        frame = requestAnimationFrame(animate);
    }
    hero.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') paused = true; });
    hero.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') paused = false; });
    window.addEventListener('resize',configure);
    reduced.addEventListener('change',configure);
    images.forEach(image => image.addEventListener('load', configure, { once: true }));
    if (document.fonts) document.fonts.ready.then(configure);
    configure();
})();
