'use strict';
/* Dialogue engine, main story, side stories, haggling, pitching, contracts */
(function () {
  const D = G.D = {}; const S = G.S; const N = {}; const $ = id => document.getElementById(id);
  let cur = null;
  const n = (id, t, x) => { N[id] = Object.assign({ t }, x || {}); };
  const has = (st, id, q) => (st.inv[id] || 0) >= q;
  const take = (st, id, q) => { const avg = (st.cost[id] || 0) / st.inv[id]; st.inv[id] -= q; st.cost[id] = Math.max(0, (st.cost[id] || 0) - avg * q); if (st.inv[id] <= 0) { delete st.inv[id]; delete st.cost[id]; } };
  const give = (st, id, q) => { q = Math.min(q, S.bagCap() - S.bagUsed()); if (q > 0) { st.inv[id] = (st.inv[id] || 0) + q; st.cost[id] = st.cost[id] || 0; } return q; };
  const coins = (st, v) => { st.coins = Math.max(0, st.coins + v); G.Au.sfx(v > 0 ? 'coin' : 'buy'); G.UI.toast((v > 0 ? '+' : '−') + Math.abs(v) + '🪙', v > 0 ? 'gold' : ''); };
  const adv = (st, m) => { st.main = m; S.renown(25); G.UI.toast('📖 Story advanced', 'gold'); G.Au.sfx('lvl'); };

  D.chance = function (skill, dc, npc) {
    const st = G.st, lv = skill === 'nerve' ? Math.max(S.skill('charm'), S.skill('trade')) : S.skill(skill);
    return U.clamp(.45 + .17 * (lv - dc) + (st.bond[npc] || 0) * .004 + (st.honor - 50) * .002, .05, .95);
  };

  /* ================= MAIN STORY ================= */
  n('z_m1', 'So. Sena\'s child. Same jaw — the stubborn one. She left something with me for the day you came asking. *She sets a ledger on the counter, its cover soft with handling.* Nineteen years of her accounts.', { o: [{ t: 'What\'s in it?', go: 'z_m2' }, { t: 'Why didn\'t she give it to me herself?', go: 'z_m1b' }] });
  n('z_m1b', 'Because you\'d have argued. You always did. She wanted you to read it without her in the room to be angry at.', { next: 'z_m2' });
  n('z_m2', 'Every sale she ever made. And every dusk, one line in red: *"Tenth — paid."* Three coins. Four coins. To whom, she never wrote. And look — the last page is torn clean out.', { o: [{ t: 'A tenth of her earnings, every day? She was barely scraping by.', go: 'z_m3' }, { t: 'Somebody was squeezing her. I\'ll find out who.', go: 'z_m3', fx: () => S.bond('zuri', 2) }] });
  n('z_m3', 'I don\'t know, love. I know this: in nineteen years, the things that come at night never once touched her cart. Not once. Ask old Bo — he watched that alley. *She presses a wrapped flatbread into your hand.* And eat. You can\'t dig up the truth on an empty stomach.', { o: [{ t: 'Thank you, Zuri.', go: '@hub', fx: st => { adv(st, 1); st.snacks++; S.bond('zuri', 5); } }] });

  n('b_m1', 'Saw you out there last night. Sloppy. Brave, but sloppy. *He spits neatly into the gutter.* You want to know what they are. Everyone does, the first week.', { o: [{ t: 'What are they?', go: 'b_m2' }, { t: 'I want to know why they left my mother alone.', go: 'b_m2b' }] });
  n('b_m2', 'Gloomlings. Don\'t bleed, don\'t bite. They come for coin and only coin, and they come thicker every year. The Guild calls them vermin. Vermin don\'t count your till.', { o: [{ t: 'And my mother\'s cart?', go: 'b_m2b' }] });
  n('b_m2b', 'Twenty years I watched that alley. They\'d pour past Sena\'s cart like water round a stone. Then she died, you set up in the same spot — and they came straight for you. *He looks at you a long moment.* So what did she have that you haven\'t?', { o: [{ t: 'She paid something. A "tenth." Every dusk.', go: 'b_m3', fx: () => S.bond('bo', 3) }, { t: 'Better towers?', go: 'b_m3x' }] });
  n('b_m3x', 'She had one slingshot and a bad knee. Try again.', { o: [{ t: 'Then… the tenth. She paid a tenth of everything, every dusk.', go: 'b_m3' }] });
  n('b_m3', 'A tenth. *Very quietly.* There\'s a word I haven\'t heard since my grandfather. Go see the professor on the Academy steps — the one who counts them. He\'ll talk your ear off. Let him. *He drops a pouch in your palm.* For sling-stones. Don\'t thank me.', { o: [{ t: 'I wasn\'t going to.', go: '@hub', fx: st => { adv(st, 2); coins(st, 30); S.bond('bo', 3); } }] });

  n('i_m1', 'You\'re Sena\'s! Good, good, sit — not there, that\'s Tuesday. I count the gloomlings. Every night, for nine years. Do you know the number last night? Four thousand, one hundred and six.', { o: [{ t: 'Why count them?', go: 'i_m2' }] });
  n('i_m2', 'Because the number is *familiar*. It climbs the way a debt climbs. So I have a mad little hypothesis: every gloomling is a promise somebody in this city broke. An unpaid debt, up and walking.', { o: [{ t: 'That\'s absurd.', go: 'i_m2a' }, { t: 'Then whose promises are they?', go: 'i_m3' }] });
  n('i_m2a', 'Entirely. So is lightning. Help me be wrong — I would sleep so much better.', { next: 'i_m3' });
  n('i_m3', 'To test it I need one thing: the Guild\'s Register of Defaults. If its tally matches my count, I\'m right, and we should all be very frightened. Guildmistress Marrow keeps it. She does not lend books to men who draw on floors. You, however, she might underestimate.', { o: [{ t: 'I\'ll get you a page.', go: '@hub', fx: st => adv(st, 3) }] });

  n('v_m1', 'The Register. *She doesn\'t look up.* And why would a stallholder want a list of this city\'s failures? Choose your answer with care. I collect answers, too.', { o: [
    { t: '"Because I intend never to appear in it. I\'d like to see what ruin looks like, so I can avoid it."', ck: ['charm', 1], go: 'v_ok', fail: 'v_no' },
    { t: '"A fee for the Guild\'s trouble. Eighty coins for an hour with one page."', cost: 80, go: 'v_bribe', fx: st => coins(st, -80) },
    { t: '(Say nothing. Wait until she is called away — and take the page.)', go: 'v_steal' },
    { t: 'The truth: "Professor Quill thinks the gloomlings are broken promises."', go: 'v_truth' }] });
  n('v_ok', '*A thin smile.* Prudence. How rare, and how flattering. One page. You\'ll find it instructive — most of them thought they were careful, too.', { o: [{ t: 'Take the page.', go: '@hub', fx: st => { adv(st, 4); S.bond('vessa', 4); } }] });
  n('v_no', 'Flattery — and not even good flattery. No. But I admire the attempt enough to name the price: eighty coins. Or come back when you\'re someone.', { next: '@hub' });
  n('v_bribe', 'Now *that* is a language I speak. *The coins are simply gone.* One page. Do return it unfolded.', { o: [{ t: 'Take the page.', go: '@hub', fx: st => adv(st, 4) }] });
  n('v_steal', '*A clerk calls her to the vault. The Register lies open. Your hand moves before your conscience does.* The page comes away with a sound like a small bone breaking.', { o: [{ t: 'Walk out slowly.', go: null, fx: st => { st.flags.stole = 1; adv(st, 4); S.honor(-8); } }] });
  n('v_truth', '*Her pen stops.* …Does he. *For one breath she looks old.* Take the page. Let the professor have his sums. And when he\'s finished, come and tell me what he thinks he\'s found — before you tell anyone else. That is not a request.', { o: [{ t: 'Take the page.', go: '@hub', fx: st => { st.flags.vknows = 1; adv(st, 4); S.bond('vessa', 2); S.honor(2); } }] });

  n('i_m4', '*He reads it twice, lips moving.* Four thousand, one hundred and six defaults on the Guild\'s books. To the unit. To the *unit*. Oh, I had so hoped to be a crank.', { o: [{ t: 'So every broken promise becomes one of those things.', go: 'i_m5' }] });
  n('i_m5', 'And here is the worse arithmetic. The private debts are small. One entry dwarfs them all — the first line, in ink gone brown: *"The Tenth — owed by the City entire — unpaid since the Founding."* No sum. Only a reference to the Saltmere Counting House.', { o: [{ t: 'My mother paid a tenth. Every dusk, for nineteen years.', go: 'i_m6' }] });
  n('i_m6', '*He sits down on Tuesday.* Then she knew. One woman, paying a whole city\'s debt in threes and fours. Go north. The Counting House keeps what the Guild would rather burn. Ask for a teller named Finch — she cannot be charmed, which makes her the only honest door in Saltmere.', { o: [{ t: 'North, then.', go: '@hub', fx: st => { adv(st, 5); S.bond('idris', 5); } }] });

  n('f_m1', 'The Lanternfall founding account. *She returns with a box that smells of cold.* Two hundred and eleven years old. I am obliged to tell you it is in arrears. Considerably.', { o: [{ t: 'What was promised?', go: 'f_m2' }] });
  n('f_m2', '*She reads.* "We, the founders, being granted light against the dark by the Lamplighters, do promise them and their heirs a tenth of every profit made beneath that light, forever, that it never go out." Paid for thirty years. Then your Guild was formed, and the payments were… restructured. To nothing.', { o: [{ t: 'And the lamplighters?', go: 'f_m3' }] });
  n('f_m3', 'Gone, mostly. Their First Lantern guttered a century back. But the account never closed — a promise does not lapse because it is inconvenient. *She hesitates, then slides a slip across the desk.* One depositor kept paying. Nineteen years. Small coin. Signed "S."', { o: [{ t: 'That\'s my mother\'s hand.', go: 'f_m4' }] });
  n('f_m4', 'I thought it might be. She wrote to me once, asking what the whole debt came to. I told her. She wrote back: *"Then I\'ll pay what one person can, and raise someone who\'ll do the rest."* …I am a teller. I do not cry at work. Please take the slip before I am forced to.', { o: [{ t: 'Take the slip.', go: '@hub', fx: st => { adv(st, 6); S.bond('finch', 5); S.honor(3); } }] });

  n('b_m6', '*He reads the slip for a long time.* Stubborn woman. Stubborn, magnificent— *He clears his throat hard.* All right. You\'ve earned the rest.', { next: 'b_m7' });
  n('b_m7', 'My grandfather was the last lamplighter in Lanternfall. The First Lantern wasn\'t a lamp. It was a receipt — proof the city paid what it owed. While it burned, the dark had no claim. When the paying stopped, it went out. And the claims got up and started walking.', { o: [{ t: 'Can it be relit?', go: 'b_m8' }] });
  n('b_m8', 'Not relit. Reforged. There\'s a smith in Emberhold — Brakka. Her mother made the last one. She\'ll want gems for the lens and oil for the heart, and one thing you can\'t buy: she won\'t pour a promise for someone who doesn\'t keep their own. Mind how you\'ve been dealing with folk.', { o: [{ t: 'I\'ll find her.', go: '@hub', fx: st => adv(st, 7) }] });

  n('k_m1', 'Sena\'s child. I know — Bo wrote. Terrible handwriting, that man. *She wipes her hands on her apron.* A Tithe Lantern. Three gems for the lens, five flasks of lamp oil for the heart. And I\'ll look at you while you ask.', { o: [
    { t: '"I have the gems and the oil. And I keep my word."', if: st => has(st, 'gems', 3) && has(st, 'oil', 5) && st.honor >= 55, go: 'k_m2', fx: st => { take(st, 'gems', 3); take(st, 'oil', 5); } },
    { t: '"I have the gems and the oil."', if: st => has(st, 'gems', 3) && has(st, 'oil', 5) && st.honor < 55, go: 'k_no' },
    { t: 'I\'ll gather what you need. (3 Gems, 5 Lamp Oil)', if: st => !(has(st, 'gems', 3) && has(st, 'oil', 5)), go: '@hub' }] });
  n('k_no', '*She looks at you the way she looks at flawed iron.* You\'ve the makings. You\'ve not the temper. I hear things, even up here — deals broken, words bent. Go and keep some promises. Then come back. (Needs Honor 55+)', { next: '@hub' });
  n('k_m2', '*She works through the night. You hold the tongs. At the last, she presses your thumb into the soft brass.* There. It\'s signed. It won\'t burn on oil alone — it burns on the paying. Light it where the debt is held. You know where.', { o: [{ t: 'Carry the lantern home.', go: '@hub', fx: st => { adv(st, 8); S.bond('brakka', 8); } }] });

  n('v_f1', '*She sees the lantern and sets down her pen for the first time since you have known her.* So. The professor\'s sums, the teller\'s box, the smith\'s fire. You have been thorough. Your mother was thorough. Sit.', { next: 'v_f2' });
  n('v_f2', 'I have known since I was your age. Every Guildmaster knows. The debt is two centuries deep. Pay it, and the Guild is finished — half this city\'s fortunes stand on that missing tenth. So we sell lamps and protection, and call it order. *She folds her hands.* I am tired, and you are clever. Let me make you an offer.', { next: 'v_f3' });
  n('v_f3', 'Take the chair beside mine. A thousand coins today, the Guild\'s seal on everything you own, and the lantern goes into my vault. The dark keeps coming, and people keep paying us to hold it back. Or do the other thing — and learn what it costs.', { o: [
    { t: '"I\'ll pay it. My share first — and a tenth of everything I make, for good."', cost: 1500, go: 'e_tenth', fx: st => { st.coins -= 1500; st.ending = 'tenth'; st.honor = 100; st.shards += 3; adv(st, 9); S.renown(200); } },
    { t: '"Give me the chair."', go: 'e_chair', fx: st => { st.coins += 1000; st.ending = 'chair'; st.honor = 0; adv(st, 9); } },
    { t: '"Neither. The city made this promise. The city should hear it."', if: st => ['idris', 'zuri', 'bo'].every(k => (st.bond[k] || 0) >= 35), go: 'e_open', fx: st => { st.ending = 'open'; st.honor = Math.min(100, st.honor + 30); st.shards += 3; for (const k in G.NPCS) if (k !== 'vessa') st.bond[k] = Math.min(100, (st.bond[k] || 0) + 10); adv(st, 9); S.renown(250); } },
    { t: '(You would need Zuri, Bo and the professor behind you to take this to the city.)', if: st => !['idris', 'zuri', 'bo'].every(k => (st.bond[k] || 0) >= 35), go: 'v_f3' },
    { t: 'I need time to think.', go: null }] });
  n('e_tenth', '*You count fifteen hundred coins onto her desk. The lantern catches — not with flame, but a steady gold, like a held breath let go. Outside, for the first time in a hundred years, the alley is only an alley.* Vessa watches it burn. "Sena said you would. I bet against her." A pause. "I am glad I lost."', { o: [{ t: '🕯️ Ending: The Lamplighter', go: null, fx: () => D.epilogue() }] });
  n('e_chair', '*The chair is very comfortable. The lantern goes into the vault, unlit. Vessa pours two cups.* "To order," she says. Far below, in the alley by a small cart, something with too many eyes tests the dark — and finds it unlocked.', { o: [{ t: '🌑 Ending: The Magnate of Ash', go: null, fx: () => D.epilogue() }] });
  n('e_open', '*You ring the market bell at noon and read the founders\' promise aloud. Idris has the numbers. Zuri has the crowd. And Bo, who has not spoken in public in twenty years, says: "My grandfather lit your lamps. Pay the man."* It is not unanimous. It is enough. By dusk there is a tithe-box in the square, and the lantern burns on a thousand small payments instead of one. Vessa resigns before she can be asked. Her last entry in the Register is her own name.', { o: [{ t: '📖 Ending: The Open Ledger', go: null, fx: () => D.epilogue() }] });
  D.epilogue = function () {
    const e = G.st.ending, T = { tenth: ['🕯️', 'The Lamplighter', 'The gloomlings thin to a trickle — raids are half as fierce. A tenth of your business income now goes to the lamp, forever. You sleep well.'], chair: ['🌑', 'The Magnate of Ash', 'You are rich, sealed and feared. The nights are 30% worse and always will be. Somewhere, a ledger has your name in it.'], open: ['📖', 'The Open Ledger', 'The whole city pays its tenth now. Raids are far weaker, your friends stand closer, and nobody owns the light.'] }[e];
    setTimeout(() => G.UI.modal(`<div class="big-emo">${T[0]}</div><h1>${T[1]}</h1><p>${T[2]}</p><p>Your story has an ending — but the market never closes. Keep building.</p>`, [{ t: 'Onward' }]), 400);
  };

  /* ================= SIDE STORIES ================= */
  n('z_s1', 'There\'s a chair by the stove nobody sits in. My boy\'s. Tamsin. Six years in Saltmere keeping a lighthouse, and he writes like a tax form — "Am well. Weather cold." *She holds out a clay pot sealed with wax.* If you ever go north. His favourite. Don\'t tell him I cried into it; it\'s seasoned enough.', { o: [
    { t: '"I\'ll carry it. I promise."', go: 'z_s1a', fx: st => { st.flags.z_side = 1; st.flags.z_prom = 1; S.bond('zuri', 4); } },
    { t: '"I can\'t promise, Zuri. But if I\'m there, I\'ll try."', go: 'z_s1b', fx: st => { st.flags.z_side = 1; S.bond('zuri', 2); } }] });
  n('z_s1a', 'Then it\'s as good as there. Go on. And eat.', { next: '@hub' });
  n('z_s1b', 'An honest maybe. Your mother dealt in those. Take it anyway.', { next: '@hub' });
  n('t_s1', '*He turns the pot over and over without breaking the seal.* She still thinks I left over a quarrel. I left because I borrowed from the Guild to buy her a new stove, and couldn\'t pay, and Marrow said the debt would "follow the family." So I took it somewhere it couldn\'t find her.', { o: [{ t: 'And did it follow you?', go: 't_s2' }] });
  n('t_s2', '*He nods at the dark beyond the lamp-room glass. Something small sits out on the gallery rail, patient as a cat.* One. Just the one. It has been out there six years. It has my laugh. I\'d forgotten I had one, until I heard it use it.', { o: [
    { t: '"What do you owe? I\'ll pay it."', cost: 120, go: 't_pay', fx: st => { coins(st, -120); st.flags.tamsin = 'home'; st.flags.z_side = 2; S.honor(6); S.bond('tamsin', 15); } },
    { t: '"She doesn\'t want the money, Tamsin. She wants the chair filled. Go home and owe it together."', ck: ['charm', 2], go: 't_talk', fail: 't_talkf', fx: st => { st.flags.tamsin = 'home'; st.flags.z_side = 2; S.honor(3); S.bond('tamsin', 12); }, ffx: st => { st.flags.tamsin = 'stay'; st.flags.z_side = 2; } },
    { t: '"It\'s your debt and your choice. I\'ll tell her you\'re well."', go: 't_stay', fx: st => { st.flags.tamsin = 'stay'; st.flags.z_side = 2; S.bond('tamsin', 4); } }] });
  n('t_pay', '*You count it out. On the rail, the small thing looks at the coins, then at Tamsin — and comes apart like breath on glass. He makes a sound that isn\'t a word.* …Tell her I\'m coming home. Tell her to burn that stove. I\'ll buy her a better one, honest.', { next: '@hub' });
  n('t_talk', '*A long silence. The lamp turns.* …Together. Hah. She\'d haggle Marrow down to half and make her say thank you. *He breaks the seal at last, and the smell fills the lamp-room.* Next boat. Tell her — next boat.', { next: '@hub' });
  n('t_talkf', '*He shakes his head.* You don\'t know what it is to carry a thing like that to someone\'s door. Maybe one day. Tell her the pot arrived.', { next: '@hub' });
  n('t_stay', '*He looks grateful, and a little disappointed.* Tell her the weather\'s cold. She\'ll know what it means.', { next: '@hub' });
  n('z_s3', st => st.flags.tamsin === 'home'
    ? '*She already knows; the letter beat you by a day. There are two bowls on the counter and she is pretending to be busy.* You. You meddler. You wonderful, interfering— *She stops, and starts again.* You never pay full price in this house again. Half. I\'m still a businesswoman.'
    : '*She listens to all of it. Wipes the same patch of counter twice.* "Weather\'s cold." That\'s him saying he misses me. *She nods slowly.* He\'s alive, and somebody has seen his face. That\'s more than I had yesterday. Here — his old recipe book. He\'d want it used.',
    { o: [{ t: 'You\'re welcome, Zuri.', go: '@hub', fx: st => { st.flags.z_side = 3; if (st.flags.tamsin === 'home') { st.flags.zuri_half = 1; S.bond('zuri', 20); } else { st.shards++; S.bond('zuri', 10); } if (st.flags.z_prom) S.honor(5); } }] });

  n('b_s1', 'When they retired me, the Guild took my watch-horn "for the archive." Sold it, more like. I hear a dealer in Emberhold has it — Kazimir something. Brass, dented on the bell, my initials scratched inside. I don\'t ask favours. *He looks at the wall.* I\'m asking.', { o: [{ t: 'I\'ll find it.', go: '@hub', fx: st => { st.flags.b_side = 1; S.bond('bo', 3); } }, { t: 'Not now, Bo.', go: '@hub' }] });
  n('k_s1', 'This? An heirloom of the mountain kings! …No? A watchman\'s horn, dented, "B.O." scratched inside. You have sharp eyes, my friend. Sharp eyes cost extra. One hundred and fifty.', { o: [
    { t: '"Fine. A hundred and fifty."', cost: 150, go: 'k_s2', fx: st => { coins(st, -150); st.flags.b_side = 2; } },
    { t: '"It\'s dented brass, Kazimir. Sixty — and I don\'t tell the market what your mountain-king rubies really are."', cost: 60, ck: ['trade', 2], go: 'k_s2', fail: 'k_sf', fx: st => { coins(st, -60); st.flags.b_side = 2; }, ffx: () => S.bond('kaz', -3) },
    { t: '"It belonged to an old man who guarded a city for twenty years and was thanked with a pension you couldn\'t feed a cat on."', ck: ['charm', 2], go: 'k_s3', fail: 'k_sf2', fx: st => { st.flags.b_side = 2; S.bond('kaz', 6); S.honor(2); } },
    { t: 'Another time.', go: '@hub' }] });
  n('k_s2', 'A pleasure! Tell the old soldier it comes with a story now. I shall think of one.', { next: '@hub' });
  n('k_s3', '*Kazimir is quiet. Then he wraps the horn in his own scarf.* I am a liar, my friend, not a monster. Take it. Tell him a thief sends his respect.', { next: '@hub' });
  n('k_sf', 'Ah! Blackmail — and clumsy. No, no. The price stands, and now my feelings are bruised.', { next: 'k_s1' });
  n('k_sf2', 'A sad tale! I weep. I weep, and I charge one hundred and fifty.', { next: 'k_s1' });
  n('b_s3', '*He doesn\'t take it at first. Then he does, and turns it to find the scratches.* Hm. *He puts it to his lips. The note that comes out is cracked and enormous, and every shutter on the alley rattles.* Still got it. Right. I\'m coming out of retirement — your towers shoot like poets. I\'ll drill them.', { o: [{ t: 'Welcome back, watchman.', go: '@hub', fx: st => { st.flags.b_side = 3; st.flags.horn = 1; S.bond('bo', 15); G.UI.toast('📯 Bo\'s drilling: towers deal +12% damage', 'gold'); } }] });

  n('h_s1', 'Private word. I\'ve forty bolts of silk below with no Guild stamp on \'em. The stamp costs more than the silk. You\'ve a stall, an honest face, and no inspector for a cousin. Sell it quiet through your cart and it\'s two hundred coins to you.', { o: [
    { t: '"I\'m in."', go: 'h_yes', fx: st => { st.flags.h_side = 'smug'; coins(st, 200); S.honor(-10); S.bond('hale', 8); } },
    { t: '"No. And you shouldn\'t either — why risk the Heron for silk?"', go: 'h_why' },
    { t: '"I\'ll forget you asked. This once."', go: '@hub', fx: st => { st.flags.h_side = 'no'; } }] });
  n('h_yes', 'Ha! Knew you had salt in you. If anyone asks, it fell off a whale.', { next: '@hub' });
  n('h_why', '*The grin goes out like a lamp.* Because three widows on the Saltmere shoals get a purse from me every winter, and the stamps ate this winter\'s purse. I promised their men. A promise to the drowned doesn\'t lapse.', { o: [
    { t: '"Then let me buy the silk fair, stamped. I\'ll carry the cost."', cost: 150, go: 'h_fair', fx: st => { st.flags.h_side = 'fair'; st.flags.halffare = 1; coins(st, -150); give(st, 'silk', 4); S.honor(8); S.bond('hale', 20); } },
    { t: '"That\'s a good reason for a bad idea. I\'m still out."', go: '@hub', fx: st => { st.flags.h_side = 'no'; S.bond('hale', 2); } }] });
  n('h_fair', '*He stares.* You\'d pay the stamp on another man\'s promise. …Sena\'s child, right enough. *He grips your arm hard.* The Heron sails for you at half fare, as long as I\'ve a deck under me. And take four bolts — stamped.', { next: '@hub' });

  n('p_s1', 'You. A word. My regulars are buying dates from *your* cart now. Dates! I have sold dates on this spot since before you could count. So here is my offer, and I make it once.', { next: 'p_s2' });
  n('p_s2', 'A wager: we each name a price for that sack of saffron, blind. Closer to what old Madam Tolu actually pays, wins. Or — *she exhales through her nose* — we stop bleeding each other and split the street. Partners. Ugh. I hate the word.', { o: [
    { t: 'Take the wager.', ck: ['trade', 1], go: 'p_win', fail: 'p_lose', fx: st => { st.flags.p_side = 'won'; coins(st, 90); S.bond('pepper', 5); }, ffx: st => { st.flags.p_side = 'lost'; coins(st, -Math.min(40, st.coins)); S.bond('pepper', 3); } },
    { t: '"Partners. Shake on it."', go: 'p_part', fx: st => { st.flags.p_side = 'partner'; st.flags.pepper_partner = 1; S.bond('pepper', 15); S.honor(3); } },
    { t: '"Neither. I\'ll win this street the honest way — slowly."', go: 'p_none', fx: st => { st.flags.p_side = 'none'; S.bond('pepper', 4); } }] });
  n('p_win', '*Madam Tolu pays within a coin of your number. Pepper stares at the saffron as if it had betrayed her.* …Fine. FINE. Take your winnings. You guess like a thief, and I respect it.', { next: '@hub' });
  n('p_lose', '*Off by a mile. Pepper\'s laugh carries to the harbor.* Oh, that was worth more than the coin. Pay up, rookie.', { next: '@hub' });
  n('p_part', '*Her grip could crack walnuts.* First rule of partnership: I am always right. Second rule: when I am wrong, see rule one. …I\'ll hold you a fair price every morning. Don\'t make me regret it. (Bazaar buying prices −5% for good.)', { next: '@hub' });
  n('p_none', 'Slowly. Hah. Your mother said that too. Took her nineteen years and she *still* undersold me on Fridays. …Go on, then.', { next: '@hub' });

  const BEATS = [
    { npc: 'zuri', t: 'About my mother', go: 'z_m1', if: s => s.main === 0 },
    { npc: 'bo', t: 'The things in the alley', go: 'b_m1', if: s => s.main === 1 && s.day >= 2 },
    { npc: 'idris', t: 'The professor who counts the dark', go: 'i_m1', if: s => s.main === 2 },
    { npc: 'vessa', t: 'The Register of Defaults', go: 'v_m1', if: s => s.main === 3 },
    { npc: 'idris', t: 'The page from the Register', go: 'i_m4', if: s => s.main === 4 },
    { npc: 'finch', t: 'The oldest account', go: 'f_m1', if: s => s.main === 5 },
    { npc: 'bo', t: 'What Sena knew', go: 'b_m6', if: s => s.main === 6 },
    { npc: 'brakka', t: 'The Tithe Lantern', go: 'k_m1', if: s => s.main === 7 },
    { npc: 'vessa', t: 'The oldest debt', go: 'v_f1', if: s => s.main === 8 },
    { npc: 'zuri', t: 'The empty chair', go: 'z_s1', if: s => s.main >= 2 && !s.flags.z_side },
    { npc: 'tamsin', t: 'A pot from Lanternfall', go: 't_s1', if: s => s.flags.z_side === 1 },
    { npc: 'zuri', t: 'News of Tamsin', go: 'z_s3', if: s => s.flags.z_side === 2 },
    { npc: 'bo', t: 'The watch-horn', go: 'b_s1', if: s => s.main >= 3 && !s.flags.b_side },
    { npc: 'kaz', t: 'An old brass horn', go: 'k_s1', if: s => s.flags.b_side === 1 },
    { npc: 'bo', t: 'Return the horn', go: 'b_s3', if: s => s.flags.b_side === 2 },
    { npc: 'hale', t: 'A private word', go: 'h_s1', if: s => s.level >= 3 && !s.flags.h_side },
    { npc: 'pepper', t: 'A word about dates', go: 'p_s1', if: s => s.day >= 3 && !s.flags.p_side }
  ];
  D.hasStory = id => BEATS.some(b => b.npc === id && b.if(G.st));
  const OBJ = ['Talk to Mama Zuri in her kitchen about your mother.', 'Survive a night, then ask Old Bo (beside your stall) about the gloomlings.', 'Find Professor Quill outside the Academy.', 'Get a page of the Register of Defaults from Guildmistress Marrow at the Guild Hall.', 'Bring the Register page to Professor Quill.', 'Sail to Saltmere from the Harbor (Renown Lv 2) and find Ottoline Finch at the Counting House.', 'Take your mother\'s deposit slip back to Old Bo.', 'Travel to Emberhold (Renown Lv 4). Bring Forge-Mother Brakka 3 Gems and 5 Lamp Oil — and an honest name (Honor 55+).', 'Carry the Tithe Lantern to Guildmistress Marrow.', 'Your story is told. The market is yours to shape.'];
  D.objective = () => OBJ[G.st.main] || OBJ[9];

  /* ================= GREETINGS & CHAT ================= */
  const GREET = {
    zuri: ['Sit, sit. You\'re too thin. What\'ll it be?', 'There\'s my favourite stray. The stew has been asking after you.', 'You walk in and the whole kitchen stands up straighter. Come here.'],
    bo: ['Hm. Still alive, then.', 'You\'re learning. Slowly. Like moss.', 'Sena would have liked how you hold that alley. Don\'t make me say it twice.'],
    idris: ['Yes? Mind the chalk — that\'s three years of counting on the floor.', 'Ah, my field correspondent! What does the dark say today?', 'I\'ve stopped pretending I do this for science. I do it because you keep coming back alive.'],
    vessa: ['The Guild sees everyone eventually. Today it sees you. Be brief.', 'You have a talent for standing where the money is. I notice talent.', 'Sit. I don\'t offer the good chair often.'],
    pepper: ['Oh look, the competition. Try not to breathe on the saffron.', 'You again. Fine — you may admire the stall. Briefly.', 'If anyone asks, I still can\'t stand you. Tea?'],
    hale: ['Mind the ropes, landling.', 'Ha! The little merchant with the big appetite. What\'s the wind say?', 'There\'s a berth on the Heron with your name carved in it. Carved badly, but carved.'],
    ysolde: ['Buy or move. The cod won\'t wait and neither will I.', 'You count your change. Good. I respect a counter.', 'Sit on the barrel, pet. I\'ll tell you which of these crooks to trust. None.'],
    finch: ['Take a number. Mind the ink.', 'Your account is in order, which is more than I can say for most.', 'I had them bring up the good chairs. Don\'t tell the other clients.'],
    tamsin: ['You came up all those stairs. Either you\'re lost or you want something.', 'Mind the lens. Tea\'s on the stove — it\'s terrible.', 'On clear nights I can almost see Lanternfall from here. Almost is my whole life.'],
    kaz: ['A customer! Or a thief. I offer both the same smile.', 'My friend! Everything here is real, and what isn\'t is beautiful.', 'For you I bring things out from under the counter. Even the counter.'],
    brakka: ['Mind the sparks. State your business plainly — I\'ve iron cooling.', 'You again. Good. Hold this. No — the other end.', 'My apprentices think you\'re a customer. I\'ve stopped correcting them.']
  };
  const CHAT = {
    zuri: ['Your mother ate here every dusk. Always paid for two bowls and only ate one. I never asked why. I should have asked.', 'People think the secret to stew is time. It\'s attention. Same as people — you can\'t rush either, and you can\'t leave either alone.', 'This city forgets its debts by breakfast. I write mine on the wall behind the stove, where the smoke can\'t hide them.'],
    bo: ['Twenty years on the night watch. You learn the dark has moods. Lately it\'s in a foul one.', 'A gloomling never took a life that I know of. Only coin. Think on why a monster would be that polite.', 'Slingshot\'s simple. Elbow soft, breath out, and don\'t hate the thing you\'re aiming at. Hate pulls left.'],
    idris: ['I count them every night from the Academy roof. The number never falls. It only rises, by ones and twos, like interest.', 'My colleagues study stars. Stars are easy. Stars don\'t knock over your instruments and steal your lunch money.', 'A theory, unproven: the dark here isn\'t an absence. It\'s a ledger. Something is keeping accounts.'],
    vessa: ['The Guild has kept this city solvent for two hundred years. Solvency is not innocence. Only children confuse them.', 'Everyone wants an honest market until they are the one being weighed.', 'Your mother and I were apprentices together. She had principles. I had ambitions. Observe which of us has the hall.'],
    pepper: ['My grandmother carried this stall across the dunes on her back. So when I say I\'ll bury you, understand it\'s tradition, not malice.', 'Trick of the trade: never lie about the spice. Lie about how many people already bought it.', 'You count under your breath when you haggle. It\'s irritating. Don\'t stop — it makes customers trust you.'],
    hale: ['The sea keeps better books than any guild. Take too much and she takes it back. Simple. Honest. Wet.', 'I lost three hands off the Saltmere shoals, nine winters gone. I still pour three cups. Habit is a kind of promise.', 'Never trust a calm harbor, or a captain who says he isn\'t superstitious.'],
    ysolde: ['My husband could gut a cod in four cuts and a lie in two. I miss him only on days ending in y.', 'Southerners haggle like they\'re courting. Up here we haggle like we\'re cold. Get to the number.', 'That lighthouse boy pays his bills to the day. Never laughs, though. You notice a thing like that.'],
    finch: ['Interest is only time, written down. People hate it for the same reason they hate mirrors.', 'We hold accounts older than your city\'s walls. Some of them are still, technically, open.', 'I was told as a girl that I was "good with numbers" — as though numbers were a temperamental horse.'],
    tamsin: ['The lamp wants trimming every four hours. It\'s the only thing in my life that tells me plainly what it needs.', 'My mother thinks I left because of a quarrel. Let her. It\'s kinder than the truth.', 'Ships don\'t thank you. That\'s what I like. You keep them off the rocks and they just… go on.'],
    kaz: ['Every stone has a story. I make most of them up — but the customer keeps the story longer than the stone. So who is cheated?', 'In Emberhold we say: the mountain lends, it never gives. Dig accordingly.', 'I was honest once, for a week. Lost four pounds and a cousin.'],
    brakka: ['Iron remembers. Fold a lie into a blade and it will snap on the day you need it.', 'My mother forged lamps for a city in the south. Said the trick wasn\'t the glass. It was the promise you poured in with the oil.', 'People expect the forge taught me patience. No. It taught me to strike while I mean it.']
  };
  const tier = id => { const b = G.st.bond[id] || 0; return b >= 60 ? 2 : b >= 25 ? 1 : 0; };

  /* ================= HAGGLE ================= */
  const HG = {
    pepper: ['You want to haggle. With me. Adorable. Go on.', 'Tch. Fine. Today only — and if you tell anyone, I\'ll deny it in three languages.', 'No. And for wasting my morning, the price just went up.'],
    hale: ['Haggling! Now you\'re speaking sailor. Make it loud.', 'Ha! Done, and done cheap. Don\'t tell my quartermaster.', 'That was a limp little offer. I\'m insulted on the cargo\'s behalf.'],
    ysolde: ['You\'ve the look of someone about to waste my time. Prove me wrong — with figures.', 'Hm. The sums hold. Today\'s price, and not a word to the other stalls.', 'Bluster. Price goes up a notch for the insult. It\'s cold; I\'ve no patience.'],
    kaz: ['You wish to negotiate! My heart sings. My purse weeps. Begin.', 'You wound me so gracefully that I must agree. Today, for you, a special price.', 'No, no, no. Now my feelings are hurt — and hurt feelings are expensive.']
  };
  function haggle(id, side) {
    const P = G.NPCS[id], L = HG[id];
    if (!side) return { t: L[0], o: [{ t: 'I want a better price on what I buy today.', go: () => haggle(id, 'buy') }, { t: 'I want you to pay more for what I sell today.', go: () => haggle(id, 'sell') }, { t: 'Never mind.', go: '@hub' }] };
    const res = (ap, ok) => {
      const st = G.st, liked = P.likes === ap; S.advance(10);
      st.deals[P.mk] = { day: st.day, side, m: ok ? (side === 'buy' ? (liked ? .85 : .9) : (liked ? 1.12 : 1.08)) : (side === 'buy' ? 1.05 : .95) };
      if (ok) { S.bond(id, 2); S.renown(4); S.addXp(ap === 'logic' ? 'trade' : 'charm', 5); G.Au.sfx('good'); } else { st.bond[id] = Math.max(0, (st.bond[id] || 0) - 2); G.Au.sfx('bad'); }
      const pc = Math.round(Math.abs(1 - st.deals[P.mk].m) * 100);
      return { t: L[ok ? 1 : 2] + ` *(${ok ? (side === 'buy' ? 'You pay ' + pc + '% less' : 'They pay ' + pc + '% more') : (side === 'buy' ? 'You pay ' + pc + '% more' : 'They pay ' + pc + '% less')} here until tomorrow.)*`, next: '@hub' };
    };
    const mk = (ap, sk, txt) => { const bonus = P.likes === ap ? .25 : P.hates === ap ? -.25 : 0, p = U.clamp(D.chance(sk, 1, id) + bonus, .05, .95); return { t: txt, pct: p, go: () => res(ap, Math.random() < p) }; };
    return { t: 'Convince me.', o: [mk('flatter', 'charm', '✨ "Everyone says yours is the only honest scale in the market."'), mk('logic', 'trade', '⚖️ "I\'ve seen today\'s prices elsewhere. Here are the numbers."'), mk('bold', 'nerve', '🔥 "That\'s my offer. I can walk."')] };
  }

  /* ================= PITCH ================= */
  const PP = { vessa: ['bold', 'honest'], hale: ['bold', 'logic'], finch: ['logic', 'bold'], brakka: ['honest', 'bold'] };
  const PT = {
    vessa: ['You want Guild money. Everyone does; few can afford it. Three questions.', ['*Her eyebrow lifts a fraction.* Go on.', '*She writes nothing.*', '*She smiles the way a door closes.*'], 'The Guild takes forty parts in a hundred of all your businesses earn. In return: one thousand, today. Welcome to the ledger.', 'Not yet. You are interesting, not yet profitable. Come back in three days with a better spine.'],
    hale: ['Invest? In a landling\'s shops? …Go on, I\'m listening. Three questions, and I\'ll know by your face.', ['Ha! *He slaps the rail.*', 'Mm.', '*He yawns at the horizon.*'], 'Four hundred, and a quarter of the take! Shake on it — no, the other hand, that one\'s been in fish.', 'Nah. Your eyes went sideways. Three days — come back sure.'],
    finch: ['An application for capital. Very well. Three questions; I shall be writing down your answers.', ['*Her pen moves approvingly.*', '*A small, neutral dot on the page.*', '*She underlines something twice. It is not praise.*'], 'Approved. Eight hundred coins at a one-fifth share. Sign here, here, and — mind the ink — here.', 'Declined, without prejudice. You may reapply in three days.'],
    brakka: ['Money is only iron that has forgotten its shape. Three questions. Answer straight.', ['*She nods once, the way she nods at good steel.*', '*She turns the tongs.*', '*She looks at you like slag.*'], 'Six hundred, fifteen in the hundred, and my name beside yours. Shame it and I\'ll hear.', 'Not today. I don\'t back what I can\'t read. Three days.']
  };
  const PQ = [
    ['Why should I put my money in you?', ['bold', '"Because in a year I\'ll own this coast, and you\'ll want to have been early."'], ['logic', '"Because my books balance. Here is what each business clears in a day."'], ['honest', '"Because I keep my word. Ask anyone I\'ve dealt with."']],
    ['And when it goes wrong?', ['bold', '"It won\'t."'], ['logic', '"I hold reserves, and you are paid before I am."'], ['honest', '"Then you\'ll hear it from me first, before the rumours."']],
    ['What do you want from me, beyond coin?', ['bold', '"Your name on my door."'], ['logic', '"Your discipline. I want my ledgers kept like yours."'], ['honest', '"Your advice. I\'m new at this, and I know it."']]
  ];
  function pitch(id, step, score) {
    const P = G.NPCS[id], T = PT[id], pref = PP[id], st = G.st; step = step || 0; score = score || 0;
    if (step === 0 && id === 'brakka' && st.honor < 50) return { t: 'I\'ve heard how you deal. I don\'t pour good iron into a cracked mould. Mend your name first. (Needs Honor 50+)', next: '@hub' };
    if (step < 3) {
      const q = PQ[step];
      return { t: (step === 0 ? T[0] + ' ' : '') + '*"' + q[0] + '"*', o: q.slice(1).map(a => ({ t: a[1], go: () => { const r = a[0] === pref[0] ? 0 : a[0] === pref[1] ? 2 : 1; return { t: T[1][r], o: [{ t: '▸', go: () => pitch(id, step + 1, score + [2, 1, -1][r]) }] }; } })) };
    }
    const total = score + Math.floor(S.skill('charm') / 2) + Math.floor((st.bond[id] || 0) / 25) + (st.honor >= 60 ? 1 : st.honor < 35 ? -2 : 0) + Object.keys(st.biz).length;
    if (total >= (id === 'vessa' ? 5 : 6)) {
      st.investors[id] = P.invest.cut; coins(st, P.invest.cap); S.bond(id, 8); S.renown(30); if (id === 'vessa') S.honor(-5);
      return { t: T[2], next: '@hub' };
    }
    st.pitchCd[id] = st.day + 3; st.bond[id] = Math.max(0, (st.bond[id] || 0) - 3); G.Au.sfx('bad');
    return { t: T[3], next: '@hub' };
  }
  function buyout(id) {
    const P = G.NPCS[id], st = G.st, c = Math.round(P.invest.cap * 1.5);
    return { t: `You want your ${Math.round(P.invest.cut * 100)}% back. It will cost you ${c} coins — what I put in, and half again for my trouble.`, o: [{ t: `Pay ${c}🪙 and end the partnership.`, cost: c, go: '@hub', fx: () => { coins(st, -c); delete st.investors[id]; } }, { t: 'Not yet.', go: '@hub' }] };
  }

  /* ================= CONTRACTS ================= */
  const CI = { pepper: 'Since you insist on existing, be useful.', hale: 'Aye, there\'s a thing you could do.', ysolde: 'As it happens, I\'m short.', kaz: 'My friend — destiny has an errand!' };
  function offer(id) {
    const P = G.NPCS[id], st = G.st;
    const cand = G.GOODS.filter(g => !g.home.includes(P.mk) && g.cities.some(c => st.level >= G.CITIES[c].lvl) && g.base < 100 + st.level * 20);
    const g = U.pick(cand), far = !g.cities.includes(P.city), qty = U.ri(2, Math.max(2, Math.min(6, Math.floor(S.bagCap() / 3)))), due = st.day + (far ? 4 : 2), pay = Math.round(qty * g.base * (far ? 2.2 : 1.55)) + 10;
    return { t: `${CI[id]} I need *${qty}× ${g.i} ${g.n}* by the end of day ${due}. ${pay} coins on delivery. But I want your word on it — I\'ll be turning other sellers away.`, o: [
      { t: '"You have my word."', go: '@hub', fx: () => { st.contracts.push({ npc: id, good: g.id, qty, due, pay }); G.UI.toast('📦 Promise made — see your Goals', 'gold'); } },
      { t: '"I can\'t promise that. Ask someone else."', go: '@hub' }] };
  }
  function deliver(id) {
    const st = G.st, i = st.contracts.findIndex(c => c.npc === id), c = st.contracts[i];
    take(st, c.good, c.qty); st.contracts.splice(i, 1); coins(st, c.pay); S.bond(id, 8); S.honor(4); S.renown(15); S.count('profit', Math.round(c.pay / 3));
    return { t: 'Counted, and correct, and on time. You\'d be surprised how rare that is. Your coin — as agreed.', next: '@hub' };
  }
  function chat(id) {
    const st = G.st; st.chat[id] = st.day; S.advance(15); S.bond(id, 3);
    const L = CHAT[id]; return { t: L[(st.day + (st.bond[id] | 0)) % L.length], next: '@hub' };
  }

  /* ================= HUB & ENGINE ================= */
  function hub(id) {
    const st = G.st, P = G.NPCS[id], o = [];
    for (const b of BEATS) if (b.npc === id && b.if(st)) o.push({ t: '❗ ' + b.t, go: b.go, hot: 1 });
    const c = st.contracts.find(c => c.npc === id);
    if (c) { const g = G.good(c.good), hv = st.inv[c.good] || 0; o.push(hv >= c.qty ? { t: `📦 Deliver ${c.qty}× ${g.n} (+${c.pay}🪙)`, go: () => deliver(id), hot: 1 } : { t: `📦 Your order: ${hv}/${c.qty} ${g.n}, due day ${c.due}`, go: () => ({ t: 'I\'m holding the space for you. Don\'t make a fool of me.', next: '@hub' }) }); }
    else if (P.work && st.contracts.length < 3 && st.day >= 2) o.push({ t: '📦 Any work for me?', go: () => offer(id) });
    if (P.mk && !S.dealToday(P.mk)) o.push({ t: '🤝 Haggle over today\'s prices', go: () => haggle(id) });
    if (P.invest) {
      if (st.investors[id]) o.push({ t: '💼 Buy out their share', go: () => buyout(id) });
      else if (!Object.keys(st.biz).length) o.push({ t: '💼 Ask about investment', go: () => ({ t: 'Invest in what? You own nothing but a cart. Start a business — the Guild Hall keeps the registry — and then we\'ll talk.', next: '@hub' }) });
      else if ((st.pitchCd[id] || 0) <= st.day) o.push({ t: '💼 Pitch for investment', go: () => pitch(id) });
    }
    if (st.chat[id] !== st.day) o.push({ t: '💬 Chat a while', go: () => chat(id) });
    o.push({ t: '👋 Goodbye', go: null });
    return { t: GREET[id][tier(id)], o };
  }
  const fmt = s => s.replace(/\*(.+?)\*/g, '<i>$1</i>');
  D.open = function (id) { cur = id; G.UI.closeSheet(); G.UI.modalOpen = true; $('dlg').classList.remove('hide'); G.Au.sfx('pop'); show(hub(id)); };
  D.close = function () { $('dlg').classList.add('hide'); G.UI.modalOpen = false; G.save(); G.UI.hud(); const l = G.UI.curLoc; if (l && G.st.time < G.DUSK && G.mode === 'day' && G.W.loc(l)) G.UI.openLoc(l); };
  function resolve(x) { if (x === '@hub') return hub(cur); if (typeof x === 'string') return N[x]; if (typeof x === 'function') return x(); return x; }
  function show(node) {
    const st = G.st, P = G.NPCS[cur], b = st.bond[cur] || 0;
    if (!node) return D.close();
    $('dlgFace').textContent = P.i; $('dlgName').textContent = P.n; $('dlgRole').textContent = P.role; $('dlgBond').textContent = '💛'.repeat(Math.min(5, Math.floor(b / 20))) + '🤍'.repeat(5 - Math.min(5, Math.floor(b / 20)));
    $('dlgText').innerHTML = fmt(typeof node.t === 'function' ? node.t(st) : node.t);
    const box = $('dlgOpts'); box.innerHTML = '';
    const opts = node.o ? node.o.filter(o => !o.if || o.if(st)) : [{ t: node.next === '@hub' ? '▸ …' : '▸ Continue', go: node.next === undefined ? '@hub' : node.next }];
    for (const o of opts) {
      const e = document.createElement('button'); e.className = 'dopt' + (o.hot ? ' hot' : '');
      let lab = o.t; const p = o.ck ? D.chance(o.ck[0], o.ck[1], cur) : o.pct;
      if (p !== undefined) lab += ` <em>${o.ck ? (o.ck[0] === 'charm' ? '✨ Charm' : '⚖️ Trade') + ' ' : ''}${Math.round(p * 100)}%</em>`;
      if (o.cost) lab += ` <em>${o.cost}🪙</em>`;
      e.innerHTML = fmt(lab); if (o.cost && st.coins < o.cost) e.disabled = true;
      e.onclick = () => {
        G.Au.sfx('tap'); let target = o.go;
        if (o.ck) { const ok = Math.random() < D.chance(o.ck[0], o.ck[1], cur); G.UI.toast(ok ? '✔ It lands' : '✖ It falls flat', ok ? 'gold' : 'bad'); if (ok) { if (o.fx) o.fx(st); S.addXp(o.ck[0], 8); } else { if (o.ffx) o.ffx(st); target = o.fail; } }
        else if (o.fx) o.fx(st);
        G.save(); G.UI.hud();
        if (target === null) return D.close();
        show(resolve(target));
      };
      box.appendChild(e);
    }
  }
})();
