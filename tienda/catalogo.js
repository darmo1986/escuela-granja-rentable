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
   - «link_pago» vacío = todavía no hay enlace de pago de Stripe.
     Desde el 23-oct-2026 la ficha ya no depende de este campo: todos
     los productos se piden con «Comprar ahora» y el formulario de
     pedido de la web (ver TIENDA.md, sección de pedidos).
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
    },
    {
      "slug": "red-antipajaros-rollo",
      "nombre": "Red antipájaros en rollo (10/20 m) para gallinero y frutales",
      "categoria": "mallas",
      "descripcion_corta": "La barrera que no se negocia: cubre el parque, los comederos o los frutales y los pájaros silvestres se quedan fuera, sin dañarlos.",
      "descripcion": "Los pájaros silvestres le salen caros a cualquier granja: gorriones, palomas y estorninos se comen el pienso de los comederos exteriores, ensucian los bebederos, picotean la fruta en el árbol y son una vía de entrada de enfermedades al gallinero. La red antipájaros lo corta con una barrera física sencilla: un rollo de red de polietileno ligera que se extiende sobre el parque o el voladero, sobre los comederos o sobre los frutales, y deja pasar la luz y el aire pero no a las aves. Se corta a medida con unas tijeras, no se oxida ni se pudre como la metálica y, bien guardada, dura varias temporadas. Es la misma solución que venden las tiendas de avicultura como categoría propia, en su versión ligera y de bolsillo.",
      "incluye": [
        "1 rollo de red antipájaros de polietileno (10 o 20 m según la variante elegida al pedir)"
      ],
      "utilidades": [
        "Cubrir el parque o el voladero: las aves silvestres fuera del pienso y del agua de tus gallinas",
        "Proteger los frutales: higos, uvas, cerezas y manzanas sin picotazos",
        "Techar comederos y bebederos exteriores para que no los contaminen los gorriones",
        "Proteger siembras, fresas y hortalizas recién plantadas en el huerto",
        "Cerrar por arriba los corrales de pollitos y codornices frente a pájaros y gatos"
      ],
      "como_se_usa": [
        "Mide la zona a cubrir y corta la red a medida con unas tijeras",
        "Extiéndela sobre postes o sobre la estructura, sin tensarla en exceso para que no se deforme",
        "Fíjala con bridas, alambre o grapas cada 40-50 cm y remata bien los bordes",
        "Tras la temporada de fruta, retírala, sacúdela y guárdala enrollada a la sombra"
      ],
      "imagenes": [],
      "imagen_local": "",
      "imagen_local_nota": "",
      "precio_base_usd": 2.33,
      "precio_base_nota": "Precio de tarjeta del anuncio marcado «Top selling on AliExpress», según la variante de 10 o 20 m.",
      "rating": 4.6,
      "pedidos": "4,000+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-anti-bird-netting.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados de AliExpress (21-oct-2026): anuncio «20/10M Anti Bird Protection Net Mesh Garden Plant Netting Protect Plants and Fruit Trees from Birds Deer Poultry Best Fencing», marcado «Top selling on AliExpress», con 4,6 estrellas y más de 4.000 vendidos a 2,33 US$ según variante. Filtros superados: rating y volumen. NO verificable desde la web pública (AliExpress muestra la ficha completa solo en su app): nombre del vendedor, % de positivos, años de la tienda, fotos de compradores y almacén/plazo exacto por país. Confirmar esos datos en la app antes de publicar, fijando la variante exacta (10 o 20 m); si aparece una alternativa con almacén local que supere todos los filtros, tiene prioridad (política de almacén local).",
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
    },
    {
      "slug": "bolsas-red-proteger-fruta",
      "nombre": "Bolsas de red para proteger fruta (pack)",
      "categoria": "mallas",
      "descripcion_corta": "Cada fruto en su propia bolsa: la red deja pasar la luz y el aire, y pájaros, avispas y mosca de la fruta se quedan sin banquete.",
      "descripcion": "Embolsar la fruta en el árbol es la técnica de los fruticultores de toda la vida, y esta bolsa de red de nailon la hace cómoda: metes el fruto o el racimo dentro, cierras el cordón sobre el tallo y la cosecha queda a salvo del picoteo de los pájaros, de las avispas y de la mosca de la fruta, que es justo lo que arruina la uva, los higos y la fruta de hueso en las granjas caseras. La malla deja pasar la luz y el aire, así que la fruta madura con normalidad y se ve su color a través de la red para recoger en el punto justo, sin el plástico cerrado que cuece y condensa. Se lavan en un momento y se reutilizan temporada tras temporada.",
      "incluye": [
        "Bolsas de red de nailon con cordón de cierre (pack; el número de bolsas y el tamaño se confirman al pedir)"
      ],
      "utilidades": [
        "Racimos de uva de mesa: sin picoteo de pájaros ni avispas sobre la parra",
        "Higos, melocotones, manzanas y peras en los frutales caseros de la granja",
        "Fresas y tomates del huerto, los primeros que prueban los mirlos",
        "Proteger la fruta que dejas en el árbol para recoger semilla"
      ],
      "como_se_usa": [
        "Embolsa cuando el fruto ya está formado y aún verde, antes de que empiece a colorear",
        "Mete el fruto o el racimo en la bolsa y cierra el cordón sobre el tallo, sin estrangularlo",
        "Deja la bolsa puesta hasta la cosecha: la fruta madura dentro, a la vista",
        "Al recoger, vacía las bolsas, lávalas y guárdalas secas para la temporada siguiente"
      ],
      "imagenes": [],
      "imagen_local": "",
      "imagen_local_nota": "",
      "precio_base_usd": 6.41,
      "precio_base_nota": "Precio del pack en el anuncio retail de AliExpress. La bolsa suelta del mismo tipo se anuncia a 0,99 US$/ud. La composición exacta del pack (número de bolsas y tamaño) se fija en la app antes de publicar el precio.",
      "rating": 4.8,
      "pedidos": "900+",
      "vendedor": {
        "nombre": null,
        "positivo_pct": null,
        "anos": null
      },
      "enlace_proveedor": "https://www.aliexpress.com/w/wholesale-fruit-protection-bags.html",
      "link_pago": "",
      "activo": true,
      "verificacion": "Verificado en los resultados de AliExpress (21-oct-2026): anuncio pack «10-200Pcs Fruit Protection Netting Bags» con 4,8 estrellas y más de 900 vendidos a 6,41 US$ el pack, con entrega mostrada en tarjeta de unos 5 días; la bolsa suelta del mismo tipo («Nylon Plant Protection Netting Mesh Bag Cover for Fruit…») muestra 4,8 estrellas y más de 5.000 vendidos a 0,99 US$/ud. Filtros superados: rating y volumen. NO verificable desde la web pública (AliExpress muestra la ficha completa solo en su app): nombre del vendedor, % de positivos, años de la tienda, fotos de compradores y almacén. Confirmar esos datos en la app antes de publicar, incluida la composición exacta del pack (número de bolsas y tamaño); si aparece una alternativa con almacén local que supere todos los filtros, tiene prioridad (política de almacén local).",
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
  "slug": "bebedero-campana-finca-casarejo",
  "nombre": "Bebedero de campana automático Finca Casarejo",
  "categoria": "bebederos",
  "descripcion_corta": "El bebedero de campana de toda la vida, de una marca avícola española: nivel constante, se cuelga y se olvida de rellenar cada día.",
  "descripcion": "El bebedero de campana se conecta a un depósito o a la red y mantiene siempre el mismo nivel de agua en el plato gracias a su válvula automática. Se cuelga a la altura del lomo de las aves, así el agua queda lejos de la cama, no se vuelca y no se llena de viruta. Es el sistema que usan las granjas de verdad para lotes medianos: un solo bebedero da de beber a decenas de gallinas sin que tengas que cargar cubos cada mañana. Finca Casarejo es una marca española especializada en avicultura, con recambios y soporte en España.",
  "incluye": [
    "1 bebedero de campana automático",
    "Válvula de nivel incorporada"
  ],
  "utilidades": [
    "Lotes de ponedoras en suelo o en parque",
    "Pollos de engorde en la fase final",
    "Sustituir bebederos de plato que se vuelcan y ensucian el agua"
  ],
  "como_se_usa": [
    "Cuélgalo a la altura del lomo de tus aves y nivélalo",
    "Conecta la manguera al depósito elevado o a la red con reductor",
    "Regula la válvula para dejar unos 2 cm de agua en el plato",
    "Enjuaga el plato un par de veces por semana"
  ],
  "imagenes": [],
  "imagen_local": "../img/productos/bebedero-campana.webp",
  "imagen_local_nota": "Foto del producto del proveedor.",
  "precio_base_usd": 35.0,
  "precio_base_nota": "Precio en la ficha de AliExpress España (Finca Casarejo): 31,25 € IVA incluido.",
  "rating": 5.0,
  "pedidos": "7",
  "vendedor": {
    "nombre": "Finca_Casarejo Store",
    "positivo_pct": 94.9,
    "anos": null
  },
  "enlace_proveedor": "https://es.aliexpress.com/item/1005007663926484.html",
  "link_pago": "",
  "activo": true,
  "verificacion": "Ficha verificada en vivo el 21-oct-2026: «Envío desde España», entrega estimada 2-4 días, envío gratis. Marca avícola española conocida. Volumen bajo (7 vendidos, 1 reseña de 5 estrellas): entra por almacén local y marca, no por volumen.",
  "paises": {
    "ES": {
      "disponible": true,
      "moneda": "EUR",
      "precio": 39.95,
      "precio_confirmado": false,
      "dias_envio": "2–4 días",
      "origen_envio": "España",
      "nota": "Envío desde almacén en España, sin gastos de importación."
    }
  }
},
{
  "slug": "tolva-happy-chickens-finca-casarejo",
  "nombre": "Comedero tolva Happy Chickens 2 kg Finca Casarejo",
  "categoria": "comederos",
  "descripcion_corta": "Tolva con patas y sistema antidespilfarro: el pienso baja por gravedad y las gallinas no lo tiran a la cama.",
  "descripcion": "La tolva Happy Chickens de Finca Casarejo guarda 2 kg de pienso y lo va sirviendo por gravedad en la bandeja, con un diseño antidespilfarro que impide que las gallinas escarben y tiren el alimento al suelo. Va sobre patas, así el pienso queda elevado, seco y lejos de la humedad de la cama. Menos pienso desperdiciado significa menos coste por huevo: en una tolva abierta normal se puede perder hasta un tercio del alimento entre lo que tiran y lo que se moja. Marca avícola española, con envío desde España.",
  "incluye": [
    "1 comedero tolva Happy Chickens de 2 kg con patas"
  ],
  "utilidades": [
    "Gallineros caseros de 4 a 10 ponedoras",
    "Reducir el despilfarro de pienso frente a comederos abiertos",
    "Dejar comida para varios días si te vas un fin de semana"
  ],
  "como_se_usa": [
    "Móntala sobre sus patas en una zona cubierta del gallinero o el parque",
    "Llénala por arriba y deja que el pienso baje solo a la bandeja",
    "Revisa el nivel cada pocos días y limpia la bandeja una vez por semana"
  ],
  "imagenes": [],
  "imagen_local": "../img/productos/tolva-happy-chickens.webp",
  "imagen_local_nota": "Foto del producto del proveedor.",
  "precio_base_usd": 12.04,
  "precio_base_nota": "Precio en la ficha de AliExpress España (Finca Casarejo), variante 2 kg: 10,75 € IVA incluido. Hay variantes de 4, 8, 12 y 16 kg.",
  "rating": 4.6,
  "pedidos": "44",
  "vendedor": {
    "nombre": "Finca_Casarejo Store",
    "positivo_pct": 94.9,
    "anos": null
  },
  "enlace_proveedor": "https://es.aliexpress.com/item/1005007663840696.html",
  "link_pago": "",
  "activo": true,
  "verificacion": "Ficha verificada en vivo el 21-oct-2026: «Envío desde España», entrega estimada 2-4 días. 4,6 estrellas con 5 reseñas y 44 vendidos. Entra por almacén local y marca española.",
  "paises": {
    "ES": {
      "disponible": true,
      "moneda": "EUR",
      "precio": 16.95,
      "precio_confirmado": false,
      "dias_envio": "2–4 días",
      "origen_envio": "España",
      "nota": "Envío desde almacén en España, sin gastos de importación."
    }
  }
},
{
  "slug": "huevos-falsos-finca-casarejo",
  "nombre": "Huevos falsos macizos Finca Casarejo (pack de 6)",
  "categoria": "incubacion",
  "descripcion_corta": "Huevos macizos para enseñar a las gallinas dónde poner y animar los nidos: peso y tacto de huevo de verdad.",
  "descripcion": "Los huevos falsos macizos se colocan en los nidos para enseñar a las ponedoras jóvenes dónde tienen que poner y para estimular a las que están a punto de empezar. Al ser macizos tienen el peso y la consistencia de un huevo real, no como los huecos de plástico ligero que las gallinas acaban sacando del nido. También se usan para frenar el picaje de huevos: la gallina que pica un huevo falso aprende que picar no da comida. Pack de 6 de Finca Casarejo, marca avícola española.",
  "incluye": [
    "6 huevos falsos macizos"
  ],
  "utilidades": [
    "Enseñar a las pollitas jóvenes a poner en el nido y no en el suelo",
    "Estimular el inicio de la puesta",
    "Corregir el hábito de picar y comer los huevos"
  ],
  "como_se_usa": [
    "Deja uno o dos huevos falsos en cada nido de forma permanente",
    "Marca los falsos con un punto para no confundirlos al recoger",
    "Lávalos si se ensucian y vuelve a colocarlos"
  ],
  "imagenes": [],
  "imagen_local": "../img/productos/huevos-falsos.webp",
  "imagen_local_nota": "Foto del producto del proveedor.",
  "precio_base_usd": 13.33,
  "precio_base_nota": "Precio en la ficha de AliExpress España (Finca Casarejo), pack de 6: 11,90 € IVA incluido. Packs de 12 y 24 también disponibles.",
  "rating": 5.0,
  "pedidos": "9",
  "vendedor": {
    "nombre": "Finca_Casarejo Store",
    "positivo_pct": 94.9,
    "anos": null
  },
  "enlace_proveedor": "https://es.aliexpress.com/item/1005007663893590.html",
  "link_pago": "",
  "activo": true,
  "verificacion": "Ficha verificada en vivo el 21-oct-2026: «Envío desde España», entrega estimada 2-4 días, envío gratis. 5,0 estrellas con 5 reseñas. Volumen bajo: entra por almacén local y marca española.",
  "paises": {
    "ES": {
      "disponible": true,
      "moneda": "EUR",
      "precio": 17.95,
      "precio_confirmado": false,
      "dias_envio": "2–4 días",
      "origen_envio": "España",
      "nota": "Envío desde almacén en España, sin gastos de importación."
    }
  }
},
{
  "slug": "bascula-precision-500g",
  "nombre": "Báscula de precisión 500 g / 0,01 g SODANY",
  "categoria": "gallinero",
  "descripcion_corta": "Pesa al pollito, el huevo y las dosis con precisión de 0,01 g: la báscula pequeña que toda granja termina necesitando.",
  "descripcion": "Una báscula de bolsillo con precisión de centésima de gramo sirve para mucho más que para la cocina: pesar pollitos al nacer y en los controles semanales, clasificar huevos por peso antes de meterlos en la incubadora (los de peso medio eclosionan mejor) y dosificar con exactitud suplementos y medicamentos que van por gramo. Pantalla LCD con tara y pilas incluidas. Se vende desde almacén en España con entrega en pocos días.",
  "incluye": [
    "1 báscula digital 500 g / 0,01 g",
    "Pilas incluidas"
  ],
  "utilidades": [
    "Controles de peso de pollitos en las primeras semanas",
    "Selección de huevos para incubar por peso",
    "Dosificación precisa de suplementos y tratamientos"
  ],
  "como_se_usa": [
    "Enciéndela sobre una superficie plana y espera a que marque cero",
    "Usa la tara con el recipiente encima antes de pesar",
    "Guárdala sin peso encima para no descalibrar el sensor"
  ],
  "imagenes": [],
  "imagen_local": "../img/productos/bascula-precision.webp",
  "imagen_local_nota": "Foto del producto del proveedor.",
  "precio_base_usd": 10.02,
  "precio_base_nota": "Precio en la ficha de AliExpress España (SODANY): 8,95 € IVA incluido.",
  "rating": 4.7,
  "pedidos": "72",
  "vendedor": {
    "nombre": "Tienda Bazar Madrid Online",
    "positivo_pct": 93.7,
    "anos": null
  },
  "enlace_proveedor": "https://es.aliexpress.com/item/1005010488549160.html",
  "link_pago": "",
  "activo": true,
  "verificacion": "Ficha verificada en vivo el 21-oct-2026: «Envío desde España», entrega estimada 2-4 días. 4,7 estrellas con 12 reseñas y 72 vendidos. Vendedor con 93,7 % de positivos (por debajo del 95 % ideal): entra por almacén local confirmado y bajo riesgo del producto.",
  "paises": {
    "ES": {
      "disponible": true,
      "moneda": "EUR",
      "precio": 14.95,
      "precio_confirmado": false,
      "dias_envio": "2–4 días",
      "origen_envio": "España",
      "nota": "Envío desde almacén en España, sin gastos de importación."
    }
  }
},
{
  "slug": "termostato-w1209",
  "nombre": "Termostato digital W1209 con sonda sumergible",
  "categoria": "incubacion",
  "descripcion_corta": "El cerebro barato de las incubadoras caseras: controla la temperatura de −50 a 110 °C con relé incorporado.",
  "descripcion": "El W1209 es el termostato que monta media comunidad de incubadoras caseras: sonda sumergible, pantalla digital y un relé que enciende y apaga la resistencia o la bombilla para mantener la temperatura que le marques, entre −50 y 110 °C. Funciona a 12 V, así que es seguro para experimentar, y cuesta tan poco que conviene tener uno de repuesto. También vale para criadoras, terrarios y fermentadores. Lo vende SATKIT, tienda española de electrónica, con envío desde España en unos 2 días.",
  "incluye": [
    "1 termostato W1209 con pantalla",
    "Sonda de temperatura sumergible"
  ],
  "utilidades": [
    "Incubadoras caseras de poliestireno o nevera reciclada",
    "Control de la lámpara de calor de la criadora",
    "Repuesto económico para incubadoras con el termostato averiado"
  ],
  "como_se_usa": [
    "Aliméntalo a 12 V y conecta la carga al relé según el esquema de la placa",
    "Programa la temperatura objetivo y la histéresis (0,5 °C va bien para incubar)",
    "Deja la sonda a la altura de los huevos, sin tocar la resistencia"
  ],
  "imagenes": [],
  "imagen_local": "../img/productos/termostato-w1209.webp",
  "imagen_local_nota": "Foto del producto del proveedor.",
  "precio_base_usd": 9.69,
  "precio_base_nota": "Precio en la ficha de AliExpress España (SATKIT Store): 8,65 € IVA incluido.",
  "rating": null,
  "pedidos": "1",
  "vendedor": {
    "nombre": "SATKIT Store",
    "positivo_pct": 95.7,
    "anos": null
  },
  "enlace_proveedor": "https://es.aliexpress.com/item/1005003920493321.html",
  "link_pago": "",
  "activo": true,
  "verificacion": "Ficha verificada en vivo el 21-oct-2026: «Envío desde España», entrega más rápida en 2 días, envío gratis. La ficha no muestra reseñas del producto; la tienda SATKIT tiene 4,8 de valoración y 95,7 % de positivos con más de 5.000 vendidos en total. Entra por almacén local y vendedor solvente; volumen del anuncio bajo.",
  "paises": {
    "ES": {
      "disponible": true,
      "moneda": "EUR",
      "precio": 14.95,
      "precio_confirmado": false,
      "dias_envio": "2 días",
      "origen_envio": "España",
      "nota": "Envío desde almacén en España, sin gastos de importación."
    }
  }
},
{
  "slug": "puerta-automatica-solar-gallinero",
  "nombre": "Puerta automática solar para gallinero",
  "categoria": "gallinero",
  "descripcion_corta": "Abre al amanecer y cierra al anochecer sola, con panel solar y mando: tus gallinas, a salvo del zorro sin que madrugues tú.",
  "descripcion": "La puerta automática de aluminio se alimenta con su panel solar (y por USB como respaldo) y funciona en tres modos: temporizador, sensor de luz o mando a distancia. Abre el gallinero por la mañana y lo cierra al caer el sol, que es justo cuando el zorro y la garduña hacen su ronda. Lleva sistema antipinzamiento para no atrapar a ninguna rezagada. Es, probablemente, el producto que más tranquilidad compra en una granja pequeña: dormir fuera un fin de semana deja de ser un problema. Se envía desde España con la entrega más rápida de todo el catálogo.",
  "incluye": [
    "1 puerta automática de aluminio con panel solar",
    "Mando a distancia",
    "Cable USB de respaldo"
  ],
  "utilidades": [
    "Cerrar el gallinero cada noche sin estar presente",
    "Fines de semana y vacaciones sin depender de nadie",
    "Zonas con zorros, garduñas o perros sueltos"
  ],
  "como_se_usa": [
    "Atornilla la puerta sobre la trampilla del gallinero y orienta el panel al sol",
    "Elige el modo: luz, temporizador o manual con el mando",
    "Prueba el antipinzamiento con la mano antes de dejarla sola"
  ],
  "imagenes": [],
  "imagen_local": "../img/productos/puerta-automatica-solar.webp",
  "imagen_local_nota": "Foto del producto del proveedor.",
  "precio_base_usd": 41.94,
  "precio_base_nota": "Precio en la ficha de AliExpress España: 37,45 € IVA incluido.",
  "rating": 5.0,
  "pedidos": "29",
  "vendedor": {
    "nombre": "Tienda BricoPatio",
    "positivo_pct": null,
    "anos": null
  },
  "enlace_proveedor": "https://es.aliexpress.com/item/1005013100843629.html",
  "link_pago": "",
  "activo": true,
  "verificacion": "Ficha verificada en vivo el 21-oct-2026: «Envío desde España», «entrega más rápida: mañana», envío gratis. 5,0 estrellas (1 reseña en este vendedor; 29 ventas totales del producto). Entra por almacén local y entrega inmediata; volumen bajo.",
  "paises": {
    "ES": {
      "disponible": true,
      "moneda": "EUR",
      "precio": 54.95,
      "precio_confirmado": false,
      "dias_envio": "1–3 días",
      "origen_envio": "España",
      "nota": "Envío desde almacén en España, sin gastos de importación."
    }
  }
},
{
  "slug": "lampara-calor-infrarroja-250w",
  "nombre": "Bombilla infrarroja de calor E27 para criadora (hasta 250 W)",
  "categoria": "incubacion",
  "descripcion_corta": "La bombilla de calor de las criadoras: luz infrarroja, casquillo E27 y calor de sobra para que ningún pollito pase frío.",
  "descripcion": "Si crías pollitos, esta es la bombilla que se funde siempre en el peor momento: infrarroja, con casquillo estándar E27, pensada para lámparas de calor de criadora. La ficha ofrece 100, 150, 200 y 250 W; el precio de esta tienda corresponde a la de 250 W, la de máxima potencia, ideal para criadoras grandes o naves frías. Conviene tener siempre una de repuesto en el cajón: un pollito sin calor en sus primeros días lo pasa muy mal, y con calor de más tampoco — por eso se regula con la altura de la lámpara o con un termostato como el W1209 de esta misma tienda. Es, de largo, el producto más pedido por la comunidad.",
  "incluye": [
    "1 bombilla infrarroja E27 de 250 W"
  ],
  "utilidades": [
    "Calentar la criadora durante las primeras semanas de vida",
    "Repuesto imprescindible de la lámpara de calor (se funden sin avisar)",
    "Apoyo térmico puntual en nidadas débiles o en la enfermería"
  ],
  "como_se_usa": [
    "Enróscala solo en portabombillas cerámicos E27 resistentes al calor, nunca de plástico",
    "Cuelga la lámpara a unos 45–50 cm del suelo de la criadora y ajusta la altura según el comportamiento de los pollitos",
    "Mide la temperatura a la altura de los pollitos (32–35 °C la primera semana) y deja siempre una zona más fresca a la que puedan apartarse"
  ],
  "imagenes": [],
  "imagen_local": "../img/productos/lampara-calor.webp",
  "imagen_local_nota": "Foto del producto del proveedor.",
  "precio_base_usd": 8.45,
  "precio_base_nota": "Precio en la ficha de AliExpress España: 7,19 € IVA incluido (opción 250 W).",
  "rating": 4.6,
  "pedidos": "1000+",
  "vendedor": {
    "nombre": "Usun Farm Store",
    "positivo_pct": 92.7,
    "anos": null
  },
  "enlace_proveedor": "https://es.aliexpress.com/item/1005009810105985.html",
  "link_pago": "",
  "activo": true,
  "verificacion": "Ficha verificada en vivo el 21-oct-2026: 4,6 estrellas (124 valoraciones) y más de 1.000 vendidos; entrega estimada 26-oct–2-nov con mensajería local (Ecoscooting/Correos/CTT/GLS). La ficha NO afirma literalmente «Envío desde España» (plazo compatible con almacén europeo/Choice); entra en el catálogo porque pablo lo aprobó el 21-oct por la demanda directa en Facebook (una seguidora preguntando dónde comprar una lámpara de calor).",
  "paises": {
    "ES": {
      "disponible": true,
      "moneda": "EUR",
      "precio": 16.95,
      "precio_confirmado": false,
      "dias_envio": "5–8 días",
      "origen_envio": "Europa",
      "nota": "Entrega con mensajería local en un plazo estimado de 5 a 8 días."
    }
  }
},
{
  "slug": "incubadora-automatica-30-huevos",
  "nombre": "Incubadora automática de 30 huevos con volteo y doble alimentación",
  "categoria": "incubacion",
  "descripcion_corta": "La incubadora para sacar tus propios pollitos en 21 días: volteo automático, temperatura controlada y agua que se repone sola. Tú solo pones los huevos.",
  "descripcion": "La forma más sencilla de dejar de comprar pollitos: esta incubadora automática hace el trabajo por ti. Voltea los huevos sola, mantiene la temperatura estable y repone el agua automáticamente para sostener la humedad. Su doble alimentación (220 V y 12 V) es un seguro de vida para la nidada: si se va la luz, la conectas a una batería de 12 V y la incubación no se pierde. Le caben 30 huevos de gallina (hay quien la usa también con codorniz y pato) y es el tamaño perfecto para empezar en casa o para complementar una granja pequeña. En 21 días, con huevos fértiles frescos, ves nacer tu primer pollito: no hay nada como eso.",
  "incluye": [
    "1 incubadora automática de 30 huevos (versión Dual Power 12 V/220 V)",
    "Cable de alimentación 220 V",
    "Manual de instrucciones"
  ],
  "utilidades": [
    "Sacar tus propios pollitos en casa en 21 días, sin depender de criaderos",
    "Empezar tu lote de ponedoras o camperos desde el huevo",
    "Incubar sin estar pendiente del volteo: lo hace sola cada día"
  ],
  "como_se_usa": [
    "Enciéndela 24 horas antes y estabiliza la temperatura a 37,5 °C",
    "Usa huevos fértiles frescos (menos de 7 días) y deja que el volteo automático trabaje hasta el día 18",
    "Los últimos 3 días sube la humedad (65–70 %), deja de voltear y no abras la tapa: es el momento del nacimiento"
  ],
  "imagenes": [],
  "imagen_local": "../img/productos/incubadora-30-huevos.webp",
  "imagen_local_nota": "Foto del producto del proveedor.",
  "precio_base_usd": 37.8,
  "precio_base_nota": "Precio en la ficha de AliExpress España: 32,14 € IVA incluido, envío gratis (variante 30 huevos Dual Power).",
  "rating": 4.6,
  "pedidos": "193",
  "vendedor": {
    "nombre": "SkyBound Store",
    "positivo_pct": 95.1,
    "anos": null
  },
  "enlace_proveedor": "https://es.aliexpress.com/item/1005012485606785.html",
  "link_pago": "",
  "activo": true,
  "verificacion": "Ficha verificada en vivo el 22-oct-2026: «Envío desde España» literal en la ficha, envío gratis y «entrega más rápida en 2 días»; 4,6 estrellas (24 valoraciones) y 193 vendidos; vendedor con 95,1 % de valoraciones positivas. Entra en el catálogo porque pablo pidió el 22-oct una incubadora para la tienda: los dos Shorts de la incubadora anuncian una a 129 € con envío incluido y la tienda no tenía ninguna.",
  "paises": {
    "ES": {
      "disponible": true,
      "moneda": "EUR",
      "precio": 129.0,
      "precio_confirmado": false,
      "dias_envio": "2–5 días",
      "origen_envio": "España",
      "nota": "Envío gratis desde almacén en España, sin gastos de importación."
    }
  }
}
  ]
};
