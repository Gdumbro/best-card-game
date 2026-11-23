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

  // Win-screen flourish: falling confetti pieces.
  function confetti() {
    var screen = el('end-screen');
    var colors = ['#fbbf24', '#a855f7', '#e879f9', '#4ade80', '#38bdf8', '#ef4444'];
    for (var i = 0; i < 70; i++) {
      var p = document.createElement('div');
      p.className = 'confetti';
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (2.2 + Math.random() * 2.2) + 's';
      p.style.animationDelay = (Math.random() * 0.9) + 's';
      screen.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 6000); })(p);
    }
  }

  function showScreen(id) {
    ['title-screen', 'game-screen', 'end-screen'].forEach(function (s) {
      el(s).classList.toggle('hidden', s !== id);
    });
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
