"use strict";

var canvas, ctx, flag = false;
var temp;
var height;
var undoList = [];
var undoLevel = 0;
prevX = 0,
currX = 0,
prevY = 0,
currY = 0,
dot_flag = false;

var x = "black";

function getHeight() {
    if (document.getElementById("draw").style.display == "block") {
        var body = document.body
          , html = document.documentElement;
        canvas = document.getElementById("can");
        temp = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
        height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        canvas.height = height;
        h = canvas.height;
        canvas.getContext("2d").putImageData(temp, 0, 0);
    }
}

function handleTouchStart(e) {
    getCurrPos(e);
    event.preventDefault();
}

function handleTouchMove(e) {
    getCurrPos(e);
    draw();
    event.preventDefault();
}

function getCurrPos(e) {
    if (!e)
        var e = event;

    if (e.touches) {
        if (e.touches.length == 1) {
            var touch = e.touches[0];
            prevX = currX;
            prevY = currY;
            currX = touch.pageX - touch.target.offsetLeft;
            currY = touch.pageY - touch.target.offsetTop;
            if (prevX == 0 || prevY == 0) {
                prevX = currX;
                prevY = currY;
            }
        }
    }
}

function undo() {
    if (undoLevel + 1 != undoList.length) {
	undoLevel += 1;
    }
    canvas.getContext("2d").putImageData(undoList[undoLevel], 0, 0);
}

function redo() {
    if (undoLevel != 0) {
	undoLevel -= 1;
    }
    canvas.getContext("2d").putImageData(undoList[undoLevel], 0, 0);
}

function init() {
    canvas = document.getElementById("can");
    ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth - 20;
    try {
        canvas.getContext("2d").putImageData(temp, 0, 0);
    } catch (err) {
        ;
    }
    getHeight();
    w = canvas.width;

    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("mousedown", handleMouseDown, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
    canvas.addEventListener("mouseout", handleMouseOut, false);
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    window.addEventListener("orientationchange", getHeight);
    if (undoList.length == 0) {
	temp = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
        undoList.unshift(temp);
    }
}

function uninit() {
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mouseout", handleMouseOut);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener("orientationchange", getHeight);
}

function handleMouseMove(e) {
	findxy("move", e);
}
function handleMouseDown(e) {
	findxy("down", e);
}
function handleMouseUp(e) {
	findxy("up", e);
}
function handleMouseOut(e) {
	findxy("out", e);
}

function toggle() {
    if (document.getElementById("draw").style.display == "none") {
        //       document.getElementById("html").style.overflow = "hidden";
        document.getElementById("draw").style.display = "block";
        init();
    } else {
        temp = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
        document.getElementById("draw").style.display = "none";
        //        document.getElementById("html").style.overflow = "visible";
	uninit();
    }
}

function color(obj) {
    ctx.globalCompositeOperation = "source-over";
    switch (obj.id) {
    case "red":
        x = "#FF4136";
        break;
    case "orange":
        x = "#FF851B";
        break;
    case "yellow":
        x = "#FFDC00";
        break;
    case "green":
        x = "#2ECC40";
        break;
    case "blue":
        x = "#0074D9";
        break;
    case "purple":
        x = "#800080";
        break;
    case "black":
        x = "black";
        break;
    case "white":
        x = "#FFFFFF";
        break;
    }

}

function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    if (ctx.globalCompositeOperation == "destination-out") {
        ctx.arc(currX - 20, currY - 20, 40, 40, 6.283);
    } else {
        ctx.lineWidth = 2;
        ctx.lineTo(currX, currY);
    }

    ctx.strokeStyle = x;
    ctx.stroke();
    ctx.fill();
    ctx.closePath();

}

function erase() {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(100,100,255,1)";
    ctx.fillStyle = "rgba(100, 100, 255, 1)";
}

function clearScreen() {
    var m = confirm("Are you sure you want to clear?");
    if (m) {
        ctx.clearRect(0, 0, w, h);
        temp = null;
        document.getElementById("draw").style.display = "none";
	undoList = [];
    }
}

function findxy(res, e) {
    if (res == "down") {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.offsetLeft;
        currY = e.clientY - canvas.offsetTop + (window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop);

        flag = true;
        dot_flag = true;
        if (dot_flag) {
            ctx.beginPath();
            ctx.fillStyle = x;
            ctx.fillRect(currX, currY, 2, 2);
            ctx.closePath();
            dot_flag = false;
        }
    }
    if (res == "up" || res == "out") {
        flag = false;
    }
    if (res == "up" && res != "out") {
        temp = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
	if (undoLevel > 0) {
	    undoList.splice(0, undoLevel);
	}
	undoLevel = 0;
        undoList.unshift(temp);
    }
    if (res == "move") {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop + (window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop);
            draw();
        }
    }
}
