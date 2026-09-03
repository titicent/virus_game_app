/* ═══════════════════════════════════════════════════════════════
   VIRUS! en línea — sonido
   Todo se sintetiza en el navegador con WebAudio: ni un archivo de
   audio, ni una descarga, ni música de terceros. Pesa 6 KB y suena
   igual sin conexión.
   ═══════════════════════════════════════════════════════════════ */
(function (raiz) {
"use strict";

let ctx = null, maestro = null, gEfe = null, gFondo = null;
let fondoVivo = null, arrancado = false, tenebroso = false;
const guardado = k => { try { return localStorage.getItem(k) !== "0"; } catch(e) { return true; } };
const estado = { efectos: guardado("virus.efectos"), fondo: guardado("virus.fondo") };

function crear() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  maestro = ctx.createGain(); maestro.gain.value = 0.9; maestro.connect(ctx.destination);
  gEfe = ctx.createGain();  gEfe.gain.value = estado.efectos ? 0.85 : 0; gEfe.connect(maestro);
  gFondo = ctx.createGain(); gFondo.gain.value = 0; gFondo.connect(maestro);
  return true;
}
/* Los navegadores exigen un gesto de la persona antes de sonar. */
function arrancar() {
  if (arrancado || !crear()) return;
  arrancado = true;
  if (ctx.state === "suspended") ctx.resume();
  if (estado.fondo) encenderFondo();
}

/* ── Ladrillos ──────────────────────────────────────────────── */
const ahora = () => ctx.currentTime;
function tono({f = 440, f2, tipo = "sine", dur = .25, vol = .3, ret = 0, destino}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, ahora() + ret);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), ahora() + ret + dur);
  g.gain.setValueAtTime(0.0001, ahora() + ret);
  g.gain.exponentialRampToValueAtTime(vol, ahora() + ret + Math.min(.02, dur * .2));
  g.gain.exponentialRampToValueAtTime(0.0001, ahora() + ret + dur);
  o.connect(g); g.connect(destino || gEfe);
  o.start(ahora() + ret); o.stop(ahora() + ret + dur + .05);
  return o;
}
function ruido({dur = .2, vol = .3, ret = 0, f = 900, f2, q = 1, tipo = "bandpass", destino}) {
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const filtro = ctx.createBiquadFilter(); filtro.type = tipo;
  filtro.frequency.setValueAtTime(f, ahora() + ret);
  if (f2) filtro.frequency.exponentialRampToValueAtTime(Math.max(40, f2), ahora() + ret + dur);
  filtro.Q.value = q;
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(filtro); filtro.connect(g); g.connect(destino || gEfe);
  s.start(ahora() + ret);
}
const acorde = (notas, tipo, dur, vol) =>
  notas.forEach((f, i) => tono({f, tipo: tipo || "sine", dur: dur || .28, vol: vol || .22, ret: i * .075}));

/* ── Efectos por suceso ─────────────────────────────────────── */
const EFECTOS = {
  bajar()        { ruido({dur:.09, vol:.35, f:260, q:2}); tono({f:150, f2:90, tipo:"sine", dur:.14, vol:.3}); },
  mutar()        { tono({f:120, f2:70, tipo:"sawtooth", dur:.5, vol:.22}); ruido({dur:.4, vol:.2, f:400, f2:120}); },
  infectar()     { tono({f:300, f2:105, tipo:"sawtooth", dur:.32, vol:.24}); ruido({dur:.18, vol:.16, f:1200, f2:300}); },
  extirpar()     { ruido({dur:.36, vol:.4, f:1800, f2:120, tipo:"lowpass"}); tono({f:90, f2:45, tipo:"square", dur:.3, vol:.18, ret:.03}); },
  neutralizar()  { ruido({dur:.22, vol:.3, f:2400, f2:600}); tono({f:220, f2:140, tipo:"triangle", dur:.2, vol:.16}); },
  curar()        { acorde([523.25, 659.25, 783.99]); },
  vacunar()      { tono({f:659.25, tipo:"triangle", dur:.3, vol:.26}); },
  inmunizar()    { acorde([659.25, 987.77, 1318.5], "sine", .42, .2); ruido({dur:.5, vol:.07, f:5000, q:.6, ret:.05}); },
  ladron()       { ruido({dur:.3, vol:.28, f:300, f2:2600}); tono({f:180, f2:520, tipo:"triangle", dur:.26, vol:.16}); },
  trasplante()   { ruido({dur:.26, vol:.22, f:700, f2:2200}); tono({f:400, f2:600, tipo:"sine", dur:.22, vol:.16, ret:.1}); },
  contagio()     { [0,.09,.18].forEach(r => tono({f:340, f2:120, tipo:"sawtooth", dur:.22, vol:.17, ret:r})); },
  guante()       { ruido({dur:.42, vol:.34, f:3200, f2:400}); },
  error()        { tono({f:260, f2:130, tipo:"square", dur:.34, vol:.16}); tono({f:130, f2:260, tipo:"square", dur:.34, vol:.16, ret:.06}); },
  cambio()       { [0,.1,.2,.3].forEach((r,i) => tono({f:220 + i*90, tipo:"triangle", dur:.24, vol:.17, ret:r})); ruido({dur:.6, vol:.14, f:600, f2:2400}); },
  horas()        { acorde([440, 554.37, 659.25], "triangle", .3, .2); },
  segunda()      { ruido({dur:.2, vol:.22, f:1400, f2:600}); ruido({dur:.2, vol:.22, f:600, f2:1400, ret:.14}); },
  cuarentena()   { tono({f:1200, f2:900, tipo:"square", dur:.08, vol:.16}); ruido({dur:.5, vol:.13, f:2200, f2:300, ret:.05}); },
  aparicion()    { tono({f:180, f2:900, tipo:"sine", dur:.7, vol:.2}); tono({f:186, f2:930, tipo:"sine", dur:.7, vol:.14, ret:.02}); },
  truco()        { tono({f:311.13, f2:293.66, tipo:"triangle", dur:.5, vol:.24});
                   tono({f:233.08, tipo:"triangle", dur:.7, vol:.2, ret:.22});
                   ruido({dur:.9, vol:.08, f:900, q:.5, ret:.1}); },
  descarte()     { ruido({dur:.13, vol:.24, f:2600, f2:1200}); },
  turno()        { tono({f:880, tipo:"sine", dur:.16, vol:.2}); tono({f:1174.66, tipo:"sine", dur:.22, vol:.16, ret:.12}); },
  tic()          { tono({f:1500, tipo:"square", dur:.04, vol:.12}); },
  victoria()     { [523.25, 659.25, 783.99, 1046.5].forEach((f,i) =>
                     tono({f, tipo:"triangle", dur:.5, vol:.24, ret:i*.11})); },
  derrota()      { tono({f:392, f2:196, tipo:"triangle", dur:.8, vol:.2}); }
};
const ALIAS = {infectar:"infectar", superinmunizar:"inmunizar", exp_curar:"curar",
  exp_extirpar:"extirpar", exp_quitar:"neutralizar", exp_inmunizar:"inmunizar",
  ladron_color:"ladron", alien:"trasplante"};

function efecto(tipo) {
  if (!estado.efectos || !arrancado || !ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const f = EFECTOS[ALIAS[tipo] || tipo];
  if (f) try { f(); } catch(e) {}
}

/* ── Fondo: latido de quirófano y un colchón grave ──────────── */
function encenderFondo() {
  if (fondoVivo || !ctx) return;
  const bus = ctx.createGain(); bus.gain.value = 1; bus.connect(gFondo);
  const filtro = ctx.createBiquadFilter(); filtro.type = "lowpass";
  filtro.frequency.value = 320; filtro.connect(bus);

  const notas = tenebroso ? [55, 58.27, 82.41] : [55, 82.41];   /* con Halloween, un semitono que roza */
  const oscs = notas.map((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.value = i === 2 ? .05 : .09;
    o.connect(g); g.connect(filtro); o.start();
    return o;
  });
  /* vaivén lento, para que el colchón respire */
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain();
  lfo.frequency.value = .05; lfoG.gain.value = 60;
  lfo.connect(lfoG); lfoG.connect(filtro.frequency); lfo.start();

  const latido = setInterval(() => {
    if (!ctx || ctx.state !== "running") return;
    tono({f:64, f2:40, tipo:"sine", dur:.16, vol:.5, destino:bus});
    tono({f:58, f2:36, tipo:"sine", dur:.14, vol:.34, ret:.24, destino:bus});
  }, 2400);

  gFondo.gain.cancelScheduledValues(ahora());
  gFondo.gain.setValueAtTime(0.0001, ahora());
  gFondo.gain.exponentialRampToValueAtTime(estado.fondo ? .5 : .0001, ahora() + 2.5);
  fondoVivo = { oscs, lfo, latido, bus };
}
function apagarFondo() {
  if (!fondoVivo) return;
  gFondo.gain.cancelScheduledValues(ahora());
  gFondo.gain.setValueAtTime(gFondo.gain.value, ahora());
  gFondo.gain.exponentialRampToValueAtTime(0.0001, ahora() + .8);
  const f = fondoVivo; fondoVivo = null;
  clearInterval(f.latido);
  setTimeout(() => { try { f.oscs.forEach(o => o.stop()); f.lfo.stop(); } catch(e) {} }, 1000);
}
function ambiente(halloween) {
  if (tenebroso === !!halloween) return;
  tenebroso = !!halloween;
  if (fondoVivo) { apagarFondo(); setTimeout(() => { if (estado.fondo && arrancado) encenderFondo(); }, 1100); }
}

/* ── Interruptores ──────────────────────────────────────────── */
function alternar(cual) {
  estado[cual] = !estado[cual];
  try { localStorage.setItem("virus." + cual, estado[cual] ? "1" : "0"); } catch(e) {}
  if (!ctx) { if (estado[cual]) arrancar(); return estado[cual]; }
  if (cual === "efectos") gEfe.gain.setTargetAtTime(estado.efectos ? .85 : 0, ahora(), .05);
  else estado.fondo ? (arrancado ? encenderFondo() : arrancar()) : apagarFondo();
  return estado[cual];
}

raiz.SONIDO = {arrancar, efecto, alternar, ambiente, estado};
})(typeof self !== "undefined" ? self : globalThis);
