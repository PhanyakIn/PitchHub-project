(() => {
	const config = window.PITCHHUB_SUPABASE_CONFIG;
	if (!config?.url || !config?.key || !window.supabase) return;

	const db = window.supabase.createClient(config.url, config.key);

	const navBtns = document.querySelectorAll('.nav-btn');
	const panels = document.querySelectorAll('.section-panel');

	navBtns.forEach((btn) => {
		btn.addEventListener('click', () => {
			const target = btn.dataset.section;
			navBtns.forEach((b) => b.classList.remove('active'));
			panels.forEach((p) => p.classList.remove('active'));
			btn.classList.add('active');
			document.getElementById(target)?.classList.add('active');
		});
	});

	const PAGE_SIZE = 10;
	let bookingPage = 1;
	let bookingRows = [];

	const pitchLabels = { 1: 'Pitch 1', 2: 'Pitch 2', 3: 'Pitch 3', 4: 'Pitch 4' };

	const formatTime = (t) => {
		const [h, m] = t.split(':');
		const hour = parseInt(h, 10);
		return `${hour.toString().padStart(2, '0')}:${m}`;
	};

	const formatThaiDate = (dateStr) => {
		const d = new Date(`${dateStr}T00:00:00`);
		return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
	};

	const toDateKey = (date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const getRecentBookingsRange = () => {
		const end = new Date();
		end.setHours(23, 59, 59, 999);

		const start = new Date(end);
		start.setDate(start.getDate() - 29);
		start.setHours(0, 0, 0, 0);

		return {
			start: toDateKey(start),
			end: toDateKey(end),
			label: '30 วันล่าสุด',
		};
	};

	const setMonthLabel = () => {
		const el = document.getElementById('month-label');
		if (el) el.textContent = getRecentBookingsRange().label;
	};

	const renderCalendar = (bookings) => {
		const calendarEl = document.getElementById('booking-calendar');
		if (!calendarEl) return;

		const { start, end } = getRecentBookingsRange();
		const calendarDays = [];
		const countsByDate = {};

		bookings.forEach((booking) => {
			const dateKey = booking.booking_date;
			countsByDate[dateKey] = countsByDate[dateKey] || { booked: 0, cancelled: 0 };
			countsByDate[dateKey][booking.status] = (countsByDate[dateKey][booking.status] || 0) + 1;
		});

		const startDate = new Date(`${start}T00:00:00`);
		const endDate = new Date(`${end}T00:00:00`);
		for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
			const dateKey = toDateKey(day);
			const item = countsByDate[dateKey] || { booked: 0, cancelled: 0 };
			const hasBookings = item.booked > 0;
			const hasCancelled = item.cancelled > 0;
			const total = item.booked + item.cancelled;

			calendarDays.push(`
				<div class="calendar-day ${hasBookings ? 'has-bookings' : ''} ${hasCancelled ? 'has-cancelled' : ''}">
					<span class="day-number">${day.getDate()}</span>
					<span class="day-count">${total > 0 ? `${total} booking` : ''}</span>
				</div>
			`);
		}

		calendarEl.innerHTML = calendarDays.join('');
	};

	const updateBookingPagination = () => {
		const prevBtn = document.getElementById('booking-prev');
		const nextBtn = document.getElementById('booking-next');
		const pageInfo = document.getElementById('booking-page-info');
		const totalPages = Math.max(1, Math.ceil(bookingRows.length / PAGE_SIZE));
		bookingPage = Math.min(bookingPage, totalPages);

		if (prevBtn) prevBtn.disabled = bookingPage <= 1;
		if (nextBtn) nextBtn.disabled = bookingPage >= totalPages;
		if (pageInfo) pageInfo.textContent = `หน้า ${bookingPage}/${totalPages}`;

		const tbody = document.getElementById('booking-table-body');
		if (!tbody) return;

		if (!bookingRows.length) {
			tbody.innerHTML = '<tr class="empty-row"><td colspan="5">ไม่มีข้อมูลการจอง</td></tr>';
			return;
		}

		const start = (bookingPage - 1) * PAGE_SIZE;
		const currentPageRows = bookingRows.slice(start, start + PAGE_SIZE);

		tbody.innerHTML = currentPageRows.map((b) => `
			<tr>
				<td>${b.userName || 'Unknown'}</td>
				<td>${formatThaiDate(b.booking_date)}</td>
				<td>${pitchLabels[b.pitch] || `Pitch ${b.pitch}`}</td>
				<td>${formatTime(b.start_time)}</td>
				<td><span class="status-badge ${b.status}">${b.status}</span></td>
			</tr>
		`).join('');
	};

	const loadBookings = async () => {
		const { start, end } = getRecentBookingsRange();
		const { data: bookings, error } = await db
			.from('bookings')
			.select('id, booking_date, pitch, start_time, status, user_id')
			.gte('booking_date', start)
			.lte('booking_date', end)
			.order('booking_date', { ascending: true })
			.order('start_time', { ascending: true });

		if (error) return;

		renderCalendar(bookings || []);

		const totalEl = document.getElementById('stat-total-bookings');
		const activeEl = document.getElementById('stat-active');
		const cancelledEl = document.getElementById('stat-cancelled');

		const active = (bookings || []).filter((b) => b.status === 'booked');
		const cancelled = (bookings || []).filter((b) => b.status === 'cancelled');

		if (totalEl) totalEl.textContent = bookings?.length || 0;
		if (activeEl) activeEl.textContent = active.length;
		if (cancelledEl) cancelledEl.textContent = cancelled.length;

		if (!bookings || !bookings.length) {
			bookingRows = [];
			bookingPage = 1;
			updateBookingPagination();
			return;
		}

		const userIds = [...new Set(bookings.map((b) => b.user_id).filter(Boolean))];
		const userMap = {};
		if (userIds.length) {
			const { data: users } = await db.from('users').select('id, fullname').in('id', userIds);
			if (users) users.forEach((u) => { userMap[u.id] = u.fullname; });
		}

		bookingRows = bookings.map((b) => ({
			...b,
			userName: userMap[b.user_id] || 'Unknown',
		}));
		bookingPage = 1;
		updateBookingPagination();
	};

	const loadUsers = async () => {
		const { data: users, error } = await db
			.from('users')
			.select('id, fullname, email, role')
			.eq('role', 'user')
			.order('fullname', { ascending: true });

		if (error) return;

		const statUsersEl = document.getElementById('stat-users');
		if (statUsersEl) statUsersEl.textContent = users.length;

		const tbody = document.getElementById('user-table-body');
		if (!users.length) {
			tbody.innerHTML = '<tr class="empty-row"><td colspan="3">ไม่มีข้อมูลผู้ใช้</td></tr>';
			return;
		}

		tbody.innerHTML = users.map((u) => `
			<tr>
				<td>${u.fullname}</td>
				<td>${u.email}</td>
				<td><span class="role-badge ${u.role}">${u.role}</span></td>
			</tr>
		`).join('');
	};

	const loadEmployees = async () => {
		const { data: employees, error } = await db
			.from('users')
			.select('id, fullname, email, role')
			.eq('role', 'admin')
			.order('fullname', { ascending: true });

		if (error) return;

		const grid = document.getElementById('employee-grid');
		if (!employees.length) {
			grid.innerHTML = `
				<div class="empty-state">
					<i class="fa-solid fa-user-tie"></i>
					<p>ไม่มีข้อมูลพนักงาน</p>
				</div>
			`;
			return;
		}

		grid.innerHTML = employees.map((e) => {
			const initials = (e.fullname || '?').split(' ').map((w) => w[0]).join('').slice(0, 2);
			return `
				<div class="employee-card">
					<div class="employee-avatar">${initials}</div>
					<div class="employee-info">
						<span class="employee-name">${e.fullname}</span>
						<span class="employee-email">${e.email}</span>
						<span class="employee-role">Admin</span>
					</div>
				</div>
			`;
		}).join('');
	};

	const bindBookingPagination = () => {
		const prevBtn = document.getElementById('booking-prev');
		const nextBtn = document.getElementById('booking-next');

		if (prevBtn) {
			prevBtn.addEventListener('click', () => {
				if (bookingPage > 1) {
					bookingPage -= 1;
					updateBookingPagination();
				}
			});
		}

		if (nextBtn) {
			nextBtn.addEventListener('click', () => {
				const maxPage = Math.max(1, Math.ceil(bookingRows.length / PAGE_SIZE));
				if (bookingPage < maxPage) {
					bookingPage += 1;
					updateBookingPagination();
				}
			});
		}
	};

	const init = () => {
		setMonthLabel();
		bindBookingPagination();
		loadBookings();
		loadUsers();
		loadEmployees();
	};

	init();
})();
