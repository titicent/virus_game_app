/* ═══════════════════════════════════════════════════════════════
   VIRUS! en línea — arte
   Ilustraciones propias dibujadas en SVG: nada de archivos externos
   y nada de arte ajeno. Todo escala sin pixelarse y viaja en 12 KB.
   ═══════════════════════════════════════════════════════════════ */
(function (raiz) {
"use strict";

const svg = (cuerpo, extra) =>
  `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" ${extra||""}>${cuerpo}</svg>`;

/* ── Órganos ────────────────────────────────────────────────── */
const corazon = c => `
  <path d="M24 41C10 31 5 22 9.5 15.5c3.6-5.2 11-4.3 14.5 1.4 3.5-5.7 10.9-6.6 14.5-1.4C43 22 38 31 24 41Z" fill="${c}"/>
  <path d="M17 19c-2.6.3-4.2 2.2-4.4 4.9" stroke="rgba(255,255,255,.55)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
const estomago = c => `
  <path d="M20 6c-1.6 4.4-.6 7.4 2.2 8.8" fill="none" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M25 13c-7.6 0-13.5 6-13.5 13.8C11.5 35 17.6 41 25.6 41c7 0 12.4-5 12.4-11.6 0-4.6-2.2-8.4-6-10.4" fill="${c}"/>
  <path d="M33 20.4 38.6 15" fill="none" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M18 24c3.4-2.4 7.6-2.4 11 0" stroke="rgba(255,255,255,.5)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
const cerebro = c => `
  <path d="M24 9c-4.6 0-7 2.4-7.6 5.2C12 15 9.5 18 9.5 22c0 3 1.4 5.2 3.4 6.4-.4 3.4 2 6.6 5.6 7.2.9 2.4 3 3.6 5.5 3.6h.9V9Z" fill="${c}"/>
  <path d="M24 9c4.6 0 7 2.4 7.6 5.2C36 15 38.5 18 38.5 22c0 3-1.4 5.2-3.4 6.4.4 3.4-2 6.6-5.6 7.2-.9 2.4-3 3.6-5.5 3.6H24Z" fill="${c}" opacity=".82"/>
  <path d="M24 12v26M18 17c2 1 2.6 3 1.6 5M30 17c-2 1-2.6 3-1.6 5" stroke="rgba(255,255,255,.6)" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
const hueso = c => `
  <path d="M14.5 33.5 33.5 14.5" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
  <circle cx="12" cy="32" r="5.6" fill="${c}"/><circle cx="16" cy="36" r="5.6" fill="${c}"/>
  <circle cx="36" cy="16" r="5.6" fill="${c}"/><circle cx="32" cy="12" r="5.6" fill="${c}"/>`;
const multicolor = () => `
  <path d="M24 24 24 6a18 18 0 0 1 18 18Z" fill="#C93A3A"/>
  <path d="M24 24h18a18 18 0 0 1-18 18Z" fill="#3D8F4E"/>
  <path d="M24 24v18A18 18 0 0 1 6 24Z" fill="#2C63C4"/>
  <path d="M24 24H6A18 18 0 0 1 24 6Z" fill="#C79320"/>
  <circle cx="24" cy="24" r="5" fill="#FBFAF7"/>`;
const bionico = c => `
  <path d="M24 6 40 15v18L24 42 8 33V15Z" fill="${c}"/>
  <path d="M24 16v6m0 4v6m-7-8h5m9 0h5" stroke="#FBFAF7" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="24" cy="24" r="3.4" fill="#FBFAF7"/>`;

/* ── Virus ──────────────────────────────────────────────────── */
function pinchos(cx, cy, r, n, color, largo, giro) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + (giro || 0);
    const x1 = cx + Math.cos(a) * (r - 1), y1 = cy + Math.sin(a) * (r - 1);
    const x2 = cx + Math.cos(a) * (r + largo), y2 = cy + Math.sin(a) * (r + largo);
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="2.4" fill="${color}"/>`;
  }
  return s;
}
const virusBasico = c => `
  ${pinchos(24,24,11,8,c,5,0.2)}<circle cx="24" cy="24" r="11" fill="${c}"/>
  <circle cx="20" cy="21" r="2.6" fill="rgba(255,255,255,.85)"/>
  <circle cx="28" cy="26" r="1.8" fill="rgba(255,255,255,.55)"/>`;
const virusEvo = c => `
  ${pinchos(24,24,12,10,c,5.5,0)}<circle cx="24" cy="24" r="12" fill="${c}"/>
  <circle cx="24" cy="24" r="12" fill="none" stroke="#16211F" stroke-width="1.6" opacity=".45"/>
  <path d="M18 20c2.5-2 5.5-2 8 0M17 28c3 2.6 8 2.6 11 0" stroke="rgba(255,255,255,.8)" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <circle cx="20" cy="24" r="1.8" fill="#16211F" opacity=".5"/><circle cx="29" cy="22" r="1.4" fill="#16211F" opacity=".5"/>`;

/* ── Medicinas ──────────────────────────────────────────────── */
const medicinaBasica = c => `
  <rect x="9" y="27.5" width="18" height="9" rx="4.5" transform="rotate(-45 18 32)" fill="${c}"/>
  <rect x="21" y="11.5" width="18" height="9" rx="4.5" transform="rotate(-45 30 16)" fill="${c}" opacity=".55"/>
  <path d="M14 34 34 14" stroke="#FBFAF7" stroke-width="1.6"/>`;
const medicinaExp = c => `
  <path d="M20 8h8v11l7.5 14c1.4 2.6-.4 5.8-3.4 5.8H15.9c-3 0-4.8-3.2-3.4-5.8L20 19Z" fill="none" stroke="${c}" stroke-width="3.4" stroke-linejoin="round"/>
  <path d="M15.4 27h17.2l3 5.6c1 1.9-.3 4.2-2.5 4.2H14.9c-2.2 0-3.5-2.3-2.5-4.2Z" fill="${c}"/>
  <circle cx="21" cy="32" r="2" fill="rgba(255,255,255,.85)"/><circle cx="27" cy="34" r="1.4" fill="rgba(255,255,255,.7)"/>
  <path d="M18 8h12" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>`;

/* ── Tratamientos ───────────────────────────────────────────── */
const T = "#2E5C56";
const trasplante = () => `
  <rect x="6" y="7" width="15" height="15" rx="4" fill="${T}"/>
  <rect x="27" y="26" width="15" height="15" rx="4" fill="${T}" opacity=".6"/>
  <path d="M25 12h10a4 4 0 0 1 4 4v4" stroke="${T}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M36 17l3 4 3-4" stroke="${T}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M23 36H13a4 4 0 0 1-4-4v-4" stroke="${T}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M12 31l-3-4-3 4" stroke="${T}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const ladron = () => `
  <path d="M28 6.5c-4.6 0-7.6 3.4-7.6 7.2 0 4.6 4 7.4 7.6 10.6 3.6-3.2 7.6-6 7.6-10.6 0-3.8-3-7.2-7.6-7.2Z" fill="${T}" opacity=".5"/>
  <path d="M18 24.5 12 30" stroke="${T}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-dasharray="3 3"/>
  <rect x="6" y="33" width="19" height="9" rx="3" fill="${T}"/>
  <rect x="7.5" y="24" width="4.2" height="11" rx="2.1" fill="${T}"/>
  <rect x="12.6" y="21.5" width="4.2" height="13.5" rx="2.1" fill="${T}"/>
  <rect x="17.7" y="24" width="4.2" height="11" rx="2.1" fill="${T}"/>
  <rect x="22.3" y="27" width="4.2" height="8" rx="2.1" fill="${T}"/>`;
const contagio = () => `
  <circle cx="24" cy="24" r="7" fill="${T}"/>
  <path d="M24 14V7M34 24h7M24 34v7M14 24H7" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
  <path d="M21 10l3-3 3 3M38 21l3 3-3 3M27 38l-3 3-3-3M10 27l-3-3 3-3" stroke="${T}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const guante = () => `
  <rect x="13" y="29" width="22" height="13" rx="3.5" fill="${T}"/>
  <rect x="15.5" y="16" width="4.6" height="15" rx="2.3" fill="${T}"/>
  <rect x="21.2" y="12" width="4.6" height="19" rx="2.3" fill="${T}"/>
  <rect x="26.9" y="14" width="4.6" height="17" rx="2.3" fill="${T}"/>
  <rect x="32" y="19" width="4.6" height="12" rx="2.3" fill="${T}"/>
  <rect x="7" y="21" width="4.6" height="11" rx="2.3" fill="${T}" transform="rotate(-24 9.3 26.5)"/>
  <path d="M15 36h18" stroke="#FBFAF7" stroke-width="2" opacity=".5" stroke-linecap="round"/>`;
const errorMedico = () => `
  <circle cx="13" cy="12" r="5" fill="${T}"/>
  <path d="M5 30c0-4.6 3.6-8 8-8s8 3.4 8 8v3H5Z" fill="${T}"/>
  <circle cx="35" cy="12" r="5" fill="${T}" opacity=".55"/>
  <path d="M27 30c0-4.6 3.6-8 8-8s8 3.4 8 8v3H27Z" fill="${T}" opacity=".55"/>
  <path d="M13 39c4 4 18 4 22 0" stroke="${T}" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M31 36l4 3-4 3M17 36l-4 3 4 3" stroke="${T}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const horas = () => `
  <circle cx="22" cy="24" r="14" fill="none" stroke="${T}" stroke-width="3.4"/>
  <path d="M22 15v9l6 4" stroke="${T}" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M38 30v10M33 35h10" stroke="${T}" stroke-width="3.4" stroke-linecap="round"/>`;
const segunda = () => `
  <rect x="6" y="12" width="16" height="22" rx="3.4" fill="${T}" transform="rotate(-8 14 23)"/>
  <rect x="26" y="12" width="16" height="22" rx="3.4" fill="${T}" opacity=".55" transform="rotate(8 34 23)"/>
  <path d="M19 40h10" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
  <path d="M22 8h4" stroke="${T}" stroke-width="3" stroke-linecap="round"/>`;
const traje = () => `
  <path d="M24 4c-4.8 0-8 3.2-8 7.4v2.2c-4 1.8-6.6 5.8-6.6 10.4V42h29.2V24c0-4.6-2.6-8.6-6.6-10.4v-2.2C32 7.2 28.8 4 24 4Z" fill="${T}"/>
  <rect x="17" y="9" width="14" height="7.5" rx="3" fill="#FBFAF7" opacity=".92"/>
  <path d="M9.4 26 4 31v8M38.6 26 44 31v8" stroke="${T}" stroke-width="4.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24 22v20M17 30h14" stroke="#FBFAF7" stroke-width="2.2" opacity=".45" stroke-linecap="round"/>`;
const cuarentena = () => `
  <rect x="7" y="14" width="34" height="27" rx="4" fill="none" stroke="${T}" stroke-width="3.2" stroke-dasharray="5 3.5"/>
  <circle cx="24" cy="28" r="6.5" fill="${T}"/>
  ${pinchos(24,28,6.5,6,T,3.4,0.3)}
  <path d="M18 14V9.5A5.5 5.5 0 0 1 23.5 4h1A5.5 5.5 0 0 1 30 9.5V14" fill="none" stroke="${T}" stroke-width="3.2" stroke-linecap="round"/>`;

const ICONOS = {
  o_rojo:corazon, o_verde:estomago, o_azul:cerebro, o_hueso:hueso,
  o_multi:multicolor, o_bionico:bionico,
  v_basico:virusBasico, v_evo:virusEvo,
  m_basica:medicinaBasica, m_exp:medicinaExp,
  t_trasplante:trasplante, t_ladron:ladron, t_contagio:contagio, t_guante:guante,
  t_error:errorMedico, t_horas:horas, t_segunda:segunda, t_traje:traje, t_cuarentena:cuarentena
};

/* Dibujo de una carta o de un órgano en mesa */
function claveCarta(c){
  if(!c)return null;
  if(c.k==="organo")return "o_"+c.c;
  if(c.k==="virus")return "v_"+c.t;
  if(c.k==="medicina")return "m_"+c.t;
  return "t_"+c.tr;
}
function dibujo(carta, color){
  const k = claveCarta(carta);
  if(!k||!ICONOS[k])return "";
  return svg(ICONOS[k](color||"#2E5C56"));
}
function dibujoOrgano(colorClave){
  const k = "o_"+colorClave;
  const hex = {rojo:"#C93A3A",verde:"#3D8F4E",azul:"#2C63C4",hueso:"#C79320",
               multi:"#7B4FB5",bionico:"#6E7A88"}[colorClave];
  return svg(ICONOS[k](hex));
}

/* ── Avatares: un microbio distinto por silla ───────────────── */
const SILLAS = [
  {nombre:"Ámbar",  hex:"#D98C1F"}, {nombre:"Coral",  hex:"#C9503A"},
  {nombre:"Menta",  hex:"#2F8F72"}, {nombre:"Índigo", hex:"#3B5BC4"},
  {nombre:"Ciruela",hex:"#7B4FB5"}, {nombre:"Óxido",  hex:"#8A6A2F"}
];
function avatar(silla, tam){
  const s = SILLAS[silla % 6], n = 5 + (silla % 4);      /* distinto número de púas */
  const ojos = silla % 3;
  const cara = ojos===0
    ? `<circle cx="20" cy="22" r="2.6" fill="#16211F"/><circle cx="29" cy="22" r="2.6" fill="#16211F"/>
       <path d="M19 30c3 2.6 7 2.6 10 0" stroke="#16211F" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
    : ojos===1
    ? `<path d="M17 21l5 3-5 3M31 21l-5 3 5 3" stroke="#16211F" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
       <circle cx="24" cy="31" r="2.4" fill="#16211F"/>`
    : `<circle cx="19" cy="23" r="3.2" fill="#FBFAF7"/><circle cx="19" cy="23" r="1.5" fill="#16211F"/>
       <circle cx="30" cy="23" r="3.2" fill="#FBFAF7"/><circle cx="30" cy="23" r="1.5" fill="#16211F"/>
       <path d="M20 31h8" stroke="#16211F" stroke-width="2.2" stroke-linecap="round"/>`;
  return svg(`${pinchos(24,24,15,n,s.hex,4,silla)}
    <circle cx="24" cy="24" r="15" fill="${s.hex}"/>
    <circle cx="24" cy="24" r="15" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>
    ${cara}`, `width="${tam||36}" height="${tam||36}" class="av"`);
}
const colorSilla = i => SILLAS[i % 6].hex;

const API = {dibujo, dibujoOrgano, avatar, colorSilla, SILLAS, claveCarta};
if (typeof module !== "undefined" && module.exports) module.exports = API; else raiz.ARTE = API;
})(typeof self !== "undefined" ? self : globalThis);
