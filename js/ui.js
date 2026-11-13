'use strict';
/* DOM UI: HUD, bottom sheets, market, minigame, modals, raid flow */
(function () {
  const UI = G.UI = {}; const S = G.S, W = G.W, TD = G.TD, Au = G.Au, A = G.A; const $ = id => document.getElementById(id);
  const acts = {}; let sheetFn = null;
  UI.sheetOpen = false; UI.modalOpen = false; UI.curLoc = null;

  UI.toast = function (msg, kind) {
    const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.textContent = msg;
    const box = $('toasts'); box.appendChild(el); while (box.children.length > 4) box.firstChild.remove(); setTimeout(() => el.remove(), 2900);
  };
  UI.sheet = function (title, fn) { sheetFn = fn; $('sheetTitle').textContent = title; $('sheetBody').innerHTML = fn(); $('sheet').classList.add('open'); UI.sheetOpen = true; $('sheetBody').scrollTop = 0; UI.hud(); };
  UI.rerender = function () { if (UI.sheetOpen && sheetFn) { const b = $('sheetBody'), s = b.scrollTop; b.innerHTML = sheetFn(); b.scrollTop = s; } UI.hud(); };
  UI.closeSheet = function () { $('sheet').classList.remove('open'); UI.sheetOpen = false; if (TD.T) TD.T.sel = -1; UI.hud(); };
  UI.modal = function (html, btns) {
    $('modalBody').innerHTML = html; const box = $('modalBtns'); box.innerHTML = '';
    (btns || [{ t: 'OK' }]).forEach(b => { const e = document.createElement('button'); e.className = 'b big ' + (b.cls || ''); e.textContent = b.t; e.onclick = () => { Au.sfx('tap'); UI.closeModal(); if (b.fn) b.fn(); }; box.appendChild(e); });
    $('modal').classList.remove('hide'); UI.modalOpen = true;
  };
  UI.closeModal = function () { $('modal').classList.add('hide'); UI.modalOpen = false; };
  UI.fade = function (text, mid) { const f = $('fade'); f.textContent = text; f.classList.add('on'); setTimeout(() => { mid(); setTimeout(() => f.classList.remove('on'), 650); }, 650); };

  const b = (a, v, label, cls, dis) => `<button class="b sm ${cls || ''}" data-a="${a}" data-v="${v}"${dis ? ' disabled' : ''}>${label}</button>`;
  const card = (i, t, d, r) => `<div class="card"><div class="ci">${i}</div><div class="cm"><b>${t}</b><span>${d}</span></div><div class="cr">${r || ''}</div></div>`;
  const sec = (t, r) => `<div class="sec"><span>${t}</span><span>${r || ''}</span></div>`;
  const news = t => `<div class="news">${t}</div>`;

  /* ---------- HUD ---------- */
  let lastCoins = -1;
  const setTxt = (id, t) => { const e = $(id); if (e.textContent !== t) e.textContent = t; };
  UI.hud = function () {
    const st = G.st; if (!st) return; const h = st.time / 60, td = G.mode === 'td';
    setTxt('cDay', td ? `🌙 Night ${st.day}` : `${h < 8 ? '🌅' : h < 17 ? '☀️' : h < 20 ? '🌇' : '🌙'} Day ${st.day} · ${U.clock(st.time)}`);
    if (st.coins !== lastCoins) { const c = $('cCoin'); c.textContent = '🪙 ' + st.coins; if (lastCoins >= 0) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); } lastCoins = st.coins; }
    setTxt('cShard', '🌙 ' + st.shards);
    const nb = (id, v) => { const e = $(id); e.querySelector('.fill').style.width = v + '%'; e.classList.toggle('low', v < 22); };
    nb('nHealth', st.health); nb('nFood', st.needs.food); nb('nWater', st.needs.water); nb('nRest', st.needs.rest);
    setTxt('rankTxt', `Lv ${st.level} · ${G.rankName(st.level)} · ${G.CITIES[st.city].i} ${G.CITIES[st.city].n}`); $('rankFill').style.width = (100 * st.renown / S.lvNeed(st.level)) + '%';
    const left = st.quests.filter(q => !q.done).length; $('goalDot').textContent = left; $('goalDot').classList.toggle('hide', !left);
    const q = (id, n) => { const e = $(id); e.classList.toggle('hide', !n || td); e.querySelector('.dot').textContent = n; }; q('bSnack', st.snacks); q('bFlask', st.flasks);
    const en = $('enter'), show = G.mode === 'day' && W.near && !UI.sheetOpen && !G.busy && !UI.modalOpen && st.time < G.DUSK;
    en.classList.toggle('hide', !show); if (show) setTxt('enter', `${W.near.i} Enter ${W.near.n}`);
    document.querySelectorAll('.tb').forEach(e => e.classList.toggle('on', !!W.near && W.near.id === e.dataset.id));
  };
  UI.tdHud = function () {
    const T = TD.T; if (!T) return;
    setTxt('cLives', '❤️ ' + T.lives); setTxt('cWave', `Wave ${T.wave}/${T.waves}`);
    const bw = $('bWave'); bw.disabled = T.phase !== 'build';
    setTxt('bWave', T.phase === 'build' ? (T.wave === 0 ? '▶ Start Wave 1' : `▶ Next Wave (${Math.max(0, Math.ceil(T.auto))})`) : T.phase === 'wave' ? '⚔️ Fighting…' : '…');
    setTxt('bSpeed', '⏩ ×' + T.speed); UI.hud();
  };
  UI.levelUp = function () { const st = G.st; UI.toast(`⭐ Renown Level ${st.level}! +1🌙`, 'gold'); Au.sfx('lvl'); if (G.rankName(st.level) !== G.rankName(st.level - 1)) UI.toast(`👑 New rank: ${G.rankName(st.level)}!`, 'gold'); if (G.mode === 'day') A.burst(W.p.x, G.gy - 40, 26, '#ffe066', 220, 'spark'); };
  UI.collapsed = function (loss) { UI.closeSheet(); UI.modal(`<div class="big-emo">😵</div><h1>You collapsed!</h1><p>You pushed too hard without food, water or rest. Kind strangers carried you to the clinic.</p><div class="line">Clinic fee: −${loss}🪙</div>`, [{ t: 'Take better care', cls: 'red' }]); Au.sfx('bad'); };

  /* ---------- actions ---------- */
  UI.doAction = function (o) {
    const st = G.st;
    if (st.time >= G.DUSK) return UI.toast('Night is falling…', 'night');
    if (o.cost && st.coins < o.cost) { Au.sfx('bad'); return UI.toast('Not enough coins', 'bad'); }
    if (o.tire && st.needs.rest < 8) { Au.sfx('bad'); return UI.toast('Too exhausted — nap or sleep first 😴', 'bad'); }
    const go = mult => {
      const loc = UI.curLoc; UI.closeSheet(); if (o.cost) st.coins -= o.cost;
      $('busyTxt').textContent = o.label; $('busyFill').style.width = '0%'; $('busy').classList.remove('hide');
      G.busy = { left: o.time, total: o.time, rate: o.time / 1.25, icon: o.icon, done() { $('busy').classList.add('hide'); if (o.tire) S.tire(o.tire); o.run(mult || 1); G.save(); if (!UI.modalOpen && st.time < G.DUSK && loc) UI.openLoc(loc); UI.hud(); } };
    };
    o.mini ? UI.mini(o.mini, go) : go(1);
  };
  UI.busyProg = f => { $('busyFill').style.width = (f * 100) + '%'; };
  UI.mini = function (title, cb) {
    const el = $('mini'), zone = $('miniZone'), mark = $('miniMark'), res = $('miniRes'); const zc = U.rand(.25, .75), hw = .13; let t0 = performance.now(), live = true, p = 0;
    $('miniTitle').textContent = title; res.textContent = ''; zone.style.left = (zc - hw) * 100 + '%'; zone.style.width = hw * 200 + '%'; el.classList.remove('hide');
    const sp = U.rand(1.1, 1.5);
    (function loop() { if (!live) return; const t = (performance.now() - t0) / 1000 * sp; p = Math.abs((t % 2) - 1); mark.style.left = p * 100 + '%'; requestAnimationFrame(loop); })();
    const hit = ev => {
      if (!live) return; ev.preventDefault(); live = false; el.removeEventListener('pointerdown', hit);
      const d = Math.abs(p - zc); let m, txt;
      if (d < hw * .36) { m = 1.5; txt = '🌟 PERFECT! ×1.5'; Au.sfx('lvl'); } else if (d < hw) { m = 1.2; txt = '👍 Great! ×1.2'; Au.sfx('good'); } else if (d < hw * 2) { m = 1; txt = 'OK ×1.0'; Au.sfx('tap'); } else { m = .75; txt = '😬 Sloppy ×0.75'; Au.sfx('bad'); }
      res.textContent = txt; setTimeout(() => { el.classList.add('hide'); cb(m); }, 750);
    };
    setTimeout(() => el.addEventListener('pointerdown', hit), 150);
  };

  /* ---------- market ---------- */
  function spark(h) {
    if (!h || h.length < 2) return '<svg width="62" height="24"></svg>';
    const mn = Math.min(...h), mx = Math.max(...h), r = mx - mn || 1;
    const pts = h.map((v, i) => (2 + i * 58 / (h.length - 1)).toFixed(1) + ',' + (21 - (v - mn) / r * 18).toFixed(1)).join(' ');
    return `<svg width="62" height="24"><polyline points="${pts}" fill="none" stroke="${h[h.length - 1] >= h[0] ? '#ef4056' : '#3fae5f'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function market(mk) {
    const st = G.st, tr = S.skill('trade'), others = Object.keys(G.MKT).filter(k => k !== mk && st.visited[G.MKT[k].city]); let h = '';
    for (const e of st.events) if (st.visited[G.MKT[e.mk].city]) h += news('📣 ' + e.txt);
    const dl = S.dealToday(mk); h += news(dl ? `🤝 Today's deal: ${dl.side === 'buy' ? 'you pay' : 'they pay'} ${dl.m < 1 ? Math.round((1 - dl.m) * 100) + '% less' : Math.round((dl.m - 1) * 100) + '% more'} here.` : '💬 Talk to the merchant here to haggle over today\'s prices.');
    const best = id => { if (tr < 1 || !others.length) return ''; let bk = others[0]; for (const k of others) if (S.sellPrice(k, id) > S.sellPrice(bk, id)) bk = k; return ` · best: ${S.MK[bk]} ${S.sellPrice(bk, id)}`; };
    h += sec(S.MK[mk] + ' prices', `🎒 ${S.bagUsed()}/${S.bagCap()}`);
    for (const g of G.GOODS) {
      const p = S.buyPrice(mk, g.id), sp = S.sellPrice(mk, g.id), own = st.inv[g.id] || 0, r = S.price(mk, g.id) / g.base, cls = r < .92 ? 'cheap' : r > 1.1 ? 'dear' : '';
      const full = S.bagUsed() >= S.bagCap(), v = mk + '|' + g.id + '|';
      h += `<div class="mrow"><div class="mi">${g.i}</div><div class="mn"><b>${g.n}</b><small>${own ? `own ${own} · paid ~${Math.round((st.cost[g.id] || 0) / own)}` : 'none owned'}${best(g.id)}</small></div>${spark(st.market[mk].hist[g.id])}<div class="mp"><b class="${cls}">${r < .92 ? '▼' : r > 1.1 ? '▲' : ''}${p}🪙</b><small>sells ${sp}</small></div><div class="mb">${b('buy', v + 1, 'Buy', '', st.coins < p || full)}${b('buy', v + 5, 'Buy ×5', '', st.coins < p || full)}${b('sell', v + 1, 'Sell', 'teal', !own)}${b('sell', v + 999, 'Sell all', 'teal', !own)}</div></div>`;
    }
    if (tr < 1) h += news('💡 Study <b>Trade</b> at the Academy to see where each good sells best.');
    return h;
  }
  acts.buy = v => { const [mk, id, n] = v.split('|'); const r = S.buy(mk, id, +n); if (!r.got) { Au.sfx('bad'); UI.toast(S.bagUsed() >= S.bagCap() ? 'Your bag is full!' : 'Not enough coins', 'bad'); } else Au.sfx('buy'); };
  acts.sell = v => { const [mk, id, n] = v.split('|'); const r = S.sell(mk, id, +n); if (r.n) { Au.sfx('coin'); if (r.profit > 0) UI.toast(`Sold ${r.n} · profit +${r.profit}🪙`, 'gold'); else if (r.profit < 0) UI.toast(`Sold ${r.n} at a loss (${r.profit}🪙)`, 'bad'); } };

  /* ---------- locations ---------- */
  const FOOD = [
    { i: '🫓', n: 'Flatbread', c: 8, t: 10, food: 25 }, { i: '🍲', n: 'Hearty Stew', c: 20, t: 25, food: 55, water: 10 },
    { i: '🍗', n: 'Royal Feast', c: 60, t: 45, food: 100, water: 30, rest: 10, fed: 1, d: 'Buff: +20% pay & XP today' }, { i: '🍵', n: 'Mint Tea', c: 6, t: 10, water: 35, rest: 5 },
    { i: '🥪', n: 'Packed Snack', c: 12, pack: 'snacks', d: 'Eat anywhere: +30 food' }, { i: '🧴', n: 'Water Flask', c: 10, pack: 'flasks', d: 'Drink anywhere: +40 water' }
  ];
  const fprice = f => G.st.flags.zuri_half && G.st.city === 'lantern' && !f.pack ? Math.ceil(f.c / 2) : f.c;
  const foodCards = () => FOOD.map((f, i) => card(f.i, f.n, f.d || [f.food && `+${f.food} food`, f.water && `+${f.water} water`, f.rest && `+${f.rest} rest`, f.t + ' min'].filter(Boolean).join(' · '), b('eat', i, fprice(f) + '🪙', '', G.st.coins < fprice(f)))).join('');
  const LOC = {
    home() {
      const st = G.st, bd = G.UPG.bed; let inv = Object.keys(st.inv).map(id => G.good(id).i + '×' + st.inv[id]).join('  ') || 'empty';
      return card('🛏️', bd.names[st.bed], 'Better beds mean deeper sleep and more health.', st.bed < 2 ? b('upg', 'bed', `Upgrade ${bd.cost[st.bed]}🪙`, 'teal', st.coins < bd.cost[st.bed]) : '<b>MAX</b>')
        + card('😴', 'Take a nap', `1 hour · +${22 + 8 * st.bed} rest`, b('nap', '', 'Nap'))
        + card('🌙', 'Rest until nightfall', 'Skip ahead to tonight\'s raid, restoring rest.', b('laze', '', 'Rest', 'blue'))
        + card('🎒', `Bag ${S.bagUsed()}/${S.bagCap()}`, inv) + news('💡 Each night after the raid you come home and sleep until dawn.');
    },
    well() { return card('💧', 'Drink fresh water', '10 min · +45 water · free', b('drink', '', 'Drink', 'blue')) + news('The fountain has run clear for a hundred years. Townsfolk say it brings luck.'); },
    eatery() { return foodCards(); },
    academy() {
      const st = G.st; let h = news(`📖 Lessons take 90 min and some energy. A sharp mind earns bonus XP!`);
      for (const k in G.SKILLS) { const sk = G.SKILLS[k], s = st.skills[k], fee = 10 + 8 * s.l; h += card(sk.i, `${sk.n} · Lv ${s.l}`, `${sk.d}<div class="xp"><i style="width:${100 * s.xp / S.xpNeed(s.l)}%"></i></div>`, b('study', k, `${k === 'fit' ? 'Train' : 'Study'} ${fee}🪙`, '', st.coins < fee)); }
      return h;
    },
    guild() {
      const st = G.st; let h = card('👑', `Lv ${st.level} · ${G.rankName(st.level)}`, `Renown ${st.renown}/${S.lvNeed(st.level)} · Net worth ${S.netWorth()}🪙 · Nights won ${st.nightsWon} · Best streak ${st.bestStreak}`);
      h += card('🏛️', 'Grand Emporium Deed', st.won ? 'It is yours. Lanternfall bows to its Magnate!' : 'The ultimate prize. Requires Renown Lv 10.', st.won ? '<b>OWNED ✨</b>' : b('deed', '', G.DEED + '🪙', 'teal', st.coins < G.DEED || st.level < 10));
      h += card('🕯️', `Honor ${Math.round(st.honor)}/100`, 'Kept promises quiet the night. Broken ones walk in it.') + biz() + sec('Guild loans — 25% interest') + loans('guild', .25, 300);
      h += sec('Moon Shard perks', `🌙 ${st.shards}`);
      for (const k in G.PERKS) { const p = G.PERKS[k]; h += card(p.i, p.n, p.d, st.perks[k] ? '<b>OWNED</b>' : b('perk', k, p.c + '🌙', 'blue', st.shards < p.c)); }
      return h + news('🌙 Earn Moon Shards by gaining Renown levels, flawless raids and completing goals.');
    },
    bazaar() {
      const st = G.st, bg = G.UPG.bag;
      return sec('Hustle') + card('🎻', 'Busk for coins', `1 hour · pays ~${Math.round((10 + 6 * S.skill('charm')) * S.eff())}🪙 · trains Charm`, b('busk', '', 'Perform'))
        + card('🎒', `Bigger bag (${S.bagCap()} slots)`, 'Carry more goods between markets.', st.bag < 3 ? b('upg', 'bag', bg.cost[st.bag] + '🪙', 'teal', st.coins < bg.cost[st.bag]) : '<b>MAX</b>') + market('bazaar');
    },
    harbor() {
      return sec('Hustle') + card('📦', 'Haul crates', `2 hours · pays ~${Math.round((26 + 7 * S.skill('fit')) * S.eff())}🪙 · tiring`, b('haul', '', 'Work'))
        + card('🎣', 'Go fishing', '1 hour · catch fish to sell… or something rarer', b('fish', '', 'Fish', 'blue')) + travel() + market('harbor');
    },
    stall() {
      const st = G.st, sl = st.stall, sh = G.UPG.shelf, aw = G.UPG.awning; let h = card('💰', `Till: ${sl.till}🪙`, 'Earnings from customers. Collect them!', b('till', '', 'Collect', '', !sl.till));
      h += sec('On the shelf', `${S.shelfUsed()}/${S.shelfCap()}`);
      const ids = Object.keys(sl.stock); if (!ids.length) h += news('Your shelf is empty. Stock goods from your bag — townsfolk buy them all day at a premium, even while you work or study.');
      for (const id of ids) { const g = G.good(id); h += card(g.i, `${g.n} ×${sl.stock[id]}`, `Sells for ${S.stallPrice(id)}🪙 each`, b('unstock', id, 'Take back', 'plain')); }
      const inv = Object.keys(st.inv); if (inv.length) h += sec('In your bag');
      for (const id of inv) { const g = G.good(id), fl = S.shelfUsed() >= S.shelfCap(); h += card(g.i, `${g.n} ×${st.inv[id]}`, `Stall price ${S.stallPrice(id)}🪙 · paid ~${Math.round((st.cost[id] || 0) / st.inv[id])}`, b('stock', id + '|1', '+1', 'teal', fl) + b('stock', id + '|99', 'All', 'teal', fl)); }
      h += sec('Upgrades') + card('🪵', `Shelf space (${S.shelfCap()})`, 'Display more goods at once.', sl.shelf < 3 ? b('upg', 'shelf', sh.cost[sl.shelf] + '🪙', 'teal', st.coins < sh.cost[sl.shelf]) : '<b>MAX</b>')
        + card('⛱️', `Awning Lv ${sl.awning}`, 'A fancier stall sells for +10% per level.', sl.awning < 3 ? b('upg', 'awning', aw.cost[sl.awning] + '🪙', 'teal', st.coins < aw.cost[sl.awning]) : '<b>MAX</b>');
      h += sec('Defenses') + news(`🌙 Tonight: <b>${TD.wavesFor(st.day)} waves</b> of gloomlings${st.day % 5 === 0 ? ' — and the <b>Gloom King</b>!' : ''}. You have ${st.towers.length} tower${st.towers.length === 1 ? '' : 's'}. Build and upgrade more during the raid — keep coins in reserve!`);
      return h;
    }
  };
  function people(id) {
    const st = G.st; let h = '';
    for (const k in G.NPCS) {
      const P = G.NPCS[k]; if (P.city !== st.city || P.loc !== id) continue; const bd = st.bond[k] || 0, hot = G.D.hasStory(k);
      h += card(P.i, (hot ? '❗ ' : '') + P.n, P.role + (bd >= 20 ? ' · ' + '💛'.repeat(Math.min(5, bd / 20 | 0)) : ''), b('talk', k, 'Talk', hot ? '' : 'blue'));
    }
    return h;
  }
  acts.talk = id => G.D.open(id);
  const fareOf = c => { const a = G.st.city, r = G.route(a, c); return G.st.flags.halffare && (a === 'salt' || c === 'salt') && (a === 'lantern' || c === 'lantern') ? Math.ceil(r[0] / 2) : r[0]; };
  function travel() {
    const st = G.st; let h = sec('Travel');
    for (const c in G.CITIES) {
      if (c === st.city) continue; const C = G.CITIES[c], r = G.route(st.city, c), lock = st.level < C.lvl;
      h += card(C.i, C.n, lock ? `🔒 Needs Renown Lv ${C.lvl}` : `${r[3]} · ${r[1] / 60} hours`, lock ? '' : b('travel', c, fareOf(c) + '🪙', 'blue', st.coins < fareOf(c)));
    }
    return h + (st.city === 'lantern' ? news('🌙 If night falls while you are away, your towers defend the stall without you.') : '');
  }
  acts.travel = c => { const r = G.route(G.st.city, c); UI.doAction({ time: r[1], cost: fareOf(c), icon: r[2], label: `${r[3]} to ${G.CITIES[c].n}…`, run() { W.setCity(c, true); UI.curLoc = null; UI.toast(`${G.CITIES[c].i} Welcome to ${G.CITIES[c].n}`, 'gold'); S.renown(5); } }); };
  function loans(from, rate, per) {
    const st = G.st, L = st.loan;
    if (L) return card('📜', `You owe ${L.amt}🪙`, `To ${L.from === 'bank' ? 'the Counting House' : 'the Guild'} · due end of day ${L.due}${st.day > L.due ? ' · <b>OVERDUE</b>, growing 10% a day' : ''}`, b('repay', '', 'Repay', 'teal', st.coins < L.amt));
    let h = ''; for (const a of [.34, .67, 1]) { const amt = Math.round(per * st.level * a / 10) * 10, owe = Math.round(amt * (1 + rate)); h += card('💰', `Borrow ${amt}🪙`, `Repay ${owe}🪙 within 5 days. Default, and your honor pays instead.`, b('borrow', amt + '|' + owe + '|' + from, 'Sign', from === 'bank' ? 'blue' : 'red')); }
    return h;
  }
  acts.borrow = v => { const [amt, owe, from] = v.split('|'), st = G.st; if (st.loan) return; st.loan = { amt: +owe, due: st.day + 5, from }; st.coins += +amt; Au.sfx('coin'); UI.toast(`Borrowed ${amt}🪙 — a promise is a promise`, 'gold'); };
  acts.repay = () => { const st = G.st, L = st.loan; if (!L || st.coins < L.amt) return; st.coins -= L.amt; const late = st.day > L.due; st.loan = null; Au.sfx('good'); if (!late) S.honor(3); UI.toast('Debt cleared.', 'gold'); };
  function biz() {
    const st = G.st, cut = S.bizCut(); let h = sec('Business registry', cut ? `partners take ${Math.round(cut * 100)}%` : 'you keep 100%');
    for (const id in G.BIZ) {
      const B = G.BIZ[id], lv = st.biz[id];
      if (lv) { const uc = Math.round(B.cost * [.9, 1.6][lv - 1]); h += card(B.i, `${B.n} · Lv ${lv}`, `Earns about ${S.bizIncome(id)}🪙 a day, paid each dawn`, lv < 3 ? b('bizup', id, `Expand ${uc}🪙`, 'teal', st.coins < uc) : '<b>MAX</b>'); }
      else { const lock = !st.visited[B.city]; h += card(B.i, B.n, lock ? `🔒 Visit ${G.CITIES[B.city].n} first` : `${B.d} About ${B.inc}🪙 a day.`, lock ? '' : b('bizbuy', id, B.cost + '🪙', 'teal', st.coins < B.cost)); }
    }
    return h + news('💼 Short of capital? Pitch to an investor — Captain Hale, Ottoline Finch, Forge-Mother Brakka, or the Guildmistress. Each wants to hear something different, and each takes a share.');
  }
  acts.bizbuy = id => { const st = G.st, B = G.BIZ[id]; if (st.coins < B.cost || st.biz[id]) return; st.coins -= B.cost; st.biz[id] = 1; Au.sfx('lvl'); UI.toast(`${B.i} You now own a ${B.n}!`, 'gold'); S.renown(40); };
  acts.bizup = id => { const st = G.st, B = G.BIZ[id], lv = st.biz[id], uc = Math.round(B.cost * [.9, 1.6][lv - 1]); if (!lv || lv >= 3 || st.coins < uc) return; st.coins -= uc; st.biz[id]++; Au.sfx('lvl'); UI.toast(`${B.i} ${B.n} expanded`, 'gold'); S.renown(30); };
  const inn = () => { const st = G.st; return foodCards() + card('🚰', 'Pitcher of water', '10 min · +45 water', b('innwater', '', '3🪙', 'blue', st.coins < 3)) + card('🔥', 'Nap by the fire', '1 hour · +24 rest', b('innnap', '', '8🪙', '', st.coins < 8)) + sec('Games') + card('🎲', 'Crown & Anchor', 'Call the dice. Win and your stake doubles; lose and it is gone.', b('dice', 20, 'Bet 20', 'red', st.coins < 20) + b('dice', 100, 'Bet 100', 'red', st.coins < 100)) + news('🌙 When night falls away from home you sleep here (15🪙).'); };
  LOC.s_inn = inn; LOC.e_inn = inn; LOC.s_market = () => market('salt'); LOC.e_market = () => market('ember');
  LOC.s_bank = () => sec('Loans — 15% interest') + loans('bank', .15, 150) + news('🏦 The Counting House also backs sound businesses. Talk to Ottoline Finch — bring figures, not charm.');
  LOC.s_light = () => card('🔦', 'Trim the great lamp', `90 min · pays ~${Math.round((24 + 6 * S.skill('craft')) * S.eff())}🪙 · trains Craft`, b('lamp', '', 'Work')) + news('The Saltmere light has not gone dark in two hundred years.');
  LOC.s_dock = () => sec('Hustle') + card('🧂', 'Rake the salt pans', '2 hours · tiring · you keep the salt you rake', b('rake', '', 'Work')) + travel();
  LOC.e_gate = () => travel() + news('🐪 Caravans leave from here for the coast and the northern pass.');
  LOC.e_forge = () => card('🔥', 'Work the bellows', `2 hours · pays ~${Math.round((38 + 9 * S.skill('fit')) * S.eff())}🪙 · very tiring`, b('bellows', '', 'Work'));
  LOC.e_mine = () => card('⛏️', 'Mine the seam', '2 hours · exhausting · iron, a little coin, and now and then a gem', b('mine', '', 'Dig'));
  acts.innwater = () => UI.doAction({ time: 10, cost: 3, icon: '🚰', label: 'Drinking…', run() { S.need('water', 45); S.count('drink'); Au.sfx('drink'); } });
  acts.innnap = () => UI.doAction({ time: 60, cost: 8, icon: '😴', label: 'Dozing by the fire…', run() { S.need('rest', 24); } });
  acts.dice = v => { const st = G.st, bet = +v; if (st.coins < bet) return; if (Math.random() < .47) { st.coins += bet; Au.sfx('coin'); UI.toast(`🎲 The dice love you: +${bet}🪙`, 'gold'); } else { st.coins -= bet; Au.sfx('bad'); UI.toast(`🎲 Snake eyes: −${bet}🪙`, 'bad'); } };
  acts.lamp = () => UI.doAction({ time: 90, tire: 12, icon: '🔦', label: 'Trimming the lamp…', mini: 'Steady hands!', run(m) { paid(Math.round((24 + 6 * S.skill('craft')) * m * S.eff()), 'Keeper\'s wage'); S.count('job'); S.renown(6); S.addXp('craft', 8); } });
  acts.bellows = () => UI.doAction({ time: 120, tire: 28, icon: '🔥', label: 'Working the bellows…', mini: 'Keep the rhythm!', run(m) { paid(Math.round((38 + 9 * S.skill('fit')) * m * S.eff()), 'Forge pay'); S.need('water', -12); S.count('job'); S.renown(9); S.addXp('fit', 7); } });
  const gain = (id, q) => { const st = G.st; q = Math.min(q, S.bagCap() - S.bagUsed()); if (q > 0) { st.inv[id] = (st.inv[id] || 0) + q; st.cost[id] = st.cost[id] || 0; } return q; };
  acts.rake = () => UI.doAction({ time: 120, tire: 24, icon: '🧂', label: 'Raking salt…', run() { const q = gain('salt', U.ri(3, 5)); UI.toast(q ? `🧂 You raked ${q} sacks of salt` : 'Your bag is full — the salt stays on the pans', q ? 'gold' : 'bad'); S.need('water', -10); S.count('job'); S.renown(6); S.addXp('fit', 5); } });
  acts.mine = () => UI.doAction({ time: 120, tire: 30, icon: '⛏️', label: 'Mining…', mini: 'Strike true!', run(m) { const q = gain('iron', Math.round(U.ri(1, 2) * m)); let msg = `⛓️ ${q} iron`; if (Math.random() < .1 * m && gain('gems', 1)) { msg += ' and a 💎 GEM!'; Au.sfx('lvl'); } G.st.coins += 12; UI.toast(msg + ' +12🪙', 'gold'); S.need('water', -10); S.need('food', -6); S.count('job'); S.renown(9); S.addXp('fit', 7); } });
  UI.openLoc = function (id) { if (G.st.time >= G.DUSK || G.mode !== 'day') return; const l = W.loc(id); if (!l) return; UI.curLoc = id; UI.sheet(l.i + ' ' + l.n, () => people(id) + LOC[id]()); Au.sfx('tap'); };
  acts.nap = () => { const bed = G.st.bed; UI.doAction({ time: 60, icon: '😴', label: 'Napping…', run() { S.need('rest', 22 + 8 * bed); UI.toast('You feel refreshed 😌'); } }); };
  acts.laze = () => { const st = G.st, t = Math.max(5, G.DUSK - st.time); UI.doAction({ time: t, icon: '💤', label: 'Resting until nightfall…', run() { S.need('rest', t * .13 * (1 + .25 * st.bed)); } }); };
  acts.drink = () => UI.doAction({ time: 10, icon: '💧', label: 'Drinking…', run() { S.need('water', 45); S.need('rest', 2); S.count('drink'); Au.sfx('drink'); A.burst(W.p.x, G.gy - 60, 10, '#8fe0ff', 120); } });
  acts.eat = i => {
    const f = FOOD[i], st = G.st;
    if (f.pack) { if (st.coins < f.c) return; st.coins -= f.c; st[f.pack]++; Au.sfx('buy'); UI.toast(`${f.i} Packed for later`); G.save(); return; }
    UI.doAction({ time: f.t, cost: fprice(f), icon: f.i, label: `Enjoying ${f.n}…`, run() { if (f.food) { S.need('food', f.food); if (f.food >= 25) S.count('eat'); } if (f.water) S.need('water', f.water); if (f.rest) S.need('rest', f.rest); if (f.fed) { st.fed = true; UI.toast('💪 Well fed! +20% pay & XP today', 'gold'); } Au.sfx('eat'); } });
  };
  acts.study = k => { const s = G.st.skills[k], sk = G.SKILLS[k]; UI.doAction({ time: 90, tire: 16, cost: 10 + 8 * s.l, icon: sk.i, label: k === 'fit' ? 'Training…' : `Studying ${sk.n}…`, mini: k === 'fit' ? 'Push through!' : 'Focus!', run(m) { const xp = Math.round(34 * m * S.eff()); UI.toast(`${sk.i} +${xp} ${sk.n} XP`); S.addXp(k, xp); S.count('study'); S.renown(6); } }); };
  const paid = (pay, msg) => { G.st.coins += pay; UI.toast(`${msg} +${pay}🪙`, 'gold'); Au.sfx('coin'); A.coins(W.p.x, G.gy - 70, 6); };
  acts.haul = () => UI.doAction({ time: 120, tire: 26, icon: '📦', label: 'Hauling crates…', mini: 'Heave!', run(m) { paid(Math.round((26 + 7 * S.skill('fit')) * m * S.eff()), 'Dock pay'); S.need('food', -6); S.need('water', -8); S.count('job'); S.renown(8); S.addXp('fit', 6); } });
  acts.busk = () => UI.doAction({ time: 60, tire: 10, icon: '🎻', label: 'Performing…', mini: 'Find the rhythm!', run(m) { paid(Math.round((10 + 6 * S.skill('charm')) * m * S.eff()), 'Tips'); S.count('job'); S.renown(5); S.addXp('charm', 6); } });
  acts.fish = () => UI.doAction({
    time: 60, tire: 8, icon: '🎣', label: 'Fishing…', run() {
      const st = G.st, r = Math.random(); S.count('fish'); S.renown(4);
      if (r < .07) paid(80, '🦪 A pearl!'); else if (r < .2) UI.toast('🥾 Just an old boot…');
      else { const n = Math.min(U.ri(1, 3), S.bagCap() - S.bagUsed()); if (n > 0) { st.inv.fish = (st.inv.fish || 0) + n; st.cost.fish = st.cost.fish || 0; UI.toast(`🐟 Caught ${n} fish!`); Au.sfx('good'); } else paid(8, 'Bag full — sold the catch'); }
    }
  });
  acts.till = () => { const st = G.st, n = st.stall.till; if (!n) return; st.coins += n; st.stall.till = 0; Au.sfx('coin'); A.coins(W.p.x, G.gy - 70, Math.min(14, 3 + n / 10 | 0)); UI.toast(`Collected +${n}🪙`, 'gold'); };
  acts.stock = v => { const [id, n] = v.split('|'); if (S.stock(id, +n)) Au.sfx('buy'); else UI.toast('Shelf is full', 'bad'); };
  acts.unstock = id => { if (!S.unstock(id)) UI.toast('Your bag is full!', 'bad'); else Au.sfx('tap'); };
  acts.upg = k => {
    const st = G.st, o = k === 'bed' ? st : k === 'bag' ? st : st.stall, key = k, cost = G.UPG[k].cost[o[key]];
    if (cost === undefined || st.coins < cost) return; st.coins -= cost; o[key]++; Au.sfx('lvl'); UI.toast('✨ Upgraded!', 'gold'); S.renown(10); A.burst(W.p.x, G.gy - 60, 18, '#ffe066', 200, 'spark');
  };
  acts.perk = k => { const st = G.st, p = G.PERKS[k]; if (st.shards < p.c || st.perks[k]) return; st.shards -= p.c; st.perks[k] = true; Au.sfx('lvl'); UI.toast(`${p.i} ${p.n} acquired!`, 'gold'); };
  acts.deed = () => { const st = G.st; if (st.coins < G.DEED || st.level < 10) return; st.coins -= G.DEED; st.won = true; G.save(); UI.closeSheet(); Au.sfx('lvl'); UI.modal(`<div class="big-emo">🏛️</div><h1>Market Magnate!</h1><p>From a straw mat and sixty coins to the deed of the Grand Emporium in <b>${st.day} days</b>. Lanternfall is yours.</p><p>The nights grow darker still — keep playing as long as you like.</p>`, [{ t: '✨ Onward!' }]); };

  /* ---------- goals / menu ---------- */
  UI.goals = function () {
    UI.curLoc = null;
    UI.sheet('📜 Today\'s Goals', () => {
      const st = G.st; let h = sec('Story') + news('📖 ' + G.D.objective()) + sec('Today');
      for (const q of st.quests) h += `<div class="q ${q.done ? 'done' : ''}">${q.done ? '✅' : '⬜'} ${q.t} <small>(${Math.min(q.n, st.counters[q.c] || 0)}/${q.n})</small><span class="qr">${q.r}🪙${q.sh ? ' ' + q.sh + '🌙' : ''}</span></div>`;
      if (st.contracts.length) { h += sec('Promises to keep'); for (const c of st.contracts) { const g = G.good(c.good); h += news(`📦 ${c.qty}× ${g.i} ${g.n} to <b>${G.NPCS[c.npc].n}</b> (${G.CITIES[G.NPCS[c.npc].city].n}) by day ${c.due} · ${c.pay}🪙`); } }
      if (st.loan) h += news(`📜 You owe ${st.loan.amt}🪙, due day ${st.loan.due}.`);
      h += sec('Your name') + news(`🕯️ Honor <b>${Math.round(st.honor)}</b>/100 — ${st.honor >= 70 ? 'your word is gold, and the nights are gentler for it' : st.honor >= 40 ? 'you are known as fair enough' : 'broken promises walk at night, and yours are among them'}.`);
      h += sec('Market news'); for (const e of st.events) h += news('📣 ' + e.txt);
      h += news(S.skill('trade') >= 2 && st.nextEvents[0] ? '🔮 Rumor for tomorrow: ' + st.nextEvents[0].txt : '🔮 Reach <b>Trade Lv 2</b> to hear rumors about tomorrow\'s prices.');
      h += sec('Tonight') + news(`🌙 Night ${st.day}: ${TD.wavesFor(st.day)} waves at dusk (21:00). Flawless streak: 🔥 ${st.streak}`);
      return h;
    });
  };
  const HOW = `<p style="text-align:left">☀️ <b>By day</b> — tap a building to walk there. Keep your <b>food, water and rest</b> up or your health and earnings suffer.</p><p style="text-align:left">⚖️ <b>Trade</b> — goods are cheap where they are made. Buy at one market, sell at the other, or stock <b>your stall</b> for steady sales.</p><p style="text-align:left">📚 <b>Study &amp; hustle</b> — lessons raise skills; dock work and busking pay coins.</p><p style="text-align:left">🌙 <b>By night</b> — gloomlings raid your stall. Tap the glowing pads to build towers. Keep some coins for defense!</p><p style="text-align:left">💬 <b>People</b> — talk to named characters (look for ❗). Haggle, take on orders, pitch investors, follow the story. Keep your promises: broken ones make the nights worse.</p><p style="text-align:left">🏛️ <b>Goal</b> — buy the Grand Emporium deed at the Guild Hall.</p>`;
  UI.menu = function () {
    UI.curLoc = null;
    UI.sheet('⚙️ Menu', () => card('💾', `Save game · Slot ${G.slot}`, 'The game also saves by itself after every action.', b('savenow', '', 'Save now', 'teal'))
      + card('📤', 'Export save code', 'Copy your save to back it up or move it to another device.', b('export', '', 'Export', 'blue'))
      + card('🚪', 'Save & exit', 'Back to the title screen to switch slots.', b('exit', '', 'Exit', 'plain'))
      + card('🔊', 'Sound effects', Au.on ? 'On' : 'Off', b('snd', '', Au.on ? 'Turn off' : 'Turn on', 'plain')) + card('🎵', 'Music', Au.music ? 'On' : 'Off', b('mus', '', Au.music ? 'Turn off' : 'Turn on', 'plain'))
      + card('❓', 'How to play', 'A quick refresher', b('how', '', 'Read', 'blue')) + card('🗑️', 'Delete this save', `Erase Slot ${G.slot} and return to the title screen`, b('reset', '', 'Delete', 'red')));
  };
  acts.savenow = () => { if (G.save()) { Au.sfx('good'); UI.toast(`💾 Saved to Slot ${G.slot}`, 'gold'); } else UI.toast('Could not save — storage is blocked or full', 'bad'); };
  acts.exit = () => { G.save(); location.reload(); };
  acts.export = () => {
    UI.modal('<h1>Your save code</h1><p>Copy this somewhere safe. Paste it into “Import” on the title screen to restore it — on this device or another.</p><textarea class="code" id="expCode" readonly></textarea>', [{ t: '📋 Copy', cls: 'teal', fn() { const ta = $('expCode'); ta.select(); try { navigator.clipboard.writeText(ta.value).then(() => UI.toast('Copied!', 'gold'), () => { document.execCommand('copy'); UI.toast('Copied!', 'gold'); }); } catch (e) { document.execCommand('copy'); UI.toast('Copied!', 'gold'); } } }, { t: 'Close', cls: 'plain' }]);
    $('expCode').value = G.exportCode();
  };
  acts.snd = () => { Au.on = !Au.on; }; acts.mus = () => { Au.music = !Au.music; };
  acts.how = () => UI.modal('<h1>How to play</h1>' + HOW, [{ t: 'Got it' }]);
  acts.reset = () => UI.modal('<div class="big-emo">🗑️</div><h1>Delete this save?</h1><p>Slot ' + G.slot + ' will be erased for good.</p>', [{ t: 'Cancel', cls: 'plain' }, { t: 'Delete', cls: 'red', fn() { G.playing = false; G.wipe(G.slot); location.reload(); } }]);

  /* ---------- tower defense UI ---------- */
  UI.towerSheet = function (pad) {
    const w0 = TD.towerAt(pad), ty0 = w0 && TD.TYPES[w0.type]; UI.curLoc = null;
    UI.sheet(w0 ? `${ty0.i} ${ty0.n} · Lv ${w0.lvl}` : '🔨 Build a tower', () => {
      const st = G.st, w = TD.towerAt(pad); let h = '';
      if (w) {
        const ty = TD.TYPES[w.type];
        h += card(ty.i, ty.d, `Range ${Math.round(TD.rangeOf(w))} · Level ${w.lvl}/3`, w.lvl < 3 ? b('tup', pad, `Upgrade ${TD.cost(w.type, w.lvl + 1)}🪙`, 'teal', st.coins < TD.cost(w.type, w.lvl + 1)) : '<b>MAX</b>');
        h += card('💸', 'Sell tower', 'Recover 60% of what you spent.', b('tsell', pad, `+${TD.sellValue(pad)}🪙`, 'red'));
      } else for (const k in TD.TYPES) {
        const ty = TD.TYPES[k], lock = S.skill('craft') < ty.need, c = TD.cost(k, 1);
        h += card(ty.i, ty.n, lock ? `🔒 Needs Craft Lv ${ty.need} (Academy)` : ty.d, lock ? '' : b('tbuild', pad + '|' + k, c + '🪙', '', st.coins < c));
      }
      return h;
    });
  };
  acts.tbuild = v => { const [pad, k] = v.split('|'); if (TD.build(+pad, k)) UI.closeSheet(); };
  acts.tup = pad => { if (TD.upgrade(+pad)) UI.towerSheet(+pad); };
  acts.tsell = pad => { TD.sell(+pad); UI.closeSheet(); };
  UI.dusk = function () {
    const st = G.st; G.duskLock = true; UI.closeSheet(); Au.sfx('pop');
    if (st.city !== 'lantern') { const C = G.CITIES[st.city]; return UI.modal(`<div class="big-emo">🛏️</div><h1>Night in ${C.n}</h1><p>Too far to reach your stall tonight. You take a room at the inn while your towers stand watch alone.</p><div class="line">Room: −15🪙</div>`, [{ t: '😴 Sleep', cls: 'blue', fn() { UI.fade('Day ' + (st.day + 1), () => { const line = S.awayRaid(); st.coins = Math.max(0, st.coins - 15); S.newDay(); G.duskLock = false; UI.hud(); setTimeout(() => UI.toast(line, line.startsWith('💀') ? 'bad' : 'gold'), 900); }); } }]); }
    UI.modal(`<div class="big-emo">🌙</div><h1>Night falls…</h1><p>Lanterns flicker on, and <b>gloomlings</b> creep from the shadows, hungry for your coins.</p><div class="line">Night ${st.day} · ${TD.wavesFor(st.day)} waves${st.day % 5 === 0 ? ' · 👑 Gloom King' : ''}</div><div class="line">You have ${st.coins}🪙 for defenses</div>`,
      [{ t: '⚔️ Defend the stall!', cls: 'red', fn() { UI.fade('Night ' + st.day, () => { G.setMode('td'); TD.start(); }); } }]);
  };
  UI.raidResult = function (r) {
    const st = G.st; UI.closeSheet();
    UI.modal(`<div class="big-emo">${r.win ? (r.perfect ? '🌟' : '🛡️') : '💀'}</div><h1>${r.win ? (r.perfect ? 'Flawless defense!' : 'Stall defended!') : 'Stall ransacked…'}</h1>
      <div class="line">👻 Banished ${r.kills} · Bounties +${r.earned}🪙${r.stolen ? ` · Stolen −${r.stolen}🪙` : ''}</div>${r.lines.map(l => `<div class="line">${l}</div>`).join('')}`,
      [{ t: '😴 Go home & sleep', cls: 'blue', fn() { UI.fade('Day ' + (st.day + 1), () => { S.newDay(); G.setMode('day'); W.reset(); G.duskLock = false; UI.hud(); setTimeout(() => { for (const e of st.events) UI.toast('📣 ' + e.txt); }, 900); }); } }]);
  };

  /* ---------- wiring ---------- */
  UI.init = function () {
    UI.buildTravel = () => { $('travel').innerHTML = W.LOCS.map(l => `<button class="tb" data-id="${l.id}" title="${l.n}">${l.i}</button>`).join(''); }; UI.buildTravel();
    $('travel').addEventListener('click', e => { const t = e.target.closest('.tb'); if (!t || G.busy) return; Au.sfx('tap'); UI.closeSheet(); W.goTo(t.dataset.id); });
    $('sheetBody').addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (!t || t.disabled) return; const f = acts[t.dataset.a]; if (f) { f(t.dataset.v); G.save(); UI.rerender(); } });
    $('sheetX').onclick = () => { Au.sfx('tap'); UI.closeSheet(); };
    $('enter').onclick = () => { if (W.near) W.goTo(W.near.id); };
    $('bGoals').onclick = () => { Au.sfx('tap'); UI.goals(); }; $('bMenu').onclick = () => { Au.sfx('tap'); UI.menu(); };
    $('bSnack').onclick = () => { const st = G.st; if (st.snacks > 0) { st.snacks--; S.need('food', 30); Au.sfx('eat'); UI.toast('🥪 +30 food'); UI.hud(); } };
    $('bFlask').onclick = () => { const st = G.st; if (st.flasks > 0) { st.flasks--; S.need('water', 40); Au.sfx('drink'); UI.toast('🧴 +40 water'); UI.hud(); } };
    $('bWave').onclick = () => TD.startWave(); $('bSpeed').onclick = () => TD.toggleSpeed();
    G.st = G.newState(); S.init(true);
    const ago = t => { if (!t) return ''; const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return ' · saved ' + (m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'); };
    const begin = (slot, fresh) => {
      Au.init(); G.slot = slot;
      if (fresh) { G.st = G.newState(); S.init(true); } else { if (!G.load(slot)) return UI.toast('That save could not be read', 'bad'); S.init(false); if (G.st.time >= G.DUSK) G.st.time = G.DUSK - 1; }
      G.playing = true; G.save();
      $('title').classList.add('hide'); G.duskLock = false; G.setMode('day'); W.reset(); UI.hud();
      if (fresh) UI.modal('<div class="big-emo">🏮</div><h1>Welcome to Lanternfall</h1><p>You arrive with <b>60 coins</b>, a cart for a stall, and one old slingshot tower.</p>' + HOW, [{ t: 'Let\'s hustle! ☀️' }]);
    };
    const slots = () => {
      let h = '';
      for (let n = 1; n <= G.SLOTS; n++) {
        const s = G.peek(n);
        h += s ? `<div class="slot"><div class="sm"><b>Slot ${n} · Day ${s.day}</b><span>Lv ${s.level} ${G.rankName(s.level)} · ${s.coins}🪙 · ${(G.CITIES[s.city] || G.CITIES.lantern).n}${ago(s.savedAt)}</span></div><button class="b" data-play="${n}">▶ Play</button><button class="b red sm" data-del="${n}">🗑</button></div>`
          : `<div class="slot"><div class="sm"><b>Slot ${n}</b><span>Empty</span></div><button class="b teal" data-new="${n}">✨ New game</button></div>`;
      }
      $('slots').innerHTML = h;
    };
    slots();
    $('slots').addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
      if (d.play) begin(+d.play, false); else if (d.new) begin(+d.new, true);
      else if (d.del) UI.modal(`<div class="big-emo">🗑️</div><h1>Delete Slot ${d.del}?</h1><p>This save will be erased for good.</p>`, [{ t: 'Cancel', cls: 'plain' }, { t: 'Delete', cls: 'red', fn() { G.wipe(+d.del); slots(); } }]);
    });
    $('bImport').onclick = () => UI.modal('<h1>Import a save</h1><p>Paste a save code, then choose which slot to put it in. Whatever is in that slot will be replaced.</p><textarea class="code" id="impCode" placeholder="Paste your save code here"></textarea>',
      [1, 2, 3].map(n => ({ t: 'Slot ' + n, cls: 'teal', fn() { try { G.importCode($('impCode').value, n); slots(); UI.toast(`Imported into Slot ${n}`, 'gold'); } catch (e) { UI.toast('That code is not a valid save', 'bad'); } } })).concat([{ t: 'Cancel', cls: 'plain' }]));
  };
})();
