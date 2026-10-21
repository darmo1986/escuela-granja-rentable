/* Catálogo de la TIENDA NUEVA de Granja Rentable (dropshipping curado).
   Reglas de la casa (ver TIENDA.md):
   - Solo entran productos que superan TODOS los filtros de curaduría:
     rating ≥ 4,5, volumen de pedidos sólido, vendedor con historial y
     fotos de compradores. Lo que no se pudo verificar queda escrito en
     el campo «verificacion» de cada producto. Sin excepciones.
   - El visitante solo ve el catálogo de SU país (detectado por IP).
     Orden de despliegue: 1º MX, 2º ES, 3º US, luego CO, AR, PE, CL.
   - «activo: false» = el producto desaparece de la tienda al instante.
     El script check_stock.py vigila los enlaces y avisa; una persona
     cambia el flag (nunca un robot a ciegas).
   - «link_pago» vacío = todavía no hay enlace de pago de Stripe y la
     ficha ofrece pedir por WhatsApp. Cuando Pablo cree el enlace de
     pago en Stripe para el producto, se pega aquí y aparece Comprar.
   - «precio_confirmado: false» = precio derivado del coste en
     AliExpress + envío estimado + margen. NO es precio cerrado:
     Pablo lo confirma antes de publicar (convención del sitio).
*/
window.GR_TIENDA_CATALOGO = {
  "version": 1,
  "actualizado": "2026-10-21",
  "orden_paises": [
    "MX",
    "ES",
    "US",
    "CO",
    "AR",
    "PE",
    "CL"
  ],
  "paises_activos": [
    "MX",
    "ES",
    "US"
  ],
  "paises": {
    "MX": {
      "nombre": "México",
      "moneda": "MXN"
    },
    "ES": {
      "nombre": "España",
      "moneda": "EUR"
    },
    "US": {
      "nombre": "Estados Unidos",
      "moneda": "USD"
    },
    "CO": {
      "nombre": "Colombia",
      "moneda": "COP"
    },
    "AR": {
      "nombre": "Argentina",
      "moneda": "USD"
    },
    "PE": {
      "nombre": "Perú",
      "moneda": "PEN"
    },
    "CL": {
      "nombre": "Chile",
      "moneda": "CLP"
    }
  },
  "fx": {
    "fecha": "21 de octubre de 2026",
    "nota": "Tipos de referencia del propio sitio (js/config.js). 1 USD = 18,36 MXN; 1 USD = 0,893 EUR."
  },
  "productos": [
    {
      "slug": "copas-bebedero-automaticas",
      "nombre": "Copas de bebedero automáticas (pack de 6)",
      "categoria": "bebederos",
      "descripcion_corta": "Agua limpia siempre disponible: la copa se llena sola cuando bebe la gallina y el depósito queda cerrado y sin contaminar.",
      "descripcion": "El bebedero de copa es la forma más sencilla de acabar con los bebederos sucios, volcados y llenos de cama. Cada copa lleva una válvula que abre el paso del agua cuando la gallina la picotea y la mantiene al nivel justo, sin encharcar el suelo. El agua permanece dentro del cubo o del depósito cerrado, así que no le cae viruta, pienso ni excrementos: menos bacterias, menos problemas sanitarios y mucha menos limpieza. Se enroscan en un cubo, un bidón o un tubo y quedan funcionando en minutos. Una copa da de beber a unas 3-5 gallinas, así que el pack de 6 cubre un gallinero casero completo.",
      "incluye": [
        "6 copas de bebedero automáticas con válvula",
        "Tuercas y juntas de sellado"
      ],
      "utilidades": [
        "Gallineros de ponedoras: agua limpia las 24 horas sin rellenar bebederos a diario",
        "Pollitos a partir de la segunda semana, con la copa bajada a su altura",
        "Patos y codornices: beben de la copa sin mojar toda la cama",
        "Segunda línea de agua en parques y patios de gallinas en semilibertad"
      ],
      "como_se_usa": [
        "Taladra el cubo o bidón cerca de la base y enrosca cada copa con su tuerca y su junta",
        "Llena el depósito y comprueba que cada copa mantiene el nivel sin gotear",
        "Deja el depósito elevado: la gravedad hace el resto",
        "Revisa las copas una vez por semana y limpia la que tenga arena o cal"
      ],
      "imagenes": [],
      "imagen_local": "../img/productos/comedero-bebedero.webp",
      "imagen_local_nota": "Imagen orientativa del tipo de producto.",
      "precio_base_usd": 6.54,
      "precio_base_nota": "Pack de 6 al precio del anuncio mejor valorado: 1,09 US$ por copa.",
      "rating": 4.9,
      "pedidos": "1,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-chicken-drinking-nipples.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados de AliExpress (21-oct-2026): anuncio «Chicken Drinking Poultry Water Fountain Drinking Cup Automatic Drinker» con 4,9 estrellas y más de 1.000 vendidos a 1,09 US$/ud. Filtros superados: rating y volumen. NO verificable desde la web pública (AliExpress muestra la ficha completa solo en su app): nombre del vendedor, % de positivos, años de la tienda y fotos de compradores. Confirmar esos cuatro datos en la app antes de publicar la tienda.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 349,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 15.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 17.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "tetinas-bebedero-colgantes",
      "nombre": "Tetinas con copa colgante para línea de agua (pack de 10)",
      "categoria": "bebederos",
      "descripcion_corta": "El sistema de las granjas profesionales en tamaño casero: la tetina solo da agua cuando bebe el ave y el suelo queda seco.",
      "descripcion": "La tetina con cazoleta es el bebedero estándar de la avicultura profesional adaptado al gallinero casero. La bola de la tetina deja pasar una gota cuando la gallina la toca con el pico, y la copa de debajo recoge la que sobra: el agua del depósito no se contamina y la cama no se encharca, que es donde nacen la mayoría de los problemas sanitarios de un lote. Se enroscan en tubo de PVC, en manguera rígida o en la pared de un cubo, y permiten montar una línea de agua automática completa alimentada por un depósito elevado.",
      "incluye": [
        "10 tetinas con copa colgante",
        "Rosca estándar para tubo o cubo"
      ],
      "utilidades": [
        "Líneas de agua automáticas en gallineros de ponedoras",
        "Pollos de engorde: cama seca durante todo el lote, con menos amoniaco",
        "Jaulas y baterías de codornices de puesta",
        "Criadoras amplias donde los bebederos de suelo se ensucian en minutos"
      ],
      "como_se_usa": [
        "Enrosca las tetinas en el tubo o en el cubo, a la altura del lomo de las aves",
        "Conecta la línea a un depósito elevado y deja correr el agua para purgar el aire",
        "Las primeras horas, toca una tetina delante de las gallinas: aprenden en minutos",
        "Comprueba a diario que ninguna tetina gotea ni está obstruida"
      ],
      "imagenes": [],
      "imagen_local": "",
      "imagen_local_nota": "",
      "precio_base_usd": 5.5,
      "precio_base_nota": "Estimado del pack de 10 a partir de 0,22–1,09 US$/ud según tamaño de pack del anuncio.",
      "rating": 4.5,
      "pedidos": "1,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-chicken-drinking-nipples.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados de AliExpress (21-oct-2026): anuncio «5/10Pcs Chicken Quail Hanging Water Cups Nipple Drinking Bowl» con 4,5 estrellas, más de 1.000 vendidos y sello «Top selling on AliExpress». Filtros superados: rating (justo en el mínimo de la casa) y volumen. NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 299,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 12.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 15.49,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "kit-puertos-comedero-cubo",
      "nombre": "Kit de puertos para comedero de cubo (4 puertos + sierra copa)",
      "categoria": "comederos",
      "descripcion_corta": "Convierte un cubo en un comedero que no desperdicia: pienso seco, sin roedores y sin tirar grano a la cama.",
      "descripcion": "Buena parte del pienso que pagas acaba en el suelo si el comedero es abierto. Este kit lo resuelve con el sistema de puertos: perforas el cubo con la sierra copa incluida, montas los 4 puertos con sus juntas y sus tapas, y el pienso baja por gravedad solo cuando la gallina mete la cabeza a comer. El alimento queda cerrado, seco y fuera del alcance de roedores y pájaros, y el desperdicio cae casi a cero, que en un lote de engorde se nota en la conversión. Un puerto da de comer a unas 4 gallinas adultas; en un cubo de 20 L caben los 4 puertos del kit.",
      "incluye": [
        "4 puertos de comedero con tapa antirroedores",
        "4 juntas de goma de sellado",
        "1 sierra copa del diámetro exacto"
      ],
      "utilidades": [
        "Gallineros de ponedoras cuyo comedero abierto desperdicia mucho pienso",
        "Pollos de engorde en la fase final, cuando el consumo se dispara",
        "Gallineros con problema de ratas o pájaros que roban el pienso",
        "Dejar pienso para varios días si te ausentas un fin de semana"
      ],
      "como_se_usa": [
        "Marca y perfora el cubo con la sierra copa, con los agujeros cerca de la base",
        "Monta cada puerto con su junta de goma y su tapa",
        "Llena el cubo de pienso y ciérralo con su tapa",
        "Ajusta la altura: el borde del puerto debe quedar a la altura del lomo de las gallinas"
      ],
      "imagenes": [],
      "imagen_local": "../img/productos/comedero-bebedero.webp",
      "imagen_local_nota": "Imagen orientativa del tipo de producto.",
      "precio_base_usd": 17.57,
      "precio_base_nota": "PVP de referencia del kit en la tabla de más vendidos de AliExpress.",
      "rating": 4.6,
      "pedidos": "2,269",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-part-feeder.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en la tabla de productos más vendidos de AliExpress (21-oct-2026): «DIY Chicken Feeder Rain Proof Poultry Feeder Port Gravity Feed Kit» con 4,6 estrellas y 2.269 ventas. Filtros superados: rating y volumen (el mayor del lote). NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 699,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 33.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 37.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "ovoscopio-led-portatil",
      "nombre": "Ovoscopio LED portátil para revisar huevos fértiles",
      "categoria": "incubacion",
      "descripcion_corta": "Mira dentro del huevo sin abrirlo: embrión vivo, huevo claro o anillo de sangre, en segundos y sin calentar el huevo.",
      "descripcion": "Incubar sin ovoscopio es incubar a ciegas. Esta lámpara de luz LED fría de alta intensidad atraviesa la cáscara y enseña el interior del huevo: los días 7 y 14 ves la red de venas y el embrión, distingues el huevo claro que nunca estuvo fecundado y detectas el anillo de sangre de un embrión muerto. Retirar esos huevos a tiempo evita que se pudran dentro de la máquina y contaminen el resto de la tanda el día del nacimiento. La luz es fría, así que no calienta el huevo mientras revisas, funciona con pilas o USB según el set y trae adaptadores para huevos de gallina y de codorniz.",
      "incluye": [
        "Ovoscopio LED de luz fría",
        "Adaptadores para huevos de gallina y codorniz"
      ],
      "utilidades": [
        "Revisión de la incubadora los días 7 y 14 para retirar huevos claros y muertos",
        "Comprobar la fertilidad de los huevos de tus propias reproductoras antes de cargar la máquina",
        "Revisar huevos de pato y codorniz, más difíciles de ver a trasluz",
        "Control de calidad de las tandas cuando incubas para vender pollitos"
      ],
      "como_se_usa": [
        "Haz la revisión en una habitación oscura, sin sacar los huevos más tiempo del necesario",
        "Apoya el huevo sobre el ovoscopio con el polo ancho hacia arriba",
        "Busca las venas y el punto oscuro del embrión; marca los dudosos con un lápiz",
        "Devuelve los huevos a la incubadora nada más mirarlos y anota la fertilidad de la tanda"
      ],
      "imagenes": [],
      "imagen_local": "../img/productos/incubadora-24egg-dual.webp",
      "imagen_local_nota": "Imagen orientativa: la incubadora de la foto lleva ovoscopio integrado parecido.",
      "precio_base_usd": 27.81,
      "precio_base_nota": "Precio del set portátil mejor valorado de la categoría en AliExpress.",
      "rating": 4.6,
      "pedidos": "600+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-candling-incubator-lamp.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados de AliExpress (21-oct-2026): primer anuncio de la categoría «candling incubator lamp» con 4,6 estrellas y más de 600 vendidos (set portátil LED, 27,81 US$). Se descartaron lámparas sueltas desde 5,71 US$ por tener mucho menos volumen de ventas. Filtros superados: rating y volumen. NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 999,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 47.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 54.49,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "termostato-stc1000-incubadora",
      "nombre": "Termostato STC-1000 para incubadora (repuesto)",
      "categoria": "incubacion",
      "descripcion_corta": "El cerebro de la incubadora casera: mantiene los 37,5 °C encendiendo y apagando el calor por ti, día y noche.",
      "descripcion": "En una incubadora, medio grado arriba o abajo durante horas se paga con nacimientos malos. El STC-1000 es el controlador que llevan miles de incubadoras caseras: mide la temperatura con su sonda NTC de 1 m y acciona dos relés independientes, uno para calentar y otro para enfriar o ventilar, manteniendo estable la consigna que marques. Tiene pantalla LED clara y memoria ante cortes de luz: si se va la corriente, al volver sigue con tu ajuste. Existe en versiones de 220 V, 110 V y 12 V: elige la de tu red eléctrica y, al pedir por WhatsApp, lo confirmamos contigo antes de enviar.",
      "incluye": [
        "Controlador STC-1000",
        "Sonda NTC impermeable de 1 m"
      ],
      "utilidades": [
        "Controlar la temperatura de una incubadora casera o reparada",
        "Criadora de pollitos: mantener el calor y bajarlo semana a semana con precisión",
        "Repuesto cuando falla el controlador original de una incubadora",
        "Ventilar una pequeña sala de incubación o de nacimientos cuando sube la temperatura",
        "Y fuera de la granja: es el controlador clásico de terrarios y acuarios"
      ],
      "como_se_usa": [
        "Coloca la sonda a la altura de los huevos, sin que toque la resistencia",
        "Cablea el relé de calor a tu fuente de calor siguiendo el esquema de la carcasa",
        "Ajusta la consigna (37,5 °C en incubación de gallina) y un diferencial estrecho",
        "Contrasta la lectura con un termómetro fiable antes de meter los huevos"
      ],
      "imagenes": [],
      "imagen_local": "",
      "imagen_local_nota": "",
      "precio_base_usd": 3.99,
      "precio_base_nota": "Precio retail representativo: los anuncios de AliExpress lo sitúan entre 3,3 y 4,4 US$ según la versión de voltaje.",
      "rating": 4.8,
      "pedidos": "5,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-stc-1000-temperature-controller.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados retail de AliExpress (21-oct-2026): varias tarjetas de anuncio del STC-1000 coinciden en 4,8 estrellas y más de 5.000 vendidos (otro anuncio: 4,8 estrellas y más de 1.000). Filtros superados: rating y volumen. NO verificable desde la web pública (AliExpress muestra la ficha completa solo en su app): nombre del vendedor, % de positivos, años de la tienda y fotos de compradores. Confirmar esos cuatro datos en la app antes de publicar la tienda.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 249,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 10.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 12.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "termostato-enchufe-sonda",
      "nombre": "Termostato de enchufe con sonda y temporizador",
      "categoria": "incubacion",
      "descripcion_corta": "Control de temperatura sin cablear nada: enchufas la fuente de calor y el termostato la gobierna con su sonda.",
      "descripcion": "Para quien quiere la temperatura controlada sin meterse en cables. Este enchufe termostato lleva su sonda donde tú la pongas —entre los huevos o bajo la criadora— y enciende y apaga lo que tenga enchufado: placa calefactora, bombilla de calor o esterilla. Así la criadora baja de los 35 °C de la primera semana hacia la temperatura ambiente sin que estés pendiente, y una incubadora casera gana un corte de seguridad extra. Lleva además temporizador, útil para programar ciclos de calor o de luz. Hay versión con enchufe europeo y con enchufe americano: lo confirmamos por WhatsApp antes de enviar.",
      "incluye": [
        "Enchufe termostato con pantalla LCD",
        "Sonda de temperatura con cable"
      ],
      "utilidades": [
        "Criadora de pollitos: regular la placa o la bombilla de calor sin estar presente",
        "Incubadora casera: segundo control de seguridad contra sobrecalentamientos",
        "Ponedoras en invierno: programar las horas de luz con su temporizador",
        "Mantener templada el agua de los bebederos en zonas con heladas, con una resistencia enchufada"
      ],
      "como_se_usa": [
        "Enchufa el termostato a la pared y la fuente de calor al termostato",
        "Coloca la sonda a la altura de los pollitos o de los huevos, no pegada a la fuente de calor",
        "Marca la temperatura objetivo en la pantalla",
        "El primer día contrasta con un termómetro: la sonda manda, pero verificar no cuesta nada"
      ],
      "imagenes": [],
      "imagen_local": "",
      "imagen_local_nota": "",
      "precio_base_usd": 8.98,
      "precio_base_nota": "Precio del anuncio retail de AliExpress (versión con temporizador): 8,98 US$. La versión de enchufe EU se anuncia a 12,38 US$ con 4,9 estrellas y más de 3.000 vendidos.",
      "rating": 4.9,
      "pedidos": "2,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-thermostat-socket.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados retail de AliExpress (21-oct-2026): anuncio «timer socket thermostat» con sonda y temporizador con 4,9 estrellas y más de 2.000 vendidos a 8,98 US$; la variante de enchufe EU muestra 4,9 estrellas y más de 3.000 vendidos. Filtros superados: rating y volumen. NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 399,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 18.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 21.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "modulo-termostato-w1209",
      "nombre": "Módulo termostato W1209 12 V con caja y sonda",
      "categoria": "incubacion",
      "descripcion_corta": "La plaquita de las incubadoras caseras: control de calor o frío a 12 V, con sonda incluida y caja protectora.",
      "descripcion": "El W1209 es el módulo que late dentro de media incubadora casera del mundo. Mide la temperatura con su sonda NTC y acciona un relé que enciende la resistencia o el ventilador cuando toca, con la consigna y el diferencial que programes en sus botones. Funciona a 12 V, así que se alimenta con la típica fuente de 12 V de las incubadoras caseras y de muchos proyectos de criadora. Esta versión trae la caja acrílica que protege la electrónica del polvo y la humedad del gallinero, que es justamente lo que acaba matando a las placas desnudas.",
      "incluye": [
        "Módulo W1209 con pantalla LED",
        "Sonda NTC impermeable",
        "Caja acrílica de protección"
      ],
      "utilidades": [
        "Construir o reparar una incubadora casera alimentada a 12 V",
        "Criadora de pollitos con la resistencia o el ventilador gobernados por temperatura",
        "Encender el ventilador de un gallinero pequeño cuando aprieta el calor",
        "Mantener frescos los huevos fértiles en conservación (12-16 °C) antes de incubar"
      ],
      "como_se_usa": [
        "Alimenta el módulo con una fuente de 12 V y cablea el relé a la resistencia o al ventilador",
        "Coloca la sonda donde quieres medir: a la altura de los huevos o de los pollitos",
        "Programa el modo (calor o frío), la consigna y el diferencial",
        "Prueba un ciclo completo en vacío antes de confiarle una tanda"
      ],
      "imagenes": [],
      "imagen_local": "",
      "imagen_local_nota": "",
      "precio_base_usd": 2.99,
      "precio_base_nota": "Referencia derivada: el módulo suelto se anuncia en AliExpress desde ~1,1 US$; se toman 2,99 US$ como coste del kit con caja y sonda.",
      "rating": 4.8,
      "pedidos": "1,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-w1209-thermostat.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados retail de AliExpress (21-oct-2026): anuncio «W1209 DC 5V 12V heat cool temp thermostat temperature control switch» con 4,8 estrellas y más de 1.000 vendidos; otros anuncios del mismo módulo muestran 4,9 estrellas. Filtros superados: rating y volumen. NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 199,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 8.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 10.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "mini-termohigrometro-pack-5",
      "nombre": "Mini termohigrómetros para incubadora (pack de 5)",
      "categoria": "incubacion",
      "descripcion_corta": "Temperatura y humedad de un vistazo dentro de la incubadora: cinco medidores para contrastar lecturas y tener repuesto.",
      "descripcion": "En incubación, la humedad manda tanto como la temperatura: de ella depende que el pollito pueda romper la cáscara el día 21. Estos mini termohigrómetros redondos se empotran en la tapa o la pared de la incubadora casera, o se dejan apoyados dentro, y marcan temperatura y humedad de un vistazo cada vez que pasas por delante. El pack de 5 tiene una razón práctica: en la misma máquina puedes montar dos y contrastarlos (si discrepan de forma clara, uno está fallando), y repartir los demás entre la criadora, el gallinero y el cajón de repuestos.",
      "incluye": [
        "5 mini termohigrómetros digitales redondos",
        "Pilas instaladas"
      ],
      "utilidades": [
        "Incubadora casera: vigilar temperatura y humedad sin abrir la tapa",
        "Criadora: comprobar que el calor de cada semana es el que toca",
        "Gallinero: vigilar la humedad ambiental en invierno, cuando se ventila menos",
        "Conservación de huevos fértiles: guardarlos en su rango de humedad antes de incubar"
      ],
      "como_se_usa": [
        "Coloca un medidor a la altura de los huevos, lejos del chorro directo de la resistencia",
        "Si tu incubadora es casera, empotra uno en la tapa para leer sin abrir",
        "Pon dos juntos el primer día y quédate la lectura coincidente como referencia",
        "Apunta temperatura y humedad dos veces al día en la ficha de la tanda"
      ],
      "imagenes": [],
      "imagen_local": "../img/productos/termohigrometro.webp",
      "imagen_local_nota": "Imagen orientativa del tipo de producto.",
      "precio_base_usd": 5.45,
      "precio_base_nota": "Pack de 5 a partir del precio retail por unidad (≈1,09 US$) del anuncio más vendido de su categoría en AliExpress.",
      "rating": 4.8,
      "pedidos": "10,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-mini-hygrometer.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados retail de AliExpress (21-oct-2026): anuncio «Mini Hygrometer Thermometer Fahrenheit or Celsius Meter Digital LCD Monitor Round» con 4,8 estrellas y más de 10.000 vendidos, repetido en varias tarjetas coincidentes. Filtros superados: rating y volumen (el mayor del catálogo). NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 299,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 13.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 15.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "puerta-automatica-gallinero-solar",
      "nombre": "Puerta automática de gallinero solar con temporizador",
      "categoria": "gallinero",
      "descripcion_corta": "Abre al amanecer y cierra al anochecer sola: gallinas guardadas y depredadores fuera aunque tú no estés.",
      "descripcion": "El momento peligroso del gallinero es el anochecer: si un día vuelves tarde, o las gallinas quedan fuera o la puerta queda abierta para zorros y perros. Esta puerta automática lo resuelve: funciona con energía solar y batería recargable, abre y cierra por sensor de luz o a las horas que programes en su pantalla LCD, y lleva protección anti-atrapamiento: si una gallina está en el paso, la puerta se detiene y retrocede. La carcasa es de aluminio resistente a la intemperie, trae mando a distancia para abrir o cerrar a mano cuando lo necesites y se atornilla sobre la abertura del gallinero en minutos.",
      "incluye": [
        "Puerta automática con panel solar",
        "Mando a distancia",
        "Tornillería de montaje"
      ],
      "utilidades": [
        "Ponedoras en semilibertad: salida al parque al amanecer sin tener que madrugar tú",
        "Fines de semana y vacaciones: el gallinero se abre y se cierra solo",
        "Zonas con zorros, perros o mapaches: la puerta cerrada a su hora, sin olvidos",
        "Gallineros alejados de casa, donde ir dos veces al día sale caro"
      ],
      "como_se_usa": [
        "Atornilla la puerta sobre la abertura del gallinero, con el panel solar recibiendo luz",
        "Elige el modo: sensor de luz o temporizador con tus horas",
        "Comprueba el recorrido completo y prueba el anti-atrapamiento con la mano",
        "Los primeros días vigila al anochecer que todas entren antes del cierre"
      ],
      "imagenes": [],
      "imagen_local": "",
      "imagen_local_nota": "",
      "precio_base_usd": 39.99,
      "precio_base_nota": "Precio retail de referencia del modelo solar con pantalla LCD y mando, según datos de ventas de AliExpress recopilados por accio (ver el campo verificacion).",
      "rating": 4.6,
      "pedidos": "810 al mes",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-automatic-chicken-coop-door.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "EVIDENCIA SECUNDARIA (no es la tarjeta del anuncio vista directamente): datos de ventas retail de AliExpress recopilados por accio (21-oct-2026): modelo solar con pantalla LCD, temporizador, sensor de luz y 4 modos con 4,6 estrellas y 810 ventas en el último mes a 39,99 US$ (el total acumulado es mayor); la misma categoría muestra un modelo con 4,5 estrellas y 2.492 ventas en el último mes. Filtros superados: rating y volumen (mensual) según esa recopilación. Pendiente doble antes de publicar: confirmar en la app de AliExpress la nota, los vendidos totales, el vendedor, su % de positivos, los años de tienda y las fotos de compradores.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 1469,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 69.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 79.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "anillas-numeradas-pack-100",
      "nombre": "Anillas de clip numeradas para gallinas (pack de 100)",
      "categoria": "gallinero",
      "descripcion_corta": "Cada gallina con su número: la base para saber quién pone, quién no y de qué año es cada lote.",
      "descripcion": "Sin identificación, todas las gallinas parecen iguales y seleccionar es imposible. Estas anillas de clip se ponen y se quitan en segundos, sin herramientas, van numeradas y vienen en varios colores: un color por año de nacimiento o por familia, y el número para el registro individual de cada ave. Con ellas sabes qué ponedora rinde y cuál lleva dos meses sin poner comiendo igual que las demás, qué gallinas son hijas de tu mejor reproductora y qué lote toca renovar. Sirven para gallinas adultas, patos y gansos jóvenes, y el pack de 100 cubre el gallinero entero y las reposiciones.",
      "incluye": [
        "100 anillas de clip numeradas",
        "Varios colores surtidos"
      ],
      "utilidades": [
        "Marcar las ponedoras por año de nacimiento para renovar el lote a tiempo",
        "Identificar a las mejores reproductoras y quedarte con sus hijas",
        "Control individual de puesta: detectar a la que no pone y decide su salida",
        "Distinguir tandas de pollitas que entran en puesta en fechas distintas"
      ],
      "como_se_usa": [
        "Elige un color por año o por familia y apúntalo en tu libreta o en tu app de registro",
        "Abre el clip y ciérralo en la pata, por encima del tobillo: debe girar sin apretar",
        "Anota número, color y fecha de nacimiento o de entrada en puesta",
        "Revisa el ajuste en las aves jóvenes que aún están creciendo"
      ],
      "imagenes": [],
      "imagen_local": "../img/productos/anillas.webp",
      "imagen_local_nota": "Imagen orientativa del tipo de producto.",
      "precio_base_usd": 2.99,
      "precio_base_nota": "Referencia conservadora del pack de 100: el anuncio retail muestra precios desde 0,99 US$ en promoción.",
      "rating": 4.5,
      "pedidos": "500+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-chicken-leg-rings.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados retail de AliExpress (21-oct-2026): anuncio «100 pcs Chicken Foot Rings Label Clasp Plastic Poultry Leg Snap Ratchet Clip» con 4,5 estrellas y más de 500 vendidos. Filtros superados: rating (justo en el mínimo de la casa) y volumen. NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 199,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 8.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 10.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "huevos-falsos-nido-pack-12",
      "nombre": "Huevos falsos de nido (pack de 12)",
      "categoria": "gallinero",
      "descripcion_corta": "El truco más barato del gallinero: enseña a las jóvenes dónde poner y quita la manía de picar los huevos.",
      "descripcion": "Dos problemas clásicos del gallinero se arreglan con un huevo de plástico macizo. El primero: las pollitas que empiezan a poner lo hacen en cualquier rincón; con uno o dos huevos falsos en cada nidal entienden dónde va la puesta desde el primer día. El segundo: la gallina que descubre que los huevos se comen; al picar plástico duro una y otra vez, la mayoría abandona la costumbre antes de que se la copien las demás. Tienen un tamaño parecido al huevo de gallina, se lavan en un momento y duran años. El pack de 12 da para todos los nidales del gallinero.",
      "incluye": [
        "12 huevos falsos de plástico macizo"
      ],
      "utilidades": [
        "Nidales de ponedoras jóvenes que están empezando a poner en el suelo",
        "Corregir a la gallina que pica o se come los huevos",
        "Dejar señalados los nidales sin gastar huevos de verdad",
        "Nidos trampa para llevar el control de puesta de cada gallina"
      ],
      "como_se_usa": [
        "Coloca uno o dos huevos falsos en cada nidal, sobre la cama del nido",
        "Déjalos fijos: se trata de que el nidal siempre «tenga huevos»",
        "Si hay una picadora, déjale solo huevos falsos durante unos días",
        "Lávalos cuando se ensucien y vuelve a ponerlos"
      ],
      "imagenes": [],
      "imagen_local": "",
      "imagen_local_nota": "",
      "precio_base_usd": 3.96,
      "precio_base_nota": "Pack de 12 a partir del precio retail por unidad (0,33 US$) del anuncio de AliExpress.",
      "rating": 4.5,
      "pedidos": "2,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-fake-chicken-eggs.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados retail de AliExpress (21-oct-2026): anuncio «Fake Chicken Eggs Poultry Layer Coop Hatching Simulation Dummy Egg» (packs de 6 a 24) con 4,5 estrellas y más de 2.000 vendidos. Filtros superados: rating (justo en el mínimo de la casa) y volumen. NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 249,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 10.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 12.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    },
    {
      "slug": "bascula-precision-huevos",
      "nombre": "Báscula de precisión 0,01 g para pesar huevos",
      "categoria": "incubacion",
      "descripcion_corta": "Pesa cada huevo al gramo y cada pollito al nacer: la clasificación profesional de la recogida, en el bolsillo.",
      "descripcion": "El peso decide el destino de cada huevo. Para incubar rinden mejor los de 55 a 65 g: los muy pequeños dan pollitos débiles y los muy grandes suelen fallar o traer doble yema. Esta báscula de bolsillo pesa hasta 500 g con precisión de 0,01 g y pantalla retroiluminada, así que clasificas la recogida en un momento: incubar, vender o consumir. Y en la crianza vale igual: pesar a los pollitos al nacer y en las revisiones semanales es la forma de detectar a tiempo un lote de engorde que se está quedando atrás, cuando aún se puede corregir.",
      "incluye": [
        "Báscula de precisión 500 g / 0,01 g",
        "Bandeja de pesaje"
      ],
      "utilidades": [
        "Seleccionar los huevos de incubar por peso (55-65 g) y descartar los extremos",
        "Clasificar los huevos de venta por calibres, como hacen las granjas",
        "Pesar pollitos al nacer y controlar el crecimiento semanal del engorde",
        "Dosificar al gramo suplementos, vitaminas y medicación en polvo"
      ],
      "como_se_usa": [
        "Enciende la báscula sobre una superficie firme y espera a que marque cero",
        "Pesa huevo a huevo y sepáralos por destino: incubar, venta o consumo",
        "En las tandas, anota el peso medio: es el dato que compara una tanda con otra",
        "Guárdala seca y sin peso encima para que no se descalibre"
      ],
      "imagenes": [],
      "imagen_local": "../img/productos/bascula.webp",
      "imagen_local_nota": "Imagen orientativa del tipo de producto.",
      "precio_base_usd": 2.33,
      "precio_base_nota": "Precio retail observado en el anuncio de AliExpress (2,33 US$, en promoción).",
      "rating": 4.9,
      "pedidos": "10,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-precision-scale.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados retail de AliExpress (21-oct-2026): anuncio «0.01g Kitchen Scale High-precision Small Electronic Scale Precision Scale» con 4,9 estrellas y más de 10.000 vendidos. Filtros superados: rating y volumen. NO verificable desde la web pública: vendedor, % de positivos, años de tienda y fotos de compradores. Confirmar en la app antes de publicar.",
      "paises": {
        "MX": {
          "disponible": true,
          "moneda": "MXN",
          "precio": 189,
          "precio_confirmado": false,
          "dias_envio": "10–15 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento. La aduana puede cobrar una tasa al recibir."
        },
        "ES": {
          "disponible": true,
          "moneda": "EUR",
          "precio": 7.99,
          "precio_confirmado": false,
          "dias_envio": "7–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento (programa Choice)."
        },
        "US": {
          "disponible": true,
          "moneda": "USD",
          "precio": 9.99,
          "precio_confirmado": false,
          "dias_envio": "8–12 días",
          "origen_envio": "internacional",
          "nota": "Envío internacional con seguimiento."
        }
      }
    }
  ]
};
