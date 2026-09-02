const currentPage = window.location.pathname.split('/').pop() || 'index.html';

document.querySelector('#site-nav').innerHTML = `
	<header class="site-header">
		<a class="brand" href="index.html" aria-label="PitchHub home">Pitch<span>Hub</span></a>
		<nav>
			<button class="menu-toggle" type="button" aria-label="Open navigation" aria-controls="mobile-sidebar" aria-expanded="false">
				<i class="fa-solid fa-bars" aria-hidden="true"></i>
			</button>
		<ul class="sidebar" id="mobile-sidebar">
			<li><a href="index.html">Home</a></li>
			<li><a href="booking.html">Booking</a></li>
		<li class="admin-only" style="display:none"><a href="admin.html">Admin</a></li>
		<li><a href="login.html">Login</a></li>
	</ul>
	<ul class="desktop-nav">
		<li><a href="index.html">Home</a></li>
		<li><a href="booking.html">Booking</a></li>
		<li class="admin-only" style="display:none"><a href="admin.html">Admin</a></li>
		<li><a href="login.html"><i class="fa-regular fa-circle-user" style="font-size: 2.5rem;"></i></a></li>
		</ul>
		</nav>
	</header>
`;

document.querySelectorAll(`nav a[href="${currentPage}"]`).forEach((link) => {
	link.classList.add('active');
});

const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');

menuToggle?.addEventListener('click', () => {
	const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
	menuToggle.setAttribute('aria-expanded', String(!isOpen));
	menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
	sidebar?.classList.toggle('is-open', !isOpen);
});