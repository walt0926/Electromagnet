/* =========================================================================
   ELECTRO-GRÚA // EMIS CONTROL INTERFACE
   ========================================================================= */

/* -------------------------------------------------------------------------
   0. SOUND ENGINE (synthesized via WebAudio — no external audio files)
------------------------------------------------------------------------- */
const Sound = (() => {
  let ctx = null;
  function ensure(){ if(!ctx){ ctx = new (window.AudioContext||window.webkitAudioContext)(); } return ctx; }
  function tone({freq=440, dur=.18, type='sine', gain=.05, sweep=null, delay=0}){
    const ac = ensure();
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if(sweep) osc.frequency.exponentialRampToValueAtTime(sweep, t0+dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(.0001, t0+dur);
    osc.connect(g); g.connect(ac.destination);
    osc.start(t0); osc.stop(t0+dur+.02);
  }
  return {
    click(){ tone({freq:1200,dur:.05,type:'square',gain:.03}); },
    power_on(){ tone({freq:120,dur:.5,type:'sawtooth',gain:.05,sweep:640}); tone({freq:1800,dur:.35,type:'sine',gain:.02,delay:.08}); },
    power_off(){ tone({freq:640,dur:.4,type:'sawtooth',gain:.05,sweep:80}); },
    motor(){ tone({freq:220,dur:.25,type:'triangle',gain:.035,sweep:280}); },
    magnet(){ tone({freq:340,dur:.3,type:'sine',gain:.04,sweep:900}); tone({freq:60,dur:.4,type:'sine',gain:.04,delay:.02}); },
    alarm(){ tone({freq:880,dur:.15,type:'square',gain:.045}); tone({freq:660,dur:.15,type:'square',gain:.045,delay:.18}); }
  };
})();

/* -------------------------------------------------------------------------
   1. BACKGROUND FX — hex grid + drifting particles (canvas)
------------------------------------------------------------------------- */
(function backgroundFX(){
  const hexCanvas = document.getElementById('bg-hex');
  const parCanvas = document.getElementById('bg-particles');
  const hctx = hexCanvas.getContext('2d');
  const pctx = parCanvas.getContext('2d');
  let w,h;
  function size(){
    w = window.innerWidth; h = window.innerHeight;
    [hexCanvas,parCanvas].forEach(c=>{ c.width=w; c.height=h; });
  }
  size(); window.addEventListener('resize', size);

  function drawHex(){
    hctx.clearRect(0,0,w,h);
    const r = 26, dx = r*1.75, dy = r*1.52;
    hctx.strokeStyle = 'rgba(0,229,255,0.10)'; hctx.lineWidth = 1;
    let row=0;
    for(let y=-r*2; y<h+r*2; y+=dy){
      const offset = (row%2)*dx/2;
      for(let x=-r*2; x<w+r*2; x+=dx){
        hexPath(hctx, x+offset, y, r); hctx.stroke();
      }
      row++;
    }
  }
  function hexPath(ctx,cx,cy,r){
    ctx.beginPath();
    for(let i=0;i<6;i++){
      const a = Math.PI/180*(60*i-30);
      const px = cx+r*Math.cos(a), py = cy+r*Math.sin(a);
      i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();
  }
  drawHex();
  window.addEventListener('resize', ()=>setTimeout(drawHex,50));

  const particles = Array.from({length:70}, ()=>({
    x: Math.random()*w, y: Math.random()*h,
    vx: (Math.random()-.5)*.15, vy: -.08-Math.random()*.22,
    r: Math.random()*1.6+.3, a: Math.random()*.5+.15
  }));
  function tickParticles(){
    pctx.clearRect(0,0,w,h);
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.y<-10){ p.y=h+10; p.x=Math.random()*w; }
      if(p.x<-10) p.x=w+10; if(p.x>w+10) p.x=-10;
      pctx.beginPath();
      pctx.fillStyle = `rgba(0,229,255,${p.a})`;
      pctx.arc(p.x,p.y,p.r,0,Math.PI*2); pctx.fill();
    });
    requestAnimationFrame(tickParticles);
  }
  tickParticles();
})();

/* -------------------------------------------------------------------------
   2. BOOT SEQUENCE
------------------------------------------------------------------------- */
(function boot(){
  const lines = [
    '> INICIALIZANDO NÚCLEO EMIS...',
    '> CARGANDO DIAGNÓSTICO DE MOTORES...',
    '> VERIFICANDO INTEGRIDAD ESTRUCTURAL...',
    '> CALIBRANDO ELECTROIMÁN PRINCIPAL...',
    '> SISTEMA LISTO.'
  ];
  const el = document.getElementById('boot-lines');
  lines.forEach(l=>{ const s=document.createElement('span'); s.textContent=l; el.appendChild(s); });

  const tl = gsap.timeline({delay:.3});
  tl.to('#hero-content',{opacity:1,duration:.4});
  tl.to('.pulse-ring',{opacity:.5,scale:1.15,duration:1.2,ease:'power1.out',stagger:.3},'-=.2');
  tl.to('.pulse-ring',{opacity:0,duration:1},'-=.4');
  el.querySelectorAll('span').forEach((s,i)=>{
    tl.to(s,{opacity:1,duration:.15,onStart:()=>Sound.click()}, i*0.38+0.2);
  });
  tl.to('#boot-btn',{opacity:1,duration:.5},'+=.2');

  document.getElementById('boot-btn').addEventListener('click', ()=>{
    Sound.power_on();
    document.getElementById('hero').classList.add('fade-out');
    gsap.to('#app',{opacity:1,duration:1,delay:.3});
    setTimeout(()=>{ document.getElementById('hero').style.display='none'; App.init(); }, 500);
  });
})();

/* -------------------------------------------------------------------------
   3. GLOBAL APP STATE + ORCHESTRATION & COMMUNICATIONS
------------------------------------------------------------------------- */
const App = (() => {
  const state = {
    power:false, magnet:false,
    motors:{giro:false, brazo:false, elevacion:false},
    armExtend:0,
    hookHeight:0,
    towerAngle:0,
    exploded:false,
    current:0, voltage:0
  };

  let charts = {}; // Contenedor para referencias de Chart.js

  // Comunicar comandos al modelo 3D contenido en el iframe
  function sendIframeCommand(action, value = null) {
    const iframe = document.getElementById('simulation-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ action, value }, '*');
    }
  }

  function log(msg){
    const c = document.getElementById('emis-console');
    if (!c) return;
    const l = document.createElement('div');
    l.className='line'; l.textContent = msg;
    c.appendChild(l);
    gsap.to(l,{opacity:1,duration:.3});
    c.scrollTop = c.scrollHeight;
    while(c.children.length>40) c.removeChild(c.firstChild);
  }

  function setDot(id,on,err){
    const d = document.getElementById(id);
    if (!d) return;
    d.classList.toggle('on', !!on && !err);
    d.classList.toggle('err', !!err);
  }

  function togglePower(){
    state.power = !state.power;
    const btn = document.getElementById('power-toggle');
    btn.textContent = state.power ? 'APAGAR' : 'ENCENDER';
    btn.classList.toggle('off', !state.power);
    setDot('dot-power', state.power);
    
    // Notificar al iframe el cambio de estado general
    sendIframeCommand('setPower', state.power);

    if(state.power){
      Sound.power_on(); 
      log('Sistema iniciado.');
      // Lanzar animación inicial de los dashboards al encender
      animateChartsOnPower();
    } else {
      Sound.power_off(); 
      log('Sistema apagado.');
      state.motors.giro=state.motors.brazo=state.motors.elevacion=false;
      if(state.magnet){ 
        state.magnet=false; 
        document.getElementById('magnet-btn').classList.remove('active'); 
        log('Electroimán desactivado.'); 
      }
      setDot('dot-motors',false); setDot('dot-magnet',false);
      renderMotorCards();
      // Apagar los datos dinámicos de los gráficos
      resetCharts();
    }
  }

  function motorPulse(name, label, direction = 1){
    if(!state.power){ 
      Sound.alarm(); 
      setDot('dot-power',false,true); 
      setTimeout(()=>setDot('dot-power',false),400); 
      log('Encienda el sistema antes de operar los motores.'); 
      return false; 
    }
    state.motors[name]=true;
    setDot('dot-motors', true);
    Sound.motor();
    renderMotorCards();
    log(label+' en operación.');

    // Enviar movimiento correspondiente al iframe
    sendIframeCommand('moveMotor', { motor: name, direction: direction });

    clearTimeout(state.motors['_t'+name]);
    state.motors['_t'+name] = setTimeout(()=>{ 
      state.motors[name]=false; 
      renderMotorCards();
      if(!state.motors.giro && !state.motors.brazo && !state.motors.elevacion) {
        setDot('dot-motors', state.power);
      }
      sendIframeCommand('stopMotor', { motor: name });
    }, 900);
    return true;
  }

  function toggleMagnet(){
    if(!state.power){ 
      Sound.alarm(); 
      log('Active el sistema para usar el electroimán.'); 
      return; 
    }
    state.magnet = !state.magnet;
    document.getElementById('magnet-btn').classList.toggle('active', state.magnet);
    setDot('dot-magnet', state.magnet);
    Sound.magnet();

    // Enviar estado del campo magnético al iframe
    sendIframeCommand('setMagnet', state.magnet);
    log(state.magnet ? 'Campo magnético estable. Objeto detectado.' : 'Electroimán desactivado.');
  }

  function toggleExploded(){
    if(!state.power){ 
      Sound.alarm(); 
      log('Active el sistema para acceder a la vista explosionada.'); 
      return; 
    }
    state.exploded = !state.exploded;
    document.getElementById('exploded-btn').classList.toggle('active', state.exploded);

    // Enviar comando para desensamblar/ensamblar piezas 3D en el iframe
    sendIframeCommand('setExploded', state.exploded);
    log(state.exploded ? 'Desensamblando piezas estructurales: Vista explosionada activada.' : 'Ensamblando componentes: Vista normal restablecida.');
  }

  const motorDefs = [
    {id:'giro', name:'Motor de Giro', act:'left/right'},
    {id:'brazo', name:'Motor del Brazo', act:'extend/retract'},
    {id:'elevacion', name:'Motor de Elevación', act:'up/down'},
    {id:'electroiman', name:'Electroimán', act:'magnet'}
  ];
  function renderMotorCards(){
    const host = document.getElementById('motor-cards');
    if(!host) return;
    host.innerHTML='';
    motorDefs.forEach(m=>{
      const active = m.id==='electroiman' ? state.magnet : state.motors[m.id];
      const rpm = active ? Math.round(1200+Math.random()*600) : 0;
      const amp = active ? (2.4+Math.random()*1.1).toFixed(1) : (state.power?0.1:0).toFixed(1);
      const volt = state.power ? (state.magnet||active? 22.0+Math.random()*.6 : 22.0).toFixed(1) : 0;
      const temp = active ? (38+Math.random()*9).toFixed(0) : (state.power?28:20);
      const el = document.createElement('div');
      el.className='motor-card';
      el.innerHTML = `
        <div class="motor-head">
          <div class="motor-name">${m.name}</div>
          <div class="motor-state ${active?'on':''}">${active?'ACTIVO':'STANDBY'}</div>
        </div>
        <div class="motor-grid">
          <div><span></span><b>${rpm} RPM</b></div>
          <div><span></span><b>${amp} A</b></div>
          <div><span></span><b>${volt} V</b></div>
          <div><span></span><b>${temp}°C</b></div>
        </div>
        <div class="led-row">
          <div class="led ${active?'on-active':''}">ON</div>
          <div class="led ${!active?'off-active':''}">OFF</div>
        </div>`;
      host.appendChild(el);
    });
  }

  function bindMovementButtons(){
    document.querySelectorAll('.ctrl-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const act = btn.dataset.act;
        Sound.click();
        if(act==='left'){ motorPulse('giro','Motor de giro', -1); }
        if(act==='right'){ motorPulse('giro','Motor de giro', 1); }
        if(act==='up'){ motorPulse('elevacion','Motor de elevación', 1); }
        if(act==='down'){ motorPulse('elevacion','Motor de elevación', -1); }
        if(act==='extend'){ motorPulse('brazo','Motor del brazo', 1); }
        if(act==='retract'){ motorPulse('brazo','Motor del brazo', -1); }
      });
    });
  }

  // --- FULLSCREEN CONTROLLER ---
  function initFullscreen() {
    const btn = document.getElementById('btn-fullscreen');
    const container = document.getElementById('iframe-viewport-panel');
    if (!btn || !container) return;

    btn.addEventListener('click', () => {
      Sound.click();
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
          log(`Error al intentar entrar en pantalla completa: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    });
  }

  // --- HISTÓRICO DE ESTADÍSTICAS & GRAFICOS CONDICIONADOS ---
  const baseOpts = (yTitle)=>({
    responsive:true, maintainAspectRatio:false,
    animation: { duration: 1000, easing: 'easeOutQuart' },
    plugins:{ legend:{display:false} },
    scales:{
      x:{ grid:{color:'rgba(255,255,255,.03)'}, ticks:{color:'#8fa3b3', font:{family:'Share Tech Mono'}} },
      y:{ grid:{color:'rgba(255,255,255,.03)'}, ticks:{color:'#8fa3b3', font:{family:'Share Tech Mono'}}, title:{display:!!yTitle, text:yTitle, color:'#8fa3b3'} }
    }
  });

  function initCharts(){
    const labels = ['L','M','X','J','V','S','D'];
    const consumoEl = document.getElementById('chart-consumo');
    if(consumoEl) {
      charts.consumo = new Chart(consumoEl, {
        type:'line',
        data:{labels, datasets:[{label:'Consumo energético (kWh)', data:[0,0,0,0,0,0,0],
          borderColor:'#00e6f6', backgroundColor:'rgba(0,230,246,.12)', tension:.35, fill:true}]},
        options: baseOpts('kWh')
      });
    }
    const pesoEl = document.getElementById('chart-peso');
    if(pesoEl) {
      charts.peso = new Chart(pesoEl, {
        type:'bar',
        data:{labels, datasets:[{label:'Peso levantado (kg)', data:[0,0,0,0,0,0,0],
          backgroundColor:'rgba(47,124,255,.55)', borderColor:'#2f7cff', borderWidth:1}]},
        options: baseOpts('kg')
      });
    }
    const rendEl = document.getElementById('chart-rendimiento');
    if(rendEl) {
      charts.rendimiento = new Chart(rendEl, {
        type:'line',
        data:{labels, datasets:[{label:'Rendimiento (%)', data:[0,0,0,0,0,0,0],
          borderColor:'#00ffa2', backgroundColor:'rgba(0,255,162,.12)', tension:.35, fill:true}]},
        options: baseOpts('%')
      });
    }
    const tiempoEl = document.getElementById('chart-tiempo');
    if(tiempoEl) {
      charts.tiempo = new Chart(tiempoEl, {
        type:'bar',
        data:{labels, datasets:[{label:'Tiempo activo (h)', data:[0,0,0,0,0,0,0],
          backgroundColor:'rgba(255,59,78,.45)', borderColor:'#ff3b4e', borderWidth:1}]},
        options: baseOpts('h')
      });
    }
  }

  // Genera y anima los datos reales de los dashboards únicamente al encender el sistema
  function animateChartsOnPower() {
    if (!state.power) return;
    
    // Inyectar datos activos con animación suave de entrada
    if (charts.consumo) {
      charts.consumo.data.datasets[0].data = Array.from({length:7}, () => +(1.5+Math.random()*2).toFixed(2));
      charts.consumo.update();
    }
    if (charts.peso) {
      charts.peso.data.datasets[0].data = Array.from({length:7}, () => +(3+Math.random()*7).toFixed(1));
      charts.peso.update();
    }
    if (charts.rendimiento) {
      charts.rendimiento.data.datasets[0].data = Array.from({length:7}, () => +(80+Math.random()*16).toFixed(1));
      charts.rendimiento.update();
    }
    if (charts.tiempo) {
      charts.tiempo.data.datasets[0].data = Array.from({length:7}, () => +(1+Math.random()*5).toFixed(1));
      charts.tiempo.update();
    }
  }

  // Resetea los datos a cero cuando el sistema es apagado
  function resetCharts() {
    Object.keys(charts).forEach(key => {
      charts[key].data.datasets[0].data = [0,0,0,0,0,0,0];
      charts[key].update();
    });
  }

  function init(){
    renderMotorCards();
    bindMovementButtons();
    initCharts();
    initFullscreen();
    document.getElementById('power-toggle').addEventListener('click', togglePower);
    document.getElementById('magnet-btn').addEventListener('click', toggleMagnet);
    document.getElementById('exploded-btn').addEventListener('click', toggleExploded);
    
    log('Sistema EMIS operativo. Cargando lienzo de simulación física...');
    setInterval(()=>{ 
      if(state.power) {
        renderMotorCards();
        // Variación ligera en caliente en los gráficos si está encendido
        if (Math.random() > 0.7) animateChartsOnPower();
      } 
    }, 1400);
  }

  return { init, state, log, togglePower, toggleMagnet, motorPulse };
})();