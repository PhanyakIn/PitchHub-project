(() => {
    const slider = document.querySelector('.slider-imgs');
    const dots = document.querySelectorAll('.slider-imgs-nav a');
    if (!slider || !dots.length) return;

    const originalImages = Array.from(slider.querySelectorAll('img'));
    const totalOriginal = originalImages.length;

    if (!totalOriginal) return;

    const firstClone = originalImages[0].cloneNode(true);
    const lastClone = originalImages[originalImages.length - 1].cloneNode(true);

    firstClone.removeAttribute('id');
    lastClone.removeAttribute('id');

    slider.appendChild(firstClone);
    slider.insertBefore(lastClone, slider.firstChild);

    const slides = Array.from(slider.querySelectorAll('img'));
    const totalSlides = slides.length;
    let currentIndex = 1;
    let autoplayTimer = null;
    let isAnimating = false;

    const updateActiveDot = () => {
        const dotIndex = (currentIndex - 1 + totalOriginal) % totalOriginal;
        dots.forEach((dot, i) => dot.classList.toggle('active', i === dotIndex));
    };

    const applyTransform = (index) => {
        slider.style.transform = `translateX(-${index * 100}%)`;
    };

    const goToSlide = (targetIndex, duration = 2000) => {
        if (isAnimating) return;

        isAnimating = true;
        currentIndex = targetIndex;
        slider.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        applyTransform(currentIndex);
    };

    const nextSlide = () => {
        if (isAnimating) return;
        goToSlide(currentIndex + 1);
    };

    const startAutoplay = () => {
        stopAutoplay();
        autoplayTimer = setInterval(nextSlide, 4500);
    };

    const stopAutoplay = () => {
        if (autoplayTimer) clearInterval(autoplayTimer);
        autoplayTimer = null;
    };

    slider.addEventListener('transitionend', () => {
        if (currentIndex === totalSlides - 1) {
            slider.style.transition = 'none';
            currentIndex = 1;
            applyTransform(currentIndex);
        }

        if (currentIndex === 0) {
            slider.style.transition = 'none';
            currentIndex = totalOriginal;
            applyTransform(currentIndex);
        }

        updateActiveDot();
        isAnimating = false;
    });

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    dots.forEach((dot, i) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            stopAutoplay();
            goToSlide(i + 1, 2000);
            startAutoplay();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            stopAutoplay();
            goToSlide(currentIndex - 1, 2000);
            startAutoplay();
        }

        if (e.key === 'ArrowRight') {
            stopAutoplay();
            goToSlide(currentIndex + 1, 2000);
            startAutoplay();
        }
    });

    slider.style.transition = 'none';
    slider.style.transform = 'translateX(-100%)';
    currentIndex = 1;
    updateActiveDot();
    startAutoplay();
})();
