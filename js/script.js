"use strict";
let problem_id;
let answer_key_link;
let localStreak;
let type;
let link = "";

function getLocalSettings() {
    return JSON.parse(localStorage.getItem("settingsObject"));
}
function logo() {
    const color = getLocalSettings()["logoColor"];
    document.getElementById("logoColor").value = color;
    document.getElementById("logo").src = `img/logo_${color}.png`;
}

function textFont() {
    const font = getLocalSettings()["fontFamily"];
    document.getElementById("fontFamily").value = font;
    document.getElementById("body").style.fontFamily = font;
}
function zenMode() {
    const zenMode = getLocalSettings()["zenMode"];
    if (zenMode === "On") {
	document.getElementById("problem_id").style.opacity = 0.0;
    } else {
	document.getElementById("problem_id").style.opacity = 1.0;
    }
    document.getElementById("zenModeOption").value = zenMode;
}
function grad() {
    const bgColor1 = getLocalSettings("settingsObject")["bgColor1"];
    const bgColor2 = getLocalSettings("settingsObject")["bgColor2"];

    const hex2rgb = c => `rgb(${c.substr(1).match(/../g).map(x=>+`0x${x}`)})`;
    const left = hex2rgb(bgColor1);
    const right = hex2rgb(bgColor2);

    document.getElementById("body").style.backgroundImage = `linear-gradient(to right, ${left} 20%, ${right} 80%)`;
    document.querySelectorAll('.button').forEach(element => {
        element.style.backgroundImage = `linear-gradient(to right, ${left}, ${right})`;
    }
    );
    document.querySelectorAll('.input').forEach(element => {
        element.style.backgroundImage = "none";
    }
    );
    document.getElementById("g1").value = bgColor1; // set settings option to saved value
    document.getElementById("g2").value = bgColor2;

}
function toggleWiggle() {
    const val = getLocalSettings()["imgWiggle"];
    document.querySelectorAll("img").forEach(element => {
        if (val === "Off") {
            element.classList.add("imgNoHover");
        } else {
            element.classList.remove("imgNoHover");
        }
    }
    );
    document.getElementById("imgWiggle").value = val;
}
function textc() {
    const desiredColor = getLocalSettings()["textColor"];
    document.querySelectorAll('.text, button').forEach(element => {
        element.style.color = desiredColor;
    }
    );
    const imgDesiredColor = ((desiredColor === "black") ? "invert(0)" : "invert(1)");
    document.querySelectorAll('latex, img').forEach(element => {
        element.style.filter = imgDesiredColor;
    }
    );
    document.querySelectorAll('.logoIcon').forEach(element => {
        element.style.filter = "invert(0)";
    }
    );
    document.getElementById("new_problem").style.filter = "invert(0)";
    document.getElementById("textColor").value = desiredColor;

}
function saveToDevice() {
    const storageObject = {
        "level": document.getElementById("levelDropdown").value,
        "textColor": document.getElementById("textColor").value,
        "bgColor1": document.getElementById("g1").value,
        "bgColor2": document.getElementById("g2").value,
        "logoColor": document.getElementById("logoColor").value,
        "zenMode": document.getElementById("zenModeOption").value,
        "imgWiggle": document.getElementById("imgWiggle").value,
        "fontFamily": document.getElementById("fontFamily").value
    }
    localStorage.setItem("settingsObject", JSON.stringify(storageObject));
}

let realAns;
let userAns;
let solcode;
function shuffle(array) {
    let b = array.length, c, a;
    while (0 !== b) {
        a = Math.floor(Math.random() * b);
        b -= 1;
        c = array[b];
        array[b] = array[a];
        array[a] = c;
    }

    return array;
}

function request(link, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", link, true);
    xhr.addEventListener("readystatechange", function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    });
    xhr.send();
}

function closeModal() {
    document.getElementById("settingsButton").style.display = "none";
    document.getElementById("infoButton").style.display = "none";
    document.getElementById("streakModal").style.display = "none";
}

function saveLevel() {
    const t = document.getElementById("levelDropdown").value;
    // localStorage.setItem("type", t);
}

function get_new_problem(flag=false) {
    let rest;
    getHeight(); // skipcq: JS-0125
    if (localStorage.getItem("type") === null) {
        localStorage.setItem("type", "All");
    }

    type = localStorage.getItem("type");
    document.getElementById("levelDropdown").value = localStorage.getItem("type");

    try {
        localStreak = localStorage.getItem("streak");
    } catch (err) {
        localStorage.setItem("streak", "0");
    }

    // let subject = document.getElementById("ddlViewBy2").value;
    // document.getElementById("check_ans").style.display = "none";
    document.getElementById("get_solution").style.display = "none";
    document.getElementById("if_correct").style.display = "none";
    if (type === "All") {
        [type, ...rest] = shuffle([8, 10, 12, "AIME"]); // type = shuffle([8, 10, 12, "AIME"])[0];
    }

    let if_ab = true;

    let arr2 = [];
    let yr = 0;
    for (let i = 2000; i < 2022; i++) {
        arr2.push(i);
    }
    [yr, ...rest] = shuffle(arr2); // yr = shuffle(arr2)[0];

    let arrA = [];
    for (let i = 1985; i < 1999; i++) {
        arrA.push(i);
    }
    let yearAJ = 0;
    [yearAJ, ...rest] = shuffle(arrA); // yearAJ = shuffle(arrA)[0];
    
    let isAJHSME = 0;
    if (type === 8) {
        if_ab = false;
        [isAJHSME, ...rest] = shuffle([0, 1]); // isAJHSME = shuffle([0, 1])[0];
    } else if ((type === 10 || type === 12) && (yr < 2002)) {
        if_ab = false;
    }

    let arr3 = [];
    for (let i = 1; i < 26; i++) {
        arr3.push(i);
    }
    arr3 = shuffle(arr3);
    let prob = arr3[0];

    if (type === "AIME") {
        const yrAIME = [];
        for (let i = 1983; i < 2021; i++) {
            yrAIME.push(i);
        }
        [yr, ...rest] = shuffle(yrAIME); // yr = shuffle(yrAIME)[0];

        if (yr < 2000) {
            if_ab = false;
        }
        const probAIME = [];
        for (let i = 1; i < 16; i++) {
            probAIME.push(i);
        }
        [prob, ...rest] = shuffle(probAIME); // prob = shuffle(probAIME)[0];
        
    }

    const year = yr.toString();
    const amc = type.toString();
    const problem = prob.toString();
    let aorb = shuffle(["A", "B"])[0].toString();

    if (flag === true) {
        link = localStorage.getItem("problem");
        answer_key_link = localStorage.getItem("answer");
        problem_id = localStorage.getItem("problemID");
        type = localStorage.getItem("problemType");
    } else {
        link = "";
        answer_key_link = "";
        problem_id = "";
        if ((amc === "8") && (isAJHSME === 1)) {
            link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", yearAJ, "_AJHSME_", "Problems_Problem_", problem, ".html");
            answer_key_link = link.replaceAll("!", "|");
            problem_id = "".concat(yearAJ, " AJHSME \#", problem);
        } else if ((amc === "10" || amc === "12") && (if_ab === true)) {
            link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", year, "_AMC_", amc, aorb, "_Problems_Problem_", problem, ".html");
            answer_key_link = link.replaceAll("!", "|");
            problem_id = "".concat(year, " AMC ", amc, aorb, " \#", problem);
        } else if ((amc === "AIME") && (if_ab === false)) {
            link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", year, "_AIME_", "Problems_Problem_", problem, ".html");
            answer_key_link = link.replaceAll("!", "|");
            problem_id = "".concat(year, " AIME \#", problem);
        } else if ((amc === "AIME") && (if_ab === true)) {
            aorb = ((aorb === "A") ? "I" : "II");
            link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", year, "_AIME_", aorb, "_Problems_Problem_", problem, ".html");
            answer_key_link = link.replaceAll("!", "|");
            problem_id = "".concat(year, " AIME ", aorb, " \#", problem);
        } else {
            link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", year, "_AMC_", amc, "_Problems_Problem_", problem, ".html");
            answer_key_link = link.replaceAll("!", "|");
            problem_id = "".concat(year, " AMC ", amc, " \#", problem);
        }
        localStorage.setItem("problem", link);
        localStorage.setItem("problemID", problem_id);
        localStorage.setItem("answer", answer_key_link);
        localStorage.setItem("problemType", amc);
    }
    /*
                let geolinks = ["https://wandering-sky-a896.cbracketdash.workers.dev/?https://artofproblemsolving.com/wiki/index.php/2014_AMC_10A_Problems/Problem_23"]
                let xhr4 = new XMLHttpRequest();
                xhr4.open('GET', "https://wandering-sky-a896.cbracketdash.workers.dev/?https://artofproblemsolving.com/wiki/index.php?title=Category:Introductory_Geometry_Problems&pagefrom=2010+AMC+12A+Problems%2FProblem+14", true);
                xhr4.send();
                xhr4.onreadystatechange = processt;
                function processt(e) {
                    if (xhr4.readyState === 4 && xhr4.status === 200) {
                        let georesp = xhr4.responseText;
                        georesp = georesp.replaceAll("'", '"');
                        georesp = georesp.replaceAll('<a href=\"', '<a target="_blank" href=\"https://wandering-sky-a896.cbracketdash.workers.dev/?https://www.artofproblemsolving.com');
                        georesp = georesp.split("<ul><li>")[1];
                        georesp = georesp.split("</li></ul>")[0];
                        georesp = "<ul><li>".concat(georesp, "</li></ul>");
                        console.log(georesp);
                    }
                }
                if (subject === "Geo") {
                    link = geolinks[0];
                    problem_id = geolinks[0].split("https://wandering-sky-a896.cbracketdash.workers.dev/?https://artofproblemsolving.com/wiki/index.php/")[1].replaceAll("_", " ").replaceAll("Problems/Problem", "#");
                } else if (subject === "Alg") {
                    link = shuffle(alglinks)[0];
                } else if (subject === "C+P") {
                    link = shuffle(cplinks)[0];
                } else if (subject === "NT") {
                    link = shuffle(ntlinks)[0];
                }
                */
    let probcode;
    function handleProbcode(response) {
        probcode = response;
        probcode = probcode.replaceAll("\\n'", "\n").replaceAll("\\n", "\n").replaceAll("b'", "");
        document.getElementById("problem").innerHTML = probcode;
        textc();
    }
    request(link, handleProbcode);

    function handleSolcode(response) {
        solcode = response;
        solcode = solcode.replaceAll("\\n'", "\n").replaceAll("\\n", "\n").replaceAll("b'", "");
        document.getElementById("get_solution").innerHTML = solcode;
        textc();
    }
    request(link.replaceAll("!", "$"), handleSolcode);

    function handleAns(response) {
        realAns = response;
        realAns = realAns.split("b'")[1].split("'")[0];
    }
    request(answer_key_link, handleAns);

    document.getElementById("problem_id").innerHTML = problem_id;
    document.getElementById("check_ans").style.display = "flex";

    textc();
}

function initialFunction()  // skipcq: JS-0239 
{
    feather.replace(); // skipcq: JS-0125
    getHeight(); // skipcq: JS-0125
  
    if (localStorage.getItem("settingsObject") === null) {
        saveToDevice();
    } else {
        saveSettings(true);
    }
    if (localStorage.getItem("problem") === null) {
        localStorage.setItem("problem", "");
        localStorage.setItem("answer", "");
        localStorage.setItem("problemID", "");
        get_new_problem();
    } else {
        link = localStorage.getItem("problem");
        answer_key_link = localStorage.getItem("answer");
        problem_id = localStorage.getItem("problemID");
        get_new_problem(true);
    }
}

function conf() {
    confetti(); // skipcq: JS-0125
    confetti.reset(); // skipcq: JS-0125
    const duration = 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
        startVelocity: 50,
        spread: 1000,
        ticks: 1000,
        zIndex: 0
    };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        let timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 200 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { // skipcq: JS-0125
            particleCount,
            origin: {
                x: randomInRange(0.1, 0.3),
                y: Math.random() - 0.2
            }
        }));
        confetti(Object.assign({}, defaults, { // skipcq: JS-0125
            particleCount,
            origin: {
                x: randomInRange(0.7, 0.9),
                y: Math.random() - 0.2
            }
        }));
    }, 250);

}

function check_ans(num) {
    localStreak = parseInt(localStorage.getItem("streak"));
    userAns = document.getElementById("ans").value.toString().toUpperCase();
    const aimeSearch = /^[0-9]{3}$/;
    const amcSearch = /^[ABCDE]{1}$/;
    if ((num === 1) || (aimeSearch.test(userAns) && type === "AIME" || amcSearch.test(userAns) && type !== "AIME")) {
        if (num === 0 && realAns === userAns) {
            localStorage.removeItem("problem");
            localStreak += 1;
            let x = document.getElementById("get_solution");
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
            conf();
            document.getElementById("check_ans").style.display = "none";
            document.getElementById("if_correct").style.display = "block";
            getHeight(); // skipcq: JS-0125
        } else {
            localStreak = 0;
            if (num === 0) {
                document.getElementById("ans").classList.add("error");
                setTimeout(function() {
                    document.getElementById("ans").classList.remove('error');
                }, 300);
            } else {
                document.getElementById("check_ans").style.display = "none";
                document.getElementById("if_correct").style.display = "block";
                document.getElementById("get_solution").style.display = "block";
            }
        }
        document.getElementById("streak").innerHTML = localStreak;
        document.getElementById("streak-count").innerHTML = localStreak;
        document.getElementById("ans").value = '';
        localStorage.setItem("streak", localStreak.toString());
        toggleWiggle();
    } else {
        alert("Enter a valid response!");
        document.getElementById("ans").value = '';
    }
    textc();
}

function giveUp()  // skipcq: JS-0239 
{
    let t = confirm("Are you sure you want to give up?");
    if (t) {
        check_ans(1);
    }

}
document.getElementById("ans").addEventListener('keyup', function(event) {
    if (event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault();
        check_ans(0);
    }
});
document.onkeydown = function(e) {
    if (e.ctrlKey && e.keyCode === 13) {
        get_new_problem();
        clearScreen();
    }
    if (e.ctrlKey && e.keyCode === 90) {
        undo(); // skipcq: JS-0125
    }
    if (e.ctrlKey && e.keyCode === 89) {
        redo(); // skipcq: JS-0125
    }
}
function saveSettings(initial=false)  // skipcq: JS-0239 
{
    if (!initial) {
        saveToDevice();
    }
    textc();
    grad();
    textFont();
    logo(); 
    toggleWiggle();
    zenMode();
    closeModal();
}
