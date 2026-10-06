(() => {
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
    window.setTimeout(typeNext, 300);
})();
