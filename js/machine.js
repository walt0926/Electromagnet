/*=========================================================
        MACHINE.JS
        ELECTROGRÚA CONTROL SYSTEM
=========================================================*/

window.Machine = {

    /*=========================================
        ENCENDER SISTEMA
    =========================================*/

    start(){

        SCADA.system = true;

        SCADA.transformer = true;

        SCADA.ai = true;

        SCADA.voltage = 12;

        SCADA.current = 0.5;

        SCADA.temperature = 26;

        addEventLog("Sistema inicializado","success");

    },

    /*=========================================
        APAGAR SISTEMA
    =========================================*/

    shutdown(){

        SCADA.system = false;

        SCADA.motors.rotation = false;

        SCADA.motors.hoist = false;

        SCADA.electromagnet = false;

        SCADA.current = 0;

        SCADA.magneticField = 0;

        addEventLog("Sistema apagado","warning");

    },

    /*=========================================
        GIRAR IZQUIERDA
    =========================================*/

    rotateLeft(){

        if(!SCADA.system) return;

        SCADA.motors.rotation = true;

        SCADA.current += 0.5;

        SCADA.temperature += 0.2;

        addEventLog("Brazo girando a la izquierda","success");

    },

    /*=========================================
        GIRAR DERECHA
    =========================================*/

    rotateRight(){

        if(!SCADA.system) return;

        SCADA.motors.rotation = true;

        SCADA.current += 0.5;

        SCADA.temperature += 0.2;

        addEventLog("Brazo girando a la derecha","success");

    },

    /*=========================================
        SUBIR CABLE
    =========================================*/

    liftCable(){

        if(!SCADA.system) return;

        SCADA.motors.hoist = true;

        SCADA.current += 0.8;

        SCADA.temperature += 0.3;

        addEventLog("Cable subiendo","success");

    },

    /*=========================================
        BAJAR CABLE
    =========================================*/

    lowerCable(){

        if(!SCADA.system) return;

        SCADA.motors.hoist = true;

        SCADA.current += 0.8;

        SCADA.temperature += 0.3;

        addEventLog("Cable bajando","success");

    },

    /*=========================================
        ELECTROIMÁN
    =========================================*/

    toggleMagnet(){

        if(!SCADA.system) return;

        SCADA.electromagnet = !SCADA.electromagnet;

        if(SCADA.electromagnet){

            SCADA.magneticField = 185;

            SCADA.current += 1;

            addEventLog("Electroimán ACTIVADO","warning");

        }else{

            SCADA.magneticField = 0;

            addEventLog("Electroimán DESACTIVADO","warning");

        }

    },

    /*=========================================
        PARO DE EMERGENCIA
    =========================================*/

    emergencyStop(){

        SCADA.motors.rotation = false;

        SCADA.motors.hoist = false;

        SCADA.electromagnet = false;

        SCADA.current = 0;

        SCADA.magneticField = 0;

        addEventLog("PARO DE EMERGENCIA","error");

    }

};