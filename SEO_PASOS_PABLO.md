# Qué tiene que hacer Pablo fuera del código

Estas tareas no se pueden cerrar desde el repositorio. El sitio ya está preparado para las dos primeras. No hace falta tocar el DNS.

## 1. Google Search Console

1. Entra en https://search.google.com/search-console con la cuenta de Google de Granja Rentable.
2. Pulsa «Añadir propiedad».
3. Elige el prefijo de URL `https://granjarentable.com/` (no el dominio entero: el dominio pide un registro DNS y no lo vamos a usar).
4. En «Verificar» elige «Etiqueta HTML».
5. Google muestra una línea parecida a esta:

   `<meta name="google-site-verification" content="UNA_CADENA_LARGA" />`

6. Copia solo lo que va dentro de `content`, la cadena, sin comillas.
7. Abre `_config.yml` en la raíz del sitio y pégala aquí, entre las comillas:

   `google_site_verification: "UNA_CADENA_LARGA"`

8. Guarda, súbelo a `main` y espera a que GitHub Pages termine de publicar (unos minutos).
9. Vuelve a Search Console y pulsa «Verificar».
10. Si falla, abre https://granjarentable.com/ y mira el código de la portada. Tiene que aparecer la meta. Si `_config.yml` se deja vacío, esa meta no se publica: es normal.

Método alternativo, si prefieres un archivo en vez de la meta: en Search Console elige «Archivo HTML», descarga el archivo que te dan (un nombre tipo `googleXXXXXXXX.html`) y súbelo a la raíz del repositorio, al lado de `index.html`. No lo renombres. Luego verifica. Con uno de los dos métodos basta.

## 2. Enviar el sitemap a Google

1. Ya verificado, en Search Console abre «Sitemaps».
2. En «Añadir un sitemap nuevo» escribe:

   `https://granjarentable.com/sitemap.xml`

3. Envíalo. El `robots.txt` ya lo anuncia, así que Google también puede encontrarlo solo. Enviarlo a mano acelera la primera lectura.
4. Unos días después, «Páginas» te dirá cuáles indexó y cuáles dejó fuera. Las de «próximamente» están en `noindex` a propósito.

## 3. Bing Webmaster Tools

1. Entra en https://www.bing.com/webmasters con una cuenta Microsoft.
2. Añade el sitio `https://granjarentable.com/`.
3. Elige verificar con meta etiqueta, no con CNAME ni DNS.
4. Bing muestra algo como:

   `<meta name="msvalidate.01" content="OTRA_CADENA" />`

5. Copia solo el `content`.
6. En el mismo `_config.yml`:

   `bing_site_verification: "OTRA_CADENA"`

7. Súbelo a `main`, espera la publicación y pulsa «Verificar».
8. En Bing, envía el mismo sitemap: `https://granjarentable.com/sitemap.xml`.

Bing también deja importar el sitio desde Search Console si las dos cuentas se pueden enlazar. Si lo haces así, no hace falta repetir la meta.

## 4. Perfil de Google Business

Créalo solo si hay un local al que la gente puede ir: una tienda, un punto de recogida o un corral que reciba visitas con horario.

La dirección de Tenerife que está en el aviso legal es el dato del titular. No la uses para un perfil de negocio si nadie atiende allí al público. Un perfil de un lugar que no recibe clientes se puede suspender.

Si más adelante hay un local de verdad:

1. Entra en https://business.google.com.
2. Crea el perfil con el nombre real del local, la categoría (por ejemplo, tienda de animales o granja, la que corresponda) y el horario en el que atiendes.
3. Verifica por el método que te ofrezca Google (postal, teléfono o vídeo). No inventes reseñas.
4. En la web del perfil pon `https://granjarentable.com/`.

Si el negocio sigue siendo solo la web, este paso se salta.

## 5. YouTube y Facebook

Esto ya está hecho. No hay que volver a hacerlo salvo que el enlace se haya caído.

- Canal de YouTube: https://www.youtube.com/@GranjaRentable
- Página de Facebook: https://www.facebook.com/GranjaRentable

Comprueba, una vez, que la descripción del canal y el botón «Sitio web» de la página apuntan a `https://granjarentable.com/`. El sitio ya enlaza a los dos desde la portada.

## Qué no hacer

- No añadas un registro TXT ni un CNAME en el DNS para verificar. La meta del paso 1 y la del paso 3 alcanzan.
- No pagues a nadie por «posicionarte» ni compres enlaces.
- No actives anuncios en el código: `window.ads.activo` sigue en `false` hasta que tú decidas lo contrario en `js/config.js`.
