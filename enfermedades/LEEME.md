# Guía de enfermedades

Las fichas se escriben en `articulos.json`. Luego:

```bash
node enfermedades/construir.js
```

Eso regenera la portada `enfermedades.html`, la página de cada categoría en `enfermedades/categoria/`, cada ficha `enfermedades/<id>.html`, el atajo `enfermedades/index.html` y las URLs del sitemap. No publica el sitio.

La portada es la entrada de la zona: buscador por síntoma y las ocho categorías. Dentro, el menú lateral repite esas categorías. En el móvil ese menú se pliega.

## Forma de una ficha

- `id`: sin tildes ni espacios. Sale en la URL.
- `estado`: `completo` o `borrador`. El borrador tiene que llevar `todo`.
- `titulo`, `resumen`, `metaTitulo`, `metaDescripcion` (menos de 170 letras).
- `reconocer`, `contagio`, `prevenir`, `natural`, `veterinario`: listas de frases.
- `etiquetas`: `sintomas`, `prevencion`, `natural`.
- `imagenes`: solo `alt`. El crédito vacío usa el texto común. No pongas `src` ni una URL: no se enlazan fotos ajenas.
- `relacionados`: otros `id`.
- `declaracion`: `true` solo en gripe aviar y Newcastle. Esas fichas no pueden llevar `natural` ni la etiqueta `natural`.
- `minutos`: opcional. Si no está, se calcula a unas 200 palabras por minuto.

La lectura, el título SEO, la descripción y el marcado Article (schema.org) salen solos al construir.

## Seguridad

El constructor se detiene si encuentra una dosis (`mg`, `ml`…) o un fármaco concreto, si una ficha de declaración trae remedios, o si una imagen trae enlace. El aviso de veterinario va en todas las páginas.

El texto está para que lo revise el dueño. No es un consejo veterinario.
