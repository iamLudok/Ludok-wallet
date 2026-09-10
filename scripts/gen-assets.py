#!/usr/bin/env python3
"""
Genera los iconos de la app a partir de una sola figura vectorial dibujada aquí.

Son cuatro tamaños de lo mismo, así que tenerlos como ficheros sueltos hechos a
mano se desincroniza en cuanto se retoca uno. El dibujo es monocromo a propósito:
la app es «Sala oscura» y un icono a color no pegaría con nada de lo que hay
dentro.

    python3 scripts/gen-assets.py

Los PNG resultantes SÍ se versionan: en tiempo de compilación no dependemos de
tener Python ni Pillow instalados.
"""
from PIL import Image, ImageDraw

BG = (10, 10, 12, 255)      # palette.bg
FG = (243, 241, 236, 255)   # palette.fg
TRANSPARENT = (0, 0, 0, 0)


def draw_glyph(size: int, fg=FG) -> Image.Image:
    """
    La marca: una tarjeta con la esquina de un código dentro.

    Las dos mitades de la app —tarjetas y entradas— en una sola figura, que es
    lo que hace que el icono signifique algo y no sea un cuadrado más.
    """
    # Se dibuja al cuádruple y se reduce al final: es la forma barata de tener
    # bordes suaves sin meter antialias a mano en cada trazo.
    s = size * 4
    img = Image.new("RGBA", (s, s), TRANSPARENT)
    d = ImageDraw.Draw(img)

    unit = s / 100.0
    stroke = max(1, int(6 * unit))

    # Tarjeta: rectángulo redondeado en horizontal.
    card = (10 * unit, 22 * unit, 90 * unit, 78 * unit)
    d.rounded_rectangle(card, radius=9 * unit, outline=fg, width=stroke)

    # Banda superior (la del chip/cabecera de una tarjeta).
    d.rounded_rectangle(
        (22 * unit, 34 * unit, 52 * unit, 41 * unit), radius=3 * unit, fill=fg
    )
    d.rounded_rectangle(
        (22 * unit, 47 * unit, 44 * unit, 54 * unit), radius=3 * unit, fill=fg
    )

    # Código: tres módulos de un QR en la esquina de la tarjeta.
    m = 9 * unit
    gap = 3 * unit
    x0 = 62 * unit
    y0 = 34 * unit
    for col in range(2):
        for row in range(2):
            # El módulo de abajo a la derecha se deja fuera: es lo que hace que
            # se lea como un código y no como una cuadrícula.
            if col == 1 and row == 1:
                continue
            x = x0 + col * (m + gap)
            y = y0 + row * (m + gap)
            d.rounded_rectangle((x, y, x + m, y + m), radius=1.5 * unit, fill=fg)

    return img.resize((size, size), Image.LANCZOS)


def write(path: str, size: int, background, scale: float) -> None:
    """Compone la figura sobre el fondo pedido, al tamaño de recuadro seguro."""
    canvas = Image.new("RGBA", (size, size), background)
    inner = int(size * scale)
    glyph = draw_glyph(inner)
    offset = (size - inner) // 2
    canvas.alpha_composite(glyph, (offset, offset))
    canvas.save(path)
    print(f"  {path}  {size}×{size}")


if __name__ == "__main__":
    print("Generando iconos…")
    # Icono normal: la figura ocupa casi todo.
    write("assets/icon.png", 1024, BG, 0.82)
    # Adaptativo de Android: el sistema recorta un círculo, así que la figura
    # tiene que caber en el ~66% central o se come los bordes.
    write("assets/android-icon-foreground.png", 1024, TRANSPARENT, 0.62)
    # Splash: sobre el fondo de la app, que ya lo pinta expo-splash-screen.
    write("assets/splash-icon.png", 512, TRANSPARENT, 0.90)
    print("Listo.")
