/* render.js — VOID DECK: DOM rendering + animations.
   Slide/flip/snap via CSS transitions, floating damage numbers,
   win-screen flourish (confetti). Browser only. */
(function (root) {
  'use strict';

  var Deck = root.VoidDeck;
  var Rules = root.VoidRules;

  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  // Build one card element. `opts.faceDown` renders a card back.
  function cardEl(card, opts) {
    opts = opts || {};
    var d = document.createElement('div');
    if (opts.faceDown) {
      d.className = 'card back';
      d.innerHTML = '<div class="center-sym">🌀</div>';
      return d;
    }
    var suit = Deck.SUITS[card.suit];
    d.className = 'card suit-' + card.suit;
    d.dataset.cardId = card.id;
    if (card.suit === 'void') {
      d.innerHTML =
        '<div class="corner tl"><span class="val">0</span><span class="sym">' + suit.symbol + '</span></div>' +
        '<div class="center-sym">' + suit.symbol + '</div>' +
        '<div class="suit-name">VOID</div>' +
        '<div class="rule-name">' + esc(Rules.RULES[card.rule].name) + '</div>';
      d.title = 'Void · ' + Rules.RULES[card.rule].name + ' — ' + Rules.RULES[card.rule].desc;
    } else {
      d.innerHTML =
        '<div class="corner tl"><span class="val">' + card.value + '</span><span class="sym">' + suit.symbol + '</span></div>' +
        '<div class="center-sym">' + suit.symbol + '</div>' +
        '<div class="suit-name">' + suit.name.toUpperCase() + '</div>' +
        '<div class="corner br"><span class="val">' + card.value + '</span><span class="sym">' + suit.symbol + '</span></div>';
      d.title = suit.name + ' ' + card.value;
    }
    return d;
  }

  // Render a hand into a container. `onCardClick` (player hand) gets (card, element).
  function renderHand(containerId, hand, onCardClick) {
    var box = el(containerId);
    box.innerHTML = '';
    Deck.sortHand(hand).forEach(function (card) {
      var c = cardEl(card);
      if (onCardClick) {
        c.setAttribute('tabindex', '0');
        c.setAttribute('role', 'button');
        c.addEventListener('click', function () { onCardClick(card, c); });
        c.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCardClick(card, c); }
        });
      }
      box.appendChild(c);
    });
  }

  function renderHP(state) {
    setBar('player-hp-fill', 'player-hp-text', state.playerHp);
    setBar('ai-hp-fill', 'ai-hp-text', state.aiHp);
  }
  function setBar(fillId, textId, hp) {
    var fill = el(fillId), text = el(textId);
    var pct = Math.max(0, Math.min(100, hp / 20 * 100));
    fill.style.width = pct + '%';
    fill.classList.toggle('low', hp <= 6);
    fill.classList.toggle('mid', hp > 6 && hp <= 12);
    text.textContent = String(Math.max(0, hp));
  }

  // BIG banner above the table while a Void rule is active for next round.
  function renderBanner(activeRule) {
    var banner = el('rule-banner');
    if (activeRule) {
      el('rule-banner-text').textContent = Rules.bannerText(activeRule);
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  function renderRound(state) {
    el('round-text').textContent = 'ROUND ' + state.round;
    el('deck-text').textContent = 'DECK ' + state.pile.draw.length + ' · DISCARD ' + state.pile.discard.length;
  }

  function setMessage(msg) { el('message-line').textContent = msg; }

  function showComboBadge(text) {
    var b = el('combo-badge');
    b.textContent = text || 'COMBO!';
    b.classList.remove('hidden');
    // Restart the pop animation each time.
    b.style.animation = 'none';
    void b.offsetWidth;
    b.style.animation = '';
  }
  function hideComboBadge() { el('combo-badge').classList.add('hidden'); }

  // Place the two played cards on the table with a flip-in animation.
  // `winner` ('player' | 'ai' | 'tie') gets a glow on the winning card.
  function renderPlayed(pCard, aCard, winner) {
    var ps = el('player-played'), as = el('ai-played');
    ps.innerHTML = ''; as.innerHTML = '';
    if (aCard) { var ac = cardEl(aCard); ac.classList.add('flip'); if (winner === 'ai') ac.classList.add('winner-card'); as.appendChild(ac); }
    if (pCard) { var pc = cardEl(pCard); pc.classList.add('flip'); if (winner === 'player') pc.classList.add('winner-card'); ps.appendChild(pc); }
  }
  function clearPlayed() { el('player-played').innerHTML = ''; el('ai-played').innerHTML = ''; }

  // Floating damage number over a target element (hp bar anchor).
  function floatDamage(targetId, amount, isHeal) {
    var anchor = el(targetId);
    if (!anchor) return;
    var r = anchor.getBoundingClientRect();
    var layer = el('float-layer');
    var d = document.createElement('div');
    d.className = 'float-dmg' + (isHeal ? ' heal' : '');
    d.textContent = (isHeal ? '+' : '−') + amount;
    d.style.left = (r.left + r.width / 2 - 14) + 'px';
    d.style.top = (r.top - 10) + 'px';
    layer.appendChild(d);
    setTimeout(function () { d.remove(); }, 1300);
  }

  // Win-screen flourish: falling confetti pieces across the WHOLE screen.
  // Live game: a fresh random scatter every win. ?shot=win: a fixed seed
  // (mulberry32) so the screenshot is reproducible and shows a good spread
  // on every capture. Pieces start mid-fall (negative animation-delay),
  // so the screen is full of confetti from the first frame instead of
  // only the top strip filling in slowly.
  function confetti() {
    var screen = el('end-screen');
    screen.classList.add('win-flourish');
    var params = new URLSearchParams(window.location.search);
    var seeded = params.get('shot') === 'win';
    var seed = 20261123;
    function rand() {
      if (!seeded) return Math.random();
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    var colors = ['#fbbf24', '#a855f7', '#e879f9', '#4ade80', '#38bdf8', '#ef4444', '#fde68a', '#ffffff'];
    var COUNT = 130;
    for (var i = 0; i < COUNT; i++) {
      var p = document.createElement('div');
      p.className = 'confetti';
      var dur = 3.0 + rand() * 2.5; // 3.0-5.5s fall: slow enough that a
      // screenshot ~1s after load still catches most pieces mid-screen.
      p.style.left = (rand() * 100) + 'vw';
      p.style.width = (8 + Math.floor(rand() * 7)) + 'px';   // 8-14px wide
      p.style.height = (10 + Math.floor(rand() * 9)) + 'px'; // 10-18px tall
      p.style.background = colors[i % colors.length];
      if (rand() < 0.25) p.style.borderRadius = '50%'; // some round pieces
      p.style.animationDuration = dur + 's';
      // Negative delay = piece starts part-way down its fall path.
      p.style.animationDelay = (-rand() * dur * 0.8) + 's';
      p.style.setProperty('--drift', (Math.floor(rand() * 81) - 40) + 'px');
      screen.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 8000); })(p);
    }
  }

  function showScreen(id) {
    ['title-screen', 'game-screen', 'end-screen'].forEach(function (s) {
      el(s).classList.toggle('hidden', s !== id);
    });
    // End-screen flourish hooks (presentation only): game.js sets the title
    // class (win/lose) before calling this, so CSS can paint the right
    // backdrop — gold halo + sparkles for a win, dim Void swirl for a loss.
    var end = el('end-screen');
    var titleCls = (el('end-title').className || '');
    end.classList.toggle('win-flourish', id === 'end-screen' && titleCls.indexOf('win') !== -1);
    end.classList.toggle('lose-emblem', id === 'end-screen' && titleCls.indexOf('lose') !== -1);
  }

  var api = {
    cardEl: cardEl, renderHand: renderHand, renderHP: renderHP,
    renderBanner: renderBanner, renderRound: renderRound,
    setMessage: setMessage, showComboBadge: showComboBadge,
    hideComboBadge: hideComboBadge, renderPlayed: renderPlayed,
    clearPlayed: clearPlayed, floatDamage: floatDamage,
    confetti: confetti, showScreen: showScreen
  };
  root.VoidRender = api;
})(typeof window !== 'undefined' ? window : globalThis);
