# -*- coding: utf-8 -*-
def p(text):
    return f"<p>{text}</p>\n"

G2 = {
"slug": "cuanto-come-una-gallina",
"title": "Cuánto come una gallina al día | Granja Rentable",
"description": "Gramos de alimento según si la gallina escarba o vive encerrada, con cifras de la FAO y de Hy-Line. Sin precios inventados.",
"crumb": "Cuánto come",
"h1": "Cuánto come una gallina al día",
"relacionadas": [
    ("Alimento para ponedoras por etapas", "guias/alimento-gallinas-ponedoras.html"),
    ("Cuánta agua bebe", "guias/agua-para-gallinas.html"),
    ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ("Pollos de engorde y los días", "guias/pollos-engorde-dias.html"),
    ("Calculadora", "calculadora.html"),
],
"faq": [
    ("¿Cuánto come una gallina ponedora al día?", "Una Hy-Line Brown, en la guía de estándares de la línea, tiene un consumo medio de 109,1 a 116,9 gramos diarios por ave entre las semanas 19 y 100. Es un objetivo con alimento completo y buen manejo. Una gallina que escarba no come eso: la FAO habla de un suplemento de grano de unos 35 gramos al día, encima de lo que ya encuentra."),
    ("¿Cuánto come al mes?", "Multiplica el gramo diario por 30 y por el número de gallinas vivas, no por las que compraste. Con 110 gramos diarios, una ave come unos 3,3 kilos en 30 días. El precio del saco lo pones tú en la calculadora: aquí no hay precio de concentrado."),
    ("¿La gallina criolla come lo mismo?", "No. Si sale al patio, parte del día come insectos, hierba y sobras. El suplemento de grano del ejemplo de la FAO, unos 35 gramos, no alcanza para una ponedora comercial encerrada, y 110 gramos de concentrado sobran si ya comió fuera."),
    ("¿El pollo de engorde come igual?", "No. Un pollo Ross 308 come poco los primeros días y mucho más cerca del día 35 o 42. Esas cifras están en la guía de días de engorde, tomadas de los objetivos de Aviagen de 2022. No uses la ración de la ponedora para el pollo, ni al revés."),
],
"fuentes": """<ul>
<li>FAO. <a href="https://www.fao.org/4/y5169e/y5169e04.htm">Small-scale poultry production. Feed resources and feeding</a>. Suplemento de unos 35 g de grano por gallina y día en muchos sistemas de aldea.</li>
<li>Hy-Line. <a href="https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/Brown/BRN%20STD%20ENG.pdf">Hy-Line Brown Performance Standards</a>. Consumo medio diario (semanas 19 a 100): 109,1–116,9 g por ave.</li>
<li>Aviagen. <a href="https://en.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf">Objetivos de rendimiento del pollo de engorde Ross 308 (2022, PDF en inglés)</a>. Consumo del pollo de engorde, distinto al de la ponedora.</li>
</ul>
<p>El costo sale en la <a href="../calculadora.html">calculadora</a>, con el precio de tu pueblo.</p>""",
"html": "",
}
G2["html"] = "".join([
p("La pregunta «cuánto come una gallina» no tiene un solo número. Depende de si escarba, de si es una línea de postura encerrada y de si ya está poniendo o todavía es pollita. Esta página separa esas situaciones con cifras publicadas. No inventa el precio del saco ni los kilos que «deberías» comprar en México, Colombia o Perú: eso lo mides tú."),
p("Si das de menos, la gallina deja de poner antes de verse flaca. Si das de más y el alimento se moja en el suelo, pagas ratones y hongos. Por eso conviene pesar la comida una semana, no fiarse de la lata «de siempre». La <a href='../calculadora.html'>calculadora de rentabilidad</a> usa los kilos que tú anotes. La app <a href='../app.html'>Registro de pollos</a> sirve para no perder esa cuenta cuando salga de la prueba."),
"<h2>Dos sistemas, dos cantidades</h2>",
p("En el pueblo, la gallina sale, picotea y vuelve. La FAO, en el capítulo de alimento de la avicultura a pequeña escala, dice que en la mayoría de los sistemas tradicionales de aldea se da un suplemento de grano de unos 35 gramos por gallina y día. Ese grano no es toda la dieta: se suma a insectos, semillas y desperdicios. Si el patio está seco y no hay casi nada que escarbar, 35 gramos no mantienen la puesta. La misma fuente dice que en la época seca el alimento del campo no alcanza para producir, solo para mantener."),
p("En una jaula, un corral de piso o un gallinero donde no salen, la gallina no escarba. Ahí el comedero es toda la comida. Hy-Line publica, para la Brown, un consumo medio diario de 109,1 a 116,9 gramos por ave entre las semanas 19 y 100. Es el objetivo de la línea con las dietas que ellos recomiendan. En un patio caliente, con un alimento distinto, el número se mueve. No es una deuda que la gallina tenga que cumplir."),
p("El curso, en la <a href='../lecciones/l01.html'>L01</a>, recuerda que el alimento es cerca del 75 % del costo de producción, según la <a href='https://www.fao.org/4/Y4628E/y4628e03.htm'>guía de producción de huevo de la FAO</a>. Por eso un error de 20 gramos por ave, repetido en 30 gallinas y en 30 días, son muchos kilos. 20 gramos × 30 aves × 30 días = 18 kilos. Si no pesas, no ves esos 18 kilos."),
"<h2>Cómo medirlo en tu gallinero</h2>",
p("Elige siete días seguidos. Por la mañana pesa lo que pones en el comedero. Al día siguiente, antes de rellenar, pesa lo que sobró, incluso lo que puedas recoger limpio del suelo. La resta es lo que desapareció. Divide entre las gallinas que comieron ese día, no entre las que tenías el mes pasado. Si una se murió el miércoles, no la cuentes el jueves."),
p("Anota también si llovió, si hizo un calor que las dejó jadeando o si el comedero amaneció vacío. Un día vacío no significa que «comen poco»: significa que se acabó y pasaron hambre el resto de la jornada. Un día con mucho sobrante tampoco significa generosidad: el alimento fermentado se tira y no cuenta como comida útil."),
p("Haz la cuenta en gramos, no en «puños» ni en latas. Una lata de sardina no pesa lo mismo llena de maíz que llena de harina. Si no tienes báscula de cocina, pide prestada una o usa la de la tienda una sola vez para calibrar tu recipiente: llénalo, pésalo y anota «esta lata rasa son X gramos de este alimento». El alimento cambia de densidad si cambias de marca."),
"<h2>Pollita, puesta y muda</h2>",
p("La pollita come menos que la gallina que ya pone, y además come para crecer. No le des la ración de una adulta «para que se adelante». Tampoco la dejes a media ración para ahorrar: llega chica a la semana 20 y el huevo sale tarde o pequeño. La guía de <a href='alimento-gallinas-ponedoras.html'>alimento por etapas</a> separa crianza y puesta. La de <a href='criar-gallinas-ponedoras.html'>cómo criarlas</a> dice en qué momento esperar el primer huevo, con el calendario de la FAO."),
p("Cuando está en plena puesta, el calcio y la proteína importan tanto como el peso del bulto. Un maíz solo, aunque sean 110 gramos, no sustituye un alimento de postura. La cáscara se forma de noche. Si a la gallina solo le queda grano, el huevo puede salir con cáscara fina. Eso no se corrige duplicando el maíz. Se corrige con un alimento que ya traiga el calcio, o con el criterio de un veterinario o de un zootecnista. Aquí no hay fórmula casera ni dosis de conchuela."),
p("En la muda, muchas gallinas comen y casi no ponen. Seguir dándoles la ración de pico de puesta encarece un mes flojo. Bajarles la comida hasta pasar hambre tampoco adelanta el plumaje. Observa cresta, peso y huevos de esa semana antes de cambiar el saco. Si varias dejan de comer, no es muda: mira <a href='enfermedades-gallinas-que-mirar.html'>qué anotar si se enferman</a> y llama al veterinario."),
"<h2>Tabla para no mezclar cifras</h2>",
"""<div class="tabla"><table>
<thead><tr><th>Situación</th><th>Cifra publicada</th><th>Qué no hacer</th></tr></thead>
<tbody>
<tr><td>Aldea, escarban y reciben grano</td><td>Unos 35 g de grano al día, además de lo que encuentran (FAO)</td><td>Creer que con 35 g vive una ponedora encerrada</td></tr>
<tr><td>Hy-Line Brown en postura, alimento completo</td><td>109,1–116,9 g diarios de media, semanas 19 a 100</td><td>Usarlo como meta de una criolla suelta</td></tr>
<tr><td>Pollo de engorde Ross 308</td><td>El consumo diario sube con la edad; ver la guía de días</td><td>Dejarle el saco de postura o el de la gallina</td></tr>
</tbody>
</table></div>""",
p("El agua va con la comida. Una ponedora puede beber hasta un cuarto de litro al día, según la FAO. Si el bebedero se seca, come menos aunque el comedero esté lleno. La guía de <a href='agua-para-gallinas.html'>agua</a> está al lado de esta. En calor, revisa el agua a mediodía, no solo al amanecer."),
"<h2>Del gramo al saco, sin precio inventado</h2>",
p("Ejemplo con números públicos, no con precios. Diez Hy-Line en el objetivo medio, tomando 113 gramos como punto dentro del rango 109–117, comen 1,13 kilos al día y unos 34 kilos en 30 días. Si tu báscula dice 90 o 130, usa tu báscula. El rango de la guía no manda sobre el comedero."),
p("Esos 34 kilos pueden ser menos de un saco o más de uno, según el saco sea de 40 o de 50 kilos. No compramos ni recomendamos una marca. Cuando tengas el precio del saco en tu ciudad, divídelo entre los kilos y multiplica por 34. Esa multiplicación es la que va en la calculadora, junto con los huevos que de verdad recogiste, no con los 476 del catálogo de la ISA que cita la L01."),
p("Si el lote escarba, no hagas la cuenta de 113 gramos. Haz la de lo que suplementas. Si das 35 gramos de maíz a 10 gallinas, son 350 gramos al día y unos 10,5 kilos al mes, más lo que encuentren. Si el patio no da nada en la seca, esa cuenta se queda corta y la puesta cae, como advierte la FAO. Entonces toca suplementar más o tener menos aves, no «aguantarlas» flacas."),
p("Pesa también el desperdicio. El alimento bajo la percha, mezclado con caca, no se vuelve a servir. Si cada día tiras un puño, súmalo al costo aunque no haya llegado al buche. Un comedero a la altura del lomo, lleno a la mitad y no hasta el borde, tira menos. Eso está dicho para pollos en la <a href='../lecciones/l04a.html'>L04A</a> y sirve igual para que la gallina no escarbe el concentrado al suelo."),
p("Guarda la hoja de los siete días. Dentro de un mes, si la puesta baja, vas a querer saber si comieron menos o si el problema es otro: luz, muda, calor o enfermedad. Sin el papel, todo parece culpa del saco nuevo. La <a href='luz-gallinas-ponedoras.html'>luz</a> y la <a href='criar-gallinas-ponedoras.html'>crianza</a> cierran el cuadro."),
])

G3 = {
"slug": "pollos-engorde-dias",
"title": "Pollos de engorde: en cuántos días | Granja Rentable",
"description": "Días y pesos objetivo del Ross 308 en 2022, y por qué en el patio no salen igual. Sin precios ni promesa de venta.",
"crumb": "Días de engorde",
"h1": "Pollos de engorde: en cuántos días están listos",
"relacionadas": [
    ("Cuántos pollos por metro", "guias/pollos-por-metro.html"),
    ("Primeros días del pollito", "guias/primeros-dias-pollito.html"),
    ("Lección L04A", "lecciones/l04a.html"),
    ("Lección L04B", "lecciones/l04b.html"),
    ("Negocio de pollos", "guias/negocio-pollos-rentable.html"),
],
"faq": [
    ("¿En cuántos días sale un pollo de engorde?", "En los objetivos del Ross 308 de 2022, el lote mixto llega a unos 2.296 gramos el día 35 y a unos 2.998 gramos el día 42, con buen manejo y el alimento que la guía supone. Aviagen advierte que el clima, el alimento local y el sistema bajan esa marca. En patio, mucha gente vende entre las 5 y las 8 semanas, que es el rango que la lección L01 llama «sprint»."),
    ("¿El pollo campero tarda lo mismo?", "No. La lección L02 separa el pollo campero: al menos 1 m² de parque y 56 días o más. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). No se compara con el Ross a los 35 días."),
    ("¿Cuánto alimento come hasta el día 42?", "En la misma tabla del Ross 308, el consumo acumulado por ave viva es de unos 3.211 gramos al día 35 y de unos 4.586 gramos al día 42. La conversión que publican ese día 42 es 1,531, e incluye el peso inicial y no descuenta la mortalidad."),
    ("¿Puedo sacarlos el día que yo quiera?", "Puedes, si el peso y el comprador cuadran. Sacarlos muy pronto deja kilos en la mesa. Dejarlos «una semana más porque así pesan más» también gasta alimento: del día 35 al 42 el objetivo suma unos 700 gramos de peso y más de un kilo de comida acumulada. La cuenta se hace con tus precios en la calculadora."),
],
"fuentes": """<ul>
<li>Aviagen. <a href="https://en.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf">Objetivos de rendimiento del pollo de engorde Ross 308 (2022, PDF en inglés)</a>. Peso y consumo «as-hatched». La guía dice que son objetivos con buen manejo y que el resultado local puede ser menor.</li>
<li>Lecciones <a href="../lecciones/l01.html">L01</a>, <a href="../lecciones/l04a.html">L04A</a> y <a href="../lecciones/l02.html">L02</a> del curso, para el calendario de 5 a 8 semanas, la crianza y el campero de 56 días.</li>
</ul>
<p>No describimos cómo sacrificar. El peso y el día son para planear el lote. El manejo fino está en el curso.</p>""",
"html": "",
}
G3["html"] = "".join([
p("«¿En cuántos días están los pollos?» se responde con un peso, no con un calendario de feria. Un pollo de línea de engorde puede estar gordo a las cinco semanas en una nave bien llevada, y flaco a las ocho en un patio frío o con alimento flojo. Aquí están los objetivos públicos del Ross 308 en 2022 y lo que el curso ya enseña. No hay precio de pollo vivo ni de concentrado: esos los pones en la <a href='../calculadora.html'>calculadora</a>."),
p("Aviagen presenta esas tablas como lo que se puede lograr con buen manejo, el alimento recomendado y un clima que no extreme. Dice con claridad que la materia prima local, el calor y la economía del sistema dejan el promedio por debajo. Si alguien te promete los 3 kilos del catálogo en un corral de tierra, está vendiendo el PDF, no tu lote."),
"<h2>Qué dice la tabla del Ross 308</h2>",
p("Los objetivos de 2022, lote mixto (machos y hembras juntos), pesan en granja, con comida en el intestino. El día 0 arrancan en 44 gramos. El día 7 andan por 213 gramos, con unos 166 gramos de alimento acumulado por ave viva. El día 21 pasan el kilo: 1.012 gramos, y ya llevan unos 1.155 gramos comidos. El día 35 están en 2.296 gramos, con 3.211 gramos de alimento acumulado y una conversión de 1,399. El día 42 están en 2.998 gramos, con 4.586 gramos comidos y una conversión de 1,531."),
p("La conversión incluye el peso del pollito al llegar y no resta los muertos. Si se te murieron ocho de cien, tu conversión real es peor que la del papel, porque el alimento de los muertos no se convirtió en pollo vendido. Por eso se anotan las bajas el día que ocurren. La app <a href='../app.html'>Registro de pollos</a> está hecha para eso; mientras sigue en prueba, vale el cuaderno."),
"""<div class="tabla"><table>
<thead><tr><th>Día</th><th>Peso objetivo</th><th>Alimento acumulado por ave viva</th><th>Conversión publicada</th></tr></thead>
<tbody>
<tr><td>7</td><td>213 g</td><td>166 g</td><td>0,780</td></tr>
<tr><td>21</td><td>1.012 g</td><td>1.155 g</td><td>1,142</td></tr>
<tr><td>35</td><td>2.296 g</td><td>3.211 g</td><td>1,399</td></tr>
<tr><td>42</td><td>2.998 g</td><td>4.586 g</td><td>1,531</td></tr>
</tbody>
</table></div>""",
p("Esos cuatro días alcanzan para planear. La tabla completa, día por día, está en el PDF de Aviagen enlazado al final. No la copies como promesa en un anuncio de venta."),
"<h2>Por qué en el patio tardan más</h2>",
p("La lección <a href='../lecciones/l01.html'>L01</a> llama al engorde un sprint de 5 a 8 semanas y cita, como orientación de catálogo y no de patio, unos 2,2 kilos al día 35 y unos 2,9 al día 42. Esas cifras redondas coinciden con el orden de la tabla de arriba. El patio se sale de la tabla cuando la cama está húmeda, el pollito pasó frío la primera noche o el alimento no es el de las fases."),
p("La <a href='../lecciones/l04a.html'>L04A</a> resume el arranque que Ross enseña en el curso: el día de llegada el aire cerca de 30 °C y luego una bajada gradual, alimento de arranque los primeros días, crecimiento después y acabado al final. Si los tienes a todos con el mismo saco de «pollos» desde el día 1 hasta el 42, no estás en el objetivo del PDF. Los primeros días y la criadora están en <a href='primeros-dias-pollito.html'>pollitos de un día</a>."),
p("El espacio también come días. La <a href='../lecciones/l04a.html'>L04A</a>, que cita a Cobb, sitúa la nave abierta cerca de 30 kilos por metro cuadrado. A 2,5 kilos, son unos 12 pollos por metro. Si metes el doble, no «aprovechas»: se mojan, comen peor y salen desparejos. El campero, en la L02 y la L04A, pide al menos 1 metro cuadrado de parque y 56 días o más. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). No lo vendas como pollo de 35 días."),
"<h2>Cómo decidir el día sin adivinar</h2>",
p("Pesa una muestra cada semana, no al ojo. Diez pollos, siempre a la misma hora, sin escoger los más bonitos. Si a los 21 días el promedio está muy por debajo del kilo, no se recupera «dejándolos otra semana» sin cambiar cama, agua y comida. El retraso de la tercera semana suele venir de la primera. La L04A pide mirar el buche a las dos horas y a las veinticuatro de llegados: si no comieron al principio, el día 42 no perdona."),
p("Pregunta al comprador qué peso quiere, antes de encender la criadora. Un asadero que pide 1,8 kilos no necesita el objetivo del día 42. Un cliente que pide «el pollo grande» y no dice kilos te va a regatear el día de la entrega. Anota el peso pactado. Resta los muertos. Multiplica el alimento que de verdad compraste, no el del PDF, por el precio del saco. Eso es el negocio, y está explicado en <a href='negocio-pollos-rentable.html'>si el negocio es rentable</a>, otra vez sin cifras de ganancia inventadas."),
p("Del día 35 al 42 el objetivo suma unos 700 gramos de peso y el alimento acumulado pasa de 3,2 a 4,6 kilos. Esa semana solo conviene si el kilo extra se paga. En calor, el pollo come peor y bebe más. No lo fuerces con más densidad para «cumplir la fecha del cliente». Mejor vender un día distinto que entregar un lote jadeando."),
"<h2>Lo que no es esta guía</h2>",
p("No decimos cómo matar, desplumar ni eviscerar. No damos días de vacuna ni nombres de productos. La <a href='../lecciones/l04b.html'>L04B</a> habla de amoniaco, bioseguridad y de cuándo llamar al veterinario. Si hay muchos tristes, no esperes al día 42 para «ver si llegan». Separar enfermos y avisar es parte de llegar a ese día con pollos vivos."),
p("Cobb 500 es la otra línea que la L01 nombra junto al Ross. No copiamos aquí una tabla de Cobb que no estamos citando número a número. Si crías Cobb, abre la guía de esa línea del año en que compras el pollito y compara con tu báscula, igual que con el Ross. Las marcas cambian el objetivo. Tu cuaderno no."),
p("Cuando cierres el lote, anota día, peso promedio, kilos de alimento y número de vivos. Esas cuatro cifras valen más que cualquier video de «pollos en 30 días». Si el próximo lote no mejora una de las cuatro, cambia una sola cosa: la cama, la hora de llegada o el alimento. Cambiar las cuatro a la vez no enseña nada."),
])

# HowTo steps for incubation, shared by HTML and JSON-LD
INC_STEPS = [
("Elige huevos limpios y no los guardes de más", "Usa huevos fértiles, limpios y sin grietas. La FAO, al hablar de reproductoras en explotaciones más grandes, recomienda no guardar más de siete días, en un cuarto fresco de 15,5 a 17 °C y cerca de 75 % de humedad relativa. No incubes huevos del suelo ni muy sucios."),
("Estabiliza la máquina antes de cargar", "Enciende la incubadora y espera a que la temperatura deje de bailar. Mississippi State pide 100 °F (37,8 °C) en incubadora de aire forzado durante todo el periodo, y 102 °F (38,9 °C) en una de aire quieto, midiendo a la altura del embrión. Una variación breve de menos de medio grado Fahrenheit (unos 0,3 °C) se tolera; MSU advierte que muchos embriones mueren si se sostienen a 105 °F (40,6 °C) durante 30 minutos."),
("Controla la humedad y voltea hasta el día 18", "MSU mantiene 58 a 60 % de humedad relativa (bulbo húmedo cerca de 85–87 °F, unos 29,4–30,6 °C) hasta tres días antes del nacimiento, y sube al menos a 65 % (bulbo húmedo cerca de 89–90 °F, unos 31,7–32,2 °C) en el cierre. Voltea varias veces al día y deja de voltear el día 18. No abras la tapa esos últimos tres días si puedes evitarlo: se pierde humedad."),
("Espera al día 21 y no ayudes a la fuerza", "El periodo de la gallina es 21 días. MSU recuerda que un calor sostenido adelanta el nacimiento y un frío sostenido lo atrasa, y que en los dos casos nacen menos. Un pollito que no sale no se despega a tirones. Anota cuántos huevos entraron y cuántos pollitos se secaron vivos."),
]
