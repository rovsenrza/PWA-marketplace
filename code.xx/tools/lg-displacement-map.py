# Карта смещения для feDisplacementMap: ободок выпуклого стекла тянет фон к центру.
import numpy as np, base64, io, json, sys
from PIL import Image

def sdf_rrect(px, py, hw, hh, r):
    qx = np.abs(px) - (hw - r); qy = np.abs(py) - (hh - r)
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r

def make(W, H, r, bezel, dmax):
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float64)
    px = xs + 0.5 - W / 2; py = ys + 0.5 - H / 2
    d = sdf_rrect(px, py, W / 2, H / 2, r)
    e = 0.5
    gx = (sdf_rrect(px + e, py, W/2, H/2, r) - sdf_rrect(px - e, py, W/2, H/2, r)) / (2 * e)
    gy = (sdf_rrect(px, py + e, W/2, H/2, r) - sdf_rrect(px, py - e, W/2, H/2, r)) / (2 * e)
    n = np.hypot(gx, gy) + 1e-9; gx /= n; gy /= n
    inside = -d                                   # расстояние до края внутрь
    t = np.clip(1 - inside / bezel, 0, 1)         # 0 в плоской середине, 1 на кромке
    mag = dmax * (1 - np.sqrt(1 - t ** 2))        # выпуклый профиль: резко у самого края
    dx = -gx * mag; dy = -gy * mag                # выборка смещается внутрь
    s = 2 * dmax / min(W, H) * 1.02               # общий scale фильтра (в долях bbox)
    R = 0.5 + dx / (s * W); G = 0.5 + dy / (s * H)
    img = np.zeros((H, W, 3), np.uint8)
    img[..., 0] = np.clip(np.round(R * 255), 0, 255)
    img[..., 1] = np.clip(np.round(G * 255), 0, 255)
    img[..., 2] = 128
    buf = io.BytesIO(); Image.fromarray(img).save(buf, 'PNG', optimize=True)
    return {'uri': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), 'scale': round(s, 4), 'kb': len(buf.getvalue()) // 1024}

out = {
    'tab':    make(378, 66, 33, 22, 12),
    'circle': make(40, 40, 20, 12, 6),
}
json.dump(out, open('lgmaps.json', 'w'))  # uri и scale вставляются в <filter id="lg-tab"> / <filter id="lg-circle"> в index.html
print({k: (v['scale'], v['kb']) for k, v in out.items()})
