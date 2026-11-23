/* game.js — VOID DECK: state, round loop, HP, win/loss, ?shot= states.
   Browser only (uses VoidDeck / VoidRules / VoidAI / VoidRender). */
(function (root) {
  'use strict';

  var Deck = root.VoidDeck;
  var Rules = root.VoidRules;
  var AI = root.VoidAI;
  var Render = root.VoidRender;

  var MAX_HP = 20;
  var HAND_SIZE = 5;
  var SURGE_BONUS = 2;

  function newState() {
    var pile = Deck.createPile(Deck.buildDeck());
    return {
      pile: pile,
      playerHp: MAX_HP,
      aiHp: MAX_HP,
      playerHand: Deck.drawHand(pile, HAND_SIZE),
      aiHand: Deck.drawHand(pile, HAND_SIZE),
      round: 1,
      activeRule: null,      // rule applying to the CURRENT round
      pendingRule: null,     // rule set by a Void card, applies NEXT round
      prevWinSuit: null,     // suit of last round's winning card (MIRROR / Resonance)
      locked: false,         // input lock while a round resolves
      over: false,
      roundsPlayed: 0,
      combos: 0
    };
  }

  var state = null;
  var timers = [];

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  // ---- Round flow -------------------------------------------------------

  // SWAP: at the START of a round, the two hands are exchanged.
  function applySwapIfNeeded() {
    if (state.activeRule === 'swap') {
      var tmp = state.playerHand;
      state.playerHand = state.aiHand;
      state.aiHand = tmp;
      Render.setMessage('SWAP! The hands change owners — play what the Void held.');
    }
  }

  function refillHands() {
    // After each round both players draw to refill to 5, plus 2 extra if
    // SURGE is active for the next round (hand can go to 7).
    var target = HAND_SIZE + (state.pendingRule === 'surge' ? SURGE_BONUS : 0);
    while (state.playerHand.length < target) {
      var c = state.pile.drawOne();
      if (!c) break;
      state.playerHand.push(c);
    }
    while (state.aiHand.length < target) {
      var d = state.pile.drawOne();
      if (!d) break;
      state.aiHand.push(d);
    }
  }

  function renderAll() {
    Render.renderHand('player-hand', state.playerHand, onPlayerCard);
    Render.renderHand('ai-hand', state.aiHand, null);
    Render.renderHP(state);
    Render.renderBanner(state.activeRule);
    Render.renderRound(state);
    var lock = state.locked || state.over;
    document.getElementById('player-hand').classList.toggle('locked', lock);
  }

  function startRound() {
    state.activeRule = state.pendingRule;
    state.pendingRule = null;
    applySwapIfNeeded();
    Render.clearPlayed();
    Render.hideComboBadge();
    renderAll();
    if (state.activeRule && state.activeRule !== 'swap') {
      Render.setMessage('VOID RULE active this round: ' + Rules.RULES[state.activeRule].desc);
    } else if (!state.activeRule) {
      Render.setMessage('Choose a card to play.');
    }
  }

  function onPlayerCard(card, element) {
    if (state.locked || state.over) return;
    state.locked = true;
    renderAll();
    if (element) element.classList.add('played-out');
    playRound(card);
  }

  // Keyboard play: keys 1-7 play the Nth card in the (sorted) player hand.
  function onKeyPlay(n) {
    if (!state || state.locked || state.over) return;
    var sorted = Deck.sortHand(state.playerHand);
    var card = sorted[n - 1];
    if (!card) return;
    var element = document.querySelector('#player-hand .card[data-card-id="' + card.id + '"]');
    onPlayerCard(card, element);
  }

  function playRound(pCard) {
    // Remove player's card from hand.
    state.playerHand = state.playerHand.filter(function (c) { return c.id !== pCard.id; });

    // AI picks greedily under the current rule (and the pending next rule).
    var aiIdx = AI.chooseCard(state.aiHand, state.activeRule, {
      aiHp: state.aiHp, playerHp: state.playerHp,
      prevWinSuit: state.prevWinSuit, pendingRule: state.pendingRule,
      handSize: state.aiHand.length
    });
    var aCard = state.aiHand.splice(aiIdx, 1)[0];

    var result = Rules.resolveRound(pCard, aCard, state.activeRule, state.prevWinSuit);
    state.roundsPlayed += 1;
    Render.renderPlayed(pCard, aCard, result.winner);

    // Track the winning suit for next round's MIRROR / Resonance.
    if (result.winner === 'player') state.prevWinSuit = pCard.suit;
    else if (result.winner === 'ai') state.prevWinSuit = aCard.suit;
    // On a tie the previous winning suit stays as it was.

    // The Void card played this round sets NEXT round's rule.
    state.pendingRule = result.nextRule;

    // Apply damage.
    var msg = result.reason;
    if (result.winner === 'player') {
      state.aiHp = Math.max(0, state.aiHp - result.damage);
      Render.floatDamage('ai-hp-text', result.damage, false);
      msg += ' You deal ' + result.damage + ' damage!';
    } else if (result.winner === 'ai') {
      state.playerHp = Math.max(0, state.playerHp - result.damage);
      Render.floatDamage('player-hp-text', result.damage, false);
      msg += ' The Void deals ' + result.damage + ' damage!';
    } else {
      msg += ' No damage.';
    }
    if (result.voidChain) { state.combos += 1; Render.showComboBadge('COMBO! VOID CHAIN +5'); msg += ' [Void Chain +5]'; }
    else if (result.resonance) { state.combos += 1; Render.showComboBadge('COMBO! RESONANCE +3'); msg += ' [Resonance +3]'; }
    if (result.nextRule) {
      msg += ' Void sets next round: ' + Rules.RULES[result.nextRule].name + '.';
    }

    state.pile.discardCard(pCard);
    state.pile.discardCard(aCard);
    Render.setMessage(msg);
    renderAll();

    later(function () {
      if (state.playerHp <= 0 || state.aiHp <= 0) return endGame(state.aiHp <= 0);
      state.round += 1;
      refillHands();
      state.locked = false;
      startRound();
    }, 1700);
  }

  // ---- Win / loss --------------------------------------------------------

  function endGame(playerWon) {
    state.over = true;
    state.locked = true;
    renderAll();
    var title = document.getElementById('end-title');
    var sub = document.getElementById('end-subtitle');
    if (playerWon) {
      title.textContent = 'VICTORY — The Void Bows to You';
      title.className = 'end-title win';
      sub.textContent = 'You bent the rules of the Void and broke them.';
      Render.confetti();
    } else {
      title.textContent = 'DEFEAT — The Void Claims You';
      title.className = 'end-title lose';
      sub.textContent = 'The Void rewrites the rules. Play again and take them back.';
    }
    document.getElementById('end-stats').innerHTML =
      'Rounds played: <b>' + state.roundsPlayed + '</b> &nbsp;·&nbsp; ' +
      'Combos triggered: <b>' + state.combos + '</b> &nbsp;·&nbsp; ' +
      'Your HP: <b>' + Math.max(0, state.playerHp) + '</b> &nbsp;·&nbsp; ' +
      'Void HP: <b>' + Math.max(0, state.aiHp) + '</b>';
    later(function () { Render.showScreen('end-screen'); }, 900);
  }

  // ---- Boot / restart ----------------------------------------------------

  function startGame() {
    clearTimers();
    state = newState();
    Render.showScreen('game-screen');
    startRound();
  }

  // ---- Deterministic ?shot= states (screenshot aid only) ----------------
  // Fixed scripted positions; the real game is untouched without ?shot=.
  function scriptedCard(value, suit, rule) {
    var c = Deck.makeCard(value, suit, rule);
    return c;
  }

  function applyShot(shot) {
    if (shot === 'title') { Render.showScreen('title-screen'); return; }
    if (shot === 'win' || shot === 'loss') {
      state = newState();
      state.over = true;
      state.roundsPlayed = 7;
      state.combos = 2;
      if (shot === 'win') { state.aiHp = 0; state.playerHp = 14; }
      else { state.playerHp = 0; state.aiHp = 11; }
      // Render the end screen directly, without the round delay.
      var title = document.getElementById('end-title');
      var sub = document.getElementById('end-subtitle');
      if (shot === 'win') {
        title.textContent = 'VICTORY — The Void Bows to You';
        title.className = 'end-title win';
        sub.textContent = 'You bent the rules of the Void and broke them.';
        Render.confetti();
      } else {
        title.textContent = 'DEFEAT — The Void Claims You';
        title.className = 'end-title lose';
        sub.textContent = 'The Void rewrites the rules. Play again and take them back.';
      }
      document.getElementById('end-stats').innerHTML =
        'Rounds played: <b>7</b> &nbsp;·&nbsp; Combos triggered: <b>2</b> &nbsp;·&nbsp; ' +
        'Your HP: <b>' + state.playerHp + '</b> &nbsp;·&nbsp; Void HP: <b>' + state.aiHp + '</b>';
      Render.showScreen('end-screen');
      return;
    }
    if (shot === 'table') {
      // Mid-duel cover: both hands 5 cards open, 2 cards face-up on the table,
      // banner VOID RULE active, mid-game HP, combo badge visible.
      state = newState();
      state.playerHp = 14;
      state.aiHp = 17;
      state.round = 4;
      state.activeRule = 'invert';
      state.prevWinSuit = 'ember';
      state.playerHand = [
        scriptedCard(9, 'ember'), scriptedCard(7, 'tide'),
        scriptedCard(4, 'stone'), scriptedCard(0, 'void', 'double'),
        scriptedCard(2, 'gale')
      ];
      state.aiHand = [
        scriptedCard(10, 'tide'), scriptedCard(8, 'ember'),
        scriptedCard(5, 'gale'), scriptedCard(3, 'stone'),
        scriptedCard(0, 'void', 'mirror')
      ];
      Render.showScreen('game-screen');
      renderAll();
      Render.renderPlayed(scriptedCard(7, 'ember'), scriptedCard(6, 'tide'));
      Render.setMessage('INVERT — lowest card wins! The Void deals 6 damage! [Void Chain +5]');
      Render.showComboBadge('COMBO! VOID CHAIN +5');
      return;
    }
  }

  function getState() { return state; }

  var api = {
    newState: newState, startGame: startGame, applyShot: applyShot,
    getState: getState, onPlayerCard: onPlayerCard, onKeyPlay: onKeyPlay
  };
  root.VoidGame = api;
})(typeof window !== 'undefined' ? window : globalThis);
