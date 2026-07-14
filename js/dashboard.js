/*=========================================================
        DASHBOARD.JS
        SCADA RENDER ENGINE
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    //--------------------------------------------------
    // ELEMENTOS
    //--------------------------------------------------

    const voltageValue=document.getElementById("voltageValue");
    const currentValue=document.getElementById("currentValue");
    const temperatureValue=document.getElementById("temperatureValue");
    const magneticValue=document.getElementById("magneticValue");

    const voltageBar=document.getElementById("voltageBar");
    const currentBar=document.getElementById("currentBar");
    const temperatureBar=document.getElementById("temperatureBar");
    const magneticBar=document.getElementById("magneticBar");

    const powerValue=document.getElementById("powerValue");

    const motor1=document.getElementById("motor1Status");
    const motor2=document.getElementById("motor2Status");
    const transformer=document.getElementById("transformerStatus");
    const magnet=document.getElementById("magnetStatus");
    const system=document.getElementById("systemState");

    //--------------------------------------------------
    // RENDER
    //--------------------------------------------------

    function render(){

        //------------------------------------------
        // VALORES
        //------------------------------------------

        voltageValue.innerHTML =
        SCADA.voltage.toFixed(1)+" V";

        currentValue.innerHTML =
        SCADA.current.toFixed(1)+" A";

        temperatureValue.innerHTML =
        SCADA.temperature.toFixed(1)+" °C";

        magneticValue.innerHTML =
        SCADA.magneticField.toFixed(0)+" mT";

        powerValue.innerHTML =
        Math.round(SCADA.battery)+"%";

        //------------------------------------------
        // BARRAS
        //------------------------------------------

        voltageBar.style.width =
        (SCADA.voltage/12.2*100)+"%";

        currentBar.style.width =
        (SCADA.current/5*100)+"%";

        temperatureBar.style.width =
        ((SCADA.temperature-25)/20*100)+"%";

        magneticBar.style.width =
        (SCADA.magneticField/185*100)+"%";

        //------------------------------------------
        // MOTOR 1
        //------------------------------------------

        updateState(

            motor1,

            SCADA.motors.rotation,

            "READY",

            "OFFLINE"

        );

        //------------------------------------------
        // MOTOR 2
        //------------------------------------------

        updateState(

            motor2,

            SCADA.motors.hoist,

            "READY",

            "OFFLINE"

        );

        //------------------------------------------
        // TRANSFORMADOR
        //------------------------------------------

        updateState(

            transformer,

            SCADA.transformer,

            "ONLINE",

            "OFFLINE"

        );

        //------------------------------------------
        // ELECTROIMÁN
        //------------------------------------------

        updateState(

            magnet,

            SCADA.electromagnet,

            "ACTIVO",

            "OFF"

        );

        //------------------------------------------
        // SISTEMA
        //------------------------------------------

        updateState(

            system,

            SCADA.system,

            "ONLINE",

            "APAGADO"

        );

    }

    //--------------------------------------------------
    // CAMBIAR ESTADO
    //--------------------------------------------------

    function updateState(element,state,onText,offText){

        if(state){

            element.innerHTML=onText;

            element.className="status-on";

        }

        else{

            element.innerHTML=offText;

            element.className="status-off";

        }

    }

    //--------------------------------------------------
    // MOTOR DE RENDER
    //--------------------------------------------------

    setInterval(render,33);

});