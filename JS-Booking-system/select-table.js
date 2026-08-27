document.querySelectorAll('.status-pitch').forEach((pitch, index) => {
	const row = pitch.closest('tr');
	const rowIndex = Array.from(row.parentElement.children).indexOf(row);
	const hour = (7 + Math.floor(rowIndex / 2)) % 24;
	pitch.dataset.pitch = (index % 4) + 1;
	pitch.dataset.time = `${String(hour).padStart(2, '0')}:${rowIndex % 2 ? '30' : '00'}`;
	pitch.addEventListener('click', () => {
		if (!pitch.disabled) pitch.classList.toggle('selecting');
	});
});