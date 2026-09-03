/* ═══════════════════════════════════════════════════════════════
   VIRUS! en línea — cliente
   Solo pinta lo que manda el servidor y le devuelve intenciones.
   Ninguna decisión de reglas se toma aquí.
   ═══════════════════════════════════════════════════════════════ */
"use strict";
const R = window.REGLAS;
const app = document.getElementById("app");
const modal = document.getElementById("modal");
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

let ws = null, V = null, sesion = null, sel = null, descartando = null, reintento = 0, tic = null;
try { sesion = JSON.parse(localStorage.getItem("virus.sesion") || "null"); } catch(e) {}
const guardar = () => { try { localStorage.setItem("virus.sesion", JSON.stringify(sesion)); } catch(e) {} };

/* ── Conexión ───────────────────────────────────────────────── */
function conectar(alAbrir) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(proto + "://" + location.host);
  ws.onopen = () => { reintento = 0; if (alAbrir) alAbrir(); else if (sesion) mandar({t:"reconectar", codigo:sesion.codigo, token:sesion.token}); };
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.t === "sesion") { sesion = {codigo:m.codigo, token:m.token}; guardar(); document.getElementById("cod").textContent = m.codigo; }
    if (m.t === "vista") { V = m.v; sel = null; pintar(); }
    if (m.t === "error") aviso(m.msg);
  };
  ws.onclose = () => { if (reintento++ < 40) setTimeout(() => conectar(), Math.min(600 * reintento, 4000)); };
}
const mandar = m => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
/* Los servicios gratuitos se duermen tras 15 minutos sin tráfico. Mientras alguien
   tenga la mesa abierta, este latido cuenta como tráfico y la sala sigue viva. */
setInterval(() => mandar({t:"latido"}), 120000);
function aviso(txt) {
  const d = document.createElement("div"); d.className = "err"; d.textContent = txt;
  document.body.appendChild(d); setTimeout(() => d.remove(), 2600);
}

/* ── Pantallas ──────────────────────────────────────────────── */
function pintar() {
  clearInterval(tic);
  if (!V) return portada();
  if (!V.iniciada) return salaEspera();
  mesa();
  if (V.pendiente) { pintarPendiente(); tic = setInterval(pintarPendiente, 1000); }
  else modal.innerHTML = "";
}

function portada() {
  document.getElementById("cod").textContent = "";
  app.innerHTML = `
    <div class="card">
      <p class="h">Tu nombre</p>
      <input class="input" id="nombre" maxlength="14" placeholder="Ricardo" value="${esc(localStorage.getItem("virus.nombre")||"")}">
      <div style="height:11px"></div>
      <button class="btn big" id="bCrear">Crear una sala</button>
    </div>
    <div class="card">
      <p class="h">O entra a una sala</p>
      <input class="input cod" id="codigo" maxlength="4" placeholder="ABCD" autocapitalize="characters">
      <div style="height:11px"></div>
      <button class="btn big ghost" id="bUnir">Entrar</button>
    </div>
    ${sesion ? `<div class="card"><p class="note">Tenías una partida en la sala ${esc(sesion.codigo)}.</p>
      <div style="height:9px"></div><button class="btn ghost" id="bVolver">Volver a esa mesa</button></div>` : ""}
    <div class="card"><p class="note">El servidor reparte y guarda las manos: nadie puede ver las cartas de los demás. Si se te cae la señal, vuelves a entrar con el mismo código y sigues donde ibas.</p></div>`;
  const nom = () => { const n = document.getElementById("nombre").value.trim(); localStorage.setItem("virus.nombre", n); return n; };
  document.getElementById("bCrear").onclick = () => mandar({t:"crear", nombre:nom()});
  document.getElementById("bUnir").onclick = () => {
    const c = document.getElementById("codigo").value.trim().toUpperCase();
    if (c.length !== 4) return aviso("El código tiene cuatro letras");
    mandar({t:"unir", codigo:c, nombre:nom()});
  };
  if (sesion) document.getElementById("bVolver").onclick = () => mandar({t:"reconectar", codigo:sesion.codigo, token:sesion.token});
}

function salaEspera() {
  const o = V.opciones;
  app.innerHTML = `
    <div class="card">
      <p class="h">Código de la sala</p>
      <div class="input cod" style="border-style:dashed">${esc(V.codigo)}</div>
      <p class="note" style="margin-top:10px">Pásales el código. Entran desde esta misma dirección.</p>
    </div>
    <div class="card">
      <p class="h">En la mesa (${V.jugadores.length} de 6)</p>
      ${V.jugadores.map((j,i) => `<div class="nm">${esc(j.nombre)}
        ${i===0?'<span class="pill">anfitrión</span>':""}
        ${i===V.yo?'<span class="pill">tú</span>':""}
        ${j.conectado?"":'<span class="pill off">desconectado</span>'}</div>`).join("")}
    </div>
    <div class="card">
      <p class="h">Reglas de la partida</p>
      <label class="sw"><input type="checkbox" id="oExp" ${o.expansion?"checked":""} ${V.anfitrion?"":"disabled"}>
        <span>Incluir VIRUS! 2 Evolution: órgano biónico, virus evolucionados, medicinas experimentales y cuatro tratamientos nuevos.</span></label>
      <label class="sw"><input type="checkbox" id="oDuelo" ${o.duelo?"checked":""} ${V.anfitrion?"":"disabled"}>
        <span>Modo duelo: con dos jugadores se gana con cinco órganos sanos.</span></label>
      <label class="sw"><input type="checkbox" id="oAp" ${o.aprendizaje?"checked":""} ${V.anfitrion?"":"disabled"}>
        <span>Modo aprendizaje: el asistente sugiere jugadas. Se activa para todos, para que la partida siga siendo pareja.</span></label>
    </div>
    ${V.anfitrion
      ? `<button class="btn big" id="bEmpezar" ${V.jugadores.length<2?"disabled":""}>Empezar la partida</button>`
      : `<div class="card"><p class="note">Esperando a que ${esc(V.jugadores[0].nombre)} empiece.</p></div>`}`;
  if (V.anfitrion) {
    const cambia = () => mandar({t:"opciones", opciones:{
      expansion: document.getElementById("oExp").checked,
      duelo: document.getElementById("oDuelo").checked,
      aprendizaje: document.getElementById("oAp").checked }});
    ["oExp","oDuelo","oAp"].forEach(id => document.getElementById(id).onchange = cambia);
    const b = document.getElementById("bEmpezar");
    if (b) b.onclick = () => mandar({t:"empezar"});
  }
}

/* ── Mesa ───────────────────────────────────────────────────── */
const miTurno = () => V.turno === V.yo && V.ganador === null && !V.pendiente;

function cuerpoHTML(j, i) {
  const objetivos = new Set();
  if (sel !== null && V.jugadas) V.jugadas[sel].forEach(x => { if (x.o !== undefined && x.j === i) objetivos.add(x.o);
    if (x.tipo === "trasplante" && x.b.j === i) objetivos.add(x.b.o);
    if (x.tipo === "trasplante" && x.a.j === i) objetivos.add(x.a.o); });
  return `<div class="jug ${i===V.turno?"turno":""} ${i===V.yo?"yo":""}">
    <div class="nm"><span>${esc(j.nombre)}${i===V.yo?" (tú)":""}</span>
      <span class="pill ${j.sanos>=V.objetivo-1?"hot":""}">${j.sanos}/${V.objetivo} sanos</span>
      <span class="pill">${j.cartas} cartas</span>
      ${i===V.turno?'<span class="pill hot">su turno</span>':""}
      ${j.conectado?"":'<span class="pill off">sin señal</span>'}</div>
    <div class="organs">${j.cuerpo.length ? j.cuerpo.map((o,oi) => {
      const est = R.descEstado(o);
      return `<span class="org ${R.esSano(o)?"":"sick"} ${objetivos.has(oi)?"obj":""}"
        style="background:${R.ORG[o.carta.c].hex}">${R.ORG[o.carta.c].label}<small>${est}</small></span>`;
    }).join("") : '<span class="vacio">sin órganos todavía</span>'}</div></div>`;
}

function mesa() {
  const yo = V.jugadores[V.yo];
  const orden = V.jugadores.map((j,i)=>i).filter(i=>i!==V.yo).concat([V.yo]);
  let h = "";

  if (V.ganador !== null) {
    h += `<div class="gana"><b>${V.ganador===V.yo?"¡Ganaste!":esc(V.jugadores[V.ganador].nombre)+" ganó"}</b>
      <span>${V.jugadores[V.ganador].sanos} órganos sanos</span></div>
      ${V.anfitrion?`<button class="btn big" id="bRevancha">Otra partida</button><div style="height:11px"></div>`:""}`;
  } else if (V.pendiente) {
    h += `<div class="turnobar esperando"><b>Alto</b><span>${esc(V.pendiente.quien)} jugó una carta y hay una respuesta pendiente.</span></div>`;
  } else if (miTurno()) {
    h += `<div class="turnobar"><b>Es tu turno</b><span>${V.extra>0
      ? "Horas extra: te quedan "+V.extra+" cartas por jugar."
      : "Juega una carta o descarta las que no te sirvan."}</span></div>`;
  } else {
    h += `<div class="turnobar esperando"><b>Turno de ${esc(V.jugadores[V.turno].nombre)}</b><span>Espera tu momento.</span></div>`;
  }

  h += `<div class="card"><p class="h">La mesa</p>${orden.map(i => cuerpoHTML(V.jugadores[i], i)).join("")}</div>`;

  /* mano */
  h += `<div class="card"><p class="h">Tu mano${V.mazo!==undefined?` · mazo: ${V.mazo}`:""}</p><div class="mano">`;
  V.mano.forEach((c,i) => {
    const legales = V.jugadas ? V.jugadas[i].length : 0;
    h += `<button class="carta ${sel===i?"sel":""} ${miTurno()&&!legales?"muerta":""}"
      style="background:${R.colorCarta(c)}" data-carta="${i}">
      <span class="n">${c.k==="tratamiento"?"TRATAMIENTO":c.k.toUpperCase()}</span>
      ${esc(R.nombreCarta(c))}</button>`;
  });
  h += `</div>`;

  if (miTurno()) {
    if (sel !== null) {
      const js = V.jugadas[sel];
      h += `<div class="opciones">${js.length
        ? js.map((j,k) => `<button class="opc" data-jugada="${k}">${esc(j.etiqueta)}</button>`).join("")
        : `<p class="note">Esta carta no tiene ninguna jugada legal ahora mismo.</p>`}
        <button class="btn ghost" data-cancelar="1">Elegir otra carta</button></div>`;
    } else {
      const hay = V.jugadas.some(j => j.length);
      h += `<div class="row" style="margin-top:10px">
        ${V.sinDescartar || V.extra > 0
          ? `<span class="note" style="flex:1">${V.sinDescartar?"Con la segunda opinión debes jugar, no descartar.":"Estás en horas extra: juega tus cartas."}</span>`
          : `<button class="btn ghost" data-descartar="1">Descartar cartas</button>`}
        ${hay ? "" : `<button class="btn warn" data-pasar="1">No puedo jugar: pasar</button>`}</div>`;
    }
    if (V.sugerencias && V.sugerencias.length && sel === null) {
      h += `<div class="sug"><b>Sugerencia</b><br>${V.sugerencias.map(s =>
        `${esc(R.nombreCarta(s.carta))} → ${esc(s.etiqueta)}`).join("<br>")}</div>`;
    }
  }
  h += `</div>`;

  h += `<div class="card"><p class="h">Lo que va pasando</p><div class="reg">${
    V.registro.slice().reverse().map(r => `<div>${esc(r)}</div>`).join("")}</div></div>`;

  app.innerHTML = h;
  document.getElementById("cod").textContent = V.codigo;

  app.querySelectorAll("[data-carta]").forEach(b => b.onclick = () => {
    if (!miTurno()) return aviso("No es tu turno");
    sel = sel === +b.dataset.carta ? null : +b.dataset.carta; mesa(); });
  app.querySelectorAll("[data-jugada]").forEach(b => b.onclick = () => {
    mandar({t:"jugar", idx:sel, jugada:V.jugadas[sel][+b.dataset.jugada]}); sel = null; });
  const c = app.querySelector("[data-cancelar]"); if (c) c.onclick = () => { sel = null; mesa(); };
  const p = app.querySelector("[data-pasar]"); if (p) p.onclick = () => mandar({t:"pasar"});
  const d = app.querySelector("[data-descartar]"); if (d) d.onclick = abrirDescarte;
  const rv = document.getElementById("bRevancha"); if (rv) rv.onclick = () => mandar({t:"revancha"});
}

/* ── Descarte ───────────────────────────────────────────────── */
function abrirDescarte() {
  descartando = new Set();
  const dibujar = () => {
    modal.innerHTML = `<div class="mask"><div class="sheet">
      <h4>¿Qué descartas?</h4><p>Puedes soltar de una a tres cartas. Después robas hasta volver a tener tres.</p>
      <div class="mano">${V.mano.map((c,i) => `<button class="carta ${descartando.has(i)?"sel":""}"
        style="background:${R.colorCarta(c)}" data-d="${i}">${esc(R.nombreCarta(c))}</button>`).join("")}</div>
      <div style="height:14px"></div>
      <div class="row"><button class="btn" data-ok="1" ${descartando.size?"":"disabled"}>Descartar ${descartando.size||""}</button>
      <button class="btn ghost" data-no="1">Cancelar</button></div></div></div>`;
    modal.querySelectorAll("[data-d]").forEach(b => b.onclick = () => {
      const i = +b.dataset.d; descartando.has(i) ? descartando.delete(i) : descartando.add(i); dibujar(); });
    modal.querySelector("[data-no]").onclick = () => { modal.innerHTML = ""; };
    modal.querySelector("[data-ok]").onclick = () => { mandar({t:"descartar", idxs:[...descartando]}); modal.innerHTML = ""; };
  };
  dibujar();
}

/* ── Traje de protección y reelección de objetivo ───────────── */
function pintarPendiente() {
  if (!V || !V.pendiente) { modal.innerHTML = ""; clearInterval(tic); return; }
  const p = V.pendiente;
  const seg = Math.max(0, p.segundos - Math.floor((Date.now() - (V._t || (V._t = Date.now()))) / 1000));
  if (!p.mio) {
    modal.innerHTML = `<div class="mask"><div class="sheet">
      <h4>Un momento</h4><p>${esc(p.quien)} jugó <b>${esc(R.nombreCarta(p.carta))}</b>.
      ${p.tipo==="traje"?"Se está esperando la respuesta de quien recibió el ataque.":"Está eligiendo otro objetivo."}</p>
      <div class="cuenta">${seg}</div></div></div>`;
    return;
  }
  if (p.tipo === "traje") {
    modal.innerHTML = `<div class="mask"><div class="sheet">
      <h4>Te atacaron</h4><p>${esc(p.quien)} juega <b>${esc(R.nombreCarta(p.carta))}</b> contra ti.
      Puedes gastar tu traje de protección para anularlo. Ojo: no robas después de usarlo, así que empezarás tu turno con una carta menos.</p>
      <div class="cuenta">${seg}</div>
      <div class="row"><button class="btn" data-si="1">Usar el traje</button>
      <button class="btn ghost" data-nel="1">Aguantar el golpe</button></div></div></div>`;
    modal.querySelector("[data-si]").onclick = () => { mandar({t:"traje", usar:true}); modal.innerHTML = ""; };
    modal.querySelector("[data-nel]").onclick = () => { mandar({t:"traje", usar:false}); modal.innerHTML = ""; };
    return;
  }
  modal.innerHTML = `<div class="mask"><div class="sheet">
    <h4>Se protegieron</h4><p>Tu <b>${esc(R.nombreCarta(p.carta))}</b> quedó sin objetivo. Elige otro; si no eliges, se juega la primera opción.</p>
    <div class="cuenta">${seg}</div>
    <div class="opciones">${(p.opciones||[]).map((j,k) =>
      `<button class="opc" data-r="${k}">${esc(j.etiqueta)}</button>`).join("")}</div></div></div>`;
  modal.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { mandar({t:"reelegir", i:+b.dataset.r}); modal.innerHTML = ""; });
}

conectar(() => { if (sesion) mandar({t:"reconectar", codigo:sesion.codigo, token:sesion.token}); else portada(); });
portada();
