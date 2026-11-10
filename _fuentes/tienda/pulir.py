# -*- coding: utf-8 -*-
"""Correcciones de Calidad sobre los textos públicos de la tienda."""
import re

AVISO_VET = (
    "Solo si te lo indica tu veterinario y según la etiqueta. "
    "Esta ficha no da dosis ni indicaciones de tratamiento."
)
FRASE_VET = "Se usa solo si te lo indica tu veterinario y según la etiqueta."

# Categorías de un solo producto → categoría donde se muestran.
FUSION = {
    "Manejo e identificación": "Herramientas de granja",
    "Libros de registro": "Huevos y venta",
    "Bebederos": "Bebederos normales",
    "Cama y nidales": "Nidales y cama",
    "Comederos y bebederos": "Comederos",
    "Energía y automatización": "Puertas automáticas y cierres",
    "Gallineros": "Puertas automáticas y cierres",
    "Nidales": "Nidales y cama",
    "Pollitos": "Kits, comederos y bebederos de pollitos",
    "Protección": "Puertas automáticas y cierres",
}

# Se quitan del catálogo. El valor es el ASIN que se queda, o None si la ficha redirige a la categoría.
EXCLUIR = {
    "B0BH2QQT9K": "B0FK27D1G7",
    "B0CJBJ26VY": "B0CWXWX52L",
}

VET_CATS = {
    "Vitaminas, electrolitos y probióticos",
    "Salud y botiquín",
    "Ácaros, piojos e insectos",
}

PROHIBIDAS = (
    "sin afirmar un resultado",
    "como indica el nombre",
    "como describe el anuncio",
    "el propio nombre describe",
    "el nombre lo describe",
    "el nombre lo presenta",
    "el anuncio lo describe",
    "el anuncio lo presenta",
    "en la granja se usa para",
    "no se paga en esta web",
    "el botón abre amazon",
    "que es lo que dice el nombre",
    "que es lo que el nombre",
    "tal como lo nombra",
    "antes de publicar",
    "conviene revisar",
    "cambió de vendedor",
    "cambio de vendedor",
)

# Textos que no pueden salir del CSV: salud, vacíos o correcciones puntuales.
OVERRIDES = {
    "B000R71WMQ": {
        "titulo": "Vinagre de manzana Bragg ecológico, crudo, con madre (1 galón)",
        "explicacion": [
            "Vinagre de manzana ecológico, crudo, sin filtrar y con madre, en garrafa de 128 onzas.",
            "Es un vinagre de alimentación de la marca Bragg, no un medicamento.",
        ],
        "recomendacion": [
            "Lo enlazamos como vinagre de manzana de esa marca, con muchas reseñas en Amazon.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B00KMNTYHK": {
        "titulo": "Vitaminas y electrolitos Rooster Booster con lactobacilos (8 oz)",
        "explicacion": [
            "Bote de 8 oz de vitaminas y electrolitos con lactobacilos, de la marca Rooster Booster.",
            "Es un complemento soluble. El envase trae su propia etiqueta.",
        ],
        "recomendacion": [
            "Lo tenemos en la tienda como complemento de ese tipo, sin indicar aquí para qué caso usarlo.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B000HHQEBK": {
        "titulo": "Nutri-Drench para aves, frasco de 4 oz",
        "explicacion": [
            "Suplemento líquido Poultry Nutri-Drench, de Bovidr Laboratories, en frasco de 4 oz.",
            "Es un complemento para aves. La etiqueta del frasco es la que manda.",
        ],
        "recomendacion": [
            "Lo enlazamos como complemento líquido de esa marca, para tenerlo localizado.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B07B53BHLW": {
        "titulo": "Sav-A-Chick, electrolitos con vitaminas y probiótico (18 sobres)",
        "explicacion": [
            "Caja con 9 sobres de electrolitos y vitaminas y 9 sobres de probiótico, de Sav-A-Chick.",
            "Son sobres de complemento. No indicamos aquí cómo mezclarlos.",
        ],
        "recomendacion": [
            "Lo enlazamos como pack de sobres de esa marca.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B08HB9TPZP": {
        "titulo": "Vitaminas y electrolitos Durvet para aves, pack de 6 sobres",
        "explicacion": [
            "Pack de 6 sobres de vitaminas y electrolitos para aves, de la marca Durvet.",
            "Es un complemento en sobres. La proporción de mezcla está en la etiqueta, no en esta página.",
        ],
        "recomendacion": [
            "Lo enlazamos como pack de sobres Durvet.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B0886GCSFT": {
        "titulo": "Vitaminas y electrolitos Durvet para aves, pack de 3 sobres",
        "explicacion": [
            "Pack de 3 sobres de vitaminas y electrolitos para aves, de la marca Durvet.",
            "Es el formato corto del mismo complemento. La etiqueta indica cómo se prepara.",
        ],
        "recomendacion": [
            "Lo enlazamos como pack pequeño de sobres Durvet.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B06XXWZGSV": {
        "titulo": "Probióticos Durvet Healthy Flock para aves",
        "explicacion": [
            "Probiótico para aves de la línea Healthy Flock, de Durvet.",
            "Es un complemento. Esta página no dice en qué momento del manejo usarlo.",
        ],
        "recomendacion": [
            "Lo enlazamos como probiótico de esa marca.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B00UTDXBX6": {
        "titulo": "Spray Vetericyn Plus para aves, frasco de 8 oz",
        "explicacion": [
            "Spray Vetericyn Plus para aves, en frasco de 8 oz.",
            "Es un producto de cuidado del envase. No describimos aquí en qué casos aplicarlo.",
        ],
        "recomendacion": [
            "Lo enlazamos por ser el spray Vetericyn Plus de 8 oz, con miles de reseñas en Amazon.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B01L0068NG": {
        "titulo": "Amprolio Durvet AmproMed 9,6 %, genérico de Corid, 1 galón",
        "explicacion": [
            "Concentrado líquido Durvet AmproMed, con amprolio al 9,6 %, presentado como genérico de Corid.",
            "El envase es de 1 galón. Es un producto zoosanitario, no un accesorio del gallinero.",
        ],
        "recomendacion": [
            "Lo enlazamos para quien ya lo tiene pautado. Aquí no decimos para qué problema sirve ni cómo diluirlo.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B000HHS6YS": {
        "titulo": "Blu-Kote de Dr. Naylor, pulverizador de 4 oz",
        "explicacion": [
            "Blu-Kote de Dr. Naylor en pulverizador de bomba, envase de 4 oz.",
            "Es el formato de bomba de ese producto de la marca.",
        ],
        "recomendacion": [
            "Lo enlazamos como el pulverizador Blu-Kote de 4 oz.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B078YGGTGJ": {
        "titulo": "Blu-Kote de Dr. Naylor en aerosol (128 g)",
        "explicacion": [
            "Blu-Kote de Dr. Naylor en aerosol, bote de 128 g.",
            "Es el mismo producto de la marca, en formato de aerosol.",
        ],
        "recomendacion": [
            "Lo enlazamos como el aerosol Blu-Kote de 128 g.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B06XFL85W6": {
        "titulo": "VetRx para aves de corral, frasco de 2 oz",
        "explicacion": [
            "Frasco de 2 oz de VetRx para aves de corral.",
            "Es un producto de botiquín avícola. El nombre comercial no lo convertimos aquí en una pauta.",
        ],
        "recomendacion": [
            "Lo enlazamos como el frasco de 2 oz de VetRx.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B0C2VZBDJT": {
        "titulo": "Tierra de diatomeas Harris de grado alimentario (10,5 lb)",
        "explicacion": [
            "Tierra de diatomeas de grado alimentario, de Harris, en saco de 10,5 libras.",
            "La ficha la presenta como certificada OMRI y sin aditivos.",
        ],
        "recomendacion": [
            "La enlazamos como tierra de diatomeas de grado alimentario de esa marca.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B01N39V5SU": {
        "titulo": "Tierra de diatomeas Harris de 10 lb, con espolvoreador",
        "explicacion": [
            "Tierra de diatomeas de grado alimentario de Harris, saco de 10 libras.",
            "El saco incluye un espolvoreador.",
        ],
        "recomendacion": [
            "La enlazamos por el formato con espolvoreador, no por un uso concreto.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B000ZNWANM": {
        "titulo": "Permetrina Gordon's Permethrin 10, envase de 1 cuarto",
        "explicacion": [
            "Concentrado Gordon's Permethrin 10, en envase de 1 cuarto de galón.",
            "La etiqueta lo dirige a ganado y locales. Es un biocida, no un accesorio.",
        ],
        "recomendacion": [
            "Lo enlazamos como ese concentrado de permetrina. Aquí no decimos sobre qué ni en qué cantidad.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B0DZH5XBD8": {
        "titulo": "Elector PSP, frasco de 237 ml",
        "explicacion": [
            "Elector PSP en frasco de 237 ml.",
            "La etiqueta lo presenta como producto para locales. No copiamos aquí su modo de empleo.",
        ],
        "recomendacion": [
            "Lo enlazamos como el frasco de 237 ml de Elector PSP.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B001BM4JLM": {
        "titulo": "Polvo Prozap Garden & Poultry Dust, bote de 2 lb",
        "explicacion": [
            "Polvo Prozap Garden and Poultry Dust, en bote de 2 libras.",
            "Es un polvo insecticida. La etiqueta trae el modo de empleo.",
        ],
        "recomendacion": [
            "Lo enlazamos como el bote de 2 libras de ese polvo Prozap.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B01LVWREWJ": {
        "titulo": "Spray Martin's Pen para aves, botella de 32 oz",
        "explicacion": [
            "Spray insecticida Martin's Pen, en botella de 32 oz.",
            "Es un insecticida de la marca Martin's. El modo de empleo está en la etiqueta.",
        ],
        "recomendacion": [
            "Lo enlazamos como la botella de 32 oz de Martin's Pen.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B007TA5Y00": {
        "titulo": "Pienso de arranque Manna Pro, bolsa de 5 lb, etiqueta medicada",
        "explicacion": [
            "Pienso de arranque y crecimiento para pollitos, de Manna Pro, en bolsa de 5 libras.",
            "La etiqueta lo presenta como medicado. No detallamos el principio ni el problema al que va dirigido.",
        ],
        "recomendacion": [
            "Lo enlazamos como ese saco pequeño de arranque medicado.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B01H41XXUG": {
        "titulo": "Pienso Purina Start & Grow en migaja, saco de 25 lb, etiqueta medicada",
        "explicacion": [
            "Pienso para pollitos Purina Start and Grow, en migaja, saco de 25 libras.",
            "La etiqueta lo presenta como medicado y nutricionalmente completo. Aquí no hay pauta de uso.",
        ],
        "recomendacion": [
            "Lo enlazamos como el saco de 25 libras de ese pienso medicado.",
            FRASE_VET,
        ],
        "vet": True,
    },
    "B0BZZWWWRY": {
        "explicacion": [
            "Concha de ostra triturada de American Classic, en bolsa de 5 libras.",
            "La ficha la presenta como suplemento de calcio para gallinas.",
        ],
        "recomendacion": [
            "La enlazamos como bolsa de concha de ostra de esa marca.",
            "Aún tiene muy pocas reseñas.",
        ],
    },
    "B01N5HJ4JM": {
        "explicacion": [
            "Grit de Manna Pro para pollitos, en bolsa de 5 libras, con probióticos en la fórmula.",
            "Es un grit insoluble, no un medicamento.",
        ],
        "recomendacion": [
            "Lo enlazamos como grit de arranque de Manna Pro.",
            "La bolsa indica la forma de ofrecerlo.",
        ],
    },
    "B0BB4RKX3N": {
        "explicacion": [
            "Concha de ostra triturada de Manna Pro, en pack de 6 bolsas de 5 libras.",
            "La ficha la presenta como suplemento de calcio.",
        ],
        "recomendacion": [
            "La enlazamos por el pack grande de esa concha de ostra.",
            "Tiene miles de reseñas en Amazon.",
        ],
    },
    "B07G2D4RKS": {
        "explicacion": [
            "Concha de ostra Oyster Sure Shell, en bolsa de 5 libras.",
            "La ficha la presenta como fuente de calcio para gallinas.",
        ],
        "recomendacion": [
            "La enlazamos como bolsa de concha de ostra de esa marca.",
            "El modo de ofrecerla está en la etiqueta.",
        ],
    },
    "B0BR7QTXSV": {
        "explicacion": [
            "Guantes desechables de nitrilo de 6 mil, negros y sin látex.",
            "La ficha los presenta como aptos para alimentos.",
        ],
        "recomendacion": [
            "Los recomendamos para limpiar el gallinero y manejar el pienso.",
            "Tienen miles de reseñas en Amazon.",
        ],
    },
    "B0039EEN0M": {
        "explicacion": [
            "Pulverizador manual de presión CHAPIN, de 2 galones.",
            "Lleva la boquilla Ultra Shot y está pensado para jardín y malas hierbas, según la ficha.",
        ],
        "recomendacion": [
            "Lo recomendamos como pulverizador de 2 galones para el gallinero y el huerto.",
            "Tiene más de 100.000 valoraciones.",
        ],
    },
    "B0CPF53QV3": {
        "titulo": "Malla hardware cloth de 1/2 pulgada, 36 pulgadas por 100 pies",
        "explicacion": [
            "Rollo de malla hardware cloth con aberturas de 1/2 pulgada.",
            "La variante de este enlace mide 36 pulgadas de alto por 100 pies de largo.",
        ],
        "recomendacion": [
            "La recomendamos para cerrar laterales, zócalos y faldones del corral.",
            "Este enlace abre el rollo de 36 pulgadas por 100 pies.",
        ],
    },
    "B0CS9LV4RD": {
        "titulo": "Percha PETSFIT de metal y madera para 8 a 10 gallinas",
        "explicacion": [
            "Percha cuadrada de PETSFIT, con estructura de metal y madera.",
            "Las medidas de la ficha son 55 pulgadas de largo por 40 de ancho, para 8 a 10 gallinas.",
        ],
        "recomendacion": [
            "La recomendamos como percha de metal y madera para un lote de ese tamaño.",
            "El montaje es el de una estructura cuadrada, no el de un listón suelto.",
        ],
    },
    "B001G8WRBU": {
        "titulo": "Respirador desechable 3M 8210 N95, paquete de 2",
        "explicacion": [
            "Respirador desechable 3M modelo 8210, tipo N95, en paquete de 2.",
            "Es un respirador de partículas para el trabajo, no un producto veterinario.",
        ],
        "recomendacion": [
            "Lo recomendamos para el polvo de la cama y del pienso.",
            "El paquete trae dos unidades.",
        ],
    },
    "B008MCUZZS": {
        "titulo": "Respirador desechable 3M 8210 N95, paquete de 20",
        "explicacion": [
            "Respirador desechable 3M 8210, tipo N95, en caja de 20.",
            "La ficha lo marca como aprobado por NIOSH.",
        ],
        "recomendacion": [
            "Lo recomendamos cuando hace falta una caja de recambio y no solo un par.",
            "Es el mismo modelo 8210, en formato de 20.",
        ],
    },
    "B09DNRJZYG": {
        "titulo": "Kit solar ExpertPower de 100 W y 12 V con batería de gel",
        "explicacion": [
            "Kit solar ExpertPower de 100 W y 12 V.",
            "Incluye el panel de 100 W, un regulador de 10 A y una batería de gel de 21 Ah.",
        ],
        "recomendacion": [
            "Lo recomendamos para alimentar un equipo de 12 V donde no hay enchufe.",
            "Las cifras son las del equipo, no una medición hecha en un gallinero.",
        ],
    },
    "B0GN41C1MQ": {
        "titulo": "Bebedero colgante FARM-TUFF de 5 galones para aves",
        "explicacion": [
            "Bebedero colgante de 5 galones, de plástico sin BPA, que se rellena por arriba.",
            "La marca es FARM-TUFF y la ficha lo dirige a gallinas, patos, pavos y aves de caza.",
        ],
        "recomendacion": [
            "Lo recomendamos como bebedero de campana de 5 galones.",
            "El agua se echa por la tapa superior.",
        ],
    },
    "B0D9Q4NVJW": {
        "titulo": "Hierbas secas MAQIHAN para el nidal, bolsa de 10 oz",
        "explicacion": [
            "Bolsa de 10 onzas de hierbas secas para el nidal, de MAQIHAN.",
            "La ficha las presenta como hierbas para ponedoras. No es un medicamento.",
        ],
        "recomendacion": [
            "Las enlazamos como hierbas de nidal de esa marca.",
            "No describimos un efecto sobre la puesta.",
        ],
    },
    "B0CPWLMMXK": {
        "titulo": "Comedero colgante de canaleta para aves, 6 x 3,5 cuartos",
        "explicacion": [
            "Comedero colgante en forma de canaleta, de 6 por 3,5 cuartos, en color negro.",
            "La ficha lo ofrece para aves y también lo nombra para cabras y otro ganado.",
        ],
        "recomendacion": [
            "Lo recomendamos como canaleta colgante de esa medida.",
            "Sirve para el pienso de las aves en un gancho, no como tolva cerrada.",
        ],
    },
    "B09BDB4DNS": {
        "titulo": "Kit de 4 bocas para comedero de cubo",
        "explicacion": [
            "Kit de 4 bocas para convertir un cubo en comedero de gallinas.",
            "La ficha lo presenta como comedero automático de poco desperdicio.",
        ],
        "recomendacion": [
            "Lo recomendamos para armar el comedero en un cubo que ya tengas.",
            "Trae cuatro bocas, no el cubo.",
        ],
    },
    "B0G3QPL9CC": {
        "titulo": "Cuatro bocas para comedero de cubo, con sierra de corona",
        "explicacion": [
            "Paquete de 4 bocas para comedero de cubo.",
            "Incluye una sierra de corona para abrir los agujeros del cubo.",
        ],
        "recomendacion": [
            "Lo recomendamos si vas a taladrar el cubo y quieres la sierra en el mismo pedido.",
            "La ficha lo presenta como de poco desperdicio.",
        ],
    },
    "B006ZUNIR6": {
        "titulo": "Comedero colgante galvanizado Harris Farms de 15 libras",
        "explicacion": [
            "Comedero colgante de metal galvanizado, de Harris Farms, modelo 1000293.",
            "La capacidad de la ficha es de 15 libras.",
        ],
        "recomendacion": [
            "Lo recomendamos como comedero de metal para colgar en el gallinero.",
            "No es un comedero de pedal: el pienso queda en la tolva galvanizada.",
        ],
    },
    "B0H5J3F9XD": {
        "titulo": "Juego de comedero y bebedero de 3 galones",
        "explicacion": [
            "Juego de comedero y bebedero para gallinas, de 3 galones.",
            "El color de esta variante es mandarina.",
        ],
        "recomendacion": [
            "Lo recomendamos como pareja de comedero y bebedero de esa capacidad.",
            "Es el único juego de este tipo en el catálogo y tiene 4,2 estrellas.",
        ],
    },
    "B0G6RSQ4XX": {
        "titulo": "Puerta automática solar de gallinero, con mando de 6 modos y pantalla",
        "explicacion": [
            "Puerta automática de gallinero con alimentación solar.",
            "El mando es programable de 6 modos y la pantalla es HD, según la ficha.",
        ],
        "recomendacion": [
            "La recomendamos como puerta solar con mando y pantalla.",
            "Tiene 4,2 estrellas y es una de las puertas automáticas de la tienda.",
        ],
    },
    "B0FJ7RQ6RB": {
        "titulo": "Abridor de puerta FarmLite, con temporizador y sensor de luz",
        "explicacion": [
            "Abridor automático de puerta de gallinero de FarmLite, marca que la ficha sitúa en Estados Unidos.",
            "Lleva temporizador y sensor de luz, y la ficha dice que no va con batería.",
        ],
        "recomendacion": [
            "Lo recomendamos como abridor con reloj y sensor de luz.",
            "La apertura que figura es de 8,55 pulgadas de ancho por 10,5 de alto, en color gris pizarra.",
        ],
    },
    "B0BBNBMCHY": {
        "titulo": "Almohadillas de nidal Eaton, 13 x 13 pulgadas, 10 unidades",
        "explicacion": [
            "Almohadillas de nidal para ponedoras, de Eaton Pet and Pasture.",
            "Miden 13 por 13 pulgadas y el pack trae 10.",
        ],
        "recomendacion": [
            "Las recomendamos como fondo de nidal de esa medida.",
            "Van en el nidal, debajo de la gallina, y se reponen cuando toca.",
        ],
    },
    "B0DMNRC2PV": {
        "titulo": "Percha PETSFIT de madera y hierro, con columpio",
        "explicacion": [
            "Percha PETSFIT de madera maciza y hierro a prueba de óxido, en color marrón.",
            "Lleva una barra con columpio. Mide 43 pulgadas de largo, 36 de ancho y 32 de alto.",
        ],
        "recomendacion": [
            "La recomendamos cuando quieres percha y columpio en la misma estructura.",
            "La ficha no dice para cuántas gallinas está pensada.",
        ],
    },
    "B0GXDS1G92": {
        "titulo": "Percha de varios niveles para 8 a 12 gallinas",
        "explicacion": [
            "Percha grande de varios niveles, con barras para dormir.",
            "La ficha la presenta para 8 a 12 gallinas.",
        ],
        "recomendacion": [
            "La recomendamos para un lote mediano que necesita más de un nivel.",
            "No trae medidas de ancho ni de fondo en el título del anuncio.",
        ],
    },
    "B0DKN6TZB6": {
        "titulo": "Comedero y bebedero para pollitos Hen's Choice",
        "explicacion": [
            "Juego de comedero y bebedero para pollitos, de Hen's Choice.",
            "El comedero es de 6,5 libras y el bebedero de 1,5 litros.",
        ],
        "recomendacion": [
            "Lo recomendamos como pareja de arranque para los primeros días.",
            "Tiene 4,2 estrellas y entra en los comederos de pollitos de la tienda.",
        ],
    },
    "B01MFE2ASJ": {
        "explicacion": [
            "Pienso en pellets para gallinas ponedoras, en saco de 25 libras.",
            "Es el Layena de puesta en el formato mediano.",
        ],
        "recomendacion": [
            "Lo recomendamos como pienso de puesta para un lote pequeño o mediano.",
            "La misma línea también está en saco de 50 libras.",
        ],
    },
}


def proteger(texto):
    texto = re.sub(r"EE\. UU\.(?=\s+[A-ZÁÉÍÓÚÑ])", "EE·UU.", texto)
    texto = re.sub(r"EE\.UU\.(?=\s+[A-ZÁÉÍÓÚÑ])", "EE·UU.", texto)
    texto = re.sub(r"EE\. UU\.(?=\s+[a-záéíóúñ])", "EE·UU", texto)
    texto = re.sub(r"EE\.UU\.(?=\s+[a-záéíóúñ])", "EE·UU", texto)
    texto = re.sub(r"EE\. UU\.$", "EE·UU.", texto)
    texto = texto.replace("RESCUE!", "⟦RESCUE⟧")
    texto = texto.replace("Dr. ", "⟦Dr⟧ ")
    return texto


def restaurar(texto):
    texto = texto.replace("EE·UU.", "EE. UU.")
    texto = texto.replace("EE·UU", "EE. UU.")
    return texto.replace("⟦RESCUE⟧", "RESCUE!").replace("⟦Dr⟧", "Dr.")


def frases(texto):
    limpio = re.sub(r"\s+", " ", proteger(texto or "").strip())
    salida = []
    for parte in re.split(r"(?<=[.!?])\s+", limpio):
        parte = restaurar(parte).strip()
        if not parte:
            continue
        baja = parte.lower()
        if baja.startswith("nota:"):
            continue
        if "antes de publicar" in baja or "conviene revisar" in baja or "cambió de vendedor" in baja:
            continue
        if not parte.endswith((".", "!", "?")):
            parte += "."
        salida.append(parte)
    return salida


def partir(texto):
    explicacion, recomendacion = [], []
    for frase in frases(texto):
        if recomendacion or re.match(r"^(La|Lo|Las|Los)\s+recomendamos\b", frase) or re.match(r"^Ojo\s*:", frase):
            recomendacion.append(frase)
        else:
            explicacion.append(frase)
    return explicacion, recomendacion


def cerrar(izquierda, derecha):
    izquierda = izquierda.strip().rstrip(".,;") + "."
    derecha = derecha.strip()
    derecha = derecha[0].upper() + derecha[1:]
    if not derecha.endswith((".", "!", "?")):
        derecha += "."
    return [izquierda, derecha]


EMPIEZA = re.compile(
    r"^(pensad[oa]s?|hech[oa]s?|indicad[oa]s?|fabricad[oa]s?|apilable|galvanizad)",
    re.I,
)


def dividir(frase):
    base = frase[:-1] if frase.endswith((".", "!", "?")) else frase
    paren = re.search(r"\s*\(([^)]{12,})\)\s*$", base)
    if paren and len(base[:paren.start()]) >= 30:
        dentro = paren.group(1).strip()
        dentro = dentro[0].upper() + dentro[1:]
        if not dentro.endswith("."):
            dentro += "."
        return [base[:paren.start()].strip().rstrip(".,") + ".", dentro]
    ficha = re.search(r"\s+que la ficha\s+(.+)$", base, re.I)
    if ficha and len(base[:ficha.start()]) >= 24 and len(ficha.group(1)) >= 24:
        resto = ficha.group(1).strip()
        if resto.startswith(("describe ", "presenta ")):
            resto = "La ficha lo " + resto
        else:
            resto = "La ficha " + resto
        if not resto.endswith("."):
            resto += "."
        return [base[:ficha.start()].strip().rstrip(".,") + ".", resto]
    partes = base.split(", ")
    if len(partes) >= 2:
        for i in range(1, len(partes)):
            derecha = ", ".join(partes[i:]).strip()
            izquierda = ", ".join(partes[:i]).strip()
            if len(izquierda) >= 36 and len(derecha) >= 40 and EMPIEZA.match(derecha):
                return cerrar(izquierda, derecha)
    if " aunque " in base:
        izquierda, derecha = base.split(" aunque ", 1)
        if len(izquierda) >= 30 and len(derecha) >= 20:
            return cerrar(izquierda, "aunque " + derecha)
    return None


def ensanchar(lista):
    if len(lista) >= 2:
        return lista[:4]
    if not lista:
        return lista
    partido = dividir(lista[0])
    return partido if partido else lista


def preparar(fila):
    asin = fila["ASIN"].strip()
    if asin in OVERRIDES:
        dato = OVERRIDES[asin]
        titulo = (dato.get("titulo") or fila["titulo_seo"]).strip()
        return {
            "titulo": titulo,
            "explicacion": list(dato["explicacion"]),
            "recomendacion": list(dato["recomendacion"]),
            "origen": "reescrito",
            "vet": bool(dato.get("vet")),
        }
    titulo = fila["titulo_seo"].strip()
    explicacion, recomendacion = partir(fila["por_que_lo_recomendamos"])
    explicacion = ensanchar(explicacion)
    recomendacion = ensanchar(recomendacion)
    return {
        "titulo": titulo,
        "explicacion": explicacion,
        "recomendacion": recomendacion,
        "origen": "catalogo",
        "vet": False,
    }


def problemas_de_texto(asin, titulo, explicacion, recomendacion, vet):
    fallos = []
    if not explicacion or not recomendacion or len(explicacion) > 4 or len(recomendacion) > 4:
        fallos.append(f"{asin}: frases {len(explicacion)}/{len(recomendacion)}")
    if vet and len(recomendacion) < 2:
        fallos.append(f"{asin}: la ficha de veterinario se queda corta")
    blob = " ".join([titulo] + explicacion + recomendacion).lower()
    for frase in PROHIBIDAS:
        if frase in blob:
            fallos.append(f"{asin}: frase prohibida «{frase}»")
    for frase in explicacion + recomendacion:
        if frase.strip() in {"UU.", "EE.", "según la ficha."}:
            fallos.append(f"{asin}: párrafo cortado «{frase}»")
    if vet:
        if FRASE_VET not in recomendacion:
            fallos.append(f"{asin}: falta la frase del veterinario")
        for palabra in ("coccid", "dosis", "picotazo", "herida", "infest", "golpe de calor",
                        "remedio", "imprescindible", "pequeña dosis", "flora intestinal",
                        "cáscara fuerte", "cáscara fina", "aves débiles", "sin apetito"):
            if palabra in blob:
                fallos.append(f"{asin}: término clínico «{palabra}»")
    return fallos
