"use strict";

const modal = document.getElementById("settingsButton");
const info = document.getElementById("infoButton");
const streak = document.getElementById("streakModal");

document.getElementsByClassName("tabButton")[0].click();

function changeTab(evt, tabName) { // skipcq: JS-0239
    const x = document.getElementsByClassName("tab");
    for (let i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
}
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    } else if (event.target === info) {
        info.style.display = "none";
    } else if (event.target === streak) {
        streak.style.display = "none";
    }
}
