/* ai.js — VOID DECK: greedy opponent ("THE VOID").
   Scores every card in its hand under the CURRENT rule and the PENDING
   next-round rule, then plays the highest-scoring card.
   Beatable, not trivially dumb: it plays strong cards, saves Void cards
   for when it is behind, and respects INVERT / MIRROR.
   Pure logic, no DOM. Works in browser and in Node (for tests). */
(function (root) {
  'use strict';

  var Rules = root.VoidRules;

  // Score one card as a play THIS round under `activeRule`.
  // `ctx` = { aiHp, playerHp, prevWinSuit, pendingRule, handSize }
  function scoreCard(card, activeRule, ctx) {
    var hpBehind = ctx.playerHp - ctx.aiHp; // >0 means AI is losing
    var v = card.value;

    // --- Void cards: sacrifice the round to set the next rule ---
    if (card.suit === 'void') {
      var s = 4; // base: a Void is never a free throwaway
      // A rule is already pending for next round — don't waste a second Void
      // stacking on top of it; save it for a later flip.
      if (ctx.pendingRule) s -= 5;
      if (hpBehind > 0) s += 6 + Math.min(6, hpBehind); // behind -> flip the rules
      if (hpBehind < 0) s -= 6;                          // ahead -> don't rock the boat
      // DOUBLE and INVERT are the strongest flips when losing badly.
      if (card.rule === 'double' && hpBehind >= 4) s += 4;
      if (card.rule === 'invert' && hpBehind >= 3) s += 3;
      if (card.rule === 'surge') s += 1; // more cards = more options
      return s;
    }

    // --- Normal cards ---
    var score = v; // value is the core of the score

    if (activeRule === 'invert') {
      score = 11 - v; // low cards become the strong plays
      if (v <= 3) score += 2;
    }
    if (activeRule === 'mirror' && ctx.prevWinSuit) {
      if (card.suit === ctx.prevWinSuit) score += 12; // matching suit wins outright
      else score -= 2;
    }
    if (activeRule === 'double') {
      score += v * 0.5; // bigger margin matters more under double damage
    }
    // Resonance: playing the previous winning suit adds +3 if we win.
    if (ctx.prevWinSuit && card.suit === ctx.prevWinSuit) score += 2;

    // When the pending rule (set for NEXT round) is INVERT, save low cards:
    // don't burn a 1-2 now if it would be a killer next round.
    if (ctx.pendingRule === 'invert' && v <= 2) score -= 3;
    // When the pending rule is SWAP, this hand will be handed to the opponent
    // next round — so burn the BEST card now instead of saving it for them.
    if (ctx.pendingRule === 'swap') score += v * 0.6;
    // When the pending rule is DOUBLE, save a big card for the doubled round.
    if (ctx.pendingRule === 'double' && v >= 9) score -= 2;

    // Desperation: when nearly dead, prefer the biggest swing available.
    if (ctx.aiHp <= 5) score += v * 0.3;
    return score;
  }

  // Pick the best card index from `hand`. Deterministic tie-break: first best.
  function chooseCard(hand, activeRule, ctx) {
    var bestIdx = 0, bestScore = -Infinity;
    for (var i = 0; i < hand.length; i++) {
      var s = scoreCard(hand[i], activeRule, ctx);
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
    return bestIdx;
  }

  var api = { scoreCard: scoreCard, chooseCard: chooseCard };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.VoidAI = api;
})(typeof window !== 'undefined' ? window : globalThis);
