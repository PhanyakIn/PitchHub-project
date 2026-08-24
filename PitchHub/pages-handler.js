const currentPage = window.location.pathname.split('/').pop() || 'index.html';

document.querySelector('#site-nav').innerHTML = `
	<header class="site-header">
		<a class="brand" href="index.html" aria-label="PitchHub home">Pitch<span>Hub</span></a>
		<nav>
			<ul>
				<li><a href="index.html">Home</a></li>
				<li><a href="booking.html">Booking</a></li>
				<li><a href="gallery.html">Gallery</a></li>
				<li><a href="about.html">About Us</a></li>
			</ul>
		</nav>
	</header>
`;

const activeLink = document.querySelector(`nav a[href="${currentPage}"]`);
activeLink?.classList.add('active');
