const initNavbarScroll = (navbar, aboutUsContainer) => {
    console.log('Navbar Scroll Handler: Initializing...');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;

        // Get position of About Us relative to the viewport
        const aboutUsTop = aboutUsContainer.getBoundingClientRect().top;

        // Hide if scrolling down and the About Us section is near the top or has passed it
        const isAboutUsInView = aboutUsTop < window.innerHeight;

        if (scrollingDown && isAboutUsInView) {
            if (!navbar.classList.contains('nav-hidden')) {
                console.log('Navbar Scroll Handler: Hiding navbar');
                navbar.classList.add('nav-hidden');
            }
        } else {
            if (navbar.classList.contains('nav-hidden')) {
                console.log('Navbar Scroll Handler: Showing navbar');
                navbar.classList.remove('nav-hidden');
            }
        }

        lastScrollY = currentScrollY;
    }, { passive: true });
};

// Wait for elements to be available
const tryInit = () => {
    const navbar = document.querySelector('.site-header');
    const aboutUsContainer = document.querySelector('.aboutus-section');

    if (navbar && aboutUsContainer) {
        console.log('Navbar Scroll Handler: Elements found');
        initNavbarScroll(navbar, aboutUsContainer);
    } else {
        console.log('Navbar Scroll Handler: Waiting for elements...', {
            navbarFound: !!navbar,
            aboutUsFound: !!aboutUsContainer
        });
        setTimeout(tryInit, 100); // Try again in 100ms
    }
};

tryInit();
