document.addEventListener('DOMContentLoaded', () => {

    // ===================================================
    // 1. SIDEBAR TOGGLE
    // ===================================================

    const toggleBtn =
        document.getElementById('toggleSidebar');

    const sidebar =
        document.querySelector('.sidebar');


    if (toggleBtn && sidebar) {

        toggleBtn.addEventListener('click', () => {

            if (window.innerWidth <= 768) {

                document.body.classList.toggle(
                    'mobile-menu-open'
                );

            } else {

                sidebar.classList.toggle('close');

                document.body.classList.toggle(
                    'sidebar-closed'
                );

            }

        });

    }


    // ===================================================
    // 2. NOTIFICATION ELEMENTS
    // ===================================================

    const notificationsList =
        document.getElementById('notificationsList');

    const notificationItems =
        document.querySelectorAll(
            '.notification-item'
        );

    const tabs =
        document.querySelectorAll(
            '.notification-tab'
        );

    const searchInput =
        document.getElementById(
            'notificationSearch'
        );

    const unreadCount =
        document.getElementById(
            'unreadCount'
        );

    const notificationBadge =
        document.getElementById(
            'notificationBadge'
        );

    const emptyState =
        document.getElementById(
            'emptyState'
        );

    const loadMoreBtn =
        document.getElementById(
            'loadMoreBtn'
        );


    // ===================================================
    // 3. NEW FILTER ELEMENTS
    // ===================================================

    const filterType =
        document.getElementById(
            'filterType'
        );

    const filterDate =
        document.getElementById(
            'filterDate'
        );


    // ===================================================
    // 4. CURRENT FILTER
    // ===================================================

    let currentFilter = 'all';


    // ===================================================
    // 5. UPDATE UNREAD COUNT
    // ===================================================

    function updateUnreadCount() {

        const unread =
            document.querySelectorAll(
                '.notification-item.unread'
            ).length;


        // Update text inside page

        if (unreadCount) {

            unreadCount.textContent = unread;

        }


        // Update notification badge

        if (notificationBadge) {

            notificationBadge.textContent =
                unread;


            if (unread === 0) {

                notificationBadge.style.display =
                    'none';

            } else {

                notificationBadge.style.display =
                    'flex';

            }

        }

    }


    // ===================================================
    // 6. FILTER NOTIFICATIONS
    // ===================================================

    function filterNotifications() {

        // -------------------------------------------------
        // SEARCH VALUE
        // -------------------------------------------------

        const searchValue =
            searchInput
                ? searchInput.value
                    .toLowerCase()
                    .trim()
                : '';


        // -------------------------------------------------
        // SELECTED TYPE
        // -------------------------------------------------

        const selectedType =
            filterType
                ? filterType.value
                : 'all';


        // -------------------------------------------------
        // SELECTED DATE
        // -------------------------------------------------

        const selectedDate =
            filterDate
                ? filterDate.value
                : 'all';


        let visibleCount = 0;


        // =================================================
        // LOOP THROUGH NOTIFICATIONS
        // =================================================

        document
            .querySelectorAll(
                '.notification-item'
            )
            .forEach(item => {


                // -----------------------------------------
                // GET DATA
                // -----------------------------------------

                const type =
                    item.getAttribute(
                        'data-type'
                    );


                const text =
                    item.innerText
                        .toLowerCase();


                const isUnread =
                    item.classList.contains(
                        'unread'
                    );


                // -----------------------------------------
                // DEFAULT VALUES
                // -----------------------------------------

                let matchesFilter = true;

                let matchesSearch = true;

                let matchesDate = true;


                // =================================================
                // FILTERED BY
                // =================================================

                if (selectedType === 'unread') {

                    matchesFilter =
                        isUnread;

                }

                else if (
                    selectedType !== 'all'
                ) {

                    matchesFilter =
                        type === selectedType;

                }


                // =================================================
                // OLD FILTER TABS
                // =================================================

                /*
                    The tabs are still supported.

                    If the user clicks a tab,
                    currentFilter will be used.

                    The dropdown filter also works
                    together with the tabs.
                */

                if (
                    currentFilter === 'unread'
                ) {

                    matchesFilter =
                        matchesFilter &&
                        isUnread;

                }

                else if (
                    currentFilter !== 'all'
                ) {

                    matchesFilter =
                        matchesFilter &&
                        type === currentFilter;

                }


                // =================================================
                // SEARCH
                // =================================================

                if (searchValue !== '') {

                    matchesSearch =
                        text.includes(
                            searchValue
                        );

                }


                // =================================================
                // DATE FILTER
                // =================================================

                const timeElement =
                    item.querySelector(
                        '.notification-time'
                    );


                const timeText =
                    timeElement
                        ? timeElement.innerText
                            .toLowerCase()
                        : '';


                // TODAY

                if (
                    selectedDate === 'today'
                ) {

                    /*
                        Notifications that contain
                        "yesterday" are excluded.
                    */

                    matchesDate =
                        !timeText.includes(
                            'yesterday'
                        );

                }


                // YESTERDAY

                else if (
                    selectedDate === 'yesterday'
                ) {

                    matchesDate =
                        timeText.includes(
                            'yesterday'
                        );

                }


                // =================================================
                // SHOW / HIDE
                // =================================================

                if (
                    matchesFilter &&
                    matchesSearch &&
                    matchesDate
                ) {

                    item.style.display =
                        'flex';

                    visibleCount++;

                }

                else {

                    item.style.display =
                        'none';

                }

            });


        // =================================================
        // EMPTY STATE
        // =================================================

        if (visibleCount === 0) {

            if (emptyState) {

                emptyState.classList.add(
                    'show'
                );

            }


            if (loadMoreBtn) {

                loadMoreBtn.style.display =
                    'none';

            }

        }

        else {

            if (emptyState) {

                emptyState.classList.remove(
                    'show'
                );

            }


            if (loadMoreBtn) {

                loadMoreBtn.style.display =
                    'flex';

            }

        }

    }


    // ===================================================
    // 7. FILTER TABS
    // ===================================================

    tabs.forEach(tab => {

        tab.addEventListener(
            'click',
            () => {


                // Remove active from all tabs

                tabs.forEach(item => {

                    item.classList.remove(
                        'active'
                    );

                });


                // Add active to clicked tab

                tab.classList.add(
                    'active'
                );


                // Get filter

                currentFilter =
                    tab.getAttribute(
                        'data-filter'
                    );


                // Keep dropdown synchronized

                if (filterType) {

                    filterType.value =
                        currentFilter;

                }


                // Apply filters

                filterNotifications();

            }
        );

    });


    // ===================================================
    // 8. SEARCH
    // ===================================================

    if (searchInput) {

        searchInput.addEventListener(
            'input',
            () => {

                filterNotifications();

            }
        );

    }


    // ===================================================
    // 9. FILTERED BY DROPDOWN
    // ===================================================

    if (filterType) {

        filterType.addEventListener(
            'change',
            () => {


                // Update current filter

                currentFilter =
                    filterType.value;


                // Update active tabs

                tabs.forEach(tab => {

                    const tabFilter =
                        tab.getAttribute(
                            'data-filter'
                        );


                    if (
                        tabFilter ===
                        currentFilter
                    ) {

                        tab.classList.add(
                            'active'
                        );

                    }

                    else {

                        tab.classList.remove(
                            'active'
                        );

                    }

                });


                // Apply filter

                filterNotifications();

            }
        );

    }


    // ===================================================
    // 10. BY DATE DROPDOWN
    // ===================================================

    if (filterDate) {

        filterDate.addEventListener(
            'change',
            () => {

                filterNotifications();

            }
        );

    }


    // ===================================================
    // 11. CLICK NOTIFICATION
    // MARK AS READ
    // ===================================================

    document
        .querySelectorAll(
            '.notification-item'
        )
        .forEach(item => {

            item.addEventListener(
                'click',
                event => {


                    // -----------------------------------------
                    // Don't mark as read when delete is clicked
                    // -----------------------------------------

                    if (
                        event.target.closest(
                            '.notification-delete'
                        )
                    ) {

                        return;

                    }


                    // -----------------------------------------
                    // Mark as read
                    // -----------------------------------------

                    if (
                        item.classList.contains(
                            'unread'
                        )
                    ) {

                        item.classList.remove(
                            'unread'
                        );


                        updateUnreadCount();


                        // Re-apply current filters

                        filterNotifications();

                    }

                }
            );

        });


    // ===================================================
    // 12. DELETE SINGLE NOTIFICATION
    // ===================================================

    function attachDeleteButton(button) {

        if (!button) return;


        button.addEventListener(
            'click',
            event => {

                event.stopPropagation();


                const item =
                    button.closest(
                        '.notification-item'
                    );


                if (!item) return;


                // Animation

                item.style.opacity = '0';

                item.style.transform =
                    'translateX(20px)';


                setTimeout(() => {

                    item.remove();


                    updateUnreadCount();


                    filterNotifications();

                }, 250);

            }
        );

    }


    // Attach delete buttons to existing items

    document
        .querySelectorAll(
            '.notification-delete'
        )
        .forEach(button => {

            attachDeleteButton(button);

        });


    // ===================================================
    // 13. MARK ALL AS READ
    // ===================================================

    const markAllReadBtn =
        document.getElementById(
            'markAllReadBtn'
        );


    if (markAllReadBtn) {

        markAllReadBtn.addEventListener(
            'click',
            () => {


                // Remove unread from all notifications

                document
                    .querySelectorAll(
                        '.notification-item.unread'
                    )
                    .forEach(item => {

                        item.classList.remove(
                            'unread'
                        );

                    });


                // Update counter

                updateUnreadCount();


                // Re-apply filters

                filterNotifications();

            }
        );

    }


    // ===================================================
    // 14. CLEAR ALL
    // ===================================================

    const clearAllBtn =
        document.getElementById(
            'clearAllBtn'
        );


    if (clearAllBtn) {

        clearAllBtn.addEventListener(
            'click',
            () => {


                const items =
                    document.querySelectorAll(
                        '.notification-item'
                    );


                // Nothing to delete

                if (items.length === 0) {

                    return;

                }


                // Animation

                items.forEach(item => {

                    item.style.opacity =
                        '0';

                    item.style.transform =
                        'translateX(20px)';

                });


                // Remove after animation

                setTimeout(() => {

                    document
                        .querySelectorAll(
                            '.notification-item'
                        )
                        .forEach(item => {

                            item.remove();

                        });


                    // Update everything

                    updateUnreadCount();

                    filterNotifications();

                }, 250);

            }
        );

    }


    // ===================================================
    // 15. LOAD MORE
    // ===================================================

    if (loadMoreBtn) {

        loadMoreBtn.addEventListener(
            'click',
            () => {


                const list =
                    document.getElementById(
                        'notificationsList'
                    );


                if (!list) return;


                // Create new notification

                const newNotification =
                    document.createElement(
                        'div'
                    );


                newNotification.className =
                    'notification-item';


                newNotification.setAttribute(
                    'data-type',
                    'system'
                );


                newNotification.setAttribute(
                    'data-id',
                    '7'
                );


                // Notification HTML

                newNotification.innerHTML = `

                    <div class="notification-icon system">

                        <i class="fa-solid fa-circle-info"></i>

                    </div>


                    <div class="notification-content">

                        <div class="notification-title-row">

                            <h3>
                                New MeetFlow update
                            </h3>

                        </div>


                        <p>
                            A new feature has been added
                            to your MeetFlow workspace.
                        </p>


                        <span class="notification-time">

                            <i class="fa-regular fa-clock"></i>

                            Just now

                        </span>

                    </div>


                    <button
                        class="notification-delete"
                        title="Delete notification">

                        <i class="fa-solid fa-xmark"></i>

                    </button>

                `;


                // Add to list

                list.appendChild(
                    newNotification
                );


                // Attach delete functionality

                const deleteBtn =
                    newNotification.querySelector(
                        '.notification-delete'
                    );


                attachDeleteButton(
                    deleteBtn
                );


                // Mark as read when clicked

                newNotification.addEventListener(
                    'click',
                    event => {

                        if (
                            event.target.closest(
                                '.notification-delete'
                            )
                        ) {

                            return;

                        }


                        newNotification.classList
                            .remove(
                                'unread'
                            );


                        updateUnreadCount();

                        filterNotifications();

                    }
                );


                // Apply filters again

                filterNotifications();


                // Disable Load More

                loadMoreBtn.textContent =
                    'No more notifications';


                loadMoreBtn.disabled =
                    true;


                loadMoreBtn.style.opacity =
                    '0.6';

            }
        );

    }


    // ===================================================
    // 16. INITIAL STATE
    // ===================================================

    updateUnreadCount();

    filterNotifications();

});