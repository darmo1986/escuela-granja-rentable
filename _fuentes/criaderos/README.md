# Ampliación documental del directorio — 15/11/2026

Estado: preparada en una rama para PR en borrador. Requiere OK específico para fusionar/publicar. No se han enviado consultas, comprado aves ni contratado servicios.

## Alcance comprobado

- Base: `8c2a54548b695a7e94518d9d3a4417e58b105c4f`, 81 fichas en 16 países.
- Lote: **50 altas**, 16 países, sin contar sedes o alias como altas adicionales.
- Resultado: **131 fichas y 18 países**. Las 81 fichas previas se conservan literalmente; no se han reverificado en este lote.
- **7 altas de Centroamérica**, una por país; **15 fichas centroamericanas en total** al sumar las anteriores. Belice y Nicaragua son secciones nuevas.
- Distribución del lote: 23 de Latinoamérica y Belice (incluido Brasil), 7 de España y 20 de Estados Unidos. No se presupone suministro internacional desde ningún país.

## Qué significa la revisión

Revisión documental de identidad, país y oferta de aves vivas o huevos para incubar en una fuente primaria: web propia, ficha del fabricante/asociación o registro oficial. La fecha 15/11/2026 identifica la revisión, no una visita a la granja, una certificación sanitaria, una consulta personal, una comprobación de fertilidad ni existencias confirmadas.

Se distinguen criaderos, incubadoras y distribuidores en cada ficha. Los huevos de mesa, productores internos sin oferta externa comprobable y directorios que copian redes no bastan para una nueva alta. No se publican precios de este lote ni se incorporan enlaces afiliados.

Las fuentes recuperadas mediante índice pueden contener información almacenada previamente por el buscador. Cuando la página directa no respondió se registra en `evidence`; no se afirma haber contactado o visto existencias en tiempo real. En particular:

- Incubadora El Junquillo: registro público ONCAE 6743-2025, expediente 46521, páginas 1–2 revisadas; anexo con rubro de pollos vivos y domicilio Tatumbla. Vigencia indicada hasta 04/08/2028; no se verificó por contacto su oferta actual ni la ausencia de revocación posterior.
- Incubant: web propia (comercialización/domicilio) y licencia ICA 295AV, listado fechado 04/11/2026. No se presenta como una inspección sanitaria propia.
- Cabaña Modelo: ficha del fabricante Hendrix; Gramogen: ficha comercial ADEX. Sus webs propias no fueron accesibles, por lo que se enlazan las fuentes recuperadas.
- São José (Amparo), Avícola Neil y la ficha de San Marino se recuperaron en el índice de sus webs oficiales; las aperturas directas fallaron (403/tiempo/503). Incubadora Villaflores se recuperó inicialmente, pero otra apertura devolvió 502.
- Schlecht: temporada 2026 agotada. Alchemist: anuncia reservas 2027 desde el 21/11, aún futuras en la fecha de revisión. Jenks: solo clientes comerciales; anuncia solicitudes de 3.000 o más. Papa’s Poultry: colección «Available Now» vacía. Belt: conserva avisos de verano. Las limitaciones están en las fichas.

## Identidades y duplicados

Se contrastaron los nombres y enlaces del lote con las 81 fichas existentes. Quality Poultry / Friesen, ChiKiKi / VICKAP, Avícola Pozos / Grupo Guardia, Grapisa / Pinseque y Gramogen / Corporación de Granjas del Perú son una ficha cada una. No se crean fichas separadas de unidades de San Marino, Mercoaves o Avifran. Freedom Ranger agrupa Fifth Day Farm, Blue Banty y Hillside; Hoover incluye sus marcas Privett y Moyer; Welp declara a Rock Hill Genetics como adquirente en marzo de 2024. No se añadieron esas marcas por separado.

Los homónimos preexistentes «Avícola Santa Bárbara» de Argentina y Chile permanecen sin cambios. La nueva Granja São José de Amparo se distingue de la productora homónima de huevos de mesa de Palmital.

## Funcionamiento y persistencia

Fuente editable: `ampliacion-20261115.json` (50 registros, fuentes, límites y fecha). `actualizar.py` modifica solo bloques marcados de este lote y añade las dos secciones y sus anclas; preserva el HTML previo y no depende de JavaScript para entregar el contenido. No existía un generador del directorio: el generador del blog no se ha modificado.

Se añade la región a las siete secciones de Centroamérica y al texto que usa el buscador. «Centroamérica», «centroamerica» y «america central» encuentran también las fichas anteriores de la región. El selector móvil existente obtiene automáticamente los dos países nuevos y sus recuentos. No se introducen llamadas de red del navegador ni dependencias nuevas del sitio.

```sh
python _fuentes/criaderos/actualizar.py
python _fuentes/criaderos/actualizar.py --check
python _fuentes/criaderos/verificar.py
# Opcional en un entorno con Chromium y sockets habilitados:
python _fuentes/criaderos/verificar.py --browser
```

Requisitos de las comprobaciones: Python 3, lxml y Node.js. Playwright/Chromium solo para `--browser`.

Validación realizada: 50 altas; 131 fichas; 81 anteriores intactas; 18 países con anclas únicas; los siete países centroamericanos; fuentes HTTPS y fechas; IDs únicos; nombre+país sin duplicados; actualización idempotente y `git diff --check`. El script JS real pasa pruebas de filtros mediante adaptador DOM: los 18 países, búsqueda regional con/sin tildes, las 15 fichas de la región, alias Friesen, combinación país/producto, cero resultados y cambio de selección.

**Pendiente: comprobación visual móvil y escritorio en navegador.** Playwright no pudo iniciar Chromium local por la restricción de sockets del entorno. Las pruebas DOM no equivalen a una comprobación de diseño, medidas o ausencia de desbordes; no se afirman esos resultados.

`_fuentes` está excluida de Jekyll por `_config.yml`. El flujo de despliegue se dispara en `main`, no con esta rama. No se ha ejecutado publicación. Se revisó el lote de navegación abierto en PR #133 para no duplicarlo; esta propuesta amplía datos y búsqueda regional. Si ese PR cambia la misma zona de `criaderos.html`, habrá que conciliarlo antes de fusionar.

## Altas y fuentes

Todas con fecha documental 15/11/2026; el detalle y los límites por entrada están en el JSON.

| País | Proveedor | Fuente primaria | Complementarias |
|---|---|---|---|
| Belice | Quality Poultry Hatchery | [Fuente](https://www.qualitypoultryhatchery.com/) | — |
| Nicaragua | La Granja de Mili | [Fuente](https://lagranjademili.com/) | — |
| Guatemala | Criadero ChiKiKi – VICKAP | [Fuente](https://www.vickap.com/criadero-chikiki) | — |
| Panamá | Cooperativa Juan XXIII, R.L. – Incubadora | [Fuente](https://www.juan-xxiii.com/index.php/unidades-de-negocios/produccion/incubadora) | — |
| Costa Rica | Avícola Pozos | [Fuente](https://avicolapozos.com/AP/productos/) | [Fuente 2](https://avicolapozos.com/AP/contacto/) |
| El Salvador | Agroservicio La Cuma | [Fuente](https://www.agroslacuma.com/) | — |
| México | Incubadora Proavico | [Fuente](https://www.proavico.com/) | — |
| México | Incubadora Villaflores Grupo Pecuario | [Fuente](https://incubadoravillaflores.com.mx/) | — |
| Colombia | Agroavícola San Marino | [Fuente](https://sanmarino.com.co/pollita-para-postura-de-huevo-marron/) | [Fuente 2](https://sanmarino.com.co/) |
| Colombia | Colaves – Colombiana de Aves | [Fuente](https://colaves.com/) | [Fuente 2](https://colaves.com/contacto) |
| Colombia | Avinter – Incubadora Internacional de Aves | [Fuente](https://avinter.co/) | [Fuente 2](https://avinter.co/productos/) |
| Colombia | Incubant – Antioqueña de Incubación | [Fuente](https://www.incubant.co/) | [Fuente 2](https://www.ica.gov.co/getattachment/Areas/Pecuaria/Servicios/Bioseguridad-y-Recursos-Geneticos/SERVICIOS-MATERIAL-GENETICO-AVIAR/Licencias-de-venta-de-material-genetico-aviar.pdf.aspx?lang=es-CO) |
| Argentina | Cabaña Avícola Modelo SRL | [Fuente](https://layinghens.hendrix-genetics.com/en/distributors/caba%C3%B1a-av%C3%ADcola-modelo-srl/) | — |
| Perú | Gramogen – Corporación de Granjas del Perú | [Fuente](https://www.b2peru.pe/directorioadex/es/company/6981/corporacion-de-granjas-del-peru-sac) | — |
| Perú | Avícola Neil | [Fuente](https://avicolaneil.com/) | — |
| Ecuador | INCUBASD – Incubadora Santo Domingo | [Fuente](https://incubadorasantodom.wixsite.com/website) | — |
| Ecuador | Distribuidora Avícola Cevallos | [Fuente](https://avicolacevallossd.wixsite.com/avicolacevallos) | — |
| Estados Unidos | Papa’s Poultry | [Fuente](https://papaspoultry.com/) | [Fuente 2](https://papaspoultry.com/pages/about-us) |
| Chile | Avícola Agrícola Tu Mascotería | [Fuente](https://www.avicolagricola.cl/que-hacemos) | [Fuente 2](https://www.avicolagricola.cl/contacto) |
| Brasil | Avifran – Avicultura Francesa | [Fuente](https://www.avifran.com.br/distribuidores.php) | [Fuente 2](https://www.avifran.com.br/) |
| Brasil | Granja São José – Amparo | [Fuente](https://granjasaojose.com.br/) | — |
| Brasil | Mercoaves | [Fuente](https://mercoaves.com.br/) | — |
| Brasil | Pluma Genetics | [Fuente](https://plumagenetics.com/sobre) | [Fuente 2](https://plumagenetics.com/contato) |
| España | Granja Santa Isabel | [Fuente](https://www.granjasantaisabel.com/pollos-de-un-dia.php) | [Fuente 2](https://www.granjasantaisabel.com/contacto.php) |
| España | Granja Pinseque – Grapisa | [Fuente](https://www.granjapinseque.es/aves) | — |
| España | Agricentro Los Abuelos | [Fuente](https://www.agricentrolosabuelos.com/) | — |
| España | Piensos y Cereales Romera | [Fuente](https://piensosromera.com/venta-animales-vivos/) | — |
| España | Álvarez Avícola | [Fuente](https://www.alvarezavicola.es/) | — |
| España | Finca Casarejo | [Fuente](https://www.fincacasarejo.com/) | [Fuente 2](https://www.tiendanimal.es/vendedores-marketplace/finca-casarejo/) |
| España | Pitas y Patos | [Fuente](https://www.pitasypatos.com/contacto/) | — |
| Estados Unidos | Murray McMurray Hatchery | [Fuente](https://www.mcmurrayhatchery.com/) | [Fuente 2](https://www.mcmurrayhatchery.com/contact.html) |
| Estados Unidos | Cackle Hatchery | [Fuente](https://www.cacklehatchery.com/) | — |
| Estados Unidos | Hoover’s Hatchery | [Fuente](https://hoovershatchery.com/) | — |
| Estados Unidos | Ideal Poultry | [Fuente](https://www.idealpoultry.com/) | — |
| Estados Unidos | Metzer Farms | [Fuente](https://www.metzerfarms.com/) | — |
| Estados Unidos | Freedom Ranger Hatcheries | [Fuente](https://www.freedomrangerhatchery.com/) | — |
| Estados Unidos | Mt. Healthy Hatcheries | [Fuente](https://www.mthealthy.com/) | — |
| Estados Unidos | Welp Hatchery | [Fuente](https://welphatchery.com/) | [Fuente 2](https://welphatchery.com/pages/ordering-info) |
| Estados Unidos | Belt Hatchery | [Fuente](https://www.belthatchery.com/) | — |
| Estados Unidos | Townline Hatchery | [Fuente](https://townlinehatchery.com/) | [Fuente 2](https://townlinehatchery.com/shop/) |
| Estados Unidos | Dunlap Hatchery | [Fuente](https://www.dunlaphatcherypoultry.com/) | [Fuente 2](https://www.dunlaphatcherypoultry.com/contact/) |
| Estados Unidos | Schlecht Hatchery | [Fuente](https://schlechthatchery.com/) | [Fuente 2](https://schlechthatchery.com/contact-us) |
| Estados Unidos | Jenks Hatchery | [Fuente](https://jenkshatchery.com/) | [Fuente 2](https://jenkshatchery.com/pages/our-history) |
| Honduras | Incubadora El Junquillo S. de R.L. | [Fuente](https://oncae.gob.hn/wp-content/uploads/2025/08/6743-2025-INCUBADORA-EL-JUNQUILLO-S.-DE-R.L.-46521.pdf) | — |
| Estados Unidos | Sunnyside Hatchery | [Fuente](https://www.sunnysidehatchery.com/) | [Fuente 2](https://www.sunnysidehatchery.com/pricing.aspx) |
| Estados Unidos | Hoffman Hatchery | [Fuente](https://hoffmanhatchery.com/) | [Fuente 2](https://hoffmanhatchery.com/contact.html) |
| Estados Unidos | Sand Hill Preservation Center | [Fuente](https://www.sandhillpreservation.com/) | — |
| Estados Unidos | Greenfire Farms | [Fuente](https://greenfirefarms.com/) | [Fuente 2](https://greenfirefarms.com/pages/about-us) |
| Estados Unidos | Alchemist Farm | [Fuente](https://www.alchemistfarm.com/chick-calendar/) | [Fuente 2](https://www.alchemistfarm.com/faq/) |
| Estados Unidos | Feather Lover Farms | [Fuente](https://featherloverfarms.com/collections/baby-chicks-for-sale) | [Fuente 2](https://featherloverfarms.com/pages/contact-us) |
