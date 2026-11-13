'use strict';
/* Tiny WebAudio synth: sfx + gentle generative music */
(function () {
  const Au = G.Au = { ctx: null, on: true, music: true, _mt: null };
  Au.init = function () {
    if (Au.ctx) { if (Au.ctx.state === 'suspended') Au.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext; Au.ctx = new C();
      Au.master = Au.ctx.createGain(); Au.master.gain.value = .5; Au.master.connect(Au.ctx.destination);
      Au._mt = setInterval(tickMusic, 420);
    } catch (e) { Au.ctx = null; }
  };
  function tone(f, dur, type, vol, slide, delay) {
    if (!Au.ctx || !Au.on) return;
    const c = Au.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .15, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(Au.master); o.start(t); o.stop(t + dur + .02);
  }
  const S = {
    tap: () => tone(520, .06, 'triangle', .08),
    coin: () => { tone(988, .08, 'square', .06); tone(1319, .14, 'square', .06, 0, .07); },
    buy: () => { tone(440, .08, 'triangle', .12); tone(330, .1, 'triangle', .1, 0, .06); },
    good: () => { tone(660, .1, 'triangle', .12); tone(880, .16, 'triangle', .12, 0, .09); },
    lvl: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', .13, 0, i * .09)),
    bad: () => { tone(220, .2, 'sawtooth', .08, .6); },
    hit: () => tone(180, .07, 'square', .05, .5),
    shot: () => tone(700, .05, 'triangle', .04, .6),
    boom: () => { tone(90, .3, 'sawtooth', .14, .4); tone(60, .35, 'square', .08, .5); },
    pop: () => tone(300, .12, 'sine', .1, 2.2),
    frost: () => tone(1400, .18, 'sine', .04, .5),
    drink: () => { tone(400, .08, 'sine', .1, 1.5); tone(500, .08, 'sine', .1, 1.5, .1); tone(620, .1, 'sine', .1, 1.5, .2); },
    eat: () => { tone(200, .06, 'square', .06); tone(240, .06, 'square', .06, 0, .12); tone(200, .06, 'square', .06, 0, .24); }
  };
  Au.sfx = n => { if (S[n]) S[n](); };
  const DAY = [262, 294, 330, 392, 440, 523, 587, 659], NIGHT = [220, 262, 294, 330, 392, 440, 523];
  let step = 0;
  function tickMusic() {
    if (!Au.ctx || !Au.on || !Au.music || document.hidden || G.mode === 'title') return;
    step++;
    const sc = G.mode === 'td' ? NIGHT : DAY;
    if (step % 8 === 0) tone(sc[0] / 2, 3, 'sine', .05);
    if (Math.random() < (G.mode === 'td' ? .6 : .45)) {
      const f = sc[(Math.random() * sc.length) | 0];
      tone(f, .9, 'triangle', .035); if (Math.random() < .25) tone(f * 1.5, .7, 'sine', .02, 0, .21);
    }
  }
})();
