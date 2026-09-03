/* ═══════════════════════════════════════════════════════════════
   VIRUS! en línea — motor de reglas
   Lo carga el servidor (require) y el navegador (<script>).
   El servidor es la autoridad: el cliente usa esto solo para pintar
   objetivos legales y sugerencias, nunca para decidir el resultado.
   ═══════════════════════════════════════════════════════════════ */
(function (raiz) {
"use strict";

const COLORES = ["rojo", "verde", "azul", "hueso"];
const ORG = {
  rojo:{label:"Corazón",hex:"#C93A3A"}, verde:{label:"Estómago",hex:"#3D8F4E"},
  azul:{label:"Cerebro",hex:"#2C63C4"}, hueso:{label:"Hueso",hex:"#C79320"},
  multi:{label:"Multicolor",hex:"#7B4FB5"}, bionico:{label:"Biónico",hex:"#6E7A88"}
};
const TRAT = {trasplante:"Trasplante", ladron:"Ladrón de órganos", contagio:"Contagio",
  guante:"Guante de látex", error:"Error médico", horas:"Horas extra",
  segunda:"Segunda opinión", traje:"Traje de protección", cuarentena:"Cuarentena"};

/* ── Mazo ───────────────────────────────────────────────────── */
function crearMazo(expansion){
  const m=[]; let n=0;
  const add=(c,veces)=>{for(let i=0;i<veces;i++)m.push(Object.assign({id:"k"+(n++)},c))};
  add({k:"organo",c:"multi"},1);                COLORES.forEach(c=>add({k:"organo",c},5));
  add({k:"virus",c:"multi",t:"basico"},1);      COLORES.forEach(c=>add({k:"virus",c,t:"basico"},4));
  add({k:"medicina",c:"multi",t:"basica"},4);   COLORES.forEach(c=>add({k:"medicina",c,t:"basica"},4));
  add({k:"tratamiento",tr:"trasplante"},2); add({k:"tratamiento",tr:"ladron"},3);
  add({k:"tratamiento",tr:"contagio"},3);   add({k:"tratamiento",tr:"guante"},1);
  add({k:"tratamiento",tr:"error"},1);
  if(expansion){
    add({k:"organo",c:"bionico"},1);             COLORES.forEach(c=>add({k:"organo",c},1));
    add({k:"virus",c:"multi",t:"evo"},1);        COLORES.forEach(c=>add({k:"virus",c,t:"evo"},2));
    add({k:"medicina",c:"multi",t:"exp"},3);     COLORES.forEach(c=>add({k:"medicina",c,t:"exp"},1));
    add({k:"tratamiento",tr:"traje"},4);      add({k:"tratamiento",tr:"horas"},2);
    add({k:"tratamiento",tr:"segunda"},2);    add({k:"tratamiento",tr:"cuarentena"},4);
  }
  return m;
}
function barajar(a,rnd){
  const r=rnd||Math.random;
  for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

/* ── Nombres ────────────────────────────────────────────────── */
const etColor=c=>c==="multi"?"multicolor":ORG[c].label.toLowerCase();
function nombreCarta(x){
  if(!x)return "—";
  if(x.k==="organo")return "Órgano "+ORG[x.c].label.toLowerCase();
  if(x.k==="virus")return "Virus "+(x.t==="evo"?"evolucionado ":"básico ")+etColor(x.c);
  if(x.k==="medicina")return "Medicina "+(x.t==="exp"?"experimental ":"básica ")+etColor(x.c);
  return TRAT[x.tr];
}
const colorCarta=x=>!x?"#9aa3ab":(x.k==="tratamiento"?"#4A6D67":ORG[x.c].hex);

/* ── Estado de un órgano ────────────────────────────────────── */
/* organo = {carta, medicinas:[], virus:[]} */
function estadoOrgano(o){
  if(o.virus.length)return "infectado";
  if(o.medicinas.length>=2)return "inmunizado";
  if(o.medicinas.length===1)return o.medicinas[0].t==="exp"?"inmunizado":"vacunado";
  return "libre";
}
const esBionico=o=>o.carta.c==="bionico";
const esSano=o=>esBionico(o)||estadoOrgano(o)!=="infectado";
const sanos=j=>j.cuerpo.filter(esSano).length;
const afectaColor=(c,o)=>!esBionico(o)&&(c==="multi"||o.carta.c==="multi"||o.carta.c===c);
const tieneColor=(j,c)=>j.cuerpo.some(o=>o.carta.c===c);

function descEstado(o){
  if(esBionico(o))return "biónico";
  const e=estadoOrgano(o);
  if(e==="infectado")return "infectado ("+(o.virus[0].t==="evo"?"evolucionado":"básico")+")";
  return e;
}

/* ── Jugadas legales de una carta ───────────────────────────── */
/* Devuelve [{tipo, ...referencias, etiqueta}]. Referencias por índice:
   j = índice de jugador, o = índice de órgano dentro de su cuerpo.    */
function jugadasLegales(E, ji, idx){
  const yo=E.jugadores[ji], carta=yo.mano[idx], out=[];
  if(!carta)return out;
  const nom=(j,o)=>(j===ji?"tu ":"el ")+ORG[E.jugadores[j].cuerpo[o].carta.c].label.toLowerCase()+
                   (j===ji?"":" de "+E.jugadores[j].nombre);

  if(carta.k==="organo"){
    if(!tieneColor(yo,carta.c))out.push({tipo:"bajar",etiqueta:"Bajar "+nombreCarta(carta)});
    return out;
  }

  if(carta.k==="virus"){
    E.jugadores.forEach((jug,j)=>{
      jug.cuerpo.forEach((o,oi)=>{
        if(!afectaColor(carta.c,o))return;
        const e=estadoOrgano(o);
        if(e==="inmunizado")return;
        if(e==="libre")out.push({tipo:"infectar",j,o:oi,etiqueta:"Infectar "+nom(j,oi)});
        else if(e==="vacunado")out.push({tipo:"neutralizar",j,o:oi,etiqueta:"Quitar la vacuna de "+nom(j,oi)});
        else out.push({tipo:"extirpar",j,o:oi,etiqueta:"Extirpar "+nom(j,oi)});
      });
    });
    return out;
  }

  if(carta.k==="medicina"){
    yo.cuerpo.forEach((o,oi)=>{
      if(!afectaColor(carta.c,o))return;
      const e=estadoOrgano(o);
      if(e==="inmunizado")return;
      if(e==="infectado"){
        if(o.virus[0].t==="evo"&&carta.t!=="exp")return;
        out.push({tipo:"curar",j:ji,o:oi,etiqueta:"Curar "+nom(ji,oi)});
      } else if(e==="vacunado")out.push({tipo:"inmunizar",j:ji,o:oi,etiqueta:"Inmunizar "+nom(ji,oi)});
      else out.push(carta.t==="exp"
        ?{tipo:"superinmunizar",j:ji,o:oi,etiqueta:"Superinmunizar "+nom(ji,oi)}
        :{tipo:"vacunar",j:ji,o:oi,etiqueta:"Vacunar "+nom(ji,oi)});
    });
    return out;
  }

  const tr=carta.tr;
  if(tr==="trasplante"){
    yo.cuerpo.forEach((mio,mi)=>{
      if(estadoOrgano(mio)==="inmunizado")return;
      E.jugadores.forEach((otro,j)=>{
        if(j===ji)return;
        otro.cuerpo.forEach((suyo,si)=>{
          if(estadoOrgano(suyo)==="inmunizado")return;
          if(yo.cuerpo.some((x,k)=>k!==mi&&x.carta.c===suyo.carta.c))return;
          if(otro.cuerpo.some((x,k)=>k!==si&&x.carta.c===mio.carta.c))return;
          out.push({tipo:"trasplante",a:{j:ji,o:mi},b:{j,o:si},j,
            etiqueta:"Cambiar "+nom(ji,mi)+" por "+nom(j,si)});
        });
      });
    });
    return out;
  }
  if(tr==="ladron"){
    E.jugadores.forEach((otro,j)=>{
      if(j===ji)return;
      otro.cuerpo.forEach((o,oi)=>{
        if(estadoOrgano(o)==="inmunizado")return;
        if(tieneColor(yo,o.carta.c))return;
        out.push({tipo:"ladron",j,o:oi,etiqueta:"Robar "+nom(j,oi)});
      });
    });
    return out;
  }
  if(tr==="contagio"){
    if(repartoContagio(E,ji).length)out.push({tipo:"contagio",etiqueta:"Pasar tus virus a los rivales"});
    return out;
  }
  if(tr==="guante"){
    if(E.jugadores.some((j,i)=>i!==ji&&j.mano.length))out.push({tipo:"guante",etiqueta:"Todos menos tú descartan su mano"});
    return out;
  }
  if(tr==="error"){
    E.jugadores.forEach((otro,j)=>{ if(j!==ji)
      out.push({tipo:"error",j,etiqueta:"Cambiar tu cuerpo con el de "+otro.nombre}) });
    return out;
  }
  if(tr==="horas"){
    if(yo.mano.length>1)out.push({tipo:"horas",etiqueta:"Jugar tus otras dos cartas"});
    return out;
  }
  if(tr==="segunda"){
    E.jugadores.forEach((otro,j)=>{ if(j!==ji)
      out.push({tipo:"segunda",j,etiqueta:"Cambiar tu mano con la de "+otro.nombre}) });
    return out;
  }
  if(tr==="cuarentena"){
    E.jugadores.forEach((jug,j)=>jug.cuerpo.forEach((o,oi)=>{
      if(o.virus.length)out.push({tipo:"cuarentena",j,o:oi,etiqueta:"Retirar el virus de "+nom(j,oi)});
    }));
    return out;
  }
  return out; /* traje: solo se juega como respuesta */
}

/* Reparto automático del contagio: tantos virus como quepan. */
function repartoContagio(E,ji){
  const mov=[], ocupados=new Set();
  E.jugadores[ji].cuerpo.forEach((mio,mi)=>{
    if(!mio.virus.length)return;
    for(let j=0;j<E.jugadores.length;j++){
      if(j===ji)continue;
      const cu=E.jugadores[j].cuerpo;
      for(let oi=0;oi<cu.length;oi++){
        const clave=j+"."+oi;
        if(ocupados.has(clave))continue;
        if(estadoOrgano(cu[oi])!=="libre"||esBionico(cu[oi]))continue;
        if(!afectaColor(mio.virus[0].c,cu[oi]))continue;
        ocupados.add(clave); mov.push({de:mi,j,o:oi}); return;
      }
    }
  });
  return mov;
}

/* ── A quién ataca una jugada (para el traje de protección) ─── */
function atacados(E,ji,jugada){
  const t=jugada.tipo;
  if(["infectar","neutralizar","extirpar","ladron","cuarentena"].includes(t))
    return jugada.j!==ji&&t!=="cuarentena"?[jugada.j]:[];
  if(t==="trasplante")return [jugada.b.j];
  if(t==="error"||t==="segunda")return [jugada.j];
  if(t==="guante")return E.jugadores.map((_,i)=>i).filter(i=>i!==ji&&E.jugadores[i].mano.length);
  if(t==="contagio")return [...new Set(repartoContagio(E,ji).map(m=>m.j))];
  return [];
}
const multiObjetivo=t=>t==="guante"||t==="contagio";

/* ── Aplicar una jugada ─────────────────────────────────────── */
/* protegidos = índices de jugadores que usaron traje de protección */
function aplicar(E, ji, idx, jugada, protegidos){
  const prot=protegidos||[];
  const yo=E.jugadores[ji];
  const carta=yo.mano.splice(idx,1)[0];
  const reg=[];
  const org=(j,o)=>E.jugadores[j].cuerpo[o];
  const nom=(j,o)=>ORG[org(j,o).carta.c].label.toLowerCase()+" de "+E.jugadores[j].nombre;
  let fin=true;              /* ¿termina el turno tras esta carta? */

  switch(jugada.tipo){
    case "bajar":
      yo.cuerpo.push({carta,medicinas:[],virus:[]});
      reg.push(yo.nombre+" bajó su "+ORG[carta.c].label.toLowerCase());
      break;
    case "infectar":
      org(jugada.j,jugada.o).virus.push(carta);
      reg.push(yo.nombre+" infectó el "+nom(jugada.j,jugada.o));
      break;
    case "neutralizar":{
      const o=org(jugada.j,jugada.o);
      E.descarte.push(carta,...o.medicinas.splice(0));
      reg.push(yo.nombre+" destruyó la vacuna del "+nom(jugada.j,jugada.o));
      break;}
    case "extirpar":{
      const o=org(jugada.j,jugada.o);
      reg.push(yo.nombre+" extirpó el "+nom(jugada.j,jugada.o));
      E.descarte.push(carta,o.carta,...o.virus,...o.medicinas);
      E.jugadores[jugada.j].cuerpo.splice(jugada.o,1);
      break;}
    case "curar":{
      const o=org(ji,jugada.o);
      E.descarte.push(carta,...o.virus.splice(0));
      reg.push(yo.nombre+" curó su "+ORG[o.carta.c].label.toLowerCase());
      break;}
    case "vacunar":
      org(ji,jugada.o).medicinas.push(carta);
      reg.push(yo.nombre+" vacunó su "+ORG[org(ji,jugada.o).carta.c].label.toLowerCase());
      break;
    case "inmunizar":
    case "superinmunizar":
      org(ji,jugada.o).medicinas.push(carta);
      reg.push(yo.nombre+" inmunizó su "+ORG[org(ji,jugada.o).carta.c].label.toLowerCase());
      break;
    case "trasplante":{
      E.descarte.push(carta);
      const a=E.jugadores[jugada.a.j], b=E.jugadores[jugada.b.j];
      const x=a.cuerpo[jugada.a.o], y=b.cuerpo[jugada.b.o];
      a.cuerpo[jugada.a.o]=y; b.cuerpo[jugada.b.o]=x;
      reg.push(yo.nombre+" trasplantó un órgano con "+b.nombre);
      break;}
    case "ladron":{
      E.descarte.push(carta);
      const o=E.jugadores[jugada.j].cuerpo.splice(jugada.o,1)[0];
      yo.cuerpo.push(o);
      reg.push(yo.nombre+" le robó el "+ORG[o.carta.c].label.toLowerCase()+" a "+E.jugadores[jugada.j].nombre);
      break;}
    case "contagio":{
      E.descarte.push(carta);
      let n=0;
      repartoContagio(E,ji).forEach(m=>{
        if(prot.includes(m.j))return;
        const v=yo.cuerpo[m.de].virus.pop();
        if(v){org(m.j,m.o).virus.push(v);n++;}
      });
      reg.push(yo.nombre+" contagió "+n+" virus");
      break;}
    case "guante":{
      E.descarte.push(carta);
      E.jugadores.forEach((j,i)=>{
        if(i===ji||prot.includes(i))return;
        E.descarte.push(...j.mano.splice(0));
      });
      reg.push(yo.nombre+" jugó el guante de látex: los demás descartan su mano");
      break;}
    case "error":{
      E.descarte.push(carta);
      const otro=E.jugadores[jugada.j];
      const tmp=yo.cuerpo; yo.cuerpo=otro.cuerpo; otro.cuerpo=tmp;
      reg.push(yo.nombre+" intercambió su cuerpo completo con "+otro.nombre);
      break;}
    case "horas":{
      E.descarte.push(carta);
      E.extra=2; fin=false;
      reg.push(yo.nombre+" ganó horas extra: juega dos cartas más");
      break;}
    case "segunda":{
      E.descarte.push(carta);
      const otro=E.jugadores[jugada.j];
      const tmp=yo.mano; yo.mano=otro.mano; otro.mano=tmp;
      E.extra=1; E.sinDescartar=true; fin=false;
      reg.push(yo.nombre+" intercambió su mano con "+otro.nombre);
      break;}
    case "cuarentena":{
      E.descarte.push(carta);
      const o=org(jugada.j,jugada.o);
      E.retiradas.push(...o.virus.splice(0));
      reg.push(yo.nombre+" puso en cuarentena el virus del "+nom(jugada.j,jugada.o));
      break;}
  }
  return {registro:reg, fin};
}

/* ── Turno, robo y victoria ─────────────────────────────────── */
function robar(E,ji){
  const j=E.jugadores[ji];
  while(j.mano.length<3){
    if(!E.mazo.length){
      if(!E.descarte.length)break;
      E.mazo=barajar(E.descarte.splice(0));
    }
    j.mano.push(E.mazo.pop());
  }
}
function ganador(E){
  const i=E.jugadores.findIndex(j=>sanos(j)>=E.objetivo);
  return i<0?null:i;
}
function avanzarTurno(E){
  robar(E,E.turno);
  E.extra=0; E.sinDescartar=false;
  let vueltas=0;
  do{
    E.turno=(E.turno+1)%E.jugadores.length;
    vueltas++;
    /* quien se quedó sin cartas (guante de látex) gasta su turno robando */
    if(E.jugadores[E.turno].mano.length===0&&vueltas<=E.jugadores.length){
      robar(E,E.turno);
      E.registro.push(E.jugadores[E.turno].nombre+" perdió el turno robando mano nueva");
      continue;
    }
    break;
  }while(vueltas<=E.jugadores.length);
}

/* ── Sugerencias (modo aprendizaje) ─────────────────────────── */
function puntuar(E,ji,carta,jug){
  const yo=E.jugadores[ji], mis=sanos(yo);
  const rivales=E.jugadores.filter((_,i)=>i!==ji);
  const lider=rivales.reduce((a,r)=>Math.max(a,sanos(r)),0);
  const urg=lider>=E.objetivo-1?22:(lider>=E.objetivo-2?8:0);
  const propio=jug.j===ji;
  const cerca=jug.j!==undefined&&!propio&&E.jugadores[jug.j]&&sanos(E.jugadores[jug.j])>=E.objetivo-1;
  switch(jug.tipo){
    case "bajar":          return mis+1>=E.objetivo?100:58+Math.min(20,mis*6);
    case "curar":          return mis+1>=E.objetivo?100:64+urg/2;
    case "superinmunizar": return 80+urg/2;
    case "inmunizar":      return 72+urg/2;
    case "vacunar":        return 52;
    case "infectar":       return propio?6:65+(cerca?urg+12:0);
    case "extirpar":       return propio?3:59+(cerca?urg:0);
    case "neutralizar":    return propio?3:47+(cerca?urg:0);
    case "ladron":         return (esSano(E.jugadores[jug.j].cuerpo[jug.o])
                                    ?(mis+1>=E.objetivo?100:76):50)+(cerca?urg:0);
    case "trasplante":     return 50+(cerca?urg:0);
    case "contagio":       return 58+repartoContagio(E,ji).length*12+urg;
    case "guante":         return 36+(urg?24:0);
    case "error":          return sanos(E.jugadores[jug.j])>mis
                                  ?60+(sanos(E.jugadores[jug.j])-mis)*14:20;
    case "horas":          return 66;
    case "segunda":        return 30;
    case "cuarentena":     return propio?(yo.cuerpo[jug.o]&&yo.cuerpo[jug.o].virus[0]&&
                                  yo.cuerpo[jug.o].virus[0].t==="evo"?84:62):15;
    default:               return 20;
  }
}
function sugerencias(E,ji){
  const yo=E.jugadores[ji], todas=[];
  yo.mano.forEach((c,idx)=>jugadasLegales(E,ji,idx).forEach(j=>
    todas.push({idx,carta:c,jugada:j,score:Math.round(puntuar(E,ji,c,j)),etiqueta:j.etiqueta})));
  todas.sort((a,b)=>b.score-a.score);
  return todas.slice(0,3);
}

const API={COLORES,ORG,TRAT,crearMazo,barajar,nombreCarta,colorCarta,etColor,
  estadoOrgano,esBionico,esSano,sanos,afectaColor,tieneColor,descEstado,
  jugadasLegales,repartoContagio,atacados,multiObjetivo,aplicar,robar,ganador,
  avanzarTurno,puntuar,sugerencias};
if(typeof module!=="undefined"&&module.exports)module.exports=API; else raiz.REGLAS=API;
})(typeof self!=="undefined"?self:globalThis);
