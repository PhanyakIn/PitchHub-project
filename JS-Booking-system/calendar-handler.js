(() => {
const calendarButton = document.querySelector('.calendar-btn');
const bookingDate = document.querySelector('#booking-date');
const calendarBookingTable = document.querySelector('#booking-table');
const calendarPopover = document.querySelector('#calendar-popover');
const calendarMonth = document.querySelector('#calendar-month');
const calendarDays = document.querySelector('#calendar-days');
const calendarLabel = document.querySelector('.calendar-label');
const previousMonthButton = document.querySelector('#previous-month');
const nextMonthButton = document.querySelector('#next-month');
const calendarYearPicker = document.querySelector('#calendar-year-picker');
const calendarAnimationDuration = 220;

const formatDate = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date) => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	return `${day}/${month}/${date.getFullYear()}`;
};

const today = new Date();
const firstYear = today.getFullYear();
const lastYear = firstYear + 30;
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
let displayedMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

const renderYearPicker = () => {
	calendarYearPicker.replaceChildren();
	for (let year = firstYear; year <= lastYear; year += 1) {
		const yearButton = document.createElement('button');
		yearButton.type = 'button';
		yearButton.className = 'calendar-year';
		yearButton.textContent = year;
		if (year === displayedMonth.getFullYear()) {
			yearButton.classList.add('selected');
		}
		yearButton.addEventListener('click', () => {
			displayedMonth.setFullYear(year);
			calendarYearPicker.hidden = true;
			calendarMonth.setAttribute('aria-expanded', 'false');
			renderCalendar();
		});
		calendarYearPicker.append(yearButton);
	}
};

const selectDate = (date) => {
	bookingDate.value = formatDate(date);
	calendarLabel.textContent = formatDisplayDate(date);
	calendarBookingTable.hidden = false;
	document.querySelectorAll('.status-pitch.selecting').forEach((pitch) => {
		pitch.classList.remove('selecting');
	});
	closeCalendar();
	selectedDate = date;
	window.dispatchEvent(new CustomEvent('pitchhub:date-selected'));
};

const openCalendar = () => {
	calendarPopover.hidden = false;
	requestAnimationFrame(() => calendarPopover.classList.add('is-open'));
	calendarButton.setAttribute('aria-expanded', 'true');
};

const closeCalendar = () => {
	calendarPopover.classList.remove('is-open');
	calendarButton.setAttribute('aria-expanded', 'false');
	setTimeout(() => {
		if (!calendarPopover.classList.contains('is-open')) {
			calendarPopover.hidden = true;
		}
	}, calendarAnimationDuration);
};

const renderCalendar = () => {
	const year = displayedMonth.getFullYear();
	const month = displayedMonth.getMonth();
	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const monthName = displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

	calendarMonth.textContent = monthName;
	renderYearPicker();
	calendarDays.replaceChildren();

	for (let index = 0; index < firstDay; index += 1) {
		calendarDays.append(document.createElement('span'));
	}

	for (let day = 1; day <= daysInMonth; day += 1) {
		const date = new Date(year, month, day);
		const dayButton = document.createElement('button');
		dayButton.type = 'button';
		dayButton.textContent = day;
		dayButton.className = 'calendar-day';
		if (formatDate(date) === formatDate(selectedDate)) {
			dayButton.classList.add('selected');
		}
		if (formatDate(date) === formatDate(today)) {
			dayButton.classList.add('today');
		}
		dayButton.addEventListener('click', () => selectDate(date));
		calendarDays.append(dayButton);
	}
};

bookingDate.value = formatDate(selectedDate);
calendarLabel.textContent = formatDisplayDate(selectedDate);
renderCalendar();

calendarButton?.addEventListener('click', () => {
	if (calendarPopover.hidden) {
		openCalendar();
	} else {
		closeCalendar();
	}
});

previousMonthButton?.addEventListener('click', () => {
	if (displayedMonth.getFullYear() > firstYear || displayedMonth.getMonth() > 0) {
		displayedMonth.setMonth(displayedMonth.getMonth() - 1);
	}
	renderCalendar();
});

nextMonthButton?.addEventListener('click', () => {
	if (displayedMonth.getFullYear() < lastYear || displayedMonth.getMonth() < 11) {
		displayedMonth.setMonth(displayedMonth.getMonth() + 1);
	}
	renderCalendar();
});

calendarMonth?.addEventListener('click', () => {
	calendarYearPicker.hidden = !calendarYearPicker.hidden;
	calendarMonth.setAttribute('aria-expanded', String(!calendarYearPicker.hidden));
});
})();

