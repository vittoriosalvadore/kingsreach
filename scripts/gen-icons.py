#!/usr/bin/env python3
# Generates Kingsreach PWA app icons from scratch (no image libraries).
# A gold crown on a dark, faintly glowing field — matches the game palette
# (gold #d9b96a, panel #0d0c0a). Content sits in the maskable safe zone.
#
# Usage: python3 scripts/gen-icons.py   ->  writes icons/*.png
import zlib, struct, os

GOLD     = (217, 185, 106)
GOLD_HI  = (245, 222, 150)
GOLD_DK  = (138, 116, 63)
DARK     = (13, 12, 10)
DARK2    = (30, 26, 19)
RED      = (192, 57, 43)
RED_HI   = (224, 96, 80)

# crown silhouette control points (normalized, y-down): a 3-peak crown
PTS = [(0.22,0.50),(0.30,0.27),(0.41,0.52),(0.50,0.22),(0.59,0.52),(0.70,0.27),(0.78,0.50)]
JEWELS = [(0.30,0.29),(0.50,0.25),(0.70,0.29)]
BAND_BOT = 0.71

def mix(a, b, t):
    t = 0.0 if t < 0 else 1.0 if t > 1 else t
    return tuple(int(a[i] + (b[i]-a[i])*t) for i in range(3))

def top_edge(x):
    for i in range(len(PTS)-1):
        x0,y0 = PTS[i]; x1,y1 = PTS[i+1]
        if x0 <= x <= x1:
            return y0 + (y1-y0)*((x-x0)/(x1-x0))
    return 2.0

def shade(x, y):
    dx, dy = x-0.5, y-0.5
    d = (dx*dx + dy*dy) ** 0.5
    col = mix(DARK2, DARK, d*1.7)
    col = mix(col, GOLD, max(0.0, 1-d*2.7)*0.13)        # soft glow behind crown
    if 0.22 <= x <= 0.78:
        yt = top_edge(x)
        if yt <= y <= BAND_BOT:
            col = mix(GOLD_HI, GOLD_DK, (y-0.22)/(BAND_BOT-0.22))   # vertical sheen
            if y > 0.555 and y < 0.575:                  # band separator line
                col = mix(col, GOLD_DK, 0.5)
    for jx, jy in JEWELS:                                # peak gems
        r = ((x-jx)**2 + (y-jy)**2) ** 0.5
        if r < 0.025: col = mix(RED_HI, RED, r/0.025)
        elif r < 0.034: col = GOLD_HI
    r = ((x-0.5)**2 + (y-0.635)**2) ** 0.5               # center band gem
    if r < 0.033: col = mix(RED_HI, RED, r/0.033)
    elif r < 0.042: col = GOLD_HI
    return col

def write_png(path, size, ss=3):
    raw = bytearray()
    inv = 1.0/size
    for y in range(size):
        raw.append(0)  # filter: none
        for x in range(size):
            r=g=b=0
            for sy in range(ss):
                for sx in range(ss):
                    c = shade((x+(sx+0.5)/ss)*inv, (y+(sy+0.5)/ss)*inv)
                    r+=c[0]; g+=c[1]; b+=c[2]
            n = ss*ss
            raw += bytes((r//n, g//n, b//n, 255))
    def chunk(typ, data):
        return (struct.pack('>I', len(data)) + typ + data
                + struct.pack('>I', zlib.crc32(typ+data) & 0xffffffff))
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', zlib.compress(bytes(raw), 9)))
        f.write(chunk(b'IEND', b''))
    print(f'  {path} ({size}x{size})')

if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', 'icons')
    os.makedirs(out, exist_ok=True)
    print('Generating icons:')
    write_png(os.path.join(out, 'icon-192.png'), 192)
    write_png(os.path.join(out, 'icon-512.png'), 512, ss=2)
    write_png(os.path.join(out, 'apple-touch-icon-180.png'), 180)
    print('Done.')
