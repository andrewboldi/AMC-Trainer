document.onkeydown = function(e) {
    if(e.ctrlKey && e.keyCode == 13){
        get_new_problem();
    }
}
            function logo() {
                var color = document.getElementById("logoColor").value 
                switch (color) {
                    case "Red":
                        document.getElementById("logo").src = "img/logo_red.png";
                        break;
                    case "Orange":
                        document.getElementById("logo").src = "img/logo_orange.png";
                        break;
                    case "Yellow":
                        document.getElementById("logo").src = "img/logo_yellow.png";
                        break;
                    case "Green":
                        document.getElementById("logo").src = "img/logo_green.png";
                        break;
                    case "Blue":
                        document.getElementById("logo").src = "img/logo_blue.png";
                        break;
                    case "Purple":
                        document.getElementById("logo").src = "img/logo_purple.png";
                        break;
                    case "White":
                        document.getElementById("logo").src = "img/logo_white.png";
                        break;
                    case "Black":
                        document.getElementById("logo").src = "img/logo_black.png";
                        break;
                }
            }

            function grad() {
                    var left = document.getElementById("g1").value
                    var right = document.getElementById("g2").value
                    let hex2rgb= c=> `rgb(${c.substr(1).match(/../g).map(x=>+`0x${x}`)})`;
                    left = hex2rgb(left);
                    right = hex2rgb(right);
                    document.getElementById("body").style.backgroundImage = `linear-gradient(to right, ${left} 20%, ${right} 80%)`;
                    document.querySelectorAll('.button').forEach(element => {element.style.backgroundImage = `linear-gradient(to right, ${left}, ${right})`;}); 
                    document.querySelectorAll('.input').forEach(element => {element.style.backgroundImage = "none";});
      //              document.getElementsByClassName("button").style.backgroundImage = `linear-gradient(to right, ${right}, ${left})`;

                }
            function rgbToHex(c) {
              var hex = c.toString(16);
              return hex.length == 1 ? "0" + hex : hex;
            }
            function textc() {
                if (document.getElementById("textColor").value === "B") {
                    document.querySelectorAll('.text').forEach(element => {element.style.color = 'black';}); 
                    document.querySelectorAll('.text img').forEach(element => {element.style.filter = 'invert(0)';});
                } else {
                    document.querySelectorAll('.text').forEach(element => {element.style.color = 'white';}); 
                    document.querySelectorAll('.text img').forEach(element => {element.style.filter = 'invert(1)';});
                }
           }
             
 
           document.getElementById("ans").addEventListener('keyup', function(event) {
                if (event.code === 'Enter') {
                    event.preventDefault();
                    check_ans();
                }
            });

            var realAns;
            var userAns;
            var solcode;
            function shuffle(array) {
                var b = array.length, c, a;
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
                var xhr = new XMLHttpRequest();
                xhr.open("GET", link, true);
                xhr.addEventListener("readystatechange", function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        callback(xhr.responseText);
                    }
                });
                xhr.send();
            } 
            function saveLevel() {
                var t = document.getElementById("ddlViewBy").value;
                localStorage.setItem("type", t);
            } 

            var localStreak;
            function get_new_problem() {
                getHeight();
                if (localStorage.getItem("type") == null) {
                    localStorage.setItem("type", "All");
                }
                var type = localStorage.getItem("type");

                try {
                    localStreak = localStorage.getItem("streak");
                } catch (err) {
                    localStorage.setItem("streak", "0");
                }
                
                // var subject = document.getElementById("ddlViewBy2").value;
                // document.getElementById("check_ans").style.display = "none";
                document.getElementById("get_solution").style.display = "none";
                document.getElementById("if_correct").style.display = "none";
                if (type == "All") {
                    var arr1 = shuffle([8, 10, 12, "AIME"]);
                    type = arr1[0];
                }

                var if_ab = true;
                var isAJHSME;

                var arr2 = [];
                for (i = 2000; i < 2022; i++) {
                    arr2.push(i);
                }
                arr2 = shuffle(arr2);
                yr = arr2[0];

                var arrA = [];
                for (i = 1985; i < 1999; i++) {
                    arrA.push(i);
                }
                arrA = shuffle(arrA);
                yearAJ = arrA[0];

                if (type == 8) {
                    if_ab = false;
                    isAJHSME = shuffle([0, 1]);
                    isAJHSME = isAJHSME[0];
                } else if ((type == 10 || type == 12) && (yr < 2002)) {
                    if_ab = false;
                }

                var arr3 = [];
                for (i = 1; i < 26; i++) {
                    arr3.push(i);
                }
                arr3 = shuffle(arr3);
                prob = arr3[0];

                if (type == "AIME") {
                    var yrAIME = [];
                    for (i = 1983; i < 2021; i++) {
                        yrAIME.push(i);
                    }
                    yr = shuffle(yrAIME)[0];

                    if (yr < 2000) {
                        if_ab = false;
                    }
                    var probAIME = [];
                    for (i = 1; i < 16; i++) {
                        probAIME.push(i);
                    }
                    prob = shuffle(probAIME)[0];
                }

                var year = yr.toString();
                var amc = type.toString();
                var problem = prob.toString();

                var link = "";
                var answer_key_link = "";

                a_b = shuffle(["A", "B"]);
                a_b = a_b[0];
                var aorb = a_b.toString();
                var problem_id;

                if ((amc == "8") && (isAJHSME == 1)) {
                    link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", yearAJ, "_AJHSME_", "Problems_Problem_", problem, ".html");
                    answer_key_link = link.replaceAll("!", "|");
                    problem_id = "".concat(yearAJ, " AJHSME #", problem);
                } else if ((amc == "10" || amc == "12") && (if_ab == true)) {
                    link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", year, "_AMC_", amc, aorb, "_Problems_Problem_", problem, ".html");
                    answer_key_link = link.replaceAll("!", "|");
                    problem_id = "".concat(year, " AMC ", amc, aorb, " #", problem);
                } else if ((amc == "AIME") && (if_ab == false)) {
                    link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", year, "_AIME_", "Problems_Problem_", problem, ".html");
                    answer_key_link = link.replaceAll("!", "|");
                    problem_id = "".concat(year, " AIME #", problem);
                } else if ((amc == "AIME") && (if_ab == true)) {
                    if (aorb == "A") {
                        aorb = "I";
                    } else {
                        aorb = "II";
                    }
                    link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", year, "_AIME_", aorb, "_Problems_Problem_", problem, ".html");
                    answer_key_link = link.replaceAll("!", "|");
                    problem_id = "".concat(year, " AIME ", aorb, " #", problem);
                } else {
                    link = link.concat("https://wandering-sky-a896.cbracketdash.workers.dev/?!", year, "_AMC_", amc, "_Problems_Problem_", problem, ".html");
                    answer_key_link = link.replaceAll("!", "|");
                    problem_id = "".concat(year, " AMC ", amc, " #", problem);
                }
                /*
                var geolinks = ["https://wandering-sky-a896.cbracketdash.workers.dev/?https://artofproblemsolving.com/wiki/index.php/2014_AMC_10A_Problems/Problem_23"]

                let xhr4 = new XMLHttpRequest();
                xhr4.open('GET', "https://wandering-sky-a896.cbracketdash.workers.dev/?https://artofproblemsolving.com/wiki/index.php?title=Category:Introductory_Geometry_Problems&pagefrom=2010+AMC+12A+Problems%2FProblem+14", true);
                xhr4.send();

                xhr4.onreadystatechange = processt;
                function processt(e) {
                    if (xhr4.readyState == 4 && xhr4.status == 200) {
                        var georesp = xhr4.responseText;
                        georesp = georesp.replaceAll("'", '"');
                        georesp = georesp.replaceAll('<a href=\"', '<a target="_blank" href=\"https://wandering-sky-a896.cbracketdash.workers.dev/?https://www.artofproblemsolving.com');
                        georesp = georesp.split("<ul><li>")[1];
                        georesp = georesp.split("</li></ul>")[0];
                        georesp = "<ul><li>".concat(georesp, "</li></ul>");
                        console.log(georesp);
                    }
                }
                if (subject == "Geo") {
                    link = geolinks[0];
                    problem_id = geolinks[0].split("https://wandering-sky-a896.cbracketdash.workers.dev/?https://artofproblemsolving.com/wiki/index.php/")[1].replaceAll("_", " ").replaceAll("Problems/Problem", "#");
                } else if (subject == "Alg") {
                    link = shuffle(alglinks)[0];
                } else if (subject == "C+P") {
                    link = shuffle(cplinks)[0];
                } else if (subject == "NT") {
                    link = shuffle(ntlinks)[0];
                }
                */
                
                var probcode;
                function handleProbcode(response) {
                    probcode = response;
                    probcode = probcode.replaceAll("\\n'", "\n").replaceAll("\\n", "\n").replaceAll("b'", "");
                    document.getElementById("problem").innerHTML = probcode;
                    textc();
                }
                request(link, handleProbcode);

                var solcode;
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
                    textc();
                }
                request(answer_key_link, handleAns);

                document.getElementById("problem_id").innerHTML = problem_id;
                document.getElementById("check_ans").style.display = "flex";
                textc();

            }
            function conf() {
                confetti();
                confetti.reset();
                var duration = 1000;
                var animationEnd = Date.now() + duration;
                var defaults = {
                    startVelocity: 50,
                    spread: 1000,
                    ticks: 1000,
                    zIndex: 0
                };

                function randomInRange(min, max) {
                    return Math.random() * (max - min) + min;
                }

                var interval = setInterval(function() {
                    var timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    var particleCount = 200 * (timeLeft / duration);
                    // since particles fall down, start a bit higher than random
                    confetti(Object.assign({}, defaults, {
                        particleCount,
                        origin: {
                            x: randomInRange(0.1, 0.3),
                            y: Math.random() - 0.2
                        }
                    }));
                    confetti(Object.assign({}, defaults, {
                        particleCount,
                        origin: {
                            x: randomInRange(0.7, 0.9),
                            y: Math.random() - 0.2
                        }
                    }));
                }, 250);

            }

            function check_ans() {
                localStreak = parseInt(localStorage.getItem("streak"));
                userAns = ans.value.toString().toUpperCase();
                if (realAns === userAns) {
                    localStreak += 1;
                    var x = document.getElementById("get_solution");
                    if (x.style.display === "none") {
                        x.style.display = "block";
                    } else {
                        x.style.display = "none";
                    }
                    conf();
                    document.getElementById("check_ans").style.display = "none";
                    document.getElementById("if_correct").style.display = "block";
                    getHeight();
                } else {
                    localStreak = 0;
                    document.getElementById("ans").classList.add("error");
                    setTimeout(function() {
                        document.getElementById("ans").classList.remove('error');
                    }, 300);
                }
                document.getElementById("ans").value = '';
                document.getElementById("streak").innerHTML = localStreak;
                localStorage.setItem("streak", localStreak.toString());
                textc();
            }
