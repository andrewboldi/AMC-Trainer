"use strict";

let canvas, ctx, flag = false;
let temp;
let height;
let width;
let undoList = [];
let undoLevel = 0;
let prevX = 0;
let currX = 0;
let prevY = 0;
let currY = 0;
let dot_flag = false;
let x = "black";

function getHeight() {
    if (document.getElementById("draw").style.display === "block") {
        const body = document.body;
        const html = document.documentElement;
        canvas = document.getElementById("can");
	ctx = canvas.getContext("2d");

        height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
	width = window.innerWidth - 20;
        canvas.height = height;
	canvas.width = width;

	if (undoList.length === 0) {
	    temp = canvas.getContext("2d").getImageData(0, 0, width, height);
	    ctx.putImageData(temp, 0, 0);
	} else {
	    ctx.putImageData(undoList[undoLevel], 0, 0);
	}
    }
}

function getCurrPos(e) {
    if (!e)
        var e = event; // skipcq: JS-0239

    if (e.touches) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            prevX = currX;
            prevY = currY;
            currX = touch.pageX - touch.target.offsetLeft;
            currY = touch.pageY - touch.target.offsetTop;
            if (prevX === 0 || prevY === 0) {
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
    if (undoList.length != 0) {
        ctx.putImageData(undoList[0], 0, 0);
    }
    getHeight();

    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("mousedown", handleMouseDown, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
    canvas.addEventListener("mouseout", handleMouseOut, false);
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    window.addEventListener("orientationchange", getHeight);
    if (undoList.length === 0) {
	temp = ctx.getImageData(0, 0, width, height);
        undoList.unshift(temp);
    }
}

function findxy(res, e) {
    if (res === "down") {
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
    if (res === "up" || res === "out") {
        flag = false;
    }
    if (res === "up" && res != "out") {
        temp = canvas.getContext("2d").getImageData(0, 0, width, height);
	if (undoLevel > 0) {
	    undoList.splice(0, undoLevel);
	}
	undoLevel = 0;
        undoList.unshift(temp);
    }
    if (res === "move") {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop + (window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop);
            draw();
        }
    }
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

function uninit() {
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mousedown", handleMouseDown);
    canvas.removeEventListener("mouseup", handleMouseUp);
    canvas.removeEventListener("mouseout", handleMouseOut);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener("orientationchange", getHeight);
}

function toggle() {
    if (document.getElementById("draw").style.display === "none") {
        //       document.getElementById("html").style.overflow = "hidden";
        document.getElementById("draw").style.display = "block";
        init();
    } else {
        document.getElementById("draw").style.display = "none";
        //        document.getElementById("html").style.overflow = "visible";
	uninit();
    }
}

function color(obj) {
    ctx.globalCompositeOperation = "source-over";
    x = obj.id;
}

function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    if (ctx.globalCompositeOperation === "destination-out") {
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

function handleTouchStart(e) {
    getCurrPos(e);
    event.preventDefault();
}

function handleTouchMove(e) {
    getCurrPos(e);
    draw();
    event.preventDefault();
}

function erase() {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(100,100,255,1)";
    ctx.fillStyle = "rgba(100, 100, 255, 1)";
}

function clearScreen() {
    const m = confirm("Are you sure you want to clear?");
    if (m) {
	undoList = [];
        ctx.clearRect(0, 0, width, height);
        undoList[0] = canvas.getContext("2d").getImageData(0, 0, width, height);
        temp = null;
        document.getElementById("draw").style.display = "none";
    }
}

