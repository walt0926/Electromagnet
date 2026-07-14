/*=========================================================
        ELECTROGRÚA CONTROL SYSTEM
        APP.JS
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    /*=========================================
        ELEMENTOS
    =========================================*/

    const startButton = document.getElementById("startSystem");

    const systemStatus = document.getElementById("systemStatus");

    const cards = document.querySelectorAll(".card");

    const statusDot = document.querySelector(".online-dot");

    const consoleWindow = document.querySelector(".console");

    const viewer = document.getElementById("viewer");

    /*=========================================
        VARIABLES
    =========================================*/

    let systemRunning = false;

    /*=========================================
        VALORES DEL SISTEMA
    =========================================*/

    const values = {

        voltage:12,

        current:3.8,

        magnetic:185,

        temperature:31,

        motors:"READY"

    };

    /*=========================================
        INICIAR
    =========================================*/

    startButton.addEventListener("click", startSequence);

    /*=========================================
        SECUENCIA
    =========================================*/

    function startSequence(){

        if(systemRunning) return;

        systemRunning=true;

        startButton.disabled=true;

        startButton.innerHTML="INICIANDO...";

        consoleWindow.innerHTML="";

        log("Sistema iniciado.");

        setTimeout(()=>{

            log("Comprobando alimentación...");

        },600);

        setTimeout(()=>{

            log("Motores detectados.");

        },1500);

        setTimeout(()=>{

            log("Transformador listo.");

        },2300);

        setTimeout(()=>{

            log("Electroimán listo.");

        },3000);

        setTimeout(()=>{

            log("Inicializando panel de control.");

        },3800);

        setTimeout(()=>{

            enableDashboard();

        },4700);

    }

    /*=========================================
        DASHBOARD
    =========================================*/

    function enableDashboard(){

        systemStatus.innerHTML="ONLINE";

        systemStatus.style.color="#22FF88";

        statusDot.style.background="#22FF88";

        viewer.innerHTML="MODELO 3D LISTO";

        startButton.innerHTML="SISTEMA ACTIVO";

        animateNumbers();

        log("Sistema ONLINE.");

        glowCards();

    }

    /*=========================================
        ANIMACIÓN
    =========================================*/

    function animateNumbers(){

        const numbers=document.querySelectorAll(".card h2");

        let voltage=0;

        let current=0;

        let magnetic=0;

        let temperature=25;

        const interval=setInterval(()=>{

            if(voltage<values.voltage)
                voltage++;

            if(current<values.current)
                current+=0.2;

            if(magnetic<values.magnetic)
                magnetic+=5;

            if(temperature<values.temperature)
                temperature++;

            numbers[1].innerHTML=voltage+" V";

            numbers[2].innerHTML=current.toFixed(1)+" A";

            numbers[3].innerHTML=magnetic+" mT";

            numbers[4].innerHTML=temperature+" °C";

            numbers[5].innerHTML=values.motors;

            if(voltage>=values.voltage &&
               magnetic>=values.magnetic){

                clearInterval(interval);

            }

        },40);

    }

    /*=========================================
        TARJETAS
    =========================================*/

    function glowCards(){

        cards.forEach((card,i)=>{

            setTimeout(()=>{

                card.style.boxShadow=

                "0 0 25px rgba(0,255,255,.25)";

            },i*150);

        });

    }

    /*=========================================
        TERMINAL
    =========================================*/

    function log(text){

        const line=document.createElement("p");

        line.innerHTML="► "+text;

        consoleWindow.appendChild(line);

        consoleWindow.scrollTop=consoleWindow.scrollHeight;

        if(window.addEventLog){

            window.addEventLog(text,"success");

        }
    }

});