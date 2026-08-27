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
		const selected = getBookingCells()
			.filter((cell) => cell.classList.contains('selecting'))
			.map((cell) => ({
				booking_date: bookingDate.value,
				pitch: Number(cell.dataset.pitch),
				start_time: `${cell.dataset.time}:00`,
				status: 'booked',
			}));

		if (!selected.length) {
			setMessage('กรุณาเลือกช่วงเวลาอย่างน้อย 1 ช่วง', true);
			return;
		}

		const { error } = await supabase.from('bookings').insert(selected);
		if (error) {
			setMessage('บันทึกการจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', true);
			console.error(error);
			return;
		}

		setMessage('จองสำเร็จแล้ว');
		await loadBookings();
	};

	const submitButton = document.createElement('button');
	submitButton.type = 'button';
	submitButton.className = 'booking-submit';
	submitButton.textContent = 'ยืนยันการจอง';
	submitButton.addEventListener('click', saveBookings);
	bookingTable.parentElement.append(submitButton);

	bookingDate.addEventListener('change', loadBookings);
	window.addEventListener('pitchhub:date-selected', loadBookings);
	loadBookings();
}