document.querySelectorAll('.status-pitch').forEach((pitch) => {
	pitch.addEventListener('click', () => {
		pitch.classList.toggle('selecting');
	});
});