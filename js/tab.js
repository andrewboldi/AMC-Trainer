"use strict";

document.getElementsByClassName("tabButton")[0].click();

function changeTab(evt, tabName) {
    var i, x;
    x = document.getElementsByClassName("tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";
}
var modal = document.getElementById("settingsButton");

var info = document.getElementById("infoButton");
window.onclick = function(event) {
    if (event.target === modal) {
        modal.style.display = "none";
    } else if (event.target === info) {
        info.style.display = "none";
    }
}
