/* ═══════════════════════════════════════════════════════════════
   VIRUS! en línea — motor de reglas
   Juego base + VIRUS! 2 Evolution + VIRUS! Halloween.
   Lo carga el servidor (require) y el navegador (<script>).
   El servidor es la autoridad: el cliente usa esto solo para pintar.
   ═══════════════════════════════════════════════════════════════ */
(function (raiz) {
"use strict";

const COLORES = ["rojo", "verde", "azul", "hueso"];
const ORG = {
  rojo:{label:"Corazón",hex:"#C93A3A"}, verde:{label:"Estómago",hex:"#3D8F4E"},
  azul:{label:"Cerebro",hex:"#2C63C4"}, hueso:{label:"Hueso",hex:"#C79320"},
  multi:{label:"Multicolor",hex:"#7B4FB5"}, bionico:{label:"Biónico",hex:"#6E7A88"},
  mutante:{label:"Mutante",hex:"#E07A1F"}
};
const TRAT = {
  trasplante:"Trasplante", ladron:"Ladrón de órganos", contagio:"Contagio",
  guante:"Guante de látex", error:"Error médico", horas:"Horas extra",
  segunda:"Segunda opinión", traje:"Traje de protección", cuarentena:"Cuarentena",
  /* Halloween */
  ladron_rojo:"Ladrón de corazones", ladron_verde:"Ladrón de estómagos",
  ladron_azul:"Ladrón de cerebros", ladron_hueso:"Ladrón de huesos",
  alien:"Trasplante alienígena", aparicion:"Aparición",
  experimento:"Experimento fallido", truco:"Truco o trato", cambio:"Cambio de cuerpos"
};
const HALLOWEEN = new Set(["ladron_rojo","ladron_verde","ladron_azul","ladron_hueso",
  "alien","aparicion","experimento","truco","cambio"]);

/* ── Mazo ───────────────────────────────────────────────────── */
function crearMazo(expansion, halloween){
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
  if(halloween){                                  /* 12 cartas */
    add({k:"organo",c:"mutante"},1);
    COLORES.forEach(c=>add({k:"tratamiento",tr:"ladron_"+c},1));
    add({k:"tratamiento",tr:"alien"},1);
    add({k:"tratamiento",tr:"aparicion"},2);
    add({k:"tratamiento",tr:"experimento"},2);
    add({k:"tratamiento",tr:"truco"},1);
    add({k:"tratamiento",tr:"cambio"},1);
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
const colorCarta=x=>!x?"#9aa3ab":(x.k==="tratamiento"?(HALLOWEEN.has(x.tr)?"#7A4B9E":"#4A6D67"):ORG[x.c].hex);
const esHalloween=x=>!!x && x.k==="tratamiento" && HALLOWEEN.has(x.tr);

/* ── Estado de un órgano ────────────────────────────────────── */
/* organo = {carta, medicinas:[], virus:[]} */
function estadoOrgano(o){
  if(o.virus.length)return "infectado";
  if(o.medicinas.length>=2)return "inmunizado";
  if(o.medicinas.length===1)return o.medicinas[0].t==="exp"?"inmunizado":"vacunado";
  return "libre";
}
const esBionico=o=>o.carta.c==="bionico";
const esMutante=o=>o.carta.c==="mutante";
const esSano=o=>esBionico(o)||estadoOrgano(o)!=="infectado";
const sanos=j=>j.cuerpo.filter(esSano).length;
/* El mutante es naranja: solo lo tocan las cartas multicolor y los tratamientos. */
function afectaColor(c,o){
  if(esBionico(o))return false;
  if(esMutante(o))return c==="multi";
  return c==="multi"||o.carta.c==="multi"||o.carta.c===c;
}
const tieneColor=(j,c)=>j.cuerpo.some(o=>o.carta.c===c);
/* Quien se retira sigue ocupando su silla para no descuadrar los índices,
   pero deja de ser objetivo válido y de recibir turnos. */
const activo=j=>!j.fuera;
function descEstado(o){
  if(esBionico(o))return "biónico";
  const e=estadoOrgano(o);
  if(e==="infectado")return "infectado ("+(o.virus[0].t==="evo"?"evolucionado":"básico")+")";
  return e;
}

/* ── Jugadas legales ────────────────────────────────────────── */
function jugadasLegales(E, ji, idx){
  const yo=E.jugadores[ji], carta=yo.mano[idx], out=[];
  if(!carta)return out;
  const nom=(j,o)=>(j===ji?"tu ":"el ")+ORG[E.jugadores[j].cuerpo[o].carta.c].label.toLowerCase()+
                   (j===ji?"":" de "+E.jugadores[j].nombre);

  if(carta.k==="organo"){
    if(carta.c==="mutante"){          /* obligatorio reemplazar un órgano propio */
      if(tieneColor(yo,"mutante"))return out;
      yo.cuerpo.forEach((o,oi)=>out.push({tipo:"mutar",o:oi,
        etiqueta:"Reemplazar "+nom(ji,oi)+" por el órgano mutante"}));
      return out;
    }
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
    /* Normalmente curas tu propio cuerpo. Con Truco o trato encima, curar a otro
       es justo la forma de pasarle la maldición, así que ahí sí se habilita. */
    const cuerpos = yo.truco ? E.jugadores.map((_,j)=>j) : [ji];
    cuerpos.forEach(j=>{
      E.jugadores[j].cuerpo.forEach((o,oi)=>{
        if(!afectaColor(carta.c,o))return;
        const e=estadoOrgano(o);
        if(e==="inmunizado")return;
        const extra=(j!==ji&&yo.truco)?" y pasarle el truco o trato":"";
        if(e==="infectado"){
          if(o.virus[0].t==="evo"&&carta.t!=="exp")return;
          out.push({tipo:"curar",j,o:oi,etiqueta:"Curar "+nom(j,oi)+extra});
        } else if(e==="vacunado")out.push({tipo:"inmunizar",j,o:oi,etiqueta:"Inmunizar "+nom(j,oi)+extra});
        else out.push(carta.t==="exp"
          ?{tipo:"superinmunizar",j,o:oi,etiqueta:"Superinmunizar "+nom(j,oi)+extra}
          :{tipo:"vacunar",j,o:oi,etiqueta:"Vacunar "+nom(j,oi)+extra});
      });
    });
    return out;
  }

  const tr=carta.tr;
  if(tr==="trasplante"||tr==="alien"){
    const alien = tr==="alien";                 /* el alienígena ignora los inmunizados */
    const origen = alien ? E.jugadores.map((_,j)=>j) : [ji];
    origen.forEach(ja=>{
      E.jugadores[ja].cuerpo.forEach((a,ai)=>{
        if(!alien&&estadoOrgano(a)==="inmunizado")return;
        E.jugadores.forEach((otro,jb)=>{
          if(jb<=ja)return;
          otro.cuerpo.forEach((b,bi)=>{
            if(!alien&&estadoOrgano(b)==="inmunizado")return;
            if(E.jugadores[ja].cuerpo.some((x,k)=>k!==ai&&x.carta.c===b.carta.c))return;
            if(otro.cuerpo.some((x,k)=>k!==bi&&x.carta.c===a.carta.c))return;
            out.push({tipo:alien?"alien":"trasplante", a:{j:ja,o:ai}, b:{j:jb,o:bi},
              etiqueta:"Cambiar "+nom(ja,ai)+" por "+nom(jb,bi)});
          });
        });
      });
    });
    return out.slice(0,120);
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
  if(tr.startsWith("ladron_")){          /* ladrones de colores: roban hasta inmunizados */
    const col=tr.split("_")[1];
    E.jugadores.forEach((otro,j)=>{
      if(j===ji)return;
      otro.cuerpo.forEach((o,oi)=>{
        if(o.carta.c!==col&&o.carta.c!=="multi")return;
        if(tieneColor(yo,o.carta.c))return;
        out.push({tipo:"ladron_color",j,o:oi,etiqueta:"Robar "+nom(j,oi)});
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
    E.jugadores.forEach((otro,j)=>{ if(j!==ji&&activo(otro))
      out.push({tipo:"error",j,etiqueta:"Cambiar tu cuerpo con el de "+otro.nombre}) });
    return out;
  }
  if(tr==="horas"){
    if(yo.mano.length>1)out.push({tipo:"horas",etiqueta:"Jugar tus otras dos cartas"});
    return out;
  }
  if(tr==="segunda"){
    E.jugadores.forEach((otro,j)=>{ if(j!==ji&&activo(otro))
      out.push({tipo:"segunda",j,etiqueta:"Cambiar tu mano con la de "+otro.nombre}) });
    return out;
  }
  if(tr==="cuarentena"){
    E.jugadores.forEach((jug,j)=>jug.cuerpo.forEach((o,oi)=>{
      if(o.virus.length)out.push({tipo:"cuarentena",j,o:oi,etiqueta:"Retirar el virus de "+nom(j,oi)});
    }));
    return out;
  }
  if(tr==="aparicion"){
    if(E.descarte.length)out.push({tipo:"aparicion",
      etiqueta:"Cambiarla por "+nombreCarta(E.descarte[E.descarte.length-1])+" del descarte"});
    return out;
  }
  if(tr==="experimento"){
    E.jugadores.forEach((jug,j)=>jug.cuerpo.forEach((o,oi)=>{
      if(esBionico(o))return;
      const e=estadoOrgano(o);
      if(e==="infectado"){
        out.push({tipo:"exp_curar",j,o:oi,etiqueta:"Curar "+nom(j,oi)+" (actúa como medicina)"});
        out.push({tipo:"exp_extirpar",j,o:oi,etiqueta:"Extirpar "+nom(j,oi)+" (actúa como virus)"});
      } else if(e==="vacunado"){
        out.push({tipo:"exp_quitar",j,o:oi,etiqueta:"Destruir la vacuna de "+nom(j,oi)+" (actúa como virus)"});
        out.push({tipo:"exp_inmunizar",j,o:oi,etiqueta:"Inmunizar "+nom(j,oi)+" (actúa como medicina)"});
      }
    }));
    return out;
  }
  if(tr==="truco"){
    E.jugadores.forEach((otro,j)=>{ if(j!==ji&&activo(otro)&&!otro.truco)
      out.push({tipo:"truco",j,etiqueta:"Maldecir a "+otro.nombre+": no podrá ganar"}) });
    return out;
  }
  if(tr==="cambio"){
    if(E.jugadores.filter(activo).length>1){
      out.push({tipo:"cambio",sentido:1,etiqueta:"Todos pasan su cuerpo hacia la derecha"});
      if(E.jugadores.filter(activo).length>2)out.push({tipo:"cambio",sentido:-1,etiqueta:"Todos pasan su cuerpo hacia la izquierda"});
    }
    return out;
  }
  return out; /* traje: solo se juega como respuesta */
}

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
  if(["infectar","neutralizar","extirpar","ladron","ladron_color","exp_curar",
      "exp_extirpar","exp_quitar","exp_inmunizar","curar","vacunar","inmunizar",
      "superinmunizar","cuarentena"].includes(t)){
    const daña = ["infectar","neutralizar","extirpar","ladron","ladron_color",
                  "exp_extirpar","exp_quitar"].includes(t);
    return (daña && jugada.j !== ji) ? [jugada.j] : [];
  }
  if(t==="trasplante"||t==="alien")return [jugada.a.j,jugada.b.j].filter(j=>j!==ji);
  if(t==="error"||t==="segunda"||t==="truco")return [jugada.j];
  if(t==="guante")return E.jugadores.map((_,i)=>i).filter(i=>i!==ji&&E.jugadores[i].mano.length);
  if(t==="cambio")return E.jugadores.map((_,i)=>i).filter(i=>i!==ji&&activo(E.jugadores[i]));
  if(t==="contagio")return [...new Set(repartoContagio(E,ji).map(m=>m.j))];
  return [];
}
const multiObjetivo=t=>t==="guante"||t==="contagio"||t==="cambio";

/* ── Aplicar una jugada ─────────────────────────────────────── */
function aplicar(E, ji, idx, jugada, protegidos){
  const prot=protegidos||[];
  const yo=E.jugadores[ji];
  const carta=yo.mano.splice(idx,1)[0];
  const reg=[]; let fin=true, sonido=jugada.tipo;
  const org=(j,o)=>E.jugadores[j].cuerpo[o];
  const nom=(j,o)=>ORG[org(j,o).carta.c].label.toLowerCase()+" de "+E.jugadores[j].nombre;
  /* curar a otro con truco o trato encima traslada la maldición */
  const pasarTruco=(destino)=>{
    if(destino===ji||!yo.truco)return;
    E.jugadores[destino].truco=yo.truco; yo.truco=null;
    reg.push("El truco o trato pasó a "+E.jugadores[destino].nombre);
  };

  switch(jugada.tipo){
    case "bajar":
      yo.cuerpo.push({carta,medicinas:[],virus:[]});
      reg.push(yo.nombre+" bajó su "+ORG[carta.c].label.toLowerCase());
      break;
    case "mutar":{
      const viejo=yo.cuerpo[jugada.o];
      E.descarte.push(viejo.carta,...viejo.virus,...viejo.medicinas);
      yo.cuerpo[jugada.o]={carta,medicinas:[],virus:[]};
      reg.push(yo.nombre+" sacrificó su "+ORG[viejo.carta.c].label.toLowerCase()+" por el órgano mutante");
      break;}
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
      const o=org(jugada.j,jugada.o);
      E.descarte.push(carta,...o.virus.splice(0));
      reg.push(yo.nombre+" curó el "+nom(jugada.j,jugada.o));
      pasarTruco(jugada.j);
      break;}
    case "vacunar":
      org(jugada.j,jugada.o).medicinas.push(carta);
      reg.push(yo.nombre+" vacunó el "+nom(jugada.j,jugada.o));
      pasarTruco(jugada.j);
      break;
    case "inmunizar":
    case "superinmunizar":
      org(jugada.j,jugada.o).medicinas.push(carta);
      reg.push(yo.nombre+" inmunizó el "+nom(jugada.j,jugada.o));
      pasarTruco(jugada.j);
      sonido="inmunizar";
      break;
    case "exp_curar":{
      const o=org(jugada.j,jugada.o);
      E.descarte.push(carta,...o.virus.splice(0));
      reg.push("El experimento fallido curó el "+nom(jugada.j,jugada.o));
      sonido="curar"; break;}
    case "exp_extirpar":{
      const o=org(jugada.j,jugada.o);
      reg.push("El experimento fallido extirpó el "+nom(jugada.j,jugada.o));
      E.descarte.push(carta,o.carta,...o.virus,...o.medicinas);
      E.jugadores[jugada.j].cuerpo.splice(jugada.o,1);
      sonido="extirpar"; break;}
    case "exp_quitar":{
      const o=org(jugada.j,jugada.o);
      E.descarte.push(carta,...o.medicinas.splice(0));
      reg.push("El experimento fallido destruyó la vacuna del "+nom(jugada.j,jugada.o));
      sonido="neutralizar"; break;}
    case "exp_inmunizar":
      org(jugada.j,jugada.o).medicinas.push(carta);
      reg.push("El experimento fallido inmunizó el "+nom(jugada.j,jugada.o));
      sonido="inmunizar"; break;
    case "trasplante":
    case "alien":{
      E.descarte.push(carta);
      const a=E.jugadores[jugada.a.j], b=E.jugadores[jugada.b.j];
      const x=a.cuerpo[jugada.a.o], y=b.cuerpo[jugada.b.o];
      a.cuerpo[jugada.a.o]=y; b.cuerpo[jugada.b.o]=x;
      reg.push(yo.nombre+(jugada.tipo==="alien"?" hizo un trasplante alienígena entre ":" trasplantó un órgano entre ")+
        a.nombre+" y "+b.nombre);
      sonido="trasplante"; break;}
    case "ladron":
    case "ladron_color":{
      E.descarte.push(carta);
      const o=E.jugadores[jugada.j].cuerpo.splice(jugada.o,1)[0];
      yo.cuerpo.push(o);
      reg.push(yo.nombre+" le robó el "+ORG[o.carta.c].label.toLowerCase()+" a "+E.jugadores[jugada.j].nombre);
      sonido="ladron"; break;}
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
    case "cambio":{
      E.descarte.push(carta);
      const parte=E.jugadores.map((_,i)=>i).filter(i=>!prot.includes(i)&&activo(E.jugadores[i]));
      if(parte.length>1){
        const cuerpos=parte.map(i=>E.jugadores[i].cuerpo);
        parte.forEach((i,k)=>{
          const desde=(k-jugada.sentido+parte.length*2)%parte.length;
          E.jugadores[i].cuerpo=cuerpos[desde];
        });
      }
      reg.push(yo.nombre+" giró la mesa: todos pasaron su cuerpo al de al lado");
      break;}
    case "horas":{
      E.descarte.push(carta); E.extra=2; fin=false;
      reg.push(yo.nombre+" ganó horas extra: juega dos cartas más");
      break;}
    case "segunda":{
      E.descarte.push(carta);
      const otro=E.jugadores[jugada.j];
      const tmp=yo.mano; yo.mano=otro.mano; otro.mano=tmp;
      E.extra=1; E.sinDescartar=true; fin=false;
      reg.push(yo.nombre+" intercambió su mano con "+otro.nombre);
      break;}
    case "aparicion":{
      const rescatada=E.descarte.pop();
      E.descarte.push(carta);
      yo.mano.push(rescatada);
      E.extra=1; E.opcional=true; fin=false;
      reg.push(yo.nombre+" rescató "+nombreCarta(rescatada)+" del descarte");
      break;}
    case "truco":{
      E.jugadores[jugada.j].truco=carta;
      reg.push("🎃 "+E.jugadores[jugada.j].nombre+" recibió truco o trato: no puede ganar mientras lo tenga");
      break;}
    case "cuarentena":{
      E.descarte.push(carta);
      const o=org(jugada.j,jugada.o);
      E.retiradas.push(...o.virus.splice(0));
      reg.push(yo.nombre+" puso en cuarentena el virus del "+nom(jugada.j,jugada.o));
      break;}
  }
  return {registro:reg, fin, sonido};
}

/* ── Turno, robo y victoria ─────────────────────────────────── */
function robar(E,ji){
  const j=E.jugadores[ji];
  if(j.fuera)return;
  while(j.mano.length<3){
    if(!E.mazo.length){
      if(!E.descarte.length)break;
      E.mazo=barajar(E.descarte.splice(0));
    }
    j.mano.push(E.mazo.pop());
  }
}
function ganador(E){
  const i=E.jugadores.findIndex(j=>activo(j)&&!j.truco&&sanos(j)>=E.objetivo);
  return i<0?null:i;
}
function avanzarTurno(E){
  robar(E,E.turno);
  E.extra=0; E.sinDescartar=false; E.opcional=false;
  let vueltas=0;
  do{
    E.turno=(E.turno+1)%E.jugadores.length;
    vueltas++;
    if(!activo(E.jugadores[E.turno])&&vueltas<=E.jugadores.length*2)continue;
    if(E.jugadores[E.turno].mano.length===0&&vueltas<=E.jugadores.length){
      robar(E,E.turno);
      E.registro.push(E.jugadores[E.turno].nombre+" perdió el turno robando mano nueva");
      continue;
    }
    break;
  }while(vueltas<=E.jugadores.length*2);
}

/* ── Sugerencias (modo aprendizaje) ─────────────────────────── */
function puntuar(E,ji,carta,jug){
  const yo=E.jugadores[ji], mis=sanos(yo);
  const rivales=E.jugadores.filter((_,i)=>i!==ji);
  const lider=rivales.reduce((a,r)=>Math.max(a,r.truco?0:sanos(r)),0);
  const urg=lider>=E.objetivo-1?22:(lider>=E.objetivo-2?8:0);
  const propio=jug.j===ji;
  const rival=jug.j!==undefined&&!propio&&E.jugadores[jug.j];
  const cerca=rival&&sanos(rival)>=E.objetivo-1;
  const gano=n=>!yo.truco&&mis+n>=E.objetivo;
  switch(jug.tipo){
    case "bajar":          return gano(1)?100:58+Math.min(20,mis*6);
    case "mutar":          return 40;
    case "curar":          return propio?(gano(1)?100:64+urg/2):(yo.truco?70:10);
    case "exp_curar":      return propio?(gano(1)?100:66):12;
    case "superinmunizar": return propio?80+urg/2:(yo.truco?68:8);
    case "inmunizar":
    case "exp_inmunizar":  return propio?72+urg/2:(yo.truco?66:8);
    case "vacunar":        return propio?52:(yo.truco?64:8);
    case "infectar":       return propio?6:65+(cerca?urg+12:0);
    case "extirpar":
    case "exp_extirpar":   return propio?3:59+(cerca?urg:0);
    case "neutralizar":
    case "exp_quitar":     return propio?3:47+(cerca?urg:0);
    case "ladron":
    case "ladron_color":   return (esSano(E.jugadores[jug.j].cuerpo[jug.o])
                                    ?(gano(1)?100:76):50)+(cerca?urg:0);
    case "trasplante":     return 50+(cerca?urg:0);
    case "alien":          return 54+(cerca?urg:0);
    case "contagio":       return 58+repartoContagio(E,ji).length*12+urg;
    case "guante":         return 36+(urg?24:0);
    case "error":          return sanos(E.jugadores[jug.j])>mis
                                  ?60+(sanos(E.jugadores[jug.j])-mis)*14:20;
    case "cambio":         return mis<=1?55:25;
    case "truco":          return cerca?92:44;
    case "aparicion":      return 45;
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

const API={COLORES,ORG,TRAT,HALLOWEEN,activo,crearMazo,barajar,nombreCarta,colorCarta,etColor,esHalloween,
  estadoOrgano,esBionico,esMutante,esSano,sanos,afectaColor,tieneColor,descEstado,
  jugadasLegales,repartoContagio,atacados,multiObjetivo,aplicar,robar,ganador,
  avanzarTurno,puntuar,sugerencias};
if(typeof module!=="undefined"&&module.exports)module.exports=API; else raiz.REGLAS=API;
})(typeof self!=="undefined"?self:globalThis);
