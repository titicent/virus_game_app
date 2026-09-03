/* Simula partidas completas con jugadores aleatorios para cazar
   estados imposibles: órganos repetidos, cartas perdidas, bucles. */
const R = require("./public/reglas.js");

function nuevaPartida(n, expansion, objetivo){
  const E = {
    jugadores: Array.from({length:n},(_,i)=>({nombre:"J"+i,mano:[],cuerpo:[]})),
    mazo: R.barajar(R.crearMazo(expansion)), descarte:[], retiradas:[],
    turno:0, extra:0, sinDescartar:false, objetivo:objetivo||4, registro:[]
  };
  E.jugadores.forEach((_,i)=>R.robar(E,i));
  return E;
}
function total(E){
  return E.mazo.length + E.descarte.length + E.retiradas.length +
    E.jugadores.reduce((a,j)=>a+j.mano.length+j.cuerpo.reduce(
      (b,o)=>b+1+o.medicinas.length+o.virus.length,0),0);
}
function invariantes(E,esperado,ctx){
  const t=total(E);
  if(t!==esperado)throw new Error(`cartas perdidas: ${t} de ${esperado} (${ctx})`);
  E.jugadores.forEach(j=>{
    const c=j.cuerpo.map(o=>o.carta.c);
    if(new Set(c).size!==c.length)throw new Error(j.nombre+" tiene órganos repetidos: "+c);
    if(j.mano.length>3)throw new Error(j.nombre+" tiene "+j.mano.length+" cartas");
    j.cuerpo.forEach(o=>{
      if(o.virus.length&&o.medicinas.length)throw new Error("órgano con virus y medicina a la vez");
      if(o.virus.length>1)throw new Error("órgano con dos virus vivos");
      if(o.medicinas.length>2)throw new Error("órgano con tres medicinas");
      if(R.esBionico(o)&&(o.virus.length||o.medicinas.length))throw new Error("biónico tocado");
    });
  });
}

function jugarPartida(n, expansion, semilla){
  let rnd = semilla;
  const rand = () => (rnd = (rnd*1103515245+12345) % 2147483648) / 2147483648;
  const E = nuevaPartida(n, expansion);
  const esperado = total(E);
  let turnos = 0;
  const usos = {};
  while (R.ganador(E)===null && turnos < 4000) {
    turnos++;
    const ji = E.turno;
    const opciones = [];
    E.jugadores[ji].mano.forEach((c,idx)=>
      R.jugadasLegales(E,ji,idx).forEach(j=>opciones.push({idx,j,carta:c})));
    if (opciones.length && rand() > 0.12) {
      /* juega la mejor con algo de ruido, como jugaría una persona */
      opciones.sort((a,b)=>R.puntuar(E,ji,b.carta,b.j)-R.puntuar(E,ji,a.carta,a.j));
      const el = opciones[rand()<0.75?0:Math.floor(rand()*opciones.length)];
      usos[el.j.tipo]=(usos[el.j.tipo]||0)+1;
      /* traje de protección: los atacados lo usan si lo tienen */
      const prot = R.atacados(E,ji,el.j).filter(k=>{
        const t=E.jugadores[k].mano.findIndex(c=>c.tr==="traje");
        if(t<0||rand()<0.3)return false;
        E.descarte.push(E.jugadores[k].mano.splice(t,1)[0]);
        return true;
      });
      const bloqueado = prot.length && !R.multiObjetivo(el.j.tipo);
      if (bloqueado) { E.descarte.push(E.jugadores[ji].mano.splice(el.idx,1)[0]); usos.bloqueada=(usos.bloqueada||0)+1; }
      else { const r=R.aplicar(E,ji,el.idx,el.j,prot); if(!r.fin){invariantes(E,esperado,"extra");continue;} }
    } else {
      const k = 1+Math.floor(rand()*E.jugadores[ji].mano.length);
      E.descarte.push(...E.jugadores[ji].mano.splice(0,k));
      usos.descarte=(usos.descarte||0)+1;
    }
    invariantes(E,esperado,"turno "+turnos);
    R.avanzarTurno(E);
    invariantes(E,esperado,"tras avanzar "+turnos);
  }
  return {turnos, ganador:R.ganador(E), usos, esperado};
}

let fallos=0, tipos={};
for (let s=1; s<=300; s++){
  const n = 2+(s%5), exp = s%3!==0;
  try{
    const r = jugarPartida(n, exp, s*7919);
    if(r.ganador===null)console.log("⚠ partida sin ganador tras",r.turnos,"turnos (semilla",s+")");
    Object.entries(r.usos).forEach(([k,v])=>tipos[k]=(tipos[k]||0)+v);
    if(s===1)console.log("mazo base+expansión:",r.esperado,"cartas");
  }catch(e){ fallos++; if(fallos<4)console.log("✗ semilla",s,"·",e.message); }
}
console.log("\npartidas simuladas: 300 · fallos:",fallos);
console.log("jugadas ejercitadas:",Object.entries(tipos).sort((a,b)=>b[1]-a[1])
  .map(([k,v])=>k+":"+v).join(" · "));
