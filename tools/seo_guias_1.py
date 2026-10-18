# -*- coding: utf-8 -*-
"""Cuerpos de las guías 1 a 4. Los enlaces son relativos a /guias/."""

def p(text):
    return f"<p>{text}</p>\n"

G1 = {
"slug": "criar-gallinas-ponedoras",
"title": "Cómo criar gallinas ponedoras | Granja Rentable",
"description": "Pasos para criar gallinas ponedoras en casa: pollita, comida, agua, luz, nidos y salud. Para Latinoamérica y España, sin cifras inventadas.",
"crumb": "Criar ponedoras",
"h1": "Cómo criar gallinas ponedoras",
"relacionadas": [
    ("Cuánto come una gallina al día", "guias/cuanto-come-una-gallina.html"),
    ("Horas de luz para que pongan", "guias/luz-gallinas-ponedoras.html"),
    ("Gallinero para ponedoras", "guias/gallinero-para-ponedoras.html"),
    ("Alimento por etapas", "guias/alimento-gallinas-ponedoras.html"),
    ("Lección L01 del curso", "lecciones/l01.html"),
],
"faq": [
    ("¿A qué edad empieza a poner una gallina?", "En la guía de producción de huevo de la FAO, las aves de líneas de puesta suelen empezar entre la semana 20 y la 21. Una gallina criolla de aldea puede tardar más: un ejemplo de la FAO en Etiopía sitúa la madurez cerca de los siete meses. No es una fecha fija para tu patio."),
    ("¿Hace falta un gallo para que haya huevos de comer?", "No. La gallina pone sin gallo. Esos huevos no están fecundados y sirven para comer. El gallo hace falta si quieres pollitos. La relación de gallos y gallinas está en la guía de este sitio."),
    ("¿Cuántos huevos pone una gallina criolla?", "La FAO, en su manual de avicultura a pequeña escala, usa como ejemplo una gallina indígena con unos 30 huevos al año, y describe un caso en Etiopía de unos 36 huevos al año en tres nidadas. La FAO no da un rango de 20 a 30: da esos 30 y esos 36. Una línea comercial, con alimento completo y luz, pone mucho más, y esa cifra de catálogo no es la del patio."),
    ("¿Puedo mezclar pollitos con gallinas adultas?", "Mejor no. Las adultas pican a los pequeños y les contagian parásitos que ellas ya toleran. Cría la pollita aparte hasta que tenga tamaño para defenderse, con agua y comida que las grandes no se lleven."),
],
"fuentes": """<ul>
<li>FAO. <a href="https://www.fao.org/4/Y4628E/y4628e03.htm">Egg production</a>. Inicio de puesta hacia las semanas 20–21, luz de 16 a 17 horas en naves cerradas, y hasta un cuarto de litro de agua al día.</li>
<li>FAO. <a href="https://www.fao.org/4/y5169e/y5169e.pdf">Small-scale poultry production</a>. Ejemplo de unos 30 huevos al año en una gallina indígena; unos 36 huevos al año en un caso de Etiopía; suplemento de unos 35 g de grano por gallina y día cuando escarban.</li>
<li>Hy-Line. <a href="https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/Brown/BRN%20STD%20ENG.pdf">Hy-Line Brown Performance Standards</a>. Consumo medio diario de 109,1 a 116,9 g por ave entre las semanas 19 y 100. Es un objetivo de la línea, no una promesa de patio.</li>
<li>Lección <a href="../lecciones/l01.html">L01</a> del curso, que resume esas diferencias entre línea comercial y patio.</li>
</ul>
<p>Los precios del huevo y del alimento no van aquí: cámbialos en la <a href="../calculadora.html">calculadora</a>.</p>""",
"html": "",
}

G1["html"] = f"""
{p("Esta guía es para quien quiere huevos en casa en México, Colombia, Perú, Ecuador, Venezuela, Argentina, Bolivia, Guatemala o España. No es un manual de una nave de miles de aves. Sirve para un lote pequeño: desde unas pocas gallinas en el patio hasta un gallinero de decenas. Si todavía no decidiste si te conviene el huevo, la carne o la genética, empieza por la <a href='../lecciones/l01.html'>lección L01</a> y por la <a href='../guia-empezar.html'>guía para elegir camino</a>.")}
{p("Criar ponedoras es una carrera larga, no un ciclo de seis semanas. La gallina tarda meses en poner el primer huevo y, si come y vive bien, sigue varios meses más. El dinero entra despacio, casi cada día, y el alimento se compra también casi cada día. Por eso la cuenta se hace antes de comprar las aves. La <a href='../calculadora.html'>calculadora de rentabilidad</a> deja esa cuenta en tu navegador, con los precios que tú escribes. Aquí no hay precios de huevo ni de concentrado: cambian según la ciudad y la semana.")}
<h2>Qué ave te conviene</h2>
{p("Hay tres puntos de partida. La pollita de un día sale barata de comprar y cara de criar: necesita calor, alimento fino y semanas de espera. La pollona ya criada, cerca de empezar a poner, cuesta más y ahorra ese tiempo. La gallina adulta ya pone, pero no sabes cuántos meses le quedan ni si viene sana. En un primer lote, mucha gente de patio se arrepiente de mezclar edades. Un solo grupo, de la misma edad, se vigila mejor.")}
{p("La línea cambia el resultado. Hy-Line, ISA o Lohmann ponen muchos huevos si comen alimento completo y tienen las horas de luz de su guía. La <a href='../lecciones/l01.html'>L01</a> cita objetivos de ficha, no de patio: ISA, unos 476 huevos por gallina alojada entre las semanas 18 y 100; Lohmann, unos 324 hasta la semana 72. No son garantía con calor, grano solo o aves sueltas. La FAO usa como ejemplo unos 30 huevos al año en una gallina indígena, y un caso en Etiopía de unos 36 en tres nidadas. ")}
{p("Para comer en casa suele encajar una criolla o doble propósito. Para vender cada semana, la línea de postura pide alimento completo y gallinero que cierre. Las líneas del curso están en <a href='../razas.html'>razas citadas</a> y el contexto de patio, en <a href='razas-gallinas-ponedoras.html'>razas de ponedoras</a>.")}
<h2>Antes de que lleguen</h2>
{p("Prepara el sitio antes del viaje de las aves. Un gallinero mojado, sin perchas y con el comedero en el suelo, se llena de huevos sucios y de gallinas enfermas en la primera semana. La guía de <a href='gallinero-para-ponedoras.html'>cómo hacer el gallinero</a> recorre techo, sombra, nidos y cierre contra perros, zorros, gatos y robos. La <a href='../guia-espacio.html'>guía de espacio</a> copia las densidades de la lección L02 para que no aprietes a las aves «porque caben».")}
{p("El agua tiene que estar puesta el día uno. La FAO dice que una ponedora puede beber hasta un cuarto de litro al día. En calor, en la costa o en un patio sin sombra, bebe más y deja de poner si el bebedero se vacía a mediodía. Cómo medirlo está en <a href='agua-para-gallinas.html'>cuánta agua bebe una gallina</a>. La comida del primer día también tiene que estar: no esperes a «ver si comen hierba». Si van a vivir encerradas, el alimento tiene que cubrir lo que ya no escarban. Los gramos orientativos están en <a href='cuanto-come-una-gallina.html'>cuánto come una gallina al día</a> y las etapas, en <a href='alimento-gallinas-ponedoras.html'>alimento para ponedoras</a>.")}
{p("Si llegan pollitas de un día, van a criadora y no con las adultas. El arranque está en <a href='primeros-dias-pollito.html'>pollitos de un día</a>. No les des meses de alimento de engorde: engorda y no prepara la puesta.")}
<h2>De la pollita al primer huevo</h2>
{p("La FAO sitúa el inicio de la puesta de las líneas de huevo entre la semana 20 y la 21, y dice que el mejor tramo dura algo más de un año. Eso es un calendario de ave mejorada, con comida y luz controladas. La gallina de aldea del ejemplo etíope de la FAO madura cerca de los siete meses. En tu patio puede caer en medio de esos dos extremos. Anota la fecha en que llegaron.")}
{p("Durante la crianza, la pollita crece hueso y músculo. Si le falta comida, llega flaca a la puesta y pone huevos chicos o se para. Si le sobra energía y no se mueve, llega gorda y también se atrasa. Revisa el comedero cada día: vacío a media mañana significa que faltó ración; lleno y apelmazado desde hace dos días significa desperdicio. Un grupo parejo se ve sin pesar a todas.")}
{p("La luz empuja la puesta. En una nave cerrada, la FAO recomienda subir el día artificial hasta 16 o 17 horas y no bajarlo mientras ponen. En un gallinero abierto del trópico, el día ya es largo una parte del año. Ahí la misma guía dice que dos o tres horas de luz al anochecer pueden alargar la puesta. No dejes un foco encendido toda la noche «por si acaso»: el descanso también cuenta, y un foco sobre la cama calienta y seca mal el aire. El detalle está en <a href='luz-gallinas-ponedoras.html'>horas de luz</a>.")}
{p("El nido se pone antes del primer huevo, no después de encontrar huevos en el suelo. La lección L02, resumida en la guía de espacio, habla de un nidal cada cuatro o cinco gallinas en patio, y de un nidal cada siete en la norma de suelo que cita. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). Un nido oscuro, con viruta o paja seca y más bajo que la percha, invita a poner ahí. Si la percha es más cómoda que el nido, duermen en el nido, lo ensucian y al día siguiente el huevo sale manchado.")}
<h2>El día a día cuando ya ponen</h2>
{p("Recoge los huevos por la mañana y, si hace calor, otra vez por la tarde. Un huevo al sol dentro del gallinero se cocina por fuera y se echa a perder por dentro. No laves el huevo que se va a guardar si la cáscara está limpia: el lavado abre poros. El huevo sucio de caca se aparta y no se vende como limpio. Apunta cada día cuántos huevos salieron y cuántas gallinas hay. Sin esas dos cifras no sabes si el lote va bien o si tres gallinas cargan con todas.")}
{p("Cáscara blanda o una gallina que puja no se arreglan con un remedio casero ni con una dosis improvisada. Si está caída o no come, llama al veterinario. Qué anotar antes de la llamada está en <a href='enfermedades-gallinas-que-mirar.html'>qué mirar si se enferman</a>.")}
{p("El gallo no hace que haya más huevos de comer. Hace que algunos huevos traigan pollito. Si no vas a incubar, puedes tener solo gallinas. Si quieres huevo fértil, mira <a href='gallinas-por-gallo.html'>cuántas gallinas por gallo</a>. Un gallo de más pelea, hiere a las hembras y no sube la postura. Un gallo joven con demasiadas gallinas deja huevos claros.")}
{p("La cama o el piso se mantienen secos. Debajo del bebedero casi siempre se forma barro. Ese barro huele a amoniaco y es donde más se pegan los parásitos de la caca, como la coccidiosis de los jóvenes. Cambia ese tramo, no todo el gallinero, el día que lo veas húmedo. La ficha de <a href='../enfermedades/coccidiosis.html'>coccidiosis</a> explica las señales en los pollitos. En adultas el cuadro suele ser más suave, y aun así contagian a los chicos.")}
<h2>Calor, altura y patio</h2>
{p("En calor fuerte la gallina jadea y abre las alas: no suda. El manual de la FAO advierte que aguantan mal por encima de unos 40 °C, según la humedad, y que una nave de más de 8 metros de ancho ventila mal si solo depende del aire. Sombra real y bebedero fresco importan más que cerrar el gallinero con block sin ventana.")}
{p("En altura, de madrugada hace frío aunque a mediodía queme el sol. La pollita se amontona si la criadora no está a la temperatura del termómetro, a la altura del ave. Si escarban fuera, el suplemento de la FAO ronda los 35 gramos de grano por gallina y día, encima de lo que ya encuentran. Una Hy-Line encerrada tiene un objetivo de 109 a 117 gramos de alimento completo. No uses una cifra para el otro sistema.")}
<h2>Cómo saber si el lote va bien</h2>
<div class="tabla"><table>
<thead><tr><th>Señal</th><th>Qué suele indicar</th><th>Qué hacer primero</th></tr></thead>
<tbody>
<tr><td>Huevos casi todos los días, cresta roja, caca formada</td><td>El grupo está comiendo y bebiendo</td><td>Sigue anotando huevos y bajas</td></tr>
<tr><td>Poca puesta y cresta pálida</td><td>Puede ser muda, poca luz, poca comida, parásitos o enfermedad</td><td>Revisa luz, comedero y <a href="enfermedades-gallinas-que-mirar.html">qué mirar</a></td></tr>
<tr><td>Huevo de cáscara blanda</td><td>Calcio, calor o un problema de puesta</td><td>No improvises dosis. Veterinario si se repite</td></tr>
<tr><td>Gallinas dormidas en el nido</td><td>La percha no les gusta o no hay suficientes nidos</td><td>Percha más alta que el nido y nido a la sombra</td></tr>
<tr><td>Una gallina apartada, sin comer</td><td>Puede estar enferma o picoteada</td><td>Sepárala y llama al veterinario si no come</td></tr>
</tbody>
</table></div>
{p("Anota bajas, huevos y sacos de alimento. Con eso la calculadora deja de ser un juego y pasa a ser tu granja. La app <a href='../app.html'>Registro de pollos</a> está pensada para anotar el lote desde el celular. Todavía no está en la tienda de aplicaciones: en la página puedes pedir la prueba cerrada si tienes correo de Gmail. Mientras tanto, un cuaderno vale.")}
{p("Si vas a incubar reemplazos, pasa a <a href='incubar-huevos-de-gallina.html'>incubar huevos de gallina</a> solo con un lote sano. Incubar huevos de aves enfermas reparte el problema. Y si la puesta no paga el alimento, no compres más gallinas para repartir el costo: la FAO recuerda que, cuando la comida no alcanza, conviene menos aves en producción que muchas a media ración.")}
"""
