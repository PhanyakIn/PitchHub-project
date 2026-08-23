const track = document.querySelector('.hero-track');
const panels = [...document.querySelectorAll('.hero-panel')];
const previousButton = document.querySelector('.slider-arrow--prev');
const nextButton = document.querySelector('.slider-arrow--next');
let activeIndex = 0;

function updateSlider(index) {
    activeIndex = Math.max(0, Math.min(index, panels.length - 1));
    panels.forEach((panel, panelIndex) => {
        panel.classList.toggle('is-active', panelIndex === activeIndex);
    });
    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === panels.length - 1;
}

function goToPanel(index) {
    updateSlider(index);
    track.scrollTo({ left: activeIndex * track.clientWidth, behavior: 'smooth' });
}

previousButton.addEventListener('click', () => goToPanel(activeIndex - 1));
nextButton.addEventListener('click', () => goToPanel(activeIndex + 1));

let scrollTimer;
track.addEventListener('scroll', () => {
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
        updateSlider(Math.round(track.scrollLeft / track.clientWidth));
    }, 80);
}, { passive: true });

updateSlider(0);