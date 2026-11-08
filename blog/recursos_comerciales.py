"""Configuración de recursos propios para todas las páginas.

Este módulo es fuente de datos; el generador debe importarlo e insertar
los bloques durante la construcción, no editar los HTML a posteriori.
"""
ADSENSE_CLIENT = "ca-pub-5311145772953700"
ADSENSE_HEAD = (
    '<script async src="https://pagead2.googlesyndication.com/'
    'pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT +
    '" crossorigin="anonymous"></script>'
)
EBOOKS_BASE = "/ebooks/"
def recurso_principal(ruta):
    """Priorizar el pack en portada y el ebook temático en el resto."""
    if ruta in ("", "/", "index.html"):
        return {"titulo": "Pack de ebooks de Granja Rentable", "href": EBOOKS_BASE}
    temas = {
        "alimentacion": "Alimentación de gallinas",
        "pollitos": "Cría de pollitos",
        "incub": "Incubación",
        "agua": "Agua y bebederos",
        "ponedoras": "Gallinas ponedoras",
        "enfermedad": "Salud aviar",
    }
    tema = next((v for k, v in temas.items() if k in ruta.lower()), "Avicultura práctica")
    return {"titulo": "Ebooks: " + tema, "href": EBOOKS_BASE}
