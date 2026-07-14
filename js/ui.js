/*=========================================================
        UI.JS
        ELECTROGRÚA CONTROL SYSTEM
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const upBtn = document.getElementById("upBtn");
    const downBtn = document.getElementById("downBtn");
    const magnetBtn = document.getElementById("magnetBtn");
    const stopBtn = document.getElementById("stopBtn");

    let magnetOn = false;

    //----------------------------------------------------
    // MOTOR IZQUIERDA
    //----------------------------------------------------

    leftBtn.addEventListener("click", () => {

        if(!window.Telemetry) return;

        Telemetry.current += 0.6;

        Telemetry.temperature += 0.3;

        addEventLog("Motor 1 girando a la izquierda","success");

        flashButton(leftBtn);

    });

    //----------------------------------------------------
    // MOTOR DERECHA
    //----------------------------------------------------

    rightBtn.addEventListener("click", () => {

        if(!window.Telemetry) return;

        Telemetry.current += 0.6;

        Telemetry.temperature += 0.3;

        addEventLog("Motor 1 girando a la derecha","success");

        flashButton(rightBtn);

    });

    //----------------------------------------------------
    // SUBIR
    //----------------------------------------------------

    upBtn.addEventListener("click", () => {

        if(!window.Telemetry) return;

        Telemetry.current += 0.8;

        Telemetry.temperature += 0.5;

        addEventLog("Motor 2 elevando cable","success");

        flashButton(upBtn);

    });

    //----------------------------------------------------
    // BAJAR
    //----------------------------------------------------

    downBtn.addEventListener("click", () => {

        if(!window.Telemetry) return;

        Telemetry.current += 0.5;

        Telemetry.temperature += 0.2;

        addEventLog("Motor 2 descendiendo cable","success");

        flashButton(downBtn);

    });

    //----------------------------------------------------
    // ELECTROIMÁN
    //----------------------------------------------------

    magnetBtn.addEventListener("click", () => {

        if(!window.Telemetry) return;

        magnetOn = !magnetOn;

        Telemetry.magnet = magnetOn;

        const status = document.getElementById("magnetStatus");

        if(magnetOn){

            status.innerHTML="ACTIVO";
            status.className="status-on";

            magnetBtn.innerHTML="DESACTIVAR ELECTROIMÁN";

            addEventLog("Electroimán ACTIVADO","warning");

        }else{

            status.innerHTML="OFF";
            status.className="status-off";

            magnetBtn.innerHTML="ACTIVAR ELECTROIMÁN";

            addEventLog("Electroimán DESACTIVADO","warning");

        }

        flashButton(magnetBtn);

    });

    //----------------------------------------------------
    // PARO DE EMERGENCIA
    //----------------------------------------------------

    stopBtn.addEventListener("click", () => {

        if(!window.Telemetry) return;

        Telemetry.current = 0;
        Telemetry.magnetic = 0;
        Telemetry.magnet = false;

        magnetOn = false;

        document.getElementById("magnetStatus").innerHTML="OFF";
        document.getElementById("magnetStatus").className="status-off";

        magnetBtn.innerHTML="ACTIVAR ELECTROIMÁN";

        addEventLog("¡¡PARO DE EMERGENCIA!!","error");

        flashButton(stopBtn);

    });

    //----------------------------------------------------
    // EFECTO BOTÓN
    //----------------------------------------------------

    function flashButton(button){

        button.style.transform="scale(.92)";

        button.style.boxShadow="0 0 30px cyan";

        setTimeout(()=>{

            button.style.transform="";

            button.style.boxShadow="";

        },180);

    }

});