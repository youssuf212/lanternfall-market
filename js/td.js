'use strict';
/* Night raid: tower defense on the alley leading to your stall */
(function () {
  const TD = G.TD = {}; const A = G.A; const { clamp, hash } = U; const PI = Math.PI;
  TD.TYPES = {
    sling: { n: 'Slinger', i: '🎯', cost: 40, dmg: 9, rate: .55, range: .25, need: 0, d: 'Fast single shots' },
    mortar: { n: 'Spice Mortar', i: '🌶️', cost: 70, dmg: 15, rate: 1.7, range: .3, splash: .11, need: 1, d: 'Explosive splash damage' },
    frost: { n: 'Frost Fountain', i: '❄️', cost: 60, dmg: 3, rate: 1.1, range: .21, need: 2, d: 'Chills & slows all nearby' },
    beacon: { n: 'Sun Beacon', i: '🏮', cost: 130, dmg: 26, rate: 0, range: .27, need: 4, d: 'Burning beam, huge damage' }
  };
  const EN = { gloom: { hp: 20, spd: 50, b: 3 }, scurry: { hp: 12, spd: 88, b: 3 }, brute: { hp: 75, spd: 33, b: 8 }, boss: { hp: 420, spd: 24, b: 60 } };
  const PATH = [[.15, -.08], [.15, .16], [.84, .16], [.84, .4], [.16, .4], [.16, .64], [.72, .64], [.72, .84]];
  const PADS = [[.45, .04], [.7, .04], [.3, .28], [.5, .28], [.7, .28], [.3, .52], [.5, .52], [.7, .52], [.3, .77], [.5, .77]];
  const LAMPS = [[.04, .08], [.96, .28], [.04, .52], [.93, .7], [.04, .8]];
  const DM = [1, 1.75, 2.8], RM = [1, 1.07, 1.15], CM = [1, 1.3, 2.2];
  let T = null, L = null;
  TD.disc = () => Math.max(.7, 1 - .03 * G.S.skill('craft'));
  TD.cost = (type, lvl) => Math.round(TD.TYPES[type].cost * CM[lvl - 1] * TD.disc());
  TD.wavesFor = n => Math.min(8, 3 + Math.floor(n / 3));
  TD.layout = function () {
    const fx = 26, fw = G.vw - 52, fy = G.hudTop + 16, fh = G.vh - fy - G.hudBot - 30;
    const P = (n) => [fx + n[0] * fw, fy + n[1] * fh];
    const pts = PATH.map(P), seg = []; let len = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); len += d; }
    L = { fx, fy, fw, fh, R: Math.min(fw, fh), pts, seg, len, pads: PADS.map(P), lamps: LAMPS.map(P), end: pts[pts.length - 1] };
  };
  function posAt(d) {
    for (let i = 0; i < L.seg.length; i++) { if (d <= L.seg[i] || i === L.seg.length - 1) { const k = clamp(d / L.seg[i], 0, 1), a = L.pts[i], b = L.pts[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, b[0] - a[0]]; } d -= L.seg[i]; }
  }
  TD.start = function () {
    const st = G.st; TD.layout(); A.P.length = 0;
    T = TD.T = { night: st.day, wave: 0, waves: TD.wavesFor(st.day), lives: 10, en: [], shots: [], q: [], wt: 0, phase: 'build', speed: 1, sel: -1, kills: 0, leaked: 0, stolen: 0, earned: 0, shake: 0, auto: 0, t: 0 };
    T.tw = st.towers.map(w => ({ pad: w.pad, type: w.type, lvl: w.lvl, cd: 0, ang: -PI / 2, kick: 0, tgt: null }));
    G.UI.tdHud(true);
  };
  function persist() { G.st.towers = T.tw.map(w => ({ pad: w.pad, type: w.type, lvl: w.lvl })); G.save(); }
  TD.towerAt = pad => T.tw.find(w => w.pad === pad);
  TD.build = function (pad, type) {
    const c = TD.cost(type, 1), st = G.st; if (st.coins < c || TD.towerAt(pad)) return false;
    st.coins -= c; T.tw.push({ pad, type, lvl: 1, cd: 0, ang: -PI / 2, kick: 0, tgt: null }); persist();
    const [x, y] = L.pads[pad]; A.burst(x, y, 14, '#ffe066', 160, 'spark'); A.spawn({ x, y, type: 'ring', size: 60, life: .5, col: '#ffe066' }); G.Au.sfx('buy'); return true;
  };
  TD.upgrade = function (pad) {
    const w = TD.towerAt(pad), st = G.st; if (!w || w.lvl >= 3) return false; const c = TD.cost(w.type, w.lvl + 1); if (st.coins < c) return false;
    st.coins -= c; w.lvl++; persist(); const [x, y] = L.pads[pad]; A.burst(x, y, 18, '#9ff', 180, 'spark'); G.Au.sfx('good'); return true;
  };
  TD.sell = function (pad) {
    const w = TD.towerAt(pad); if (!w) return; let v = 0; for (let l = 1; l <= w.lvl; l++) v += TD.cost(w.type, l);
    v = Math.round(v * .6); G.st.coins += v; T.tw.splice(T.tw.indexOf(w), 1); persist(); const [x, y] = L.pads[pad]; A.coins(x, y, 5); G.Au.sfx('coin');
  };
  TD.sellValue = pad => { const w = TD.towerAt(pad); let v = 0; for (let l = 1; l <= w.lvl; l++) v += TD.cost(w.type, l); return Math.round(v * .6); };
  TD.startWave = function () {
    if (!T || T.phase !== 'build') return; T.wave++; T.phase = 'wave'; T.wt = 0; T.q = [];
    const n = T.night, w = T.wave, cnt = Math.min(40, 4 + n + w + Math.max(0, n - 6)), gap = Math.max(.45, 1.4 - .06 * n), hpM = (1 + .2 * (n - 1)) * (1 + .1 * (w - 1)) * G.S.raidMult();
    for (let i = 0; i < cnt; i++) { const r = Math.random(); T.q.push({ at: i * gap, type: n >= 3 && r < .1 + .01 * n ? 'brute' : n >= 2 && r < .38 ? 'scurry' : 'gloom', hpM }); }
    if (n % 5 === 0 && w === T.waves) T.q.push({ at: cnt * gap + 1.5, type: 'boss', hpM: n / 5 });
    G.UI.toast(`🌙 Wave ${w}/${T.waves}` + (n % 5 === 0 && w === T.waves ? ' — the Gloom King comes!' : ''), 'night'); G.Au.sfx('pop'); G.UI.tdHud(true);
  };
  TD.toggleSpeed = function () { T.speed = T.speed === 1 ? 2 : 1; G.UI.tdHud(true); };
  TD.tap = function (x, y) {
    if (!T || T.phase === 'done') return;
    let best = -1, bd = 52; L.pads.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = i; } });
    T.sel = best; if (best >= 0) { G.Au.sfx('tap'); G.UI.towerSheet(best); } else G.UI.closeSheet();
  };
  function range(w) { return TD.TYPES[w.type].range * RM[w.lvl - 1] * L.R * (G.st.perks.lens ? 1.15 : 1); }
  TD.rangeOf = range;
  function dmgOf(w) { return TD.TYPES[w.type].dmg * DM[w.lvl - 1] * (1 + .06 * G.S.skill('craft')) * (G.st.flags.horn ? 1.12 : 1); }
  function hurt(e, amt) {
    if (e.dead) return; e.hp -= amt; e.flash = .12;
    if (e.hp <= 0) {
      e.dead = true; const st = G.st, b = Math.round((EN[e.type].b + Math.floor(T.night / 4)) * (st.perks.lucky ? 1.3 : 1));
      st.coins += b; T.earned += b; T.kills++; st.stats.kills++; G.S.count('kills', 1);
      A.burst(e.x, e.y - 14, e.type === 'boss' ? 40 : 10, '#8a6fe0', 150); A.spawn({ x: e.x, y: e.y - 14, type: 'ring', size: 34, life: .35, col: '#c9b0ff' });
      A.text(e.x, e.y - 34, '+' + b, '#ffe066', 17); A.coins(e.x, e.y - 14, e.type === 'boss' ? 14 : 2); G.Au.sfx(e.type === 'boss' ? 'boom' : 'pop');
      if (e.type === 'boss') T.shake = .5;
    }
  }
  function finish(win) {
    const st = G.st, n = T.night; T.phase = 'done'; const r = { win, kills: T.kills, stolen: T.stolen, earned: T.earned, perfect: win && T.leaked === 0, lines: [] };
    if (win) {
      const c = 20 + 8 * n; st.coins += c; st.nightsWon++; G.S.renown(15 + 4 * n); r.lines.push(`Guild reward: +${c}🪙`);
      if (r.perfect) {
        st.streak++; st.bestStreak = Math.max(st.bestStreak, st.streak); G.S.count('perfect', 1);
        const sb = Math.min(60, st.streak * 6); st.coins += sb; r.lines.push(`🔥 Flawless streak ×${st.streak}: +${sb}🪙`);
        const k = Math.random();
        if (k < .2) { st.shards++; r.lines.push('🎁 Mystery crate: a Moon Shard! +1🌙'); }
        else if (k < .6 || G.S.bagUsed() >= G.S.bagCap()) { const m = 25 + U.ri(0, 10 * n); st.coins += m; r.lines.push(`🎁 Mystery crate: +${m}🪙`); }
        else { const g = U.pick(G.GOODS.slice(0, 7)), q = Math.min(U.ri(2, 4), G.S.bagCap() - G.S.bagUsed()); st.inv[g.id] = (st.inv[g.id] || 0) + q; st.cost[g.id] = st.cost[g.id] || 0; r.lines.push(`🎁 Mystery crate: ${q}× ${g.i} ${g.n}`); }
      } else st.streak = 0;
    } else {
      const loss = Math.floor(st.coins * .25); st.coins -= loss; st.streak = 0; r.lines.push(`The gloomlings ransacked your stall: −${loss}🪙`);
      for (const id in st.stall.stock) { const half = Math.ceil(st.stall.stock[id] / 2); st.stall.stock[id] -= half; if (st.stall.costs && st.stall.costs[id]) st.stall.costs[id] /= 2; if (st.stall.stock[id] <= 0) delete st.stall.stock[id]; }
    }
    persist(); G.Au.sfx(win ? 'lvl' : 'bad'); setTimeout(() => G.UI.raidResult(r), 900);
  }
  TD.update = function (dt) {
    if (!T) return; A.updP(dt); T.t += dt; T.shake = Math.max(0, T.shake - dt);
    if (T.phase === 'done') return;
    dt *= T.speed;
    if (T.phase === 'build' && T.wave > 0) { T.auto -= dt; if (T.auto <= 0) TD.startWave(); }
    if (T.phase === 'wave') {
      T.wt += dt;
      while (T.q.length && T.q[0].at <= T.wt) { const q = T.q.shift(), b = EN[q.type]; T.en.push({ type: q.type, hp: b.hp * q.hpM, max: b.hp * q.hpM, d: 0, spd: b.spd * L.len / 1800, slow: 0, flash: 0, seed: Math.random() * 9, x: L.pts[0][0], y: L.pts[0][1], dir: 1 }); }
    }
    for (let i = T.en.length - 1; i >= 0; i--) {
      const e = T.en[i]; if (e.dead) { T.en.splice(i, 1); continue; }
      e.slow = Math.max(0, e.slow - dt); e.flash = Math.max(0, e.flash - dt);
      e.d += e.spd * (e.slow > 0 ? .5 : 1) * dt; const q = posAt(e.d); e.x = q[0]; e.y = q[1]; if (Math.abs(q[2]) > 1) e.dir = q[2] > 0 ? 1 : -1;
      if (e.d >= L.len) {
        T.en.splice(i, 1); const st = G.st, s = Math.min(st.coins, 6 + 2 * T.night); st.coins -= s; T.stolen += s; T.leaked++; T.lives -= e.type === 'boss' ? 5 : 1; T.shake = .35;
        A.text(L.end[0], L.end[1] - 60, s ? '−' + s + '🪙' : 'Leak!', '#ff6b6b', 20); A.burst(L.end[0], L.end[1] - 20, 12, '#ff6b6b', 160); G.Au.sfx('bad'); G.UI.tdHud(true);
        if (T.lives <= 0) { T.lives = 0; finish(false); return; }
      }
    }
    for (const w of T.tw) {
      const [x, y] = L.pads[w.pad], R = range(w), ty = TD.TYPES[w.type]; w.cd -= dt; w.kick = Math.max(0, w.kick - dt * 4);
      let tg = null; for (const e of T.en) if (!e.dead && Math.hypot(e.x - x, e.y - y) <= R && (!tg || e.d > tg.d)) tg = e;
      w.tgt = tg; if (!tg) continue;
      w.ang = Math.atan2(tg.y - 14 - (y - 30), tg.x - x);
      if (w.type === 'beacon') {
        hurt(tg, dmgOf(w) * dt); if (Math.random() < dt * 14) A.spawn({ x: tg.x + U.rand(-8, 8), y: tg.y - 14, vy: -60, life: .35, size: 4, col: '#ffd35c', type: 'spark' });
        if (w.lvl >= 3) { let t2 = null; for (const e of T.en) if (e !== tg && !e.dead && Math.hypot(e.x - tg.x, e.y - tg.y) < L.R * .16 && (!t2 || e.d > t2.d)) t2 = e; w.tgt2 = t2; if (t2) hurt(t2, dmgOf(w) * .5 * dt); }
      } else if (w.cd <= 0) {
        w.cd = ty.rate; w.kick = 1;
        if (w.type === 'sling') { T.shots.push({ k: 's', x, y: y - 34, tg, dmg: dmgOf(w) }); G.Au.sfx('shot'); }
        else if (w.type === 'mortar') { T.shots.push({ k: 'm', x0: x, y0: y - 30, tx: tg.x, ty: tg.y - 6, p: 0, dmg: dmgOf(w), r: ty.splash * L.R * (1 + .1 * (w.lvl - 1)) }); G.Au.sfx('pop'); }
        else if (w.type === 'frost') {
          for (const e of T.en) if (Math.hypot(e.x - x, e.y - y) <= R) { e.slow = 1.5 + .3 * w.lvl; hurt(e, dmgOf(w)); }
          A.spawn({ x, y: y - 6, type: 'ring', size: R, flat: .8, life: .5, col: '#a8ecff' }); G.Au.sfx('frost');
        }
      }
    }
    for (let i = T.shots.length - 1; i >= 0; i--) {
      const s = T.shots[i];
      if (s.k === 's') {
        if (s.tg.dead) { T.shots.splice(i, 1); continue; }
        const dx = s.tg.x - s.x, dy = s.tg.y - 14 - s.y, d = Math.hypot(dx, dy), v = 640 * dt;
        if (d <= v + 8) { hurt(s.tg, s.dmg); A.burst(s.tg.x, s.tg.y - 14, 3, '#fff3b0', 80); G.Au.sfx('hit'); T.shots.splice(i, 1); }
        else { s.x += dx / d * v; s.y += dy / d * v; }
      } else {
        s.p += dt / .55;
        if (s.p >= 1) {
          for (const e of T.en) if (Math.hypot(e.x - s.tx, e.y - s.ty) <= s.r) hurt(e, s.dmg);
          A.burst(s.tx, s.ty, 16, '#ff7a3c', 200); A.burst(s.tx, s.ty, 8, '#ffd35c', 120, 'spark'); A.spawn({ x: s.tx, y: s.ty, type: 'ring', size: s.r, flat: .7, life: .35, col: '#ffb347' });
          T.shake = Math.max(T.shake, .12); G.Au.sfx('boom'); T.shots.splice(i, 1);
        }
      }
    }
    if (T.phase === 'wave' && !T.q.length && !T.en.length) {
      if (T.wave >= T.waves) finish(true);
      else { T.phase = 'build'; T.auto = 7; G.UI.toast('Wave cleared! Reinforce your defenses.', 'night'); G.UI.tdHud(true); }
    }
  };

  /* ---------- drawing ---------- */
  function tower(c, w, x, y, t) {
    const lv = w.lvl, k = w.kick;
    c.fillStyle = 'rgba(0,0,20,.35)'; A.ell(c, x, y + 4, 26, 9); c.fill();
    c.fillStyle = A.vgrad(c, y - 16, y + 6, '#b9add8', '#6f629a'); A.rr(c, x - 22, y - 14, 44, 20, 8); c.fill();
    c.fillStyle = '#d8cff0'; A.ell(c, x, y - 14, 22, 7); c.fill();
    if (w.type === 'sling') {
      c.fillStyle = '#a8683a'; A.rr(c, x - 5, y - 44, 10, 32, 4); c.fill();
      c.save(); c.translate(x, y - 44); c.rotate(w.ang + PI / 2);
      c.strokeStyle = '#c98a55'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-11, -15); c.moveTo(0, 0); c.lineTo(11, -15); c.stroke();
      c.strokeStyle = '#ef5350'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-11, -15); c.lineTo(0, -4 + (1 - k) * 8); c.lineTo(11, -15); c.stroke();
      c.fillStyle = '#e8e0f8'; A.ell(c, 0, -4 + (1 - k) * 8, 4, 4); c.fill(); c.restore();
    } else if (w.type === 'mortar') {
      c.save(); c.translate(x, y - 22); c.rotate(clamp(Math.cos(w.ang), -1, 1) * .5); c.translate(0, k * 6);
      c.fillStyle = A.vgrad(c, -30, 8, '#e0a04a', '#8a5420'); A.rr(c, -15, -28, 30, 36, 10); c.fill();
      c.fillStyle = '#3a2030'; A.ell(c, 0, -28, 13, 5); c.fill(); c.fillStyle = '#ffd35c'; c.fillRect(-15, -8, 30, 5);
      A.emoji(c, '🌶️', 0, -14, 14); c.restore();
    } else if (w.type === 'frost') {
      c.fillStyle = '#7fd8f5'; A.ell(c, x, y - 15, 17, 5); c.fill();
      const b = Math.sin(t * 3) * 2; c.fillStyle = A.vgrad(c, y - 60, y - 16, '#e8fbff', '#6fc8ee');
      c.beginPath(); c.moveTo(x, y - 58 + b); c.lineTo(x + 12, y - 34); c.lineTo(x, y - 14); c.lineTo(x - 12, y - 34); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(x, y - 58 + b); c.lineTo(x + 4, y - 34); c.lineTo(x, y - 20); c.fill();
    } else {
      c.fillStyle = '#5a4a7a'; A.rr(c, x - 4, y - 58, 8, 46, 3); c.fill();
      c.fillStyle = '#ffb347'; A.rr(c, x - 12, y - 78, 24, 26, 9); c.fill(); c.fillStyle = '#fff3b0'; A.rr(c, x - 6, y - 73, 12, 16, 5); c.fill();
      c.fillStyle = '#5a4a7a'; c.fillRect(x - 9, y - 81, 18, 4);
    }
    for (let i = 0; i < lv; i++) { c.fillStyle = '#ffe066'; A.ell(c, x - (lv - 1) * 5 + i * 10, y + 1, 3, 3); c.fill(); }
  }
  TD.draw = function (c, t) {
    if (!T || !L) return; const vw = G.vw, vh = G.vh;
    c.save(); if (T.shake > 0) c.translate(U.rand(-1, 1) * T.shake * 16, U.rand(-1, 1) * T.shake * 16);
    c.fillStyle = A.vgrad(c, 0, vh, '#191c4c', '#2e2670'); c.fillRect(-20, -20, vw + 40, vh + 40);
    for (let i = 0; i < 150; i++) { const h = hash(i * 7.3); c.fillStyle = h > .5 ? 'rgba(120,110,200,.16)' : 'rgba(10,8,40,.25)'; A.ell(c, hash(i) * vw, hash(i + 500) * vh, 8 + h * 16, 3 + h * 6); c.fill(); }
    const pw = clamp(L.R * .115, 44, 66);
    const stroke = (col, w) => { c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); L.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); };
    stroke('rgba(8,6,36,.55)', pw + 16); stroke('#5d4f92', pw); stroke('#7a6bb0', pw - 16);
    c.setLineDash([6, 22]); stroke('rgba(255,255,255,.1)', 3); c.setLineDash([]);
    for (let i = 0; i < 46; i++) { const q = posAt(hash(i + 40) * L.len); c.fillStyle = hash(i) > .5 ? 'rgba(160,145,215,.5)' : 'rgba(60,48,120,.5)'; A.ell(c, q[0] + (hash(i + 9) - .5) * pw * .7, q[1] + (hash(i + 19) - .5) * pw * .7, 7 + hash(i) * 6, 3 + hash(i) * 3); c.fill(); }
    for (let i = 0; i < 10; i++) { const x = hash(i + 800) < .5 ? L.fx - 6 + hash(i) * 14 : L.fx + L.fw - 10 + hash(i) * 14, y = L.fy + hash(i + 900) * L.fh; A.crate(c, x, y, 26 + hash(i) * 12, '#5a4a8a'); }
    const [ex, ey] = L.end; G.lights.length = 0; G.wins.length = 0;
    c.save(); c.translate(ex, ey + 54); c.scale(.62, .62); A.B.stall(c, 0, 0, t); c.restore();
    for (const lp of L.lamps) { c.fillStyle = '#3a305a'; A.rr(c, lp[0] - 3, lp[1] - 46, 6, 46, 2); c.fill(); c.fillStyle = '#ffb347'; A.rr(c, lp[0] - 8, lp[1] - 62, 16, 20, 6); c.fill(); c.fillStyle = '#fff3b0'; A.rr(c, lp[0] - 4, lp[1] - 58, 8, 12, 3); c.fill(); }
    const build = T.phase === 'build';
    L.pads.forEach((p, i) => {
      if (TD.towerAt(i)) return; const pul = build ? .5 + .5 * Math.sin(t * 4 + i) : 0;
      c.fillStyle = 'rgba(0,0,20,.3)'; A.ell(c, p[0], p[1] + 3, 26, 10); c.fill();
      c.fillStyle = '#4a4080'; A.ell(c, p[0], p[1], 24, 9); c.fill();
      c.strokeStyle = `rgba(255,224,102,${.35 + pul * .5})`; c.lineWidth = 2; c.setLineDash([5, 5]); A.ell(c, p[0], p[1], 20 + pul * 2, 7.5 + pul); c.stroke(); c.setLineDash([]);
      c.fillStyle = `rgba(255,224,102,${.5 + pul * .5})`; c.fillRect(p[0] - 6, p[1] - 1.5, 12, 3); c.fillRect(p[0] - 1.5, p[1] - 6, 3, 12);
    });
    if (T.sel >= 0) { const p = L.pads[T.sel], w = TD.towerAt(T.sel), R = w ? range(w) : L.R * .25; c.fillStyle = 'rgba(255,224,102,.08)'; A.ell(c, p[0], p[1], R, R); c.fill(); c.strokeStyle = 'rgba(255,224,102,.5)'; c.lineWidth = 2; c.setLineDash([8, 8]); A.ell(c, p[0], p[1], R, R); c.stroke(); c.setLineDash([]); }
    const ents = T.tw.map(w => ({ y: L.pads[w.pad][1], w })).concat(T.en.map(e => ({ y: e.y, e }))); ents.sort((a, b) => a.y - b.y);
    for (const o of ents) {
      if (o.w) { const p = L.pads[o.w.pad]; tower(c, o.w, p[0], p[1], t); }
      else { const e = o.e; A.gloom(c, e.x, e.y, { type: e.type, t, seed: e.seed, flash: e.flash, slow: e.slow, dir: e.dir }); if (e.hp < e.max) { const bw = e.type === 'boss' ? 60 : 28, by = e.y - (e.type === 'boss' ? 104 : e.type === 'brute' ? 70 : 50); c.fillStyle = 'rgba(0,0,20,.6)'; A.rr(c, e.x - bw / 2, by, bw, 5, 2.5); c.fill(); c.fillStyle = e.hp / e.max > .4 ? '#7df07d' : '#ff6b6b'; A.rr(c, e.x - bw / 2, by, bw * clamp(e.hp / e.max, 0, 1), 5, 2.5); c.fill(); } }
    }
    c.globalCompositeOperation = 'lighter';
    for (const w of T.tw) if (w.type === 'beacon') {
      const p = L.pads[w.pad], ox = p[0], oy = p[1] - 66; A.glow(c, ox, oy, 46, '255,190,90', .5);
      for (const tg of [w.tgt, w.lvl >= 3 && w.tgt ? w.tgt2 : null]) if (tg && !tg.dead) { const sx = tg === w.tgt ? ox : w.tgt.x, sy = tg === w.tgt ? oy : w.tgt.y - 14; c.strokeStyle = 'rgba(255,170,60,.5)'; c.lineWidth = 9 + Math.sin(t * 30) * 2; c.beginPath(); c.moveTo(sx, sy); c.lineTo(tg.x, tg.y - 14); c.stroke(); c.strokeStyle = 'rgba(255,245,200,.9)'; c.lineWidth = 3; c.stroke(); A.glow(c, tg.x, tg.y - 14, 26, '255,200,100', .7); }
    }
    for (const lp of L.lamps) A.glow(c, lp[0], lp[1] - 52, 150, '255,170,80', .26 + Math.sin(t * 3 + lp[0]) * .03);
    A.glow(c, ex, ey - 20, 170, '255,180,90', .25);
    for (let i = 0; i < 14; i++) A.glow(c, hash(i + 20) * vw + Math.sin(t * .5 + i) * 40, hash(i + 30) * vh + Math.cos(t * .7 + i * 2) * 30, 11, '200,255,140', .35 + .35 * Math.sin(t * 3 + i * 1.7));
    c.globalCompositeOperation = 'source-over';
    for (const s of T.shots) {
      if (s.k === 's') { c.fillStyle = '#fff3b0'; A.ell(c, s.x, s.y, 4.5, 4.5); c.fill(); c.fillStyle = 'rgba(255,243,176,.35)'; A.ell(c, s.x, s.y, 8, 8); c.fill(); }
      else { const x = s.x0 + (s.tx - s.x0) * s.p, y = s.y0 + (s.ty - s.y0) * s.p - Math.sin(s.p * PI) * 110; c.fillStyle = 'rgba(0,0,20,.3)'; A.ell(c, x, s.y0 + (s.ty - s.y0) * s.p + 10, 7, 3); c.fill(); c.fillStyle = '#ff5a3c'; A.ell(c, x, y, 8, 8); c.fill(); c.fillStyle = '#ffd35c'; A.ell(c, x - 2, y - 2, 3.5, 3.5); c.fill(); }
    }
    A.drawP(c, 0);
    c.restore();
    const g = c.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * .45, vw / 2, vh / 2, Math.max(vw, vh) * .75); g.addColorStop(0, 'rgba(5,4,30,0)'); g.addColorStop(1, 'rgba(5,4,30,.6)'); c.fillStyle = g; c.fillRect(0, 0, vw, vh);
  };
})();
