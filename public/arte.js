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
  <path d="M22 9v6M27 8.5v6.5M31.5 10l-1.5 6" stroke="${c}" stroke-width="4.2" stroke-linecap="round"/>
  <path d="M24 41C10 31 5 22 9.5 15.5c3.6-5.2 11-4.3 14.5 1.4 3.5-5.7 10.9-6.6 14.5-1.4C43 22 38 31 24 41Z" fill="${c}"/>
  <path d="M26 20c-2 4-1.6 9 1 14M20 22c1.4 3 1.2 6 0 9" stroke="rgba(120,20,25,.45)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M15.5 18.5c-2.4.6-3.9 2.5-4.2 5" stroke="rgba(255,255,255,.7)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
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
  <ellipse cx="20" cy="23.5" rx="2.6" ry="3" fill="#FBFAF7"/><ellipse cx="28" cy="23.5" rx="2.6" ry="3" fill="#FBFAF7"/>
  <circle cx="20.6" cy="24" r="1.4" fill="#C9202A"/><circle cx="28.6" cy="24" r="1.4" fill="#C9202A"/>
  <path d="M16.5 19.5l5 2M31.5 19.5l-5 2" stroke="#16211F" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M20 29.5c2.4 2 5.6 2 8 0" fill="none" stroke="#16211F" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M22 29.6l1 1.6M26 29.6l-1 1.6" stroke="#FBFAF7" stroke-width="1.2" stroke-linecap="round"/>`;
const virusEvo = c => `
  ${pinchos(24,24,12,10,c,5.5,0)}<circle cx="24" cy="24" r="12" fill="${c}"/>
  <ellipse cx="19.5" cy="23" rx="2.4" ry="3.2" fill="#FBFAF7"/><ellipse cx="28.5" cy="23" rx="2.4" ry="3.2" fill="#FBFAF7"/>
  <circle cx="20" cy="23.6" r="1.5" fill="#C9202A"/><circle cx="29" cy="23.6" r="1.5" fill="#C9202A"/>
  <path d="M15.5 18.5l5.5 2.6M32.5 18.5l-5.5 2.6" stroke="#16211F" stroke-width="2" stroke-linecap="round"/>
  <path d="M18 29.5c1.6-1.4 3.2-1.4 4.6 0 1.4-1.4 3-1.4 4.6 0 1.2-1.2 2.4-1.2 3.4 0" fill="none" stroke="#16211F" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M20.5 29.8l.8 2M27.5 29.8l-.8 2" stroke="#FBFAF7" stroke-width="1.4" stroke-linecap="round"/>
  <circle cx="14" cy="29" r="1.3" fill="#16211F" opacity=".35"/><circle cx="33" cy="17" r="1" fill="#16211F" opacity=".35"/>`;

/* ── Medicinas ──────────────────────────────────────────────── */
const medicinaBasica = c => `
  <rect x="19" y="6" width="10" height="6" rx="1.6" fill="${c}"/>
  <path d="M18 12h12v3.5c3.6 1.4 6 4.8 6 8.8V38c0 2.2-1.8 4-4 4H16c-2.2 0-4-1.8-4-4V24.3c0-4 2.4-7.4 6-8.8Z" fill="${c}"/>
  <rect x="15" y="21" width="18" height="15" rx="2.5" fill="#FBFAF7"/>
  <path d="M24 24v9M19.5 28.5h9" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M15.5 18.5c-.9 1.1-1.4 2.4-1.6 3.6" stroke="rgba(255,255,255,.7)" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
const medicinaExp = c => `
  <path d="M20 8h8v11l7.5 14c1.4 2.6-.4 5.8-3.4 5.8H15.9c-3 0-4.8-3.2-3.4-5.8L20 19Z" fill="none" stroke="${c}" stroke-width="3.4" stroke-linejoin="round"/>
  <path d="M15.4 27h17.2l3 5.6c1 1.9-.3 4.2-2.5 4.2H14.9c-2.2 0-3.5-2.3-2.5-4.2Z" fill="${c}"/>
  <circle cx="21" cy="32" r="2" fill="rgba(255,255,255,.85)"/><circle cx="27" cy="34" r="1.4" fill="rgba(255,255,255,.7)"/>
  <path d="M18 8h12" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>`;

/* ── Tratamientos ───────────────────────────────────────────── */
const T = "#2E5C56";
const trasplante = () => `
  <rect x="2" y="26" width="12" height="12" rx="4" fill="#C93A3A"/>
  <rect x="12" y="26.6" width="7" height="2.5" rx="1.25" fill="#C93A3A"/><rect x="12" y="29.6" width="8" height="2.5" rx="1.25" fill="#C93A3A"/>
  <rect x="12" y="32.6" width="7.5" height="2.5" rx="1.25" fill="#C93A3A"/><rect x="12" y="35.5" width="6" height="2.5" rx="1.25" fill="#C93A3A"/>
  <rect x="6" y="20" width="2.8" height="8" rx="1.4" fill="#C93A3A"/>
  <rect x="34" y="10" width="12" height="12" rx="4" fill="#2C63C4"/>
  <rect x="29" y="10.6" width="7" height="2.5" rx="1.25" fill="#2C63C4"/><rect x="28" y="13.6" width="8" height="2.5" rx="1.25" fill="#2C63C4"/>
  <rect x="28.5" y="16.6" width="7.5" height="2.5" rx="1.25" fill="#2C63C4"/><rect x="30" y="19.5" width="6" height="2.5" rx="1.25" fill="#2C63C4"/>
  <rect x="39.2" y="20" width="2.8" height="8" rx="1.4" fill="#2C63C4"/>
  <path d="M24 31c-5-3.6-6.8-7-5.4-9.3 1.3-2 4-1.7 5.4.4 1.4-2.1 4.1-2.4 5.4-.4 1.4 2.3-.4 5.7-5.4 9.3Z" fill="#C93A3A"/>
  <path d="M10 14c2.5-4 7-6 12-5.5" fill="none" stroke="${T}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3 2.5"/>
  <path d="M20.5 6.5l2.6 2-2.2 2.2" fill="none" stroke="${T}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M38 34c-2.5 4-7 6-12 5.5" fill="none" stroke="${T}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="3 2.5"/>
  <path d="M27.5 41.5l-2.6-2 2.2-2.2" fill="none" stroke="${T}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
const ladron = () => `
  <path d="M29 24c-6-4.2-8.2-8.2-6.6-11 1.4-2.4 4.8-2 6.6.6 1.8-2.6 5.2-3 6.6-.6 1.6 2.8-.6 6.8-6.6 11Z" fill="${T}" opacity=".55"/>
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


/* ── Halloween ──────────────────────────────────────────────── */
const H = "#7A4B9E";
const mutante = c => `
  <path d="M24 8c-6.6 0-12 5-12 11.2 0 3.4 1.6 6.2 4 8.2-2.6 1.6-4.4 4.2-4.4 7.2 0 1.6 1.2 2.8 2.8 2.8s2.8-1.2 2.8-2.8c0-1.8 1.6-3.2 3.6-3.2s3.6 1.4 3.6 3.2v6.6c0 1.6 1.2 2.8 2.8 2.8s2.8-1.2 2.8-2.8V34c0-1.8 1.6-3.2 3.6-3.2S37 32.2 37 34c0 1.6 1.2 2.8 2.8 2.8" fill="none" stroke="${c}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="19" cy="18" r="2.6" fill="${c}"/><circle cx="29" cy="18" r="2.6" fill="${c}"/>`;
const ladronColor = c => `
  <path d="M30 23c-6-4.2-8.2-8.2-6.6-11 1.4-2.4 4.8-2 6.6.6 1.8-2.6 5.2-3 6.6-.6 1.6 2.8-.6 6.8-6.6 11Z" fill="${c}"/>
  <path d="M19 23 13 29" stroke="${H}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-dasharray="3 3"/>
  <rect x="6" y="33" width="19" height="9" rx="3" fill="${H}"/>
  <rect x="7.5" y="24" width="4.2" height="11" rx="2.1" fill="${H}"/>
  <rect x="12.6" y="21.5" width="4.2" height="13.5" rx="2.1" fill="${H}"/>
  <rect x="17.7" y="24" width="4.2" height="11" rx="2.1" fill="${H}"/>
  <rect x="22.3" y="27" width="4.2" height="8" rx="2.1" fill="${H}"/>`;
const alien = () => `
  <ellipse cx="24" cy="17" rx="11" ry="12.5" fill="${H}"/>
  <ellipse cx="19" cy="16" rx="3.4" ry="4.6" fill="#FBFAF7" transform="rotate(-18 19 16)"/>
  <ellipse cx="29" cy="16" rx="3.4" ry="4.6" fill="#FBFAF7" transform="rotate(18 29 16)"/>
  <path d="M14 31c-2 4-1 8 2 9M34 31c2 4 1 8-2 9M20 32c-1 5 0 8 1.5 9.6M28 32c1 5 0 8-1.5 9.6" fill="none" stroke="${H}" stroke-width="3.2" stroke-linecap="round"/>`;
const aparicion = () => `
  <path d="M24 5c-7 0-12.5 5.6-12.5 12.6V42l4.2-3.6 4.1 3.6 4.2-3.6 4.2 3.6 4.1-3.6 4.2 3.6V17.6C36.5 10.6 31 5 24 5Z" fill="${H}"/>
  <circle cx="19" cy="18" r="2.8" fill="#FBFAF7"/><circle cx="29" cy="18" r="2.8" fill="#FBFAF7"/>
  <ellipse cx="24" cy="27" rx="3.4" ry="4.4" fill="#FBFAF7" opacity=".85"/>`;
const experimento = () => `
  <path d="M19 7h10v10l7.8 15.6c1.5 3-.7 6.4-4 6.4H15.2c-3.3 0-5.5-3.4-4-6.4L19 17Z" fill="none" stroke="${H}" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M14.6 26h18.8l3.2 6.6c1 2.2-.5 4.4-2.8 4.4H14.2c-2.3 0-3.8-2.2-2.8-4.4Z" fill="${H}"/>
  <path d="M17 7h14" stroke="${H}" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M24 19v-4M20 21l-3-2.4M28 21l3-2.4" stroke="${H}" stroke-width="2.4" stroke-linecap="round"/>
  <circle cx="20" cy="32" r="2.2" fill="#FBFAF7"/><circle cx="27" cy="33.5" r="1.6" fill="#FBFAF7"/>`;
const trucoTrato = () => `
  <path d="M24 13c-1.4-3-4-4.4-4-4.4S23 7 24 4c1 3 4 4.6 4 4.6S25.4 10 24 13Z" fill="#E07A1F"/>
  <path d="M24 14c-8.6 0-15 6-15 14s6.4 14 15 14 15-6 15-14-6.4-14-15-14Z" fill="#E07A1F"/>
  <path d="M15.5 14.8C13 18 12 22.6 12 28s1 10 3.5 13.2M32.5 14.8C35 18 36 22.6 36 28s-1 10-3.5 13.2"
    fill="none" stroke="#B85E10" stroke-width="1.8"/>
  <path d="M17 24l5-3.4v6.8ZM31 24l-5-3.4v6.8Z" fill="#3A2408"/>
  <path d="M17 33h14l-2.5 3.6h-3L23 33.8l-2.4 2.8h-3Z" fill="#3A2408"/>`;
const cambioCuerpos = () => `
  <path d="M36.5 15.5A15 15 0 1 1 24 9" fill="none" stroke="${H}" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M30 6.5 37.5 15 29 20" fill="none" stroke="${H}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="17.5" cy="20" r="3.6" fill="${H}"/>
  <path d="M12 32c0-3.2 2.5-5.6 5.5-5.6S23 28.8 23 32v1.6h-11Z" fill="${H}"/>
  <circle cx="30.5" cy="20" r="3.6" fill="${H}" opacity=".55"/>
  <path d="M25 32c0-3.2 2.5-5.6 5.5-5.6S36 28.8 36 32v1.6H25Z" fill="${H}" opacity=".55"/>`;

const ICONOS = {
  o_rojo:corazon, o_verde:estomago, o_azul:cerebro, o_hueso:hueso,
  o_multi:multicolor, o_bionico:bionico,
  v_basico:virusBasico, v_evo:virusEvo,
  m_basica:medicinaBasica, m_exp:medicinaExp,
  t_trasplante:trasplante, t_ladron:ladron, t_contagio:contagio, t_guante:guante,
  t_error:errorMedico, t_horas:horas, t_segunda:segunda, t_traje:traje, t_cuarentena:cuarentena,
  o_mutante:mutante, t_alien:alien, t_aparicion:aparicion, t_experimento:experimento,
  t_truco:trucoTrato, t_cambio:cambioCuerpos,
  t_ladron_rojo:()=>ladronColor("#C93A3A"), t_ladron_verde:()=>ladronColor("#3D8F4E"),
  t_ladron_azul:()=>ladronColor("#2C63C4"), t_ladron_hueso:()=>ladronColor("#C79320")
};

/* Dibujo de una carta o de un órgano en mesa */
function claveCarta(c){
  if(!c)return null;
  if(c.k==="organo")return "o_"+c.c;
  if(c.k==="virus")return "v_"+c.t;
  if(c.k==="medicina")return "m_"+c.t;
  return "t_"+c.tr;
}
/* ── Acabado: volumen, tinta y escena ───────────────────────── */
function hex2rgb(h){ const n=parseInt(h.slice(1),16); return [n>>16&255,n>>8&255,n&255]; }
function mezcla(h, con, t){
  const a=hex2rgb(h), b=hex2rgb(con);
  return "#"+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,"0")).join("");
}
let serie = 0;
/* Escena detrás del sujeto, según la familia de la carta */
function escena(carta, tono, id){
  if(!carta) return "";
  if(carta.k==="virus") return `
    <path d="M6 20c-2-5 3-9 7-7 1-5 8-7 12-4 4-2 10 0 10 5 4 0 6 4 4 7-1 3-5 4-8 3-5 2-11 2-15 0-4 2-9-1-10-4Z"
      fill="#9BA7B4" opacity=".85"/>
    <path d="M9 19c-1-3 2-6 5-5 1-3 6-5 9-2 3-2 8 0 8 4" fill="none" stroke="#C9D2DB" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
    <path d="M8 27l4-6-3 0 4-6" fill="none" stroke="#F2D24A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M40 30l-4-6 3 0-4-6" fill="none" stroke="#F2D24A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
`;
  if(carta.k==="organo") return `
    <circle cx="24" cy="24" r="17" fill="url(#h${id})"/>
    <path d="M9 12l1.2 2.4L12.6 15.6 10.2 16.8 9 19.2 7.8 16.8 5.4 15.6 7.8 14.4Z" fill="#fff" opacity=".9"/>
    <path d="M39 33l.9 1.8 1.8.9-1.8.9-.9 1.8-.9-1.8-1.8-.9 1.8-.9Z" fill="#fff" opacity=".9"/>
    <circle cx="38" cy="11" r="1.4" fill="#fff" opacity=".8"/><circle cx="9" cy="37" r="1.1" fill="#fff" opacity=".7"/>`;
  if(carta.k==="medicina") return `
    <circle cx="24" cy="24" r="18" fill="url(#h${id})"/>
    <circle cx="24" cy="24" r="12" fill="none" stroke="${tono}" stroke-width="1" opacity=".25"/>
    <circle cx="24" cy="24" r="16" fill="none" stroke="${tono}" stroke-width=".8" opacity=".15"/>`;
  /* tratamiento: estallido radial */
  let r = "";
  for(let i=0;i<14;i++){ const a=i*Math.PI*2/14; const x1=24+Math.cos(a)*9, y1=24+Math.sin(a)*9, x2=24+Math.cos(a)*23, y2=24+Math.sin(a)*23;
    r += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${tono}" stroke-width="${i%2?1.2:2}" opacity=".18" stroke-linecap="round"/>`; }
  return `<circle cx="24" cy="24" r="17" fill="url(#h${id})"/>${r}`;
}
function dibujo(carta, color, plano, sinEscena){
  const k = claveCarta(carta);
  if(!k||!ICONOS[k])return "";
  const tono = color||"#2E5C56";
  if(plano) return svg(ICONOS[k](tono));               /* versión sencilla (iconos pequeños) */
  const id = "a"+(serie++).toString(36);
  const claro = mezcla(tono,"#FFFFFF",.38), oscuro = mezcla(tono,"#000000",.32), tinta = mezcla(tono,"#101418",.62);
  return svg(`<defs>
    <radialGradient id="g${id}" cx="34%" cy="28%" r="78%">
      <stop offset="0" stop-color="${claro}"/><stop offset=".55" stop-color="${tono}"/><stop offset="1" stop-color="${oscuro}"/></radialGradient>
    <radialGradient id="h${id}" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${tono}" stop-opacity=".28"/><stop offset=".7" stop-color="${tono}" stop-opacity=".08"/>
      <stop offset="1" stop-color="${tono}" stop-opacity="0"/></radialGradient>
    <filter id="f${id}" x="-20%" y="-20%" width="140%" height="140%">
      <feMorphology in="SourceAlpha" operator="dilate" radius=".9" result="d"/>
      <feFlood flood-color="${tinta}" result="c"/><feComposite in="c" in2="d" operator="in" result="borde"/>
      <feDropShadow dx="0" dy="1.2" stdDeviation="1" flood-color="#000" flood-opacity=".35" in="borde" result="sombra"/>
      <feMerge><feMergeNode in="sombra"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="b${id}" cx="30%" cy="22%" r="45%">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  ${sinEscena ? "" : escena(carta, tono, id)}
  <g filter="url(#f${id})">${ICONOS[k]("url(#g"+id+")")}</g>
  <g style="mix-blend-mode:screen;pointer-events:none"><circle cx="24" cy="24" r="16" fill="url(#b${id})"/></g>`);
}
function dibujoOrgano(colorClave){
  const hex = {rojo:"#C93A3A",verde:"#3D8F4E",azul:"#2C63C4",hueso:"#C79320",
               multi:"#7B4FB5",bionico:"#6E7A88",mutante:"#E07A1F"}[colorClave];
  return dibujo({k:"organo",c:colorClave}, hex, false, true);
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


/* ── Cara de carta al estilo de la baraja ───────────────────── */
/* Marco de color, cabecera con icono, ilustración con aura y
   pie repetido, como en las cartas físicas. */
function rotulos(carta){
  if(!carta) return {titulo:"", sub:"", nombre:""};
  const O = {rojo:"Corazón",verde:"Estómago",azul:"Cerebro",hueso:"Hueso",
             multi:"Multicolor",bionico:"Biónico",mutante:"Mutante"};
  if(carta.k==="organo") return {titulo:"ÓRGANO", sub:O[carta.c].toUpperCase(), nombre:O[carta.c]};
  if(carta.k==="virus") return {titulo:"VIRUS", sub:(carta.t==="evo"?"MUTADO / ":"")+O[carta.c].toUpperCase(),
    nombre:carta.t==="evo"?"Virus mutado":"Virus"};
  if(carta.k==="medicina") return {titulo:"MEDICINA", sub:(carta.t==="exp"?"EXPERIMENTAL / ":"")+O[carta.c].toUpperCase(),
    nombre:carta.t==="exp"?"Medicina exp.":"Medicina"};
  const N = raiz.REGLAS ? raiz.REGLAS.TRAT[carta.tr] : carta.tr;
  return {titulo:"TRATAMIENTO", sub:N.toUpperCase(), nombre:N};
}
/* Ilustraciones externas: si existe public/cartas/<clave>.png se usa en lugar
   del dibujo SVG. La lista la genera `npm run cartas`. */
let EXTERNAS = new Set();
function usarExternas(lista){ EXTERNAS = new Set(lista||[]); }
function ilustracion(carta, tono){
  const k = claveCarta(carta);
  if(k && EXTERNAS.has(k)) return `<img src="cartas/${k}.png" alt="" draggable="false">`;
  return dibujo(carta, tono);
}
function caraCarta(carta, tono, grande){
  const r = rotulos(carta);
  const rot = `${r.titulo} / ${r.sub}`;
  return `<span class="cara ${grande?"gr":""}" style="--tono:${tono}">
    <span class="papel"></span>
    <span class="cinta"><span class="ins">${dibujo(carta, "#FFFFFF", true)}</span>
      <span class="tit">${(carta.k==="tratamiento"&&!grande) ? r.sub : `${r.titulo} <b>/ ${r.sub}</b>`}</span></span>
    <span class="lado izq">${rot}</span><span class="lado der">${rot}</span>
    <span class="ilustra"><span class="obra">${ilustracion(carta, tono)}</span></span>
    <span class="alpie">${rot}</span>
    <span class="esq">${dibujo(carta, "#FFFFFF", true)}</span></span>`;
}
const API = {dibujo, dibujoOrgano, avatar, colorSilla, SILLAS, claveCarta, caraCarta, rotulos, usarExternas};
if (typeof module !== "undefined" && module.exports) module.exports = API; else raiz.ARTE = API;
})(typeof self !== "undefined" ? self : globalThis);
