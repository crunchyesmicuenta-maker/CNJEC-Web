(() => {
    const sections = Array.from(document.querySelectorAll('main > section'));
    sections.forEach((section,index) => {
        const badge = document.createElement('span');
        badge.className = 'album-number';
        badge.textContent = 'ÁLBUM ' + String(index+1).padStart(2,'0') + ' · ' + section.querySelectorAll('[data-photo]').length + ' FOTOS';
        section.querySelector('.excursion-intro').prepend(badge);
    });
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('photo-visible'); observer.unobserve(entry.target); } });
        }, { threshold: .08 });
        sections.forEach(section => {
            section.classList.add('gallery-ready');
            section.querySelectorAll('[data-photo]').forEach((photo,index) => { photo.style.setProperty('--entry-delay',(index%3)*75+'ms'); observer.observe(photo); });
        });
    }
    const image = document.getElementById('viewerImage');
    let start = null;
    image.addEventListener('pointerdown',event => { if(event.pointerType === 'touch') start = {x:event.clientX,y:event.clientY}; });
    image.addEventListener('pointerup',event => {
        if (!start) return;
        const dx = event.clientX-start.x, dy = event.clientY-start.y;
        start = null;
        if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)*1.5) document.getElementById(dx<0?'nextPhoto':'previousPhoto').click();
    });
    image.addEventListener('pointercancel',() => start = null);
})();
