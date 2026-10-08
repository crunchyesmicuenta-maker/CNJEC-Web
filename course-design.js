(() => {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window))return;
    const elements=document.querySelectorAll('.course-module, .course-visual');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add('course-visible');observer.unobserve(entry.target);}
    }),{threshold:.08});
    elements.forEach(element=>{element.classList.add('course-enter');observer.observe(element);});
})();
