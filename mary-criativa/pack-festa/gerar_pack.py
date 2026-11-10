"""Gera o Pack de Identidade Visual de Festa da Mary Criativa (tema Jardim Encantado).

Saidas:
  elementos/*.png                          flores, folhas, borboleta, coroa floral e fundos
  Pack-Jardim-Encantado-Digital.pptx       convite, save the date e story (1080 x 1920)
  Pack-Jardim-Encantado-Impressos-A4.pptx  capa, identidade, tags, rotulos, topo de bolo, placa e painel

No Canva: Criar design > Importar arquivo > escolha o .pptx. Todos os textos ficam editaveis.
Uso: python3 gerar_pack.py
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Pt

AQUI = Path(__file__).parent
EL = AQUI / "elementos"
EL.mkdir(exist_ok=True)
PX = 9525  # EMU por pixel (96 dpi)

# Paleta do tema
ROSA = "F4A9C4"
ROSA_ESCURO = "C95A80"
LILAS = "C3A3E3"
LILAS_ESCURO = "8A63B5"
LILAS_CLARO = "F3ECFB"
DOURADO = "C49A48"
SALVIA = "9DB59A"
TINTA = "4A3550"
TINTA_SUAVE = "7C6A82"
CREME = "FFFBF8"
BRANCO = "FFFFFF"

SCRIPT = "Great Vibes"
SERIF = "Cormorant Garamond"
SANS = "Montserrat"

# Dados de exemplo (a cliente troca no Canva)
NOME = "Luna"
IDADE = "10 anos"
TEMA = "Jardim Encantado"


def hexrgb(h, a=255):
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def mix(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(4))


# =====================================================================
# Elementos desenhados (PNG transparente, feitos em 4x e reduzidos)
# =====================================================================
SS = 4


def petala(sz, L, larg, c_fora, c_dentro):
    lay = Image.new("RGBA", (sz, sz), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    cx = cy = sz / 2
    passos = 16
    for k in range(passos):
        t = k / passos
        c = mix(c_fora, c_dentro, t)
        l, w = L * (1 - t * 0.55), larg * (1 - t * 0.6)
        base = cy + L * 0.06 - t * L * 0.12
        d.ellipse([cx - w / 2, base - l, cx + w / 2, base], fill=c)
    veio = mix(c_fora, (120, 60, 90, 255), 0.25)
    veio = veio[:3] + (70,)
    d.line([(cx, cy), (cx, cy - L * 0.72)], fill=veio, width=max(2, int(sz * 0.004)))
    return lay


def flor(nome, d, n, fora, dentro, miolo=DOURADO):
    S = d * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    c = S / 2
    L = S * 0.46
    larg = L * (0.95 if n <= 5 else 0.55)
    p = petala(S, L, larg, hexrgb(fora), hexrgb(dentro))
    for i in range(n):
        img = Image.alpha_composite(img, p.rotate(i * 360 / n, resample=Image.BICUBIC, center=(c, c)))
    p2 = petala(S, L * 0.62, larg * 0.8, mix(hexrgb(fora), hexrgb(dentro), 0.45), hexrgb(BRANCO))
    for i in range(n):
        img = Image.alpha_composite(img, p2.rotate(i * 360 / n + 180 / n, resample=Image.BICUBIC, center=(c, c)))
    dr = ImageDraw.Draw(img)
    r = S * 0.075
    for k in range(10):
        t = k / 10
        rr = r * (1 - t * 0.7)
        dr.ellipse([c - rr, c - rr, c + rr, c + rr], fill=mix(hexrgb("A87F2E"), hexrgb("F3E3BC"), t))
    for i in range(14):
        a = i * 2 * math.pi / 14
        x, y = c + math.cos(a) * r * 1.35, c + math.sin(a) * r * 1.35
        dr.ellipse([x - S * 0.008, y - S * 0.008, x + S * 0.008, y + S * 0.008], fill=hexrgb(miolo))
    img = img.resize((d, d), Image.LANCZOS)
    img.save(EL / nome)
    return img


def folha(nome, L, cor=SALVIA):
    S = L * SS
    H = int(S * 0.42)
    img = Image.new("RGBA", (S, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cy = H / 2
    pts_sup, pts_inf = [], []
    for i in range(61):
        t = i / 60
        x = S * 0.02 + t * S * 0.96
        y = (H * 0.44) * (math.sin(math.pi * t) ** 0.9) * (1 - 0.25 * t)
        pts_sup.append((x, cy - y))
        pts_inf.append((x, cy + y))
    base = hexrgb(cor)
    d.polygon(pts_sup + pts_inf[::-1], fill=mix(base, (70, 100, 70, 255), 0.2))
    d.polygon(pts_sup + [(S * 0.98, cy), (S * 0.02, cy)], fill=mix(base, (255, 255, 255, 255), 0.18))
    d.line([(S * 0.02, cy), (S * 0.9, cy)], fill=mix(base, (60, 90, 60, 255), 0.45), width=int(S * 0.008))
    for i in range(1, 6):
        x = S * (0.1 + i * 0.14)
        d.line([(x, cy), (x + S * 0.08, cy - H * 0.25)], fill=mix(base, (60, 90, 60, 255), 0.3), width=int(S * 0.004))
        d.line([(x, cy), (x + S * 0.08, cy + H * 0.25)], fill=mix(base, (60, 90, 60, 255), 0.3), width=int(S * 0.004))
    img = img.resize((L, int(H / SS)), Image.LANCZOS)
    img.save(EL / nome)
    return img


def borboleta(nome, d):
    S = d * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    c = S / 2

    def asa(w, h, ang, dx, dy, fora, dentro):
        lay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        dd = ImageDraw.Draw(lay)
        for k in range(14):
            t = k / 14
            ww, hh = w * (1 - t * 0.6), h * (1 - t * 0.6)
            dd.ellipse([c - ww / 2, c - hh / 2, c + ww / 2, c + hh / 2], fill=mix(hexrgb(fora), hexrgb(dentro), t))
        for i in range(5):
            a = i * 2 * math.pi / 5
            x, y = c + math.cos(a) * w * 0.3, c + math.sin(a) * h * 0.3
            dd.ellipse([x - S * 0.012, y - S * 0.012, x + S * 0.012, y + S * 0.012], fill=hexrgb("E7C77E"))
        lay = lay.rotate(ang, resample=Image.BICUBIC, center=(c, c))
        return lay.transform(lay.size, Image.AFFINE, (1, 0, -dx, 0, 1, -dy), resample=Image.BICUBIC)

    for lado in (-1, 1):
        img = Image.alpha_composite(img, asa(S * 0.42, S * 0.3, 35 * lado, lado * S * 0.2, -S * 0.12, LILAS_ESCURO, LILAS_CLARO))
        img = Image.alpha_composite(img, asa(S * 0.3, S * 0.22, -30 * lado, lado * S * 0.15, S * 0.13, ROSA_ESCURO, "FCE1EA"))
    dr = ImageDraw.Draw(img)
    dr.rounded_rectangle([c - S * 0.018, c - S * 0.2, c + S * 0.018, c + S * 0.24], radius=S * 0.018, fill=hexrgb(TINTA))
    for lado in (-1, 1):
        dr.line([(c, c - S * 0.19), (c + lado * S * 0.12, c - S * 0.38)], fill=hexrgb(TINTA), width=int(S * 0.008))
        x, y = c + lado * S * 0.12, c - S * 0.38
        dr.ellipse([x - S * 0.016, y - S * 0.016, x + S * 0.016, y + S * 0.016], fill=hexrgb(DOURADO))
    img = img.resize((d, d), Image.LANCZOS)
    img.save(EL / nome)
    return img


def brilho(nome, d, cor="E7C77E"):
    S = d * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    c = S / 2
    pts = []
    for i in range(8):
        r = S * 0.48 if i % 2 == 0 else S * 0.1
        a = i * math.pi / 4 - math.pi / 2
        pts.append((c + math.cos(a) * r, c + math.sin(a) * r))
    dr.polygon(pts, fill=hexrgb(cor))
    img = img.resize((d, d), Image.LANCZOS)
    img.save(EL / nome)
    return img


def botao(nome, d, cor=ROSA):
    S = d * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    c = S / 2
    for k in range(10):
        t = k / 10
        w, h = S * 0.36 * (1 - t * 0.5), S * 0.56 * (1 - t * 0.5)
        dr.ellipse([c - w / 2, c - h * 0.75, c + w / 2, c + h * 0.25], fill=mix(hexrgb(ROSA_ESCURO), hexrgb("FCE1EA"), t))
    for lado in (-1, 1):
        dr.polygon([(c, c + S * 0.2), (c + lado * S * 0.2, c - S * 0.05), (c + lado * S * 0.04, c + S * 0.1)], fill=hexrgb(SALVIA))
    dr.line([(c, c + S * 0.18), (c, c + S * 0.48)], fill=hexrgb("7F9A7C"), width=int(S * 0.025))
    img = img.resize((d, d), Image.LANCZOS)
    img.save(EL / nome)
    return img


def colar(base, el, cx, cy, larg, ang=0):
    """Cola um elemento centralizado em (cx, cy), com largura e rotacao."""
    w = int(larg)
    h = int(el.height * larg / el.width)
    im = el.resize((w, h), Image.LANCZOS).rotate(ang, resample=Image.BICUBIC, expand=True)
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    lay.paste(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
    return Image.alpha_composite(base, lay)


def coroa(nome, d, E):
    """Coroa floral redonda, com buque embaixo e um raminho em cima."""
    rnd = random.Random(7)
    img = Image.new("RGBA", (d, d), (0, 0, 0, 0))
    c, R = d / 2, d * 0.37
    for i, a in enumerate(range(0, 360, 11)):
        rad = math.radians(a)
        x, y = c + math.cos(rad) * R, c + math.sin(rad) * R
        tang = -a - 90 + (28 if i % 2 else -28)
        img = colar(img, E["folha"] if i % 3 else E["folha2"], x, y, d * rnd.uniform(0.13, 0.17), tang)
    d2 = d * 0.0
    for a, el, s in [(62, "flor_creme", .16), (118, "flor_creme", .16), (75, "flor_lilas", .2), (105, "flor_lilas", .2),
                     (90, "flor_rosa", .26), (48, "botao", .09), (132, "botao", .09),
                     (250, "flor_lilas", .13), (232, "flor_rosa", .1), (268, "botao", .07)]:
        rad = math.radians(a)
        img = colar(img, E[el], c + math.cos(rad) * (R + d2), c + math.sin(rad) * (R + d2), d * s, rnd.uniform(-30, 30))
    img = colar(img, E["borboleta"], c + d * 0.36, c - d * 0.33, d * 0.15, -18)
    for a in (200, 300, 20):
        rad = math.radians(a)
        img = colar(img, E["brilho"], c + math.cos(rad) * R * 1.2, c + math.sin(rad) * R * 1.2, d * 0.04)
    img.save(EL / nome)
    return img


def arranjo(nome, d, E):
    """Arranjo de canto: abre do canto superior esquerdo para o centro."""
    rnd = random.Random(3)
    img = Image.new("RGBA", (d, d), (0, 0, 0, 0))
    ox, oy = d * 0.3, d * 0.3
    for a in range(-20, 120, 14):
        rad = math.radians(a)
        L = d * rnd.uniform(0.28, 0.38)
        img = colar(img, E["folha"] if a % 28 else E["folha2"], ox + math.cos(rad) * L * 0.6, oy + math.sin(rad) * L * 0.6, L, -a)
    for x, y, el, s in [(.52, .22, "flor_lilas", .26), (.22, .52, "flor_lilas", .24), (.5, .5, "flor_creme", .2),
                        (.68, .14, "botao", .1), (.14, .7, "botao", .1), (.32, .32, "flor_rosa", .38),
                        (.62, .36, "flor_rosa", .14), (.36, .64, "flor_creme", .14)]:
        img = colar(img, E[el], d * x, d * y, d * s, rnd.uniform(-40, 40))
    img = colar(img, E["borboleta"], d * 0.78, d * 0.62, d * 0.16, 20)
    img = colar(img, E["brilho"], d * 0.86, d * 0.3, d * 0.05)
    img = colar(img, E["brilho"], d * 0.3, d * 0.86, d * 0.04)
    img.save(EL / nome)
    return img


def ramo(nome, w, E):
    """Raminho horizontal para rotulos e faixas."""
    rnd = random.Random(11)
    h = int(w * 0.6)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for a in (-40, -15, 10, 35):
        rad = math.radians(a)
        img = colar(img, E["folha"], w * 0.35 + math.cos(rad) * w * 0.2, h * 0.5 + math.sin(rad) * w * 0.2, w * 0.42, -a)
    for x, y, el, s in [(.22, .3, "flor_lilas", .26), (.2, .72, "flor_creme", .22), (.34, .5, "flor_rosa", .4), (.6, .28, "botao", .12)]:
        img = colar(img, E[el], w * x, h * y, w * s, rnd.uniform(-30, 30))
    img.save(EL / nome)
    return img


def fundo(nome, w, h, seed=5):
    """Fundo em aquarela suave."""
    rnd = random.Random(seed)
    img = Image.new("RGBA", (w, h), hexrgb(CREME))
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for _ in range(14):
        cor = rnd.choice([LILAS, ROSA, "E7C77E", LILAS])
        r = rnd.uniform(0.18, 0.42) * w
        x = rnd.choice([rnd.uniform(-0.1, 0.3), rnd.uniform(0.7, 1.1)]) * w
        y = rnd.uniform(-0.1, 1.1) * h
        d.ellipse([x - r, y - r * 0.8, x + r, y + r * 0.8], fill=hexrgb(cor, rnd.randint(30, 60)))
    lay = lay.filter(ImageFilter.GaussianBlur(w * 0.07))
    img = Image.alpha_composite(img, lay)
    ruido = Image.effect_noise((w, h), 18).convert("L").point(lambda v: 255 - (255 - v) // 9)
    img = Image.composite(img, Image.new("RGBA", (w, h), hexrgb("E9DDEA")), ruido)
    img.convert("RGB").save(EL / nome, quality=88)
    return EL / nome


print("Desenhando elementos...")
E = {
    "flor_rosa": flor("flor-rosa.png", 700, 5, "E58BB0", "FDE6EE"),
    "flor_lilas": flor("flor-lilas.png", 600, 8, "A57FD0", "F1E7FB"),
    "flor_creme": flor("flor-creme.png", 500, 6, "E9CFA6", "FFFFFF"),
    "folha": folha("folha.png", 600),
    "folha2": folha("folha-clara.png", 600, "B7C9A8"),
    "borboleta": borboleta("borboleta.png", 600),
    "brilho": brilho("brilho.png", 200),
    "botao": botao("botao-de-flor.png", 300),
}
E["coroa"] = coroa("coroa-floral.png", 2000, E)
E["arranjo"] = arranjo("arranjo-de-canto.png", 1600, E)
E["ramo"] = ramo("raminho.png", 1000, E)
F_DIG = fundo("fundo-aquarela-story.jpg", 1080, 1920)
F_A4 = fundo("fundo-aquarela-a4.jpg", 1240, 1754, seed=9)


# =====================================================================
# Ajudantes do PPTX
# =====================================================================
def rgb(h):
    return RGBColor.from_string(h)


def criar(w, h):
    prs = Presentation()
    prs.slide_width, prs.slide_height = Emu(int(w * PX)), Emu(int(h * PX))
    return prs


def novo(prs, fundo_img=None, cor=None):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    if fundo_img:
        p = s.shapes.add_picture(str(fundo_img), 0, 0, prs.slide_width, prs.slide_height)
        p.name = "Fundo"
    elif cor:
        forma(s, 0, 0, prs.slide_width / PX, prs.slide_height / PX, fill=cor, nome="Fundo")
    return s


def forma(slide, x, y, w, h, fill=None, line=None, line_w=1.5, dash=False, tipo=MSO_SHAPE.RECTANGLE, raio=None, nome=None):
    s = slide.shapes.add_shape(tipo, Emu(int(x * PX)), Emu(int(y * PX)), Emu(int(w * PX)), Emu(int(h * PX)))
    if raio is not None:
        s.adjustments[0] = raio
    if fill:
        s.fill.solid()
        s.fill.fore_color.rgb = rgb(fill)
    else:
        s.fill.background()
    if line:
        s.line.color.rgb = rgb(line)
        s.line.width = Pt(line_w * 0.75)
        if dash:
            s.line.dash_style = MSO_LINE.DASH
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    if nome:
        s.name = nome
    return s


def texto(slide, x, y, w, h, linhas, fonte=SANS, tam=24, cor=TINTA, negrito=False, italico=False,
          alinhar=PP_ALIGN.CENTER, letras=0, espaco=1.0, nome=None):
    tb = slide.shapes.add_textbox(Emu(int(x * PX)), Emu(int(y * PX)), Emu(int(w * PX)), Emu(int(h * PX)))
    if nome:
        tb.name = nome
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    for i, linha in enumerate([linhas] if isinstance(linhas, str) else linhas):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = alinhar
        p.line_spacing = espaco
        r = p.add_run()
        r.text = linha
        f = r.font
        f.name, f.size, f.bold, f.italic = fonte, Pt(tam * 0.75), negrito, italico
        f.color.rgb = rgb(cor)
        if letras:
            r._r.get_or_add_rPr().set("spc", str(int(letras * 75)))
    return tb


def imagem(slide, caminho, x, y, w, rot=0, espelhar=False, nome=None):
    with Image.open(caminho) as im:
        h = w * im.height / im.width
    p = slide.shapes.add_picture(str(caminho), Emu(int(x * PX)), Emu(int(y * PX)), Emu(int(w * PX)), Emu(int(h * PX)))
    p.rotation = rot
    if espelhar:
        p._element.spPr.find("{http://schemas.openxmlformats.org/drawingml/2006/main}xfrm").set("flipH", "1")
    if nome:
        p.name = nome
    return p


def linha(slide, x, y, w, cor=DOURADO, esp=1.5):
    return forma(slide, x, y, w, esp, fill=cor)


def P(nome):
    return EL / nome


# =====================================================================
# Arquivo digital (1080 x 1920)
# =====================================================================
W, H = 1080, 1920
dig = criar(W, H)

# 1. Convite digital
s = novo(dig, F_DIG)
imagem(s, P("arranjo-de-canto.png"), -150, -150, 760, nome="Arranjo topo")
imagem(s, P("arranjo-de-canto.png"), W - 560, H - 560, 760, rot=180, nome="Arranjo base")
imagem(s, P("borboleta.png"), 800, 330, 140, rot=15)
imagem(s, P("borboleta.png"), 120, 1250, 100, rot=-20)
texto(s, 90, 500, 900, 40, "VOCÊ É MEU CONVIDADO ESPECIAL", SANS, 26, LILAS_ESCURO, negrito=True, letras=5)
texto(s, 60, 560, 960, 280, NOME, SCRIPT, 250, ROSA_ESCURO, nome="Nome")
linha(s, 300, 880, 150)
texto(s, 450, 845, 180, 70, IDADE, SERIF, 60, DOURADO, italico=True, nome="Idade")
linha(s, 630, 880, 150)
texto(s, 90, 950, 900, 60, "Vamos celebrar no meu " + TEMA + "!", SERIF, 46, TINTA, italico=True)
texto(s, 140, 1090, 260, 140, ["SÁBADO"], SANS, 30, TINTA_SUAVE, negrito=True, letras=4)
forma(s, 420, 1090, 2, 140, fill=DOURADO)
texto(s, 420, 1070, 240, 180, "14", SERIF, 170, DOURADO, negrito=True, nome="Dia")
forma(s, 660, 1090, 2, 140, fill=DOURADO)
texto(s, 680, 1090, 260, 140, ["DEZEMBRO", "2026"], SANS, 30, TINTA_SUAVE, negrito=True, letras=4)
texto(s, 90, 1270, 900, 60, "às 16 horas", SERIF, 44, TINTA, italico=True)
texto(s, 90, 1360, 900, 46, "ESPAÇO FLORES", SANS, 30, LILAS_ESCURO, negrito=True, letras=4)
texto(s, 90, 1410, 900, 46, "Rua das Hortênsias, 120", SERIF, 36, TINTA_SUAVE)
b = forma(s, 330, 1510, 420, 84, fill=LILAS_ESCURO, tipo=MSO_SHAPE.ROUNDED_RECTANGLE, raio=0.5, nome="Botao confirmar")
texto(s, 330, 1510, 420, 84, "CONFIRME SUA PRESENÇA", SANS, 24, BRANCO, negrito=True, letras=2)

# 2. Save the date
s = novo(dig, F_DIG)
texto(s, 60, 170, 960, 200, "Save the Date", SCRIPT, 150, ROSA_ESCURO)
imagem(s, P("coroa-floral.png"), 90, 380, 900, nome="Coroa floral")
texto(s, 240, 690, 600, 220, NOME, SCRIPT, 190, LILAS_ESCURO, nome="Nome")
texto(s, 240, 900, 600, 60, IDADE, SERIF, 52, DOURADO, italico=True, nome="Idade")
texto(s, 60, 1340, 960, 120, "14 . 12 . 2026", SERIF, 110, DOURADO, negrito=True, letras=4, nome="Data")
linha(s, 390, 1480, 300)
texto(s, 60, 1520, 960, 60, TEMA, SERIF, 50, TINTA, italico=True)
texto(s, 60, 1610, 960, 46, "CONVITE OFICIAL EM BREVE", SANS, 26, TINTA_SUAVE, negrito=True, letras=5)
imagem(s, P("borboleta.png"), 120, 230, 120, rot=-15)

# 3. Story de agradecimento
s = novo(dig, F_DIG)
imagem(s, P("arranjo-de-canto.png"), W - 610, -150, 760, rot=90, nome="Arranjo topo")
imagem(s, P("arranjo-de-canto.png"), -150, H - 610, 760, rot=270, nome="Arranjo base")
texto(s, 60, 330, 960, 260, "Obrigada", SCRIPT, 220, ROSA_ESCURO)
texto(s, 60, 600, 960, 60, "por fazer parte do meu", SERIF, 50, TINTA, italico=True)
texto(s, 60, 660, 960, 150, TEMA, SCRIPT, 120, LILAS_ESCURO)
foto = forma(s, 330, 880, 420, 420, fill="FBF4FB", line=DOURADO, line_w=6, tipo=MSO_SHAPE.OVAL, nome="Espaco para foto")
texto(s, 330, 880, 420, 420, ["SUA FOTO", "AQUI"], SANS, 26, LILAS_ESCURO, negrito=True, letras=3)
texto(s, 60, 1360, 960, 70, "Com carinho, " + NOME, SERIF, 54, TINTA, italico=True, nome="Assinatura")
texto(s, 60, 1440, 960, 50, IDADE.upper(), SANS, 28, DOURADO, negrito=True, letras=6)

dig.save(AQUI / "Pack-Jardim-Encantado-Digital.pptx")

# =====================================================================
# Arquivo de impressos (A4 retrato)
# =====================================================================
W, H = 794, 1123
a4 = criar(W, H)
CM = 37.8  # pixels por centimetro


def titulo_pagina(s, txt, sub):
    texto(s, 40, 34, W - 80, 40, txt, SERIF, 32, TINTA, negrito=True)
    texto(s, 40, 74, W - 80, 24, sub, SANS, 12, TINTA_SUAVE, letras=1)


# 1. Capa e guia
s = novo(a4, F_A4)
imagem(s, P("coroa-floral.png"), 217, 70, 360, nome="Coroa floral")
texto(s, 317, 170, 160, 160, NOME[0], SCRIPT, 150, ROSA_ESCURO, nome="Inicial")
texto(s, 40, 450, W - 80, 30, "PACK DE IDENTIDADE VISUAL", SANS, 15, LILAS_ESCURO, negrito=True, letras=5)
texto(s, 40, 480, W - 80, 90, TEMA, SCRIPT, 72, ROSA_ESCURO)
texto(s, 40, 570, W - 80, 36, NOME + " · " + IDADE, SERIF, 28, DOURADO, italico=True, nome="Nome e idade")
caixa = forma(s, 70, 640, W - 140, 400, fill=BRANCO, line=LILAS, line_w=1, tipo=MSO_SHAPE.ROUNDED_RECTANGLE, raio=0.06)
texto(s, 100, 665, W - 200, 34, "O que vem neste pack", SERIF, 28, TINTA, negrito=True)
itens = ["Convite digital", "Save the date", "Story de agradecimento", "Monograma e paleta", "Tags redondas 5 cm",
         "Rótulos para garrafinha", "Topo de bolo e toppers", "Placa de boas-vindas", "Arte do painel redondo", "Elementos em PNG"]
texto(s, 110, 715, 290, 170, ["✦  " + i for i in itens[:5]], SANS, 14, TINTA_SUAVE, alinhar=PP_ALIGN.LEFT, espaco=1.5)
texto(s, 410, 715, 290, 170, ["✦  " + i for i in itens[5:]], SANS, 14, TINTA_SUAVE, alinhar=PP_ALIGN.LEFT, espaco=1.5)
linha(s, 110, 905, W - 220, LILAS, 1)
texto(s, 100, 920, W - 200, 100, ["Como editar: no Canva, clique em Criar design > Importar arquivo e escolha este arquivo.",
                                   "Depois é só clicar nos textos para trocar nome, idade, data e local."],
      SANS, 13, TINTA, espaco=1.4)
texto(s, 40, 1065, W - 80, 30, "Criado por @marycriativa", SERIF, 18, LILAS_ESCURO, italico=True)

# 2. Identidade: monograma, logotipo, paleta, fontes e elementos
s = novo(a4, cor=CREME)
titulo_pagina(s, "Identidade da festa", "MONOGRAMA · LOGOTIPO · PALETA · FONTES · ELEMENTOS")
imagem(s, P("coroa-floral.png"), 50, 120, 330, nome="Coroa floral")
texto(s, 140, 210, 150, 150, NOME[0], SCRIPT, 140, ROSA_ESCURO, nome="Inicial")
texto(s, 50, 450, 330, 24, "MONOGRAMA", SANS, 12, TINTA_SUAVE, negrito=True, letras=3)
texto(s, 410, 170, 340, 150, NOME, SCRIPT, 130, ROSA_ESCURO, nome="Nome")
texto(s, 410, 340, 340, 30, IDADE.upper(), SANS, 18, DOURADO, negrito=True, letras=6)
texto(s, 410, 378, 340, 36, TEMA, SERIF, 30, LILAS_ESCURO, italico=True)
texto(s, 410, 450, 340, 24, "LOGOTIPO", SANS, 12, TINTA_SUAVE, negrito=True, letras=3)
linha(s, 40, 500, W - 80, LILAS, 1)
texto(s, 40, 520, W - 80, 30, "Paleta de cores", SERIF, 24, TINTA, negrito=True)
paleta = [(ROSA, "Rosa"), (ROSA_ESCURO, "Rosa escuro"), (LILAS, "Lilás"), (LILAS_ESCURO, "Lilás escuro"), (DOURADO, "Dourado"), (SALVIA, "Sálvia")]
for i, (c, n) in enumerate(paleta):
    x = 62 + i * 115
    forma(s, x, 570, 90, 90, fill=c, tipo=MSO_SHAPE.OVAL, nome="Cor " + n)
    texto(s, x - 10, 668, 110, 20, n, SANS, 12, TINTA, negrito=True)
    texto(s, x - 10, 688, 110, 20, "#" + c, SANS, 11, TINTA_SUAVE)
linha(s, 40, 730, W - 80, LILAS, 1)
texto(s, 40, 745, W - 80, 30, "Fontes", SERIF, 24, TINTA, negrito=True)
texto(s, 40, 785, 370, 60, "Great Vibes", SCRIPT, 44, ROSA_ESCURO)
texto(s, 40, 840, 370, 20, "para nomes", SANS, 11, TINTA_SUAVE)
texto(s, 410, 785, 340, 30, "Cormorant Garamond", SERIF, 28, TINTA, italico=True)
texto(s, 410, 815, 340, 26, "MONTSERRAT", SANS, 18, TINTA, negrito=True, letras=3)
texto(s, 410, 840, 340, 20, "para títulos e informações", SANS, 11, TINTA_SUAVE)
linha(s, 40, 880, W - 80, LILAS, 1)
texto(s, 40, 895, W - 80, 30, "Elementos (estão em PNG na pasta elementos)", SERIF, 24, TINTA, negrito=True)
for i, (arq, w) in enumerate([("flor-rosa.png", 110), ("flor-lilas.png", 100), ("flor-creme.png", 90), ("botao-de-flor.png", 70),
                              ("folha.png", 120), ("borboleta.png", 110), ("brilho.png", 50)]):
    x = 50 + i * 102
    imagem(s, P(arq), x + (100 - w) / 2, 945 + (120 - w) / 2 if arq != "folha.png" else 990, w)

# 3. Tags redondas 5 cm
s = novo(a4, cor=BRANCO)
titulo_pagina(s, "Tags redondas", "5 CM · IMPRIMA EM PAPEL FOTOGRÁFICO OU COUCHÊ E RECORTE NA LINHA DOURADA")
d = 5 * CM
gx, gy = 36, 28
x0 = (W - (3 * d + 2 * gx)) / 2
for r in range(4):
    for c in range(3):
        x, y = x0 + c * (d + gx), 125 + r * (d + gy)
        forma(s, x, y, d, d, fill=CREME, line=DOURADO, line_w=1.2, tipo=MSO_SHAPE.OVAL, nome="Tag")
        imagem(s, P("coroa-floral.png"), x + d * 0.03, y + d * 0.03, d * 0.94)
        texto(s, x, y + d * 0.26, d, d * 0.3, NOME, SCRIPT, 46, ROSA_ESCURO)
        texto(s, x, y + d * 0.6, d, d * 0.12, IDADE, SERIF, 16, DOURADO, italico=True)

# 4. Rotulos para garrafinha
s = novo(a4, cor=BRANCO)
titulo_pagina(s, "Rótulos para garrafinha", "19 X 5 CM · AJUSTE A LARGURA AO TAMANHO DA SUA GARRAFINHA OU LATINHA")
rw, rh = 19 * CM, 5 * CM
rx = (W - rw) / 2
for i in range(4):
    y = 130 + i * (rh + 52)
    forma(s, rx, y, rw, rh, fill=LILAS_CLARO, line=DOURADO, line_w=1.2, nome="Rotulo")
    imagem(s, P("raminho.png"), rx + 6, y + 18, 260)
    imagem(s, P("raminho.png"), rx + rw - 266, y + 18, 260, espelhar=True)
    texto(s, rx + 200, y + 28, rw - 400, 100, NOME, SCRIPT, 76, ROSA_ESCURO)
    texto(s, rx + 200, y + 128, rw - 400, 30, IDADE + " · " + TEMA, SERIF, 20, LILAS_ESCURO, italico=True)

# 5. Topo de bolo e toppers de docinho
s = novo(a4, cor=BRANCO)
titulo_pagina(s, "Topo de bolo e toppers", "TOPO 12 CM · TOPPERS 4 CM · COLE EM PAPEL PARANÁ OU FOAM E FIXE NO PALITO")
t = 12 * CM
tx = (W - t) / 2
imagem(s, P("coroa-floral.png"), tx, 115, t, nome="Topo de bolo")
texto(s, tx, 115 + t * 0.3, t, t * 0.3, NOME, SCRIPT, 100, ROSA_ESCURO, nome="Nome")
texto(s, tx, 115 + t * 0.62, t, t * 0.1, IDADE, SERIF, 28, DOURADO, italico=True)
imagem(s, P("borboleta.png"), 50, 220, 120, rot=-15, nome="Borboleta lateral")
imagem(s, P("borboleta.png"), W - 170, 220, 120, rot=15, nome="Borboleta lateral")
d = 4 * CM
gx = 30
x0 = (W - (4 * d + 3 * gx)) / 2
for r in range(3):
    for c in range(4):
        x, y = x0 + c * (d + gx), 600 + r * (d + 22)
        forma(s, x, y, d, d, fill=CREME, line=DOURADO, line_w=1.2, tipo=MSO_SHAPE.OVAL, nome="Topper")
        imagem(s, P("coroa-floral.png"), x + d * 0.02, y + d * 0.02, d * 0.96)
        texto(s, x, y + d * 0.24, d, d * 0.5, NOME[0], SCRIPT, 62, ROSA_ESCURO)

# 6. Placa de boas-vindas
s = novo(a4, F_A4)
imagem(s, P("arranjo-de-canto.png"), -110, -110, 480, nome="Arranjo topo")
imagem(s, P("arranjo-de-canto.png"), W - 370, H - 370, 480, rot=180, nome="Arranjo base")
texto(s, 60, 320, W - 120, 50, "Bem-vindos ao", SERIF, 42, TINTA, italico=True)
texto(s, 60, 370, W - 120, 110, TEMA, SCRIPT, 92, LILAS_ESCURO)
texto(s, 60, 480, W - 120, 40, "da", SERIF, 34, TINTA, italico=True)
texto(s, 60, 515, W - 120, 200, NOME, SCRIPT, 170, ROSA_ESCURO, nome="Nome")
texto(s, 60, 745, W - 120, 36, IDADE.upper(), SANS, 22, DOURADO, negrito=True, letras=8)
linha(s, 297, 800, 200)
texto(s, 60, 820, W - 120, 40, "14 de dezembro de 2026", SERIF, 28, TINTA_SUAVE, italico=True, nome="Data")

# 7. Arte do painel redondo
s = novo(a4, cor=BRANCO)
titulo_pagina(s, "Arte do painel redondo", "ENVIE PARA A GRÁFICA NO TAMANHO DO SEU PAINEL (EX.: 1,5 M)")
pd = 700
px, py = (W - pd) / 2, 170
forma(s, px, py, pd, pd, fill=LILAS_CLARO, line=DOURADO, line_w=3, tipo=MSO_SHAPE.OVAL, nome="Painel")
imagem(s, P("coroa-floral.png"), px + 20, py + 20, pd - 40, nome="Coroa floral")
texto(s, px, py + pd * 0.3, pd, pd * 0.26, NOME, SCRIPT, 200, ROSA_ESCURO, nome="Nome")
texto(s, px, py + pd * 0.62, pd, pd * 0.08, IDADE, SERIF, 48, DOURADO, italico=True, nome="Idade")
texto(s, 60, 920, W - 120, 60, ["Dica: peça para a Mary exportar a arte em alta resolução para impressão grande."],
      SANS, 13, TINTA_SUAVE)

a4.save(AQUI / "Pack-Jardim-Encantado-Impressos-A4.pptx")
print("Pronto:", ", ".join(p.name for p in AQUI.glob("*.pptx")))
