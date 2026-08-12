document.addEventListener('DOMContentLoaded', () => {
    // ===================================================
    // 1. HAMBURGER MENU / SIDEBAR TOGGLE LOGIC
    // ===================================================
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('close');
            document.body.classList.toggle('sidebar-closed');
        });
    }

    // ===================================================
    // 2. REAL DYNAMIC CALENDAR GENERATOR
    // ===================================================
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const daysGrid = document.getElementById('daysGrid');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    const selectedDateTitle = document.getElementById('selectedDateTitle');

    // جلب التاريخ الحقيقي الكامل لجهاز المستخدم الحالي
    const realToday = new Date(); 
    let currentDate = new Date(realToday.getFullYear(), realToday.getMonth(), 1);

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    // دالة بناء وتحديث شبكة التقويم
    function renderCalendar() {
        if (!daysGrid) return;
        daysGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 1. تحديث نص الشهر والسنة في الهيدر
        if (currentMonthYearHeader) {
            currentMonthYearHeader.textContent = `${monthNames[month]} ${year}`;
        }

        // 2. حساب أيام الشهر والبدء
        // جعل بداية الأسبوع يوم الإثنين (0 = Monday, 6 = Sunday)
        const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; 
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevLastDate = new Date(year, month, 0).getDate();

        // 3. إضافة أيام الشهر السابق (بلون خفيف)
        for (let x = firstDayIndex; x > 0; x--) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day-cell', 'other-month');
            dayDiv.innerHTML = `<span class="day-number">${prevLastDate - x + 1}</span>`;
            daysGrid.appendChild(dayDiv);
        }

        // 4. إضافة أيام الشهر الحالي
        for (let i = 1; i <= lastDate; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day-cell');
            
            // التثبت إذا كان هذا اليوم هو تاريخ اليوم الحقيقي المباشر من الجهاز
            const isToday = i === realToday.getDate() && 
                            month === realToday.getMonth() && 
                            year === realToday.getFullYear();

            if (isToday) {
                dayDiv.classList.add('active');
                updateScheduleHeader(i, month, year);
            }

            dayDiv.innerHTML = `<span class="day-number">${i}</span>`;
            
            // إضافة تفاعلية الضغط لتحديد أي يوم في الشهر
            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('.day-cell').forEach(cell => cell.classList.remove('active'));
                dayDiv.classList.add('active');
                updateScheduleHeader(i, month, year);
            });

            daysGrid.appendChild(dayDiv);
        }

        // 5. إكمال بقية مربعات الشبكة بأيام الشهر التالي
        const totalCells = daysGrid.children.length;
        const remainingCells = 35 - totalCells;
        const nextDays = remainingCells >= 0 ? remainingCells : 42 - totalCells;

        for (let j = 1; j <= nextDays; j++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day-cell', 'other-month');
            dayDiv.innerHTML = `<span class="day-number">${j}</span>`;
            daysGrid.appendChild(dayDiv);
        }
    }

    // دالة تحديث عنوان جدول اليوم السفلية
    function updateScheduleHeader(day, month, year) {
        if (selectedDateTitle) {
            const isToday = day === realToday.getDate() && 
                            month === realToday.getMonth() && 
                            year === realToday.getFullYear();
            
            const prefix = isToday ? "Today · " : "";
            selectedDateTitle.textContent = `${prefix}${monthNames[month]} ${day}, ${year}`;
        }
    }

    // ===================================================
    // 3. CONTROLS & EVENT LISTENERS
    // ===================================================

    // زر الانتقال للشهر السابق
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    // زر الانتقال للشهر التالي
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // زر العودة لتاريخ اليوم الحالي الفعلي
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentDate = new Date(realToday.getFullYear(), realToday.getMonth(), 1);
            renderCalendar();
        });
    }

    // تشغيل ودعم التقويم فور تحميل الصفحة
    renderCalendar();
});