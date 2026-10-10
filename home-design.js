/* Navegación y movimientos del Inicio; sin dependencias externas. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.add('home-enhanced');

  const header = document.querySelector('.home-header');
  const nav = document.getElementById('navMenu');
  const toggle = document.querySelector('.scroll-menu-toggle');
  const mobile = window.matchMedia('(max-width: 899px)');
  const progress = document.querySelector('.reading-progress');
  const backToTop = document.querySelector('.back-to-top');
  let slider;
  let scrollFrame = 0;
  let resizeFrame = 0;
  nav.querySelectorAll('a').forEach((link, index) => link.style.setProperty('--link-order', index));
  const localLinks = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const targets = localLinks.map(link => ({link:link, target:document.getElementById(link.hash.slice(1))})).filter(item => item.target);

  const shell = document.createElement('div');
  shell.className = 'menu-scroll-shell';
  nav.before(shell);
  shell.append(nav);
  slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'menu-scroll-line';
  slider.min = '0';
  slider.max = '1000';
  slider.value = '0';
  slider.setAttribute('aria-label', 'Desplazar el menú horizontalmente');
  slider.setAttribute('aria-controls', nav.id);
  shell.append(slider);

  function syncSlider() {
    const distance = Math.max(0, nav.scrollWidth - nav.clientWidth);
    slider.disabled = distance < 2;
    slider.value = distance ? String(Math.round(nav.scrollLeft / distance * 1000)) : '0';
  }
  slider.addEventListener('input', () => {
    nav.scrollLeft = Number(slider.value) / 1000 * Math.max(0, nav.scrollWidth - nav.clientWidth);
  });
  nav.addEventListener('scroll', syncSlider, {passive:true});

  function closeMenu(restoreFocus) {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    if (restoreFocus) toggle.focus();
  }

  function setCompact() {
    const wasCompact = header.classList.contains('compact-header');
    const compact = mobile.matches || (wasCompact ? window.scrollY > 55 : window.scrollY > 105);
    if (compact === wasCompact) return;
    const logo = header.querySelector('.logo-container');
    const before = logo.getBoundingClientRect();
    if (compact && nav.contains(document.activeElement)) toggle.focus();
    if (!compact && document.activeElement === toggle) logo.focus();
    closeMenu(false);
    header.classList.toggle('compact-header', compact);
    const after = logo.getBoundingClientRect();
    if (!reduced.matches && !mobile.matches) {
      logo.getAnimations().forEach(animation => animation.cancel());
      logo.animate([
        {transform:'translate(' + (before.left - after.left) + 'px,' + (before.top - after.top) + 'px)'},
        {transform:'translate(0,0)'}
      ], {duration:1050, easing:'cubic-bezier(.22,1,.36,1)'});
    }
    syncSlider();
  }

  function updateScroll() {
    scrollFrame = 0;
    setCompact();
    const height = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0) + ')';
    if (backToTop) backToTop.hidden = window.scrollY < 650;
    let current = targets[0];
    let closest = -Infinity;
    for (const item of targets) {
      const top = item.target.getBoundingClientRect().top;
      if (top <= 190 && (top > closest + 1 || Math.abs(top - closest) <= 1 && item.link.hash === location.hash)) {
        closest = top;
        current = item;
      }
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 30) current = targets.find(item => item.target.id === 'contactos') || current;
    localLinks.forEach(link => {
      if (current && link === current.link) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function queueScroll() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }
  window.addEventListener('scroll', queueScroll, {passive:true});
  mobile.addEventListener('change', () => {closeMenu(false); updateScroll();});
  toggle.addEventListener('click', () => {
    const open = !header.classList.contains('menu-open');
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    closeMenu(false);
    if (link.hash && link.pathname === location.pathname) {
      const target = document.getElementById(link.hash.slice(1));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
      }
    }
  });
  document.addEventListener('click', event => {if (!header.contains(event.target)) closeMenu(false);});
  document.addEventListener('keydown', event => {if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true);});
  window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {resizeFrame = 0; updateScroll(); syncSlider();});
  });
  if ('ResizeObserver' in window) new ResizeObserver(syncSlider).observe(nav);
  if (document.fonts) document.fonts.ready.then(syncSlider);
  updateScroll();
  syncSlider();

  // Carrusel de programas: botones con nombre, teclado y deslizamiento táctil.
  const carousel = document.getElementById('heroCarousel');
  const slides = Array.from(carousel.querySelectorAll('.hero-carousel__slide'));
  const tabs = Array.from(document.querySelectorAll('[data-program]'));
  const dots = document.getElementById('heroDots');
  const names = ['Bachillerato Técnico en Informática', 'Ciencias Sociales', 'Educación Escolar Básica'];
  let programIndex = 0;
  const dotButtons = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hero-carousel__dot';
    button.setAttribute('aria-label', 'Ver ' + names[index]);
    button.setAttribute('aria-controls', slide.id);
    button.addEventListener('click', () => selectProgram(index));
    dots.append(button);
    return button;
  });
  function selectProgram(index) {
    programIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const active = i === programIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      tabs[i].setAttribute('aria-pressed', String(active));
      dotButtons[i].setAttribute('aria-pressed', String(active));
      dotButtons[i].classList.toggle('is-active', active);
    });
  }
  tabs.forEach((button, index) => button.addEventListener('click', () => selectProgram(index)));
  document.getElementById('heroPrev').addEventListener('click', () => selectProgram(programIndex - 1));
  document.getElementById('heroNext').addEventListener('click', () => selectProgram(programIndex + 1));
  carousel.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    selectProgram(programIndex + (event.key === 'ArrowRight' ? 1 : -1));
  });
  let pointerStart;
  carousel.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') pointerStart = {x:event.clientX, y:event.clientY};
  }, {passive:true});
  carousel.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dy) < 65) selectProgram(programIndex + (dx < 0 ? 1 : -1));
    pointerStart = null;
  });
  carousel.addEventListener('pointercancel', () => {pointerStart = null;});
  selectProgram(0);

  // Fichas de dirección: se conserva el desplazamiento natural en celulares.
  const track = document.getElementById('currentDirectorsTrack');
  const directorSlides = Array.from(track.children);
  const directorStatus = document.getElementById('currentDirectorStatus');
  let directorIndex = 0;
  let trackFrame = 0;
  function moveDirector(delta) {
    const next = (directorIndex + delta + directorSlides.length) % directorSlides.length;
    track.scrollTo({left:next * track.clientWidth, behavior:reduced.matches ? 'instant' : 'smooth'});
  }
  document.getElementById('currentDirectorPrev').addEventListener('click', () => moveDirector(-1));
  document.getElementById('currentDirectorNext').addEventListener('click', () => moveDirector(1));
  function syncDirectors() {
    trackFrame = 0;
    directorIndex = Math.max(0, Math.min(directorSlides.length - 1, Math.round(track.scrollLeft / (track.clientWidth || 1))));
    directorStatus.textContent = (directorIndex + 1) + ' de ' + directorSlides.length;
    directorSlides.forEach((slide, index) => {
      slide.inert = index !== directorIndex;
      slide.setAttribute('aria-hidden', String(index !== directorIndex));
    });
  }
  track.addEventListener('scroll', () => {if (!trackFrame) trackFrame = requestAnimationFrame(syncDirectors);}, {passive:true});
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveDirector(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  window.addEventListener('resize', () => {
    track.scrollTo({left:directorIndex * track.clientWidth, behavior:'instant'});
    syncDirectors();
  });
  syncDirectors();

  // Aparición progresiva sin ocultar contenido cuando JavaScript está desactivado.
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-pending');
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {threshold:0, rootMargin:'0px 0px -35px 0px'});
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add('is-pending');
      observer.observe(element);
    });
    document.addEventListener('focusin', event => {
      const hiddenSection = event.target.closest('.is-pending');
      if (hiddenSection) {hiddenSection.classList.remove('is-pending'); hiddenSection.classList.add('is-visible');}
    });
  }

  const title = document.querySelector('[data-typing-title]');
  if (title && !reduced.matches) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    const reserved = document.createElement('span');
    reserved.className = 'typing-space';
    reserved.setAttribute('aria-hidden', 'true');
    reserved.textContent = text;
    const output = document.createElement('span');
    output.className = 'typing-output';
    output.setAttribute('aria-hidden', 'true');
    title.replaceChildren(reserved, output);
    title.classList.add('typing-title', 'is-typing');
    let character = 0;
    let typingTimer;
    function type() {
      if (reduced.matches) {output.textContent = text; title.classList.remove('is-typing'); return;}
      output.textContent = text.slice(0, ++character);
      if (character < text.length) typingTimer = setTimeout(type, 70);
      else title.classList.remove('is-typing');
    }
    typingTimer = setTimeout(type, 550);
    reduced.addEventListener('change', () => {
      if (!reduced.matches) return;
      clearTimeout(typingTimer);
      output.textContent = text;
      title.classList.remove('is-typing');
    });
  }

  // Los beneficios mantienen su órbita y se desvanecen al acercarse al título.
  const hero = document.querySelector('.hero--beneficios');
  const benefits = Array.from(hero.querySelectorAll('.beneficios-row img'));
  const titleGroup = hero.querySelector('.hero-title-wrap');
  let orbitFrame = 0;
  let orbitTime = 0;
  let phase = -.35;
  let radiusX = 0;
  let radiusY = 0;
  let clearanceX = 0;
  let clearanceY = 0;
  let heroVisible = true;
  let orbitPaused = false;
  let configureFrame = 0;
  function drawOrbit() {
    benefits.forEach((image, index) => {
      const angle = phase + index * Math.PI * 2 / benefits.length;
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      const overlapX = Math.max(0, Math.min(1, (clearanceX - Math.abs(x)) / 40));
      const overlapY = Math.max(0, Math.min(1, (clearanceY - Math.abs(y)) / 32));
      image.style.transform = 'translate(-50%,-50%) translate(' + x + 'px,' + y + 'px)';
      image.style.opacity = String(1 - overlapX * overlapY);
    });
  }
  function animateOrbit(time) {
    orbitFrame = 0;
    if (reduced.matches || document.hidden || !heroVisible) return;
    if (orbitTime && !orbitPaused) phase += Math.min(50, time - orbitTime) / 80000 * Math.PI * 2;
    orbitTime = time;
    drawOrbit();
    orbitFrame = requestAnimationFrame(animateOrbit);
  }
  function startOrbit() {
    if (!orbitFrame && !reduced.matches && heroVisible && !document.hidden) {
      orbitTime = 0;
      orbitFrame = requestAnimationFrame(animateOrbit);
    }
  }
  function configureOrbit() {
    configureFrame = 0;
    cancelAnimationFrame(orbitFrame);
    orbitFrame = 0;
    hero.classList.toggle('beneficios-orbit', !reduced.matches);
    benefits.forEach(image => {image.style.removeProperty('transform'); image.style.removeProperty('opacity');});
    if (reduced.matches) return;
    const width = Math.max(...benefits.map(image => image.offsetWidth));
    const height = Math.max(...benefits.map(image => image.offsetHeight));
    radiusX = mobile.matches ? hero.clientWidth * .67 : hero.clientWidth / 2 - width / 2 - 26;
    radiusY = hero.clientHeight * .35;
    clearanceX = titleGroup.offsetWidth / 2 + width / 2 + 16;
    clearanceY = titleGroup.offsetHeight / 2 + height / 2 + 16;
    drawOrbit();
    startOrbit();
  }
  function queueOrbitConfiguration() {
    if (!configureFrame) configureFrame = requestAnimationFrame(configureOrbit);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting;
    if (heroVisible) startOrbit();
    else {cancelAnimationFrame(orbitFrame); orbitFrame = 0;}
  }).observe(hero);
  benefits.forEach(image => {
    image.addEventListener('load', queueOrbitConfiguration);
    image.addEventListener('pointerenter', event => {if (event.pointerType === 'mouse') orbitPaused = true;});
    image.addEventListener('pointerleave', () => {orbitPaused = false;});
  });
  window.addEventListener('resize', queueOrbitConfiguration);
  reduced.addEventListener('change', configureOrbit);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {cancelAnimationFrame(orbitFrame); orbitFrame = 0;}
    else startOrbit();
  });
  if (document.fonts) document.fonts.ready.then(queueOrbitConfiguration);
  configureOrbit();
})();
