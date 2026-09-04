/* ═══════════════════════════════════════════════════════════════
   VIRUS! en línea — cliente
   Pinta lo que manda el servidor y le devuelve intenciones.
   Ninguna decisión de reglas se toma aquí.
   ═══════════════════════════════════════════════════════════════ */
"use strict";
const R = window.REGLAS, A = window.ARTE;
const $app = document.getElementById("app"), $atril = document.getElementById("atril"),
      $modal = document.getElementById("modal"), $cod = document.getElementById("cod"),
      $mazo = document.getElementById("mazo");
const S = window.SONIDO;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const mmss = ms => { const t = Math.max(0, Math.round(ms/1000));
  return Math.floor(t/60) + ":" + String(t%60).padStart(2,"0"); };

let ws = null, V = null, sesion = null, sel = null, paso = null, reintento = 0;
let recibido = 0, restante = null, tic = null;
try { sesion = JSON.parse(localStorage.getItem("virus.sesion") || "null"); } catch(e) {}
const guardar = () => { try { localStorage.setItem("virus.sesion", JSON.stringify(sesion)); } catch(e) {} };

/* ── Conexión ───────────────────────────────────────────────── */
async function pantallaJuego(){
  try { const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); } catch(e) {}
  try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape"); } catch(e) {}
}
function salirPantallaJuego(){
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e) {}
  try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch(e) {}
}
function conectar() {
  ws = new WebSocket((location.protocol === "https:" ? "wss" : "ws") + "://" + location.host);
  ws.onopen = () => { reintento = 0; if (sesion) mandar({t:"reconectar", codigo:sesion.codigo, token:sesion.token}); };
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.t === "sesion") { sesion = {codigo:m.codigo, token:m.token}; guardar(); }
    if (m.t === "vista") { V = m.v; sel = null; paso = null; recibido = Date.now(); restante = V.restante; pintar(); sonarSegunVista(); }
    if (m.t === "error") alerta(m.msg);
  };
  ws.onclose = () => { if (reintento++ < 40) setTimeout(conectar, Math.min(600 * reintento, 4000)); };
}
const mandar = m => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
setInterval(() => mandar({t:"latido"}), 120000);
function alerta(txt) {
  const d = document.createElement("div"); d.className = "alerta"; d.textContent = txt;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2600);
}

/* ── Reloj local, interpolado desde lo que mandó el servidor ── */
function arrancarTic() {
  clearInterval(tic);
  tic = setInterval(() => {
    if (!V || !V.iniciada || V.ganador !== null) return;
    if (V.votacion) return pintarVotacion();
    if (V.pendiente) return pintarPendiente();
    if (restante === null) return;
    const queda = restante - (Date.now() - recibido);
    const bar = document.getElementById("relojTurno"), num = document.getElementById("segTurno");
    const total = restante || 1;
    if (bar) { bar.style.width = Math.max(0, Math.min(100, queda / total * 100)) + "%";
      bar.classList.toggle("poco", queda < 10000); }
    if (num) { num.textContent = mmss(queda); num.classList.toggle("poco", queda < 10000); }
    if (miTurno() && queda < 5200 && queda > 0) {
      const seg = Math.ceil(queda/1000);
      if (seg !== ultimoTic) { ultimoTic = seg; S.efecto("tic"); }
    }
  }, 250);
}

/* ── Enrutado ───────────────────────────────────────────────── */
function pintar() {
  $cod.textContent = V && V.codigo ? V.codigo : "";
  $mazo.textContent = (V && V.iniciada && innerWidth > 400) ? "mazo " + V.mazo : "";
  if (!V) return portada();
  if (!V.iniciada) return sala();
  mesa();
  arrancarTic();
  if (V.votacion) pintarVotacion();
  else if (V.pendiente) pintarPendiente();
  else if (!$modal.dataset.abierto) $modal.innerHTML = "";
}

/* ── Portada ────────────────────────────────────────────────── */
function portada() {
  $atril.innerHTML = "";
  const muestrario = [
    {c:{k:"organo",c:"rojo"}, t:"Órganos"},
    {c:{k:"virus",c:"azul",t:"basico"}, t:"Virus"},
    {c:{k:"medicina",c:"verde",t:"basica"}, t:"Medicinas"},
    {c:{k:"tratamiento",tr:"trasplante"}, t:"Tratamientos"}
  ];
  $app.innerHTML = `
    <div class="vitrina">${muestrario.map((m,i) =>
      `<div class="vcarta" style="animation-delay:${i*.12}s">
        ${A.caraCarta(m.c, R.colorCarta(m.c), false)}<span class="vetiq">${m.t}</span></div>`).join("")}</div>
    <div class="panel">
      <h2>Arma la mesa</h2>
      <p>De dos a seis jugadores, cada uno en su propio teléfono.</p>
      <input class="campo" id="nombre" maxlength="14" placeholder="Tu nombre"
        value="${esc(localStorage.getItem("virus.nombre")||"")}">
      <div style="height:11px"></div>
      <button class="btn ancho oro" id="bCrear">Crear una sala</button>
    </div>
    <div class="panel">
      <h2>Entrar con código</h2>
      <p>Te lo pasa quien creó la sala.</p>
      <input class="campo codigo" id="codigo" maxlength="4" placeholder="ABCD" autocapitalize="characters">
      <div style="height:11px"></div>
      <button class="btn ancho claro" id="bUnir">Entrar</button>
    </div>
    ${sesion ? `<div class="panel"><h2>Tenías una partida</h2>
      <p class="junto">Sala ${esc(sesion.codigo)}. Vuelves a tu silla con tu mano intacta.</p>
      <div style="height:12px"></div>
      <button class="btn ancho" id="bVolver">Volver a esa mesa</button></div>` : ""}`;
  const nom = () => { const n = document.getElementById("nombre").value.trim();
    localStorage.setItem("virus.nombre", n); return n; };
  document.getElementById("bCrear").onclick = () => mandar({t:"crear", nombre:nom()});
  document.getElementById("bUnir").onclick = () => {
    const c = document.getElementById("codigo").value.trim().toUpperCase();
    if (c.length !== 4) return alerta("El código tiene cuatro letras");
    mandar({t:"unir", codigo:c, nombre:nom()});
  };
  if (sesion) document.getElementById("bVolver").onclick =
    () => mandar({t:"reconectar", codigo:sesion.codigo, token:sesion.token});
}

/* ── Sala de espera ─────────────────────────────────────────── */
function sala() {
  $atril.innerHTML = "";
  const o = V.opciones, anf = V.anfitrion;
  const segs = [[0,"sin límite"],[30,"30 s"],[45,"45 s"],[60,"1 min"],[90,"1 min 30"],[120,"2 min"]];
  const mins = [[0,"sin banco"],[5,"5 min"],[10,"10 min"],[15,"15 min"],[20,"20 min"]];
  $app.innerHTML = `
    <div class="panel" style="text-align:center">
      <p class="rot">Código de la sala</p>
      <div class="campo codigo" style="border-style:dashed">${esc(V.codigo)}</div>
    </div>
    <div class="mesa">${V.jugadores.map((j,i) => `
      <div class="silla ${i===V.yo?"mia":""}">
        <div class="avwrap">${A.avatar(i, 44)}</div>
        <div class="datos"><div class="linea"><span class="quien">${esc(j.nombre)}</span>
          ${i===0?'<span class="mini">anfitrión</span>':""}
          ${i===V.yo?'<span class="mini">tú</span>':""}
          ${j.conectado?"":'<span class="mini off">sin señal</span>'}</div>
          <div class="mini">${A.SILLAS[i%6].nombre}</div></div></div>`).join("")}
    </div>
    <div class="panel">
      <h2>Reglas de la partida</h2>
      <p>Las define quien creó la sala.</p>
      <label class="opt"><input type="checkbox" id="oExp" ${o.expansion?"checked":""} ${anf?"":"disabled"}>
        <span>Jugar con VIRUS! 2 Evolution: órgano biónico, virus evolucionados, medicinas experimentales y cuatro tratamientos más.</span></label>
      <label class="opt"><input type="checkbox" id="oDuelo" ${o.duelo?"checked":""} ${anf?"":"disabled"}>
        <span>Modo duelo: con dos jugadores se gana con cinco órganos sanos.</span></label>
      <label class="opt"><input type="checkbox" id="oInm" ${o.metaInmune?"checked":""} ${anf?"":"disabled"}>
        <span>Modo blindaje: para ganar no basta con tener los órganos sanos, hay que tenerlos
        <b>inmunizados</b>. Partidas más largas y difíciles.</span></label>
      <label class="opt"><input type="checkbox" id="oHal" ${o.halloween?"checked":""} ${anf?"":"disabled"}>
        <span>Jugar con VIRUS! Halloween: órgano mutante, ladrones de colores, experimento fallido,
        aparición, trasplante alienígena, cambio de cuerpos y el truco o trato, que impide ganar
        a quien lo tenga encima.</span></label>
      <label class="opt"><input type="checkbox" id="oAp" ${o.aprendizaje?"checked":""} ${anf?"":"disabled"}>
        <span>Modo aprendizaje: el asistente sugiere jugadas. Se activa para todos.</span></label>
      <p class="rot">Tiempo para jugar cada turno</p>
      <div class="seg" id="segTurnoSel">${segs.map(([v,t]) =>
        `<button data-seg="${v}" aria-pressed="${o.segundosTurno===v}" ${anf?"":"disabled"}>${t}</button>`).join("")}</div>
      <p class="rot">Banco de tiempo por jugador, para toda la partida</p>
      <div class="seg" id="minJugSel">${mins.map(([v,t]) =>
        `<button data-min="${v}" aria-pressed="${o.minutosJugador===v}" ${anf?"":"disabled"}>${t}</button>`).join("")}</div>
      <p class="junto">Si se acaba el tiempo de un turno, el servidor juega la mejor carta disponible por ese jugador y la mesa sigue.</p>
    </div>
    ${anf ? `<button class="btn ancho oro" id="bEmpezar" ${V.jugadores.length<2?"disabled":""}>
        ${V.jugadores.length<2?"Falta al menos un jugador":"Empezar la partida"}</button><div style="height:16px"></div>`
      : `<div class="panel"><p class="junto">Esperando a que ${esc(V.jugadores[0].nombre)} empiece.</p></div>`}`;
  if (!anf) return;
  const enviar = () => mandar({t:"opciones", opciones:{
    expansion: document.getElementById("oExp").checked,
    duelo: document.getElementById("oDuelo").checked,
    metaInmune: document.getElementById("oInm").checked,
    aprendizaje: document.getElementById("oAp").checked,
    halloween: document.getElementById("oHal").checked,
    segundosTurno: V.opciones.segundosTurno, minutosJugador: V.opciones.minutosJugador }});
  ["oExp","oDuelo","oAp","oHal","oInm"].forEach(id => document.getElementById(id).onchange = enviar);
  $app.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => { V.opciones.segundosTurno = +b.dataset.seg; enviar(); });
  $app.querySelectorAll("[data-min]").forEach(b => b.onclick = () => { V.opciones.minutosJugador = +b.dataset.min; enviar(); });
  const e = document.getElementById("bEmpezar"); if (e) e.onclick = () => { pantallaJuego(); mandar({t:"empezar"}); };
}

/* ── Mesa circular estilo UNO ───────────────────────────────── */
const miTurno = () => V.turno === V.yo && V.ganador === null && !V.terminada && !V.pendiente && !V.votacion;

function blancos() {
  if (sel === null || !V.jugadas) return [];
  let js = V.jugadas[sel];
  if (paso && paso.tipo === "trasplante") js = js.filter(j => j.a.o === paso.o);
  return js;
}
function esBlanco(ji, oi) {
  return blancos().some(j =>
    (j.o !== undefined && j.j === ji && j.o === oi) ||
    (j.tipo === "trasplante" && (paso ? (j.b.j === ji && j.b.o === oi) : (j.a.j === ji && j.a.o === oi))));
}
function tocarOrgano(ji, oi) {
  const js = blancos(), carta = V.mano[sel];
  if (carta.k === "tratamiento" && carta.tr === "trasplante" && !paso) {
    if (!js.some(j => j.a.j === ji && j.a.o === oi)) return;
    paso = {tipo:"trasplante", o:oi}; return mesa();
  }
  const j = js.find(x =>
    (x.o !== undefined && x.j === ji && x.o === oi) ||
    (x.tipo === "trasplante" && x.b.j === ji && x.b.o === oi));
  if (!j) return;
  mandar({t:"jugar", idx:sel, jugada:j}); sel = null; paso = null;
}

/* Reparte a los rivales en los bordes: 1 arriba; 2 arriba/abajo; 3+ arriba e izq/der. */
function posiciones(n) {
  const mapa = {
    1:["top"], 2:["left","right"], 3:["left","top","right"],
    4:["left","topL","topR","right"], 5:["left","topL","top","topR","right"]
  };
  return mapa[n] || mapa[5];
}

function fichaHTML(o, ji, oi, chica) {
  const est = R.estadoOrgano(o), sano = R.esSano(o), blanco = esBlanco(ji, oi);
  const blind = R.blindado(o);
  const virus = o.virus[0], med = o.medicinas[0];
  const sello = virus ? `<span class="sello">${A.dibujo(virus, R.ORG[virus.c].hex, true)}</span>` : "";
  const escudo = est === "inmunizado" ? `<span class="escudo">${A.dibujo(med, "#FBFAF7", true)}</span>`
    : est === "vacunado" ? `<span class="escudo vac">${A.dibujo(med, "#FBFAF7", true)}</span>` : "";
  const anillo = (V.metaInmune && blind) ? `<span class="blindado"></span>` : "";
  return `<button class="ficha ${chica?"mini":""} ${sano?"":"enferma"} ${blanco?"blanco":""}" data-org="${ji}.${oi}">
    <span class="cara">${A.dibujoOrgano(o.carta.c)}</span>${anillo}${sello}${escudo}</button>`;
}

/* mano ajena en abanico de reversos */
function abanico(n, orient) {
  n = Math.min(n, 7);
  let h = "";
  const paso = orient === "vert" ? 15 : 17, base = -(n-1)*paso/2;
  for (let i = 0; i < n; i++)
    h += `<span class="reverso ${orient}" style="transform:rotate(${(base+i*paso).toFixed(0)}deg)"></span>`;
  return `<span class="abanico ${orient}">${h}</span>`;
}

function rivalHTML(i, pos) {
  const j = V.jugadores[i], activo = V.turno === i && !j.fuera;
  const meta = V.metaInmune ? j.inmunes : j.sanos;
  const orient = (pos === "left" || pos === "right") ? "vert" : "horz";
  return `<div class="rival ${pos} ${activo?"activo":""} ${j.fuera?"ido":""}" data-silla="${i}">
    <div class="rcab">
      <div class="ravwrap">${A.avatar(i, 38)}
        <span class="rmeta ${meta>=V.objetivo-1?"cerca":""}">${meta}/${V.objetivo}</span></div>
      <div class="rinfo"><span class="rnom">${esc(j.nombre)}</span>
        <span class="rmini">${j.fuera?"se retiró":j.cartas+" cartas"}${j.truco?" · 🎃":""}</span></div>
    </div>
    ${j.fuera?"":abanico(j.cartas, orient)}
    <div class="rcuerpo">${j.cuerpo.map((o,oi)=>fichaHTML(o,i,oi,true)).join("")}</div>
  </div>`;
}

function mesa() {
  const rivales = V.jugadores.map((_,i)=>i).filter(i => i !== V.yo);
  const pos = posiciones(rivales.length);
  let fin = "";
  if (V.terminada)
    fin = `<div class="cierre"><div class="finsin"><b>Partida terminada</b><span>${esc(V.terminada)}</span></div>
      ${V.anfitrion?`<button class="btn oro" id="bRevancha">Otra partida</button>`:""}</div>`;
  else if (V.ganador !== null)
    fin = `<div class="cierre"><div class="trofeo"><b>${V.ganador===V.yo?"¡Ganaste!":esc(V.jugadores[V.ganador].nombre)+" ganó"}</b>
      <span>${V.metaInmune?"4 órganos inmunizados":V.jugadores[V.ganador].sanos+" órganos sanos"}</span></div>
      ${V.anfitrion?`<button class="btn oro" id="bRevancha">Otra partida</button>`:""}</div>`;

  const centro = `<div class="pila">
    <div class="monton">${V.descarte?A.caraCarta(V.descarte, R.colorCarta(V.descarte), false):`<div class="vaciopila">VIRUS!</div>`}</div>
    <div class="conteo2">${V.mazo} · ${V.descartados}${V.retiradas?" · ⚗"+V.retiradas:""}</div>
  </div>`;

  $app.innerHTML = `<div class="tablero">
    ${rivales.map((i,k)=>rivalHTML(i,pos[k])).join("")}
    <div class="centro">${centro}</div>
    ${fin}
    <div class="diariomini" id="diario">${V.registro.slice(-1).map(r=>esc(r)).join("")}</div>
  </div>`;

  $app.querySelectorAll("[data-org]").forEach(b => b.onclick = () => {
    const [ji, oi] = b.dataset.org.split(".").map(Number);
    if (miTurno() && sel !== null) tocarOrgano(ji, oi);
  });
  const rv = document.getElementById("bRevancha"); if (rv) rv.onclick = () => mandar({t:"revancha"});
  atril();
}

/* ── Tu mano, en abanico abajo ───────────────────────────────── */
function atril() {
  if (V.ganador !== null || V.terminada || (V.jugadores[V.yo] && V.jugadores[V.yo].fuera)) { $atril.innerHTML = ""; return; }
  const mio = miTurno();
  let panel = "";

  if (V.pendiente) panel = `<div class="fajita">Hay una respuesta pendiente…</div>`;
  else if (!mio) {
    const seg = V.restante !== null ? ` · <span id="segTurno">${mmss(V.restante)}</span>` : "";
    panel = `<div class="fajita esp">Juega ${esc(V.jugadores[V.turno].nombre)}${seg}</div>`;
  } else if (sel !== null) {
    const js = blancos(), carta = V.mano[sel];
    const sueltas = js.filter(j => j.o === undefined && j.tipo !== "trasplante");
    let b = `<div class="acciones">`;
    if (paso) b += `<button class="acc tenue" data-volver="1">Otro órgano tuyo</button>`;
    sueltas.forEach(j => b += `<button class="acc" data-j="${V.jugadas[sel].indexOf(j)}">${esc(j.etiqueta)}</button>`);
    if (!js.length) {
      b += `<button class="acc tenue" disabled>Sin jugada legal ahora</button>`;
      if (!V.sinDescartar && V.extra===0) b += `<button class="acc" data-descartar="1">Descartar</button>`;
    } else if (js.some(j => j.o !== undefined || j.tipo === "trasplante"))
      b += `<button class="acc tenue" disabled>${paso?"Toca el órgano del rival":
        carta.k==="tratamiento"&&carta.tr==="trasplante"?"Toca primero tu órgano":"Toca el órgano marcado en la mesa"}</button>`;
    b += `<button class="acc tenue" data-cancelar="1">Guardar</button></div>`;
    panel = b;
  } else if (mio) {
    let b = `<div class="fajita">Tu turno`;
    if (V.restante !== null) b += ` · <span id="segTurno">${mmss(V.restante)}</span>`;
    if (V.extra > 0) b += ` · horas extra (${V.extra})`;
    b += `</div>`;
    if (V.sugerencias && V.sugerencias.length)
      b += `<div class="sugmini">💡 ${esc(V.sugerencias[0].etiqueta)}</div>`;
    const hay = V.jugadas.some(j => j.length);
    if (!hay) b += `<div class="acciones"><button class="acc" data-pasar="1">No puedo jugar, pasar</button></div>`;
    else if (!V.sinDescartar && V.extra===0)
      b += `<div class="acciones"><button class="acc tenue" data-descartar="1">Descartar cartas</button></div>`;
    panel = b;
  }

  const meta = V.metaInmune ? V.jugadores[V.yo].inmunes : V.jugadores[V.yo].sanos;
  const cuerpoMio = V.jugadores[V.yo].cuerpo;

  $atril.innerHTML = `<div class="zonami">
    ${panel}
    <div class="micuerpo">
      <span class="mimeta ${meta>=V.objetivo-1?"cerca":""}">${meta}/${V.objetivo}${V.metaInmune?" 🛡":""}</span>
      ${cuerpoMio.length?cuerpoMio.map((o,oi)=>fichaHTML(o,V.yo,oi,false)).join(""):'<span class="sinorg">baja órganos para armar tu cuerpo</span>'}
    </div>
    <div class="mano">${V.mano.map((c,i) => {
      const legales = V.jugadas ? V.jugadas[i].length : 1;
      const n = V.mano.length, giro = (i-(n-1)/2)*7, subir = Math.abs(i-(n-1)/2)*4;
      return `<button class="naipe ${sel===i?"alza":""} ${mio&&!legales?"gris":""}"
        style="transform:rotate(${giro}deg) translateY(${subir}px)" data-c="${i}">
        ${A.caraCarta(c, R.colorCarta(c), false)}
        <span class="ayuda" data-info="${i}">?</span></button>`;
    }).join("")}</div>
  </div>`;

  $atril.querySelectorAll("[data-c]").forEach(b => b.onclick = (ev) => {
    if (ev.target.closest("[data-info]")) return;
    if (!mio) { verCarta(+b.dataset.c); return; }
    const i = +b.dataset.c; sel = sel === i ? null : i; paso = null; mesa();
  });
  $atril.querySelectorAll("[data-info]").forEach(b => b.onclick = (ev) => { ev.stopPropagation(); verCarta(+b.dataset.info); });
  $atril.querySelectorAll("[data-j]").forEach(b => b.onclick = () => {
    mandar({t:"jugar", idx:sel, jugada:V.jugadas[sel][+b.dataset.j]}); sel = null; paso = null; });
  const c = $atril.querySelector("[data-cancelar]"); if (c) c.onclick = () => { sel = null; paso = null; mesa(); };
  const v = $atril.querySelector("[data-volver]"); if (v) v.onclick = () => { paso = null; mesa(); };
  const p = $atril.querySelector("[data-pasar]"); if (p) p.onclick = () => mandar({t:"pasar"});
  const d = $atril.querySelector("[data-descartar]"); if (d) d.onclick = abrirDescarte;
}

function verCarta(i) {
  const c = V.mano[i];
  $modal.dataset.abierto = "1";
  $modal.innerHTML = `<div class="telon"><div class="dialogo">
    <div class="grandota">${A.caraCarta(c, R.colorCarta(c), true)}</div>
    <h3>${esc(R.nombreCarta(c))}</h3>
    <p>${esc(R.queHace(c))}</p>
    <div class="fila"><button class="btn claro" data-cerrar="1">Entendido</button></div></div></div>`;
  $modal.querySelector("[data-cerrar]").onclick = cerrarModal;
}

/* ── Descarte ───────────────────────────────────────────────── */
function abrirDescarte() {
  const marcadas = new Set();
  const dibujar = () => {
    $modal.innerHTML = `<div class="telon"><div class="dialogo">
      <h3>Suelta lo que no sirve</h3><p>De una a tres cartas. Después robas hasta volver a tener tres.</p>
      <div class="cartas">${V.mano.map((c,i) => `<button class="carta ${marcadas.has(i)?"elegida":""}" data-d="${i}">
        ${A.caraCarta(c, R.colorCarta(c), false)}</button>`).join("")}</div>
      <div style="height:16px"></div>
      <div class="fila"><button class="btn" data-ok="1" ${marcadas.size?"":"disabled"}>Descartar ${marcadas.size||""}</button>
      <button class="btn claro" data-no="1">Cancelar</button></div></div></div>`;
    $modal.querySelectorAll("[data-d]").forEach(b => b.onclick = () => {
      const i = +b.dataset.d; marcadas.has(i) ? marcadas.delete(i) : marcadas.add(i); dibujar(); });
    $modal.querySelector("[data-no]").onclick = () => { $modal.innerHTML = ""; };
    $modal.querySelector("[data-ok]").onclick = () => { mandar({t:"descartar", idxs:[...marcadas]}); $modal.innerHTML = ""; };
  };
  dibujar();
}

/* ── Traje de protección y reelección ───────────────────────── */
function pintarPendiente() {
  if (!V || !V.pendiente) { $modal.innerHTML = ""; return; }
  const p = V.pendiente;
  const seg = Math.max(0, p.segundos - Math.floor((Date.now() - recibido)/1000));
  const arte = `<div class="grandota">${A.caraCarta(p.carta, R.colorCarta(p.carta), true)}</div>`;
  if (!p.mio) {
    $modal.innerHTML = `<div class="telon"><div class="dialogo">${arte}
      <h3>Un momento</h3><p>${esc(p.quien)} juega ${esc(R.nombreCarta(p.carta))}.
      ${p.tipo==="traje" ? "Se espera la respuesta de quien recibió el ataque." : "Está eligiendo otro objetivo."}</p>
      <div class="cuenta">${seg}</div></div></div>`;
    return;
  }
  if (p.tipo === "traje") {
    if ($modal.dataset.traje === "1") { const c = $modal.querySelector(".cuenta"); if (c) c.textContent = seg; return; }
    $modal.dataset.traje = "1";
    $modal.innerHTML = `<div class="telon"><div class="dialogo">${arte}
      <h3>Te atacaron</h3><p>${esc(p.quien)} juega ${esc(R.nombreCarta(p.carta))} contra ti.
      Puedes gastar tu traje de protección para anularlo. No robas después de usarlo, así que
      empezarás tu turno con una carta menos.</p>
      <div class="cuenta">${seg}</div>
      <div class="fila"><button class="btn" data-si="1">Usar el traje</button>
      <button class="btn claro" data-nel="1">Aguantar el golpe</button></div></div></div>`;
    $modal.querySelector("[data-si]").onclick = () => { mandar({t:"traje", usar:true}); cerrarModal(); };
    $modal.querySelector("[data-nel]").onclick = () => { mandar({t:"traje", usar:false}); cerrarModal(); };
    return;
  }
  if ($modal.dataset.re === "1") { const c = $modal.querySelector(".cuenta"); if (c) c.textContent = seg; return; }
  $modal.dataset.re = "1";
  $modal.innerHTML = `<div class="telon"><div class="dialogo">${arte}
    <h3>Se protegieron</h3><p>Tu ${esc(R.nombreCarta(p.carta))} quedó sin objetivo. Elige otro;
    si no eliges, se juega la primera opción.</p>
    <div class="cuenta">${seg}</div>
    <div class="bandeja">${(p.opciones||[]).map((j,k) =>
      `<button class="acc" data-r="${k}">${esc(j.etiqueta)}</button>`).join("")}</div></div></div>`;
  $modal.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { mandar({t:"reelegir", i:+b.dataset.r}); cerrarModal(); });
}
function cerrarModal(){ $modal.innerHTML = ""; delete $modal.dataset.abierto; delete $modal.dataset.traje; delete $modal.dataset.re; delete $modal.dataset.voto; }


/* ── Sonido ─────────────────────────────────────────────────── */
let ultimoEvento = 0, eraMiTurno = false, ultimoTic = 0;
addEventListener("pointerdown", () => S.arrancar(), {once:true});
function pintarBotonesSonido(){
  const f = document.getElementById("bFondo"), e = document.getElementById("bEfectos");
  f.setAttribute("aria-pressed", S.estado.fondo); e.setAttribute("aria-pressed", S.estado.efectos);
}
document.getElementById("bMenu").onclick = () => menuPartida();
document.getElementById("bFondo").onclick = () => { S.arrancar(); S.alternar("fondo"); pintarBotonesSonido(); };
document.getElementById("bEfectos").onclick = () => { S.arrancar(); S.alternar("efectos"); pintarBotonesSonido(); };
pintarBotonesSonido();

let primeraVista = true;
function sonarSegunVista(){
  if(!V || !V.iniciada) return;
  S.ambiente(V.opciones && V.opciones.halloween);
  if(primeraVista){                      /* al reconectar no se repite lo ya ocurrido */
    primeraVista = false;
    ultimoEvento = V.evento ? V.evento.n : 0;
  } else if(V.evento && V.evento.n > ultimoEvento){
    ultimoEvento = V.evento.n;
    if(V.evento.tipo === "victoria") S.efecto(V.evento.ji === V.yo ? "victoria" : "derrota");
    else S.efecto(V.evento.tipo);
    animarJugada(V.evento);
  }
  const mio = miTurno();
  if(mio && !eraMiTurno) setTimeout(() => S.efecto("turno"), 260);
  eraMiTurno = mio;
}

/* ── La carta jugada se ve antes de aterrizar ───────────────── */
function animarJugada(ev){
  if(!ev || !ev.carta) return;
  const capa = document.createElement("div");
  capa.className = "vuelo";
  capa.innerHTML = `<div class="vcara">${A.caraCarta(ev.carta, R.colorCarta(ev.carta), false)}</div>
    <div class="vtexto">${esc(ev.texto || "")}</div>`;
  document.body.appendChild(capa);
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const destino = ev.destino
    ? (document.querySelector(`[data-org="${ev.destino.j}.${ev.destino.o}"]`) ||
       document.querySelector(`[data-silla="${ev.destino.j}"]`))
    : null;
  if(quieto || !destino){
    setTimeout(() => { capa.classList.add("ido"); setTimeout(() => capa.remove(), 420); }, 950);
    return;
  }
  setTimeout(() => {
    const r = destino.getBoundingClientRect();
    const dx = (r.left + r.width/2) - innerWidth/2;
    const dy = (r.top + r.height/2) - innerHeight*0.42;
    capa.style.transform = `translate(-50%,-50%) translate(${dx}px, ${dy}px) scale(.26)`;
    capa.style.opacity = "0";
    setTimeout(() => capa.remove(), 760);
  }, 640);
}

/* ── Menú: salir o terminar sin ganador ────────────────────── */
function menuPartida(){
  $modal.dataset.abierto = "1";
  const jugando = V && V.iniciada && V.ganador === null && !V.terminada;
  $modal.innerHTML = `<div class="telon"><div class="dialogo">
    <h3>La partida</h3>
    <p>${V && V.codigo ? "Sala " + esc(V.codigo) + "." : ""} ${jugando
      ? "Puedes retirarte tú solo o proponerle a la mesa terminar sin ganador."
      : "Todavía no hay una partida en curso."}</p>
    <div class="bandeja">
      ${jugando ? `<button class="acc" data-terminar="1">Proponer terminar sin ganador</button>` : ""}
      <button class="acc" data-salirya="1">${jugando ? "Retirarme de la partida" : "Salir de la sala"}</button>
      <button class="acc tenue" data-cerrar="1">Seguir jugando</button>
    </div></div></div>`;
  $modal.querySelector("[data-cerrar]").onclick = cerrarModal;
  const t = $modal.querySelector("[data-terminar]");
  if (t) t.onclick = () => {
    cerrarModal();
    $modal.innerHTML = `<div class="telon"><div class="dialogo">
      <h3>¿Terminar para todos?</h3>
      <p>Se les preguntará a los demás. La partida acaba sin ganador solo si todos aceptan.</p>
      <div class="fila"><button class="btn" data-ok="1">Proponerlo</button>
      <button class="btn claro" data-no="1">Mejor no</button></div></div></div>`;
    $modal.querySelector("[data-ok]").onclick = () => { mandar({t:"terminar"}); cerrarModal(); };
    $modal.querySelector("[data-no]").onclick = cerrarModal;
  };
  $modal.querySelector("[data-salirya]").onclick = () => {
    cerrarModal();
    $modal.innerHTML = `<div class="telon"><div class="dialogo">
      <h3>${jugando ? "¿Retirarte?" : "¿Salir?"}</h3>
      <p>${jugando
        ? "Tus cartas y tus órganos vuelven al descarte y la partida sigue sin ti. No podrás volver a entrar a esta partida."
        : "Vuelves al inicio y liberas tu silla."}</p>
      <div class="fila"><button class="btn warn" data-ok="1">${jugando ? "Retirarme" : "Salir"}</button>
      <button class="btn claro" data-no="1">Cancelar</button></div></div></div>`;
    $modal.querySelector("[data-ok]").onclick = () => { salirDeLaSala(); cerrarModal(); };
    $modal.querySelector("[data-no]").onclick = cerrarModal;
  };
}
function salirDeLaSala(){
  mandar({t:"salir"});
  sesion = null;
  try { localStorage.removeItem("virus.sesion"); } catch(e) {}
  V = null; sel = null; paso = null; primeraVista = true; ultimoEvento = 0;
  clearInterval(tic);
  $atril.innerHTML = ""; $modal.innerHTML = "";
  portada();
}
function pintarVotacion(){
  const vo = V.votacion;
  if (!vo) { if ($modal.dataset.voto) cerrarModal(); return; }
  const seg = Math.max(0, vo.segundos - Math.floor((Date.now() - recibido)/1000));
  if (!vo.mio) {
    $modal.innerHTML = `<div class="telon"><div class="dialogo">
      <h3>Se propuso terminar</h3>
      <p>${esc(vo.quien)} propuso terminar la partida sin ganador. Faltan ${vo.faltan} por responder.</p>
      <div class="cuenta">${seg}</div></div></div>`;
    $modal.dataset.voto = "1"; return;
  }
  if ($modal.dataset.voto === "1") { const c = $modal.querySelector(".cuenta"); if (c) c.textContent = seg; return; }
  $modal.dataset.voto = "1";
  $modal.innerHTML = `<div class="telon"><div class="dialogo">
    <h3>¿Terminamos?</h3>
    <p>${esc(vo.quien)} propone terminar la partida sin ganador. Si alguien dice que no, se sigue jugando.</p>
    <div class="cuenta">${seg}</div>
    <div class="fila"><button class="btn" data-si="1">De acuerdo</button>
    <button class="btn claro" data-no="1">Sigamos jugando</button></div></div></div>`;
  $modal.querySelector("[data-si]").onclick = () => { mandar({t:"voto", si:true}); cerrarModal(); };
  $modal.querySelector("[data-no]").onclick = () => { mandar({t:"voto", si:false}); cerrarModal(); };
}

/* ilustraciones externas, si las hay (ver cartas.js) */
fetch("cartas/lista.json").then(r => r.ok ? r.json() : []).then(l => { A.usarExternas(l); if (V) pintar(); }).catch(() => {});

conectar();
portada();
