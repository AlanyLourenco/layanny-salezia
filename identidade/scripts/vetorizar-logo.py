# Vetoriza o monograma LS com brownie (refs/) em logo/ls-logo.js
# Uso: python scripts/vetorizar-logo.py "refs/Orçamento brownie - Sophia.png"
import sys, json
import numpy as np
from PIL import Image, ImageFilter
import potrace

src = sys.argv[1] if len(sys.argv) > 1 else 'refs/Orçamento brownie - Sophia.png'
im = Image.open(src).convert('RGB')
W, H = im.size
ESC = 3  # supersample p/ curvas mais lisas
big = im.resize((W * ESC, H * ESC), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
a = np.asarray(big).astype(float)
fundo = np.array([252, 250, 244.0])
dist = np.sqrt(((a - fundo) ** 2).sum(-1))
tinta = dist > 70

# região do doce (brownie, coração, brilhos) x imagem toda
def caixa_doce(x, y):  # coordenadas em px da imagem original
    return (x < 440) and (y < 845) and (y > 600)

ys, xs = np.mgrid[0:H * ESC, 0:W * ESC]
m_doce = (xs < 440 * ESC) & (ys < 838 * ESC) & (ys > 600 * ESC)

def trace(mask):
    bm = potrace.Bitmap(~mask)  # potracer: False = tinta
    plist = bm.trace(turdsize=6 * ESC, alphamax=1.0, opticurve=True, opttolerance=0.2)
    d = []
    f = lambda p: f'{p.x / ESC:.2f} {p.y / ESC:.2f}'
    for c in plist:
        s = f'M{f(c.start_point)}'
        for seg in c.segments:
            if seg.is_corner:
                s += f'L{f(seg.c)}L{f(seg.end_point)}'
            else:
                s += f'C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}'
        d.append(s + 'Z')
    return ''.join(d)

letras = trace(tinta & ~m_doce)
doce = trace(tinta & m_doce)
ys2, xs2 = np.where(tinta)
bbox = [xs2.min() / ESC, ys2.min() / ESC, xs2.max() / ESC, ys2.max() / ESC]
print('bbox', bbox, len(letras), len(doce))
out = {'fonte': src, 'bbox': bbox, 'letras': letras, 'doce': doce}
open('logo/ls-logo.js', 'w', encoding='utf-8').write(
    '/* Gerado por scripts/vetorizar-logo.py a partir do logo da cliente. Não editar à mão. */\n'
    'window.LS_LOGO = ' + json.dumps(out) + ';\n')
