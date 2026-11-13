'use strict';
/* Day scene: city streets, player, townsfolk, named characters, camera */
(function () {
  const W = G.W = {}; const A = G.A; const { clamp, hash } = U;
  const CITY = W.CITY = {
    lantern: {
      locs: [
        { id: 'home', n: 'Home', i: '🏠', x: 320, w: 270, h: 275, door: -42 }, { id: 'well', n: 'The Well', i: '⛲', x: 760, w: 230, h: 200 },
        { id: 'eatery', n: "Mama Zuri's", i: '🍲', x: 1200, w: 270, h: 262 }, { id: 'academy', n: 'Academy', i: '📚', x: 1680, w: 290, h: 392 },
        { id: 'guild', n: 'Guild Hall', i: '👑', x: 2140, w: 260, h: 262 }, { id: 'bazaar', n: 'Grand Bazaar', i: '🛍️', x: 2700, w: 540, h: 285 },
        { id: 'stall', n: 'Your Stall', i: '🏪', x: 3200, w: 230, h: 212 }, { id: 'harbor', n: 'Harbor', i: '⚓', x: 3680, w: 340, h: 268, door: -80 }
      ], width: 4500, maxx: 3850, start: 320, tint: null, gcol: ['#efc98f', '#b9805c'], wx: null,
      trees: [[560, .9], [1470, 1], [1930, .85], [2390, 1.1], [3020, .95], [3440, 1]], tree: 'palm', lamps: [1440, 1960, 2360, 3050, 3420],
      bunt: [[1340, 1540, 200], [1830, 2010, 210], [2270, 2430, 190], [2975, 3090, 170], [3310, 3520, 175]]
    },
    salt: {
      locs: [
        { id: 's_inn', n: 'The Gull & Kettle', i: '🍲', x: 330, w: 270, h: 262, art: 'eatery' }, { id: 's_market', n: 'Saltmere Market', i: '🛍️', x: 900, w: 540, h: 285, art: 'bazaar' },
        { id: 's_bank', n: 'Counting House', i: '🏦', x: 1480, w: 260, h: 262, art: 'guild' }, { id: 's_light', n: 'The Lighthouse', i: '🗼', x: 1960, w: 250, h: 446, art: 'lighthouse' },
        { id: 's_dock', n: 'Saltmere Docks', i: '⚓', x: 2480, w: 340, h: 268, art: 'harbor', door: -80 }
      ], width: 3300, maxx: 2650, start: 2400, tint: ['#cfe4f5', .5], gcol: ['#f6fafd', '#b4c6dc'], wx: 'snow',
      trees: [[620, 1], [1240, .9], [1730, 1.1], [2230, .95]], tree: 'pine', lamps: [680, 1290, 1690], bunt: [[1180, 1340, 190]]
    },
    ember: {
      locs: [
        { id: 'e_gate', n: 'Caravan Gate', i: '🐪', x: 380, w: 330, h: 284, art: 'gate' }, { id: 'e_inn', n: 'The Cinder Cup', i: '🍲', x: 960, w: 270, h: 262, art: 'eatery' },
        { id: 'e_market', n: 'Emberhold Market', i: '🛍️', x: 1520, w: 540, h: 285, art: 'bazaar' }, { id: 'e_forge', n: 'The Great Forge', i: '⚒️', x: 2110, w: 280, h: 316, art: 'forge' },
        { id: 'e_mine', n: 'Deepseam Mine', i: '⛏️', x: 2680, w: 330, h: 316, art: 'mine' }
      ], width: 3100, maxx: 2900, start: 380, tint: ['#8a4a3a', .42], gcol: ['#7a6068', '#3c2a3a'], wx: 'ember',
      trees: [], tree: 'palm', lamps: [700, 1200, 1840, 2380], bunt: [[1110, 1250, 190], [1800, 1960, 200]]
    }
  };
  let C = CITY.lantern; W.LOCS = C.locs; W.width = C.width;
  W.loc = id => W.LOCS.find(l => l.id === id);
  W.cam = 0; W.near = null;
  const p = W.p = { x: 320, tx: 320, dir: 1, ph: 0, walk: 0, dest: null };
  const SK = ['#f0b98a', '#d99a6c', '#b87a50', '#8a5a3c', '#f7cfa6'], TOPS = ['#e0457b', '#2fb3a4', '#7a4fd0', '#f2b033', '#4a8fe0', '#ef5350', '#6ab04c', '#fff3d8'], HATS = ['turban', 'straw', 'cap', 'hood', null, null];
  let npcs = [];
  function mkNpc(i, wd) {
    const r = U.seeded(i * 977 + 13 + wd);
    return { x: 300 + r() * (wd - 700), tx: 300 + r() * (wd - 700), dir: 1, ph: r() * 6, walk: 0, wait: r() * 4, y: 22 + r() * 22 + (r() < .4 ? 62 : 0), spd: 70 + r() * 70, seed: i * 3.1,
      look: { skin: SK[r() * 5 | 0], top: TOPS[r() * 8 | 0], bot: ['#3a3560', '#5a3a4a', '#2a4a5a'][r() * 3 | 0], hair: ['#3a2540', '#6a3a2a', '#1a1830', '#c9c0d8'][r() * 4 | 0], hat: HATS[r() * 6 | 0], hatc: TOPS[r() * 8 | 0], robe: r() < .45, s: .86 + r() * .16, carry: r() < .3 ? ['🧺', '🍞', '🏺', '🐟', '📦'][r() * 5 | 0] : null } };
  }
  W.setCity = function (id, arrive) {
    const st = G.st; st.city = id; st.visited[id] = 1; C = CITY[id]; W.LOCS = C.locs; W.width = C.width;
    npcs = []; for (let i = 0; i < (id === 'lantern' ? 14 : 10); i++) npcs.push(mkNpc(i, C.maxx));
    if (arrive) st.px = C.start;
    p.x = p.tx = clamp(st.px || C.start, 90, C.maxx); p.dest = null; W.cam = clamp(p.x - G.vw / 2, 0, Math.max(0, W.width - G.vw)); A.P.length = 0;
    if (G.UI && G.UI.buildTravel) G.UI.buildTravel();
  };
  W.reset = function () { W.setCity(G.st.city || 'lantern'); };
  W.goTo = function (id) {
    const l = W.loc(id); if (!l) return; p.tx = l.x + (l.door || 0); p.dest = id;
    if (Math.abs(p.tx - p.x) < 6) { p.dest = null; G.UI.openLoc(id); }
  };
  W.tap = function (vx, vy) {
    const wx = vx + W.cam, gy = G.gy;
    for (const l of W.LOCS) if (Math.abs(wx - l.x) < l.w / 2 && vy < gy + 16 && vy > gy - l.h) { G.Au.sfx('tap'); W.goTo(l.id); return; }
    p.tx = clamp(wx, 90, C.maxx); p.dest = null;
    A.spawn({ x: p.tx, y: gy + 62, type: 'ring', size: 26, flat: .35, life: .45, col: '#fff' });
  };
  W.onStallSale = function (id, price) {
    if (G.st.city !== 'lantern' || G.mode !== 'day') return;
    const l = W.loc('stall'), gy = G.gy;
    A.coins(l.x, gy - 70, 4); A.text(l.x, gy - 120, '+' + price + '🪙', '#ffe066', 20);
    if (Math.abs(l.x - W.cam - G.vw / 2) < G.vw / 2 + 100) G.Au.sfx('coin');
    let best = null; for (const n of npcs) if (!best || Math.abs(n.x - l.x) < Math.abs(best.x - l.x)) best = n;
    if (best) { best.tx = l.x + U.rand(-60, 60); best.wait = 0; }
  };
  let dustT = 0;
  W.update = function (dt) {
    const st = G.st, busy = !!G.busy;
    const spd = 340 * (st.perks.boots ? 1.35 : 1) * (G.S.eff() < 1 ? .8 : 1);
    const dx = p.tx - p.x;
    if (!busy && Math.abs(dx) > 5) {
      p.dir = dx > 0 ? 1 : -1; p.x += p.dir * Math.min(Math.abs(dx), spd * dt); p.walk = Math.min(1, p.walk + dt * 8); p.ph += dt * 12;
      dustT -= dt; if (dustT <= 0) { dustT = .14; A.spawn({ x: p.x - p.dir * 14, y: G.gy + 60, vx: -p.dir * 30, vy: -20, life: .5, size: 7, type: 'smoke', col: '#f5deb8' }); }
    } else {
      p.walk = Math.max(0, p.walk - dt * 8);
      if (p.dest && !busy) { const d = p.dest; p.dest = null; G.UI.openLoc(d); }
    }
    st.px = p.x;
    const tc = clamp(p.x - G.vw / 2, 0, Math.max(0, W.width - G.vw)); W.cam += (tc - W.cam) * Math.min(1, dt * 5);
    W.near = null; for (const l of W.LOCS) if (Math.abs(p.x - l.x) < l.w / 2 - 10) W.near = l;
    const night = A.dark > .8;
    for (const n of npcs) {
      const d = n.tx - n.x;
      if (Math.abs(d) > 4) { n.dir = d > 0 ? 1 : -1; n.x += n.dir * Math.min(Math.abs(d), n.spd * dt); n.walk = Math.min(1, n.walk + dt * 6); n.ph += dt * (6 + n.spd * .045); }
      else { n.walk = Math.max(0, n.walk - dt * 6); n.wait -= dt; if (n.wait <= 0) { n.wait = 1 + Math.random() * 5; n.tx = night ? n.x : clamp(n.x + U.rand(-700, 700), 150, C.maxx - 80); } }
    }
    A.updP(dt);
  };
  const PLOOK = { top: '#f59a2e', bot: '#3d3a7a', scarf: '#ef4056', hair: '#3a2540', skin: '#f0b98a', bag: true, s: 1.06 };
  function bird(c, x, y, t, s) { const f = Math.sin(t * 9) * 7 * s; c.beginPath(); c.moveTo(x - 11 * s, y - f); c.quadraticCurveTo(x - 5 * s, y - 4 * s, x, y); c.quadraticCurveTo(x + 5 * s, y - 4 * s, x + 11 * s, y - f); c.stroke(); }
  function label(c, x, y, txt, hot, t) {
    c.font = '600 15px Fredoka,system-ui,sans-serif'; const w = c.measureText(txt).width + 22;
    c.fillStyle = hot ? 'rgba(255,201,74,.96)' : 'rgba(40,22,70,.62)'; A.rr(c, x - w / 2, y - 13, w, 26, 13); c.fill();
    c.fillStyle = hot ? '#3a1f52' : '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y + 1);
    if (hot) { const b = Math.sin(t * 5) * 4; c.fillStyle = '#ffc94a'; c.beginPath(); c.moveTo(x - 8, y + 16 + b); c.lineTo(x + 8, y + 16 + b); c.lineTo(x, y + 27 + b); c.fill(); }
  }
  W.draw = function (c, t) {
    const st = G.st, hour = st.time / 60, gy = G.gy, cam = W.cam, vw = G.vw, by = gy + 12;
    G.lights.length = 0; G.wins.length = 0; A.tint = C.tint; A.gcol = C.gcol;
    A.sky(c, hour, t);
    if (A.dark < .7) { c.strokeStyle = `rgba(50,30,80,${.6 * (1 - A.dark)})`; c.lineWidth = 2.5; c.lineCap = 'round'; for (let i = 0; i < 5; i++) { const Wd = vw + 300, x = ((hash(i + 60) * Wd + t * (30 + i * 9)) % Wd) - 150; bird(c, x, gy * (.16 + hash(i + 70) * .3) + Math.sin(t + i) * 10, t + i * 1.3, .7 + hash(i) * .5); } }
    A.far(c, cam); A.ground(c, cam);
    for (const [px, s] of C.trees) { const sx = px - cam; if (sx > -200 && sx < vw + 200) A[C.tree](c, sx, by, t, s, px); }
    for (const l of W.LOCS) { const sx = l.x - cam, art = l.art || l.id; if (sx > (art === 'harbor' ? -1300 : -480) && sx < vw + 480) A.B[art](c, sx, by, t); }
    for (const px of C.lamps) { const sx = px - cam; if (sx > -80 && sx < vw + 80) A.lampPost(c, sx, by, t); }
    for (const [a, b, h] of C.bunt) { if (b - cam > -50 && a - cam < vw + 50) A.bunting(c, a - cam, gy - h, b - cam, gy - h + 10, t); }
    A.tint = null;
    const ents = npcs.filter(n => n.x - cam > -80 && n.x - cam < vw + 80).map(n => ({ y: gy + n.y, n }));
    for (const id in G.NPCS) { const N = G.NPCS[id]; if (N.city !== st.city) continue; const l = W.loc(N.loc); if (!l) continue; const x = l.x + N.off; if (x - cam > -80 && x - cam < vw + 80) ents.push({ y: gy + 36, who: id, x }); }
    ents.push({ y: gy + 62, pl: true }); ents.sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (e.pl) {
        A.char(c, p.x - cam, e.y, Object.assign({ dir: p.dir, ph: p.ph, walk: p.walk, t }, PLOOK));
        if (G.busy && G.busy.icon) { const b = Math.sin(t * 6) * 4; c.fillStyle = 'rgba(255,255,255,.95)'; A.ell(c, p.x - cam, e.y - 168 + b, 26, 24); c.fill(); A.emoji(c, G.busy.icon, p.x - cam, e.y - 167 + b, 28); }
      } else if (e.who) {
        const N = G.NPCS[e.who], sx = e.x - cam; A.char(c, sx, e.y, Object.assign({ dir: p.x > e.x ? 1 : -1, t, seed: e.x, s: 1 }, N.look));
        if (G.D && G.D.hasStory(e.who)) { const b = Math.sin(t * 5 + e.x) * 4; c.fillStyle = '#ffc94a'; A.ell(c, sx, e.y - 150 + b, 15, 15); c.fill(); c.fillStyle = '#3a1f52'; c.font = '700 20px Fredoka,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', sx, e.y - 149 + b); }
      } else { const n = e.n; A.char(c, n.x - cam, e.y, Object.assign({ dir: n.dir, ph: n.ph, walk: n.walk, t, seed: n.seed }, n.look)); }
    }
    A.drawP(c, cam);
    if (C.wx) A.weather(c, t, C.wx);
    A.lighting(c);
    if (A.dark > .4) { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const x = ((hash(i + 200) * 1400 + Math.sin(t * .4 + i) * 60 - cam * 1.1) % (vw + 100) + vw + 100) % (vw + 100) - 50, y = gy - 20 - hash(i + 300) * 190 + Math.sin(t * .9 + i * 2) * 22; A.glow(c, x, y, 13, '210,255,140', (A.dark - .4) * (.5 + .5 * Math.sin(t * 3 + i * 1.9))); } c.globalCompositeOperation = 'source-over'; }
    A.fore(c, cam, t);
    for (const l of W.LOCS) { const sx = l.x - cam; if (sx > -150 && sx < vw + 150) label(c, sx, gy - l.h - 18, l.i + ' ' + l.n, W.near === l, t); }
  };
})();
