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

	const addHour = (time) => {
		const hour = Number(time.slice(0, 2));
		const nextHour = hour + 1;
		if (nextHour >= 24) return '24:00';
		return `${String(nextHour).padStart(2, '0')}:00`;
	};

	const canCancel = (booking) => new Date(`${booking.booking_date}T${booking.start_time}`) - Date.now() >= 24 * 60 * 60 * 1000;

	const updateBookingStatus = async (bookingId, status) => {
		const { error } = await accountSupabase
			.from('bookings')
			.update({ status })
			.eq('id', bookingId);
		return error;
	};

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

		const activeBookings = bookings.filter(b => b.status === 'booked');
		const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

		// จัดกลุ่ม active bookings ตามวันที่
		const groupedByDate = {};
		activeBookings.forEach(booking => {
			const dateKey = booking.booking_date;
			if (!groupedByDate[dateKey]) groupedByDate[dateKey] = {};
			const pitch = booking.pitch;
			if (!groupedByDate[dateKey][pitch]) groupedByDate[dateKey][pitch] = [];
			groupedByDate[dateKey][pitch].push(booking.start_time);
		});

		const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));

		// Render active bookings แยกตามวันที่
		sortedDates.forEach(date => {
			const dateItem = document.createElement('article');
			dateItem.className = 'booking-history-item';

			const dateHeader = document.createElement('div');
			dateHeader.className = 'booking-date-header';
			dateHeader.innerHTML = `<strong>${formatDate(date)}</strong>`;
			dateItem.append(dateHeader);

			const pitches = groupedByDate[date];
			const pitchNumbers = Object.keys(pitches).map(Number).sort((a, b) => a - b);

			pitchNumbers.forEach(pitch => {
				const times = pitches[pitch].sort();

				// Merge เวลาที่ต่อกัน/คาบเกี่ยว
				const merged = [];
				let slotStart = times[0];
				let slotEnd = addHour(times[0]);

				for (let i = 1; i < times.length; i++) {
					if (times[i] <= slotEnd) {
						const nextEnd = addHour(times[i]);
						if (nextEnd > slotEnd) slotEnd = nextEnd;
					} else {
						merged.push({ start: slotStart, end: slotEnd });
						slotStart = times[i];
						slotEnd = addHour(times[i]);
					}
				}
				merged.push({ start: slotStart, end: slotEnd });

				// หัวข้อสนาม
				const pitchHeader = document.createElement('p');
				pitchHeader.className = 'booking-pitch-label';
				pitchHeader.textContent = `สนาม ${pitch}`;
				dateItem.append(pitchHeader);

				// สร้าง element สำหรับแต่ละ merged slot
				merged.forEach(slot => {
					const endStr = slot.end === '24:00' ? '00:00' : slot.end.slice(0, 5);
					const timeText = `${slot.start.slice(0, 5)} - ${endStr} น.`;

					const timeDiv = document.createElement('div');
					timeDiv.className = 'booking-time-row';
					timeDiv.innerHTML = `<span>${timeText}</span>`;
					dateItem.append(timeDiv);

					// หา bookings ใน slot นี้
					const slotBookings = activeBookings.filter(b =>
						b.booking_date === date &&
						b.pitch === pitch &&
						b.start_time >= slot.start &&
						b.start_time < slot.end
					);

					const slotCanCancel = slotBookings.every(b => canCancel(b));

					if (slotCanCancel) {
						const btn = document.createElement('button');
						btn.className = 'cancel-booking-btn';
						btn.type = 'button';
						btn.textContent = 'ยกเลิกการจอง';
						btn.addEventListener('click', async () => {
							if (!window.confirm(`ต้องการยกเลิกการจองสนาม ${pitch} เวลา ${formatDate(date)} ${timeText} หรือไม่?`)) return;
							const errors = await Promise.all(slotBookings.map(b => updateBookingStatus(b.id, 'cancelled')));
							if (errors.some(e => e)) {
								showMessage('ยกเลิกการจองไม่สำเร็จ กรุณาลองใหม่', true);
								return;
							}
							showMessage('ยกเลิกการจองเรียบร้อยแล้ว');
							loadAccount();
						});
						dateItem.append(btn);
					} else {
						const label = document.createElement('span');
						label.className = 'booking-cancelled-label';
						label.textContent = 'ไม่สามารถยกเลิกได้ (จองภายใน 24 ชม.)';
						dateItem.append(label);
					}
				});
			});

			bookingList.append(dateItem);
		});

		// Render cancelled bookings
		if (cancelledBookings.length) {
			const cancelledItem = document.createElement('article');
			cancelledItem.className = 'booking-history-item is-cancelled';

			const cancelledHeader = document.createElement('div');
			cancelledHeader.className = 'booking-date-header';
			cancelledHeader.innerHTML = `<strong>ยกเลิกแล้ว</strong>`;
			cancelledItem.append(cancelledHeader);

			// จัดกลุ่ม cancelled ตามวันที่และสนาม
			const cancelledGrouped = {};
			cancelledBookings.forEach(b => {
				const dateKey = b.booking_date;
				const pitch = b.pitch;
				if (!cancelledGrouped[dateKey]) cancelledGrouped[dateKey] = {};
				if (!cancelledGrouped[dateKey][pitch]) cancelledGrouped[dateKey][pitch] = [];
				cancelledGrouped[dateKey][pitch].push(b.start_time);
			});

			const cancelledDates = Object.keys(cancelledGrouped).sort((a, b) => new Date(a) - new Date(b));

			cancelledDates.forEach(date => {
				const dateLabel = document.createElement('p');
				dateLabel.className = 'booking-pitch-label';
				dateLabel.textContent = formatDate(date);
				cancelledItem.append(dateLabel);

				const pitches = cancelledGrouped[date];
				const pitchNumbers = Object.keys(pitches).map(Number).sort((a, b) => a - b);

				pitchNumbers.forEach(pitch => {
					const times = pitches[pitch].sort();

					// Merge เวลา
					const merged = [];
					let slotStart = times[0];
					let slotEnd = addHour(times[0]);
					for (let i = 1; i < times.length; i++) {
						if (times[i] <= slotEnd) {
							const nextEnd = addHour(times[i]);
							if (nextEnd > slotEnd) slotEnd = nextEnd;
						} else {
							merged.push({ start: slotStart, end: slotEnd });
							slotStart = times[i];
							slotEnd = addHour(times[i]);
						}
					}
					merged.push({ start: slotStart, end: slotEnd });

					const pitchLabel = document.createElement('p');
					pitchLabel.className = 'booking-pitch-sublabel';
					pitchLabel.textContent = `สนาม ${pitch}`;
					cancelledItem.append(pitchLabel);

					merged.forEach(slot => {
						const endStr = slot.end === '24:00' ? '00:00' : slot.end.slice(0, 5);
						const timeDiv = document.createElement('div');
						timeDiv.className = 'booking-time-row';
						timeDiv.innerHTML = `<span>${slot.start.slice(0, 5)} - ${endStr} น.</span>`;
						cancelledItem.append(timeDiv);
					});
				});
			});

			bookingList.append(cancelledItem);
		}
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

	logoutButton?.addEventListener('click', async () => {
		await accountSupabase.auth.signOut();
		window.location.href = 'login.html';
	});

	loadAccount();
}
