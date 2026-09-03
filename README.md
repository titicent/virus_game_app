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

Las 101 cartas del juego base más la expansión, con todas sus reglas: infectar, extirpar,
neutralizar, curar, vacunar, inmunizar, superinmunizar, los cinco tratamientos del base y
los cuatro de VIRUS! 2, el órgano biónico y los multicolor.

Tres cosas que suelen quedar mal resueltas y aquí no:

- **El traje de protección.** Es la única carta que se juega fuera de tu turno. Cuando
  alguien te ataca, el servidor congela la jugada y te abre una ventana de 12 segundos
  para responder. Si lo usas, el atacante debe buscar otro objetivo válido —incluido su
  propio cuerpo— y si no queda ninguno, su carta se descarta sin efecto. Si la carta
  afectaba a todos, como el guante de látex, surte efecto sobre los demás pero no sobre ti.
- **Ganar fuera de tu turno.** La verificación de victoria corre después de cada cambio de
  estado, no al final del turno, porque un error médico puede entregarte un cuerpo completo.
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
