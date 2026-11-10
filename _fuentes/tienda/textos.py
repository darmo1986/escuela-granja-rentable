# -*- coding: utf-8 -*-
"""Textos de la tienda. Lo escrito aquí sale del nombre del anuncio, sin cifras nuevas ni efectos médicos."""

SECCIONES = [
    ("agua", "Agua y bebederos", [
        "Bebederos normales",
        "Bebederos",
        "Bebederos nipple y copas",
        "Bebederos y bases calefactadas",
        "Agua y riego",
    ]),
    ("comida", "Comida y comederos", [
        "Comederos",
        "Comederos y bebederos",
        "Pienso",
        "Golosinas e insectos",
        "Grit y concha de ostra",
        "Almacenaje de pienso",
        "Kits, comederos y bebederos de pollitos",
        "Pollitos",
    ]),
    ("descanso", "Nidales, cama y perchas", [
        "Nidales y cama",
        "Nidales",
        "Cama y nidales",
        "Perchas",
        "Baño de arena",
    ]),
    ("corral", "Gallinero, malla y depredadores", [
        "Gallineros y corrales",
        "Gallineros",
        "Malla y vallas",
        "Malla eléctrica y pastores",
        "Disuasores y trampas de depredadores",
        "Puertas automáticas y cierres",
        "Energía y automatización",
        "Protección",
    ]),
    ("cria", "Incubación, calor y manejo", [
        "Incubadoras y ovoscopios",
        "Placas y lámparas de calor",
        "Transporte y cuarentena",
        "Manejo e identificación",
        "Huevos y venta",
        "Libros de registro",
    ]),
    ("salud", "Limpieza, plagas y botiquín", [
        "Limpieza y desinfección",
        "Ácaros, piojos e insectos",
        "Moscas",
        "Ratas y ratones",
        "Salud y botiquín",
        "Vitaminas, electrolitos y probióticos",
    ]),
    ("taller", "Herramientas, ropa y energía", [
        "Herramientas de granja",
        "Ropa y protección",
        "Medición",
        "Energía e iluminación",
        "Cámaras y luz nocturna",
    ]),
]

NOMBRE_PUBLICO = {
    "Bebederos nipple y copas": "Bebederos de tetina y copas",
}

# Segunda frase de la explicación, solo cuando el texto de origen se queda en una.
# No añade medidas ni efectos: dice para qué sirve según la categoría del anuncio.
PARA = {
    "Disuasores y trampas de depredadores": "tapar o disuadir lo que el propio anuncio señala como ave o depredador",
    "Malla eléctrica y pastores": "cercar como describe el anuncio, con malla o pastor eléctrico",
    "Malla y vallas": "cerrar el corral o el gallinero con la malla que nombra el anuncio",
    "Puertas automáticas y cierres": "abrir o cerrar la trampilla del gallinero, que es lo que indica el nombre",
    "Nidales y cama": "la cama o el nidal que el anuncio describe",
    "Bebederos nipple y copas": "dar agua con tetinas o copas, el sistema que nombra el anuncio",
    "Bebederos y bases calefactadas": "ofrecer agua con el bebedero o la base que el nombre describe",
    "Comederos": "servir el pienso con el comedero que describe el anuncio",
    "Golosinas e insectos": "ofrecer la golosina o el insecto que el nombre indica",
    "Grit y concha de ostra": "dejar a libre disposición el grit o la concha que nombra el anuncio",
    "Pienso": "alimentar con el pienso que el propio nombre describe",
    "Vitaminas, electrolitos y probióticos": "el uso de complemento que el nombre indica, sin que aquí se afirme un efecto",
    "Salud y botiquín": "el cuidado que el nombre del anuncio describe, sin añadir efectos que no figuran ahí",
    "Ratas y ratones": "lo que el nombre indica frente a ratas o ratones",
    "Ácaros, piojos e insectos": "lo que el nombre indica frente a ácaros, piojos o insectos, sin afirmar un resultado",
    "Limpieza y desinfección": "limpiar o desinfectar lo que el anuncio nombra",
    "Kits, comederos y bebederos de pollitos": "criar pollitos con el kit o el accesorio que describe el nombre",
    "Placas y lámparas de calor": "dar calor a los pollitos con el aparato que nombra el anuncio",
    "Incubadoras y ovoscopios": "incubar o mirar los huevos, según lo que diga el nombre",
    "Huevos y venta": "guardar o presentar los huevos como indica el anuncio",
    "Herramientas de granja": "el trabajo de granja que el nombre de la herramienta indica",
    "Manejo e identificación": "identificar o manejar las aves como describe el anuncio",
    "Medición": "medir lo que el nombre del aparato indica",
    "Ropa y protección": "el equipo de trabajo que nombra el anuncio",
    "Transporte y cuarentena": "mover o separar aves como indica el nombre",
    "Almacenaje de pienso": "guardar el pienso como describe el anuncio",
    "Agua y riego": "llevar o regular el agua como indica el nombre",
    "Energía e iluminación": "dar luz o energía como describe el anuncio",
    "Cámaras y luz nocturna": "vigilar o iluminar como indica el nombre",
    "Baño de arena": "el baño de arena que el anuncio describe",
    "Gallineros y corrales": "alojar a las aves en el corral o gallinero que nombra el anuncio",
    "Perchas": "que las aves descansen en la percha que describe el nombre",
    "Bebederos normales": "dar agua con el bebedero que nombra el anuncio",
    "Moscas": "lo que el nombre indica frente a las moscas, sin afirmar un resultado",
    "Libros de registro": "anotar el lote como describe el cuaderno",
    "Bebederos": "dar agua con el bebedero que nombra el anuncio",
    "Cama y nidales": "el nidal o la cama que el anuncio describe",
    "Comederos y bebederos": "dar pienso y agua con el juego que nombra el anuncio",
    "Energía y automatización": "automatizar lo que el nombre indica",
    "Gallineros": "el gallinero o la puerta que el nombre describe",
    "Nidales": "el nidal que el anuncio describe",
    "Pollitos": "dar de comer o de beber a los pollitos como indica el nombre",
    "Protección": "la puerta o la protección del gallinero que el nombre describe",
}

CLAVES = {
    "Disuasores y trampas de depredadores": "red malla depredador halcon ave silvestre trampa corral gallinero",
    "Malla eléctrica y pastores": "pastor electrico malla cerca zorro gallinas pasto energizador solar",
    "Malla y vallas": "malla alambre hardware cloth gallinero valla corral agujero",
    "Puertas automáticas y cierres": "puerta automatica gallinero trampilla cierre temporizador sensor",
    "Nidales y cama": "nidal cama viruta paja gallinas ponederas huevos",
    "Bebederos nipple y copas": "bebedero tetina nipple copa agua gallinas aves automatico",
    "Bebederos y bases calefactadas": "bebedero calefactado base calor invierno agua congelada gallinas",
    "Comederos": "comedero tolva pienso alimento gallinas pedal cubo antirratas",
    "Golosinas e insectos": "golosina larva insecto premio gallinas snack proteina",
    "Grit y concha de ostra": "grit concha ostra calcio piedra gallinas ponedoras",
    "Pienso": "pienso alimento saco pellets ponedoras gallinas",
    "Vitaminas, electrolitos y probióticos": "vitamina electrolito probiotico complemento agua gallinas",
    "Salud y botiquín": "botiquin herida spray aves gallinas cuidado",
    "Ratas y ratones": "rata raton cebo trampa estacion gallinero",
    "Ácaros, piojos e insectos": "acaro piojo insecto tierra diatomeas gallinero",
    "Limpieza y desinfección": "limpieza desinfectante gallinero bebedero comedero",
    "Kits, comederos y bebederos de pollitos": "pollito kit criadora comedero bebedero cria",
    "Placas y lámparas de calor": "placa calor lampara criadora pollito bombilla",
    "Incubadoras y ovoscopios": "incubadora ovoscopio huevo volteo nacimiento",
    "Huevos y venta": "huevo huevera carton docena venta",
    "Herramientas de granja": "herramienta pala alicate guante granja",
    "Manejo e identificación": "anilla identificacion pata gallina marca",
    "Medición": "termometro higrometro medir temperatura humedad",
    "Ropa y protección": "guante bota ropa mascarilla respirador granja",
    "Transporte y cuarentena": "transporte jaula caja cuarentena ave gallina",
    "Almacenaje de pienso": "contenedor pienso hermetico cubo almacen",
    "Agua y riego": "valvula flotador deposito agua riego",
    "Energía e iluminación": "solar panel bateria luz energia 12v gallinero",
    "Cámaras y luz nocturna": "camara vigilancia luz noche seguridad gallinero",
    "Baño de arena": "bano arena polvo gallinas dust",
    "Gallineros y corrales": "gallinero corral parque walk-in malla",
    "Perchas": "percha roost gallina descanso barra",
    "Bebederos normales": "bebedero campana colgante agua gallinas galon",
    "Moscas": "mosca trampa granja exterior",
    "Libros de registro": "diario registro puesta cuaderno lote huevos",
    "Bebederos": "bebedero colgante agua gallinas galon fuente",
    "Cama y nidales": "nidal hierba cama ponedora",
    "Comederos y bebederos": "comedero bebedero juego gallinas galon",
    "Energía y automatización": "puerta solar automatica gallinero mando",
    "Gallineros": "puerta automatica gallinero abridor temporizador",
    "Nidales": "nidal almohadilla ponedora huevo",
    "Pollitos": "pollito comedero bebedero cria",
    "Protección": "puerta solar gallinero temporizador sensor",
}

# Productos sin por_que_lo_recomendamos, o con un titulo_seo que no estaba en español.
# Cada lista son frases sueltas. Solo datos que ya están en la columna nombre.
TEXTOS = {
    "B001G8WRBU": {
        "titulo": "Respirador desechable 3M 8210 N95, paquete de 2",
        "explicacion": [
            "El anuncio lo describe como respirador desechable 3M, modelo 8210, de tipo N95, en paquete de 2.",
            "El nombre lo presenta como respirador frente a partículas.",
            "Sirve para cubrir nariz y boca en el trabajo, que es el uso que indica ese nombre.",
        ],
        "recomendacion": [
            "Lo recomendamos porque el nombre señala un respirador N95 desechable de 3M, en dos unidades.",
            "No lo describimos como tratamiento ni como protección frente a enfermedades: eso no está en el nombre.",
            "El precio se ve en Amazon.",
        ],
    },
    "B008MCUZZS": {
        "titulo": "Respirador desechable 3M 8210 N95, paquete de 20",
        "explicacion": [
            "El anuncio lo describe como respirador desechable 3M 8210, de tipo N95, en paquete de 20.",
            "El nombre añade que está aprobado por NIOSH.",
            "Es el mismo tipo de respirador de partículas, en una caja más grande, según esa ficha.",
        ],
        "recomendacion": [
            "Lo recomendamos cuando hace falta más de un recambio, porque el nombre indica un paquete de 20.",
            "No añadimos usos que el anuncio no nombra.",
            "La compra se hace en Amazon.",
        ],
    },
    "B09DNRJZYG": {
        "titulo": "Kit solar ExpertPower de 100 W y 12 V con batería de gel",
        "explicacion": [
            "El nombre lo describe como kit solar de 100 W y 12 V, de la marca ExpertPower.",
            "Según ese nombre, incluye un panel de 100 W y 12 V, un regulador de carga de 10 A y una batería de gel de 21 Ah.",
            "Sirve para montar una alimentación de 12 V a partir del sol, que es lo que el anuncio enumera.",
        ],
        "recomendacion": [
            "Lo recomendamos para un equipo de 12 V alejado de un enchufe, porque el nombre lo presenta como kit solar con batería.",
            "No afirmamos cuánta autonomía da: el anuncio lista las piezas, no una medición en la granja.",
            "El precio se consulta en Amazon.",
        ],
    },
    "B0GN41C1MQ": {
        "titulo": "Bebedero colgante FARM-TUFF de 5 galones para aves",
        "explicacion": [
            "El nombre lo describe como bebedero colgante de 5 galones, de plástico sin BPA, que se rellena por arriba.",
            "La marca que figura es FARM-TUFF y el anuncio lo dirige a gallinas, patos, pavos y aves de caza.",
            "Sirve para dejar agua en un bebedero de ese tipo, que es lo que el nombre dice.",
        ],
        "recomendacion": [
            "Lo recomendamos como bebedero colgante de 5 galones, porque así lo presenta el anuncio.",
            "No comparamos cuánto dura el agua ni damos un consumo.",
            "La compra y el precio están en Amazon.",
        ],
    },
    "B0D9Q4NVJW": {
        "titulo": "Hierbas secas MAQIHAN para el nidal de ponedoras, 10 oz",
        "explicacion": [
            "El anuncio lo describe como hierbas secas para el nidal de gallinas ponedoras, de la marca MAQIHAN.",
            "El envase que nombra es de 10 onzas, un paquete.",
            "El nombre lo llama suplemento de hierbas secas para poner en el nido.",
        ],
        "recomendacion": [
            "Lo recomendamos como hierbas de nidal, que es el uso que el nombre indica.",
            "No afirmamos que mejore la puesta ni que trate nada: el anuncio no da una dosis ni un efecto.",
            "El precio se ve en Amazon.",
        ],
    },
    "B0CPWLMMXK": {
        "titulo": "Comedero colgante de canaleta para aves, 6 x 3,5 cuartos",
        "explicacion": [
            "El nombre lo describe como comedero colgante de canaleta para aves y también lo presenta para cabras y otro ganado.",
            "La medida que figura es 6 por 3,5 cuartos, en color negro.",
            "Sirve para ofrecer alimento en una canaleta colgada, que es lo que el anuncio dice.",
        ],
        "recomendacion": [
            "Lo recomendamos como canaleta colgante de esa medida para aves.",
            "El anuncio también nombra el uso con ganado; no añadimos especies que no aparezcan.",
            "El precio se ve en Amazon.",
        ],
    },
    "B09BDB4DNS": {
        "titulo": "Kit de 4 bocas para comedero de cubo",
        "explicacion": [
            "El nombre lo describe como kit de comedero automático para gallinas, de 4 bocas, para montar en un cubo.",
            "El anuncio lo llama de poco desperdicio.",
            "Sirve para convertir un cubo en comedero, que es el uso que indica el nombre.",
        ],
        "recomendacion": [
            "Lo recomendamos como kit de 4 bocas para cubo, tal como lo nombra el anuncio.",
            "No damos una cifra de pienso ahorrado: el anuncio no aporta un número.",
            "La compra se hace en Amazon.",
        ],
    },
    "B0BH2QQT9K": {
        "titulo": "Kit rojo de 6 bocas para comedero de cubo",
        "explicacion": [
            "El nombre lo describe como comedero automático para gallinas, de 6 bocas, en color rojo.",
            "El anuncio lo presenta como de poco desperdicio y para montarlo uno mismo.",
            "Sirve para armar un comedero de cubo con esas bocas.",
        ],
        "recomendacion": [
            "Lo recomendamos como juego de 6 bocas rojas, porque eso es lo que dice el nombre.",
            "No medimos aquí el ahorro de pienso.",
            "El precio está en Amazon.",
        ],
    },
    "B0G3QPL9CC": {
        "titulo": "Cuatro bocas para comedero de cubo, con sierra de corona",
        "explicacion": [
            "El nombre lo describe como un paquete de 4 bocas o copas para comedero de gallinas, pensadas para un cubo.",
            "Incluye, según el anuncio, una sierra de corona para hacer los agujeros.",
            "El nombre lo llama de poco desperdicio.",
        ],
        "recomendacion": [
            "Lo recomendamos para quien quiere montar el comedero en un cubo con las 4 bocas y la sierra que el anuncio nombra.",
            "No afirmamos cuánto pienso se deja de tirar.",
            "La compra se hace en Amazon.",
        ],
    },
    "B006ZUNIR6": {
        "titulo": "Comedero colgante galvanizado Harris Farms de 15 libras",
        "explicacion": [
            "El nombre lo describe como comedero colgante de metal galvanizado para aves, de la marca Harris Farms.",
            "La capacidad que figura es de 15 libras y el modelo que nombra es el 1000293.",
            "Sirve para colgar el pienso de las aves, que es el uso del anuncio.",
        ],
        "recomendacion": [
            "Lo recomendamos como comedero colgante galvanizado de 15 libras, porque así lo presenta el nombre.",
            "No añadimos un número de aves ni una duración del pienso.",
            "El precio se consulta en Amazon.",
        ],
    },
    "B0H5J3F9XD": {
        "titulo": "Juego de comedero y bebedero de 3 galones",
        "explicacion": [
            "El nombre lo describe como un juego de comedero y bebedero para gallinas, de 3 galones.",
            "El color que figura es mandarina.",
            "El anuncio usa el lema de reducir el desorden del gallinero.",
        ],
        "recomendacion": [
            "Lo recomendamos como juego de comedero y bebedero de esa capacidad, que es lo que el nombre dice.",
            "No damos por hecho que acabe con el desorden: es el lema del anuncio, no una medición nuestra.",
            "Es el único producto de su categoría en esta tienda y el precio se ve en Amazon.",
        ],
    },
    "B0G6RSQ4XX": {
        "titulo": "Puerta automática solar de gallinero, con mando y pantalla",
        "explicacion": [
            "El nombre lo describe como puerta automática de gallinero alimentada por energía solar.",
            "Según el anuncio, el mando es programable de 6 modos y la pantalla es HD.",
            "Sirve para abrir y cerrar la trampilla con ese mando, que es el uso que el nombre indica.",
        ],
        "recomendacion": [
            "Lo recomendamos como puerta solar con mando y pantalla, porque eso es lo que lista el anuncio.",
            "No afirmamos un alcance del mando ni una autonomía.",
            "Es el único producto de su categoría aquí y la compra se hace en Amazon.",
        ],
    },
    "B0FJ7RQ6RB": {
        "titulo": "Abridor de puerta FarmLite con temporizador y sensor de luz",
        "explicacion": [
            "El nombre lo describe como abridor automático de puerta de gallinero, de la marca FarmLite, presentada como marca de Estados Unidos.",
            "El anuncio dice que no va con batería y que lleva temporizador y sensor de luz.",
            "El color que nombra es gris pizarra y la apertura que figura es de 8,55 pulgadas de ancho por 10,5 de alto.",
        ],
        "recomendacion": [
            "Lo recomendamos como abridor con temporizador y sensor de luz, que es lo que el nombre enumera.",
            "No añadimos un consumo ni un tipo de instalación que el anuncio no detalle.",
            "El precio se ve en Amazon.",
        ],
    },
    "B0BBNBMCHY": {
        "titulo": "Almohadillas de nidal Eaton, 13 x 13 pulgadas, 10 unidades",
        "explicacion": [
            "El nombre lo describe como almohadillas de nidal para gallinas ponedoras, de Eaton Pet and Pasture.",
            "La medida que figura es 13 por 13 pulgadas y el paquete es de 10.",
            "Sirven para ponerlas en el nidal, que es el uso que indica el anuncio.",
        ],
        "recomendacion": [
            "Las recomendamos como juego de 10 almohadillas de esa medida para los nidales.",
            "No afirmamos que cambien la puesta.",
            "El precio está en Amazon.",
        ],
    },
    "B0DMNRC2PV": {
        "titulo": "Percha PETSFIT de madera y hierro, con columpio",
        "explicacion": [
            "El nombre lo describe como percha para gallinas de la marca PETSFIT, de madera maciza y hierro que el anuncio llama a prueba de óxido.",
            "Incluye una barra con columpio y el color que nombra es marrón.",
            "Las medidas que figuran son 43 pulgadas de largo, 36 de ancho y 32 de alto.",
        ],
        "recomendacion": [
            "La recomendamos como percha de madera y hierro con columpio, porque así la presenta el nombre.",
            "No damos un número de gallinas: el anuncio no lo pone en este modelo.",
            "El precio se consulta en Amazon.",
        ],
    },
    "B0GXDS1G92": {
        "titulo": "Percha de varios niveles para 8 a 12 gallinas",
        "explicacion": [
            "El nombre lo describe como percha grande de varios niveles, con barras para que las gallinas duerman.",
            "El anuncio la presenta para 8 a 12 gallinas.",
            "Sirve como sitio de descanso dentro del gallinero, que es el uso que indica el nombre.",
        ],
        "recomendacion": [
            "La recomendamos cuando el lote es de ese tamaño, porque el nombre habla de 8 a 12 gallinas.",
            "No añadimos medidas que el anuncio no da.",
            "La compra se hace en Amazon.",
        ],
    },
    "B0CS9LV4RD": {
        "titulo": "Percha metálica cuadrada PETSFIT para 8 a 10 gallinas",
        "explicacion": [
            "El nombre lo describe como percha cuadrada de metal para gallinas, de la marca PETSFIT.",
            "Las medidas que figuran son 55 pulgadas de largo, 40 de ancho y 2,5 de alto.",
            "El anuncio la presenta para 8 a 10 gallinas.",
        ],
        "recomendacion": [
            "La recomendamos como percha metálica de esas medidas para un lote de 8 a 10 aves, que es lo que dice el nombre.",
            "No describimos el montaje más allá de lo que el anuncio llama percha.",
            "El precio se ve en Amazon.",
        ],
    },
    "B0DKN6TZB6": {
        "titulo": "Comedero y bebedero para pollitos Hen's Choice",
        "explicacion": [
            "El nombre lo describe como un juego de comedero y bebedero para pollitos, de la marca Hen's Choice.",
            "El comedero que figura es de 6,5 libras y el bebedero de 1,5 litros.",
            "Sirve para dar pienso y agua a los pollitos, que es el uso que indica el anuncio.",
        ],
        "recomendacion": [
            "Lo recomendamos como juego de arranque para pollitos, con las capacidades que el nombre da.",
            "No decimos para cuántos pollitos alcanza.",
            "Es el único producto de su categoría en esta tienda y el precio está en Amazon.",
        ],
    },
    "B0CJBJ26VY": {
        "titulo": "Puerta automática solar de gallinero, marrón, con sensor de luz",
        "explicacion": [
            "El nombre lo describe como puerta automática de gallinero con energía solar.",
            "Según el anuncio, lleva temporizador y sensor de luz, y el color es marrón.",
            "Sirve para abrir y cerrar la trampilla con ese temporizador y ese sensor.",
        ],
        "recomendacion": [
            "La recomendamos como puerta solar con temporizador y sensor de luz, porque eso es lo que lista el nombre.",
            "No afirmamos un tamaño de apertura: el anuncio no lo da.",
            "El precio se consulta en Amazon.",
        ],
    },
}
