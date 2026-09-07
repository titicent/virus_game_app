/* Bots: verifica que una partida en solitario se juegue y termine sola. */
const { spawn } = require("child_process");
const WebSocket = require("/home/claude/online/node_modules/ws");
const P = Number(process.env.PORT_TEST || 4160);
const srv = spawn("node", ["server.js"], { cwd:"/home/claude/online", env:{...process.env, PORT:P, PENSAR_BOT:"8"}, stdio:["ignore","ignore","pipe"] });
srv.stderr.on("data",d=>console.log("⚠ SERVIDOR:",d.toString().trim().split(String.fromCharCode(10))[0]));
const espera=ms=>new Promise(r=>setTimeout(r,ms));
const abrir=()=>new Promise(res=>{const w=new WebSocket("ws://localhost:"+P);w.on("open",()=>res(w));});
class J{ constructor(){this.V=null;}
  async abrir(){this.ws=await abrir();
    this.ws.on("message",d=>{const m=JSON.parse(d);
      if(m.t==="sesion"){this.cod=m.codigo;this.yo=m.yo;}
      if(m.t==="vista"){this.V=m.v;this.auto();}});}
  env(m){this.ws.send(JSON.stringify(m));}
  auto(){const V=this.V;if(!V||!V.iniciada||V.ganador!==null||V.terminada)return;
    if(V.pendiente&&V.pendiente.mio){this.env({t:"traje",usar:Math.random()<.5});return;}
    if(V.turno!==V.yo||V.pendiente)return;
    setTimeout(()=>{const W=this.V;if(!W||W.turno!==W.yo||W.ganador!==null||W.terminada||W.pendiente)return;
      const ops=[];(W.jugadas||[]).forEach((js,i)=>js.forEach(j=>ops.push({i,j})));
      if(ops.length)this.env({t:"jugar",idx:ops[0].i,jugada:ops[0].j});
      else if(W.mano.length&&!W.sinDescartar&&!W.extra)this.env({t:"descartar",idxs:[0]});
      else this.env({t:"pasar"});},5);}}
(async()=>{
  await espera(600);
  let ganadas=0, detalle=[];
  for(const conf of [["experto","experto","experto"],["normal","novato"],["experto"]]){
    const yo=new J(); await yo.abrir();
    yo.env({t:"crear",nombre:"Ricardo"}); await espera(150);
    for(const n of conf){ yo.env({t:"bot",nivel:n}); await espera(70); }
    yo.env({t:"opciones",opciones:{expansion:true,halloween:true,duelo:false,aprendizaje:false,metaInmune:false,segundosTurno:0,minutosJugador:0}});
    await espera(120); yo.env({t:"empezar"}); await espera(400);
    const t=Date.now();
    while(Date.now()-t<16000 && yo.V.iniciada && yo.V.ganador===null && !yo.V.terminada) await espera(120);
    const g=yo.V.ganador;
    if(g!==null&&g!==undefined){ganadas++;detalle.push((conf.length+1)+" jugadores → ganó "+yo.V.jugadores[g].nombre+" en "+Math.round((Date.now()-t)/1000)+"s");}
    else detalle.push((conf.length+1)+" jug → no cerró (mazo "+yo.V.mazo+") último: "+(yo.V.registro||[]).slice(-2).join(" / "));
    yo.ws.close(); await espera(200);
  }
  console.log("partidas en solitario completadas:", ganadas+"/3");
  detalle.forEach(d=>console.log("   ·",d));
  srv.kill(); process.exit(0);
})();
