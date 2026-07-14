/*=========================================================
        TELEMETRY.JS
        ELECTROGRÚA SCADA
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    let running = false;

    //----------------------------------------
    // Valores base
    //----------------------------------------

    let telemetry = {

        voltage:12.0,

        current:0.0,

        temperature:25,

        magnetic:0,

        battery:100,

        motor1:false,

        motor2:false,

        magnet:false

    };

    //----------------------------------------
    // Elementos
    //----------------------------------------

    const voltageValue = document.getElementById("voltageValue");
    const currentValue = document.getElementById("currentValue");
    const temperatureValue = document.getElementById("temperatureValue");
    const magneticValue = document.getElementById("magneticValue");

    const voltageBar = document.getElementById("voltageBar");
    const currentBar = document.getElementById("currentBar");
    const temperatureBar = document.getElementById("temperatureBar");
    const magneticBar = document.getElementById("magneticBar");

    const powerValue = document.getElementById("powerValue");

    //----------------------------------------
    // Arranque
    //----------------------------------------

    document
    .getElementById("startSystem")
    .addEventListener("click",()=>{

        if(running) return;

        setTimeout(()=>{

            running=true;

            telemetry.motor1=true;
            telemetry.motor2=true;

            simulate();

        },4500);

    });

    //----------------------------------------
    // Simulación
    //----------------------------------------

    function simulate(){

        setInterval(()=>{

            if(!running) return;

            //---------------------------
            // Voltaje
            //---------------------------

            telemetry.voltage =
            random(11.8,12.2);

            //---------------------------
            // Corriente
            //---------------------------

            telemetry.current =
            random(2.8,4.1);

            //---------------------------
            // Temperatura
            //---------------------------

            telemetry.temperature += random(-0.1,0.2);

            telemetry.temperature =
            clamp(
                telemetry.temperature,
                26,
                37
            );

            //---------------------------
            // Campo Magnético
            //---------------------------

            if(telemetry.magnet){

                telemetry.magnetic=
                random(175,190);

            }else{

                telemetry.magnetic=0;

            }

            //---------------------------
            // Batería
            //---------------------------

            telemetry.battery-=0.02;

            telemetry.battery=
            Math.max(
                telemetry.battery,
                0
            );

            updateDashboard();

        },600);

    }

    //----------------------------------------
    // Actualizar Dashboard
    //----------------------------------------

    function updateDashboard(){

        voltageValue.innerHTML=
        telemetry.voltage.toFixed(1)+" V";

        currentValue.innerHTML=
        telemetry.current.toFixed(1)+" A";

        temperatureValue.innerHTML=
        telemetry.temperature.toFixed(1)+" °C";

        magneticValue.innerHTML=
        telemetry.magnetic.toFixed(0)+" mT";

        powerValue.innerHTML=
        Math.round(
            telemetry.battery
        )+"%";

        voltageBar.style.width=
        (telemetry.voltage/12.2)*100+"%";

        currentBar.style.width=
        (telemetry.current/4.2)*100+"%";

        temperatureBar.style.width=
        ((telemetry.temperature-25)/12)*100+"%";

        magneticBar.style.width=
        (telemetry.magnetic/190)*100+"%";

    }

    //----------------------------------------
    // Utilidades
    //----------------------------------------

    function random(min,max){

        return Math.random()*(max-min)+min;

    }

    function clamp(v,min,max){

        return Math.min(
            Math.max(v,min),
            max
        );

    }

    //----------------------------------------
    // API GLOBAL
    //----------------------------------------

    window.Telemetry=telemetry;

});