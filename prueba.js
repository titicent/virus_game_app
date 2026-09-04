/* Levanta el servidor y juega partidas completas con clientes reales
   por websocket: crear sala, unirse, jugar, traje de protección,
   desconexión y reconexión a mitad de partida. */
const { spawn } = require("child_process");
const WebSocket = require("ws");

const PUERTO = 3987;
const srv = spawn("node", ["server.js"], { env: {...process.env, PORT: PUERTO}, stdio: ["ignore","pipe","pipe"] });
srv.stderr.on("data", d => console.log("SERVIDOR:", d.toString().trim()));

const espera = ms => new Promise(r => setTimeout(r, ms));


class Jugador {
  static acciones = 0;
  constructor(nombre){ this.nombre = nombre; this.V = null; this.errores = []; }
  conectar(){
    return new Promise(res => {
      this.ws = new WebSocket("ws://localhost:" + PUERTO);
      this.ws.on("open", res);
      this.ws.on("message", d => {
        const m = JSON.parse(d);
        if (m.t === "sesion") { this.codigo = m.codigo; this.token = m.token; this.yo = m.yo; }
        if (m.t === "vista") { this.V = m.v; this.reaccionar(); }
        if (m.t === "error") this.errores.push(m.msg);
      });
    });
  }
  env(m){ if(m.t==="jugar"||m.t==="descartar"||m.t==="pasar")Jugador.acciones++; this.ws.send(JSON.stringify(m)); }
  reaccionar(){
    const V = this.V;
    if (!V.iniciada || V.ganador !== null) return;
    if (V.pendiente && V.pendiente.mio) {
      if (V.pendiente.tipo === "traje") this.env({t:"traje", usar: Math.random() < 0.6});
      else if (V.pendiente.opciones) this.env({t:"reelegir", i: 0});
      return;
    }
    if (V.turno !== V.yo || V.pendiente) return;
    setTimeout(() => {
      if (!this.V || this.V.turno !== this.V.yo || this.V.pendiente || this.V.ganador !== null) return;
      const V2 = this.V;
      const ops = [];
      (V2.jugadas||[]).forEach((js,idx) => js.forEach(j => ops.push({idx,j})));
      if (ops.length && Math.random() > 0.15) {
        const el = ops[Math.floor(Math.random()*ops.length)];
        this.env({t:"jugar", idx: el.idx, jugada: el.j});
      } else if (!V2.sinDescartar && !V2.extra && V2.mano.length) {
        this.env({t:"descartar", idxs:[0]});
      } else if (!ops.length) {
        this.env({t:"pasar"});
      } else {
        const el = ops[0]; this.env({t:"jugar", idx: el.idx, jugada: el.j});
      }
    }, 12);
  }
}

async function partida(n, opciones, conCortes){
  Jugador.acciones = 0;
  const js = Array.from({length:n}, (_,i) => new Jugador("J"+(i+1)));
  await Promise.all(js.map(j => j.conectar()));
  js[0].env({t:"crear", nombre: js[0].nombre});
  await espera(120);
  for (let i=1;i<n;i++){ js[i].env({t:"unir", codigo: js[0].codigo, nombre: js[i].nombre}); await espera(60); }
  js[0].env({t:"opciones", opciones});
  await espera(60);
  js[0].env({t:"empezar"});

  if (conCortes) setTimeout(async () => {           /* alguien pierde la señal a mitad */
    const v = js[n-1];
    v.ws.close();
    await espera(1500);
    await v.conectar();
    v.env({t:"reconectar", codigo: v.codigo, token: v.token});
  }, 900);

  const limite = Date.now() + 22000;
  while (Date.now() < limite) {
    await espera(150);
    const fin = js.find(j => j.V && j.V.ganador !== null);
    if (fin) { const errs = js.flatMap(j=>j.errores.filter(e=>!/No es tu turno|jugadas posibles|al menos una/.test(e)));
      js.forEach(j => j.ws.close());
      return { ok:true, ganador: fin.V.jugadores[fin.V.ganador].nombre,
        turnos: Jugador.acciones, errs }; }
  }
  const est = js[0].V;
  js.forEach(j => j.ws.close());
  return { ok:false, motivo:"no terminó", turno: est && est.turno, pendiente: est && est.pendiente };
}

(async () => {
  await espera(700);
  const casos = [
    [2, {expansion:true, duelo:true, aprendizaje:true, halloween:true}, false],
    [3, {expansion:true, duelo:false, aprendizaje:false}, true],
    [4, {expansion:true, duelo:false, aprendizaje:true, halloween:true}, false],
    [6, {expansion:true, duelo:false, aprendizaje:false, halloween:true}, true],
    [3, {expansion:false, duelo:false, aprendizaje:false}, false],
  ];
  let bien = 0;
  for (const [n, o, cortes] of casos){
    const r = await partida(n, o, cortes);
    if (r.ok){ bien++;
      console.log(`✓ ${n} jugadores${o.halloween?" con Halloween":o.expansion?" con expansión":" solo base"}${cortes?" y con caída de señal":""} → ganó ${r.ganador} tras ${r.turnos} acciones${r.errs.length?" · avisos: "+r.errs.slice(0,2).join("/"):""}`);
    } else console.log(`✗ ${n} jugadores:`, r.motivo, JSON.stringify(r.pendiente||{}));
    await espera(250);
  }
  console.log(`\n${bien} de ${casos.length} partidas completadas de principio a fin`);
  srv.kill(); process.exit(bien === casos.length ? 0 : 1);
})();
