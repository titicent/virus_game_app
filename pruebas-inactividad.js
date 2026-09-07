/* Inactividad: quien no juega en 3 turnos queda fuera y la mesa sigue. */
const { spawn } = require("child_process");
const WebSocket = require("/home/claude/online/node_modules/ws");
const P = Number(process.env.PORT_TEST || 4161);
const srv = spawn("node", ["server.js"], { cwd:"/home/claude/online",
  env:{...process.env, PORT:P, PENSAR_BOT:"12", SEG_AUSENTE:"2"}, stdio:["ignore","ignore","pipe"] });
srv.stderr.on('data',x=>console.log('⚠ SERVIDOR:',x.toString().trim().split('\n')[0]));
const espera = ms => new Promise(r => setTimeout(r, ms));
const abrir = () => new Promise(res => { const w=new WebSocket("ws://localhost:"+P); w.on("open",()=>res(w)); });
class J{ constructor(){this.V=null;this.quieto=false;this.log=[];}
  async abrir(){ this.ws=await abrir();
    this.ws.on("message",d=>{const m=JSON.parse(d);
      if(m.t==="sesion"){this.cod=m.codigo;this.yo=m.yo;}
      if(m.t==="vista"){this.V=m.v;(m.v.registro||[]).forEach(r=>{if(!this.log.includes(r))this.log.push(r)});this.auto();}});}
  env(m){this.ws.send(JSON.stringify(m));}
  auto(){const V=this.V; if(!V||!V.iniciada||V.ganador!==null||V.terminada||this.quieto)return;
    if(V.pendiente&&V.pendiente.mio){this.env({t:"traje",usar:false});return;}
    if(V.turno!==V.yo||V.pendiente||V.votacion)return;
    setTimeout(()=>{const W=this.V; if(!W||W.turno!==W.yo||W.ganador!==null||W.terminada||this.quieto||W.pendiente)return;
      const ops=[];(W.jugadas||[]).forEach((js,i)=>js.forEach(j=>ops.push({i,j})));
      if(ops.length)this.env({t:"jugar",idx:ops[0].i,jugada:ops[0].j});
      else if(W.mano.length&&!W.sinDescartar&&!W.extra)this.env({t:"descartar",idxs:[0]});
      else this.env({t:"pasar"});},8);}}
(async()=>{
  await espera(600);
  const a=new J(), b=new J(); await a.abrir(); await b.abrir();
  a.env({t:"crear",nombre:"Activo"}); await espera(150);
  b.env({t:"unir",codigo:a.cod,nombre:"Dormido"}); await espera(150);
  a.env({t:"bot",nivel:"normal"}); await espera(120);
  a.env({t:"opciones",opciones:{expansion:true,halloween:false,duelo:false,aprendizaje:false,metaInmune:false,segundosTurno:0,minutosJugador:0}});
  await espera(200);
  a.env({t:"empezar"}); await espera(400);
  b.quieto=true; b.ws.close();          /* se le cae la señal y no vuelve */
  const t=Date.now(); let ok=false;
  let visto=[];
  while(Date.now()-t<20000){ await espera(250);
    const tn=a.V.jugadores[a.V.turno].nombre; if(visto[visto.length-1]!==tn)visto.push(tn);
    const d=a.V.jugadores.find(j=>j.nombre==="Dormido");
    if(d && d.fuera){ok=true;break}
    if(a.V.ganador!==null||a.V.terminada)break; }
  console.log("expulsión por inactividad:", ok?"sí, a los "+Math.round((Date.now()-t)/1000)+"s":"NO");
  console.log("avisos previos y expulsión:");
  a.log.filter(r=>/Dormido/.test(r)).forEach(r=>console.log("   ·",r));
  console.log("secuencia de turnos:", visto.join(" → "));
  console.log("la mesa sigue viva:", a.V.ganador===null&&!a.V.terminada?"sí":"terminó");
  srv.kill(); process.exit(0);
})();
