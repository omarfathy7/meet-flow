const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");

menuToggle.addEventListener("click", () => {

   
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle("open");
    } else {
        sidebar.classList.toggle("close");
        mainContent.classList.toggle("expand");
    }

});

const taskTabs = document.querySelectorAll(".task-tabs button");

taskTabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        taskTabs.forEach((t) => t.classList.remove("active"));

        tab.classList.add("active");

    });

});
