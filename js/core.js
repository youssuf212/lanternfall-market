'use strict';
/* Lanternfall Market — core: utils, data tables, state, save */
const G = window.G = { mode: 'title', vw: 520, vh: 900, gy: 700, t: 0, lights: [] };
const U = window.U = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a),
  ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: a => a[Math.floor(Math.random() * a.length)],
  seeded(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },
  hash(n) { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); },
  ease: t => t * t * (3 - 2 * t),
  clock(min) { const h = Math.floor(min / 60) % 24, m = Math.floor(min % 60); return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
};

G.DAY_START = 360; G.DUSK = 1260; G.DEED = 6000;

G.MKT = { bazaar: { n: 'Bazaar', city: 'lantern' }, harbor: { n: 'Harbor', city: 'lantern' }, salt: { n: 'Saltmere Market', city: 'salt' }, ember: { n: 'Emberhold Market', city: 'ember' } };
G.GOODS = [
  { id: 'dates', n: 'Dates', i: '🌴', base: 8, vol: .05, home: ['bazaar'], cities: ['lantern'] },
  { id: 'spice', n: 'Spice', i: '🌶️', base: 18, vol: .07, home: ['bazaar'], cities: ['lantern'] },
  { id: 'pottery', n: 'Pottery', i: '🏺', base: 30, vol: .05, home: ['bazaar'], cities: ['lantern'] },
  { id: 'oil', n: 'Lamp Oil', i: '🪔', base: 45, vol: .06, home: ['bazaar'], cities: ['lantern'] },
  { id: 'fish', n: 'Fish', i: '🐟', base: 12, vol: .08, home: ['harbor', 'salt'], cities: ['lantern', 'salt'] },
  { id: 'tea', n: 'Tea', i: '🍵', base: 24, vol: .06, home: ['harbor'], cities: ['lantern'] },
  { id: 'silk', n: 'Silk', i: '🧵', base: 70, vol: .07, home: ['harbor'], cities: ['lantern'] },
  { id: 'salt', n: 'Sea Salt', i: '🧂', base: 14, vol: .06, home: ['salt'], cities: ['salt'] },
  { id: 'furs', n: 'Furs', i: '🧥', base: 85, vol: .07, home: ['salt'], cities: ['salt'] },
  { id: 'iron', n: 'Iron', i: '⛓️', base: 38, vol: .06, home: ['ember'], cities: ['ember'] },
  { id: 'glass', n: 'Glasswork', i: '🔮', base: 60, vol: .07, home: ['ember'], cities: ['ember'] },
  { id: 'gems', n: 'Gems', i: '💎', base: 160, vol: .09, home: ['ember'], cities: ['ember'] }
];
G.good = id => G.GOODS.find(g => g.id === id);
G.CITIES = { lantern: { n: 'Lanternfall', i: '🏮', lvl: 1 }, salt: { n: 'Saltmere', i: '❄️', lvl: 2 }, ember: { n: 'Emberhold', i: '🌋', lvl: 4 } };
G.ROUTES = { 'lantern|salt': [25, 180, '⛵', 'Sailing'], 'lantern|ember': [35, 240, '🐪', 'Riding with the caravan'], 'salt|ember': [45, 300, '🛷', 'Crossing the pass'] };
G.route = (a, b) => G.ROUTES[a + '|' + b] || G.ROUTES[b + '|' + a];
G.BIZ = {
  tea: { n: 'Tea House', i: '🫖', city: 'lantern', cost: 400, inc: 42, d: 'A quiet room off the Bazaar. Steady trade.' },
  boat: { n: 'Fishing Boat', i: '⛵', city: 'salt', cost: 700, inc: 78, d: 'A crewed boat out of Saltmere. Good years and bad.' },
  caravan: { n: 'Spice Caravan', i: '🐪', city: 'lantern', cost: 1000, inc: 115, d: 'Six camels and a route nobody else wants.' },
  glassworks: { n: 'Glassworks', i: '🔮', city: 'ember', cost: 1600, inc: 190, d: 'A furnace hall in Emberhold. Hot, loud, lucrative.' }
};
G.NPCS = {
  zuri: { n: 'Mama Zuri', i: '👩‍🍳', role: 'Cook, and keeper of everyone\'s secrets', city: 'lantern', loc: 'eatery', off: 96, look: { top: '#ef5350', robe: true, skin: '#8a5a3c', hair: '#1a1830', hat: 'turban', hatc: '#fff3d8' } },
  bo: { n: 'Old Bo', i: '👴', role: 'Retired night-watchman', city: 'lantern', loc: 'stall', off: -150, look: { top: '#6a7a8a', bot: '#3a3560', skin: '#b87a50', hair: '#c9c0d8', hat: 'cap', hatc: '#4a5a6a' } },
  idris: { n: 'Professor Idris Quill', i: '👨‍🏫', role: 'Scholar of the dark', city: 'lantern', loc: 'academy', off: 160, look: { top: '#7a4fd0', robe: true, skin: '#d99a6c', hair: '#3a2540' } },
  vessa: { n: 'Guildmistress Vessa Marrow', i: '👩‍⚖️', role: 'Keeper of the Guild ledgers', city: 'lantern', loc: 'guild', off: -150, look: { top: '#2a2540', robe: true, skin: '#f7cfa6', hair: '#c9c0d8' }, invest: { cap: 1000, cut: .4 }, likes: 'bold', hates: 'honest' },
  pepper: { n: 'Nadia "Pepper" Okoro', i: '👩‍🦱', role: 'Spice merchant, your nearest rival', city: 'lantern', loc: 'bazaar', off: -110, look: { top: '#f2b033', skin: '#8a5a3c', hair: '#1a1830', bot: '#5a3a4a' }, mk: 'bazaar', likes: 'bold', hates: 'flatter', work: true },
  hale: { n: 'Captain Rourke Hale', i: '🧔', role: 'Master of the Dawn Heron', city: 'lantern', loc: 'harbor', off: 110, look: { top: '#2a4a7a', skin: '#f0b98a', hair: '#6a3a2a', hat: 'cap', hatc: '#1a2a4a', bot: '#fff3d8' }, mk: 'harbor', likes: 'bold', hates: 'logic', invest: { cap: 400, cut: .25 }, work: true },
  ysolde: { n: 'Ysolde Brine', i: '👵', role: 'Fishwife, sharpest tongue in the north', city: 'salt', loc: 's_market', off: 120, look: { top: '#5a8aa8', robe: true, skin: '#f7cfa6', hair: '#c9c0d8', hat: 'hood' }, mk: 'salt', likes: 'logic', hates: 'bold', work: true },
  finch: { n: 'Ottoline Finch', i: '👩‍💼', role: 'Senior teller, Saltmere Counting House', city: 'salt', loc: 's_bank', off: -150, look: { top: '#3a5a4a', robe: true, skin: '#f0b98a', hair: '#6a3a2a' }, invest: { cap: 800, cut: .2 }, likes: 'logic', hates: 'flatter' },
  tamsin: { n: 'Tamsin', i: '🧑‍🦱', role: 'Keeper of the Saltmere light', city: 'salt', loc: 's_light', off: 120, look: { top: '#c9785a', skin: '#8a5a3c', hair: '#1a1830', bot: '#3a3560' } },
  kaz: { n: 'Kazimir Ash', i: '👳', role: 'Dealer in anything that glitters', city: 'ember', loc: 'e_market', off: -110, look: { top: '#c2185b', robe: true, skin: '#d99a6c', hair: '#1a1830', hat: 'turban', hatc: '#ffc94a' }, mk: 'ember', likes: 'flatter', hates: 'logic', work: true },
  brakka: { n: 'Forge-Mother Brakka', i: '👩‍🏭', role: 'Master smith of Emberhold', city: 'ember', loc: 'e_forge', off: 160, look: { top: '#5a4a4a', skin: '#b87a50', hair: '#ef5350', bot: '#2a2530' }, invest: { cap: 600, cut: .15 }, likes: 'honest', hates: 'flatter' }
};

G.SKILLS = {
  trade: { n: 'Trade', i: '⚖️', d: 'Better prices, rumors, sharper haggling' },
  craft: { n: 'Craft', i: '🔧', d: 'Stronger, cheaper defenses; new towers' },
  fit: { n: 'Fitness', i: '💪', d: 'Better labour pay, less tiring work' },
  charm: { n: 'Charm', i: '✨', d: 'Stall sells for more; people warm to you' }
};

G.RANKS = [[1, 'Street Rat'], [3, 'Peddler'], [5, 'Hawker'], [8, 'Merchant'], [12, 'Trade Prince'], [16, 'Magnate']];
G.rankName = lv => { let r = G.RANKS[0][1]; for (const [l, n] of G.RANKS) if (lv >= l) r = n; return r; };

G.PERKS = {
  boots: { n: 'Swift Boots', i: '👢', c: 2, d: 'Walk 35% faster' },
  canteen: { n: 'Iron Stomach', i: '🫙', c: 2, d: 'Hunger & thirst drain 20% slower' },
  bell: { n: 'Brass Bell', i: '🔔', c: 3, d: 'Stall sells 30% faster' },
  lens: { n: 'Eagle Lens', i: '🔭', c: 3, d: 'Towers gain +15% range' },
  lucky: { n: 'Lucky Coin', i: '🍀', c: 3, d: 'Raid bounties +30%' }
};

G.UPG = {
  bag: { caps: [10, 16, 24, 36], cost: [80, 220, 600] },
  shelf: { caps: [6, 10, 16, 24], cost: [100, 300, 700] },
  awning: { cost: [150, 400, 900] },
  bed: { names: ['Straw Mat', 'Wooden Cot', 'Feather Bed'], cost: [120, 450] }
};

G.newState = function () {
  const mk = () => { const f = {}, hist = {}; G.GOODS.forEach(g => { f[g.id] = 1; hist[g.id] = []; }); return { f, hist }; };
  const sk = () => ({ l: 0, xp: 0 });
  return {
    v: 1, day: 1, time: G.DAY_START, coins: 60, shards: 0,
    needs: { food: 78, water: 70, rest: 92 }, health: 100,
    skills: { trade: sk(), craft: sk(), fit: sk(), charm: sk() },
    renown: 0, level: 1,
    inv: {}, cost: {}, bag: 0, snacks: 0, flasks: 0,
    stall: { stock: {}, shelf: 0, awning: 0, till: 0 },
    bed: 0, towers: [{ pad: 3, type: 'sling', lvl: 1 }],
    market: { bazaar: mk(), harbor: mk(), salt: mk(), ember: mk() }, events: [], nextEvents: [],
    city: 'lantern', visited: { lantern: 1 }, bond: {}, honor: 50, main: 0, ending: null,
    contracts: [], biz: {}, investors: {}, loan: null, deals: {}, chat: {}, pitchCd: {},
    quests: [], counters: {}, streak: 0, bestStreak: 0, nightsWon: 0,
    fed: false, flags: {}, perks: {}, won: false, px: 320,
    stats: { profit: 0, kills: 0, sold: 0 }
  };
};

/* ---------- saves: three slots, plus export / import codes ---------- */
G.slot = 1; G.playing = false; G.SLOTS = 3;
const SKEY = n => 'lanternfall_s' + n;
try { const old = localStorage.getItem('lanternfall_v1'); if (old) { if (!localStorage.getItem(SKEY(1))) localStorage.setItem(SKEY(1), old); localStorage.removeItem('lanternfall_v1'); } } catch (e) { }
G.hydrate = function (s) {
  if (!s || s.v !== 1 || !s.skills || !s.needs) return null;
  const st = Object.assign(G.newState(), s);
  for (const mk in G.MKT) {
    st.market[mk] = st.market[mk] || { f: {}, hist: {} };
    for (const g of G.GOODS) { if (st.market[mk].f[g.id] === undefined) st.market[mk].f[g.id] = 1; st.market[mk].hist[g.id] = st.market[mk].hist[g.id] || []; }
  }
  const ok = e => G.MKT[e.mk] && G.good(e.id);
  st.events = (st.events || []).filter(ok); st.nextEvents = (st.nextEvents || []).filter(ok);
  if (!G.CITIES[st.city]) st.city = 'lantern';
  return st;
};
G.save = function () { if (!G.playing || !G.st) return false; try { G.st.savedAt = Date.now(); localStorage.setItem(SKEY(G.slot), JSON.stringify(G.st)); return true; } catch (e) { return false; } };
G.peek = function (slot) { try { const s = JSON.parse(localStorage.getItem(SKEY(slot))); return s && s.v === 1 && s.skills ? s : null; } catch (e) { return null; } };
G.load = function (slot) { const st = G.hydrate(G.peek(slot)); if (!st) return false; G.st = st; G.slot = slot; return true; };
G.wipe = function (slot) { try { localStorage.removeItem(SKEY(slot || G.slot)); } catch (e) { } };
G.exportCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(G.st))));
G.importCode = function (code, slot) {
  const s = JSON.parse(decodeURIComponent(escape(atob(code.replace(/\s+/g, ''))))); if (!G.hydrate(s)) throw new Error('bad save');
  localStorage.setItem(SKEY(slot), JSON.stringify(s));
};
