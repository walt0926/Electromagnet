/*=========================================================
    ELECTROGRÚA
    BOOT.JS
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const bootScreen = document.getElementById("boot-screen");

    const app = document.getElementById("app");

    const progress = document.getElementById("boot-progress-fill");

    const terminal = document.querySelector(".boot-terminal");

    //------------------------------------------------------

    // MENSAJES

    //------------------------------------------------------

    const messages = [

        "Checking Power Unit...",

        "Checking Motor Driver...",

        "Checking Electromagnet...",

        "Checking Control Module...",

        "Checking Magnetic Core...",

        "Loading Physics Engine...",

        "Loading Dashboard...",

        "Loading User Interface...",

        "Loading EMIS Core...",

        "Starting Services...",

        "Initializing Sensors...",

        "SYSTEM READY"

    ];

    //------------------------------------------------------

    // LIMPIAR TERMINAL

    //------------------------------------------------------

    terminal.innerHTML = "";

    //------------------------------------------------------

    // OCULTAR APP

    //------------------------------------------------------

    app.style.opacity = "0";

    app.style.pointerEvents = "none";

    //------------------------------------------------------

    // VARIABLES

    //------------------------------------------------------

    let index = 0;

    let percent = 0;

    //------------------------------------------------------

    // EFECTO ESCRITURA

    //------------------------------------------------------

    function addMessage(text){

        const line = document.createElement("p");

        line.textContent = "> " + text;

        if(text==="SYSTEM READY"){

            line.style.color="#22FF88";

            line.style.fontWeight="bold";

        }

        terminal.appendChild(line);

        terminal.scrollTop=terminal.scrollHeight;

    }

    //------------------------------------------------------

    // CARGA

    //------------------------------------------------------

    const loader = setInterval(()=>{

        percent+=1;

        progress.style.width=percent+"%";

        //--------------------------------------------------

        // CADA 8%

        //--------------------------------------------------

        if(percent%8===0 && index<messages.length){

            addMessage(messages[index]);

            index++;

        }

        //--------------------------------------------------

        // TERMINAR

        //--------------------------------------------------

        if(percent>=100){

            clearInterval(loader);

            setTimeout(startSystem,800);

        }

    },45);

    //------------------------------------------------------

    // ENTRAR AL SISTEMA

    //------------------------------------------------------

    function startSystem(){

        bootScreen.style.opacity="0";

        bootScreen.style.transition="1s";

        setTimeout(()=>{

            bootScreen.style.display="none";

            app.style.pointerEvents="auto";

            app.style.opacity="1";

            app.style.transition="1.2s";

            animateCards();

        },1000);

    }

    //------------------------------------------------------

    // ANIMAR TARJETAS

    //------------------------------------------------------

    function animateCards(){

        const cards=document.querySelectorAll(".card");

        cards.forEach((card,i)=>{

            card.style.opacity="0";

            card.style.transform="translateY(40px)";

            setTimeout(()=>{

                card.style.transition=".6s";

                card.style.opacity="1";

                card.style.transform="translateY(0px)";

            },i*120);

        });

    }

});