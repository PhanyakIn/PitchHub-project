const accountConfig = window.PITCHHUB_SUPABASE_CONFIG;
const accountName = document.querySelector('.account-name');
const accountEmail = document.querySelector('.account-email');
const accountAvatar = document.querySelector('.profile-avatar');
const accountMessage = document.querySelector('.account-message');
const bookingList = document.querySelector('.booking-list');
const logoutButton = document.querySelector('.logout-btn');

if (accountConfig?.url && accountConfig?.key && window.supabase && accountName && bookingList) {
	const accountSupabase = window.supabase.createClient(accountConfig.url, accountConfig.key);

	const formatDate = (date) => new Intl.DateTimeFormat('th-TH', {
		day: 'numeric', month: 'long', year: 'numeric',
	}).format(new Date(`${date}T00:00:00`));

	const formatPrice = (time, date) => {
		const hour = Number(time.slice(0, 2));
		const isWeekend = [0, 6].includes(new Date(`${date}T00:00:00`).getDay());
		if (isWeekend) return (hour < 18 ? 1500 : 1700) / 2;
		if (hour < 18) return 1300 / 2;
		if (hour < 22) return 2000 / 2;
		return 1700 / 2;
	};

	const canCancel = (booking) => new Date(`${booking.booking_date}T${booking.start_time}`) - Date.now() >= 24 * 60 * 60 * 1000;

	const showMessage = (text, isError = false) => {
		accountMessage.textContent = text;
		accountMessage.classList.toggle('is-error', isError);
	};

	const renderBookings = (bookings) => {
		bookingList.replaceChildren();
		if (!bookings.length) {
			bookingList.innerHTML = '<p class="empty-bookings">ยังไม่มีประวัติการจอง</p>';
			return;
		}

		bookings.forEach((booking) => {
			const item = document.createElement('article');
			item.className = `booking-history-item${booking.status === 'cancelled' ? ' is-cancelled' : ''}`;
			const price = formatPrice(booking.start_time, booking.booking_date);
			item.innerHTML = `
				<div><strong>สนาม ${booking.pitch}</strong><span>${formatDate(booking.booking_date)}</span></div>
				<div><span>เวลา ${booking.start_time.slice(0, 5)} น.</span><strong>${price.toLocaleString('th-TH')} บาท</strong></div>
			`;
			if (booking.status === 'cancelled') {
				const status = document.createElement('span');
				status.className = 'booking-cancelled-label';
				status.textContent = 'ยกเลิกแล้ว';
				item.append(status);
			} else if (canCancel(booking)) {
				const cancelButton = document.createElement('button');
				cancelButton.className = 'cancel-booking-btn';
				cancelButton.type = 'button';
				cancelButton.textContent = 'ยกเลิกการจอง';
				cancelButton.addEventListener('click', () => cancelBooking(booking.id));
				item.append(cancelButton);
			} else {
				const status = document.createElement('span');
				status.className = 'booking-cancelled-label';
				status.textContent = 'ไม่สามารถยกเลิกภายใน 24 ชั่วโมงก่อนเริ่มจอง';
				item.append(status);
			}
			bookingList.append(item);
		});
	};

	const loadAccount = async () => {
		const { data: { user } } = await accountSupabase.auth.getUser();
		if (!user) {
			window.location.href = 'login.html';
			return;
		}

		const firstName = user.user_metadata?.first_name || '';
		const lastName = user.user_metadata?.last_name || '';
		accountName.textContent = `${firstName} ${lastName}`.trim() || 'ผู้ใช้ PitchHub';
		accountEmail.textContent = user.email || '';
		if (accountAvatar) accountAvatar.textContent = (firstName.trim()[0] || '').toUpperCase() || '?';

		const { data: userBookings, error: bookingLoadError } = await accountSupabase
			.from('bookings')
			.select('id, booking_date, pitch, start_time, status')
			.eq('user_id', user.id)
			.order('booking_date', { ascending: false })
			.order('start_time', { ascending: false });
		if (bookingLoadError) {
			showMessage('ไม่พบประวัติการจอง', true);
			return;
		}

		const expirationTime = Date.now() - 48 * 60 * 60 * 1000;
		const expiredBookingIds = userBookings
			.filter((booking) => new Date(`${booking.booking_date}T${booking.start_time}`) <= expirationTime)
			.map((booking) => booking.id);
		if (expiredBookingIds.length) {
			const { error } = await accountSupabase
				.from('bookings')
				.delete()
				.in('id', expiredBookingIds);
			if (error) {
				console.error(error);
			}
		}
		renderBookings(userBookings.filter((booking) => !expiredBookingIds.includes(booking.id)));
	};

	const cancelBooking = async (bookingId) => {
		if (!window.confirm('ต้องการยกเลิกการจองนี้หรือไม่?')) return;
		const { error } = await accountSupabase
			.from('bookings')
			.update({ status: 'cancelled' })
			.eq('id', bookingId);
		if (error) {
			showMessage('ยกเลิกการจองไม่สำเร็จ กรุณาลองใหม่', true);
			return;
		}
		showMessage('ยกเลิกการจองเรียบร้อยแล้ว');
		loadAccount();
	};

	logoutButton?.addEventListener('click', async () => {
		await accountSupabase.auth.signOut();
		window.location.href = 'login.html';
	});

	loadAccount();
}
