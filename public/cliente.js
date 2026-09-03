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
  $app.innerHTML = `
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
    aprendizaje: document.getElementById("oAp").checked,
    halloween: document.getElementById("oHal").checked,
    segundosTurno: V.opciones.segundosTurno, minutosJugador: V.opciones.minutosJugador }});
  ["oExp","oDuelo","oAp","oHal"].forEach(id => document.getElementById(id).onchange = enviar);
  $app.querySelectorAll("[data-seg]").forEach(b => b.onclick = () => { V.opciones.segundosTurno = +b.dataset.seg; enviar(); });
  $app.querySelectorAll("[data-min]").forEach(b => b.onclick = () => { V.opciones.minutosJugador = +b.dataset.min; enviar(); });
  const e = document.getElementById("bEmpezar"); if (e) e.onclick = () => mandar({t:"empezar"});
}

/* ── Mesa ───────────────────────────────────────────────────── */
const miTurno = () => V.turno === V.yo && V.ganador === null && !V.terminada && !V.pendiente && !V.votacion;

/* jugadas de la carta elegida que apuntan a un órgano concreto */
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
  const js = blancos();
  const carta = V.mano[sel];
  if (carta.k === "tratamiento" && carta.tr === "trasplante" && !paso) {
    if (!js.some(j => j.a.j === ji && j.a.o === oi)) return;
    paso = {tipo:"trasplante", o:oi}; return mesa();
  }
  const j = js.find(x =>
    (x.o !== undefined && x.j === ji && x.o === oi) ||
    (x.tipo === "trasplante" && x.b.j === ji && x.b.o === oi));
  if (!j) return;
  mandar({t:"jugar", idx:sel, jugada:j});
  sel = null; paso = null;
}

function fichaHTML(o, ji, oi) {
  const est = R.estadoOrgano(o), sano = R.esSano(o), blanco = esBlanco(ji, oi);
  const virus = o.virus[0], med = o.medicinas[0];
  const sello = virus ? `<span class="sello">${A.dibujo(virus, R.ORG[virus.c].hex)}</span>` : "";
  const escudo = est === "inmunizado" ? `<span class="escudo">${A.dibujo(med, "#FBFAF7")}</span>`
    : est === "vacunado" ? `<span class="escudo" style="background:#4B8F7E">${A.dibujo(med, "#FBFAF7")}</span>` : "";
  const pie = R.esBionico(o) ? "biónico" : est === "infectado"
    ? (virus.t === "evo" ? "mutado" : "infectado")
    : est === "inmunizado" ? "blindado" : est;
  return `<button class="ficha ${sano?"":"enferma"} ${blanco?"blanco":""}" data-org="${ji}.${oi}">
    <span class="cara">${A.dibujoOrgano(o.carta.c)}</span>
    <span class="pie2">${pie}</span>${sello}${escudo}</button>`;
}

function sillaHTML(j, i) {
  const bar = (V.turno === i && V.restante !== null)
    ? `<div class="reloj"><i id="relojTurno"></i></div>` : "";
  const banco = V.bancos ? `<span class="mini">banco ${mmss(V.bancos[i])}</span>` : "";
  return `<div class="silla ${V.turno===i&&!j.fuera?"activa":""} ${i===V.yo?"mia":""} ${j.fuera?"ido":""}" data-silla="${i}">
    <div class="avwrap">${A.avatar(i, 44)}
      <span class="nsanos ${j.sanos>=V.objetivo-1?"cerca":""}">${j.sanos}/${V.objetivo}</span></div>
    <div class="datos">
      <div class="linea"><span class="quien">${esc(j.nombre)}${i===V.yo?" · tú":""}</span>
        ${j.fuera?'<span class="retirado">se retiró</span>':""}
        ${j.truco?'<span class="maldito">🎃 no puede ganar</span>':""}
        <span class="mini">${j.cartas} cartas</span>${banco}
        ${j.conectado?"":'<span class="mini off">sin señal</span>'}</div>
      <div class="cuerpo">${j.cuerpo.length
        ? j.cuerpo.map((o,oi) => fichaHTML(o, i, oi)).join("")
        : '<span class="vacio">sin órganos todavía</span>'}</div>
      ${bar}</div></div>`;
}

function mesa() {
  const orden = V.jugadores.map((_,i)=>i).filter(i => i !== V.yo).concat([V.yo]);
  let h = "";
  if (V.terminada) {
    h += `<div class="finsin"><b>Partida terminada</b><span>${esc(V.terminada)}</span></div>
      ${V.anfitrion?`<button class="btn ancho oro" id="bRevancha">Otra partida</button><div style="height:12px"></div>`:""}`;
  } else if (V.ganador !== null) {
    h += `<div class="trofeo"><b>${V.ganador===V.yo ? "¡Ganaste!" : esc(V.jugadores[V.ganador].nombre)+" ganó"}</b>
      <span>${V.jugadores[V.ganador].sanos} órganos sanos en la mesa</span></div>
      ${V.anfitrion?`<button class="btn ancho oro" id="bRevancha">Otra partida</button><div style="height:12px"></div>`:""}`;
  }
  h += `<div class="mesa">${orden.map(i => sillaHTML(V.jugadores[i], i)).join("")}</div>`;
  h += `<div class="diario"><div class="conteo">${V.mazo} en el mazo, ${V.descartados} en el descarte${
    V.retiradas ? ", " + V.retiradas + " en cuarentena" : ""}</div>${
    V.registro.slice().reverse().map(r => `<div>${esc(r)}</div>`).join("")}</div>`;
  h += `<div class="pie"></div>`;
  $app.innerHTML = h;
  $app.querySelectorAll("[data-org]").forEach(b => b.onclick = () => {
    const [ji, oi] = b.dataset.org.split(".").map(Number);
    if (!miTurno() || sel === null) return;
    tocarOrgano(ji, oi);
  });
  const rv = document.getElementById("bRevancha"); if (rv) rv.onclick = () => mandar({t:"revancha"});
  atril();
}

/* ── Atril de madera ────────────────────────────────────────── */
function atril() {
  if (V.ganador !== null || V.terminada || (V.jugadores[V.yo] && V.jugadores[V.yo].fuera)) { $atril.innerHTML = ""; return; }
  const mio = miTurno();
  let aviso, acciones = "";

  if (V.pendiente) aviso = `<b>Alto</b><span>hay una respuesta pendiente</span>`;
  else if (!mio) aviso = `<b>Juega ${esc(V.jugadores[V.turno].nombre)}</b><span>espera tu turno</span>`;
  else {
    const seg = V.restante !== null ? `<span class="seg2" id="segTurno">${mmss(V.restante)}</span>` : "";
    aviso = `<b>Es tu turno</b>${seg}`;
  }

  if (mio && sel !== null) {
    const carta = V.mano[sel], js = blancos();
    const sueltas = js.filter(j => j.o === undefined && j.tipo !== "trasplante");
    if (paso) acciones += `<button class="acc tenue" data-volver="1">Elegir otro órgano tuyo</button>`;
    sueltas.forEach((j,k) => acciones += `<button class="acc" data-j="${V.jugadas[sel].indexOf(j)}">${esc(j.etiqueta)}</button>`);
    if (!js.length) {
      acciones += `<button class="acc tenue" disabled>Esta carta no tiene jugada legal ahora</button>`;
      if (!V.sinDescartar && V.extra === 0)
        acciones += `<button class="acc" data-descartar="1">Descartar cartas que no sirven</button>`;
    }
    else if (js.some(j => j.o !== undefined || j.tipo === "trasplante"))
      acciones += `<button class="acc tenue" disabled>${paso
        ? "Toca el órgano del rival con el que lo cambias"
        : carta.k === "tratamiento" && carta.tr === "trasplante"
          ? "Toca primero tu órgano" : "Toca en la mesa el órgano marcado"}</button>`;
    acciones += `<button class="acc tenue" data-cancelar="1">Guardar la carta</button>`;
  } else if (mio) {
    if (V.sugerencias && V.sugerencias.length)
      acciones += `<div class="sug">${V.sugerencias.map(s =>
        `${esc(R.nombreCarta(s.carta))}: ${esc(s.etiqueta.toLowerCase())}`).join("<br>")}</div>`;
    const hay = V.jugadas.some(j => j.length);
    if (V.sinDescartar) acciones += `<button class="acc tenue" disabled>Con la segunda opinión debes jugar, no descartar</button>`;
    else if (V.extra > 0) acciones += `<button class="acc tenue" disabled>Horas extra: te quedan ${V.extra} cartas por jugar</button>`;
    else acciones += `<button class="acc tenue" data-descartar="1">Descartar cartas que no sirven</button>`;
    if (!hay) acciones += `<button class="acc" data-pasar="1">No tengo jugada, pasar</button>`;
  }

  $atril.innerHTML = `<div class="atril"><div class="tabla">
    <div class="aviso">${aviso}</div>
    ${acciones ? `<div class="bandeja">${acciones}</div>` : ""}
    <div class="cartas">${V.mano.map((c,i) => {
      const legales = V.jugadas ? V.jugadas[i].length : 1;
      return `<button class="carta ${sel===i?"elegida":""} ${mio&&!legales?"inerte":""}" data-c="${i}">
        ${A.caraCarta(c, R.colorCarta(c), false)}</button>`;
    }).join("")}</div></div></div>`;

  $atril.querySelectorAll("[data-c]").forEach(b => b.onclick = () => {
    if (!mio) return alerta("No es tu turno");
    const i = +b.dataset.c;
    sel = sel === i ? null : i; paso = null; mesa();
  });
  $atril.querySelectorAll("[data-j]").forEach(b => b.onclick = () => {
    mandar({t:"jugar", idx:sel, jugada:V.jugadas[sel][+b.dataset.j]}); sel = null; paso = null; });
  const c = $atril.querySelector("[data-cancelar]"); if (c) c.onclick = () => { sel = null; paso = null; mesa(); };
  const v = $atril.querySelector("[data-volver]"); if (v) v.onclick = () => { paso = null; mesa(); };
  const p = $atril.querySelector("[data-pasar]"); if (p) p.onclick = () => mandar({t:"pasar"});
  const d = $atril.querySelector("[data-descartar]"); if (d) d.onclick = abrirDescarte;
}
function nombreCorto(c) {
  if (c.k === "organo") return R.ORG[c.c].label;
  if (c.k === "virus") return "Virus";
  if (c.k === "medicina") return "Medicina";
  return R.TRAT[c.tr];
}
function subtitulo(c) {
  if (c.k === "organo") return c.c === "bionico" ? "no se infecta" : c.c === "multi" ? "vale como uno más" : "órgano";
  if (c.k === "virus") return (c.t === "evo" ? "mutado, " : "") + R.etColor(c.c);
  if (c.k === "medicina") return (c.t === "exp" ? "experimental, " : "") + R.etColor(c.c);
  return "tratamiento";
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
