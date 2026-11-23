/* deck.js — VOID DECK: 45-card deck, 4 suits (color AND shape) + 5 Void cards.
   Pure logic, no DOM. Works in browser and in Node (for tests). */
(function (root) {
  'use strict';

  // Suits are distinguished by BOTH color and shape, so the game is readable
  // even in grayscale / for color-blind players.
  var SUITS = {
    ember: { id: 'ember', name: 'Ember', color: '#ef4444', symbol: '▲', shape: 'triangle' },
    tide:  { id: 'tide',  name: 'Tide',  color: '#38bdf8', symbol: '≈', shape: 'wave' },
    stone: { id: 'stone', name: 'Stone', color: '#9ca3af', symbol: '◆', shape: 'diamond' },
    gale:  { id: 'gale',  name: 'Gale',  color: '#4ade80', symbol: '✿', shape: 'flower' },
    void:  { id: 'void',  name: 'Void',  color: '#c084fc', symbol: '🌀', shape: 'swirl' }
  };

  // The five Void rules, one card each. A Void card's `rule` is the rule it sets.
  var VOID_RULES = ['invert', 'swap', 'double', 'mirror', 'surge'];

  var _uid = 0;
  function makeCard(value, suitId, rule) {
    if (!SUITS[suitId]) throw new Error('Unknown suit: ' + suitId);
    if (suitId === 'void') {
      if (VOID_RULES.indexOf(rule) === -1) throw new Error('Void card needs a valid rule');
      value = 0;
    } else if (value < 1 || value > 10) {
      throw new Error('Suit card value must be 1-10, got ' + value);
    }
    _uid += 1;
    return {
      id: 'c' + _uid,
      value: value,          // 1-10 for suits, 0 for Void
      suit: suitId,
      rule: rule || null,    // only Void cards carry a rule
      name: suitId === 'void'
        ? 'Void · ' + rule
        : SUITS[suitId].name + ' ' + value
    };
  }

  // Full 45-card deck: values 1-10 in 4 suits (40) + 5 Void cards.
  function buildDeck() {
    var cards = [];
    ['ember', 'tide', 'stone', 'gale'].forEach(function (suitId) {
      for (var v = 1; v <= 10; v++) cards.push(makeCard(v, suitId));
    });
    VOID_RULES.forEach(function (rule) { cards.push(makeCard(0, 'void', rule)); });
    return cards;
  }

  function shuffle(cards, rand) {
    rand = rand || Math.random;
    var a = cards.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // A draw pile that reshuffles the discard pile when it runs out.
  function createPile(seedCards, rand) {
    return {
      draw: shuffle(seedCards, rand),
      discard: [],
      rand: rand || Math.random,
      drawOne: function () {
        if (this.draw.length === 0) {
          if (this.discard.length === 0) return null; // truly out of cards
          this.draw = shuffle(this.discard, this.rand);
          this.discard = [];
        }
        return this.draw.pop();
      },
      discardCard: function (card) { if (card) this.discard.push(card); },
      size: function () { return this.draw.length + this.discard.length; }
    };
  }

  function drawHand(pile, n) {
    var hand = [];
    if (!pile || n <= 0) return hand;
    for (var i = 0; i < n; i++) {
      var c = pile.drawOne();
      if (c) hand.push(c);
    }
    return hand;
  }

  function isVoidCard(card) { return !!card && card.suit === 'void'; }

  // Sort a hand for display: Void first, then by suit, then value desc.
  function sortHand(hand) {
    var order = { void: 0, ember: 1, tide: 2, stone: 3, gale: 4 };
    return hand.slice().sort(function (a, b) {
      if (order[a.suit] !== order[b.suit]) return order[a.suit] - order[b.suit];
      return b.value - a.value;
    });
  }

  var api = {
    SUITS: SUITS, VOID_RULES: VOID_RULES,
    buildDeck: buildDeck, shuffle: shuffle,
    createPile: createPile, drawHand: drawHand, sortHand: sortHand,
    makeCard: makeCard, isVoidCard: isVoidCard
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.VoidDeck = api;
})(typeof window !== 'undefined' ? window : globalThis);
