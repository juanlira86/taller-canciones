# Taller de canciones

Aplicación web para componer baladas, rock, pop, folk y electrónica. Analiza sílabas, tipo de verso, rima y estrofas; propone mejoras; y esboza acordes y contorno melódico. Sin cuenta y sin servidor: todo queda en el navegador.

## Cómo abrirla

1. Descarga el repositorio o abre `index.html` en el navegador.
2. O publica la carpeta en GitHub Pages (la app es estática).

No hace falta instalar nada.

## Qué hace

- Editor con título, género, tempo, emoción e idioma (español, inglés, francés, italiano, portugués).
- Estrofas separadas por línea en blanco. Atajos para estribillo, puente, pre-estribillo y outro.
- Subida de `.txt` y fragmentos sueltos.
- Conteo de sílabas con sinalefa en español, e muda y elisión en francés, y reglas aproximadas en los demás idiomas. El conteo se puede corregir a mano.
- Tipo de verso (bisílabo a alejandrino, o irregular), esquema de rima, acento, encabalgamiento, repeticiones y registro.
- Sugerencias de rima, ajuste de medida, imágenes en lugar de clichés, variación de estribillo y adaptación entre idiomas. Nada se sobrescribe sin aceptar.
- Progresiones por género y tonalidad, pulso sobre las sílabas, contorno melódico y nota por acorde (Web Audio).
- Biblioteca en `localStorage`, exportar/importar JSON y lead sheet de texto.

Las sugerencias de reescritura son reglas y plantillas locales, no un modelo de lenguaje. Sirven para iterar; la decisión queda en quien compone.
