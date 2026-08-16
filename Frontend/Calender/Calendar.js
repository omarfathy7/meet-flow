document.addEventListener("DOMContentLoaded", async () => {
    if (!requireAuth()) return;

    const toggleBtn = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("close");
            document.body.classList.toggle("sidebar-closed");
        });
    }

    const currentMonthYearHeader = document.getElementById("currentMonthYear");
    const daysGrid = document.getElementById("daysGrid");
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");
    const todayBtn = document.getElementById("todayBtn");
    const selectedDateTitle = document.getElementById("selectedDateTitle");
    const eventsList = document.getElementById("eventsList");
    const calendarView = document.getElementById("calendarView");
    const calendarCard = document.getElementById("fullCalendar");

    const today = new Date();
    let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    let selectedDateKey = toDateKey(today);
    let currentView = "month";
    let meetings = [];

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    meetings = await loadCalendarMeetings();
    renderCalendar();
    renderSelectedDate();

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener("click", () => {
            moveCurrentPeriod(1);
            renderCalendar();
        });
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener("click", () => {
            moveCurrentPeriod(-1);
            renderCalendar();
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener("click", () => {
            currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
            selectedDateKey = toDateKey(today);
            renderCalendar();
            renderSelectedDate();
        });
    }

    if (calendarView) {
        calendarView.addEventListener("change", () => {
            currentView = calendarView.value;
            if (currentView === "day" || currentView === "week") {
                currentDate = parseDateKey(selectedDateKey);
            }
            renderCalendar();
        });
    }

    function moveCurrentPeriod(direction) {
        if (currentView === "year") {
            currentDate.setFullYear(currentDate.getFullYear() + direction);
        } else if (currentView === "day") {
            currentDate.setDate(currentDate.getDate() + direction);
            selectedDateKey = toDateKey(currentDate);
        } else if (currentView === "week") {
            currentDate.setDate(currentDate.getDate() + direction * 7);
            selectedDateKey = toDateKey(currentDate);
        } else {
            currentDate.setMonth(currentDate.getMonth() + direction);
        }
    }

    async function loadCalendarMeetings() {
        const workspaceId = await getCurrentWorkspaceId();
        if (!workspaceId) return [];
        const data = await fetchAPI(`/api/Meetings/workspace/${workspaceId}`);
        return Array.isArray(data) ? data : [];
    }

    function renderCalendar() {
        if (!daysGrid) return;
        daysGrid.innerHTML = "";
        if (calendarCard) {
            calendarCard.classList.toggle("day-view", currentView === "day");
            calendarCard.classList.toggle("week-view", currentView === "week");
            calendarCard.classList.toggle("year-view", currentView === "year");
            calendarCard.classList.toggle("month-view", currentView === "month");
        }

        if (currentView === "day") {
            renderDayView();
            renderSelectedDate();
            return;
        }

        if (currentView === "week") {
            renderWeekView();
            renderSelectedDate();
            return;
        }

        if (currentView === "year") {
            renderYearView();
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        if (currentMonthYearHeader) {
            currentMonthYearHeader.textContent = `${monthNames[month]} ${year}`;
        }

        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevLastDate = new Date(year, month, 0).getDate();

        for (let x = firstDayIndex; x > 0; x--) {
            const dayDiv = document.createElement("div");
            dayDiv.className = "day-cell other-month";
            dayDiv.innerHTML = `<span class="day-number">${prevLastDate - x + 1}</span>`;
            daysGrid.appendChild(dayDiv);
        }

        for (let day = 1; day <= lastDate; day++) {
            const dayDate = new Date(year, month, day);
            const dateKey = toDateKey(dayDate);
            const dayMeetings = meetings.filter(m => toDateKey(new Date(m.meetingDate)) === dateKey);
            const dayDiv = document.createElement("div");
            dayDiv.className = "day-cell";
            if (dateKey === selectedDateKey) dayDiv.classList.add("active");
            if (dateKey === toDateKey(today)) dayDiv.classList.add("today");

            dayDiv.innerHTML = `
                <span class="day-number">${day}</span>
                ${dayMeetings.length ? `<span class="event-dot">${dayMeetings.length}</span>` : ""}
            `;

            dayDiv.addEventListener("click", () => {
                selectedDateKey = dateKey;
                currentDate = dayDate;
                renderCalendar();
                renderSelectedDate();
            });

            daysGrid.appendChild(dayDiv);
        }

        const totalCells = daysGrid.children.length;
        const nextDays = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
        for (let day = 1; day <= nextDays; day++) {
            const dayDiv = document.createElement("div");
            dayDiv.className = "day-cell other-month";
            dayDiv.innerHTML = `<span class="day-number">${day}</span>`;
            daysGrid.appendChild(dayDiv);
        }
    }

    function renderWeekView() {
        const selected = parseDateKey(selectedDateKey);
        const weekStart = new Date(selected);
        weekStart.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        if (currentMonthYearHeader) {
            currentMonthYearHeader.textContent = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
        }

        for (let offset = 0; offset < 7; offset++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(weekStart.getDate() + offset);
            renderDayCell(dayDate, false);
        }
    }

    function renderDayView() {
        const selected = parseDateKey(selectedDateKey);
        const dayMeetings = meetings
            .filter(m => toDateKey(new Date(m.meetingDate)) === selectedDateKey)
            .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));

        if (currentMonthYearHeader) {
            currentMonthYearHeader.textContent = selected.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        }

        const dayCell = document.createElement("div");
        dayCell.className = "day-detail-cell";
        dayCell.innerHTML = `
            <div class="day-detail-number">${selected.getDate()}</div>
            <div class="day-detail-meta">
                <strong>${selected.toLocaleDateString("en-US", { weekday: "long" })}</strong>
                <span>${dayMeetings.length ? `${dayMeetings.length} meeting${dayMeetings.length === 1 ? "" : "s"}` : "No meetings scheduled"}</span>
            </div>
            <div class="day-detail-events">
                ${dayMeetings.length ? dayMeetings.map(meeting => `
                    <div class="day-detail-event">
                        <span>${formatTime(meeting.meetingDate)}</span>
                        <strong>${escapeHtml(meeting.title)}</strong>
                    </div>
                `).join("") : '<p class="empty-calendar">No meetings scheduled for this date.</p>'}
            </div>
        `;
        daysGrid.appendChild(dayCell);
    }

    function renderYearView() {
        const year = currentDate.getFullYear();
        if (currentMonthYearHeader) currentMonthYearHeader.textContent = String(year);

        for (let month = 0; month < 12; month++) {
            const monthDate = new Date(year, month, 1);
            const count = meetings.filter(m => {
                const d = new Date(m.meetingDate);
                return d.getFullYear() === year && d.getMonth() === month;
            }).length;

            const cell = document.createElement("div");
            cell.className = "day-cell month-cell";
            cell.innerHTML = `
                <span class="month-name">${monthNames[month]}</span>
                ${count ? `<span class="event-dot">${count}</span>` : ""}
            `;
            cell.addEventListener("click", () => {
                currentView = "month";
                if (calendarView) calendarView.value = "month";
                currentDate = monthDate;
                renderCalendar();
            });
            daysGrid.appendChild(cell);
        }
    }

    function renderDayCell(dayDate, otherMonth) {
        const dateKey = toDateKey(dayDate);
        const dayMeetings = meetings.filter(m => toDateKey(new Date(m.meetingDate)) === dateKey);
        const dayDiv = document.createElement("div");
        dayDiv.className = `day-cell${otherMonth ? " other-month" : ""}`;
        if (dateKey === selectedDateKey) dayDiv.classList.add("active");
        if (dateKey === toDateKey(today)) dayDiv.classList.add("today");
        dayDiv.innerHTML = `
            <span class="day-number">${dayDate.getDate()}</span>
            ${dayMeetings.length ? `<span class="event-dot">${dayMeetings.length}</span>` : ""}
        `;
        dayDiv.addEventListener("click", () => {
            selectedDateKey = dateKey;
            currentDate = dayDate;
            renderCalendar();
            renderSelectedDate();
        });
        daysGrid.appendChild(dayDiv);
    }

    function renderSelectedDate() {
        const selected = parseDateKey(selectedDateKey);
        const isToday = selectedDateKey === toDateKey(today);
        if (selectedDateTitle) {
            selectedDateTitle.textContent = `${isToday ? "Today - " : ""}${monthNames[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()}`;
        }

        if (!eventsList) return;

        const selectedMeetings = meetings
            .filter(m => toDateKey(new Date(m.meetingDate)) === selectedDateKey)
            .sort((a, b) => new Date(a.meetingDate) - new Date(b.meetingDate));

        if (selectedMeetings.length === 0) {
            eventsList.innerHTML = '<p class="empty-calendar">No meetings scheduled for this date.</p>';
            return;
        }

        eventsList.innerHTML = selectedMeetings.map(meeting => {
            const start = new Date(meeting.meetingDate);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            return `
                <div class="event-item">
                    <span class="event-time">${formatTime(meeting.meetingDate)}</span>
                    <span class="event-title">${escapeHtml(meeting.title)}</span>
                    <span class="event-duration">${formatTime(start)} - ${formatTime(end)}</span>
                </div>
            `;
        }).join("");
    }
});

function toDateKey(date) {
    const local = new Date(date);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().split("T")[0];
}

function parseDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatShortDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

