/*=========================================================
        EVENTS.JS
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    const log=document.getElementById("eventLog");

    window.addEventLog=function(message,type="info"){

        const now=new Date();

        const time=now.toLocaleTimeString();

        const event=document.createElement("div");

        event.className="event "+type;

        event.innerHTML=`

            <span class="event-time">

                ${time}

            </span>

            <span class="event-message">

                ${message}

            </span>

        `;

        log.prepend(event);

        if(log.children.length>25){

            log.removeChild(log.lastChild);

        }

    }

});