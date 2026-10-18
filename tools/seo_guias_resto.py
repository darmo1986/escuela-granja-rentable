# -*- coding: utf-8 -*-
"""Cuerpos de las guías 5 a 14. Los enlaces del html son relativos a /guias/."""

def p(text):
    return f"<p>{text}</p>\n"

G5 = {
"slug": "razas-gallinas-ponedoras",
"title": "Razas de gallinas ponedoras | Granja Rentable",
"description": "Criolla, doble propósito e híbridas como ISA Brown y Lohmann Brown, con cifras de la FAO y de la L01. Sin promesas de patio.",
"crumb": "Razas ponedoras",
"h1": "Razas de gallinas ponedoras",
"relacionadas": [
    ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ("Alimento por etapas", "guias/alimento-gallinas-ponedoras.html"),
    ("Gallinero para ponedoras", "guias/gallinero-para-ponedoras.html"),
    ("Lección L01 del curso", "lecciones/l01.html"),
    ("Calculadora", "calculadora.html"),
],
"faq": [
    ("¿La gallina criolla pone lo mismo que una ISA Brown?", "No. La FAO, en el manual de avicultura a pequeña escala, usa como ejemplo una gallina indígena con unos 30 huevos al año, y describe un caso en Etiopía de unos 36 huevos al año en tres nidadas. La L01 del curso cita, como objetivo de ficha y no de patio, unos 476 huevos por gallina alojada de la ISA Brown entre las semanas 18 y 100. Son sistemas distintos."),
    ("¿Hy-Line, ISA y Lohmann son la misma gallina?", "No. Son tres líneas comerciales de postura que la lección L01 nombra juntas: Hy-Line Brown, ISA Brown y Lohmann Brown. Se parecen en el trabajo que se les pide, no en ser la misma ave. El objetivo de huevos que el curso copia de la ficha no es intercambiable: aquí citamos el de la ISA y el de la Lohmann, cada uno con sus semanas."),
    ("¿Cuántos huevos pone una Leghorn o una Rhode Island?", "Esta página no lo dice, porque ese número no sale del apodo. Leghorn, Rhode Island o Plymouth Rock son nombres que la gente busca. Los huevos los publica la guía de esa población, del año y del manejo en que se midió. Copiar un número de memoria y pegarlo a la criolla del vecino mezcla dos aves."),
    ("¿Me conviene la híbrida para huevos de la casa?", "Depende de si puedes darle alimento completo, agua y las horas de luz de una ponedora, y de si el huevo es para la mesa o para vender. La híbrida sin ese manejo no cumple la ficha. La criolla con patio y poca suplementación se parece más al ejemplo de la FAO. La cuenta del alimento va en la calculadora, con tus precios."),
],
"fuentes": """<ul>
<li>FAO. <a href="https://www.fao.org/4/y5169e/y5169e.pdf">Small-scale poultry production</a>. Ejemplo de unos 30 huevos al año en una gallina indígena, y unos 36 huevos al año en un caso de Etiopía, en tres nidadas.</li>
<li>Lección <a href="../lecciones/l01.html">L01</a> del curso. Objetivos de ficha: ISA Brown, unos 476 huevos por gallina alojada entre las semanas 18 y 100; Lohmann Brown, unos 324 hasta la semana 72. También nombra Hy-Line Brown.</li>
<li>Fichas del sitio en <a href="../razas.html">razas citadas</a>, con las mismas cifras de la lección y el aviso de que el catálogo no es el patio.</li>
</ul>
<p>El precio del huevo y del saco no está en la raza. Se escribe en la <a href="../calculadora.html">calculadora</a>.</p>""",
"html": "",
}
G5["html"] = "".join([
p("En el mercado de México, Colombia, Perú, Ecuador, Guatemala o España la palabra raza se usa para cosas distintas. A veces es la gallina del patio, criolla o indígena, la que escarba y se echa clueca. A veces es un ave doble propósito, pedida para huevo y para carne a la vez. Y a veces es una híbrida comercial de postura: Hy-Line Brown, ISA Brown o Lohmann Brown, las tres que nombra la <a href='../lecciones/l01.html'>lección L01</a>. Esta guía separa esos tres grupos. No pone un número de huevos al lado de un apodo solo porque suena conocido."),
p("El nombre no es un contrato. Una cartulina que diga ponedora no dice cuántos huevos vas a recoger en tu clima, con tu alimento y con tus horas de luz. Las cifras que sí caben aquí son pocas y ajenas: las de la FAO para la gallina indígena de los ejemplos, y las de ficha que el curso ya publicó para ISA y Lohmann. Lo demás se lee en la guía de esa población, no se inventa en el corral."),
"<h2>Criolla o indígena</h2>",
p("La FAO, en el manual de avicultura a pequeña escala, usa como ejemplo una gallina indígena con unos 30 huevos al año. En el mismo material describe un caso en Etiopía de unos 36 huevos al año, repartidos en tres nidadas. No es el promedio de tu pueblo ni una meta para cobrar. Es un ejemplo de ave de aldea, que se echa clueca, que cría y que no vive como una nave de postura."),
p("Esa gallina encaja cuando el huevo es de la casa, el patio da algo que escarbar y no vas a comparar el canasto con un catálogo. En la costa, en el altiplano o en un solar de ciudad el número se mueve: calor, perros, meses secos y la costumbre de incubar cambian el año. Si la dejas clueca, esos días no pone. Contar huevos de comer y huevos que se echó a incubar como si fueran lo mismo es la forma más fácil de discutir con el vecino."),
p("La L01 resume el patio tradicional, citando a la FAO, en un orden bajo de huevos al año frente a la línea comercial. Para el detalle de cómo criarla, sigue en <a href='criar-gallinas-ponedoras.html'>cómo criar gallinas ponedoras</a>. Allí están el nido, el agua y la luz, que pesan más que el color de la pluma."),
"<h2>Doble propósito</h2>",
p("Doble propósito quiere decir que el lote se mira por dos lados: huevos y carne, o huevos y un ave que pese para la olla. No es una híbrida de postura ni tampoco, por sí solo, el ejemplo indígena de la FAO. En ferias y grupos de compra el nombre se estira. Dos vendedores pueden decir doble propósito y entregar aves que no comparten ni el tamaño ni la puesta."),
p("Por eso esta página no publica un promedio de huevos para la doble propósito. El número lo da la guía de esa población, del criadero que la seleccionó o del ensayo donde se midió. El apodo no lo reemplaza. Si te venden una gallina con un número redondo y no hay guía, año ni manejo, estás comprando un relato. Pide por escrito de qué ave se trata y no mezcles ese relato con los 30 del ejemplo de la FAO ni con la ficha de la ISA."),
p("En la práctica de patio, mucha gente en Colombia, Perú o México quiere esta ave porque perdona mejor un manejo irregular que la híbrida y pone más atención al huevo que un pollo de engorde. Eso es una razón de manejo, no una cifra. Si el alimento completo no entra en tu semana, dilo antes de encargar pollitas de línea. La <a href='alimento-gallinas-ponedoras.html'>guía de alimento</a> explica por qué el maíz solo no sustituye la dieta de una ponedora encerrada."),
"<h2>Híbridas comerciales de la L01</h2>",
p("Hy-Line Brown, ISA Brown y Lohmann Brown son líneas de postura. La L01 las agrupa y copia objetivos de ficha, no de patio. Para la ISA Brown, el curso cita unos 476 huevos por gallina alojada entre las semanas 18 y 100. Para la Lohmann Brown, unos 324 hasta la semana 72. No son el mismo tramo de semanas ni la misma forma de contar, así que no se restan una de otra para coronar una ganadora."),
p("Hy-Line Brown está en la misma lección y en las fichas de <a href='../razas.html'>razas citadas</a>. Aquí no le pegamos otro objetivo de huevos: el que corresponda se lee allí, en la ficha de la línea, y se trata igual que los otros dos. Es un objetivo con el alimento y el manejo que el proveedor supone. Calor húmedo, grano solo, oscuridad de más o un gallinero sin nido lo bajan, y nadie te debe la diferencia."),
p("La híbrida casi no se echa clueca. Si quieres pollitos de ella, no cuentes con la cloquez como en la criolla. El huevo de comer sale sin gallo. El huevo para incubar es otro plan, y la relación de gallos está en <a href='gallinas-por-gallo.html'>cuántas gallinas por gallo</a>. Meter un gallo para que ponga más es un mito: el gallo no fabrica huevos de mesa."),
"<h2>Nombres que la gente busca</h2>",
p("Leghorn, Rhode Island y Plymouth Rock aparecen en chats, en anuncios y en la memoria de quien tuvo gallinas de niño. Esta guía no les asigna huevos por año. La gente las busca por el nombre, y el número de huevos lo da la guía de esa población, no el apodo. Una Leghorn de un catálogo viejo y una gallina colorada del mercado pueden compartir una palabra y no compartir la puesta."),
"""<div class="tabla"><table>
<thead><tr><th>Grupo</th><th>Qué es</th><th>Cifra que sí citamos</th><th>Qué no hacer</th></tr></thead>
<tbody>
<tr><td>Criolla o indígena</td><td>Ave de aldea, a menudo clueca</td><td>FAO: ejemplo de unos 30 huevos al año; unos 36 en un caso de Etiopía, en tres nidadas</td><td>Compararla con la ficha de una híbrida</td></tr>
<tr><td>Doble propósito</td><td>Se mira huevo y carne</td><td>La de la guía de esa población, si existe</td><td>Inventar un promedio porque el nombre suena a medio camino</td></tr>
<tr><td>ISA Brown</td><td>Híbrida de postura, citada en la L01</td><td>Unos 476 huevos por gallina alojada, semanas 18 a 100</td><td>Prometerlo en un patio con grano solo</td></tr>
<tr><td>Lohmann Brown</td><td>Híbrida de postura, citada en la L01</td><td>Unos 324 huevos hasta la semana 72</td><td>Restarla de la ISA como si el calendario fuera el mismo</td></tr>
<tr><td>Hy-Line Brown</td><td>Híbrida de postura, citada en la L01</td><td>Está en la lección y en las fichas del sitio</td><td>Pegarle aquí un número que esta página no está citando</td></tr>
<tr><td>Leghorn, Rhode Island, Plymouth Rock</td><td>Nombres muy buscados</td><td>Ninguna en esta guía</td><td>Usar el apodo como si fuera un conteo de huevos</td></tr>
</tbody>
</table></div>""",
"<h2>Cómo elegir sin pelear con el catálogo</h2>",
p("Escribe para qué quieres el ave antes de pagar el encargo. Huevo de la casa, huevo para vender cada semana, o ave que también pese para comer, no se resuelven con la misma pollita. Si vendes, la híbrida te pide alimento completo y un gallinero que cierre. Si no vas a sostener ese costo, el ejemplo de la FAO se parece más a lo que vas a ver. El costo no se adivina: los precios de tu ciudad se escriben en la <a href='../calculadora.html'>calculadora de rentabilidad</a>."),
p("Pregunta la edad, si ya puso, y si el lote es de una sola línea. Mezclar criollas adultas con pollitas híbridas complica el comedero y las peleas. Un grupo de la misma edad se anota mejor. La app <a href='../app.html'>Registro de pollos</a> sirve para no perder huevos y bajas; mientras sigue en prueba cerrada, el cuaderno vale igual."),
p("Cuando lleguen, no discutas con la ficha el primer mes. Anota fecha, número de aves vivas y huevos del día. A las pocas semanas sabrás si estás cerca del ejemplo de aldea o si el manejo aguanta una línea comercial. Si la puesta no aparece, revisa comida, luz y salud antes de cambiar de raza. Muchas veces el nombre era lo de menos. El curso, desde la <a href='../curso.html'>portada del curso</a>, ordena ese camino sin venderte una marca de gallina."),
])

G6 = {
"slug": "negocio-pollos-rentable",
"title": "Negocio de pollos: ¿es rentable? | Granja Rentable",
"description": "Criar pollos para vender: el alimento pesa en el costo y las bajas empeoran la conversión. El precio lo pones tú.",
"crumb": "Negocio de pollos",
"h1": "Negocio de pollos: ¿es rentable?",
"relacionadas": [
    ("Pollos de engorde y los días", "guias/pollos-engorde-dias.html"),
    ("Pollos por metro cuadrado", "guias/pollos-por-metro.html"),
    ("Primeros días del pollito", "guias/primeros-dias-pollito.html"),
    ("Lección L04A", "lecciones/l04a.html"),
    ("Calculadora", "calculadora.html"),
],
"faq": [
    ("¿Es rentable criar pollos?", "Puede salir o no salir. La L01 recuerda que el alimento es cerca del 75 % del costo de producción, según la <a href='https://www.fao.org/4/Y4628E/y4628e03.htm'>guía de producción de huevo de la FAO</a>. Si ese saco está caro frente a lo que te pagan por el ave viva, el lote se aprieta aunque el pollo crezca. Aquí no hay una ganancia prometida: el precio del alimento y el del pollo los escribes tú en la calculadora."),
    ("¿Qué números del Ross 308 sirven para la cuenta?", "Como ejemplo de cuenta, los objetivos del Ross 308 de 2022 ponen el día 42 en 2.998 g de peso y 4.586 g de alimento acumulado por ave viva, con una conversión de 1,531. Aviagen los publica como meta con buen manejo. No son el peso que tu patio tiene que cumplir ni un ingreso."),
    ("¿La mortalidad cambia la conversión?", "Sí, la empeora. El alimento que comió un pollo que se murió no se convierte en kilos vendidos. La conversión del PDF no descuenta tus bajas. Si anotas muertos y sacos de verdad, tu conversión sale peor que 1,531 aunque los vivos se parezcan a la tabla."),
    ("¿Esta guía sirve para una rosticería?", "No. Asar y vender pollo cocinado es otro oficio, con otro local y otros permisos. Aquí se habla de criar para vender el ave, no de montar un puesto de pollos asados."),
],
"fuentes": """<ul>
<li>Lección <a href="../lecciones/l01.html">L01</a>. El alimento es cerca del 75 % del costo de producción, según la <a href="https://www.fao.org/4/Y4628E/y4628e03.htm">guía de producción de huevo de la FAO</a>. El engorde se plantea ahí como un ciclo corto, no como una promesa de ganancia.</li>
<li>Aviagen. <a href="https://en.aviagen.com/assets/Tech_Center/Ross_Broiler/RossxRoss308-BroilerPerformanceObjectives2022-EN.pdf">Objetivos de rendimiento del pollo de engorde Ross 308 (2022, PDF en inglés)</a>. Día 42: 2.998 g de peso y 4.586 g de alimento acumulado por ave viva; conversión 1,531. Son objetivos, no un resultado de patio.</li>
<li>Lección <a href="../lecciones/l04a.html">L04A</a>, para el arranque del pollito, que es donde muchas bajas se deciden.</li>
</ul>
<p>El precio del kilo y del saco se carga en la <a href="../calculadora.html">calculadora</a>. Esta página no los trae.</p>""",
"html": "",
}
G6["html"] = "".join([
p("Criar pollos para vender es una cuenta de kilos, días y aves vivas. No es un lema. En México, Colombia, Perú, Ecuador o Bolivia el mismo ciclo puede verse muy distinto según lo que cueste el saco esa semana y según lo que pague quien recibe el pollo. Esta guía no dice que vas a ganar una cifra. Dice cómo armar la cuenta con números ya publicados y dónde pones tú el precio."),
p("La <a href='../lecciones/l01.html'>L01</a> recuerda que el alimento es cerca del 75 % del costo de producción, según la <a href='https://www.fao.org/4/Y4628E/y4628e03.htm'>guía de producción de huevo de la FAO</a>. Si el alimento se come esa parte del costo, equivocarse en el saco pesa más que equivocarse en el color del comedero. El resto de insumos existe, pero no tapa un alimento mal medido. Por eso el primer paso no es imprimir un anuncio de venta: es anotar sacos, bajas y el día en que de verdad salen las aves."),
"<h2>Criar para vender no es poner una rosticería</h2>",
p("Conviene separar oficios. Aquí se habla de criar el pollo y venderlo, por lo general vivo o recién salido del ciclo, según lo que pida tu comprador y lo que permita tu zona. Otra cosa es asar y vender pollo cocinado, en una rosticería o en un puesto de comida. Eso es otro trabajo: cocina, horario de atención al público, permisos del local y el cuidado de la comida lista. No lo mezcles con la conversión del lote. Esta página no enseña a asar ni a armar ese negocio."),
p("Tampoco describe cómo sacrificar. Si tu venta es en pie, el peso que importa es el de la báscula el día del trato. Si alguien más procesa, ese costo es de ese eslabón, no un número que esta guía vaya a inventar. El día y el peso objetivo del ciclo están en <a href='pollos-engorde-dias.html'>pollos de engorde: en cuántos días</a>."),
"<h2>Un ejemplo de cuenta con el Ross 308</h2>",
p("Los objetivos del Ross 308 de 2022, lote mixto, sirven aquí solo como ejemplo de cuenta. El día 42 la tabla pone 2.998 g de peso por ave y 4.586 g de alimento acumulado por ave viva. La conversión que publican ese día es 1,531. Aviagen presenta esas tablas como lo que se puede buscar con buen manejo, el alimento que la guía supone y un clima que no se salga. El patio, el calor de la costa o una cama húmeda no están obligados a copiar el PDF."),
p("La multiplicación, sin precios, se ve así. Cien aves vivas en ese objetivo pesarían 100 por 2.998 g, es decir 299.800 g, unos 299,8 kg en pie. El alimento acumulado de esas cien sería 100 por 4.586 g, es decir 458.600 g, unos 458,6 kg. La conversión 1,531 es la relación que el documento ya publica entre alimento y peso, con el peso inicial incluido. No es tu margen. El precio de esos kilos de alimento y el precio de esos kilos de pollo los escribes en la <a href='../calculadora.html'>calculadora</a>."),
"""<div class="tabla"><table>
<thead><tr><th>Dato del ejemplo</th><th>Qué dice la fuente</th><th>Qué haces tú</th></tr></thead>
<tbody>
<tr><td>Peso al día 42</td><td>2.998 g por ave en el objetivo Ross 308, 2022</td><td>Pesar tu muestra. No copiar el PDF si la báscula dice otra cosa</td></tr>
<tr><td>Alimento acumulado</td><td>4.586 g por ave viva hasta ese día</td><td>Sumar los sacos que de verdad compraste</td></tr>
<tr><td>Conversión publicada</td><td>1,531 ese día 42</td><td>Volver a calcularla con tus vivos y tus sacos</td></tr>
<tr><td>Parte del alimento en los insumos</td><td>Cerca del 75 % del costo de producción, FAO producción de huevo</td><td>No tratar el saco como un gasto menor</td></tr>
</tbody>
</table></div>""",
p("Esos 299,8 kg y esos 458,6 kg no son una meta de venta. Son la tabla multiplicada por cien para que se vea el tamaño de la cuenta. Si tu lote es de cuarenta, la misma lógica se encoge: no hace falta otro catálogo, hace falta tu número de vivos. Si el pollo a los 42 días pesa menos que 2.998 g, el alimento que ya compraste no se devuelve. Por eso se pesa una muestra cada semana, siempre a la misma hora, sin escoger los más bonitos."),
"<h2>La mortalidad empeora la conversión</h2>",
p("La conversión del papel no perdona sola a los muertos. Un pollo que comió y se murió el día 20 se llevó alimento que no vas a cobrar. Tu conversión real sale peor que 1,531 aunque los que llegan al día 42 se vean grandes. Anota la baja el día que ocurre, no el domingo en que haces memoria. La app <a href='../app.html'>Registro de pollos</a> está hecha para ese cuaderno; mientras no esté en la tienda de aplicaciones, el papel cumple."),
p("No hace falta inventar un porcentaje de bajas para asustar el plan. Hace falta contar las que tú tuviste. El denominador de tu cuenta son los vivos que vendes, no los pollitos que pagaste al llegar. Si repites el lote sin anotar, vas a discutir con el proveedor del pollito cuando el problema estuvo en la primera noche. El arranque está en <a href='primeros-dias-pollito.html'>primeros días del pollito</a> y en la <a href='../lecciones/l04a.html'>L04A</a>."),
"<h2>Densidad, días y el precio que no ponemos</h2>",
p("Meter más aves para repartir el costo suele mojar la cama y empeorar las bajas, que es justo lo que daña la conversión. La guía de <a href='pollos-por-metro.html'>pollos por metro cuadrado</a> copia las densidades de la L02 y de la L04A. Un corral apretado no vuelve rentable un saco caro. Alarga el problema y lo esconde hasta el día de la venta."),
p("Tampoco alargues el ciclo por costumbre. Del objetivo del día 35 al del día 42 el pollo come de más para ganar el peso que la tabla muestra en la otra guía. Esa semana solo se justifica si quien compra paga el kilo y si los animales siguen cabiendo en los kilos por metro. Si el comprador quería un ave más liviana, llegar a 2.998 g puede ser alimento de sobra."),
p("Cuando tengas tres números propios, abre la calculadora: kilos de alimento comprados, aves vivas al final y el peso que de verdad entregaste. Al lado, el precio del saco y el precio que te pagan, los de tu ciudad esta semana, no los de un video. Si la resta no alcanza, no se arregla repitiendo que el negocio es bueno. Se arregla cambiando una cosa: densidad, día de salida, proveedor del pollito o el alimento. Cambiar las cuatro a la vez no enseña. El <a href='../curso.html'>curso</a> deja el orden de ese ciclo en las lecciones de engorde, sin un resultado en dinero."),
])

G7 = {
"slug": "alimento-gallinas-ponedoras",
"title": "Alimento para gallinas ponedoras | Granja Rentable",
"description": "Pollita y puesta no comen igual. Maíz solo no alcanza. Gramos de la FAO y de Hy-Line, sin marcas ni dosis caseras.",
"crumb": "Alimento ponedoras",
"h1": "Alimento para gallinas ponedoras",
"relacionadas": [
    ("Cuánto come una gallina al día", "guias/cuanto-come-una-gallina.html"),
    ("Cuánta agua bebe", "guias/agua-para-gallinas.html"),
    ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ("Razas de ponedoras", "guias/razas-gallinas-ponedoras.html"),
    ("Curso gratis", "curso.html"),
],
"faq": [
    ("¿La pollita come el mismo alimento que la gallina que ya pone?", "No es la misma etapa. La pollita come para crecer hueso y músculo. La que ya pone come para mantenerse y para el huevo. El rango de 109,1 a 116,9 g de Hy-Line Brown es un consumo medio entre las semanas 19 y 100, no una ración de pollita. Darle a la chica la lógica de la adulta, o dejarla a media ración para ahorrar, la atrasa."),
    ("¿Basta con maíz?", "No, si la gallina no completa en el patio lo que el maíz no trae. El maíz es sobre todo energía. Una ponedora encerrada, con el comedero como única comida, necesita un alimento pensado para la puesta. Esta guía no trae una fórmula casera ni una dosis de calcio para mezclar en casa."),
    ("¿Por qué 35 gramos y también más de 100?", "Porque no son el mismo sistema. La FAO habla de unos 35 g de grano al día como suplemento cuando la gallina escarba. Hy-Line publica 109,1 a 116,9 g diarios de alimento, de media, entre las semanas 19 y 100, para la Brown con la dieta de su guía. Usar una cifra en el otro sistema deja el lote corto o tira comida."),
    ("¿Qué marca de concentrado conviene?", "Aquí no se recomienda ninguna marca ni ningún precio. En cada país el saco cambia de nombre. Lo que se compara es la etapa, pollita o puesta, y los gramos que de verdad desaparecen del comedero. El precio lo anotas tú si haces la cuenta en la calculadora."),
],
"fuentes": """<ul>
<li>FAO. <a href="https://www.fao.org/4/y5169e/y5169e.pdf">Small-scale poultry production</a> y el capítulo de alimento <a href="https://www.fao.org/4/y5169e/y5169e04.htm">Feed resources and feeding</a>. Suplemento de unos 35 g de grano por gallina y día cuando escarban.</li>
<li>Hy-Line. <a href="https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/Brown/BRN%20STD%20ENG.pdf">Hy-Line Brown Performance Standards</a>. Consumo medio diario de 109,1 a 116,9 g por ave entre las semanas 19 y 100.</li>
<li>Lección <a href="../lecciones/l01.html">L01</a>, que recuerda que el alimento es cerca del 75 % del costo de producción, según la <a href='https://www.fao.org/4/Y4628E/y4628e03.htm'>guía de producción de huevo de la FAO</a>.</li>
</ul>
<p>Cómo pesar la ración, sin marcas, está en <a href="cuanto-come-una-gallina.html">cuánto come una gallina al día</a>.</p>""",
"html": "",
}
G7["html"] = "".join([
p("El alimento de una ponedora cambia con la etapa y con el sistema. No es lo mismo una pollita que todavía crece que una gallina ya en puesta, ni una criolla que escarba en un patio de Colombia o de Perú que una Hy-Line encerrada con comedero como única fuente. Esta guía junta solo las cifras ya publicadas para no mezclarlas. No nombra marcas de concentrado y no pone precios de saco: cambian según la ciudad y la semana."),
p("La L01 recuerda que el alimento es cerca del 75 % del costo de producción, según la <a href='https://www.fao.org/4/Y4628E/y4628e03.htm'>guía de producción de huevo de la FAO</a>. Un error chico de gramos, repetido todos los días, mueve ese costo más que cualquier adorno del gallinero. Por eso se pesa. La forma de medir siete días está en <a href='cuanto-come-una-gallina.html'>cuánto come una gallina al día</a>. Aquí va el criterio de etapa, no la báscula paso a paso."),
"<h2>Pollita y puesta</h2>",
p("La pollita no está en puesta. Come para armar hueso, músculo y el cuerpo que después va a poner. Tratarla como adulta le carga una ración que no le toca, o al revés: dejarla corta para ahorrar la deja chica cuando llega la edad de poner. La FAO sitúa el inicio de la puesta de las líneas de huevo hacia las semanas 20 a 21, en la guía de producción de huevo. Hasta entonces el trabajo es crecer parejo, no llenar el nido."),
p("Cuando ya pone, el alimento mantiene a la gallina y arma el huevo. Hy-Line publica, para la Brown, un consumo medio diario de 109,1 a 116,9 g por ave entre las semanas 19 y 100. Es un objetivo de la línea con las dietas que ellos describen, no la ración de una pollita ni la de una criolla suelta. Si tu lote todavía no cumple esas semanas, no uses ese rango como vaso medidor."),
p("Tampoco pases meses con alimento de engorde. El pollo de carne y la ponedora no comparten fase ni calendario. Los gramos del Ross están en la guía de días de engorde y no se prestan. Un saco pensado para que un pollo salga en pocas semanas no es el plan de una gallina que va a poner muchos meses. Si solo consigues un saco en el pueblo, pregunta a un zootecnista o al veterinario qué etapa cubre. Esta página no completa esa fórmula."),
"<h2>Maíz solo no alcanza</h2>",
p("El maíz, el sorgo o el trigo que se consiguen en el mercado son, sobre todo, energía. Una gallina que sale y picotea insectos, hierba y restos puede completar parte de lo que el grano no trae. Una gallina encerrada no tiene ese complemento. Llenarle el comedero de maíz, aunque el peso del bulto se parezca al de un alimento de postura, no arma la misma dieta."),
p("La cáscara se forma de noche. Si el huevo sale blando o sin cáscara, no se arregla duplicando el maíz ni con una receta casera de conchuela medida a ojo. Esta guía no da dosis de calcio, ni gramos de cáscara molida, ni cucharadas de nada. El calcio va en un alimento ya formulado para puesta, o lo define quien te asesore con el lote delante. Improvisar una mezcla porque un video lo dijo es la forma rápida de gastar grano y seguir con el huevo flojo."),
p("Las sobras de cocina tampoco son un alimento de postura. Un poco de verdura o de arroz, en un patio que ya escarba, no sustituye el comedero de una línea comercial. Pan, sal y comida grasosa en cantidad ensucian el agua y atraen ratones. Si pruebas sobras, que sean pocas, frescas y fuera del alcance de los pollitos. Y no las cuentes como si fueran los 109 g de la ficha."),
"<h2>35 gramos no son 110</h2>",
p("La FAO, al hablar de alimento en sistemas de aldea, describe un suplemento de grano de unos 35 g por gallina y día, encima de lo que el ave ya encuentra escarbando. Ese número no mantiene a una ponedora comercial encerrada. Al revés, darle a una criolla suelta 110 g de concentrado porque lo viste en una ficha puede ser comida de más, desperdicio y un costo que el huevo del ejemplo indígena no paga."),
"""<div class="tabla"><table>
<thead><tr><th>Situación</th><th>Cifra publicada</th><th>Etapa</th></tr></thead>
<tbody>
<tr><td>Escarba y recibe grano</td><td>Unos 35 g de grano al día, además de lo que encuentra (FAO)</td><td>Suplemento, no dieta cerrada</td></tr>
<tr><td>Hy-Line Brown con alimento completo</td><td>109,1 a 116,9 g diarios de media</td><td>Semanas 19 a 100, no la pollita</td></tr>
<tr><td>Maíz como única comida de una encerrada</td><td>No hay una cifra que lo vuelva suficiente</td><td>Ni pollita ni puesta quedan cubiertas por energía sola</td></tr>
<tr><td>Pollo de engorde</td><td>Otra tabla, la del Ross en la guía de días</td><td>No se usa el saco de la ponedora ni al revés</td></tr>
</tbody>
</table></div>""",
p("En la época seca el campo rinde menos. La misma literatura de la FAO advierte que, cuando lo que se escarba no alcanza para producir, el ave mal suplementada se mantiene y no pone. Entonces no sirve repetir los 35 g como si fueran una ley. O se suplementa con un alimento que cubra la puesta, o se tienen menos aves. Estirar una ración corta entre más gallinas deja a todas a medias."),
"<h2>Cómo no tirar el saco</h2>",
p("Reparte la comida en un comedero a la altura del lomo, no hasta el borde. Lo que cae a la cama, mezclado con tierra, no se vuelve a servir. Ese desperdicio cuenta en el costo aunque no haya llegado al buche. Si el comedero amanece vacío, no comieron poco: pasaron hambre el resto del día y la puesta es la primera que avisa, a veces antes de que las veas flacas."),
p("El agua va pegada a esta historia. Con el bebedero seco comen menos. La guía de <a href='agua-para-gallinas.html'>cuánta agua bebe una gallina</a> está al lado. En calor de la costa revisa a mediodía. En altura, de noche, el alimento apelmazado por la humedad se tira: no se seca al sol para volver a darlo."),
p("Anota gramos y huevos de la semana, no el nombre del saco. Si cambias de presentación, pesa otra vez: la misma lata no pesa igual con maíz que con harina. La <a href='../calculadora.html'>calculadora</a> usa los kilos que tú escribas y el precio de tu pueblo. La <a href='razas-gallinas-ponedoras.html'>guía de razas</a> recuerda que la ficha de una híbrida supone este tipo de alimento, y que el ejemplo de 30 huevos de la FAO no. El <a href='../curso.html'>curso</a> ordena el camino desde la L01 si todavía estás decidiendo el lote."),
])

G8 = {
"slug": "primeros-dias-pollito",
"title": "Pollitos de un día: primeros días | Granja Rentable",
"description": "Temperatura y buche según la L04A: unos 30 °C al llegar, la bajada que resume la lección y el buche de Ross. No es consejo veterinario.",
"crumb": "Primeros días",
"h1": "Pollitos de un día: primeros días",
"relacionadas": [
    ("Pollos de engorde y los días", "guias/pollos-engorde-dias.html"),
    ("Pollos por metro cuadrado", "guias/pollos-por-metro.html"),
    ("Lección L04A", "lecciones/l04a.html"),
    ("Enfermedades: qué mirar", "guias/enfermedades-gallinas-que-mirar.html"),
    ("Curso gratis", "curso.html"),
],
"faq": [
    ("¿A qué temperatura llegan los pollitos?", "La L04A resume el arranque así: el aire, cerca de 30 °C el día de llegada, y luego una bajada. Día 3, unos 28 °C. Día 6, unos 27. Día 9, unos 26. Día 12, unos 25. La lección sigue hasta quedar cerca de 20 °C a partir del día 27. El termómetro se lee a la altura del pollito, no a la altura de tu cara."),
    ("¿Cómo sé si comieron en las primeras horas?", "La L04A, citando a Ross, pide mirar el buche: lleno en un 75 % de los pollitos a las 2 horas y en más del 95 % a las 24 horas. Se palpa con cuidado. Un buche lleno es comida y agua. Esta página no indica vitaminas ni ninguna dosis para compensar un buche vacío."),
    ("¿Qué significa que estén amontonados?", "En la L04A, amontonados es frío. Si se van a los bordes y jadean, es calor. Si se juntan todos de un solo lado, la lección lo lee como corriente de aire. Se corrige la temperatura o la entrada de aire. No se corrige con un producto."),
    ("¿Esto reemplaza al veterinario?", "No. Es un resumen de manejo que ya está en la lección. No es consejo veterinario, no es diagnóstico y no trae dosis. Si hay muchos caídos, no comen o aparecen muertos, anota lo que ves y llama al veterinario. La guía de qué mirar ayuda a ordenar esa llamada."),
],
"fuentes": """<ul>
<li>Lección <a href="../lecciones/l04a.html">L04A</a> y Aviagen, <a href="https://aviagen.com/assets/Tech_Center/Ross_Broiler/Aviagen-ROSS-Broiler-Handbook-EN.pdf">Manual del pollo de engorde Ross (PDF en inglés)</a> (la tabla por día es la de 2018). Aire cerca de 30 °C el día de llegada y bajada hasta unos 20 °C. Humedad del manual actual: 60–70 % hasta el día 3 y 50 % después. Amontonados es frío; en los bordes jadeando es calor; de un lado es corriente.</li>
<li>La misma L04A atribuye a Ross el buche lleno: 75 % a las 2 horas y más del 95 % a las 24 horas.</li>
<li>Ficha de <a href="../enfermedades/coccidiosis.html">coccidiosis</a>, porque la cama húmeda de los primeros días es parte del riesgo en los jóvenes. Sin tratamiento en esta guía.</li>
</ul>
<p>El calendario después del arranque está en <a href="pollos-engorde-dias.html">los días de engorde</a>.</p>""",
"html": "",
}
G8["html"] = "".join([
p("Esto no es consejo veterinario. Es lo que ya dice la <a href='../lecciones/l04a.html'>lección L04A</a> del curso, puesto en una página para quien recibe pollitos de un día en México, Colombia, Perú, Ecuador o España. No hay dosis de vitaminas, ni productos, ni una receta para revivir un lote frío. Si el pollito está caído, la salida es el veterinario, no un foro."),
p("Los primeros días deciden el peso de la tercera semana. Un pollito que no comió ni bebió al llegar no se pone al día solo porque el día 42 queda lejos. La guía de <a href='pollos-engorde-dias.html'>cuántos días tarda el engorde</a> sirve después. Antes hay que pasar esta ventana con el termómetro y con el buche, que son las dos lecturas que la lección pide."),
"<h2>La temperatura que resume la L04A</h2>",
p("La lección pone el aire cerca de 30 °C el día de llegada. No es la temperatura de la calle ni la del techo: es el aire donde están los pollitos. A partir de ahí la bajada que la L04A resume sigue así: día 3, unos 28 °C; día 6, unos 27; día 9, unos 26; día 12, unos 25; día 15, unos 24; día 18, unos 23; día 21, unos 22; día 24, unos 21; y desde el día 27, cerca de 20 °C. Se baja de a poco. Un salto brusco porque hizo calor a mediodía, y luego una noche fría de altura, los desordena."),
p("Prepara el sitio antes de que el transporte llegue. La L04A pide precalentar, no encender la fuente de calor cuando ya están en la caja. Si el piso está helado, el pollito pierde calor por las patas aunque el aire, a la altura de tu mano, se sienta tibio. Mide a la altura del ave. En la costa el problema de la primera tarde suele ser el exceso. En la sierra, el de la madrugada."),
"""<div class="tabla"><table>
<thead><tr><th>Momento que lista la L04A</th><th>Aire, en el resumen de la lección</th></tr></thead>
<tbody>
<tr><td>Día de llegada</td><td>Cerca de 30 °C</td></tr>
<tr><td>Día 3</td><td>Unos 28 °C</td></tr>
<tr><td>Día 6</td><td>Unos 27 °C</td></tr>
<tr><td>Día 9</td><td>Unos 26 °C</td></tr>
<tr><td>Día 12</td><td>Unos 25 °C</td></tr>
<tr><td>Día 15</td><td>Unos 24 °C</td></tr>
<tr><td>Día 18</td><td>Unos 23 °C</td></tr>
<tr><td>Día 21</td><td>Unos 22 °C</td></tr>
<tr><td>Día 24</td><td>Unos 21 °C</td></tr>
<tr><td>Día 27 en adelante</td><td>Cerca de 20 °C</td></tr>
</tbody>
</table></div>""",
p("Esta bajada es la tabla del Ross Handbook 2018 que resume la L04A. El manual actual da la temperatura según el peso vivo y supone 60–70 % de humedad relativa hasta el día 3 y 50 % después. La tabla no autoriza a cerrar el local hasta que falte el aire. La lección pide ventilación mínima siempre. Un cuarto sellado, con olor fuerte, no está tibio: está mal ventilado. Si no puedes medir, no inventes un aparato ni un producto. Corrige lo que sí ves en el comportamiento, que es la otra lectura de la misma lección."),
"<h2>Amontonados es frío, jadeo en el borde es calor</h2>",
p("La L04A lo deja en una frase que conviene memorizar. Amontonados, unos encima de otros, es frío. Repartidos en los bordes y jadeando, es calor. Juntos todos de un solo lado, es corriente. No hace falta discutir el termómetro si los pollitos ya contestaron. Mueve la fuente de calor, abre o cierra la entrada de aire, y vuelve a mirar a los quince minutos. El grupo tiene que quedar repartido, comiendo y bebiendo, no pegado a una esquina."),
p("En un patio abierto de tierra caliente, el mediodía empuja hacia el jadeo aunque la madrugada haya estado bien. Sombra y agua cuentan ese día. En un cuarto de block sin ventana, el frío de la noche y la falta de aire pueden juntarse. No tapes todas las rendijas con bolsa. La corriente se corta de un lado; el aire se renueva por otro."),
"<h2>El buche a las dos horas y a las veinticuatro</h2>",
p("La L04A, por Ross, pide buche lleno en el 75 % de los pollitos a las 2 horas de llegados y en más del 95 % a las 24 horas. El buche es el saquito del cuello. Lleno se siente redondeado, con comida y agua. Vacío se siente plano. Se mira una muestra, no solo el pollito que tienes más a mano. Si a las dos horas van por debajo de ese 75 %, todavía estás a tiempo de acercar agua y alimento y de corregir frío o calor. Si a las veinticuatro horas no pasas del 95 %, el arranque ya quedó corto."),
p("No se compensa un buche vacío con vitaminas. Esta guía no trae dosis, ni gotas, ni un producto del día uno. El pollito necesita llegar al agua y a la comida, con la temperatura de la lección. La L04A también recuerda agua y alimento cerca, para que no caminen de más en las primeras horas. Papel o bandeja donde lo vean ayuda más que un comedero alto que todavía no alcanzan."),
p("Cuenta cuántos revisaste y cuántos tenían buche lleno. Anótalo. Mañana no vas a acordarte del porcentaje. La app <a href='../app.html'>Registro de pollos</a> puede guardar esa nota cuando la uses; el cuaderno, hoy, alcanza. Si varios siguen vacíos y tristes, no esperes al día 7 para ver si reaccionan. Separa los caídos, revisa calor y llama al veterinario. Qué llevar anotado está en <a href='enfermedades-gallinas-que-mirar.html'>qué mirar si se enferman</a>."),
"<h2>Cama, agua y los que no deben mezclarse</h2>",
p("La cama seca es parte del arranque. Debajo del bebedero se forma un charco si el agua se riega. Ese húmedo, en pollitos, es el terreno del que habla la ficha de <a href='../enfermedades/coccidiosis.html'>coccidiosis</a>. Aquí no hay tratamiento. Hay una razón para nivelar el bebedero y cambiar el tramo mojado el mismo día. El agua se renueva. No se ofrece un remedio disuelto."),
p("No metas los pollitos con gallinas adultas. Las grandes pican, ocupan el comedero y arrastran parásitos que el pollito todavía no tolera. Un círculo o un cuarto aparte, con la temperatura de la tabla, es el lugar de esta semana. El espacio del lote, cuando ya crezcan, se calcula en <a href='pollos-por-metro.html'>pollos por metro</a>, no apretándolos el día uno para que quepan."),
p("Cuando cumplan la bajada de temperatura y el buche de las primeras horas, el trabajo sigue siendo diario: agua, comida, cama y bajas. El <a href='../curso.html'>curso</a> deja el resto del engorde en la L04A y en la L04B. Esta página no sustituye esas lecciones ni al veterinario. Si solo te llevas una idea, que sea esta: mide el aire a la altura del pollito, mira si están amontonados o jadeando en el borde, y cuenta buches a las dos horas y a las veinticuatro."),
])

G9 = {
"slug": "gallinero-para-ponedoras",
"title": "Gallinero para gallinas ponedoras | Granja Rentable",
"description": "El gallinero se adapta al clima. Refugio de noche, ancho de la nave y espacio de día, con cifras de la FAO y de la L02.",
"crumb": "Gallinero",
"h1": "Gallinero para gallinas ponedoras",
"relacionadas": [
    ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ("Horas de luz", "guias/luz-gallinas-ponedoras.html"),
    ("Cuánta agua bebe", "guias/agua-para-gallinas.html"),
    ("Lección L02", "lecciones/l02.html"),
    ("Curso gratis", "curso.html"),
],
"faq": [
    ("¿Cuánto espacio es el gallinero de noche?", "La FAO, en la guía de producción de huevo, habla de un refugio simple de noche de unos 0,1 m² por ave. Es un reparo para dormir, no el espacio de todo el día. De día, esta página usa las cifras que la L02 ya publicó y que están en la guía de espacio: en patio, 0,28 a 0,37 m² dentro y unos 0,93 m² fuera."),
    ("¿El gallinero cerrado sirve en clima húmedo y caliente?", "La misma guía de la FAO dice que el gallinero se adapta al clima y que, en calor húmedo, conviene un alojamiento abierto. Cerrar con block y sin aire, porque de noche refresca, deja el día invivible. Arriba de unos 40 °C las aves lo pasan mal, según la humedad, como resume el manual de pequeña escala."),
    ("¿Qué ancho puede tener una nave con ventilación natural?", "La FAO, en el manual de avicultura a pequeña escala, indica que las naves de ventilación natural no deberían pasar de unos 8 m de ancho. Más anchas, el aire del centro no se renueva solo. Si necesitas más aves, no se resuelve ensanchando esa nave sin otro sistema de aire."),
    ("¿Cuántos nidos y cuánta percha?", "La L02, copiada en la guía de espacio, da un nido cada 4 o 5 gallinas en patio y unos 20 a 25 cm de aseladero por ave. En la norma de suelo que la lección cita, como mucho 9 gallinas por m², un nido cada 7 y 15 cm de aseladero. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). No son planos de compra ni una lista de madera."),
],
"fuentes": """<ul>
<li>FAO. <a href="https://www.fao.org/4/Y4628E/y4628e03.htm">Egg production</a>. El alojamiento se adapta al clima; en calor húmedo conviene abierto; de noche, un refugio simple de unos 0,1 m² por ave.</li>
<li>FAO. <a href="https://www.fao.org/4/y5169e/y5169e.pdf">Small-scale poultry production</a>. Naves de ventilación natural no deberían pasar de unos 8 m de ancho. Las aves lo pasan mal por encima de unos 40 °C, según la humedad.</li>
<li>Lección <a href="../lecciones/l02.html">L02</a> y <a href="../guia-espacio.html">guía de espacio</a>. Patio: 0,28–0,37 m² dentro y unos 0,93 m² fuera. Suelo: como mucho 9 gallinas por m². Es norma de la UE aplicada en España; en Latinoamérica no rige.</li>
</ul>
<p>No hay precios de madera ni planos de compra. El manejo del día está en <a href="criar-gallinas-ponedoras.html">criar ponedoras</a>.</p>""",
"html": "",
}
G9["html"] = "".join([
p("El gallinero de ponedoras no es un modelo único para México, Colombia, Perú, la costa y la sierra. La FAO, en la guía de producción de huevo, dice que el alojamiento se adapta al clima. En calor húmedo conviene un gallinero abierto. En un lugar frío de madrugada hace falta reparo, sin convertir el día en un cuarto sin aire. Esta página copia esas ideas y las cifras de espacio que la L02 ya publicó. No trae planos para comprar ni precios de madera, de malla o de techo."),
p("Antes de clavar un poste, decide cuántas aves vas a tener y si salen de día. El refugio de noche y el patio de día no son el mismo metro. Confundirlos es la forma habitual de decir que caben y después encontrar huevos en el suelo, cama húmeda y gallinas que no entran a dormir."),
"<h2>De noche, un reparo; de día, otro espacio</h2>",
p("La FAO habla de un refugio simple de noche de unos 0,1 m² por ave. Sirve para dormir a cubierto, no para pasar el día encerradas ahí. Diez gallinas, en esa cuenta, son cerca de 1 m² de reparo nocturno. Eso no autoriza un cajón de un metro como única vivienda. De día, la <a href='../guia-espacio.html'>guía de espacio</a> ya publicó lo que dice la <a href='../lecciones/l02.html'>L02</a> para patio: 0,28 a 0,37 m² dentro y unos 0,93 m² fuera por ave."),
p("En la norma de suelo que cita la misma lección, el tope es de 9 gallinas por m² utilizable. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). Es un techo, no una meta para llenar. Más apretadas, la L02 lista estrés, peleas, huevos en el suelo y cama húmeda. Si tu lote es de patio y además sale, usa las cifras de patio. Si viven siempre dentro, no uses solo los 0,1 m² de la noche."),
"""<div class="tabla"><table>
<thead><tr><th>Qué mides</th><th>Cifra ya publicada</th><th>Qué no es</th></tr></thead>
<tbody>
<tr><td>Refugio de noche</td><td>Unos 0,1 m² por ave (FAO, producción de huevo)</td><td>No es el espacio de todo el día</td></tr>
<tr><td>Patio, dentro</td><td>0,28 a 0,37 m² por ave (L02)</td><td>No incluye solo el nido</td></tr>
<tr><td>Patio, fuera</td><td>Unos 0,93 m² por ave (L02)</td><td>No es un jardín simbólico de un paso</td></tr>
<tr><td>Suelo, norma citada</td><td>Como mucho 9 gallinas por m². Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…).</td><td>No es la densidad del pollo de engorde</td></tr>
<tr><td>Ancho con aire natural</td><td>No más de unos 8 m (FAO, pequeña escala)</td><td>No se gana aire solo alargando el techo</td></tr>
</tbody>
</table></div>""",
p("Mide el suelo útil, no el techo. Resta bebederos, nidos y el rincón donde nadie pisa porque gotea. Esos metros no cuentan como espacio de gallina. Anota el número y compáralo con la tabla antes de encargar más aves. La <a href='../calculadora.html'>calculadora</a> no dibuja el gallinero, pero sí muestra si el alimento de ese lote cabe en tu semana. Menos aves bien alojadas pesan menos que muchas apretadas."),
"<h2>Calor húmedo, ancho y los 40 °C</h2>",
p("En la costa o en un valle húmedo, un gallinero abierto, con techo que haga sombra y con aire que cruce, sigue la recomendación de la FAO. Las paredes de block hasta arriba, sin ventana, guardan el calor del día. La gallina no suda: jadea y abre las alas. Si a mediodía ya están así, falta sombra o falta aire, no falta una puerta más hermética."),
p("El manual de pequeña escala de la FAO dice que las naves de ventilación natural no deberían pasar de unos 8 m de ancho. En el centro de una nave más ancha el aire se queda. Si el lote crece, se piensa en otro cuerpo de edificio o en otra forma de ventilar, no en un solo techo cada vez más hondo. Esta guía no diseña esa obra ni cotiza materiales."),
p("El mismo manual advierte que lo pasan mal por encima de unos 40 °C, según la humedad. No es un permiso para ignorar los 35 si el bebedero está al sol. Es un aviso de que el calor fuerte, con humedad, no se arregla con más gallinas a la sombra de una lámina baja. Agua fresca y techo alto importan ese día. La guía de <a href='agua-para-gallinas.html'>agua</a> va con esta."),
"<h2>Nidos y perchas</h2>",
p("La L02, en el resumen de patio, da un nido cada 4 o 5 gallinas y 20 a 25 cm de aseladero por ave. En la norma de suelo que cita, un nido cada 7 y 15 cm de aseladero. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). El nido se pone antes del primer huevo. Oscuro, con paja o viruta seca, y más bajo que la percha: si la percha es peor cama que el nido, duermen ahí, lo ensucian y el huevo amanece manchado."),
p("La percha deja el pecho aireado y aparta a la gallina del piso húmedo de la noche. Un palo resbaloso o a distinta altura, sin espacio para que quepan todas, deja a las tímidas en el suelo. Esas son las que amanecen sucias. No hace falta un herraje especial. Hace falta que el palo esté firme, redondeado lo bastante para los dedos, y que todas quepan en los centímetros de la lección."),
p("En el trópico, la L02 orienta el eje este-oeste para el sol, en un sitio alto y drenado, con ventilación sin corrientes directas sobre las aves. La malla en los huecos frena gatos, perros y aves ajenas. Eso es bioseguridad de patio, no un plano de catálogo. El costo del poste lo ves en tu ferretería el día que compras. No lo publicamos aquí porque no sería tu precio."),
"<h2>Lo que se revisa cada semana</h2>",
p("Mira el suelo debajo del bebedero, el olor al agacharte y si hay huevos fuera del nido. Esas tres señales dicen si el gallinero está sirviendo. Un olor que pica es cama húmeda y poco aire, no un adorno. Cambia el tramo mojado. No esperes a cambiar todo el local el día que ya hay aves enfermas. La ficha de <a href='../enfermedades/coccidiosis.html'>coccidiosis</a> explica por qué el húmedo importa en los jóvenes; en adultas el cuadro suele ser otro, y aun así el piso mojado no ayuda."),
p("La luz del gallinero no se resuelve dejando un foco toda la noche. Las horas están en <a href='luz-gallinas-ponedoras.html'>horas de luz</a>. El cierre contra robos y animales es parte del gallinero tanto como el nido: un lote que se sale o que se lo lleva un perro no tiene puesta que anotar. El <a href='../curso.html'>curso</a>, en la L02, ordena estos metros antes de comprar las aves. Léela si el patio todavía es una idea y no una medida."),
])

G10 = {
"slug": "agua-para-gallinas",
"title": "Cuánta agua bebe una gallina | Granja Rentable",
"description": "Hasta un cuarto de litro al día en ponedoras, según la FAO, y 1,6 a 1,8 litros por kilo de alimento en engorde a 21 °C. Sin productos.",
"crumb": "Agua",
"h1": "Cuánta agua bebe una gallina",
"relacionadas": [
    ("Alimento para ponedoras", "guias/alimento-gallinas-ponedoras.html"),
    ("Cuánto come una gallina", "guias/cuanto-come-una-gallina.html"),
    ("Primeros días del pollito", "guias/primeros-dias-pollito.html"),
    ("Gallinero para ponedoras", "guias/gallinero-para-ponedoras.html"),
    ("Calculadora", "calculadora.html"),
],
"faq": [
    ("¿Cuánta agua bebe una gallina ponedora?", "La FAO, en la guía de producción de huevo, dice que una ponedora puede consumir hasta un cuarto de litro al día. Es un techo de esa guía, no la medida exacta de tu patio cada jornada. En calor bebe más y, si el bebedero se vacía a mediodía, deja de poner antes de que lo notes en el plumaje."),
    ("¿El pollo de engorde bebe igual?", "No se usa la misma frase. La L04A da, para engorde, 1,6 a 1,8 litros de agua por kilo de alimento a 21 °C. Va ligado a lo que comen, no a un vaso fijo por pollito. No copies el cuarto de litro de la ponedora al pollo, ni el litro por kilo de alimento a la gallina de patio."),
    ("¿Hay que echarle algo al agua?", "Esta guía no recomienda productos, vinagres, cloros en dosis ni vitaminas en el tanque. El pedido es agua limpia, que se pueda renovar, en un bebedero que no encharque la cama. Si el agua de tu pozo te preocupa, la valora un laboratorio o el veterinario, no un consejo de pasillo."),
    ("¿Cómo sé si están bebiendo?", "Mira el nivel a la misma hora dos días seguidos y mira la cama debajo. Si no baja el agua y el lote está raro, puede que no lleguen al bebedero o que esté sucio. Si baja de golpe y la cama está hecha lodo, se está regando, no necesariamente se está bebiendo todo."),
],
"fuentes": """<ul>
<li>FAO. <a href="https://www.fao.org/4/Y4628E/y4628e03.htm">Egg production</a>. Una ponedora puede consumir hasta un cuarto de litro de agua al día.</li>
<li>Lección <a href="../lecciones/l04a.html">L04A</a>. En engorde, 1,6 a 1,8 litros de agua por kilo de alimento a 21 °C. La lección también anota un aumento de cerca del 6,5 % por cada grado de más.</li>
</ul>
<p>El agua no se cotiza aquí. El alimento, que es el otro lado del bebedero, se carga en la <a href="../calculadora.html">calculadora</a>.</p>""",
"html": "",
}
G10["html"] = "".join([
p("Sin agua no hay puesta ni engorde, aunque el comedero esté lleno. Una gallina que no bebe come menos. Un pollito que no encuentra el agua en las primeras horas llega con el buche vacío a la revisión de la <a href='../lecciones/l04a.html'>L04A</a>. Esta guía separa dos cifras ya publicadas: la de la ponedora y la del pollo de engorde. No vende un bebedero, no nombra un producto y no dice cuántos mililitros de nada hay que echar al tanque."),
p("En un patio de México, Colombia, Perú o Ecuador el calor cambia el día más que la marca del recipiente. Lo que sirve es que el agua esté limpia, a la sombra, y que sobre cuando vuelvas a mirar. Lo que estorba es el charco debajo, porque moja la cama y esa cama es el problema de los jóvenes que describe la ficha de coccidiosis, sin que aquí haya un tratamiento."),
"<h2>La ponedora y el cuarto de litro</h2>",
p("La FAO, en la guía de producción de huevo, dice que una ponedora puede consumir hasta un cuarto de litro al día. Úsalo como techo de referencia, no como la ración que todas beben a las ocho de la mañana. Diez gallinas, en ese techo, son unos 2,5 litros al día. Veinte, unos 5 litros. Es una cuenta para no quedarte corto con el bidón, no una promesa de que vacíen el recipiente."),
p("Si a mediodía el bebedero está seco, el cuarto de litro no se cumplió: se acabó. En la costa y en un patio sin sombra pasa seguido cuando se llena solo al amanecer. La puesta baja con la sed, a veces el mismo día, y la cáscara se resiente con el calor. Vuelve a mirar al mediodía. En altura, el agua de la madrugada puede estar helada; la gallina bebe peor si está demasiado fría, igual que si está tibia y verde de algas."),
p("Ese cuarto de litro no incluye el desperdicio. Un bebedero que se balancea y riega puede vaciarse sin que el buche haya recibido tanto. Por eso se mira la cama. Si está hecha barro y el tanque bajó, parte del agua no se bebió. Corrige la altura y el nivel. La L04A, hablando de pollos, pide el borde del comedero a la altura del lomo; el bebedero de la gallina también tiene que quedar al alcance sin ser un plato en el piso."),
"<h2>El engorde: litros por kilo de alimento</h2>",
p("La L04A no da un vaso fijo para el pollo. Da una relación: 1,6 a 1,8 litros de agua por kilo de alimento a 21 °C. Si el lote come más, bebe más. Si come poco porque tuvo frío el primer día, el agua también se queda. No uses esta relación para la ponedora de patio ni uses el cuarto de litro de la FAO para cerrar la cuenta del Ross."),
p("La misma lección anota que el consumo de agua sube cerca de un 6,5 % por cada grado por encima de esa referencia. En un galpón a más de 21 °C el tanque se vacía antes. No hace falta una dosis para acompañar el calor: hace falta más agua limpia y sombra. Los primeros días del pollito, con el aire cerca de 30 °C, el agua se revisa junto con el buche. El detalle del arranque está en <a href='primeros-dias-pollito.html'>primeros días</a>."),
"""<div class="tabla"><table>
<thead><tr><th>Ave</th><th>Cifra publicada</th><th>Cómo usarla</th></tr></thead>
<tbody>
<tr><td>Ponedora</td><td>Hasta un cuarto de litro al día (FAO)</td><td>Techo de referencia. Revisa a mediodía si hace calor</td></tr>
<tr><td>Engorde a 21 °C</td><td>1,6 a 1,8 L de agua por kilo de alimento (L04A)</td><td>Va con lo que comen, no con un vaso igual para todas las edades</td></tr>
<tr><td>Engorde con más calor</td><td>Cerca de 6,5 % más de agua por cada grado (L04A)</td><td>Más agua limpia. No un producto en el tanque</td></tr>
<tr><td>Cama debajo del bebedero</td><td>No hay una cifra buena de charco</td><td>Si se encharca, se riega. Cambia ese tramo</td></tr>
</tbody>
</table></div>""",
"<h2>Limpia, y que no encharque</h2>",
p("El agua se ve. Si está turbia, con cama flotando o con algas, no es el agua de la guía: es un recipiente que no se lavó. Vacía, enjuaga y vuelve a llenar. Un bidón cerrado, a la sombra, se conserva mejor que una batea al sol donde también beben pájaros y se bañan las gallinas. El baño de tierra lo hacen en un rincón seco, no dentro del bebedero."),
p("Coloca el bebedero donde un golpe no lo vuelque y donde el goteo no caiga bajo la percha. La percha mojada ensucia pecho y patas, y el huevo del nido cercano amanece manchado. En el gallinero de ponedoras, ese detalle está junto al espacio: <a href='gallinero-para-ponedoras.html'>cómo es el local</a>. En engorde, un charco de la primera semana es justo el húmedo que quieres evitar. La ficha de <a href='../enfermedades/coccidiosis.html'>coccidiosis</a> está para leer las señales, no para elegir un frasco."),
p("No echamos cloro en una dosis, ni vinagre, ni suero, ni un sobre de vitaminas. La L04A menciona calidad del agua en la lección; interpretarla es trabajo de quien analiza el pozo, no de esta página. Si el agua sabe a sal o a hierro y las aves dejan de beber, cambia la fuente ese día y consulta. No completes el tanque con un remedio mientras tanto."),
"<h2>Anotar para no discutir</h2>",
p("Una forma simple: marca el nivel por la mañana y otra vez al anochecer, con el mismo número de aves. Si un día se vacía mucho antes, anota el calor y si hubo fuga. Si un día casi no baja y hay aves apartadas, anota eso también y mira <a href='enfermedades-gallinas-que-mirar.html'>qué anotar antes de llamar</a>. El agua quieta en un lote que antes bebía es una señal de manejo, no un diagnóstico."),
p("El alimento y el agua se mueven juntos. Los gramos están en <a href='cuanto-come-una-gallina.html'>cuánto come una gallina</a> y, por etapas, en <a href='alimento-gallinas-ponedoras.html'>alimento para ponedoras</a>. El precio del saco, si haces números del lote, va en la <a href='../calculadora.html'>calculadora</a>. El agua de la red o del pozo no la tasamos: en una finca es un costo real y en otra casi no se ve, y inventarlo sería un precio falso. El <a href='../curso.html'>curso</a> deja el agua del engorde dentro de la L04A, al lado de la temperatura."),
])

G11 = {
"slug": "luz-gallinas-ponedoras",
"title": "Horas de luz para gallinas ponedoras | Granja Rentable",
"description": "En nave cerrada, la FAO sube el día hasta 16 o 17 horas y no lo acorta en puesta. En el trópico abierto, 2 o 3 horas al anochecer.",
"crumb": "Horas de luz",
"h1": "Horas de luz para gallinas ponedoras",
"relacionadas": [
    ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ("Gallinero para ponedoras", "guias/gallinero-para-ponedoras.html"),
    ("Razas de ponedoras", "guias/razas-gallinas-ponedoras.html"),
    ("Lección L01", "lecciones/l01.html"),
    ("Curso gratis", "curso.html"),
],
"faq": [
    ("¿Cuántas horas de luz necesita una ponedora en nave cerrada?", "La FAO, en la guía de producción de huevo, recomienda subir el día artificial hasta 16 o 17 horas y no acortar ese día mientras dura la puesta. Bajar la luz a media campaña es una forma conocida de frenar el huevo. No es lo mismo que dejar el foco encendido las 24 horas."),
    ("¿Y si el gallinero es abierto y estoy en el trópico?", "La misma guía dice que, en nave abierta del trópico, dos o tres horas de luz al anochecer pueden subir la puesta un 20 o un 30 %. Es un puede, no un contrato. Si el día natural ya es largo, no sumes otras seis horas por tu cuenta ni dejes la luz toda la noche."),
    ("¿La luz de noche ayuda a que no se asusten?", "Un gallinero a oscuras total puede complicar que encuentren el aseladero al anochecer, pero la FAO no pide luz continua. Toda la noche encendida les quita el descanso y puede hacer que duerman donde no quieres, por ejemplo en el nido. Mejor el tramo corto del anochecer, si hace falta, y después oscuridad."),
    ("¿La criolla del patio necesita el mismo foco?", "No automáticamente. El ejemplo de gallina indígena de la FAO pone pocos huevos al año y no vive en una nave cerrada con día artificial. La luz de 16 a 17 horas es recomendación para el sistema de puesta que describe esa guía. El foco no convierte sola a la criolla en la ficha de una híbrida."),
],
"fuentes": """<ul>
<li>FAO. <a href="https://www.fao.org/4/Y4628E/y4628e03.htm">Egg production</a>. En nave cerrada, subir hasta 16–17 horas y no acortar el día durante la puesta. En nave abierta del trópico, 2–3 horas al anochecer pueden aumentar la puesta un 20–30 %.</li>
<li>Lección <a href="../lecciones/l02.html">L02</a>, que entre las condiciones del sitio anota unas 14 horas de luz para la puesta. No sustituye el texto de la FAO: es la cifra del curso para orientar el local.</li>
<li>Lección <a href="../lecciones/l01.html">L01</a>, que marca la luz como parte de la puesta junto con el calcio y el tipo de ave.</li>
</ul>
<p>El calendario completo de la crianza está en <a href="criar-gallinas-ponedoras.html">cómo criar gallinas ponedoras</a>.</p>""",
"html": "",
}
G11["html"] = "".join([
p("La luz no pone el huevo sola, pero sin las horas que la gallina necesita la puesta se frena aunque el comedero esté lleno. La FAO lo explica en la guía de producción de huevo con dos casos: la nave cerrada y la nave abierta del trópico. No son el mismo programa. Dejar un foco toda la noche no es ninguno de los dos. Esta página copia esas horas y no vende lámparas ni temporizadores."),
p("En México, Colombia, Perú, Ecuador o Centroamérica mucha gente tiene el gallinero abierto, no una nave ciega. El día natural ya cambia entre la costa, la sierra y la época de lluvias. Por eso se anota la hora en que oscurece de verdad en tu patio, no la de una ciudad de otro huso que viste en un video. El resto del manejo está en <a href='criar-gallinas-ponedoras.html'>cómo criar gallinas ponedoras</a>."),
"<h2>Nave cerrada: 16 o 17 horas, sin recortar</h2>",
p("En nave cerrada, la FAO recomienda subir el día artificial hasta 16 o 17 horas. Mientras las gallinas están en puesta, ese día no se acorta. Bajar de 16 a 12 porque el recibo de la luz asustó, o porque se fundió una lámpara y tardaste una semana, es un recorte. La puesta lo nota. Si vas a usar luz artificial, el programa tiene que ser estable, no un foco que a veces sí y a veces no."),
p("Subir hasta esas horas no quiere decir empezar el primer día con el máximo si las aves todavía son pollitas. El programa de crianza y el de puesta no se copian igual. La L01 marca la luz como pieza de la puesta, junto con el alimento, cuando el ave ya es ponedora. Si tus pollitas están creciendo, no les dejes un día eterno para adelantar el huevo a la fuerza. El <a href='../curso.html'>curso</a> separa esas etapas en la L01 y en la L02."),
p("La L02, al describir el sitio, anota unas 14 horas de luz para la puesta. Es la cifra del curso para orientar un gallinero, no un desmentido de las 16 o 17 de la FAO en nave cerrada. Léelas en su contexto: una es la lista corta de la lección y la otra es el techo del día artificial en nave cerrada. No promedies a 15 para quedar bien con las dos. Elige el sistema que de verdad tienes y sigue la fuente de ese sistema."),
"<h2>Nave abierta en el trópico: dos o tres horas al anochecer</h2>",
p("En nave abierta del trópico, la FAO dice que dos o tres horas de luz al anochecer pueden subir la puesta un 20 o un 30 %. El verbo es pueden. No es un 25 % garantizado en tu lote, ni una razón para anunciar más huevos antes de tener el comedero y la salud en orden. Si ya venden el huevo con ese aumento puesto en el precio, están vendiendo la frase de la FAO, no tu canasto."),
p("Esas horas van al anochecer, para alargar el día que ya tuvieron de sol, no a las tres de la mañana en un golpe de luz, y no repartidas en despertares. Cuando se cumplan las dos o tres horas, se apaga. El descanso también cuenta. Un gallinero iluminado toda la noche deja a las aves sin un tramo oscuro claro. Algunas se acuestan en el nido, lo ensucian y al día siguiente el huevo sale sucio. El nido y la percha se explican en <a href='gallinero-para-ponedoras.html'>el gallinero</a>."),
"""<div class="tabla"><table>
<thead><tr><th>Sistema</th><th>Qué dice la FAO</th><th>Qué no hacer</th></tr></thead>
<tbody>
<tr><td>Nave cerrada</td><td>Subir hasta 16 o 17 horas</td><td>Acortar el día durante la puesta</td></tr>
<tr><td>Nave abierta en el trópico</td><td>2 o 3 horas al anochecer pueden subir la puesta un 20–30 %</td><td>Tomar el porcentaje como promesa de tu patio</td></tr>
<tr><td>Cualquiera</td><td>Hay un día y después hay noche</td><td>Dejar la luz encendida toda la noche</td></tr>
<tr><td>Nota de la L02</td><td>Unas 14 horas en la lista del sitio</td><td>Promediarla con las 16–17 y llamar a eso un estándar nuevo</td></tr>
</tbody>
</table></div>""",
"<h2>Cómo llevarlo sin un aparato caro</h2>",
p("Anota la hora en que enciendes y la hora en que apagas. Un temporizador ayuda a no olvidar; no hace falta una marca ni un precio, y aquí no los hay. Si lo haces a mano, que sea todos los días a la misma hora, también el domingo. Una hora de más un día y cero al siguiente es un programa inestable. Las gallinas no negocian el foco con tu horario de trabajo."),
p("La luz tiene que alcanzar para que vean comer y para que suban a la percha, no para alumbrar el patio del vecino. Un foco encima de la cama, pegado a las plumas, calienta de más y no sustituye la ventilación. En calor húmedo, sumar calor con la lámpara es lo contrario de lo que pide un gallinero abierto. Si de noche hace frío de altura, el reparo es el refugio, no un foco dejado hasta el amanecer."),
p("Revisa si la luz se va con el corte de electricidad, tan común en zonas rurales. Cuando vuelve a media noche y el foco queda encendido porque el interruptor estaba cerrado, el lote pasa el resto de la noche en claro. Un corte no se controla; el interruptor al acostarte, sí. Si usas luz solo en el anochecer, confirma que quedó apagada antes de dormir."),
"<h2>La luz no tapa una mala comida</h2>",
p("Dieciséis horas con maíz solo, en una híbrida encerrada, no fabrican el objetivo de la ficha. La L01 junta luz y alimento. Las razas y los números de huevo que sí citamos están en <a href='razas-gallinas-ponedoras.html'>razas de ponedoras</a>. El 20 o el 30 % de la FAO, si llega, llega sobre un lote que ya come y bebe. No es un parche para gallinas flacas o enfermas."),
p("Si la puesta cae, anota tres cosas antes de comprar otra lámpara: horas reales de luz de esa semana, gramos de alimento y si hizo un calor que las dejó jadeando. Muchas veces el foco estaba bien y falló el agua al mediodía. La cuenta del alimento, con tus precios, sigue en la <a href='../calculadora.html'>calculadora</a>. La luz no entra en esa resta como un ingreso mágico."),
])

G12 = {
"slug": "gallinas-por-gallo",
"title": "Cuántas gallinas por gallo | Granja Rentable",
"description": "La FAO cita unas 5 gallinas por gallo en un ejemplo y, en otro texto, 6 a 8. Los huevos de comer no necesitan gallo.",
"crumb": "Gallinas por gallo",
"h1": "Cuántas gallinas por gallo",
"relacionadas": [
    ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ("Razas de ponedoras", "guias/razas-gallinas-ponedoras.html"),
    ("Gallinero para ponedoras", "guias/gallinero-para-ponedoras.html"),
    ("Lección L02", "lecciones/l02.html"),
    ("Curso gratis", "curso.html"),
],
"faq": [
    ("¿Cuántas gallinas por gallo hacen falta?", "No hay una sola cifra. La FAO, en el manual de avicultura a pequeña escala, dice que en Nigeria es común una relación de unas 5 gallinas por gallo. Otro texto de la FAO de pequeña escala dice que un gallo sirve técnicamente a 6 u 8 gallinas. La L02 del curso anota además otros rangos. Ninguno es una ley mágica para tu patio."),
    ("¿Hace falta gallo para tener huevos de comer?", "No. La gallina pone sin gallo. Esos huevos no están fecundados y sirven para la mesa. El gallo hace falta si quieres huevo fértil para incubar o para que una clueca saque pollitos. Meter un gallo para que haya más huevos de comer no cambia ese mecanismo."),
    ("¿Qué pasa si hay gallos de más?", "Pelean, hieren a las gallinas y no suben la puesta de mesa. En un patio chico, dos gallos adultos suelen ser peor que uno. Si no vas a incubar, lo más simple es no tener gallo. Si vas a incubar, usa uno de los rangos publicados como orientación y mira el estado de las hembras, no un número colgado en la pared."),
    ("¿El gallo joven cubre las mismas que uno adulto?", "No está escrito así en las fuentes que citamos. La relación técnica de 6 a 8, o la de unas 5 a 1 del ejemplo de Nigeria, no distingue en esta página la edad del gallo. Un gallo que llega flaco, herido o recién metido al lote no rinde como el que ya conoce a las gallinas. Observa y, si hay heridas, separa. No hay una dosis ni un producto para eso."),
],
"fuentes": """<ul>
<li>FAO. <a href="https://www.fao.org/4/y5169e/y5169e.pdf">Small-scale poultry production</a>. En Nigeria es común una relación gallina:gallo de unas 5:1.</li>
<li>FAO. <a href="https://openknowledge.fao.org/server/api/core/bitstreams/efd43a5f-b616-4985-825b-22475c4b68e2/content">Texto de avicultura a pequeña escala</a>. Un gallo sirve técnicamente a 6–8 gallinas.</li>
<li>Lección <a href="../lecciones/l02.html">L02</a>. Anota 1 gallo cada 10 a 15 gallinas ligeras y 1 cada 6 a 8 de doble propósito, en corrales separados por línea si hay genética.</li>
</ul>
<p>El huevo de mesa y el fértil se distinguen también en <a href="criar-gallinas-ponedoras.html">criar ponedoras</a>.</p>""",
"html": "",
}
G12["html"] = "".join([
p("La pregunta de cuántas gallinas por gallo tiene más de una respuesta publicada, y ninguna es un número mágico. Si el huevo es para comer, la respuesta puede ser cero gallos. Si el huevo es para incubar, la FAO da dos referencias distintas y la <a href='../lecciones/l02.html'>L02</a> del curso añade otras. Mezclarlas en una sola cifra redonda es justo lo que esta guía no va a hacer."),
p("En patio de México, Colombia, Perú o Guatemala el gallo se tiene a veces por costumbre, por el canto o porque se quiere sacar pollitos en la época seca. Esas razones no pesan lo mismo. El canto no mejora el huevo de la mesa. El pollito sí exige un huevo fecundado y una gallina, o una incubadora, que lo termine. El plan se escribe antes de meter al gallo en el gallinero."),
"<h2>Huevo de comer: no hace falta gallo</h2>",
p("La gallina forma el huevo sin necesidad de un macho. Ese huevo no está fecundado. Se cocina, se vende para comer y no va a sacar un pollito aunque lo empolles con esperanza. Meter un gallo para que pongan más es un error de mecanismo: el número de huevos de mesa depende del ave, del alimento, de la luz, de la salud y de si se echa clueca, no de que haya un macho en el patio."),
p("Un gallo de más tiene costos. Come, ocupa espacio, pelea y puede herir el lomo de las gallinas si son pocas para su insistencia. Esas heridas se infectan en un piso sucio y la gallina deja de subir al nido. Si solo quieres huevo de desayuno, lo más simple en la ciudad y en el pueblo es un lote de hembras. La guía de <a href='criar-gallinas-ponedoras.html'>cómo criarlas</a> sigue ese camino sin pedir un gallo."),
"<h2>Si quieres pollitos, hay rangos y no una ley</h2>",
p("La FAO, en el manual de avicultura a pequeña escala, señala que en Nigeria es común una relación de unas 5 gallinas por cada gallo. Es una costumbre descrita en ese manual, no el reglamento de tu municipio. Otro texto de la FAO sobre avicultura familiar dice que un gallo sirve técnicamente a 6 u 8 gallinas. Las dos frases son de la FAO y no coinciden en un único entero. Por eso no elegimos una para tatuarla en el gallinero."),
p("La L02, por su lado, anota un gallo cada 10 a 15 gallinas ligeras y uno cada 6 a 8 si son de doble propósito, y pide corral por línea cuando el proyecto es genética. El 6 a 8 se parece al texto técnico de la FAO. El 10 a 15 es otro rango, para aves ligeras, dentro del curso. Usar 5, usar 8 o usar 12 puede ser fiel a una fuente y desleal a otra. La salida honesta es decir el sistema que tienes y mirar a las gallinas, no decretar un campeón."),
"""<div class="tabla"><table>
<thead><tr><th>Fuente</th><th>Relación que publica</th><th>Cómo leerla</th></tr></thead>
<tbody>
<tr><td>FAO, manual de pequeña escala</td><td>Unas 5 gallinas por gallo, común en el ejemplo de Nigeria</td><td>Una costumbre descrita, no una orden para todo el continente</td></tr>
<tr><td>FAO, otro texto de pequeña escala</td><td>Un gallo para 6 a 8 gallinas, en términos técnicos</td><td>Un rango, no un punto medio obligatorio</td></tr>
<tr><td>L02 del curso</td><td>1 cada 10 a 15 ligeras; 1 cada 6 a 8 de doble propósito</td><td>Otra orientación del curso, separada por tipo de ave</td></tr>
<tr><td>Huevo solo para comer</td><td>Cero gallos</td><td>La puesta de mesa no los necesita</td></tr>
</tbody>
</table></div>""",
p("Ninguna celda de la tabla promete un porcentaje de huevos fértiles. No lo publicamos porque no está en esas citas como un número único y no vamos a inventarlo. Un gallo puede cubrir el rango y aun así dejar huevos claros si está enfermo, si las gallinas no se dejan, o si el lote está tan apretado que la monta es un forcejeo. El espacio del gallinero está en <a href='gallinero-para-ponedoras.html'>la guía del local</a>."),
"<h2>Qué mirar en el patio, sin producto</h2>",
p("Mira el lomo y la nuca de las gallinas. Plumas arrancadas y piel herida en muchas hembras suelen decir que el gallo insiste de más para las que hay, o que falta espacio. No se resuelve con una dosis. Se separa al gallo, se curan las heridas con el criterio del veterinario y se revisa si de verdad necesitas huevo fértil. Si la respuesta es no, el gallo puede vivir en otro lado o no estar."),
p("Dos gallos adultos en un mismo grupo chico pelean. El ganador persigue a las hembras y el otro come mal, escondido. Si crías líneas distintas y quieres genética en serio, la L02 pide corrales separados por línea. Un solo patio con dos colores y dos gallos no es un programa de raza: es una mezcla. Los nombres y lo que no se debe prometer de huevos están en <a href='razas-gallinas-ponedoras.html'>razas de ponedoras</a>."),
p("El gallo nuevo no se suelta el primer minuto contra todo el lote si puedes evitar el golpe. Entra con luz para que se vean, con espacio, y se observa esa tarde. Esto no es un protocolo de medicamentos. Es prudencia. Si ya hay heridos, el veterinario manda, no el grupo de chat."),
"<h2>Incubar es otro paso</h2>",
p("Con la relación más o menos en el rango de las fuentes, todavía falta que el huevo sea fresco, limpio y de un lote sano. Incubar huevos de gallinas heridas o enfermas reparte el problema. No damos aquí días de guarda ni temperaturas de máquina: eso es otra guía y otra lección del curso. Aquí solo se decide si el gallo hace falta."),
p("Anota cuántas hembras hay, cuántos gallos y para qué. Si en tres meses no incubaste ni vas a incubar, el gallo está comiendo sin cumplir el único trabajo que la mesa no le pide. Ese alimento entra en la misma lógica de la <a href='../calculadora.html'>calculadora</a>: es un ave más que come, y el precio del saco lo pones tú. El <a href='../curso.html'>curso</a> deja el espacio y las líneas en la L02 para cuando el proyecto sí sea de pollitos y no solo de huevo duro."),
])

G13 = {
"slug": "enfermedades-gallinas-que-mirar",
"title": "Enfermedades de gallinas: qué mirar | Granja Rentable",
"description": "Qué anotar antes de llamar al veterinario. No es diagnóstico ni tratamiento. Sin dosis. Gripe aviar y Newcastle se avisan a sanidad animal.",
"crumb": "Qué mirar",
"h1": "Enfermedades de gallinas: qué mirar",
"relacionadas": [
    ("Primeros días del pollito", "guias/primeros-dias-pollito.html"),
    ("Gallinero para ponedoras", "guias/gallinero-para-ponedoras.html"),
    ("Cuánta agua bebe", "guias/agua-para-gallinas.html"),
    ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ("Curso gratis", "curso.html"),
],
"faq": [
    ("¿Esta página dice qué enfermedad tiene mi gallina?", "No. Es información orientativa. No es un diagnóstico ni un tratamiento, y no trae dosis. Varias enfermedades se parecen de lejos. El veterinario ve el lote. Tú puedes llegar a la llamada con números: cuántas están mal, desde cuándo, qué comen, cómo está la cama y si hubo muertes."),
    ("¿Qué fichas del sitio puedo leer mientras tanto?", "Están publicadas la de coccidiosis, la de coriza y la de ácaro rojo, más el índice de enfermedades. Léelas para saber qué observa cada una. No las uses para elegir un frasco. Si el cuadro es grave, con muchas aves caídas o muertas, la llamada va primero."),
    ("¿Qué hago si sospecho gripe aviar o Newcastle?", "No toques aves muertas sin guantes y no te las lleves a casa. Avisa a sanidad animal. En la categoría del sitio ya se nombran el MAPA en España, SENASICA en México, el ICA en Colombia y SENASA en Perú. No des remedios caseros, no muevas las aves a otra granja y no esperes a confirmarlo solo con un video."),
    ("¿Puedo separar una ave enferma?", "Apartarla del comedero de las sanas, en un sitio donde no compartan agua, evita que la pisen mientras llega el veterinario. Eso no es un tratamiento ni una dosis. Anota cuál apartaste y desde qué hora. Si hay varias muertes de un día para otro, no reacomodes el lote por las fincas del vecindario: avisa."),
],
"fuentes": """<ul>
<li>Fichas del sitio: <a href="../enfermedades/coccidiosis.html">coccidiosis</a>, <a href="../enfermedades/coriza.html">coriza</a>, <a href="../enfermedades/acaro-rojo.html">ácaro rojo</a> y el <a href="../enfermedades.html">índice de enfermedades</a>. Cada una abre con el mismo aviso: no es diagnóstico ni tratamiento.</li>
<li><a href="../enfermedades/gripe-aviar.html">Gripe aviar</a> y <a href="../enfermedades/newcastle.html">Newcastle</a>. No tocar aves muertas sin guantes. Avisar a sanidad animal: MAPA en España, SENASICA en México, ICA en Colombia, SENASA en Perú.</li>
<li>Lección <a href="../lecciones/l04b.html">L04B</a>, que en el curso sigue después del manejo diario y habla de cuándo el lote deja de ser un problema de cama o de temperatura.</li>
</ul>
<p>El orden del día a día, antes de que haya un enfermo, está en el <a href="../curso.html">curso</a>.</p>""",
"html": "",
}
G13["html"] = "".join([
"<p class=\"enf-aviso\">Información orientativa. No es diagnóstico ni tratamiento. Sin dosis.</p>\n",
p("Esta página no dice qué tiene tu gallina. Sirve para llegar mejor a una llamada con el veterinario, en México, Colombia, Perú, Ecuador, Guatemala o España, con datos en vez de una foto suelta y un remedio que alguien dictó en un chat. No hay medicamentos, no hay mililitros y no hay recetas. Si el ave está grave, la llamada no se pospone para terminar de leer."),
p("Varias causas se ven parecidas desde el patio: un ave hinchada, un ave que no come, un ave con la cama pegada a las plumas. Elegir un nombre de enfermedad en internet y comprar un producto es la forma de perder tiempo. El veterinario pregunta cosas concretas. Si las tienes anotadas, la visita rinde. Si no, los dos adivinan."),
"<h2>Qué anotar antes de llamar</h2>",
p("Cuenta cuántas se ven enfermas y cuántas hay en el lote. No es lo mismo una de veinte que quince de veinte. Anota desde cuándo: esta mañana, desde el martes, desde que llegó un animal nuevo. La fecha cambia la historia. Anota qué comen y si el comedero amaneció vacío, mojado o lleno de un alimento distinto. Anota cómo está la cama: seca, húmeda debajo del bebedero, con olor que pica al agacharte. Anota si hay muertes, cuántas y de qué edad, pollito o adulta."),
p("Suma lo que cambió en la semana. ¿Llegaron aves de otro patio? ¿Hubo un calor que las dejó jadeando? ¿Se fue el agua? ¿Encerraste de golpe a las que antes escarbaban? Esos datos no diagnostican. Evitan que la explicación sea solo el último saco que compraste. Lleva la nota escrita. En el susto se olvidan los números. La app <a href='../app.html'>Registro de pollos</a> puede guardar bajas y consumo cuando la uses; un cuaderno al lado del gallinero sirve hoy."),
"""<div class="tabla"><table>
<thead><tr><th>Dato</th><th>Cómo anotarlo</th><th>Para qué le sirve a quien atiende</th></tr></thead>
<tbody>
<tr><td>Cuántas enfermas</td><td>Enfermas y total del lote, no solo las peores</td><td>Ver si es un caso suelto o un grupo</td></tr>
<tr><td>Desde cuándo</td><td>Día y, si puedes, hora en que las viste mal</td><td>Ordenar la historia</td></tr>
<tr><td>Qué comen</td><td>Alimento, si sobró o si faltó, y si cambió el saco</td><td>No culpar al saco sin mirar el comedero</td></tr>
<tr><td>Cama y agua</td><td>Seca o húmeda, olor, bebedero sucio o vacío</td><td>Ver el piso donde viven</td></tr>
<tr><td>Muertes</td><td>Número, edad y si las encontraste ya muertas</td><td>Decidir la urgencia y el aviso oficial si toca</td></tr>
</tbody>
</table></div>""",
p("No abras aves muertas para ver qué tienen. No tiene sentido en un patio y, en algunos cuadros, es un riesgo para ti. Guantes si tienes que levantar un cadáver, bolsa si la autoridad te dice que lo conserves, y fuera del alcance de niños, perros y otras gallinas. Si no te han pedido conservarlo, no lo pases de finca en finca."),
"<h2>Fichas que ya están publicadas</h2>",
p("El sitio tiene fichas para leer con calma, no para automedicarse. La de <a href='../enfermedades/coccidiosis.html'>coccidiosis</a> importa sobre todo en jóvenes y donde la cama está húmeda. La de <a href='../enfermedades/coriza.html'>coriza</a> está en el grupo de lo respiratorio. La de <a href='../enfermedades/acaro-rojo.html'>ácaro rojo</a> habla del parásito que se esconde en las rendijas del gallinero y se busca también de noche. El <a href='../enfermedades.html'>índice de enfermedades</a> junta el resto. Cada ficha repite el aviso: no es un diagnóstico ni un tratamiento."),
p("Puedes leer la ficha que se parezca a lo que viste y anotar las coincidencias y lo que no coincide. Eso ayuda a hablar con el veterinario. No ayuda a elegir un frasco en la tienda agrícola. Si la ficha y tu lote no se parecen, no fuerces el nombre. Muchas bajas de pollitos se explican por frío o por no haber comido el primer día, que es manejo, y está en <a href='primeros-dias-pollito.html'>primeros días del pollito</a>, también sin dosis."),
"<h2>Gripe aviar y Newcastle</h2>",
p("Estas dos no se manejan como un resfriado del patio. La gripe aviar y Newcastle están en las fichas de <a href='../enfermedades/gripe-aviar.html'>gripe aviar</a> y <a href='../enfermedades/newcastle.html'>Newcastle</a>, y en la categoría del sitio ya se tratan como aviso a la autoridad. No toques aves muertas sin guantes. No te las lleves a casa para mostrarlas. Avisa a sanidad animal el mismo día si el cuadro es el que esas fichas marcan como declaración: varias aves graves o muertas, y no un experimento casero para confirmarlo."),
p("Los nombres que el sitio ya usa son estos: en España, el MAPA o la oficina de sanidad animal de tu comunidad; en México, SENASICA; en Colombia, el ICA; en Perú, SENASA. En otro país, el servicio oficial de sanidad animal, no el grupo de vecinos. No des remedios caseros. No muevas las aves a otra granja para alejarlas del problema: así se lleva el problema. No esperes a que un video te dé la razón."),
p("Mientras avisas, reduce visitas al gallinero, no prestes jaulas ni sacos, y lava las botas y las manos al salir. Eso no cura a nadie. Baja la chance de pasear el cuadro en la camioneta. Los niños no ayudan a recoger muertas. Si tú te sientes mal después de haber estado en contacto con esas aves, dilo en el servicio de salud de personas. La ficha de gripe aviar recuerda que puede pasar a la gente."),
"<h2>Lo que sí es manejo, y lo que no</h2>",
p("Agua limpia, cama seca y no mezclar pollitos con adultas son manejo de todos los días. Están en las guías de <a href='agua-para-gallinas.html'>agua</a> y de <a href='gallinero-para-ponedoras.html'>gallinero</a>, y en <a href='criar-gallinas-ponedoras.html'>criar ponedoras</a>. No sustituyen al veterinario cuando el lote ya cayó. Sí evitan una parte de los sustos. Un bebedero que encharca y un gallinero cerrado sin aire no se corrigen con un producto."),
p("Aparta al ave que las otras pican o que no puede llegar al comedero, en un lugar con agua propia. Anota la hora. No la mediques porque sí. Si come y bebe y la herida es de una pelea, el veterinario te dirá cómo seguir. Si no come, no esperes tres días a ver si se anima. La <a href='../lecciones/l04b.html'>L04B</a> del curso retoma el lote de engorde cuando el problema ya no es solo la temperatura de la primera noche."),
p("Guarda la nota aunque la visita termine en que no era nada grave. La próxima vez vas a querer comparar. El <a href='../curso.html'>curso</a> enseña el orden para no llegar a esta página cada semana: espacio, comida, agua, luz y observación. Esta página empieza cuando ese orden ya no alcanza y hace falta alguien que pueda diagnosticar. Tú no cierras el diagnóstico desde el celular."),
])

G14 = {
"slug": "pollos-por-metro",
"title": "Pollos de engorde por metro cuadrado | Granja Rentable",
"description": "Densidades de la L02 y la L04A: kilos por metro, 12 pollos de 2,5 kg y el tope del campero. La cuenta de 10 m² cabe en esta página.",
"crumb": "Pollos por metro",
"h1": "Pollos de engorde por metro cuadrado",
"relacionadas": [
    ("Pollos de engorde y los días", "guias/pollos-engorde-dias.html"),
    ("Primeros días del pollito", "guias/primeros-dias-pollito.html"),
    ("Negocio de pollos", "guias/negocio-pollos-rentable.html"),
    ("Lección L02", "lecciones/l02.html"),
    ("Calculadora", "calculadora.html"),
],
"faq": [
    ("¿Cuántos pollos de engorde caben en un metro cuadrado?", "La L04A y la L02 usan el peso, no solo las cabezas. En nave abierta, unos 30 kg por m². Un pollo de 2,5 kg sale en unos 12 por m², porque 12 por 2,5 kg son 30 kg. Si tus pollos pesan más, ese 12 ya no cabe en los 30 kg. Si pesan menos, el límite de kilos todavía manda al final del ciclo, cuando estén pesados."),
    ("¿Y el tope de 33 kg?", "La L02 lo da para la nave de engorde: como mucho 33 kg por m², y 39 a 42 solo con los requisitos que la lección resume. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). No es un permiso para cargar una nave abierta hasta 42. La nave abierta, en la L04A, anda cerca de 30 kg por m². Lee el tipo de local que tienes antes de usar la cifra más alta."),
    ("¿El campero entra en los mismos 12?", "No. La L04A lo separa: como mucho 13 pollos por m² y como mucho 27,5 kg por m², más al menos 1 m² de parque por ave y 56 días o más. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). Cumplir solo el parque, o solo los días, no completa esa definición. El detalle del día está en la guía de engorde."),
    ("¿Cuántos son en 10 metros cuadrados?", "Con el ejemplo de 12 pollos por m², 10 m² son 120 pollos. Es multiplicar, no un cupo de tu país. Esos 120, si cada uno pesa 2,5 kg, son 300 kg en 10 m², es decir 30 kg por m², el orden de la nave abierta. Si vas a vender antes y pesan menos, la cuenta de cabezas no se estira por eso hasta el infinito: al final mandan los kilos si los dejas crecer."),
],
"fuentes": """<ul>
<li>Lección <a href="../lecciones/l02.html">L02</a>. Nave de engorde: como mucho 33 kg por m², y 39 a 42 con requisitos. Es norma de la UE aplicada en España. El final cerca de 30 kg por m² que resume la lección no es la nave abierta: esa, de unos 30 kg por m², la da la L04A citando a Cobb.</li>
<li>Lección <a href="../lecciones/l04a.html">L04A</a>. Nave abierta, citando a Cobb: unos 30 kg por m². Pollo de 2,5 kg, unos 12 por m²; el ejemplo de la lección es 10 m² = 120 pollos. Campero: como mucho 13 por m² y 27,5 kg por m², más 1 m² de parque y al menos 56 días. El campero es norma europea; en Latinoamérica no rige por sí solo.</li>
<li><a href="../guia-espacio.html">Guía de espacio</a>, que publica esas cifras de la L02 para medir antes de encargar las aves.</li>
</ul>
<p>El día en que se acercan a ese peso está en <a href="pollos-engorde-dias.html">pollos de engorde: los días</a>.</p>""",
"html": "",
}
G14["html"] = "".join([
p("Cuántos pollos caben no se responde con un número de cabezas colgado en la puerta. Se responde con kilos por metro cuadrado al final del ciclo, que es cuando más ocupan y más ensucian. La <a href='../lecciones/l02.html'>L02</a> y la <a href='../lecciones/l04a.html'>L04A</a> ya publicaron las cifras. Esta guía solo las ordena y hace la multiplicación. No inventa una densidad para el clima de tu departamento ni un precio del metro de galpón."),
p("Medir el piso antes de encargar el pollito evita el error de moda: comprar de más porque el cajón del día uno se ve vacío. El pollito de llegada no es el pollo de la última semana. El que manda es el peso con el que piensas sacarlos. Si todavía no sabes ese peso, lee <a href='pollos-engorde-dias.html'>en cuántos días</a> y habla con quien va a comprar."),
"<h2>Kilos por metro, no solo cabezas</h2>",
p("La L02 pone la nave de engorde en un máximo de 33 kg por m², y de 39 a 42 kg por m² solo si se cumplen los requisitos que la lección resume. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). Esos requisitos no son un adjetivo. La L04A los asocia a condiciones de aire y, para el escalón más alto, también a la mortalidad. Si no tienes ese control, no uses 39 ni 42. Quédate en el tope que sí puedes defender, y en una nave abierta ni siquiera partas de 33 como si fuera el día a día."),
p("Para nave abierta, la L04A da unos 30 kg por m². Un pollo de 2,5 kg, en esa cuenta, son unos 12 por m², porque 12 por 2,5 es 30. La misma lección escribe el ejemplo: 10 m² a 12 pollos son 120. También lista 20 m² = 240, 50 m² = 600 y 100 m² = 1.200, siempre con esa relación. Son multiplicaciones del mismo 12, no cuatro reglas distintas."),
"""<div class="tabla"><table>
<thead><tr><th>Situación, según L02 y L04A</th><th>Cifra</th><th>Ejemplo de cuenta</th></tr></thead>
<tbody>
<tr><td>Nave de engorde</td><td>Como mucho 33 kg/m²; 39 a 42 solo con requisitos. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…).</td><td>No uses 42 si no cumples lo que la lección pide</td></tr>
<tr><td>Nave abierta</td><td>Unos 30 kg/m²</td><td>12 pollos de 2,5 kg pesan 30 kg</td></tr>
<tr><td>Esos 12 por m²</td><td>Pollo de unos 2,5 kg</td><td>10 m² × 12 = 120 pollos</td></tr>
<tr><td>Campero</td><td>≤ 13/m² y ≤ 27,5 kg/m², más ≥ 1 m² de parque y ≥ 56 días. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…).</td><td>Hace falta cumplir las cuatro, no una sola</td></tr>
</tbody>
</table></div>""",
p("Ciento veinte pollos de 2,5 kg son 300 kg. Repartidos en 10 m² son 30 kg por m². La cuenta cierra con la nave abierta. Si tu báscula da más de 2,5 kg por ave, doce pollos en ese metro pasan de 30 kg. No publicamos otra tabla de cabezas. El tope de kilos del sistema se parte entre el peso que tú pesaste. La báscula manda sobre el 2,5 del ejemplo."),
"<h2>Campero no es el mismo metro</h2>",
p("La L04A separa el campero: como mucho 13 pollos por m² y como mucho 27,5 kg por m², más al menos 1 m² de parque por ave y 56 días o más. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). Si tienes parque pero los sacas a los 40 días, no estás en esa línea. Si esperas 56 días y los encierras a 15 por m² sin parque, tampoco. El nombre campero en el letrero no cambia los cuatro datos."),
p("El parque de 1 m² por ave es adicional, no un reemplazo del piso de dormir. Ciento veinte pollos pedirían, en esa cifra, al menos 120 m² de parque, además del galpón. Si el patio no da esa superficie, no etiquetes el lote como campero para venderlo más caro de palabra. La <a href='negocio-pollos-rentable.html'>guía del negocio</a> pide precios reales en la calculadora, no un adjetivo."),
"<h2>Mide el suelo que sí pisan</h2>",
p("Mide largo por ancho del área donde están las aves. Resta los metros de un cuarto de alimento donde no entran, los postes y el rincón muerto detrás de una puerta. Diez metros de techo no siempre son diez metros de piso útil. Si la cuenta te da 9 m² útiles, el ejemplo de 120 ya no cabe: 9 por 12 son 108, otra vez con el 2,5 kg. Anótalo antes de pagar el pollito."),
p("Al principio parecen pocos. La L02 recuerda que el arranque puede ir más junto y que después se abre a la nave, hacia el final de unos 30 kg por m². No dejes el círculo del día uno como densidad de la quinta semana. Cuando crecen, o amplías el espacio o no metiste de más. Apretados, la lección lista cama húmeda, amoníaco, peleas y más bajas. Esas bajas empeoran la conversión, como se explica en el negocio de pollos, sin prometer una ganancia."),
p("La primera semana tiene otra lectura, la de la temperatura y el buche, en <a href='primeros-dias-pollito.html'>primeros días</a>. Un lote en el metro correcto, pasado de frío, igual se atrasa. El metro no sustituye el termómetro. Los dos se anotan."),
"<h2>Del metro a la cuenta, sin precio inventado</h2>",
p("Cuando sepas los metros útiles y el peso al que quieres salir, multiplica. Ejemplo único, el de la lección: 10 m² por 12 pollos son 120, si el pollo es de unos 2,5 kg y el sistema es el de unos 30 kg por m². Si tu sistema es el tope de 33 kg, te aplica esa norma europea y de verdad la cumples, los kilos del local son 10 por 33, es decir 330 kg, no 120 cabezas automáticas. 330 partidos por el peso de tu báscula dan las cabezas. No al revés."),
p("Esas cabezas comen. El alimento es la parte grande del costo de insumos, cerca del 75 % del costo de producción, según la <a href='https://www.fao.org/4/Y4628E/y4628e03.htm'>guía de producción de huevo de la FAO</a>. Más aves de las que caben no diluyen el saco: lo aumentan y suelen aumentar las bajas. El precio del saco y el del pollo se escriben en la <a href='../calculadora.html'>calculadora</a>. El <a href='../app.html'>Registro de pollos</a> sirve para no perder los muertos, que también ocuparon metro y comieron. La <a href='../guia-espacio.html'>guía de espacio</a> deja la misma cifra a la vista, junto a la de las ponedoras, para no usar el 12 del pollo en la gallina ni el revés."),
p("Si el local no da el metro, se encargan menos pollitos. Es la corrección más barata y la única que esta página recomienda sin dudar. No hay un truco de manejo que vuelva amplio un cuarto chico. El <a href='../curso.html'>curso</a>, en la L02 y la L04A, es el lugar donde esas densidades están junto al resto del ciclo. Mide, multiplica y después compra. No compres y después midas."),
])
