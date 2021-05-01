var canvas, ctx, flag = false;
var temp;
var height;
prevX = 0,
currX = 0,
prevY = 0,
currY = 0,
dot_flag = false;

var x = "black",
y = 2;

function getHeight() {
    if (document.getElementById("draw").style.display == "block") {
        var body = document.body, html = document.documentElement;
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

    if(e.touches) {
        if (e.touches.length == 1) {
            var touch = e.touches[0];
            prevX = currX;
            prevY = currY;
            currX=touch.pageX-touch.target.offsetLeft;
            currY=touch.pageY-touch.target.offsetTop;
            if (prevX == 0 || prevY == 0) {
                prevX = currX;
                prevY = currY;
            }
        }
    }
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
    console.log(temp);

    canvas.addEventListener("mousemove", function (e) {
        findxy("move", e)
    }, false);
    canvas.addEventListener("mousedown", function (e) {
        findxy("down", e)
    }, false);
    canvas.addEventListener("mouseup", function (e) {
        findxy("up", e)
    }, false);
    canvas.addEventListener("mouseout", function (e) {
        findxy("out", e)
    }, false);
    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    window.addEventListener("orientationchange", getHeight);
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
    }
}

function color(obj) {
    switch (obj.id) {
        case "green":
            x = "green";
            break;
        case "blue":
            x = "blue";
            break;
        case "red":
            x = "red";
            break;
        case "yellow":
            x = "yellow";
            break;
        case "orange":
            x = "orange";
            break;
        case "black":
            x = "black";
            break;
        case "white":
            x = "white";
            break;
    }
    if (x == "white") {
        y = 14;
    } else {
        y = 2;
    }

}

function draw() {
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = x;
    ctx.lineWidth = y;
    ctx.stroke();
    ctx.closePath();
}

function erase() {
    var m = confirm("Are you sure you want to clear?");
    if (m) {
        ctx.clearRect(0, 0, w, h);
        document.getElementById("draw").style.display = "none";
    }
}

function findxy(res, e) {
    if (res == "down") {
        prevX = currX;
        prevY = currY;
        currX = e.clientX - canvas.offsetLeft;
        currY = e.clientY - canvas.offsetTop + document.getElementById("body").scrollTop;

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
    if (res == "move") {
        if (flag) {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop + document.getElementById("body").scrollTop;
            draw();
        }
    }
}
