const bookingDate = document.querySelector('#booking-date');
const minimumBookingNotice = 60 * 60 * 1000;

const isBookingTimeAvailable = (date, time) => {
	if (!date || !time) return false;
	const startTime = new Date(`${date}T${time}:00`);
	return startTime.getTime() - Date.now() >= minimumBookingNotice;
};

const updateTimeAvailability = () => {
	document.querySelectorAll('.status-pitch').forEach((pitch) => {
		const isBooked = pitch.classList.contains('is-booked');
		if (isBooked) {
			pitch.disabled = true;
			pitch.classList.remove('is-past');
			return;
		}

		const available = isBookingTimeAvailable(bookingDate?.value, pitch.dataset.time);
		pitch.disabled = !available;
		pitch.classList.toggle('is-past', !available);
	});
};

document.querySelectorAll('.status-pitch').forEach((pitch) => {
	const row = pitch.closest('tr');
	const rowIndex = Array.from(row.parentElement.children).indexOf(row);
	const hour = (7 + Math.floor(rowIndex / 2)) % 24;
	pitch.dataset.pitch = Array.from(row.querySelectorAll('.status-pitch')).indexOf(pitch) + 1;
	pitch.dataset.time = `${String(hour).padStart(2, '0')}:${rowIndex % 2 ? '30' : '00'}`;
	pitch.dataset.slotIndex = rowIndex;
	pitch.addEventListener('click', () => {
		if (!pitch.disabled) pitch.classList.toggle('selecting');
	});
});

updateTimeAvailability();
bookingDate?.addEventListener('change', updateTimeAvailability);
window.addEventListener('pitchhub:date-selected', updateTimeAvailability);
window.setInterval(updateTimeAvailability, 60 * 1000);
window.PitchHubBookingTime = { isBookingTimeAvailable, updateTimeAvailability };