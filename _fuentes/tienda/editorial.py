# -*- coding: utf-8 -*-
"""Criterios editoriales de compra; no añaden prestaciones a los productos.

Las características de cada modelo proceden del catálogo existente. Estas
preguntas ayudan a comprobar su encaje, sin afirmar pruebas físicas ni ahorro.
"""

def criterio(encaje, comprobar, uso):
    return {"encaje": encaje, "comprobar": comprobar, "uso": uso}


CRITERIOS = {
    "Bebederos normales": criterio(
        "buscas un punto de agua de depósito y puedes atender el llenado y la limpieza",
        ["Mide el espacio de apoyo o suspensión y comprueba que las aves alcanzan el canal.", "Revisa cómo se abre, se lava y se transporta lleno; la capacidad no indica cuántos días durará.", "Confirma qué piezas y soporte incluye la variante elegida."],
        ["Instálalo estable y comprueba el suministro de agua en el punto donde beben las aves.", "Registra rellenos y derrames para decidir si necesitas más capacidad o más puntos de bebida."]),
    "Bebederos de tetina y copas": criterio(
        "quieres comparar un sistema de tetinas o copas y puedes supervisar que todo el lote lo utilice",
        ["Confirma la presión y el tipo de conexión que admite el modelo.", "Distingue un kit de piezas de un bebedero completo con depósito.", "Comprueba altura, acceso de las aves pequeñas y disponibilidad de juntas de recambio."],
        ["Prueba conexiones y funcionamiento antes de depender de este sistema.", "Observa a las aves al cambiar de bebedero y comprueba diariamente el paso de agua."]),
    "Bebederos y bases calefactadas": criterio(
        "necesitas comparar equipo para el agua en tiempo frío y tienes una instalación eléctrica compatible",
        ["Distingue entre una base y un bebedero completo: verifica qué debes aportar.", "Comprueba tensión, frecuencia, enchufe y recipientes admitidos en el manual.", "Revisa las condiciones de exterior, el cableado y los límites ambientales del equipo."],
        ["Monta el equipo conforme a su manual, con el cable protegido del agua y de las aves.", "Comprueba el agua directamente; la presencia de calefacción no garantiza su disponibilidad."]),
    "Agua y riego": criterio(
        "necesitas conectar o regular un suministro y conoces las conexiones de tu instalación",
        ["Comprueba diámetro, rosca, presión y compatibilidad con agua de bebida.", "Verifica si requiere depósito, regulador o piezas que se venden por separado.", "Asegura acceso a cierres, uniones y puntos de limpieza."],
        ["Realiza una prueba de fugas y de caudal antes de ponerlo en servicio.", "Comprueba que el suministro llega al último punto, además del depósito de origen."]),
    "Comederos": criterio(
        "buscas un formato de alimentación que puedas instalar y adaptar al tamaño de tus aves",
        ["Comprueba el acceso al alimento y el tamaño de las aberturas, especialmente para aves pequeñas.", "Distingue capacidad de almacenamiento de espacio disponible para comer a la vez.", "Revisa montaje, piezas incluidas y acceso de limpieza antes de comparar formatos."],
        ["Comprueba que todas las aves pueden utilizarlo antes de retirar el equipo anterior.", "Anota alimento repuesto y derrames; compara el gasto con los datos de tu lote."]),
    "Kits, comederos y bebederos de pollitos": criterio(
        "estás preparando la recepción de pollitos y necesitas revisar juntos sus puntos de comida y agua",
        ["Confirma medidas, alturas y edad de uso indicada por el fabricante.", "Revisa qué recipientes, bases y accesorios contiene exactamente el conjunto.", "Comprueba que puedes limpiar las piezas y ajustar el equipo al crecimiento."],
        ["Prepara y prueba el conjunto antes de recibir las aves.", "Observa el acceso de los pollitos más pequeños y revisa estabilidad, alimento y suministro de agua."]),
    "Pienso": criterio(
        "la especie, el destino del lote y su etapa coinciden con los indicados en la etiqueta",
        ["Lee la etiqueta completa: especie, etapa, composición y condición de alimento completo o complemento.", "Comprueba formato, tamaño del saco y conservación prevista antes de abrirlo.", "Para productos con indicaciones especiales, confirma su adecuación con tu proveedor o veterinario."],
        ["Sigue las instrucciones del fabricante y conserva la identificación del lote y la etiqueta.", "Anota fecha de apertura y cantidades utilizadas; guarda el saco en condiciones secas y protegidas."]),
    "Golosinas e insectos": criterio(
        "quieres comparar un alimento complementario dentro de una alimentación ya planificada",
        ["Comprueba ingredientes, especie indicada y condiciones de conservación.", "Distingue un complemento de un pienso completo para la etapa del lote.", "Valora el tamaño del envase según el uso previsto, sin atribuirle mejoras de puesta."],
        ["Utiliza la información de la etiqueta para integrar el producto en el manejo del lote.", "Registra lo ofrecido por separado del pienso completo para conocer su coste."]),
    "Grit y concha de ostra": criterio(
        "has identificado qué material necesitas y para qué aves, antes de elegir la presentación",
        ["Distingue grit insoluble y fuentes de calcio; no se eligen como si fueran el mismo producto.", "Comprueba especie, etapa y tamaño de partícula indicado en la etiqueta.", "Revisa el alimento que ya recibe el lote antes de añadir suplementos."],
        ["Conserva la etiqueta y sigue las indicaciones adecuadas para ese producto.", "Anota su coste aparte del pienso y consulta al proveedor o veterinario si no sabes si procede usarlo."]),
    "Almacenaje de pienso": criterio(
        "necesitas organizar el alimento y puedes mantener el recipiente seco y accesible para la limpieza",
        ["Comprueba capacidad útil y medidas; el peso de alimento admitido depende también de su densidad.", "Confirma con el fabricante si el material es adecuado para contacto con alimento.", "Revisa cierre, limpieza y acceso; una tapa no garantiza por sí sola ausencia de humedad o roedores."],
        ["Conserva la etiqueta y la identificación de cada saco, aunque lo introduzcas en un contenedor.", "No mezcles lotes sin registrar su procedencia y revisa periódicamente el estado del alimento."]),
    "Nidales y cama": criterio(
        "quieres comparar material para el descanso o el nidal y has medido la zona de colocación",
        ["Distingue un nidal completo de una almohadilla, un relleno o un saco de cama.", "Comprueba medidas, material, cantidad incluida y método de limpieza o recambio.", "Revisa el acceso de las aves y cómo retirarás las zonas sucias."],
        ["Instala el material limpio y seco y observa su uso por las aves.", "Revisa humedad y suciedad de forma periódica; un formato grande no fija su duración real."]),
    "Perchas": criterio(
        "tienes espacio para un apoyo estable y adaptado al tamaño y movilidad de las aves",
        ["Comprueba longitud útil, superficie de apoyo y dimensiones del conjunto montado.", "Distingue una percha de descanso de un columpio o elemento de entretenimiento.", "Revisa fijaciones, acceso, limpieza y distancia a paredes y mallas."],
        ["Comprueba la estabilidad antes de dejar que las aves lo utilicen.", "Observa el acceso de las aves más pequeñas o con movilidad limitada y adapta la instalación."]),
    "Baño de arena": criterio(
        "buscas comparar un material de baño y puedes comprobar que está indicado para tus aves",
        ["Verifica composición y uso autorizado por el fabricante.", "Distingue el sustrato de un recipiente de baño y confirma qué incluye el pedido.", "Revisa polvo, almacenamiento y advertencias de manipulación de la etiqueta."],
        ["Mantén el área de baño protegida de la humedad y retira material sucio.", "No atribuyas al material un efecto de tratamiento; ante un problema sanitario consulta al veterinario."]),
    "Gallineros y corrales": criterio(
        "has definido el alojamiento y puedes comprobar sus dimensiones y cierres en tu terreno",
        ["Calcula superficie útil, no solo dimensiones exteriores o número de aves anunciado.", "Revisa anclajes, uniones, cubierta, ventilación y puntos de entrada.", "Comprueba qué refuerzos, suelo o protecciones tendrás que aportar."],
        ["Revisa el montaje y los cierres antes de alojar el lote.", "Inspecciona el recinto después de viento, lluvia o movimientos del terreno."]),
    "Malla y vallas": criterio(
        "conoces la abertura, superficie y fijación que necesitas para tu cerramiento",
        ["Comprueba abertura de la malla, grosor del alambre y dimensiones del rollo.", "Calcula uniones, solapes y fijaciones antes de decidir la cantidad.", "Distingue contener aves de proteger frente a depredadores; cada instalación necesita su revisión."],
        ["Comprueba bordes y anclajes al terminar el montaje.", "Revisa uniones, puertas y encuentros con suelo y techo de forma periódica."]),
    "Malla eléctrica y pastores": criterio(
        "puedes preparar un cercado eléctrico compatible y mantenerlo según sus instrucciones",
        ["Confirma si compras malla, energizador o conjunto completo.", "Revisa alimentación, puesta a tierra y elementos incluidos en el manual.", "Comprueba vegetación, trazado y condiciones de uso antes de dimensionar la instalación."],
        ["Sigue el manual del equipo y los requisitos aplicables a tu instalación.", "Comprueba su funcionamiento con un instrumento adecuado y revisa el trazado periódicamente."]),
    "Disuasores y trampas de depredadores": criterio(
        "has identificado el problema y buscas un elemento complementario dentro de tu plan de protección",
        ["Distingue una barrera, un disuasor y una trampa: sus funciones son diferentes.", "Comprueba dimensiones, lugar de instalación y especies no objetivo que podrían acceder.", "Verifica las condiciones de uso y la normativa local antes de elegir."],
        ["Instala el producto sin dar por resuelto el cierre del gallinero.", "Registra incidencias y comprueba su efecto real; no se garantiza protección total."]),
    "Puertas automáticas y cierres": criterio(
        "quieres comparar la automatización del acceso y puedes seguir comprobando el cierre cada día",
        ["Mide el hueco útil y la zona que necesita el mecanismo para moverse.", "Confirma alimentación, modos de apertura y accesorios incluidos.", "Revisa el cierre, la respuesta ante obstáculos y el funcionamiento manual descritos en el manual."],
        ["Prueba un ciclo completo antes de depender del automatismo.", "Comprueba que las aves han entrado y que la puerta ha cerrado; programa y revisa los horarios."]),
    "Incubadoras y ovoscopios": criterio(
        "has definido la especie, la tanda y la función que necesitas, antes de comparar equipos",
        ["Distingue incubadora, ovoscopio, báscula y accesorios: no cumplen la misma función.", "Comprueba capacidad útil, instrumentos de control y piezas incluidas para tu especie.", "Revisa limpieza, repuestos y el manual del modelo concreto."],
        ["Prueba los equipos de control antes de iniciar la tanda.", "Anota lecturas y actuaciones; ningún aparato garantiza por sí solo el nacimiento."]),
    "Placas y lámparas de calor": criterio(
        "puedes preparar una zona de cría con equipo y alimentación eléctrica adecuados",
        ["Distingue placa, lámpara, bombilla y soporte; confirma qué contiene el pedido.", "Comprueba tensión, potencia, fijaciones y distancias indicadas en el manual.", "Revisa superficie útil y posibilidad de que los pollitos se aparten del calor."],
        ["Monta y prueba la calefacción antes de recibir las aves.", "Comprueba funcionamiento, ambiente y comportamiento del lote; ajusta conforme al manual."]),
    "Transporte y cuarentena": criterio(
        "necesitas mover o separar aves y has previsto espacio, ventilación y limpieza",
        ["Comprueba medidas interiores, tamaño de la puerta y resistencia de los cierres.", "Revisa capacidad y condiciones de transporte indicadas por el fabricante.", "Distingue una caja de transporte de un alojamiento adecuado para estancias prolongadas."],
        ["Comprueba el cierre y la ventilación antes de iniciar un traslado.", "Limpia el equipo entre usos y evita compartirlo entre lotes sin un protocolo definido."]),
    "Huevos y venta": criterio(
        "quieres organizar registros, envases o presentación y sabes qué función debe cumplir el producto",
        ["Distingue etiquetas, envases, utensilios y cuadernos; comprueba su contenido.", "Confirma medidas, cantidad, idioma y opciones de personalización si las hay.", "Para vender huevos, verifica las exigencias de presentación y etiquetado de tu mercado."],
        ["Prueba una muestra con tus envases o tu sistema de registro antes de preparar todo el lote.", "Anota el coste por unidad realmente utilizada para incorporarlo a tus cuentas."]),
    "Limpieza y desinfección": criterio(
        "has definido las superficies y puedes comprobar la compatibilidad y el uso de la etiqueta",
        ["Distingue limpieza de desinfección y concentrado de producto listo para usar.", "Comprueba superficies admitidas, instrucciones, protección y almacenamiento.", "Verifica condiciones de acceso de animales y personas, aclarado y secado en la etiqueta."],
        ["Sigue las instrucciones del producto concreto; no mezcles productos por iniciativa propia.", "Registra la limpieza realizada y conserva el envase identificado."]),
    "Ácaros, piojos e insectos": criterio(
        "el producto y su uso concreto han sido indicados por un profesional y corresponden a su etiqueta",
        ["Confirma el producto exacto, su etiqueta vigente y su autorización donde vas a utilizarlo.", "Distingue aplicaciones en locales de aplicaciones en animales.", "Revisa almacenamiento, protección y restricciones indicadas por el fabricante."],
        ["Consulta al veterinario sobre su adecuación al lote y sigue la etiqueta.", "Conserva la identificación del producto y registra las actuaciones que te indiquen."]),
    "Salud y botiquín": criterio(
        "buscas identificar una presentación concreta que tu veterinario ya ha revisado",
        ["Comprueba nombre, concentración y presentación; no asumas que productos parecidos son intercambiables.", "Verifica etiqueta, autorización local y restricciones para aves destinadas a alimentos.", "Revisa conservación y condiciones de uso con tu veterinario."],
        ["Utiliza el producto únicamente según la etiqueta y las indicaciones veterinarias.", "Guarda el envase identificado y registra las actuaciones del lote."]),
    "Vitaminas, electrolitos y probióticos": criterio(
        "has confirmado la necesidad del complemento y su adecuación a la alimentación del lote",
        ["Comprueba composición, especie indicada y presentación del envase.", "Revisa compatibilidad con lo que ya recibe el lote y condiciones de conservación.", "Consulta al proveedor o veterinario antes de combinar complementos."],
        ["Sigue las instrucciones del producto y evita sustituir con él una alimentación completa.", "Conserva la etiqueta y anota su uso y coste por separado."]),
    "Moscas": criterio(
        "buscas comparar una herramienta de control después de revisar limpieza y focos de cría",
        ["Comprueba si se trata de trampa, recambio o producto consumible.", "Revisa lugar de uso y distancia a animales, alimento y zonas de trabajo.", "Lee advertencias y condiciones de recambio antes de instalarlo."],
        ["Sigue la etiqueta para instalar y retirar el producto.", "Registra capturas o incidencias y sigue atendiendo los focos de suciedad."]),
    "Ratas y ratones": criterio(
        "has definido un plan de control y puedes impedir el acceso de aves y otros animales al equipo",
        ["Distingue estación vacía de conjunto con cebo; confirma el contenido.", "Comprueba cierre, fijación y acceso para inspecciones.", "Consulta las condiciones de uso del cebo y de la estación; la caja no elimina todos los riesgos."],
        ["Coloca y revisa el equipo según su etiqueta y el plan de control.", "Registra las inspecciones y mantén protegidos el pienso y sus puntos de derrame."]),
    "Herramientas de granja": criterio(
        "la tarea y las dimensiones de trabajo coinciden con las de esta herramienta",
        ["Comprueba medidas, material y accesorios incluidos.", "Revisa mantenimiento y compatibilidad con lo que necesitas manipular o fijar.", "Valora el manejo y la protección necesaria para el trabajo concreto."],
        ["Prueba el ajuste o la fijación antes de completar el trabajo.", "Limpia y guarda la herramienta fuera del acceso de las aves."]),
    "Ropa y protección": criterio(
        "conoces la tarea, la talla y el tipo de protección que necesitas",
        ["Comprueba talla y ajuste con las medidas del fabricante.", "Verifica la protección indicada para el riesgo concreto, sin deducirla del aspecto.", "Revisa lavado, recambio y compatibilidad con el resto del equipo."],
        ["Comprueba el ajuste antes de trabajar.", "Separa el equipo utilizado en el gallinero del de otras zonas y sigue sus instrucciones de limpieza."]),
    "Medición": criterio(
        "necesitas medir una variable concreta y puedes comprobar el rango y la colocación del instrumento",
        ["Comprueba variable, unidades, rango y precisión declarada por el fabricante.", "Revisa alimentación, sensores y método de comprobación de lecturas.", "Confirma si necesita conexión o aplicación para las funciones que buscas."],
        ["Coloca el instrumento en el punto que necesitas evaluar, conforme a su manual.", "Anota lecturas con fecha y ubicación; investiga diferencias entre sensores antes de ajustar equipos."]),
    "Energía e iluminación": criterio(
        "has definido la función eléctrica y puedes comprobar la compatibilidad de la instalación",
        ["Comprueba tensión, frecuencia, potencia, conectores y alimentación.", "Revisa protección frente a agua y polvo y condiciones de instalación.", "Confirma qué batería, cable, soporte o panel se incluye en la variante."],
        ["Monta el equipo conforme al manual y con cableado protegido.", "Comprueba su funcionamiento y registra incidencias; una cifra nominal no mide su rendimiento en tu granja."]),
    "Cámaras y luz nocturna": criterio(
        "quieres observar una zona y has comprobado alimentación, cobertura y ubicación",
        ["Distingue conexión Wi-Fi de conexión móvil y confirma bandas y servicio disponibles en tu país.", "Revisa costes de datos o almacenamiento, aplicación y suscripciones necesarias.", "Comprueba alimentación, soporte, condiciones de exterior y campo de visión."],
        ["Prueba imagen y cobertura en la ubicación definitiva antes de fijar el equipo.", "Comprueba los avisos y el almacenamiento; la cámara complementa los cierres del recinto."]),
}

# Se mantienen los textos auditados que conectan con comparativas y el aviso
# veterinario de las referencias marcadas. No se alteran ASIN, títulos ni URLs.
RECOMENDACIONES_AUDITADAS = {"B00TXW0UQK", "B00TXX20GW", "B07MQW8MQK"}


def enriquecer(p):
    c = CRITERIOS[p["categoria"]]
    p["encaje"] = "Puede encajar si " + c["encaje"] + "."
    p["comprobar_compra"] = list(c["comprobar"])
    p["consejos_uso"] = list(c["uso"])
    if not p["vet"] and p["asin"] not in RECOMENDACIONES_AUDITADAS:
        p["recomendacion"] = [p["encaje"]]
    p["descripcion_larga"] = (
        "## Antes de elegir este modelo\n\n"
        + "\n\n".join("- " + s for s in p["comprobar_compra"])
        + "\n\n## Consejos de uso\n\n"
        + "\n\n".join("- " + s for s in p["consejos_uso"])
    )
    return p
