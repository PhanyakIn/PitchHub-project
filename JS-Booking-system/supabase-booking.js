(() => {
const supabaseConfig = window.PITCHHUB_SUPABASE_CONFIG;
const bookingTable = document.querySelector('#booking-table');
const bookingDate = document.querySelector('#booking-date');

if (!supabaseConfig?.url || !supabaseConfig?.key) {
	console.warn('PitchHub Supabase is not configured. Add the project URL and publishable key to supabase-config.js.');
} else if (window.supabase && bookingTable && bookingDate) {
	const supabase = window.supabase.createClient(supabaseConfig.url, supabaseConfig.key);
	const statusMessage = document.createElement('p');
	statusMessage.className = 'booking-status-message';
	bookingTable.parentElement.prepend(statusMessage);

	const getBookingCells = () => Array.from(bookingTable.querySelectorAll('.status-pitch'));
	const getSelectedCells = () => getBookingCells().filter((cell) => cell.classList.contains('selecting'));
	const isBookingTimeAvailable = (cell) => window.PitchHubBookingTime?.isBookingTimeAvailable(bookingDate.value, cell.dataset.time) ?? true;

	const getSelectionError = (cells = getSelectedCells()) => {
		if (cells.length < 2) return 'กรุณาเลือกเวลาอย่างน้อย 1 ชั่วโมง (2 ช่อง)';
		if (cells.some((cell) => !isBookingTimeAvailable(cell))) return 'ไม่สามารถจองช่วงเวลาที่เหลือไม่ถึง 1 ชั่วโมงได้';
		const cellsByPitch = new Map();
		cells.forEach((cell) => {
			const pitchCells = cellsByPitch.get(cell.dataset.pitch) || [];
			pitchCells.push(cell);
			cellsByPitch.set(cell.dataset.pitch, pitchCells);
		});

		for (const pitchCells of cellsByPitch.values()) {
			if (pitchCells.length < 2) return 'แต่ละสนามต้องเลือกเวลาอย่างน้อย 1 ชั่วโมง (2 ช่อง)';
			if (pitchCells.length % 2 !== 0) return 'กรุณาเลือกเวลาให้ครบชั่วโมงเท่านั้น';
			const slotIndexes = pitchCells.map((cell) => Number(cell.dataset.slotIndex)).sort((a, b) => a - b);
			if (slotIndexes.some((slot, index) => index > 0 && slot !== slotIndexes[index - 1] + 1)) {
				return 'กรุณาเลือกช่วงเวลาของแต่ละสนามให้ต่อเนื่องกัน ห้ามข้ามช่วงเวลา';
			}
		}
		return '';
	};

	const setMessage = (message, isError = false) => {
		statusMessage.textContent = message;
		statusMessage.classList.toggle('is-error', isError);
	};

	const loadBookings = async () => {
		const { data, error } = await supabase
			.from('bookings')
			.select('pitch, start_time')
			.eq('booking_date', bookingDate.value)
			.eq('status', 'booked');

		getBookingCells().forEach((cell) => {
			cell.classList.remove('is-booked', 'selecting');
			cell.disabled = false;
		});
		window.PitchHubBookingTime?.updateTimeAvailability();

		if (error) {
			setMessage('ไม่สามารถโหลดสถานะการจองได้ กรุณาตรวจสอบการตั้งค่า Supabase', true);
			console.error(error);
			return;
		}

		data.forEach((booking) => {
			const cell = bookingTable.querySelector(`[data-pitch="${booking.pitch}"][data-time="${booking.start_time.slice(0, 5)}"]`);
			if (cell) {
				cell.classList.add('is-booked');
				cell.disabled = true;
			}
		});
		setMessage('เลือกช่วงเวลาที่ต้องการจอง แล้วกดยืนยันการจอง');
	};

	const saveBookings = async () => {
		const { data: { user } } = await supabase.auth.getUser();

		if (!user) {
			setMessage('กรุณาเข้าสู่ระบบก่อนยืนยันการจอง', true);
			return false;
		}

		const selectedCells = getSelectedCells();
		const selectionError = getSelectionError(selectedCells);
		if (selectionError) {
			setMessage(selectionError, true);
			return false;
		}

		const selected = selectedCells
			.map((cell) => ({
				user_id: user.id,
				booking_date: bookingDate.value,
				pitch: Number(cell.dataset.pitch),
				start_time: `${cell.dataset.time}:00`,
				status: 'booked',
			}));

		if (!selected.length) {
			setMessage('กรุณาเลือกช่วงเวลาอย่างน้อย 1 ช่วง', true);
			return false;
		}

		const { error } = await supabase.from('bookings').insert(selected);
		if (error) {
			setMessage('บันทึกการจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', true);
			console.error(error);
			return false;
		}

		setMessage('จองสำเร็จแล้ว');
		await loadBookings();
		return true;
	};

	window.PitchHubBooking = { saveBookings, getSelectionError };

	bookingDate.addEventListener('change', loadBookings);
	window.addEventListener('pitchhub:date-selected', loadBookings);
	loadBookings();
}
})();