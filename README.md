# VIRUS! en línea

Juego completo por turnos para 2 a 6 jugadores, con servidor propio. Cada quien entra
desde el navegador del celular con un código de cuatro letras.

    node >= 18
    npm install
    npm start          → http://localhost:3000

## Cómo está armado

    server.js            servidor: salas, websockets, autoridad de la partida
    public/reglas.js     motor de reglas (lo usan servidor y cliente)
    public/index.html    interfaz
    public/cliente.js    conexión y pintado de la mesa
    simular.js           300 partidas automáticas contra el motor
    prueba.js            partidas reales por websocket, con caídas de señal

**El servidor es el único que sabe la partida completa.** El mazo y las manos viven ahí;
a cada jugador se le manda su mano y, de los demás, solo cuántas cartas tienen. El cliente
no decide nada: manda intenciones («juego esta carta contra este órgano») y el servidor
verifica que la jugada esté en la lista de legales antes de aplicarla. Abrir las
herramientas del navegador no revela nada de nadie.

## Qué está implementado

Las 113 cartas de los tres juegos, con todas sus reglas: infectar, extirpar, neutralizar,
curar, vacunar, inmunizar, superinmunizar, los cinco tratamientos del base, los cuatro de
VIRUS! 2, el órgano biónico y los multicolor.

De **VIRUS! Halloween** (12 cartas): el órgano mutante naranja, que reemplaza
obligatoriamente a uno de tus órganos y solo lo tocan las cartas multicolor y los
tratamientos; los cuatro ladrones de colores, que roban incluso órganos inmunizados; el
trasplante alienígena, que intercambia órganos entre dos jugadores cualesquiera sin
importar si están inmunizados; la aparición, que cambia la carta por la última del
descarte; el experimento fallido, que al jugarlo eliges si actúa como virus o medicina; el
cambio de cuerpos, que gira todos los cuerpos de la mesa en el sentido que elijas; y el
truco o trato, que impide ganar a quien lo tenga encima hasta que cure, vacune o inmunice
un órgano de otro jugador y le pase la maldición.

Dos precisiones sobre Halloween. El reglamento no publica cuántas copias hay de cada
carta, así que el reparto de las 12 está en `crearMazo` y se cambia en una línea: cuatro
ladrones, dos apariciones, dos experimentos y una de cada una del resto. Y como el truco o
trato se quita curando a otro jugador, las medicinas solo se pueden jugar sobre cuerpos
ajenos cuando llevas la maldición encima; en cualquier otro momento se juegan sobre el
tuyo, como siempre.

## Arte y sonido

Las ilustraciones son originales, dibujadas en SVG dentro de `arte.js`: no se usa el arte
de Tranjis. Escalan sin pixelarse y funcionan sin conexión. Cada dibujo recibe en tiempo
real un acabado de tres capas: volumen (degradado radial con brillo especular), contorno
de tinta (un filtro que dilata la silueta y la rellena de un tono oscuro) y una escena
detrás según la familia —nube con rayos para los virus, destellos para los órganos, halo
para las medicinas y estallido radial para los tratamientos—. La cara de la carta lleva
marco doble, cabecera con icono, rótulos verticales en los costados, pie repetido e icono
de esquina, como las cartas físicas.

**Ilustraciones propias en PNG.** Si quieres arte pintado, deja archivos PNG cuadrados en
`public/cartas/` con el nombre de la clave de cada carta (`o_rojo.png`, `v_evo.png`,
`t_trasplante.png`… la lista completa la imprime `npm run cartas`) y corre ese comando:
genera `lista.json` y el juego usa esas imágenes en el marco, dibujando en SVG las que
falten. Sirve para reemplazar el mazo de a poco.

Cuando alguien juega una carta, esa carta aparece grande en el centro de la mesa con la
frase de lo que hizo, y desde ahí vuela hasta el órgano donde aterriza. El servidor manda
en cada suceso la carta y su destino, y el cliente busca esa ficha en pantalla para llevarla
allí. Si el órgano dejó de existir, por ejemplo tras una extirpación, la carta viaja hasta
la silla del jugador. Quien tenga activado el ajuste de movimiento reducido del sistema ve
la carta sin desplazamiento.

El sonido también es sintético, generado con WebAudio en `sonido.js`: no hay ni un archivo
de audio. Hay un efecto por suceso (bajar órgano, infectar, extirpar, curar, inmunizar,
robar, contagiar, truco o trato, victoria) y un ambiente de fondo con latido de quirófano,
que se vuelve algo más siniestro cuando la partida usa Halloween. Los dos interruptores
están en la barra superior y se recuerdan en el navegador. El navegador exige un gesto de
la persona antes de dejar sonar nada, así que el audio arranca en el primer toque.

Tres cosas que suelen quedar mal resueltas y aquí no:

- **El traje de protección.** Es la única carta que se juega fuera de tu turno. Cuando
  alguien te ataca, el servidor congela la jugada y te abre una ventana de 12 segundos
  para responder. Si lo usas, el atacante debe buscar otro objetivo válido —incluido su
  propio cuerpo— y si no queda ninguno, su carta se descarta sin efecto. Si la carta
  afectaba a todos, como el guante de látex, surte efecto sobre los demás pero no sobre ti.
- **Ganar fuera de tu turno.** La verificación de victoria corre después de cada cambio de
  estado, no al final del turno, porque un error médico puede entregarte un cuerpo completo.
- **Mesa circular estilo UNO.** Durante la partida el navegador entra en pantalla completa
  y, en móvil, pide girar a horizontal. Cada rival ocupa un borde con su avatar, su nombre,
  su cuenta de cartas en abanico y sus órganos; la pila de descarte queda al centro y tu
  mano se despliega en abanico abajo a la izquierda, y tus propios órganos quedan abajo a
  la derecha, separados de la mano para que siempre los veas. Los órganos de cada jugador se
  muestran en cuadrícula de dos columnas, así un cuerpo de cuatro o cinco órganos se lee de
  un vistazo. Las etiquetas y avisos del centro van siempre por encima de las cartas. Al jugar una carta, esta vuela desde el centro hasta
  el órgano o el jugador que toca. Así ningún naipe tapa la información de los demás.
- **Consultar cartas en todo momento.** Cada naipe de tu mano tiene un botón «?» que abre
  qué hace esa carta, con su ilustración grande. Fuera de tu turno, tocar una carta también
  la explica en vez de intentar jugarla, para que vayas pensando tu jugada mientras esperas.
- **Modo blindaje.** Opción de la sala: para ganar no basta con tener los cuatro órganos
  sanos, hay que tenerlos inmunizados. Alarga y endurece la partida. Los órganos que ya
  cuentan para la meta se marcan con un anillo verde brillante, y el biónico cuenta como
  blindado. El asistente de sugerencias persigue la meta correcta según el modo.
- **Salir y terminar.** El menú de la barra superior tiene dos salidas. Retirarte tú solo
  devuelve tus cartas y tus órganos al descarte, la partida sigue sin ti y los turnos te
  saltan; si quedas último, la partida termina sin ganador. Proponer terminar abre una
  votación de treinta segundos: acaba sin ganador solo si todos los demás aceptan, y basta
  un no para seguir jugando. Quien se retira mantiene su silla ocupada para que los índices
  de la partida no se descuadren, y aparece marcado como retirado.
- **Reconexión.** El estado vive en el servidor. Si se te cae la señal, el navegador
  reintenta solo y vuelves a la misma silla con tu mano intacta. Si tardas más de 40
  segundos en tu turno estando desconectado, el servidor juega por ti la mejor jugada
  disponible para que la mesa no se quede esperando.

El **modo aprendizaje** activa el asistente de sugerencias para toda la mesa. Es una
opción del anfitrión y se aplica a todos: si lo tuviera uno solo, la partida dejaría de
ser pareja.

## Publicar

Cualquier servicio que corra Node sirve. El servidor lee el puerto de `process.env.PORT`,
que es lo que esperan casi todos.

**Render** (plan gratuito): New → Web Service, conecta el repo, build `npm install`,
start `npm start`. Da https, y el cliente detecta solo que debe usar `wss://`.
En el plan gratuito el servicio se duerme por inactividad; al despertar se pierden las
salas abiertas.

**Railway o Fly.io**: igual, detectan el `package.json` y no necesitan configuración.

**VPS propio**: `npm start` detrás de nginx con `proxy_pass` y las cabeceras de upgrade
para websocket. Para probar en tu casa sin publicar nada, `npm start` y que los demás
entren a `http://TU-IP-LOCAL:3000` desde el wifi.

## Límites conocidos

- Las salas viven en memoria: si reinicias el servidor, se pierden las partidas en curso.
  Para que sobrevivan habría que volcar el estado a disco o a Redis en cada jugada.
- Un solo proceso. Aguanta decenas de mesas simultáneas sin problema, pero no escala a
  varias máquinas sin mover el estado fuera del proceso.
- Sin cuentas ni historial: la identidad es un token guardado en el navegador.
- Las cartas en blanco del asistente todavía no se sincronizan aquí. Serían reglas de la
  sala, definidas por el anfitrión antes de empezar.

## Advertencia

VIRUS! es un juego publicado por Tranjis Games. Las reglas no se protegen por derecho de
autor, pero el nombre, el arte y los textos de las cartas sí. Para jugar entre amigos no
hay problema práctico; si algún día se publica abierto, tendría que ir con nombre y arte
propios.
