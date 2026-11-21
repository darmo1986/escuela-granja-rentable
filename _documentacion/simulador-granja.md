# Simulador de ponedoras — primera versión

Entrada: `simulador-granja.html`, enlazada desde Juegos. Implementación estática sin cuentas ni servicios externos. No se despliega hasta fusionar el PR. Se mantiene `noindex,follow` durante la revisión.

## Jugabilidad

- Cuatro aves iniciales, tres perfiles de ponedora, alimentación, agua, cama, salud y envejecimiento. Nuevas aves en observación y aislamiento por lote.
- Reloj ×3 real, con máximo de 72 horas simuladas por ausencia. Pausa explícita sin consecuencias offline. Práctica separada con turnos de un día.
- Precio del huevo variable cada día (0,19–0,34 € ficticios), venta de huevos y aves, capacidad máxima de 40 aves y sin beneficio por compra/reventa inmediata.
- Huevos recogidos por lotes con edad: capacidad 24/100/180 y deterioro a 2/4/10 días simulados según almacenamiento. Almacén elevado reduce plagas; el frío prolonga conservación y cuesta 0,40 €/día. No son plazos de seguridad alimentaria.
- Malla en tres niveles, cubierta, hasta nueve defensores combinables de tres tipos. Espantapájaros especializado en disuasión aérea, perro complementario, guardián terrestre. Resistencia, recuperación y mantenimiento. No hay muertes de defensores: a cero quedan inactivos.
- Avisos de amenazas con un día simulado de antelación. Visitas pueden rechazarse cerrando la puerta; control de acceso y guardián son alternativas. Riesgo sanitario probabilístico según higiene, exposición y pediluvio mantenido. Las bajas por trauma se distinguen de deterioro sanitario.
- Registro causal, balance económico y enlaces a curso/calculadora.

## Parámetros y límites

La economía se centraliza en `prices` y `breeds` de `js/granja-motor.js`. La presentación muestra sus reglas actuales. Son valores de juego sin verificación comercial, genética ni veterinaria. La moneda solo representa puntos de simulación. No hay medicamentos, instrucciones sanitarias, cobros ni premios.

Guardado local por separado para cada modo. Se informa si el navegador impide guardar. Reinicio con confirmación. No sincroniza dispositivos ni evita manipulación del reloj o del almacenamiento; no se debe conectar a premios/competición sin un servidor autoritativo.

Pendientes: revisión visual en navegador disponible, calibración extensa de economía y duración de temporadas, gráficos/animaciones propios, escenarios regionales, pollos de engorde, gallos y reproducción. No contiene todavía una granja animada avanzada: la escena actual es una representación ligera de las aves.

## Validación reproducible

`node --test tests/simulador-granja.test.cjs`

14 pruebas: reloj, paso fragmentado, límite offline, pausa, antiarbitraje, capacidad, carencias, precio y venta, conservación, electricidad, especialidades, visita rechazada, observación/aislamiento y restauración.

La prueba Playwright se intentó pero Chromium no pudo arrancar en el contenedor: socket de proceso no permitido. No se afirma revisión visual completa ni compatibilidad ya comprobada en dispositivos reales.
