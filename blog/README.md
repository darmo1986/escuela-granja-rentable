# Cómo publicar un artículo

Se hace desde la web de GitHub. No hace falta tocar código ni abrir el generador.

El artículo **no sale** mientras ponga `borrador: true`. Así queda al crearlo. Para publicarlo, cambia esa línea a `borrador: false` y guarda. Si el archivo está mal, la acción de GitHub falla y **no publica nada** (ni ese artículo ni el resto).

## 1. La foto

Hacen falta dos archivos propios, en formato webp:

| Uso | Medida | Dónde |
| --- | --- | --- |
| La ficha y el artículo | 1200×675 | `img/blog/nombre.webp` |
| La imagen al compartir (og:image) | 1200×630 | `img/blog/nombre-og.webp` |

En el repositorio: **Add file → Upload files**. Elige la carpeta `img/blog`. El nombre va en minúsculas, con guiones, sin espacios.

## 2. El texto

**Add file → Create new file.** La ruta es:

`blog/posts/2026-11-02-ovoscopia-huevos-incubadora.md`

La fecha va delante. Lo de después es la dirección del artículo (`/blog/ovoscopia-huevos-incubadora.html`). Copia este bloque, cambia los datos y escribe debajo:

```markdown
---
titulo: "Ovoscopia: cómo revisar los huevos en la incubadora"
titulo_seo: "Ovoscopia: cómo revisar los huevos en la incubadora"
descripcion: "Cuándo mirar los huevos al trasluz, qué ver el día 7 y qué huevos sacar, con los datos de la lección L03."
categoria: incubacion
fecha: 2026-11-02
borrador: true
leccion: l03
producto: incubadora-24egg-dual
imagen: img/blog/ovoscopia-ejemplo.webp
imagen_alt: "Huevo al trasluz con una linterna: se ven venas alrededor de un punto oscuro"
imagen_og: img/blog/ovoscopia-ejemplo-og.webp
video: ""
red: ""
guia: incubadora
fuentes:
  - "Lección L03 de Granja Rentable (cita a la MSU y a Cobb)"
---

El texto va aquí, en párrafos.

## Un apartado

- Una idea por línea.
```

`categoria` es una de estas: `ponedoras`, `engorde`, `incubacion`, `salud`, `alimentacion`. En la web se leen **Gallinas ponedoras**, **Pollos de engorde**, **Incubación**, **Salud** y **Alimentación**. Son cinco, por separado.

Di siempre **pollos de engorde**. No uses «pollo de carne» ni «broiler».

`leccion` (l01, l03, l04a…) pone el botón de la lección. `producto` tiene que ser una ficha de `producto/`. El artículo no lleva precios. `guia` puede ser `empezar`, `espacio` o `incubadora`. `video` es solo el id de YouTube. `red` es el enlace https del post de Facebook o YouTube del que sale, si lo hay.

`imagen_alt` describe la foto. Sin imagen, o con una medida distinta, **no se publica**.

## 3. Guardar

Abajo, en **Commit changes**, escribe una frase («Artículo de ovoscopia») y pulsa **Commit changes** directo a `main`.

La acción genera la portada, la categoría, el artículo y el sitemap, y lo guarda en `main`. GitHub Pages lo publica solo. Un borrador no genera página y no entra en el sitemap.

Si la acción sale en rojo, abre el detalle: el mensaje dice qué línea falla. Corrige el Markdown y vuelve a guardar. Lo ya publicado no se toca en ese intento.

## Lo que no hay que poner

- Enlaces a eBay, Amazon o Mercado Libre. Solo la tienda propia y el curso.
- Otro WhatsApp. El del pie y el botón verde son los de la web.
- HTML. Si pegas una etiqueta, se muestra como texto: no se ejecuta.
- Un precio. Sale en la ficha, según el país.

Una categoría con menos de 3 artículos publicados lleva `noindex` y no entra en el sitemap. Con 3 o más, sí.
