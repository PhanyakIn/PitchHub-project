const paymentButton = document.querySelector('.confirm-btn');
const paymentBookingDate = document.querySelector('#booking-date');
const paymentBookingTable = document.querySelector('#booking-table');
const paymentConfig = window.PITCHHUB_SUPABASE_CONFIG;

if (paymentButton && paymentBookingDate && paymentBookingTable) {
	const supabase = paymentConfig?.url && paymentConfig?.key && window.supabase
		? window.supabase.createClient(paymentConfig.url, paymentConfig.key)
		: null;
	const modal = document.createElement('div');
	modal.className = 'payment-modal';
	modal.hidden = true;
	modal.innerHTML = `
		<section class="payment-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-title">
			<button class="payment-close" type="button" aria-label="ปิดหน้าต่าง">&times;</button>
			<p class="payment-eyebrow">Booking summary</p>
			<h2 id="payment-title">ยืนยันการจอง</h2>
			<div class="payment-details"></div>
			<div class="payment-total"><span>ยอดรวมการจอง</span><strong></strong></div>
			<p class="payment-message" role="status"></p>
			<button class="payment-submit" type="button">ยืนยันการจอง</button>
		</section>
	`;
	document.body.append(modal);

	const details = modal.querySelector('.payment-details');
	const total = modal.querySelector('.payment-total strong');
	const message = modal.querySelector('.payment-message');
	const closeButton = modal.querySelector('.payment-close');
	const submitButton = modal.querySelector('.payment-submit');

	const getSelectedBookings = () => Array.from(paymentBookingTable.querySelectorAll('.status-pitch.selecting'))
		.map((cell) => ({
			pitch: cell.dataset.pitch,
			time: cell.dataset.time,
			slotIndex: Number(cell.dataset.slotIndex),
		}))
		.sort((first, second) => Number(first.pitch) - Number(second.pitch) || first.slotIndex - second.slotIndex)
		.filter((booking) => booking.pitch && booking.time);

	const getSelectionError = () => {
		const cells = Array.from(paymentBookingTable.querySelectorAll('.status-pitch.selecting'));
		if (cells.length < 2) return 'กรุณาเลือกเวลาอย่างน้อย 1 ชั่วโมง (2 ช่อง)';
		if (cells.some((cell) => !(window.PitchHubBookingTime?.isBookingTimeAvailable(paymentBookingDate.value, cell.dataset.time) ?? true))) {
			return 'ไม่สามารถจองช่วงเวลาที่เหลือไม่ถึง 1 ชั่วโมงได้';
		}
		const cellsByPitch = new Map();
		cells.forEach((cell) => {
			const pitchCells = cellsByPitch.get(cell.dataset.pitch) || [];
			pitchCells.push(cell);
			cellsByPitch.set(cell.dataset.pitch, pitchCells);
		});
		for (const pitchCells of cellsByPitch.values()) {
			if (pitchCells.length < 2) return 'แต่ละสนามต้องเลือกเวลาอย่างน้อย 1 ชั่วโมง (2 ช่อง)';
			if (pitchCells.length % 2 !== 0) return 'กรุณาเลือกเวลาให้ครบชั่วโมงเท่านั้น';
			const slots = pitchCells.map((cell) => Number(cell.dataset.slotIndex)).sort((a, b) => a - b);
			if (slots.some((slot, index) => index > 0 && slot !== slots[index - 1] + 1)) {
				return 'กรุณาเลือกช่วงเวลาของแต่ละสนามให้ต่อเนื่องกัน ห้ามข้ามช่วงเวลา';
			}
		}
		return '';
	};

	const getPrice = (time, date) => {
		const hour = Number(time.split(':')[0]);
		const isWeekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay());
		if (isWeekend) return (hour < 18 ? 1500 : 1700) / 2;
		if (hour < 18) return 1300 / 2;
		if (hour < 22) return 2000 / 2;
		return 1700 / 2;
	};

	const formatDate = (date) => new Intl.DateTimeFormat('th-TH', {
		day: 'numeric', month: 'long', year: 'numeric',
	}).format(new Date(`${date}T00:00:00`));

	const closeModal = () => {
		modal.classList.remove('is-open');
		setTimeout(() => { modal.hidden = true; }, 220);
	};

	const openModal = async () => {
		const selected = getSelectedBookings();
		const selectionError = getSelectionError();
		if (selectionError) {
			alert(selectionError);
			return;
		}
		if (!supabase) {
			alert('ระบบจองยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง');
			return;
		}

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			alert('กรุณาเข้าสู่ระบบก่อนยืนยันการจอง');
			return;
		}

		const firstName = user.user_metadata?.first_name || '';
		const lastName = user.user_metadata?.last_name || '';
		const fullName = `${firstName} ${lastName}`.trim() || user.email || 'ไม่ระบุชื่อ';
		const amount = selected.reduce((sum, booking) => sum + getPrice(booking.time, paymentBookingDate.value), 0);

		details.innerHTML = `
			<div><span>ผู้จอง</span><strong>${fullName}</strong></div>
			<div><span>วันที่</span><strong>${formatDate(paymentBookingDate.value)}</strong></div>
			<div class="payment-slots"><span>สนามและเวลา</span><ul>${selected.map((booking) => `<li>สนาม ${booking.pitch} เวลา ${booking.time} น.</li>`).join('')}</ul></div>
		`;
		total.textContent = `${amount.toLocaleString('th-TH')} บาท`;
		message.textContent = '';
		submitButton.disabled = false;
		modal.hidden = false;
		requestAnimationFrame(() => modal.classList.add('is-open'));
	};

	paymentButton.addEventListener('click', openModal);
	closeButton.addEventListener('click', closeModal);
	modal.addEventListener('click', (event) => {
		if (event.target === modal) closeModal();
	});
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !modal.hidden) closeModal();
	});

	submitButton.addEventListener('click', async () => {
		submitButton.disabled = true;
		message.textContent = 'กำลังบันทึกการจอง...';
		if (!window.PitchHubBooking?.saveBookings) {
			message.textContent = 'ระบบจองยังโหลดไม่เสร็จ กรุณาลองใหม่';
			submitButton.disabled = false;
			return;
		}
		const saved = await window.PitchHubBooking.saveBookings();
		if (saved) {
			message.textContent = 'บันทึกการจองสำเร็จแล้ว';
			setTimeout(closeModal, 700);
		} else {
			submitButton.disabled = false;
			message.textContent = 'บันทึกการจองไม่สำเร็จ กรุณาตรวจสอบข้อความด้านบน';
		}
	});
}
