# Granja Rentable

Borrador del sitio unificado para [granjarentable.net](https://granjarentable.net). Reúne la tienda de la incubadora, el curso, los recomendados de Amazon, la app Registro de pollos y el alta por correo.

No está publicado en el dominio. El DNS de Porkbun no se ha tocado. Hasta que se fusione esta rama, el curso sigue en GitHub Pages como hasta ahora.

Para verlo en local:

```bash
python3 -m http.server 8765
```

Abre `http://127.0.0.1:8765/`.

## Pendiente

Todo se cambia en `js/site.js`, salvo las claves de publicidad, que siguen en `js/config.js`.

| Qué | Dónde | Estado |
| --- | --- | --- |
| ID de Amazon Asociados | `amazonTag` | Vacío. Un solo valor. Los botones abren una búsqueda en Amazon.es y, cuando haya tag, añaden `&tag=`. No hay fichas ni precios concretos. |
| Envío del formulario | `formEndpoint` | Vacío. El formulario valida, pero no guarda ni envía los datos. |
| Descarga de la app | `appDownloadUrl` | Vacío. El botón «Descargar para Android» está desactivado. |
| Facebook | `facebookUrl` | `https://www.facebook.com/granjarentable` (la dirección a la que redirige Facebook). Conviene confirmar que es la página buena. |
| Publicidad Adsterra / AdSense | `js/config.js` | Sin claves, como en el curso actual. No se carga ningún anuncio. |
| Plazas de la prueba | texto de `app.html` | Hacen falta 14 Gmail para la prueba cerrada de Google Play. No hay contador: no existe todavía un sitio donde lleguen las altas. |

YouTube (`https://www.youtube.com/@GranjaRentable`), la tienda (`https://granjarentable-incubadora.netlify.app/?pais=ES`) y WhatsApp (`https://wa.me/34656267726`) salen del curso que ya estaba en el repositorio.

## Conectar el formulario

El alta (`registro.html`) y la prueba de la app (`app.html`) hacen `POST` con `FormData` y piden JSON. Campos: `nombre`, `email`, `probar_app`, `consentimiento`, `tipo` (`registro` o `beta`), `origen`, `_subject`. En la prueba también va `android`. El campo `_gotcha` es una trampa para bots y tiene que llegar vacío.

Formspree encaja con una web estática:

1. Crea un formulario en [formspree.io](https://formspree.io).
2. Copia la URL `https://formspree.io/f/xxxxxxxx`.
3. Pégala en `formEndpoint` dentro de `js/site.js`.
4. Confirma el correo de aviso la primera vez que llegue un envío.
5. Prueba `registro.html` y `app.html`. Tiene que salir «Listo», no el aviso de que falta conectar.

Si más adelante el proveedor instala cookies, hay que decirlo en `cookies.html` y citarlo como encargado en `privacidad.html`.

## DNS en Porkbun (no aplicado)

El archivo `CNAME` de la raíz ya contiene `granjarentable.net`. GitHub Pages lo usará **solo cuando esta rama esté en la rama que publica el sitio**. Fusionar sin el DNS deja el dominio a medias y puede hacer que `darmo1986.github.io` redirija a un dominio que aún no resuelve. Conviene crear estos registros en Porkbun y, justo después, fusionar.

En Porkbun: Domain Management → granjarentable.net → DNS. No cambies los servidores de nombres si ya usas los de Porkbun. Quita redirecciones o registros de aparcamiento que choquen con el ápice o con `www`. No actives el reenvío de URL de Porkbun.

Registros para GitHub Pages del usuario `darmo1986` (el sitio de proyecto vive en ese Pages):

| Tipo | Host | Valor |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `darmo1986.github.io` |

Cuando GitHub emita el certificado, activa «Enforce HTTPS» en Settings → Pages. El `www` debe apuntar al usuario (`darmo1986.github.io`), no a la carpeta del repositorio.
