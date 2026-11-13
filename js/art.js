'use strict';
/* Procedural painterly art: sky, parallax town, buildings, characters, particles */
(function () {
  const A = G.A = {}; const { clamp, hash } = U; const PI = Math.PI, TAU = PI * 2;
  const EMO = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  A.EMO = EMO;
  const cache = {};
  function rgb(h) { if (typeof h !== 'string') return h; let c = cache[h]; if (!c) { const n = parseInt(h.slice(1), 16); c = cache[h] = [n >> 16, n >> 8 & 255, n & 255]; } return c; }
  function mix(a, b, t) { a = rgb(a); b = rgb(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c, al) { c = rgb(c); return al === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${al})`; }
  function shade(c, k) { return k < 0 ? mix(c, '#24104a', -k) : mix(c, '#fff4d8', k); }
  A.mix = mix; A.css = css; A.shade = shade;
  A.rr = function (c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  };
  function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU); }
  function vgrad(c, y0, y1, c0, c1) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, css(c0)); g.addColorStop(1, css(c1)); return g; }
  function glow(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  A.ell = ell; A.vgrad = vgrad; A.glow = glow;
  function emoji(c, s, x, y, size) { c.font = size + 'px ' + EMO; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText(s, x, y); }
  A.emoji = emoji;

  /* ---------- SKY ---------- */
  const SKY = [[0, '#0b1034', '#1d2b62', '#31407f'], [4.5, '#131845', '#2c3275', '#51468c'], [6, '#4257ad', '#e88ea3', '#ffcb92'],
  [8, '#3b97e6', '#8fd0f7', '#dcf2ff'], [16, '#2f8ae0', '#86c9f5', '#e6f5ff'], [18, '#4c62c6', '#f08f7c', '#ffd08a'],
  [19.5, '#2e2d80', '#a8559c', '#f6926c'], [21, '#121746', '#2d2d76', '#5e4290'], [24, '#0b1034', '#1d2b62', '#31407f']];
  A.skyAt = function (h) {
    let i = 0; while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++;
    const a = SKY[i], b = SKY[i + 1], t = clamp((h - a[0]) / (b[0] - a[0]), 0, 1);
    return [mix(a[1], b[1], t), mix(a[2], b[2], t), mix(a[3], b[3], t)];
  };
  A.darkAt = h => h < 5 ? 1 : h < 7 ? 1 - (h - 5) / 2 : h < 18 ? 0 : h < 21 ? (h - 18) / 3 : 1;
  A.cur = { top: [0, 0, 0], mid: [0, 0, 0], bot: [0, 0, 0] }; A.dark = 0;
  function cloud(c, x, y, s, col, col2) {
    const B = [[-50, 0, 30], [-20, -18, 38], [20, -10, 34], [52, 2, 26], [0, 8, 40]];
    c.fillStyle = col2; for (const b of B) { ell(c, x + b[0] * s, y + b[1] * s + 7 * s, b[2] * s, b[2] * s * .8); c.fill(); }
    c.fillStyle = col; for (const b of B) { ell(c, x + b[0] * s, y + b[1] * s, b[2] * s, b[2] * s * .8); c.fill(); }
  }
  A.sky = function (c, hour, t) {
    const vw = G.vw, gy = G.gy; const [top, mid, bot] = A.skyAt(hour); A.cur = { top, mid, bot }; const dark = A.dark = A.darkAt(hour);
    const g = c.createLinearGradient(0, 0, 0, gy + 20); g.addColorStop(0, css(top)); g.addColorStop(.62, css(mid)); g.addColorStop(1, css(bot));
    c.fillStyle = g; c.fillRect(0, 0, vw, G.vh);
    if (dark > .05) for (let i = 0; i < 80; i++) {
      const tw = .5 + .5 * Math.sin(t * 2 + i * 1.7), sz = 1.2 + hash(i + 7) * 2;
      c.fillStyle = `rgba(255,250,220,${dark * (.3 + .7 * tw)})`; c.fillRect(hash(i) * vw, hash(i + 99) * gy * .78, sz, sz);
    }
    if (hour > 5.5 && hour < 19.8) {
      const a = (hour - 5.5) / 14.3, sx = vw * (.08 + .84 * a), sy = gy * (.92 - Math.sin(a * PI) * .74);
      glow(c, sx, sy, 230, '255,236,180', .55); glow(c, sx, sy, 90, '255,250,220', .8);
      c.fillStyle = '#fff6cf'; ell(c, sx, sy, 34, 34); c.fill();
    } else {
      const a = ((hour + 24 - 19.8) % 24) / 9.7, mx = vw * (.12 + .76 * a), my = gy * (.8 - Math.sin(a * PI) * .6);
      glow(c, mx, my, 170, '190,200,255', .35);
      c.fillStyle = '#f4f1ff'; ell(c, mx, my, 28, 28); c.fill();
      c.fillStyle = css(mix(top, mid, .4)); ell(c, mx + 12, my - 7, 24, 24); c.fill();
    }
    const cc = css(mix(bot, '#ffffff', .6 * (1 - dark * .75)), .92), cs = css(mix(mid, '#8a6fc0', .3), .5);
    for (let i = 0; i < 7; i++) {
      const sp = 6 + hash(i + 3) * 10, W = vw + 500, x = ((hash(i) * W + t * sp) % W) - 250;
      cloud(c, x, gy * (.06 + hash(i + 20) * .46), .6 + hash(i + 40) * .9, cc, cs);
    }
  };

  /* ---------- FAR / MID PARALLAX ---------- */
  function skyline(c, off, seed, step, baseY, col, hmin, hmax, wins) {
    const vw = G.vw, i0 = Math.floor(off / step) - 1, i1 = Math.floor((off + vw) / step) + 1;
    const fill = css(col), lit = A.dark > .35;
    for (let i = i0; i <= i1; i++) {
      const h = hmin + hash(i * 3 + seed) * (hmax - hmin), w = step * (.75 + hash(i * 5 + seed) * .45), x = i * step - off, k = hash(i * 7 + seed);
      c.fillStyle = fill; c.fillRect(x, baseY - h, w, h + 60);
      if (k < .25) { c.beginPath(); c.arc(x + w / 2, baseY - h, w * .42, PI, 0); c.fill(); c.fillRect(x + w / 2 - 1.5, baseY - h - w * .42 - 14, 3, 16); }
      else if (k < .42) {
        const tw = w * .3, tx = x + w * .35; c.fillRect(tx, baseY - h - 80, tw, 82);
        c.beginPath(); c.moveTo(tx - 4, baseY - h - 80); c.quadraticCurveTo(tx + tw / 2, baseY - h - 130, tx + tw + 4, baseY - h - 80); c.fill(); c.fillRect(tx + tw / 2 - 1.5, baseY - h - 122, 3, 20);
      }
      else if (k < .62) { for (let j = 0; j < 4; j++) c.fillRect(x + j * w / 4, baseY - h - 8, w / 8, 9); }
      else if (k < .8) { c.beginPath(); c.moveTo(x - 6, baseY - h); c.lineTo(x + w / 2, baseY - h - 34); c.lineTo(x + w + 6, baseY - h); c.fill(); }
      if (wins) {
        const cols = Math.max(1, Math.floor(w / 26)), rows = Math.floor(h / 44);
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
          const on = lit && hash(i * 31 + r * 7 + q * 13 + seed) > .45, wx = x + 9 + q * 26, wy = baseY - h + 16 + r * 44;
          c.fillStyle = on ? '#fff3c0' : css(shade(col, -.22)); c.fillRect(wx, wy, 9, 14);
        }
      }
    }
  }
  A.far = function (c, cam) {
    const vw = G.vw, gy = G.gy, { mid, bot } = A.cur;
    c.fillStyle = css(mix(mix(mid, bot, .5), '#7b6bb5', .3)); c.beginPath(); c.moveTo(0, gy + 20);
    for (let x = 0; x <= vw + 24; x += 24) { const wx = x + cam * .08; c.lineTo(x, gy - 170 - Math.sin(wx * .004) * 70 - Math.sin(wx * .011 + 2) * 30 - Math.sin(wx * .023) * 10); }
    c.lineTo(vw + 24, gy + 20); c.fill();
    skyline(c, cam * .2 + 5000, 11, 96, gy - 50, mix(bot, '#7466b8', .5), 120, 250, false);
    c.fillStyle = css(bot, .25); c.fillRect(0, gy - 200, vw, 220);
    skyline(c, cam * .45 + 9000, 23, 84, gy + 6, mix(mix(bot, mid, .3), '#b46b5c', .6), 110, 215, true);
    c.fillStyle = css(bot, .16); c.fillRect(0, gy - 140, vw, 160);
  };

  /* ---------- GROUND ---------- */
  A.ground = function (c, cam) {
    const vw = G.vw, gy = G.gy, vh = G.vh;
    c.fillStyle = vgrad(c, gy, vh, A.gcol[0], A.gcol[1]); c.fillRect(0, gy, vw, vh - gy);
    c.fillStyle = 'rgba(120,70,60,.28)'; c.fillRect(0, gy, vw, 7);
    c.fillStyle = 'rgba(255,240,200,.35)'; c.fillRect(0, gy + 7, vw, 3);
    const i0 = Math.floor(cam / 46) - 1, n = Math.ceil(vw / 46) + 2;
    for (let r = 0; r < 5; r++) {
      const y = gy + 26 + r * 34, sc = 1 + r * .12;
      for (let i = i0; i < i0 + n; i++) {
        const h1 = hash(i * 17 + r * 91); if (h1 < .35) continue;
        const x = i * 46 + hash(i + r * 5) * 30 - cam + (r % 2) * 23;
        c.fillStyle = h1 > .7 ? 'rgba(255,236,190,.4)' : 'rgba(130,78,66,.2)';
        ell(c, x, y, (10 + h1 * 12) * sc, (3.5 + h1 * 3) * sc); c.fill();
      }
    }
  };

  /* ---------- BUILDING PARTS ---------- */
  A.tint = null; A.gcol = ['#efc98f', '#b9805c'];
  function wall(c, x, y, w, h, col, r) {
    if (A.tint) col = mix(col, A.tint[0], A.tint[1]);
    c.fillStyle = vgrad(c, y, y + h, shade(col, .16), shade(col, -.18)); A.rr(c, x, y, w, h, r === undefined ? 6 : r); c.fill();
    c.fillStyle = 'rgba(42,16,80,.13)'; c.fillRect(x + w * .86, y + 4, w * .14 - 2, h - 4);
    c.fillStyle = css(shade(col, -.35), .22);
    const n = Math.floor(w * h / 5200);
    for (let i = 0; i < n; i++) { A.rr(c, x + 10 + hash(i * 13 + w) * (w - 46), y + 14 + hash(i * 29 + h) * (h - 34), 16 + hash(i) * 10, 5, 2); c.fill(); }
    const g = c.createLinearGradient(0, y + h - 30, 0, y + h); g.addColorStop(0, 'rgba(40,16,70,0)'); g.addColorStop(1, 'rgba(40,16,70,.32)');
    c.fillStyle = g; c.fillRect(x, y + h - 30, w, 30);
  }
  function arch(c, x, y, w, h) { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, PI, 0); c.lineTo(x + w, y + h); c.closePath(); }
  function win(c, x, y, w, h, seed) {
    const lit = A.dark > .3;
    c.fillStyle = '#fff1d6'; arch(c, x - w / 2 - 4, y - 4, w + 8, h + 8); c.fill();
    c.fillStyle = lit ? '#ffcf7a' : '#3a5896'; arch(c, x - w / 2, y, w, h); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(x - w / 2 + 3, y + h * .6); c.lineTo(x + w / 2 - 5, y + h * .25); c.lineTo(x + w / 2 - 3, y + h * .4); c.lineTo(x - w / 2 + 3, y + h * .75); c.fill();
    c.fillStyle = '#d9b98c'; A.rr(c, x - w / 2 - 7, y + h + 3, w + 14, 6, 3); c.fill();
    if (lit) { G.wins.push([x - w / 2, y, w, h, 1]); G.lights.push([x, y + h / 2, 70, '255,200,110']); }
  }
  function door(c, x, gy, w, h, col) {
    c.fillStyle = css(shade(col, -.5)); arch(c, x - w / 2 - 5, gy - h - 5, w + 10, h + 5); c.fill();
    c.fillStyle = vgrad(c, gy - h, gy, shade(col, .12), shade(col, -.25)); arch(c, x - w / 2, gy - h, w, h); c.fill();
    c.strokeStyle = css(shade(col, -.45), .6); c.lineWidth = 2; c.beginPath();
    for (let i = 1; i < 3; i++) { c.moveTo(x - w / 2 + i * w / 3, gy - h + 12); c.lineTo(x - w / 2 + i * w / 3, gy); } c.stroke();
    c.fillStyle = '#ffd35c'; ell(c, x + w / 2 - 9, gy - h * .45, 3.5, 3.5); c.fill();
  }
  function awning(c, x, y, w, d, c1, c2, t) {
    const n = Math.max(4, Math.round(w / 28)), sw = w / n, inset = 10, tw = (w - inset * 2) / n;
    for (let i = 0; i < n; i++) {
      const fl = Math.sin(t * 2.4 + i * .9 + x * .01) * 2.5;
      c.fillStyle = css(i % 2 ? c1 : c2); c.beginPath(); c.moveTo(x + inset + i * tw, y); c.lineTo(x + inset + (i + 1) * tw + .5, y);
      c.lineTo(x + (i + 1) * sw + .5, y + d); c.arc(x + (i + .5) * sw, y + d + fl * .3, sw / 2 + .3, 0, PI); c.lineTo(x + i * sw, y + d); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + inset, y, w - inset * 2, 4);
    c.fillStyle = 'rgba(40,16,70,.16)'; c.fillRect(x + 6, y + d + sw / 2, w - 12, 12);
  }
  A.awning = awning;
  function sign(c, x, y, e, col) {
    c.fillStyle = css(shade(col || '#8a5a3a', -.3)); A.rr(c, x - 27, y - 23, 54, 50, 12); c.fill();
    c.fillStyle = css(col || '#8a5a3a'); A.rr(c, x - 25, y - 25, 50, 48, 12); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; A.rr(c, x - 21, y - 22, 42, 12, 6); c.fill();
    emoji(c, e, x, y + 1, 26);
  }
  A.lantern = function (c, x, y, t, col) {
    const sw = Math.sin(t * 1.6 + x * .013) * .14; c.save(); c.translate(x, y); c.rotate(sw);
    c.strokeStyle = '#4a3050'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 14); c.stroke();
    c.fillStyle = css(col || '#ff8f3c'); A.rr(c, -9, 14, 18, 22, 7); c.fill();
    c.fillStyle = '#ffe9a8'; A.rr(c, -4.5, 18, 9, 14, 4); c.fill();
    c.fillStyle = '#4a3050'; c.fillRect(-6, 12, 12, 3); c.fillRect(-5, 35, 10, 3); c.restore();
    G.lights.push([x - Math.sin(sw) * 24, y + 26, 100, '255,170,80']);
  };
  A.lampPost = function (c, x, gy, t) {
    c.fillStyle = '#4a3558'; A.rr(c, x - 4, gy - 150, 8, 150, 3); c.fill(); A.rr(c, x - 9, gy - 10, 18, 10, 3); c.fill();
    c.fillRect(x - 2, gy - 150, 34, 5); A.lantern(c, x + 28, gy - 147, t, '#ffb347');
  };
  A.palm = function (c, x, gy, t, s, sd) {
    sd = sd || 0;
    s = s || 1; const sway = Math.sin(t * .9 + sd) * 6 * s, tx = x + 26 * s + sway, ty = gy - 190 * s;
    c.strokeStyle = '#9a6a48'; c.lineWidth = 15 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x - 12 * s, gy - 100 * s, tx, ty); c.stroke();
    c.strokeStyle = 'rgba(60,30,40,.25)'; c.lineWidth = 3;
    for (let i = 1; i < 8; i++) { const p = i / 8, px = (1 - p) * (1 - p) * x + 2 * (1 - p) * p * (x - 12 * s) + p * p * tx, py = (1 - p) * (1 - p) * gy + 2 * (1 - p) * p * (gy - 100 * s) + p * p * ty; c.beginPath(); c.moveTo(px - 7 * s, py); c.lineTo(px + 7 * s, py - 2); c.stroke(); }
    for (let i = 0; i < 7; i++) {
      const a = -PI * .95 + i * (PI * .9 / 6), L = (78 + hash(i + sd) * 26) * s, sw2 = Math.sin(t * 1.3 + i) * 5;
      const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .55 + 34 * s + sw2;
      c.fillStyle = css(i % 2 ? '#3f9a5a' : '#57b56a'); c.beginPath(); c.moveTo(tx, ty);
      c.quadraticCurveTo(tx + Math.cos(a) * L * .6, ty + Math.sin(a) * L * .9 - 14 * s, ex, ey);
      c.quadraticCurveTo(tx + Math.cos(a) * L * .5, ty + Math.sin(a) * L * .5 + 6 * s, tx, ty); c.fill();
    }
    c.fillStyle = '#7a4a34'; ell(c, tx - 4, ty + 6, 6 * s, 6 * s); c.fill(); ell(c, tx + 7, ty + 8, 5 * s, 5 * s); c.fill();
  };
  A.crate = function (c, x, y, s, col) {
    col = col || '#b97a45'; c.fillStyle = css(shade(col, -.25)); A.rr(c, x - s / 2, y - s, s, s, 3); c.fill();
    c.fillStyle = css(col); A.rr(c, x - s / 2 + 3, y - s + 3, s - 6, s - 6, 2); c.fill();
    c.strokeStyle = css(shade(col, -.3)); c.lineWidth = 3; c.beginPath(); c.moveTo(x - s / 2 + 4, y - s + 4); c.lineTo(x + s / 2 - 4, y - 4); c.stroke();
  };
  A.bunting = function (c, x1, y1, x2, y2, t) {
    const n = Math.round(Math.abs(x2 - x1) / 26), cols = ['#ff5d6c', '#ffc94a', '#3fc6b0', '#7d6bf0', '#ff8f3c'];
    c.strokeStyle = 'rgba(70,40,80,.7)'; c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i <= n; i++) { const p = i / n, x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p + Math.sin(p * PI) * 26; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    for (let i = 0; i < n; i++) {
      const p = (i + .5) / n, x = x1 + (x2 - x1) * p, y = y1 + (y2 - y1) * p + Math.sin(p * PI) * 26, sw = Math.sin(t * 3 + i * .8) * 3;
      c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x + 8, y); c.lineTo(x + sw, y + 17); c.fill();
    }
  };
  function smoke(c, x, y, t) {
    for (let j = 0; j < 5; j++) { const p = (t * .22 + j / 5) % 1; c.fillStyle = `rgba(255,250,245,${(1 - p) * .45})`; ell(c, x + Math.sin(p * 6 + j) * 10 + p * 18, y - p * 100, 8 + p * 16, 8 + p * 14); c.fill(); }
  }
  function flag(c, x, y, w, h, col, t) {
    c.fillStyle = css(col); c.beginPath(); c.moveTo(x, y);
    for (let i = 0; i <= 6; i++) c.lineTo(x + i * w / 6, y + Math.sin(t * 4 + i * .9) * 3 * (i / 6));
    for (let i = 6; i >= 0; i--) c.lineTo(x + i * w / 6, y + h + Math.sin(t * 4 + i * .9 + .5) * 3 * (i / 6));
    c.fill();
  }

  /* ---------- LOCATIONS ---------- */
  const B = A.B = {};
  B.home = function (c, x, gy, t) {
    c.fillStyle = '#b96a4a'; c.fillRect(x + 48, gy - 252, 26, 60); c.fillStyle = '#8f4a36'; c.fillRect(x + 44, gy - 258, 34, 9);
    if (A.dark > .2 || G.st && G.st.time < 480) smoke(c, x + 61, gy - 262, t);
    wall(c, x - 110, gy - 168, 220, 168, '#f2d2a6', 8);
    c.fillStyle = vgrad(c, gy - 262, gy - 160, '#f07a48', '#c4502f'); c.beginPath(); c.moveTo(x - 134, gy - 160); c.quadraticCurveTo(x - 40, gy - 190, x, gy - 262); c.quadraticCurveTo(x + 40, gy - 190, x + 134, gy - 160); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(120,40,30,.35)'; c.lineWidth = 2;
    for (let r = 0; r < 3; r++) { c.beginPath(); for (let i = -4; i <= 4; i++) { const w = 100 - r * 28; if (Math.abs(i * 22) < w) c.arc(x + i * 22, gy - 176 - r * 24, 11, .15 * PI, .85 * PI); } c.stroke(); }
    door(c, x - 42, gy, 48, 90, '#8a5a3a');
    c.fillStyle = '#fff1d6'; ell(c, x + 50, gy - 108, 28, 28); c.fill();
    const lit = A.dark > .3; c.fillStyle = lit ? '#ffcf7a' : '#3a5896'; ell(c, x + 50, gy - 108, 22, 22); c.fill();
    if (lit) { G.wins.push([x + 28, gy - 130, 44, 44, 2]); G.lights.push([x + 50, gy - 108, 90, '255,200,110']); }
    c.strokeStyle = '#fff1d6'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 28, gy - 108); c.lineTo(x + 72, gy - 108); c.moveTo(x + 50, gy - 130); c.lineTo(x + 50, gy - 86); c.stroke();
    c.fillStyle = '#a8683a'; A.rr(c, x + 22, gy - 78, 56, 12, 3); c.fill();
    for (let i = 0; i < 4; i++) { c.fillStyle = ['#ff5d6c', '#ffc94a', '#ff8fb0', '#fff'][i]; ell(c, x + 30 + i * 13, gy - 82 + Math.sin(t * 2 + i) * 1.5, 6, 6); c.fill(); }
    c.fillStyle = '#6a4a6a'; c.fillRect(x + 150, gy - 120, 5, 120);
    c.strokeStyle = 'rgba(70,40,80,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 108, gy - 128); c.quadraticCurveTo(x + 130, gy - 106, x + 152, gy - 118); c.stroke();
    const cl = ['#5ec1d8', '#ff8f6c', '#fff3d8'];
    for (let i = 0; i < 3; i++) { const sw = Math.sin(t * 2.2 + i) * 4; c.fillStyle = cl[i]; c.beginPath(); c.moveTo(x + 112 + i * 13, gy - 121 + i * 3); c.lineTo(x + 123 + i * 13, gy - 119 + i * 3); c.lineTo(x + 124 + i * 13 + sw, gy - 96 + i * 3); c.lineTo(x + 111 + i * 13 + sw, gy - 97 + i * 3); c.fill(); }
    A.lantern(c, x - 86, gy - 150, t);
  };
  B.well = function (c, x, gy, t) {
    A.palm(c, x - 150, gy + 4, t, 1.05, 7);
    c.fillStyle = 'rgba(60,30,70,.2)'; ell(c, x, gy + 4, 120, 16); c.fill();
    c.fillStyle = vgrad(c, gy - 52, gy, '#e4d8ee', '#a999c2'); A.rr(c, x - 96, gy - 50, 192, 54, 16); c.fill();
    c.fillStyle = '#f4ecfa'; ell(c, x, gy - 50, 96, 15); c.fill();
    c.fillStyle = '#58c8ea'; ell(c, x, gy - 49, 84, 11); c.fill();
    c.fillStyle = 'rgba(255,255,255,.65)'; for (let i = 0; i < 5; i++) { const p = (t * .5 + i * .2) % 1; ell(c, x - 60 + hash(i) * 120, gy - 49 + (hash(i + 5) - .5) * 10, 10 * p + 2, 2.2 * p + .6); c.globalAlpha = 1 - p; c.fill(); c.globalAlpha = 1; }
    c.fillStyle = vgrad(c, gy - 140, gy - 50, '#efe6f6', '#b4a4cc'); A.rr(c, x - 11, gy - 132, 22, 84, 5); c.fill();
    c.fillStyle = '#d9cde6'; c.beginPath(); c.moveTo(x - 40, gy - 138); c.quadraticCurveTo(x, gy - 108, x + 40, gy - 138); c.closePath(); c.fill();
    c.fillStyle = '#58c8ea'; ell(c, x, gy - 138, 38, 6); c.fill();
    c.fillStyle = '#efe6f6'; ell(c, x, gy - 150, 9, 12); c.fill();
    for (let k = 0; k < 6; k++) {
      const dir = (k - 2.5) / 2.5;
      for (let j = 0; j < 7; j++) {
        const p = (t * .9 + j / 7 + k * .13) % 1, px = x + dir * p * 74, py = gy - 160 - Math.sin(p * PI) * 34 + p * 108;
        c.fillStyle = `rgba(${200 + 55 * p | 0},245,255,${.9 - p * .5})`; ell(c, px, py, 3.4 - p * 1.2, 4.5); c.fill();
      }
    }
    c.fillStyle = '#a8683a'; A.rr(c, x + 128, gy - 34, 74, 9, 3); c.fill(); c.fillRect(x + 134, gy - 26, 6, 26); c.fillRect(x + 190, gy - 26, 6, 26);
    A.lampPost(c, x + 232, gy, t);
  };
  B.eatery = function (c, x, gy, t) {
    c.fillStyle = '#7d5a66'; c.fillRect(x + 62, gy - 236, 22, 44); smoke(c, x + 73, gy - 240, t);
    wall(c, x - 124, gy - 196, 248, 196, '#35a89c', 8);
    c.fillStyle = '#fbe9c6'; A.rr(c, x - 132, gy - 208, 264, 20, 6); c.fill();
    c.fillStyle = 'rgba(40,16,70,.15)'; c.fillRect(x - 124, gy - 188, 248, 6);
    win(c, x - 70, gy - 108, 62, 62, x + 1); door(c, x + 56, gy, 52, 96, '#c45a3c');
    c.fillStyle = '#a8683a'; A.rr(c, x - 110, gy - 42, 82, 10, 3); c.fill();
    emoji(c, '🥘', x - 86, gy - 54, 20); emoji(c, '🫖', x - 54, gy - 54, 20);
    awning(c, x - 128, gy - 150, 256, 34, '#ef5350', '#fff3d8', t);
    sign(c, x - 20, gy - 222, '🍲', '#c45a3c');
    c.fillStyle = '#a8683a'; ell(c, x + 176, gy - 40, 30, 7); c.fill(); c.fillRect(x + 173, gy - 40, 6, 40);
    c.fillStyle = '#8a5236'; A.rr(c, x + 140, gy - 22, 16, 22, 3); c.fill(); A.rr(c, x + 198, gy - 22, 16, 22, 3); c.fill();
    emoji(c, '🍵', x + 176, gy - 52, 18);
    A.lantern(c, x - 110, gy - 112, t, '#ffb347'); A.lantern(c, x + 110, gy - 112, t, '#ff7a59');
  };
  B.academy = function (c, x, gy, t) {
    c.fillStyle = vgrad(c, gy - 350, gy - 250, '#ffd76a', '#e09a2c'); c.beginPath(); c.arc(x, gy - 250, 78, PI, 0); c.fill();
    c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(x - 26, gy - 276, 30, PI * 1.1, PI * 1.6); c.lineTo(x - 26, gy - 276); c.fill();
    c.fillStyle = '#e09a2c'; c.fillRect(x - 3, gy - 362, 6, 36); emoji(c, '⭐', x, gy - 370 + Math.sin(t * 2) * 2, 22);
    wall(c, x - 130, gy - 250, 260, 250, '#b9a5e6', 6);
    c.fillStyle = '#efe6ff'; A.rr(c, x - 140, gy - 262, 280, 20, 5); c.fill();
    for (let i = 0; i < 4; i++) { const px = x - 112 + i * 75; c.fillStyle = vgrad(c, gy - 240, gy, '#f6f0ff', '#cfc0ee'); A.rr(c, px - 11, gy - 240, 22, 232, 6); c.fill(); c.fillStyle = '#efe6ff'; A.rr(c, px - 16, gy - 244, 32, 10, 3); c.fill(); A.rr(c, px - 16, gy - 12, 32, 10, 3); c.fill(); }
    win(c, x - 75, gy - 170, 36, 78, x + 3); win(c, x + 75, gy - 170, 36, 78, x + 4);
    door(c, x, gy - 6, 62, 112, '#6a4aa8');
    c.fillStyle = '#d9cdf2'; A.rr(c, x - 150, gy - 8, 300, 12, 3); c.fill();
    flag(c, x - 18, gy - 232, 36, 60, '#7a4fd0', t * .4); emoji(c, '📚', x, gy - 204, 22);
    A.lantern(c, x - 40, gy - 128, t, '#c9a0ff'); A.lantern(c, x + 40, gy - 128, t, '#c9a0ff');
  };
  B.guild = function (c, x, gy, t) {
    wall(c, x - 124, gy - 226, 248, 226, '#b8494f', 4);
    c.fillStyle = '#8f3040'; for (let i = 0; i < 6; i++) A.rr(c, x - 124 + i * 44.8, gy - 246, 24, 24, 3), c.fill();
    c.fillStyle = '#ffd35c'; c.fillRect(x - 124, gy - 222, 248, 7); c.fillRect(x - 124, gy - 132, 248, 5);
    win(c, x - 76, gy - 206, 34, 56, x + 6); win(c, x + 76, gy - 206, 34, 56, x + 7);
    door(c, x, gy, 70, 112, '#5a2f3c');
    c.fillStyle = '#5a3a4a'; c.fillRect(x - 108, gy - 128, 4, 100); c.fillRect(x + 104, gy - 128, 4, 100);
    flag(c, x - 104, gy - 126, 34, 62, '#ffc94a', t * .5); flag(c, x + 70, gy - 126, 34, 62, '#ffc94a', t * .5 + 1);
    emoji(c, '⚜️', x - 87, gy - 96, 18); emoji(c, '⚜️', x + 87, gy - 96, 18);
    sign(c, x, gy - 160, '👑', '#d99a2c');
    A.lantern(c, x - 46, gy - 120, t); A.lantern(c, x + 46, gy - 120, t);
  };
  B.bazaar = function (c, x, gy, t) {
    const tents = [[-150, '#e0457b', '#ff8fb0'], [150, '#2fb3a4', '#8ce6d5'], [0, '#f2b033', '#ffe08a']];
    for (const [dx, c1, c2] of tents) {
      const tx = x + dx, top = dx ? gy - 210 : gy - 260, w = dx ? 120 : 150;
      c.fillStyle = '#6a4a6a'; c.fillRect(tx - w + 8, gy - 110, 6, 110); c.fillRect(tx + w - 14, gy - 110, 6, 110);
      for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? c1 : c2; c.beginPath(); c.moveTo(tx, top); c.lineTo(tx - w + i * w / 3, gy - 108 + Math.sin(t * 2 + i) * 2); c.lineTo(tx - w + (i + 1) * w / 3, gy - 108 + Math.sin(t * 2 + i + 1) * 2); c.fill(); }
      c.fillStyle = c1; ell(c, tx, top - 4, 7, 7); c.fill();
      c.fillStyle = 'rgba(40,16,70,.3)'; c.fillRect(tx - w + 10, gy - 108, w * 2 - 20, 60);
      c.fillStyle = '#a8683a'; A.rr(c, tx - w + 18, gy - 54, w * 2 - 36, 54, 5); c.fill();
      c.fillStyle = '#c98a55'; A.rr(c, tx - w + 14, gy - 60, w * 2 - 28, 12, 4); c.fill();
    }
    const gs = ['🏺', '🌶️', '🧺', '🍊', '🪔', '🧵', '🍉', '🫖', '💎'];
    for (let i = 0; i < 9; i++) emoji(c, gs[i], x - 232 + i * 58, gy - 72 + Math.sin(i * 2) * 3, 24);
    A.bunting(c, x - 270, gy - 150, x, gy - 250, t); A.bunting(c, x, gy - 250, x + 270, gy - 150, t);
    A.lantern(c, x - 75, gy - 172, t, '#ff5d6c'); A.lantern(c, x + 75, gy - 172, t, '#3fc6b0');
    sign(c, x, gy - 150, '🛍️', '#7a4fd0');
  };
  const AWN = [['#ef5350', '#fff3d8'], ['#2fb3a4', '#fff3d8'], ['#7a4fd0', '#ffd35c'], ['#c2185b', '#ffd35c']];
  B.stall = function (c, x, gy, t) {
    const st = G.st, lv = st ? st.stall.awning : 0;
    c.fillStyle = '#6a4a3a'; c.fillRect(x - 84, gy - 164, 7, 164); c.fillRect(x + 77, gy - 164, 7, 164);
    c.fillStyle = 'rgba(40,16,70,.25)'; c.fillRect(x - 80, gy - 130, 160, 64);
    c.fillStyle = vgrad(c, gy - 70, gy, '#c98a55', '#96582f'); A.rr(c, x - 92, gy - 68, 184, 62, 6); c.fill();
    c.fillStyle = '#dfa56c'; A.rr(c, x - 98, gy - 76, 196, 14, 5); c.fill();
    c.strokeStyle = 'rgba(80,40,30,.35)'; c.lineWidth = 2; c.beginPath(); for (let i = 1; i < 5; i++) { c.moveTo(x - 92 + i * 37, gy - 60); c.lineTo(x - 92 + i * 37, gy - 8); } c.stroke();
    for (const wx of [-62, 62]) { c.fillStyle = '#5a3a2a'; ell(c, x + wx, gy - 4, 20, 20); c.fill(); c.fillStyle = '#c98a55'; ell(c, x + wx, gy - 4, 13, 13); c.fill(); c.fillStyle = '#5a3a2a'; ell(c, x + wx, gy - 4, 4, 4); c.fill(); }
    if (st) { let k = 0; for (const id in st.stall.stock) { const n = st.stall.stock[id]; for (let j = 0; j < Math.min(n, 3) && k < 7; j++, k++) emoji(c, G.good(id).i, x - 78 + k * 26, gy - 90 + Math.sin(t * 2 + k) * 1, 22); } if (!k) { c.font = '700 13px Fredoka,sans-serif'; c.fillStyle = 'rgba(255,255,255,.8)'; c.textAlign = 'center'; c.fillText('EMPTY', x, gy - 88); } }
    awning(c, x - 106, gy - 190, 212, 36, AWN[lv][0], AWN[lv][1], t);
    A.lantern(c, x + 58, gy - 142, t, '#ffb347');
    if (st && st.stall.till > 0) { emoji(c, '💰', x - 52, gy - 132 + Math.sin(t * 4) * 3, 24); }
  };
  B.harbor = function (c, x, gy, t) {
    const vh = G.vh, sx = x + 190;
    c.fillStyle = vgrad(c, gy - 18, vh, '#3fb6d8', '#1f6fa8'); c.fillRect(sx, gy - 18, 900, vh - gy + 18);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3;
    for (let r = 0; r < 6; r++) { c.beginPath(); for (let i = 0; i < 12; i++) { const wx = sx + 20 + i * 80 + ((t * 18 + r * 37) % 80), wy = gy + r * 34 + Math.sin(t * 2 + i + r) * 3; c.moveTo(wx, wy); c.quadraticCurveTo(wx + 12, wy - 6, wx + 26, wy); } c.stroke(); }
    const bob = Math.sin(t * 1.4) * 5, hx = x + 420;
    c.save(); c.translate(hx, gy + 4 + bob); c.rotate(Math.sin(t * 1.1) * .025);
    c.fillStyle = '#6a4a3a'; c.fillRect(-4, -210, 8, 200);
    c.fillStyle = '#fff3d8'; c.beginPath(); c.moveTo(6, -200); c.quadraticCurveTo(110 + Math.sin(t * 2) * 8, -140, 6, -62); c.fill();
    c.fillStyle = '#ffd9a8'; c.beginPath(); c.moveTo(-6, -180); c.quadraticCurveTo(-70 + Math.sin(t * 2 + 1) * 6, -130, -6, -70); c.fill();
    flag(c, 4, -224, 30, 16, '#ef5350', t);
    c.fillStyle = vgrad(c, -50, 20, '#b06a3c', '#6f3f28'); c.beginPath(); c.moveTo(-130, -50); c.lineTo(140, -50); c.quadraticCurveTo(120, 14, 80, 18); c.lineTo(-90, 18); c.quadraticCurveTo(-120, 4, -130, -50); c.fill();
    c.fillStyle = '#ffd35c'; c.fillRect(-126, -44, 262, 6); c.restore();
    c.fillStyle = vgrad(c, gy - 30, gy + 60, '#a8683a', '#6a4028'); c.fillRect(sx - 10, gy - 6, 230, 16);
    for (let i = 0; i < 5; i++) { c.fillStyle = '#5a3a2a'; A.rr(c, sx + 2 + i * 52, gy - 22, 12, 80, 4); c.fill(); }
    wall(c, x - 150, gy - 178, 230, 178, '#5b88cc', 6);
    c.fillStyle = vgrad(c, gy - 218, gy - 170, '#a8683a', '#7a4a30'); c.beginPath(); c.moveTo(x - 164, gy - 172); c.lineTo(x - 120, gy - 218); c.lineTo(x + 50, gy - 218); c.lineTo(x + 94, gy - 172); c.fill();
    door(c, x - 80, gy, 76, 104, '#3a5a8a'); win(c, x + 30, gy - 130, 40, 50, x + 9);
    sign(c, x - 36, gy - 196, '⚓', '#3a5a8a');
    c.fillStyle = '#5a4a5a'; c.fillRect(x + 120, gy - 250, 9, 250); c.fillRect(x + 120, gy - 250, 110, 8);
    c.beginPath(); c.moveTo(x + 124, gy - 200); c.lineTo(x + 180, gy - 246); c.lineTo(x + 186, gy - 242); c.lineTo(x + 130, gy - 190); c.fill();
    const sw = Math.sin(t * 1.3) * 10; c.strokeStyle = '#4a3050'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 222, gy - 244); c.lineTo(x + 222 + sw, gy - 170); c.stroke();
    A.crate(c, x + 222 + sw, gy - 136, 36);
    A.crate(c, x + 106, gy, 40); A.crate(c, x + 148, gy, 34, '#c9925a'); A.crate(c, x + 124, gy - 38, 32, '#d8a468');
    A.lantern(c, x - 130, gy - 150, t);
  };

  B.lighthouse = function (c, x, gy, t) {
    wall(c, x + 40, gy - 112, 140, 112, '#d8e2ea', 6);
    c.fillStyle = '#b5484a'; c.beginPath(); c.moveTo(x + 28, gy - 108); c.lineTo(x + 110, gy - 160); c.lineTo(x + 192, gy - 108); c.fill();
    door(c, x + 132, gy, 40, 72, '#4a6a8a'); win(c, x + 78, gy - 86, 30, 38, 1);
    const hw = y => 54 - 22 * (gy - y) / 340;
    c.fillStyle = vgrad(c, gy - 340, gy, '#ffffff', '#c4d2e0'); c.beginPath(); c.moveTo(x - 54, gy); c.lineTo(x - 32, gy - 340); c.lineTo(x + 32, gy - 340); c.lineTo(x + 54, gy); c.fill();
    c.fillStyle = '#d9534f'; for (let i = 0; i < 3; i++) { const y0 = gy - 70 - i * 96, y1 = y0 - 44; c.beginPath(); c.moveTo(x - hw(y0), y0); c.lineTo(x - hw(y1), y1); c.lineTo(x + hw(y1), y1); c.lineTo(x + hw(y0), y0); c.fill(); }
    c.fillStyle = 'rgba(42,16,80,.12)'; c.beginPath(); c.moveTo(x + 20, gy); c.lineTo(x + 14, gy - 340); c.lineTo(x + 32, gy - 340); c.lineTo(x + 54, gy); c.fill();
    door(c, x, gy, 34, 62, '#4a6a8a');
    c.fillStyle = '#3a4a5a'; A.rr(c, x - 46, gy - 350, 92, 12, 3); c.fill();
    c.fillStyle = '#ffe9a8'; A.rr(c, x - 24, gy - 392, 48, 44, 5); c.fill();
    c.strokeStyle = '#3a4a5a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 8, gy - 392); c.lineTo(x - 8, gy - 350); c.moveTo(x + 8, gy - 392); c.lineTo(x + 8, gy - 350); c.stroke();
    c.fillStyle = '#d9534f'; c.beginPath(); c.arc(x, gy - 392, 30, PI, 0); c.fill(); c.fillRect(x - 2, gy - 436, 4, 16);
    const a = Math.sin(t * .6); c.fillStyle = `rgba(255,236,170,${.1 + A.dark * .22})`; c.beginPath(); c.moveTo(x, gy - 370); c.lineTo(x + a * 620, gy - 470); c.lineTo(x + a * 620, gy - 300); c.fill();
    G.wins.push([x - 24, gy - 392, 48, 44]); G.lights.push([x, gy - 370, 220, '255,230,150']);
  };
  B.forge = function (c, x, gy, t) {
    c.fillStyle = '#4a3a40'; c.fillRect(x + 50, gy - 290, 44, 110); c.fillStyle = '#3a2a30'; c.fillRect(x + 44, gy - 298, 56, 12); smoke(c, x + 72, gy - 300, t);
    for (let j = 0; j < 6; j++) { const p = (t * .5 + j / 6) % 1; c.fillStyle = `rgba(255,${150 + j * 12},60,${1 - p})`; ell(c, x + 72 + Math.sin(p * 9 + j) * 14, gy - 300 - p * 110, 3, 3); c.fill(); }
    wall(c, x - 130, gy - 200, 260, 200, '#7a6a6a', 6);
    c.fillStyle = '#5a4a50'; for (let i = 0; i < 7; i++) { A.rr(c, x - 130 + i * 38.4, gy - 218, 22, 22, 3); c.fill(); }
    c.fillStyle = '#2a1a20'; arch(c, x - 62, gy - 128, 124, 128); c.fill();
    const fl = .75 + Math.sin(t * 9) * .12 + Math.sin(t * 23) * .08; glow(c, x, gy - 40, 100, '255,140,40', fl);
    c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(x - 30, gy); c.quadraticCurveTo(x - 20, gy - 50 * fl, x, gy - 78 * fl); c.quadraticCurveTo(x + 20, gy - 50 * fl, x + 30, gy); c.fill();
    c.fillStyle = '#ffe08a'; c.beginPath(); c.moveTo(x - 14, gy); c.quadraticCurveTo(x, gy - 50 * fl, x + 14, gy); c.fill();
    G.lights.push([x, gy - 50, 240, '255,140,50']);
    c.fillStyle = '#3a3a44'; A.rr(c, x + 150, gy - 34, 52, 14, 4); c.fill(); c.fillRect(x + 166, gy - 22, 20, 22); A.rr(c, x + 156, gy - 6, 40, 8, 2); c.fill();
    sign(c, x - 96, gy - 160, '⚒️', '#5a4a50'); A.lantern(c, x + 100, gy - 150, t, '#ff7a3c');
  };
  B.mine = function (c, x, gy, t) {
    c.fillStyle = vgrad(c, gy - 300, gy, '#6a5a6a', '#3a2c3c'); c.beginPath(); c.moveTo(x - 220, gy); c.lineTo(x - 150, gy - 170); c.lineTo(x - 60, gy - 230); c.lineTo(x + 10, gy - 300); c.lineTo(x + 90, gy - 220); c.lineTo(x + 170, gy - 150); c.lineTo(x + 230, gy); c.fill();
    c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(x - 60, gy - 230); c.lineTo(x + 10, gy - 300); c.lineTo(x - 10, gy - 190); c.fill();
    c.fillStyle = '#1a1018'; arch(c, x - 50, gy - 110, 100, 110); c.fill();
    c.fillStyle = '#a8683a'; c.fillRect(x - 60, gy - 112, 12, 112); c.fillRect(x + 48, gy - 112, 12, 112); A.rr(c, x - 68, gy - 124, 136, 16, 3); c.fill();
    c.fillStyle = '#5a4a5a'; c.fillRect(x - 20, gy - 4, 190, 4);
    c.fillStyle = '#6a4a3a'; A.rr(c, x + 96, gy - 40, 60, 30, 4); c.fill(); c.fillStyle = '#2a2030'; ell(c, x + 108, gy - 6, 8, 8); c.fill(); ell(c, x + 144, gy - 6, 8, 8); c.fill();
    emoji(c, '💎', x + 114, gy - 46, 16); emoji(c, '🪨', x + 136, gy - 46, 16);
    for (let i = 0; i < 4; i++) { const tw = .5 + .5 * Math.sin(t * 3 + i * 2); c.fillStyle = `rgba(160,230,255,${tw})`; ell(c, x - 120 + i * 78, gy - 90 - hash(i) * 90, 3, 3); c.fill(); }
    A.lantern(c, x - 40, gy - 108, t, '#ffb347'); sign(c, x, gy - 150, '⛏️', '#5a4a5a');
  };
  B.gate = function (c, x, gy, t) {
    for (const dx of [-110, 110]) { wall(c, x + dx - 44, gy - 250, 88, 250, '#8a7070', 4); c.fillStyle = '#5a4a50'; for (let i = 0; i < 3; i++) { A.rr(c, x + dx - 44 + i * 33, gy - 268, 22, 22, 3); c.fill(); } win(c, x + dx, gy - 200, 24, 44, 1); }
    c.fillStyle = '#7a6468'; c.fillRect(x - 70, gy - 210, 140, 60); c.fillStyle = '#1a1018'; arch(c, x - 66, gy - 150, 132, 150); c.fill();
    c.fillStyle = 'rgba(255,170,90,.18)'; arch(c, x - 66, gy - 150, 132, 150); c.fill();
    flag(c, x - 20, gy - 206, 40, 48, '#d9534f', t * .5); emoji(c, '🔥', x, gy - 184, 18);
    emoji(c, '🐪', x + 190, gy - 30, 46); emoji(c, '🐪', x + 244, gy - 26, 38);
    A.lantern(c, x - 110, gy - 120, t, '#ff7a3c'); A.lantern(c, x + 110, gy - 120, t, '#ff7a3c');
  };
  A.pine = function (c, x, gy, t, s, sd) {
    s = s || 1; const sw = Math.sin(t * .8 + (sd || 0)) * 3 * s;
    c.fillStyle = '#6a4a3a'; c.fillRect(x - 6 * s, gy - 40 * s, 12 * s, 40 * s);
    for (let i = 0; i < 3; i++) {
      const y = gy - 30 * s - i * 54 * s, w = (70 - i * 16) * s, ox = sw * (i + 1) * .5;
      c.fillStyle = css(i % 2 ? '#2f7a6a' : '#3a8a72'); c.beginPath(); c.moveTo(x - w, y); c.lineTo(x + ox, y - 96 * s); c.lineTo(x + w, y); c.fill();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(x + ox, y - 96 * s); c.lineTo(x - w * .32 + ox * .6, y - 60 * s); c.lineTo(x + ox, y - 68 * s); c.lineTo(x + w * .32 + ox * .6, y - 60 * s); c.fill();
    }
  };
  A.weather = function (c, t, kind) {
    const vw = G.vw, vh = G.vh;
    if (kind === 'snow') for (let i = 0; i < 60; i++) { const sp = 30 + hash(i) * 40, y = ((hash(i + 50) * vh + t * sp) % vh), x = (hash(i + 90) * vw + Math.sin(t * .7 + i) * 30 + t * 8) % vw; c.fillStyle = `rgba(255,255,255,${.5 + hash(i + 9) * .5})`; ell(c, x, y, 1.5 + hash(i + 3) * 2.2, 1.5 + hash(i + 3) * 2.2); c.fill(); }
    else if (kind === 'ember') for (let i = 0; i < 34; i++) { const sp = 24 + hash(i) * 50, p = ((hash(i + 50) + t * sp / vh) % 1), x = (hash(i + 90) * vw + Math.sin(t + i) * 40) % vw; c.fillStyle = `rgba(255,${130 + hash(i) * 90 | 0},50,${(1 - p) * .9})`; ell(c, x, vh * (1 - p), 1.6 + hash(i + 3) * 1.8, 1.6 + hash(i + 3) * 1.8); c.fill(); }
  };

  /* ---------- CHARACTERS ---------- */
  function limb(c, x, y, ang, len, w, col, shoe) {
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = css(col); A.rr(c, -w / 2, 0, w, len, w / 2); c.fill();
    if (shoe) { c.fillStyle = css(shoe); ell(c, 3, len, w * .85, w * .5); c.fill(); } c.restore();
  }
  A.char = function (c, x, y, o) {
    const s = o.s || 1, w = o.walk || 0, t = o.t || 0, seed = o.seed || 0;
    const sw = Math.sin(o.ph || 0) * w, bob = Math.abs(Math.cos(o.ph || 0)) * 5 * w + Math.sin(t * 2.2 + seed) * 1.3 * (1 - w);
    const top = o.top || '#4a8fe0', bot = o.bot || '#3a3560', skin = o.skin || '#f0b98a';
    c.save(); c.translate(x, y); c.scale(s * (o.dir || 1), s);
    c.fillStyle = 'rgba(30,10,60,.22)'; ell(c, 0, 0, 27 - bob, 7); c.fill();
    c.translate(0, -bob); c.rotate(.07 * w);
    limb(c, -3, -66, -sw * .9 + .05, 30, 9, shade(top, -.25));
    if (o.robe) {
      c.fillStyle = css(shade(top, -.12)); c.beginPath(); c.moveTo(-15, -50); c.lineTo(15, -50); c.lineTo(20 + sw * 4, -3); c.lineTo(-20 + sw * 4, -3); c.fill();
      c.fillStyle = css(bot); ell(c, -8 + sw * 8, -2, 8, 4); c.fill(); ell(c, 8 - sw * 8, -2, 8, 4); c.fill();
    } else {
      limb(c, -7, -38, sw * .85, 34, 12, shade(bot, -.2), '#3a2540'); limb(c, 7, -38, -sw * .85, 34, 12, bot, '#4a3050');
    }
    if (o.bag) { c.fillStyle = '#a8683a'; A.rr(c, -30, -76, 18, 30, 7); c.fill(); c.fillStyle = '#c98a55'; A.rr(c, -30, -76, 18, 9, 4); c.fill(); }
    c.fillStyle = vgrad(c, -80, -34, shade(top, .12), shade(top, -.14)); A.rr(c, -18, -80, 36, 48, 16); c.fill();
    if (o.scarf) {
      const col = css(o.scarf); c.fillStyle = col; c.beginPath(); c.moveTo(-12, -78);
      for (let i = 1; i <= 5; i++) c.lineTo(-12 - i * 8, -78 + Math.sin(t * 7 + i * .9) * (2 + i * (1 + w * 1.6)) - w * i * 2);
      for (let i = 5; i >= 1; i--) c.lineTo(-12 - i * 8, -69 + Math.sin(t * 7 + i * .9 + .4) * (2 + i * (1 + w * 1.6)) - w * i * 2);
      c.lineTo(-12, -70); c.fill(); A.rr(c, -16, -83, 33, 10, 5); c.fill();
    }
    limb(c, 4, -68, sw * .9 - .05, 30, 10, top); c.fillStyle = css(skin); ell(c, 4 + Math.sin(sw * .9 - .05) * -30, -68 + Math.cos(sw * .9 - .05) * 30, 5.5, 5.5); c.fill();
    if (o.carry) emoji(c, o.carry, 20, -52, 20);
    c.fillStyle = css(shade(skin, -.12)); ell(c, -13, -98, 5, 6); c.fill();
    c.fillStyle = css(skin); ell(c, 2, -100, 21, 20); c.fill();
    c.fillStyle = css(o.hair || '#3a2540'); c.beginPath(); c.arc(1, -102, 21.5, PI * .98, PI * 1.92); c.quadraticCurveTo(6, -110, -8, -106); c.quadraticCurveTo(-16, -100, -20, -94); c.fill();
    if (o.hat === 'turban') { c.fillStyle = css(o.hatc || '#ffc94a'); ell(c, 1, -116, 22, 11); c.fill(); ell(c, 2, -123, 16, 9); c.fill(); c.fillStyle = '#ef5350'; ell(c, 14, -117, 3.5, 3.5); c.fill(); }
    else if (o.hat === 'straw') { c.fillStyle = '#e8c070'; ell(c, 2, -113, 31, 7); c.fill(); c.fillStyle = '#f2d490'; c.beginPath(); c.arc(2, -114, 16, PI, 0); c.fill(); c.fillStyle = css(o.hatc || '#ef5350'); c.fillRect(-14, -117, 32, 4); }
    else if (o.hat === 'cap') { c.fillStyle = css(o.hatc || '#ef5350'); c.beginPath(); c.arc(1, -108, 20, PI, 0); c.fill(); A.rr(c, 10, -111, 20, 6, 3); c.fill(); }
    else if (o.hat === 'hood') { c.fillStyle = css(shade(top, -.2)); c.beginPath(); c.arc(0, -101, 24, PI * .7, PI * 1.95); c.lineTo(-8, -84); c.fill(); }
    const blink = ((t + seed * 1.37) % 3.6) < .13;
    if (blink) { c.strokeStyle = '#3a2540'; c.lineWidth = 2; c.beginPath(); c.moveTo(3, -100); c.lineTo(10, -100); c.moveTo(13, -100); c.lineTo(19, -100); c.stroke(); }
    else { c.fillStyle = '#fff'; ell(c, 7, -101, 4.6, 6); c.fill(); ell(c, 16.5, -101, 3.8, 5.6); c.fill(); c.fillStyle = '#2a1840'; ell(c, 8.4, -100.5, 2.5, 3.2); c.fill(); ell(c, 17.5, -100.5, 2.1, 3); c.fill(); c.fillStyle = '#fff'; ell(c, 9.2, -102, 1, 1); c.fill(); }
    c.fillStyle = 'rgba(255,110,110,.35)'; ell(c, 5, -92, 4.5, 3); c.fill();
    c.strokeStyle = '#7a3a40'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.arc(13, -93, 4.5, .15 * PI, .8 * PI); c.stroke();
    c.restore();
  };
  const GL = { gloom: ['#43307a', 1], scurry: ['#256a78', .72], brute: ['#6a2a58', 1.5], boss: ['#8a1f3f', 2.3] };
  A.gloom = function (c, x, y, o) {
    const [col, sz] = GL[o.type] || GL.gloom, s = sz * (o.s || 1), t = o.t + (o.seed || 0);
    const hop = Math.abs(Math.sin(t * (o.type === 'scurry' ? 9 : 5.5))) * 7 * s, sq = 1 + Math.sin(t * 11) * .06;
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(0,0,20,.35)'; ell(c, 0, 0, 15 * s, 5 * s); c.fill();
    c.translate(0, -hop); c.scale(s * (o.dir || 1), s);
    const eye = o.type === 'boss' ? '255,200,60' : '120,245,255';
    glow(c, 0, -16, 34, eye, .16);
    c.fillStyle = css(shade(col, -.3)); c.beginPath(); c.moveTo(-10, -4); c.quadraticCurveTo(-26 + Math.sin(t * 6) * 4, -2, -30, -12 + Math.sin(t * 6) * 5); c.quadraticCurveTo(-20, -8, -10, -14); c.fill();
    c.fillStyle = css(col); c.beginPath(); c.moveTo(-9, -28); c.lineTo(-14, -42); c.lineTo(-2, -32); c.moveTo(9, -28); c.lineTo(14, -42); c.lineTo(2, -32); c.fill();
    const g = c.createLinearGradient(0, -36, 0, 0); g.addColorStop(0, css(shade(col, .2))); g.addColorStop(1, css(shade(col, -.3)));
    c.fillStyle = g; ell(c, 0, -17, 17 / sq, 18 * sq); c.fill();
    c.fillStyle = `rgb(${eye})`; ell(c, -6, -20, 4.2, 5.2); c.fill(); ell(c, 7, -20, 4.2, 5.2); c.fill();
    c.fillStyle = '#1a0a30'; ell(c, -5, -19.5, 1.8, 2.6); c.fill(); ell(c, 8, -19.5, 1.8, 2.6); c.fill();
    c.strokeStyle = '#1a0a30'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-6, -9); c.lineTo(-3, -11); c.lineTo(0, -9); c.lineTo(3, -11); c.lineTo(6, -9); c.stroke();
    if (o.type === 'boss') emoji(c, '👑', 0, -44, 16);
    if (o.flash > 0) { c.globalAlpha = Math.min(1, o.flash * 6); c.fillStyle = '#fff'; ell(c, 0, -17, 17, 18); c.fill(); c.globalAlpha = 1; }
    if (o.slow > 0) { c.strokeStyle = 'rgba(150,230,255,.8)'; c.lineWidth = 2; ell(c, 0, -2, 18, 5); c.stroke(); }
    c.restore();
  };

  /* ---------- PARTICLES ---------- */
  A.P = [];
  A.spawn = function (o) { const p = Object.assign({ vx: 0, vy: 0, g: 0, life: 1, size: 4, col: '#fff', type: 'dot' }, o); p.max = p.life; A.P.push(p); if (A.P.length > 400) A.P.shift(); };
  A.burst = function (x, y, n, col, spd, type) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (spd || 120) * (.4 + Math.random() * .8); A.spawn({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 260, life: .4 + Math.random() * .5, size: 3 + Math.random() * 4, col, type: type || 'dot' }); } };
  A.coins = function (x, y, n) { for (let i = 0; i < n; i++) A.spawn({ x, y, vx: U.rand(-90, 90), vy: U.rand(-320, -160), g: 700, life: .9, size: 7, type: 'coin', spin: Math.random() * 6 }); };
  A.text = function (x, y, str, col, size) { A.spawn({ x, y, vy: -46, life: 1.3, type: 'text', str, col: col || '#fff', size: size || 20 }); };
  A.updP = function (dt) { for (let i = A.P.length - 1; i >= 0; i--) { const p = A.P[i]; p.life -= dt; if (p.life <= 0) { A.P.splice(i, 1); continue; } p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; } };
  A.drawP = function (c, ox) {
    for (const p of A.P) {
      const a = clamp(p.life / p.max, 0, 1), x = p.x - ox, y = p.y;
      if (p.type === 'dot') { c.globalAlpha = a; c.fillStyle = p.col; ell(c, x, y, p.size * (.4 + a * .6), p.size * (.4 + a * .6)); c.fill(); }
      else if (p.type === 'spark') { c.globalAlpha = a; c.fillStyle = p.col; const s = p.size * a; c.beginPath(); c.moveTo(x, y - s * 1.6); c.lineTo(x + s * .5, y); c.lineTo(x, y + s * 1.6); c.lineTo(x - s * .5, y); c.fill(); c.beginPath(); c.moveTo(x - s * 1.6, y); c.lineTo(x, y + s * .5); c.lineTo(x + s * 1.6, y); c.lineTo(x, y - s * .5); c.fill(); }
      else if (p.type === 'coin') { c.globalAlpha = Math.min(1, a * 3); const w = Math.abs(Math.cos(p.spin + p.life * 12)) * p.size + 1; c.fillStyle = '#c98a1c'; ell(c, x, y + 1.5, w, p.size); c.fill(); c.fillStyle = '#ffd84a'; ell(c, x, y, w, p.size); c.fill(); c.fillStyle = '#fff3b0'; ell(c, x - w * .2, y - 2, w * .35, p.size * .4); c.fill(); }
      else if (p.type === 'ring') { c.globalAlpha = a; c.strokeStyle = p.col; c.lineWidth = 3 * a + 1; ell(c, x, y, p.size * (1 - a) + 4, (p.size * (1 - a) + 4) * (p.flat || 1)); c.stroke(); }
      else if (p.type === 'smoke') { c.globalAlpha = a * .5; c.fillStyle = p.col; ell(c, x, y, p.size * (1.6 - a), p.size * (1.6 - a)); c.fill(); }
      else if (p.type === 'text') { c.globalAlpha = Math.min(1, a * 2.5); c.font = `700 ${p.size}px Fredoka,system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.lineJoin = 'round'; c.strokeStyle = 'rgba(40,16,70,.85)'; c.strokeText(p.str, x, y); c.fillStyle = p.col; c.fillText(p.str, x, y); }
    }
    c.globalAlpha = 1;
  };

  /* ---------- NIGHT LIGHTING + FOREGROUND ---------- */
  A.lighting = function (c) {
    const vw = G.vw, vh = G.vh, gy = G.gy, d = A.dark, h = G.st ? G.st.time / 60 : 12;
    const gold = h > 16.5 && h < 20 ? 1 - Math.abs(h - 18.3) / 1.8 : h > 5.5 && h < 7.5 ? 1 - Math.abs(h - 6.4) / 1.1 : 0;
    if (gold > 0) { c.fillStyle = `rgba(255,140,70,${gold * .16})`; c.fillRect(0, 0, vw, vh); }
    if (d > .02) {
      c.globalCompositeOperation = 'multiply';
      const g = c.createLinearGradient(0, 0, 0, gy - 220); g.addColorStop(0, `rgba(70,80,170,${d * .2})`); g.addColorStop(1, `rgba(52,58,150,${d * .78})`);
      c.fillStyle = g; c.fillRect(0, 0, vw, vh);
      c.globalCompositeOperation = 'source-over';
      for (const w of G.wins) {
        c.fillStyle = `rgba(255,214,130,${d})`;
        if (w[4] === 2) { ell(c, w[0] + w[2] / 2, w[1] + w[3] / 2, w[2] / 2, w[3] / 2); c.fill(); }
        else if (w[4] === 1) { arch(c, w[0], w[1], w[2], w[3]); c.fill(); }
        else c.fillRect(w[0], w[1], w[2], w[3]);
      }
      c.globalCompositeOperation = 'lighter';
      for (const l of G.lights) glow(c, l[0], l[1], l[2] * 1.5, l[3], d * .42);
      c.globalCompositeOperation = 'source-over';
    }
  };
  A.fore = function (c, cam, t) {
    const vw = G.vw, vh = G.vh, off = cam * 1.45, step = 430, i0 = Math.floor(off / step) - 1, i1 = Math.floor((off + vw) / step) + 1;
    const col = css(mix('#3a1f52', '#120a2e', A.dark), .93);
    for (let i = i0; i <= i1; i++) {
      const x = i * step + hash(i) * 200 - off, k = hash(i * 3 + 1); c.fillStyle = col;
      if (k < .55) {
        for (let j = 0; j < 6; j++) {
          const a = -PI / 2 + (j - 2.5) * .34 + Math.sin(t * 1.1 + j + i) * .05, L = 120 + hash(j + i) * 70;
          const ex = x + Math.cos(a) * L, ey = vh + 10 + Math.sin(a) * L;
          c.beginPath(); c.moveTo(x - 8, vh + 10); c.quadraticCurveTo(x + Math.cos(a - .3) * L * .6, vh + Math.sin(a - .3) * L * .6, ex, ey); c.quadraticCurveTo(x + Math.cos(a + .3) * L * .6, vh + Math.sin(a + .3) * L * .6, x + 8, vh + 10); c.fill();
        }
      } else if (k < .8) { A.rr(c, x - 40, vh - 52, 64, 60, 4); c.fill(); A.rr(c, x + 14, vh - 34, 50, 40, 4); c.fill(); A.rr(c, x - 24, vh - 92, 44, 42, 4); c.fill(); }
      else { c.beginPath(); c.moveTo(x - 34, vh + 4); c.quadraticCurveTo(x - 44, vh - 50, x - 18, vh - 58); c.lineTo(x + 18, vh - 58); c.quadraticCurveTo(x + 44, vh - 50, x + 34, vh + 4); c.fill(); ell(c, x, vh - 60, 24, 7); c.fill(); }
    }
    const g = c.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, 'rgba(20,10,50,.28)'); g.addColorStop(1, 'rgba(20,10,50,0)'); c.fillStyle = g; c.fillRect(0, 0, vw, 120);
  };
})();
