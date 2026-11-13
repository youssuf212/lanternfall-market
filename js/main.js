'use strict';
/* Boot, resize, main loop, input */
(function () {
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d'); const $ = id => document.getElementById(id);
  const { S, W, TD, UI, A } = G; G.wins = [];
  let dpr = 1;
  function resize() {
    const cw = window.innerWidth || 390, ch = window.innerHeight || 800; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    const sc = G.scale = Math.min(ch / 720, cw / 520); G.vw = cw / sc; G.vh = ch / sc;
    G.hudTop = $('top').offsetHeight / sc; G.hudBot = (G.mode === 'td' ? $('tdbar').offsetHeight : $('travel').offsetHeight + 16) / sc;
    G.gy = G.vh - G.hudBot - 128;
    if (G.mode === 'td' && TD.T) TD.layout();
  }
  G.setMode = function (m) {
    G.mode = m; const td = m === 'td';
    for (const id of ['needs', 'rank', 'bottom', 'quick', 'bGoals']) $(id).classList.toggle('hide', td || m === 'title');
    $('cShard').classList.toggle('hide', td); $('bMenu').classList.toggle('hide', td);
    for (const id of ['cLives', 'cWave', 'tdbar']) $(id).classList.toggle('hide', !td);
    $('top').classList.toggle('hide', m === 'title');
    A.P.length = 0; resize(); UI.hud();
  };
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); G.Au.init(); if (UI.modalOpen || G.busy || G.mode === 'title') return;
    const x = e.clientX / G.scale, y = e.clientY / G.scale;
    if (G.mode === 'td') TD.tap(x, y);
    else if (UI.sheetOpen) UI.closeSheet(); else if (G.st.time < G.DUSK) W.tap(x, y);
  });
  const key = (e, down) => {
    if (/^(INPUT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) return;
    const k = e.key.toLowerCase();
    if (k === 'a' || k === 'arrowleft') W.keys.l = down;
    else if (k === 'd' || k === 'arrowright') W.keys.r = down;
    else if (down && !e.repeat && (k === 'e' || k === 'enter' || k === 'w' || k === 'arrowup') && G.mode === 'day' && W.near && !UI.sheetOpen && !UI.modalOpen && !G.busy) { G.Au.init(); W.goTo(W.near.id); }
    else if (down && k === 'escape' && UI.sheetOpen) UI.closeSheet();
    else return;
    if (down) G.Au.init();
    e.preventDefault();
  };
  window.addEventListener('keydown', e => key(e, true)); window.addEventListener('keyup', e => key(e, false));
  window.addEventListener('blur', () => { W.keys.l = W.keys.r = false; });
  let last = performance.now(), hudT = 0, saveT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now; G.t += dt; const st = G.st;
    ctx.setTransform(dpr * G.scale, 0, 0, dpr * G.scale, 0, 0);
    if (G.mode === 'td') {
      TD.update(dt); TD.draw(ctx, G.t);
      hudT -= dt; if (hudT <= 0) { hudT = .2; UI.tdHud(); }
    } else {
      if (G.mode === 'day') {
        if (G.busy) {
          const b = G.busy, d = Math.min(b.left, b.rate * dt); S.advance(d); b.left -= d; UI.busyProg(1 - b.left / b.total);
          if (b.left <= .001) { G.busy = null; b.done(); }
        } else if (!UI.sheetOpen && !UI.modalOpen && st.time < G.DUSK) S.advance(dt / .6);
        if (st.time >= G.DUSK && !G.busy && !UI.modalOpen && !G.duskLock) UI.dusk();
        W.update(dt);
        saveT += dt; if (saveT > 10) { saveT = 0; G.save(); }
      } else { W.cam = (Math.sin(G.t * .05) * .5 + .5) * 1800 + 200; A.updP(dt); }
      W.draw(ctx, G.t);
      hudT -= dt; if (hudT <= 0) { hudT = .25; UI.hud(); }
    }
  }
  UI.init(); G.setMode('title');
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode !== 'title') G.save(); last = performance.now(); });
})();
