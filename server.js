/* ═══════════════════════════════════════════════════════════════
   VIRUS! en línea — servidor
   Es la autoridad de la partida: aquí viven el mazo y las manos.
   A cada jugador se le manda solo lo suyo; de los demás, cuántas
   cartas tienen. Así nadie puede espiar abriendo el navegador.
   ═══════════════════════════════════════════════════════════════ */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");
const R = require("./public/reglas.js");

const PUERTO = process.env.PORT || 3000;
const PUBLICO = path.join(__dirname, "public");
const SEGUNDOS_TRAJE = 12;      // ventana para responder con traje de protección
const SEGUNDOS_AUSENTE = 40;    // tras esto, el turno de un desconectado se juega solo
const VIDA_SALA = 6 * 60 * 60 * 1000;

/* ── Servidor de archivos ───────────────────────────────────── */
const MIME = {".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json",".png":"image/png",
  ".webmanifest":"application/manifest+json",".svg":"image/svg+xml"};
const servidor = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  let f = path.join(PUBLICO, url === "/" ? "index.html" : url);
  if (!f.startsWith(PUBLICO)) { res.writeHead(403).end(); return; }
  fs.readFile(f, (e, datos) => {
    if (e) { res.writeHead(404, {"Content-Type":"text/plain"}).end("No existe"); return; }
    res.writeHead(200, {"Content-Type": MIME[path.extname(f)] || "application/octet-stream"});
    res.end(datos);
  });
});

/* ── Salas ──────────────────────────────────────────────────── */
const salas = new Map();
function x_conectado(s, i) { return !!(s.jugadores[i] && s.jugadores[i].conectado); }
const codigo = () => {
  let c; const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  do { c = Array.from({length:4},()=>abc[crypto.randomInt(abc.length)]).join(""); }
  while (salas.has(c));
  return c;
};

function crearSala(nombre, ws) {
  const s = { codigo: codigo(), jugadores: [], opciones: {expansion:true, duelo:false, aprendizaje:false, halloween:false, metaInmune:false, segundosTurno:60, minutosJugador:0},
    iniciada:false, E:null, pendiente:null, reloj:null, relojAusente:null, creada:Date.now() };
  salas.set(s.codigo, s);
  sentar(s, nombre, ws);
  return s;
}
function sentar(s, nombre, ws) {
  const j = { id: s.jugadores.length, token: crypto.randomUUID(),
    nombre: (nombre||"").trim().slice(0,14) || "Jugador " + (s.jugadores.length+1), ws, conectado:true };
  s.jugadores.push(j);
  return j;
}
const vivos = s => s.jugadores.filter(j => j.conectado).length;

/* ── Vista personalizada ────────────────────────────────────── */
function vista(s, yo) {
  const E = s.E;
  const base = { codigo: s.codigo, iniciada: s.iniciada, yo, anfitrion: yo === 0,
    opciones: s.opciones,
    jugadores: s.jugadores.map((j,i) => ({ nombre: j.nombre, conectado: j.conectado,
      cuerpo: E ? E.jugadores[i].cuerpo : [], cartas: E ? E.jugadores[i].mano.length : 0,
      fuera: E ? !!E.jugadores[i].fuera : false,
      truco: E ? !!E.jugadores[i].truco : false,
      inmunes: E ? R.inmunes(E.jugadores[i]) : 0,
      sanos: E ? R.sanos(E.jugadores[i]) : 0,
      logro: E ? R.logrados(E, E.jugadores[i]) : 0 })) };
  if (!E) return base;
  const miTurno = E.turno === yo && E.ganador === null && !s.pendiente;
  const vv = Object.assign(base, {
    turno: E.turno, objetivo: E.objetivo, extra: E.extra, sinDescartar: E.sinDescartar,
    mano: E.jugadores[yo].mano, mazo: E.mazo.length, retiradas: E.retiradas.length,
    descarte: E.descarte.length ? E.descarte[E.descarte.length-1] : null,
    descartados: E.descarte.length,
    registro: E.registro.slice(-9), ganador: E.ganador, evento: E.evento,
    terminada: E.terminada, metaInmune: E.metaInmune,
    restante: E.vence ? Math.max(0, E.vence - Date.now()) : null,
    bancos: s.opciones.minutosJugador > 0 ? E.jugadores.map(x => x.banco) : null,
    jugadas: miTurno ? E.jugadores[yo].mano.map((_,i)=>R.jugadasLegales(E, yo, i)) : null,
    sugerencias: (miTurno && s.opciones.aprendizaje) ? R.sugerencias(E, yo) : null
  });
  if (s.votacion) {
    const v = s.votacion;
    vv.votacion = { quien: s.jugadores[v.ji].nombre, mio: v.esperando.includes(yo),
      faltan: v.esperando.length, segundos: Math.max(0, Math.ceil((v.vence - Date.now())/1000)) };
  }
  if (s.pendiente) {
    const p = s.pendiente;
    vv.pendiente = { tipo: p.tipo, segundos: Math.max(0, Math.ceil((p.vence - Date.now())/1000)),
      quien: s.jugadores[p.ji].nombre, carta: p.carta, etiqueta: p.jugada ? p.jugada.etiqueta : "",
      mio: p.tipo === "traje" ? p.esperando.includes(yo) : p.ji === yo,
      opciones: (p.tipo === "reelegir" && p.ji === yo) ? p.opciones : null };
  }
  return vv;
}
function difundir(s) {
  s.jugadores.forEach((j,i) => enviar(j, {t:"vista", v: vista(s, i)}));
}
function enviar(j, msg) {
  if (j.ws && j.ws.readyState === 1) { try { j.ws.send(JSON.stringify(msg)); } catch(e){} }
}
const error = (ws, msg) => { try { ws.send(JSON.stringify({t:"error", msg})); } catch(e){} };

/* ── Arranque de partida ────────────────────────────────────── */
function empezar(s) {
  const E = {
    jugadores: s.jugadores.map(j => ({ nombre: j.nombre, mano: [], cuerpo: [],
      fuera: !j.conectado, banco: s.opciones.minutosJugador * 60000 })),
    mazo: R.barajar(R.crearMazo(s.opciones.expansion, s.opciones.halloween)), descarte: [], retiradas: [],
    turno: crypto.randomInt(s.jugadores.length), extra: 0, sinDescartar: false,
    objetivo: (s.opciones.duelo && s.jugadores.length === 2) ? 5 : 4,
    registro: ["Empieza la partida"], ganador: null, terminada: null, eventoN: 0, evento: null
  };
  E.jugadores.forEach((_,i) => R.robar(E, i));
  s.E = E; s.iniciada = true; s.pendiente = null; s.votacion = null;
  E.registro.push("Arranca " + E.jugadores[E.turno].nombre);
  programarTurno(s);
}

/* ── Ciclo de turno ─────────────────────────────────────────── */
function cantar(E, g) { E.ganador = g; E.evento = { n: ++E.eventoN, tipo:"victoria", ji:g }; E.registro.push("🏆 " + E.jugadores[g].nombre + " completó su cuerpo"); }
function cerrarTurno(s) {
  const E = s.E;
  let g = R.ganador(E);
  if (g !== null) { cantar(E, g); return; }
  if (E.extra > 0) {                       /* horas extra / segunda opinión */
    E.extra--;
    if (E.extra > 0 && E.jugadores[E.turno].mano.length) return;
    E.extra = 0;
  }
  R.avanzarTurno(E);
  g = R.ganador(E);
  if (g !== null) { cantar(E, g); return; }
  programarTurno(s);
}
/* Reloj del turno. Cubre tres casos con un solo temporizador:
   el límite por turno, el banco de tiempo del jugador y la ausencia
   de quien perdió la señal. Se pausa mientras hay una carta esperando
   respuesta, para que nadie pierda tiempo por culpa de otro. */
function consumir(s) {
  const E = s.E;
  if (!E || !E.turnoDesde) return;
  const usado = Date.now() - E.turnoDesde;
  E.turnoDesde = Date.now();
  const j = E.jugadores[E.turno];
  if (s.opciones.minutosJugador > 0) j.banco = Math.max(0, j.banco - usado);
}
function limiteTurno(s) {
  const E = s.E, j = E.jugadores[E.turno];
  let lim = Infinity;
  if (s.opciones.segundosTurno > 0) lim = s.opciones.segundosTurno * 1000;
  if (s.opciones.minutosJugador > 0) lim = Math.min(lim, Math.max(1500, j.banco));
  if (!s.jugadores[E.turno].conectado) lim = Math.min(lim, SEGUNDOS_AUSENTE * 1000);
  return lim;
}
function programarTurno(s) {
  clearTimeout(s.relojAusente);
  const E = s.E;
  if (!E || E.ganador !== null || E.terminada !== null) return;
  E.turnoDesde = Date.now();
  const lim = limiteTurno(s);
  E.vence = lim === Infinity ? null : Date.now() + lim;
  if (lim === Infinity) return;
  s.relojAusente = setTimeout(() => jugarSolo(s), lim + 120);
}
function pausarTurno(s) { consumir(s); clearTimeout(s.relojAusente); s.E.vence = null; s.E.turnoDesde = null; }
/* Se acabó el tiempo: el servidor juega por quien no respondió, para que la mesa siga. */
function jugarSolo(s) {
  const E = s.E;
  if (!E || E.ganador !== null || E.terminada !== null || s.pendiente || s.votacion) return;
  const ji = E.turno;
  consumir(s);
  const ausente = !s.jugadores[ji].conectado;
  E.registro.push(E.jugadores[ji].nombre + (ausente ? " está ausente" : " se quedó sin tiempo"));
  const sug = R.sugerencias(E, ji)[0];
  if (sug) return resolverJugada(s, ji, sug.idx, sug.jugada);
  if (E.jugadores[ji].mano.length && !E.sinDescartar && !E.extra)
    E.descarte.push(...E.jugadores[ji].mano.splice(0,1));
  cerrarTurno(s); difundir(s);
}

/* ── Jugar una carta, con la ventana del traje de protección ── */
function resolverJugada(s, ji, idx, jugada) {
  const E = s.E;
  const carta = E.jugadores[ji].mano[idx];
  const blancos = R.atacados(E, ji, jugada)
    .filter(k => E.jugadores[k].mano.some(c => c.tr === "traje"));
  if (blancos.length) {
    pausarTurno(s);
    s.pendiente = { tipo:"traje", ji, idx, jugada, carta,
      esperando: blancos, usados: [], vence: Date.now() + SEGUNDOS_TRAJE*1000 };
    clearTimeout(s.reloj);
    s.reloj = setTimeout(() => cerrarPendiente(s), SEGUNDOS_TRAJE*1000);
    difundir(s);
    return;
  }
  ejecutar(s, ji, idx, jugada, []);
}
/* Dónde aterriza la carta, para que el cliente la pueda volar hasta ahí */
function destinoDe(jugada) {
  if (jugada.o !== undefined) return { j: jugada.j, o: jugada.o };
  if (jugada.a) return { j: jugada.b.j, o: jugada.b.o };
  if (jugada.j !== undefined) return { j: jugada.j };
  return null;
}
function ejecutar(s, ji, idx, jugada, protegidos) {
  const E = s.E;
  consumir(s);
  const carta = E.jugadores[ji].mano[idx];
  const r = R.aplicar(E, ji, idx, jugada, protegidos);
  E.registro.push(...r.registro);
  E.evento = { n: ++E.eventoN, tipo: r.sonido, ji, carta,
    texto: r.registro[0] || "", destino: destinoDe(jugada) };
  if (r.fin) cerrarTurno(s);
  else { const g = R.ganador(E); if (g !== null) cantar(E, g); else programarTurno(s); }
  difundir(s);
}
function cerrarPendiente(s) {
  clearTimeout(s.reloj);
  const p = s.pendiente, E = s.E;
  if (!p) return;
  s.pendiente = null;

  if (p.tipo === "reelegir") {
    const j = p.opciones[0];
    if (j) ejecutar(s, p.ji, p.idx, j, []);
    else { E.descarte.push(...E.jugadores[p.ji].mano.splice(p.idx,1));
      E.registro.push("La carta se descarta sin efecto"); cerrarTurno(s); difundir(s); }
    return;
  }

  /* traje de protección */
  if (!p.usados.length) { ejecutar(s, p.ji, p.idx, p.jugada, []); return; }
  p.usados.forEach(k => E.registro.push(E.jugadores[k].nombre + " se protegió con el traje"));

  if (R.multiObjetivo(p.jugada.tipo)) { ejecutar(s, p.ji, p.idx, p.jugada, p.usados); return; }

  /* la carta debe buscar otro objetivo válido, incluido el propio cuerpo */
  const otras = R.jugadasLegales(E, p.ji, p.idx)
    .filter(j => !R.atacados(E, p.ji, j).some(k => p.usados.includes(k)));
  if (!otras.length) {
    E.descarte.push(...E.jugadores[p.ji].mano.splice(p.idx,1));
    E.registro.push("Sin otro objetivo válido: la carta se descarta");
    cerrarTurno(s); difundir(s); return;
  }
  otras.sort((a,b) => R.puntuar(E,p.ji,p.carta,b) - R.puntuar(E,p.ji,p.carta,a));
  s.pendiente = { tipo:"reelegir", ji:p.ji, idx:p.idx, carta:p.carta, opciones:otras,
    vence: Date.now() + SEGUNDOS_TRAJE*1000 };
  s.reloj = setTimeout(() => cerrarPendiente(s), SEGUNDOS_TRAJE*1000);
  difundir(s);
}

/* ── Salir de la partida y terminarla sin ganador ───────────── */
function acabar(s, motivo) {
  const E = s.E;
  if (!E) return;
  clearTimeout(s.relojAusente); clearTimeout(s.reloj);
  s.pendiente = null; s.votacion = null;
  E.terminada = motivo; E.vence = null; E.turnoDesde = null;
  E.registro.push(motivo);
  E.evento = { n: ++E.eventoN, tipo: "finpartida", ji: null };
}
/* Al retirarse, sus cartas vuelven al descarte: el mazo tiene que seguir cuadrando. */
function retirar(s, ji) {
  const E = s.E, j = E.jugadores[ji];
  if (!E || j.fuera) return;
  j.fuera = true;
  E.descarte.push(...j.mano.splice(0));
  j.cuerpo.forEach(o => E.descarte.push(o.carta, ...o.virus, ...o.medicinas));
  j.cuerpo = [];
  if (j.truco) { E.descarte.push(j.truco); j.truco = null; }
  E.registro.push(j.nombre + " se retiró de la partida");
  if (s.votacion) {
    s.votacion.esperando = s.votacion.esperando.filter(k => k !== ji);
    if (!s.votacion.esperando.length) return cerrarVotacion(s, true);
  }
  const quedan = E.jugadores.filter(R.activo).length;
  if (quedan < 2) return acabar(s, "La partida terminó sin ganador: ya no hay rivales");
  if (E.ganador === null && E.terminada === null) {
    if (E.turno === ji) { R.avanzarTurno(E); const g = R.ganador(E); if (g !== null) cantar(E, g); }
    programarTurno(s);
  }
}
function cerrarVotacion(s, aceptada) {
  clearTimeout(s.relojVoto);
  if (!s.votacion) return;
  const quien = s.jugadores[s.votacion.ji].nombre;
  s.votacion = null;
  if (aceptada) acabar(s, "La mesa acordó terminar la partida sin ganador");
  else { s.E.registro.push("No hubo acuerdo para terminar la partida"); programarTurno(s); }
  difundir(s);
}

/* ── Conexiones ─────────────────────────────────────────────── */
const wss = new WebSocketServer({ server: servidor });
wss.on("connection", ws => {
  ws.sala = null; ws.jugador = null;

  ws.on("message", datos => {
    let m; try { m = JSON.parse(datos); } catch(e) { return; }
    if (m.t === "latido") return;
    const s = ws.sala ? salas.get(ws.sala) : null;
    const j = s && ws.jugador !== null ? s.jugadores[ws.jugador] : null;

    if (m.t === "crear") {
      const nueva = crearSala(m.nombre, ws);
      ws.sala = nueva.codigo; ws.jugador = 0;
      enviar(nueva.jugadores[0], {t:"sesion", codigo:nueva.codigo, token:nueva.jugadores[0].token, yo:0});
      difundir(nueva); return;
    }
    if (m.t === "unir") {
      const sa = salas.get((m.codigo||"").toUpperCase());
      if (!sa) return error(ws, "No existe esa sala");
      if (sa.iniciada) return error(ws, "Esa partida ya empezó");
      if (sa.jugadores.length >= 6) return error(ws, "La sala está llena");
      const nj = sentar(sa, m.nombre, ws);
      ws.sala = sa.codigo; ws.jugador = nj.id;
      enviar(nj, {t:"sesion", codigo:sa.codigo, token:nj.token, yo:nj.id});
      difundir(sa); return;
    }
    if (m.t === "reconectar") {
      const sa = salas.get((m.codigo||"").toUpperCase());
      if (!sa) return error(ws, "Esa sala ya no existe");
      const q = sa.jugadores.find(x => x.token === m.token);
      if (!q) return error(ws, "No estabas en esa sala");
      if (q.ws && q.ws !== ws && q.ws.readyState === 1) try { q.ws.close(); } catch(e){}
      q.ws = ws; q.conectado = true;
      ws.sala = sa.codigo; ws.jugador = q.id;
      enviar(q, {t:"sesion", codigo:sa.codigo, token:q.token, yo:q.id});
      if (sa.E) sa.E.registro.push(q.nombre + " volvió a la mesa");
      programarTurno(sa); difundir(sa); return;
    }
    if (!s || !j) return;

    if (m.t === "opciones" && ws.jugador === 0 && !s.iniciada) {
      const seg = [0,30,45,60,90,120], min = [0,5,10,15,20];
      Object.assign(s.opciones, {
        expansion: !!m.opciones.expansion, duelo: !!m.opciones.duelo,
        aprendizaje: !!m.opciones.aprendizaje, halloween: !!m.opciones.halloween,
        metaInmune: !!m.opciones.metaInmune,
        segundosTurno: seg.includes(+m.opciones.segundosTurno) ? +m.opciones.segundosTurno : 60,
        minutosJugador: min.includes(+m.opciones.minutosJugador) ? +m.opciones.minutosJugador : 0 });
      return difundir(s);
    }
    if (m.t === "empezar" && ws.jugador === 0 && !s.iniciada) {
      if (s.jugadores.length < 2) return error(ws, "Se necesitan al menos dos jugadores");
      empezar(s); return difundir(s);
    }
    if (m.t === "salir") {
      if (s.iniciada && s.E && s.E.ganador === null && s.E.terminada === null) retirar(s, ws.jugador);
      j.conectado = false; j.ws = null; ws.sala = null;
      const anterior = ws.jugador; ws.jugador = null;
      if (!s.iniciada) {
        s.jugadores = s.jugadores.filter((_,i) => i !== anterior);
        s.jugadores.forEach((x,i) => { x.id = i; if (x.ws) x.ws.jugador = i; });
        if (!s.jugadores.length) salas.delete(s.codigo);
      }
      return difundir(s);
    }
    if (m.t === "terminar" && s.iniciada && s.E.ganador === null && s.E.terminada === null) {
      if (s.votacion || s.pendiente) return error(ws, "Espera a que se resuelva lo que hay en curso");
      const otros = s.jugadores.map((x,i) => i)
        .filter(i => i !== ws.jugador && x_conectado(s, i) && R.activo(s.E.jugadores[i]));
      if (!otros.length) return acabar(s, "La partida terminó sin ganador"), difundir(s);
      pausarTurno(s);
      s.votacion = { ji: ws.jugador, esperando: otros, vence: Date.now() + 30000 };
      clearTimeout(s.relojVoto);
      s.relojVoto = setTimeout(() => cerrarVotacion(s, false), 30000);
      return difundir(s);
    }
    if (m.t === "voto" && s.votacion && s.votacion.esperando.includes(ws.jugador)) {
      if (!m.si) return cerrarVotacion(s, false);
      s.votacion.esperando = s.votacion.esperando.filter(k => k !== ws.jugador);
      if (!s.votacion.esperando.length) return cerrarVotacion(s, true);
      return difundir(s);
    }
    if (m.t === "revancha" && s.iniciada && (s.E.ganador !== null || s.E.terminada !== null)) {
      empezar(s); return difundir(s);
    }

    /* respuesta al traje de protección */
    if (m.t === "traje" && s.pendiente && s.pendiente.tipo === "traje") {
      const p = s.pendiente;
      if (!p.esperando.includes(ws.jugador)) return;
      p.esperando = p.esperando.filter(k => k !== ws.jugador);
      if (m.usar) {
        const k = s.E.jugadores[ws.jugador].mano.findIndex(c => c.tr === "traje");
        if (k >= 0) { s.E.descarte.push(s.E.jugadores[ws.jugador].mano.splice(k,1)[0]); p.usados.push(ws.jugador); }
      }
      if (!p.esperando.length) cerrarPendiente(s); else difundir(s);
      return;
    }
    if (m.t === "reelegir" && s.pendiente && s.pendiente.tipo === "reelegir" && s.pendiente.ji === ws.jugador) {
      const p = s.pendiente, el = p.opciones[m.i];
      if (!el) return;
      clearTimeout(s.reloj); s.pendiente = null;
      return ejecutar(s, p.ji, p.idx, el, []);
    }

    if (!s.iniciada || !s.E || s.E.ganador !== null || s.E.terminada !== null || s.pendiente || s.votacion) return;
    if (s.E.turno !== ws.jugador) return error(ws, "No es tu turno");

    if (m.t === "jugar") {
      const legales = R.jugadasLegales(s.E, ws.jugador, m.idx);
      const el = legales.find(x => JSON.stringify(x) === JSON.stringify(m.jugada));
      if (!el) return error(ws, "Esa jugada no es legal");
      return resolverJugada(s, ws.jugador, m.idx, el);
    }
    if (m.t === "pasar") {
      const hay = s.E.jugadores[ws.jugador].mano.some((_,i)=>R.jugadasLegales(s.E, ws.jugador, i).length);
      if (hay && !s.E.sinDescartar) return error(ws, "Todavía tienes jugadas posibles");
      if (hay && s.E.sinDescartar) return error(ws, "Debes jugar una de las cartas que recibiste");
      s.E.registro.push(j.nombre + " no tenía jugada posible y pasó");
      consumir(s); cerrarTurno(s); return difundir(s);
    }
    if (m.t === "descartar") {
      if (s.E.sinDescartar) return error(ws, "Con la segunda opinión no puedes descartar");
      if (s.E.extra > 0) return error(ws, "Estás en horas extra: te toca jugar cartas");
      const idxs = [...new Set(m.idxs)].filter(i => i>=0 && i<s.E.jugadores[ws.jugador].mano.length);
      if (!idxs.length) return error(ws, "Elige al menos una carta");
      idxs.sort((a,b)=>b-a).forEach(i => s.E.descarte.push(s.E.jugadores[ws.jugador].mano.splice(i,1)[0]));
      s.E.registro.push(j.nombre + " descartó " + idxs.length + (idxs.length>1?" cartas":" carta"));
      s.E.evento = { n: ++s.E.eventoN, tipo:"descarte", ji: ws.jugador };
      consumir(s); cerrarTurno(s); return difundir(s);
    }
  });

  ws.on("close", () => {
    const s = ws.sala ? salas.get(ws.sala) : null;
    if (!s || ws.jugador === null) return;
    const j = s.jugadores[ws.jugador];
    if (j.ws === ws) { j.conectado = false; j.ws = null; }
    if (!s.iniciada) {          /* en la sala de espera, el que se va libera la silla */
      s.jugadores = s.jugadores.filter(x => x !== j);
      s.jugadores.forEach((x,i) => { x.id = i; if (x.ws) x.ws.jugador = i; });
    }
    if (!vivos(s) && !s.iniciada) salas.delete(s.codigo);
    else { programarTurno(s); difundir(s); }
  });
});

/* limpieza de salas viejas */
setInterval(() => {
  const ahora = Date.now();
  salas.forEach((s,c) => { if (!vivos(s) && ahora - s.creada > VIDA_SALA) salas.delete(c); });
}, 10*60*1000);

servidor.listen(PUERTO, () => console.log("VIRUS! en línea escuchando en http://localhost:" + PUERTO));
