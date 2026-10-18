# -*- coding: utf-8 -*-
from seo_guias_2 import INC_STEPS

def p(text):
    return f"<p>{text}</p>\n"

steps_html = "<ol>\n" + "\n".join(
    f"<li><strong>{name}.</strong> {text}</li>" for name, text in INC_STEPS
) + "\n</ol>\n"

howto = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Incubar huevos de gallina",
    "description": "Veintiún días con temperatura, humedad y volteo según Mississippi State, y guarda corta según la FAO.",
    "totalTime": "P21D",
    "inLanguage": "es",
    "step": [
        {"@type": "HowToStep", "position": i, "name": name, "text": text}
        for i, (name, text) in enumerate(INC_STEPS, 1)
    ],
}

G4 = {
"slug": "incubar-huevos-de-gallina",
"title": "Incubar huevos de gallina: 21 días | Granja Rentable",
"description": "Temperatura, humedad y volteo para 21 días, con Mississippi State y la FAO. La máquina no promete que nazcan.",
"crumb": "Incubar huevos",
"h1": "Cómo incubar huevos de gallina",
"howto": howto,
"relacionadas": [
    ("Qué incubadora y cuántos días", "guia-incubadora.html"),
    ("Primeros días del pollito", "guias/primeros-dias-pollito.html"),
    ("Cuántas gallinas por gallo", "guias/gallinas-por-gallo.html"),
    ("Lección L03", "lecciones/l03.html"),
    ("Calculadora", "calculadora.html"),
],
"faq": [
    ("¿Cuántos días tarda un huevo de gallina?", "Veintiún días, según Mississippi State University Extension. El calor sostenido puede adelantar el nacimiento y el frío sostenido puede atrasarlo. En los dos casos suelen nacer menos. No es una fecha que la máquina pueda prometer."),
    ("¿A qué temperatura?", "MSU pide 100 °F, es decir 37,8 °C, en una incubadora de aire forzado, todo el periodo. En una de aire quieto pide 102 °F, 38,9 °C, medida a la altura del embrión, no pegada al cascarón. MSU advierte que muchos embriones mueren si se sostienen a 105 °F (40,6 °C) durante 30 minutos."),
    ("¿Qué humedad y hasta cuándo se voltea?", "Del día 1 al 18, MSU mantiene cerca de 58 a 60 % de humedad relativa. Los últimos tres días sube al menos a 65 % y se deja de voltear el día 18. Abrir la tapa en el cierre suelta la humedad que el pollito necesita para no pegarse."),
    ("¿Sirve cualquier huevo del refrigerador?", "No. Hace falta huevo fértil, de un lote con gallo, limpio y sin grieta. La FAO, para reproductoras en explotaciones más ordenadas, recomienda no pasar de siete días de guarda, a 15,5–17 °C y alrededor de 75 % de humedad. El huevo de la tienda, para comer, no está fértil."),
],
"fuentes": """<ul>
<li>Mississippi State University Extension. <a href="https://extension.msstate.edu/agriculture/livestock/poultry/important-incubation-factors">Important incubation factors</a> y <a href="https://extension.msstate.edu/publications/hatching-quality-chicks">Hatching Quality Chicks</a>. 21 días, 100 °F con aire forzado, 102 °F con aire quieto, humedad 58–60 % y al menos 65 % al final, sin volteo desde el día 18.</li>
<li>FAO. <a href="https://www.fao.org/3/al739s/al739s.pdf">Alojamiento y manejo de aves reproductoras</a>. En explotaciones de más escala, no guardar el huevo fértil más de siete días, a 15,5–17 °C y 75 % de humedad relativa. No incubar huevo de suelo ni sucio.</li>
<li>Lección <a href="../lecciones/l03.html">L03</a> del curso, que ya cita a MSU para los días de gallina, codorniz, pato y pavo.</li>
</ul>
<p>La fecha de nacimiento se puede sumar en las <a href="../calculadoras.html">calculadoras</a>. No garantiza el nacimiento.</p>""",
"html": "",
}

G4["html"] = "".join([
p("Incubar es sostener 21 días de temperatura, humedad, aire y volteo. No es «prender la máquina y esperar pollitos». Mississippi State University Extension publica las condiciones que mejor resultado dan en gallina, y advierte que el fallo más común es la temperatura o la humedad fuera de rango durante bastante tiempo. Esta guía copia esas condiciones y la guarda del huevo que describe la FAO. No promete un porcentaje de nacimiento."),
p("Si solo quieres saber qué máquina mira el curso y cuántos días cita para otras aves, está en la <a href='../guia-incubadora.html'>guía de incubadora y días</a> y en la <a href='../lecciones/l03.html'>L03</a>. Aquí el tema es el proceso del huevo de gallina. El pollito que nace sigue en <a href='primeros-dias-pollito.html'>primeros días</a>. Sin esa segunda parte, el nacimiento se enfría en la caja."),
"<h2>El huevo que sí entra</h2>",
p("Tiene que ser fértil. Sin gallo, la gallina pone huevos de comer y la incubadora los tiene 21 días para nada. Cuántas gallinas por gallo, con las relaciones que publica la FAO, está en <a href='gallinas-por-gallo.html'>esa guía</a>. Un gallo no arregla un lote enfermo: incubar esos huevos reparte el problema."),
p("Elige huevos limpios, sin grieta, de tamaño parejo, y no los laves si puedes evitarlo. El huevo del suelo y el muy sucio se apartan. La FAO, al describir reproductoras en explotaciones de más escala, pide recoger varias veces al día, manejarlos sin golpes y no incubar los de suelo ni los sucios. Para la guarda, el mismo texto habla de un máximo de siete días en un cuarto de 15,5 a 17 °C y una humedad relativa del 75 %. Un huevo de dos semanas encima del refrigerador de la cocina no es ese cuarto."),
p("Guárdalos con la punta fina hacia abajo si los tienes varios días, y dales un volteo suave si la espera pasa de tres o cuatro días. No los metas del calor del gallinero a la máquina helada, ni al revés, de un golpe. Unas horas en la misma habitación de la incubadora, antes de cargarla, evitan que el cascarón sude. El sudor moja el poro y mete suciedad."),
"<h2>La máquina, antes del huevo</h2>",
p("Enciende la incubadora al menos un día antes, con agua en la bandeja, y mira si la temperatura se queda quieta. Si baila, no cargues. MSU pide 100 °F (37,8 °C) en aire forzado durante todo el periodo. En aire quieto, 102 °F (38,9 °C), porque el aire se estratifica: el termómetro va a la altura de la parte alta del huevo, que es donde está el embrión, sin tocar el cascarón ni la pared."),
p("Una oscilación breve de menos de medio grado Fahrenheit (unos 0,3 °C) se tolera. No dejes que el total de la variación pase de cerca de un grado Fahrenheit (unos 0,6 °C), y no sostengas extremos. MSU dice que muchos embriones mueren si se mantienen a 105 °F (40,6 °C) durante 30 minutos, y que 90 °F (32,2 °C) durante 3 o 4 horas frena el desarrollo. Un apagón de la noche se anota: a veces el lote nace tarde y incompleto, y la causa fue esa hora, no «la marca de la máquina»."),
p("La humedad de MSU, hasta tres días antes de nacer, es 58 a 60 % de humedad relativa, o un bulbo húmedo de unos 85 a 87 °F (29,4 a 30,6 °C) cuando el seco está cerca de 100 °F (37,8 °C). En el cierre, al menos 65 %, bulbo húmedo cerca de 89 a 90 °F (31,7 a 32,2 °C). Si tu aparato solo tiene perilla de «agua» y no tiene higrómetro, el <a href='../producto/termohigrometro.html'>termohigrómetro</a> de la tienda es una herramienta para medir, no una garantía. Mide en el sitio del huevo, no en la tapa."),
"<h2>Los 21 días, en orden</h2>",
steps_html,
p("Esos cuatro pasos son el proceso. El volteo de una máquina automática no se «ayuda» abriendo cada hora para girar a mano, salvo que el motor se pare. Cada apertura tira temperatura y humedad. Anota el día 0 como el día en que la temperatura ya era estable y los huevos entraron, no el día en que los recogiste del nido."),
p("La ovoscopia, si la haces, es para sacar huevos claros o con anillo de muerte, no para mirar por deporte. La L03 la menciona. Un huevo que se rompe dentro de la máquina se saca y se limpia la zona: pudre a los vecinos. No hace falta una lámpara cara. Hace falta no cocinar el huevo con una luz pegada cinco minutos."),
"<h2>Qué cabe de verdad en la máquina</h2>",
"""<div class="tabla"><table>
<thead><tr><th>Qué</th><th>Cifra que sí publicamos</th><th>Qué no prometer</th></tr></thead>
<tbody>
<tr><td>Días, gallina</td><td>21 (MSU y la L03)</td><td>Que nazcan todos ese día</td></tr>
<tr><td>Aire forzado</td><td>100 °F / 37,8 °C</td><td>Que la perilla coincida con el termómetro</td></tr>
<tr><td>Aire quieto</td><td>102 °F / 38,9 °C a la altura del embrión</td><td>Medir en la tapa y darlo por bueno</td></tr>
<tr><td>Humedad</td><td>58–60 % y luego ≥ 65 %</td><td>Un vasito de agua «porque sí»</td></tr>
<tr><td>Volteo</td><td>Hasta el día 18, varias veces al día</td><td>Seguir girando en el cierre</td></tr>
</tbody>
</table></div>""",
p("La ficha de la <a href='../producto/incubadora-24egg-dual.html'>incubadora 24Egg Dual</a> avisa que con huevo de gallina de tamaño normal caben unos 16 a 18, no siempre 24. La <a href='../producto/incubadora-wonegg-48.html'>WONEGG 48</a>, que el sitio envía a Estados Unidos, anda por unos 40 en la misma lógica. Cargar de más tapa los huevos del centro y el aire no pasa. Es mejor una tanda corta bien medida que una bandeja apretada."),
p("Codorniz, pato y pavo no usan esta hoja. La L03, con MSU, cita 17 días para codorniz, 28 para pato y 28 para pavo. La temperatura de la tabla de MSU tampoco es idéntica en pavo. No mezcles especies en la misma bandeja «porque hoy caben»."),
"<h2>Cuando empiezan a picar</h2>",
p("El día 18 se quita el volteo, se sube la humedad y se deja la tapa cerrada. El pollito pica, descansa y gira dentro del cascarón. Ayudarlo pronto desgarra vasos que todavía sangran. MSU explica que con poca humedad la membrana se seca y el pollito se pega. Por eso el cierre no es el momento de enseñar la máquina a las visitas."),
p("Cuando estén secos y de pie, pasan a la criadora, no al suelo del gallinero con las adultas. Esa mudanza está en <a href='primeros-dias-pollito.html'>primeros días del pollito</a>. Anota huevos cargados, claros, picados muertos y pollitos secos. Sin esas cuatro cifras, la próxima tanda repite el mismo error y le echas la culpa a la marca."),
p("La <a href='../calculadoras.html'>calculadora de fecha</a> suma 21 días al día de carga. Es una alarma, no un certificado de nacimiento. Si quieres saber si la tanda te cuadra con el alimento de las primeras semanas, pasa los pollitos que de verdad nacieron a la <a href='../calculadora.html'>calculadora de rentabilidad</a> y a la app <a href='../app.html'>Registro de pollos</a> cuando apuntes el lote. Los huevos que no nacieron no se cuentan como pollos vendibles."),
p("En clima caliente, la habitación de la incubadora también cuenta. MSU pide un cuarto ventilado y templado, y no publica un tope en grados para esa sala. Si el cuarto está muy caliente, la máquina no puede enfriar y el termómetro interno se va arriba aunque la perilla diga lo correcto. Un cuarto a la sombra, sin sol directo en la tapa, es parte del manejo. No es un detalle de decoración."),
])
