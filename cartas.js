/* Genera public/cartas/lista.json con las ilustraciones externas disponibles.
   Deja ahí archivos PNG con el nombre de la clave de la carta:
     o_rojo.png  o_verde.png  o_azul.png  o_hueso.png  o_multi.png  o_bionico.png  o_mutante.png
     v_basico.png  v_evo.png  m_basica.png  m_exp.png
     t_trasplante.png  t_ladron.png ... t_cuarentena.png  t_alien.png ... t_cambio.png
   y corre `npm run cartas`. El cliente usará esas imágenes y dibujará en SVG las que falten. */
const fs = require("fs"), path = require("path");
const dir = path.join(__dirname, "public", "cartas");
const R = require("./public/reglas.js"), A = require("./public/arte.js");
const claves = [...new Set(R.crearMazo(true, true).map(A.claveCarta))];
const hay = fs.readdirSync(dir).filter(f => f.endsWith(".png")).map(f => f.slice(0, -4));
const validas = hay.filter(k => claves.includes(k));
fs.writeFileSync(path.join(dir, "lista.json"), JSON.stringify(validas));
console.log(validas.length + " ilustraciones externas de " + claves.length + " posibles.");
const faltan = claves.filter(k => !validas.includes(k));
if (faltan.length) console.log("Se dibujan en SVG: " + faltan.join(", "));
hay.filter(k => !claves.includes(k)).forEach(k => console.log("Ignorado (nombre desconocido): " + k + ".png"));
