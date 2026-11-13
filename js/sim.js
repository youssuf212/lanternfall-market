'use strict';
/* Life sim: time, needs, skills, market economy, stall, quests, progression */
(function () {
  const S = G.S = {}; const { clamp } = U;
  let mkAcc = 0, stAcc = 0;
  const MK = {}; for (const k in G.MKT) MK[k] = G.MKT[k].n;
  S.MK = MK;
  S.skill = k => G.st.skills[k].l;
  S.xpNeed = l => Math.round(60 + 50 * Math.pow(l, 1.6));
  S.lvNeed = l => Math.round(80 * Math.pow(l, 1.5));
  S.eff = () => { const n = G.st.needs, m = Math.min(n.food, n.water, n.rest); return (m >= 30 ? 1 : .6 + .4 * m / 30) * (G.st.fed ? 1.2 : 1); };
  const sum = o => { let s = 0; for (const k in o) s += o[k]; return s; };
  S.bagCap = () => G.UPG.bag.caps[G.st.bag] + S.skill('trade') * 2;
  S.bagUsed = () => sum(G.st.inv);
  S.shelfCap = () => G.UPG.shelf.caps[G.st.stall.shelf];
  S.shelfUsed = () => sum(G.st.stall.stock);

  /* ----- market ----- */
  S.evMult = (mk, id) => { let m = 1; for (const e of G.st.events) if (e.mk === mk && e.id === id) m *= e.mult; return m; };
  S.price = (mk, id) => Math.max(1, Math.round(G.good(id).base * G.st.market[mk].f[id] * S.evMult(mk, id)));
  const deal = (mk, side) => { const d = G.st.deals[mk]; return (d && d.day === G.st.day && d.side === side ? d.m : 1) * (side === 'buy' && mk === 'bazaar' && G.st.flags.pepper_partner ? .95 : 1); };
  S.dealToday = mk => { const d = G.st.deals[mk]; return d && d.day === G.st.day ? d : null; };
  S.buyPrice = (mk, id) => Math.max(1, Math.ceil(S.price(mk, id) * Math.max(.98, 1.04 - .01 * S.skill('trade')) * deal(mk, 'buy')));
  S.sellPrice = (mk, id) => { const b = S.buyPrice(mk, id); return Math.max(1, Math.min(b > 1 ? b - 1 : 1, Math.floor(S.price(mk, id) * Math.min(.97, .92 + .008 * S.skill('trade')) * deal(mk, 'sell')))); };
  S.stallPrice = id => Math.round(G.good(id).base * (1.3 + .04 * S.skill('charm') + .1 * G.st.stall.awning));
  S.buy = function (mk, id, n) {
    const st = G.st; let got = 0, spent = 0;
    while (got < n && S.bagUsed() < S.bagCap()) {
      const p = S.buyPrice(mk, id); if (st.coins < p) break;
      st.coins -= p; spent += p; st.inv[id] = (st.inv[id] || 0) + 1; st.cost[id] = (st.cost[id] || 0) + p;
      st.market[mk].f[id] = Math.min(2, st.market[mk].f[id] + .012); got++;
    }
    if (got) S.count('bought', got);
    return { got, spent };
  };
  S.sell = function (mk, id, n) {
    const st = G.st; n = Math.min(n, st.inv[id] || 0); let rev = 0, basis = 0;
    for (let i = 0; i < n; i++) {
      const p = S.sellPrice(mk, id), avg = (st.cost[id] || 0) / st.inv[id];
      rev += p; basis += avg; st.cost[id] -= avg; st.inv[id]--; st.coins += p;
      st.market[mk].f[id] = Math.max(.4, st.market[mk].f[id] - .012);
    }
    if (st.inv[id] <= 0) { delete st.inv[id]; delete st.cost[id]; }
    const profit = Math.round(rev - basis);
    if (profit > 0) { st.stats.profit += profit; S.count('profit', profit); S.renown(Math.ceil(profit * .25)); }
    return { n, rev, profit };
  };
  function marketTick() {
    const st = G.st;
    for (const mk in st.market) {
      const m = st.market[mk];
      for (const g of G.GOODS) {
        const target = g.home.includes(mk) ? .82 : g.cities.includes(G.MKT[mk].city) ? 1.12 : 1.45;
        m.f[g.id] = clamp(m.f[g.id] + (target - m.f[g.id]) * .07 + (Math.random() - .5) * 2 * g.vol, .5, 1.9);
        const h = m.hist[g.id]; h.push(S.price(mk, g.id)); if (h.length > 24) h.shift();
      }
    }
  }
  S.marketTick = marketTick;
  function genEvents() {
    const ev = [], used = {};
    for (let i = 0; i < 2; i++) {
      let g; do { g = U.pick(G.GOODS); } while (used[g.id]); used[g.id] = 1;
      const mk = U.pick(Object.keys(G.MKT)), glut = Math.random() < .5;
      ev.push({ mk, id: g.id, mult: glut ? U.rand(.55, .7) : U.rand(1.45, 1.8), txt: glut ? `${g.i} ${g.n} glut at the ${MK[mk]} — prices crash!` : `${g.i} ${g.n} shortage at the ${MK[mk]} — prices soar!` });
    }
    return ev;
  }
  S.rollEvents = function () { const st = G.st; st.events = st.nextEvents && st.nextEvents.length ? st.nextEvents : genEvents(); st.nextEvents = genEvents(); };

  /* ----- stall ----- */
  S.stock = function (id, n) {
    const st = G.st; n = Math.min(n, st.inv[id] || 0, S.shelfCap() - S.shelfUsed()); if (n <= 0) return 0;
    const avg = (st.cost[id] || 0) / st.inv[id];
    st.inv[id] -= n; st.cost[id] -= avg * n; if (st.inv[id] <= 0) { delete st.inv[id]; delete st.cost[id]; }
    st.stall.stock[id] = (st.stall.stock[id] || 0) + n; st.stall.costs = st.stall.costs || {}; st.stall.costs[id] = (st.stall.costs[id] || 0) + avg * n;
    S.count('stocked', n); return n;
  };
  S.unstock = function (id) {
    const st = G.st, n = Math.min(st.stall.stock[id] || 0, S.bagCap() - S.bagUsed()); if (n <= 0) return 0;
    const avg = ((st.stall.costs || {})[id] || 0) / st.stall.stock[id];
    st.stall.stock[id] -= n; st.stall.costs[id] -= avg * n; if (st.stall.stock[id] <= 0) { delete st.stall.stock[id]; delete st.stall.costs[id]; }
    st.inv[id] = (st.inv[id] || 0) + n; st.cost[id] = (st.cost[id] || 0) + avg * n; return n;
  };
  function stallSale() {
    const st = G.st, ids = Object.keys(st.stall.stock); if (!ids.length) return;
    const id = U.pick(ids), p = S.stallPrice(id), avg = ((st.stall.costs || {})[id] || 0) / st.stall.stock[id];
    st.stall.stock[id]--; if (st.stall.costs) st.stall.costs[id] -= avg;
    if (st.stall.stock[id] <= 0) { delete st.stall.stock[id]; if (st.stall.costs) delete st.stall.costs[id]; }
    st.stall.till += p; st.stats.sold++; S.count('stallSold', 1);
    const profit = Math.round(p - avg); if (profit > 0) { st.stats.profit += profit; S.count('profit', profit); }
    S.renown(2);
    if (G.W) G.W.onStallSale(id, p);
  }

  /* ----- time ----- */
  function step(d) {
    const st = G.st, n = st.needs, k = st.perks.canteen ? .8 : 1;
    st.time += d;
    n.food = clamp(n.food - .085 * d * k, 0, 100); n.water = clamp(n.water - .11 * d * k, 0, 100); n.rest = clamp(n.rest - .045 * d, 0, 100);
    const low = (n.food <= 0) + (n.water <= 0) + (n.rest <= 0);
    if (low) st.health = clamp(st.health - .13 * d * low, 0, 100);
    else if (Math.min(n.food, n.water, n.rest) > 35) st.health = clamp(st.health + .05 * d, 0, 100);
    mkAcc += d; while (mkAcc >= 30) { mkAcc -= 30; marketTick(); }
    if (st.time > 420 && st.time < 1240) {
      stAcc += d; const iv = 26 / (1 + .1 * S.skill('charm')) / (st.perks.bell ? 1.3 : 1);
      while (stAcc >= iv) { stAcc -= iv; stallSale(); }
    }
  }
  S.advance = function (min) { while (min > 0) { const d = Math.min(8, min); min -= d; step(d); } if (G.st.health <= 0) S.collapse(); };
  S.need = function (k, v) { const n = G.st.needs; n[k] = clamp(n[k] + v, 0, 100); };
  S.tire = v => S.need('rest', -v * (1 - Math.min(.4, .04 * S.skill('fit'))));
  S.collapse = function () {
    const st = G.st, loss = Math.floor(st.coins * .3);
    st.coins -= loss; st.health = 60; st.needs = { food: 55, water: 55, rest: 55 }; st.time = Math.min(G.DUSK - 30, st.time + 180);
    G.save(); if (G.UI) G.UI.collapsed(loss);
  };

  /* ----- progression ----- */
  S.renown = function (n) {
    const st = G.st; st.renown += n;
    while (st.renown >= S.lvNeed(st.level)) {
      st.renown -= S.lvNeed(st.level); st.level++; st.shards++;
      if (G.UI) G.UI.levelUp();
    }
  };
  S.addXp = function (k, n) {
    const s = G.st.skills[k]; s.xp += Math.round(n); let up = false;
    while (s.xp >= S.xpNeed(s.l)) { s.xp -= S.xpNeed(s.l); s.l++; up = true; }
    if (up && G.UI) { G.UI.toast(`${G.SKILLS[k].i} ${G.SKILLS[k].n} reached level ${s.l}!`, 'gold'); G.Au.sfx('lvl'); S.renown(15); }
    return up;
  };
  const QT = [
    { c: 'drink', t: 'Drink at the well', n: 1, r: 10 }, { c: 'eat', t: 'Eat a proper meal', n: 1, r: 10 },
    { c: 'job', t: 'Work {n} shifts (docks or busking)', n: 2, r: 30 }, { c: 'study', t: 'Take {n} lessons at the Academy', n: 1, r: 25 },
    { c: 'profit', t: 'Make {n} coins of trading profit', n: 0, r: 0 }, { c: 'stallSold', t: 'Sell {n} goods from your stall', n: 4, r: 30 },
    { c: 'kills', t: 'Banish {n} gloomlings tonight', n: 0, r: 30 }, { c: 'perfect', t: 'Win a raid without a single leak', n: 1, r: 40, sh: 1 },
    { c: 'bought', t: 'Buy {n} goods at a market', n: 6, r: 20 }, { c: 'fish', t: 'Go fishing {n} times', n: 2, r: 25 }
  ];
  S.rollQuests = function () {
    const st = G.st; st.counters = {};
    let pool;
    if (st.day === 1) pool = [{ c: 'drink', t: 'Drink at the Well 💧', n: 1, r: 10 }, { c: 'bought', t: 'Buy 3 goods at the Bazaar 🛍️', n: 3, r: 15 }, { c: 'stocked', t: 'Stock your Stall with goods 🏪', n: 1, r: 20 }, { c: 'study', t: 'Take a lesson at the Academy 📚', n: 1, r: 20 }];
    else {
      pool = QT.slice().sort(() => Math.random() - .5).slice(0, 3).map(q => {
        q = Object.assign({}, q);
        if (q.c === 'profit') { q.n = 20 + st.level * 15; q.r = 15 + st.level * 8; }
        if (q.c === 'kills') q.n = 10 + st.day * 2;
        q.t = q.t.replace('{n}', q.n); return q;
      });
    }
    st.quests = pool.map(q => Object.assign({ done: false }, q));
  };
  S.count = function (key, n) {
    const st = G.st; st.counters[key] = (st.counters[key] || 0) + (n || 1);
    for (const q of st.quests) if (!q.done && q.c === key && st.counters[key] >= q.n) {
      q.done = true; st.coins += q.r; if (q.sh) st.shards += q.sh; S.renown(12);
      if (G.UI) { G.UI.toast(`📜 Goal done: +${q.r}🪙${q.sh ? ' +' + q.sh + '🌙' : ''}`, 'gold'); G.Au.sfx('good'); }
      if (st.quests.every(x => x.done)) { st.coins += 25; st.shards += (st.day % 3 === 0 ? 1 : 0); if (G.UI) G.UI.toast('🌟 All goals complete! Bonus +25🪙', 'gold'); }
    }
  };
  /* ----- people, honor, business ----- */
  S.bond = function (id, n) { const st = G.st; st.bond[id] = clamp((st.bond[id] || 0) + n, 0, 100); if (n >= 3 && G.UI) G.UI.toast(`💛 ${G.NPCS[id].n} will remember that`); };
  S.honor = function (n) { const st = G.st; st.honor = clamp(st.honor + n, 0, 100); if (G.UI) G.UI.toast(n > 0 ? `🕯️ Honor +${n} — the night feels a little lighter` : `🌑 Honor ${n} — something stirs in the dark`, n > 0 ? 'gold' : 'night'); };
  S.raidMult = function () { const st = G.st, e = st.ending; return (1 + (50 - st.honor) / 100 * .6) * (e === 'tenth' ? .5 : e === 'open' ? .7 : e === 'chair' ? 1.3 : 1); };
  const BM = [1, 1.6, 2.5];
  S.bizIncome = id => Math.round(G.BIZ[id].inc * BM[G.st.biz[id] - 1]);
  S.bizCut = () => { let c = 0; for (const k in G.st.investors) c += G.st.investors[k]; if (G.st.ending === 'tenth') c += .1; return Math.min(.9, c); };
  S.bizDay = function () {
    const st = G.st; let gross = 0; for (const id in st.biz) gross += S.bizIncome(id) * U.rand(.75, 1.25);
    if (!gross) return; const net = Math.round(gross * (1 - S.bizCut())); st.coins += net; S.renown(Math.ceil(net / 12));
    if (G.UI) setTimeout(() => G.UI.toast(`🏢 Your businesses earned +${net}🪙${S.bizCut() ? ' after your partners take their share' : ''}`, 'gold'), 1500);
  };
  S.awayRaid = function () {
    const st = G.st, n = st.day, TY = G.TD.TYPES; let power = 0; for (const w of st.towers) power += TY[w.type].cost * [1, 2.3, 4.5][w.lvl - 1];
    power *= 1 + .06 * S.skill('craft'); const threat = 13 * G.TD.wavesFor(n) * (1 + .2 * (n - 1)) * S.raidMult(), r = power / threat;
    if (r >= 1) { const b = Math.round(threat * .5); st.coins += b; st.nightsWon++; return `🛡️ Back home, your towers held the alley alone. Bounties: +${b}🪙`; }
    const loss = Math.round((1 - r) * (st.stall.till + st.coins * .15)); const fromTill = Math.min(st.stall.till, loss); st.stall.till -= fromTill; st.coins = Math.max(0, st.coins - (loss - fromTill)); st.streak = 0;
    for (const id in st.stall.stock) { st.stall.stock[id] = Math.floor(st.stall.stock[id] / 2); if (!st.stall.stock[id]) delete st.stall.stock[id]; }
    return `💀 With you away, gloomlings broke through at home: −${loss}🪙 and half your shelf.`;
  };
  S.dayTurn = function () {
    const st = G.st; S.bizDay();
    if (st.loan && st.day > st.loan.due) { st.loan.amt = Math.ceil(st.loan.amt * 1.1); S.honor(-4); if (G.UI) G.UI.toast(`⚠️ Your debt is overdue and has grown to ${st.loan.amt}🪙`, 'bad'); }
    for (let i = st.contracts.length - 1; i >= 0; i--) { const c = st.contracts[i]; if (st.day > c.due) { st.contracts.splice(i, 1); S.honor(-6); st.bond[c.npc] = Math.max(0, (st.bond[c.npc] || 0) - 10); if (G.UI) G.UI.toast(`📦 You broke your word to ${G.NPCS[c.npc].n}`, 'bad'); } }
  };
  S.newDay = function () {
    const st = G.st; st.day++; st.time = G.DAY_START; S.dayTurn();
    st.needs.rest = clamp(Math.max(st.needs.rest, 66 + (st.city === 'lantern' ? st.bed : 1) * 17), 0, 100);
    st.needs.food = clamp(st.needs.food - 18, 5, 100); st.needs.water = clamp(st.needs.water - 22, 5, 100);
    st.health = clamp(st.health + 15 + st.bed * 10, 0, 100); st.fed = false; if (st.city === 'lantern') st.px = 320;
    S.rollEvents(); for (let i = 0; i < 6; i++) marketTick(); S.rollQuests(); G.save();
  };
  S.netWorth = function () { const st = G.st; let w = st.coins + st.stall.till; for (const id in st.inv) w += st.inv[id] * G.good(id).base; for (const id in st.stall.stock) w += st.stall.stock[id] * G.good(id).base; return Math.round(w); };
  S.init = function (fresh) { if (fresh) { S.rollEvents(); for (let i = 0; i < 24; i++) marketTick(); S.rollQuests(); } mkAcc = stAcc = 0; };
})();
