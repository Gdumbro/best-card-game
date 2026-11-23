/* rules.js — VOID DECK: the 5 Void rules, round comparison, and combos.
   Pure logic, no DOM. Works in browser and in Node (for tests). */
(function (root) {
  'use strict';

  // Each rule applies to the NEXT round only, then expires.
  var RULES = {
    invert: {
      id: 'invert', name: 'INVERT',
      banner: 'LOWEST WINS',
      desc: 'Next round the LOWEST card wins.',
      short: 'Lowest card wins'
    },
    swap: {
      id: 'swap', name: 'SWAP',
      banner: 'HANDS SWAP',
      desc: 'Next round the two hands are swapped at the start of the round.',
      short: 'Hands swap'
    },
    double: {
      id: 'double', name: 'DOUBLE',
      banner: 'DOUBLE DAMAGE',
      desc: 'Next round the winner deals 2x damage.',
      short: 'Winner deals 2x damage'
    },
    mirror: {
      id: 'mirror', name: 'MIRROR',
      banner: 'MATCH THE WINNING SUIT',
      desc: 'Next round the winner is whoever played the suit matching the PREVIOUS round\'s winning card suit (value ignored). If both match or neither matches, higher value wins.',
      short: 'Match the previous winning suit'
    },
    surge: {
      id: 'surge', name: 'SURGE',
      banner: 'DRAW 2 EXTRA',
      desc: 'Next round both players draw 2 extra cards (hand can go to 7).',
      short: 'Both draw 2 extra cards'
    }
  };

  var COMBO = { VOID_CHAIN_BONUS: 5, RESONANCE_BONUS: 3 };

  // A Void card always counts as value 0 for the round it is played in.
  function effectiveValue(card) {
    return card.suit === 'void' ? 0 : card.value;
  }

  // If both players played Void in the same round: tie, no damage,
  // and the PLAYER's Void rule applies for next round.
  function bothVoid(pCard, aCard) {
    return pCard.suit === 'void' && aCard.suit === 'void';
  }

  // Decide who played Void this round (if any) -> the rule it sets for NEXT round.
  // Player's Void wins the tie-break when both play Void.
  function voidRuleSet(pCard, aCard) {
    if (pCard.suit === 'void') return pCard.rule;
    if (aCard.suit === 'void') return aCard.rule;
    return null;
  }

  // Resolve one round. activeRule is the rule set by a Void card last round
  // (null if none). prevWinSuit is the suit of the previous round's winning
  // card (needed by MIRROR; null on round 1).
  // Returns { winner: 'player'|'ai'|'tie', baseDamage, damage, reason,
  //           voidChain: bool, resonance: bool, nextRule }
  function resolveRound(pCard, aCard, activeRule, prevWinSuit) {
    if (!pCard || !aCard) throw new Error('resolveRound needs two cards');
    // Unknown rule ids are treated as "no rule" rather than crashing.
    if (activeRule && !RULES[activeRule]) activeRule = null;
    var result = {
      winner: 'tie', baseDamage: 0, damage: 0, reason: '',
      voidChain: false, resonance: false, nextRule: voidRuleSet(pCard, aCard)
    };

    if (bothVoid(pCard, aCard)) {
      result.reason = 'Both played Void — the Void swallows the round. Your rule applies next round.';
      return result;
    }

    var pv = effectiveValue(pCard);
    var av = effectiveValue(aCard);
    var winner = null;
    var reason = '';

    if (activeRule === 'mirror' && prevWinSuit) {
      var pMatch = pCard.suit === prevWinSuit;
      var aMatch = aCard.suit === prevWinSuit;
      if (pMatch && !aMatch) { winner = 'player'; reason = 'MIRROR — your suit matches the last winning suit!'; }
      else if (aMatch && !pMatch) { winner = 'ai'; reason = 'MIRROR — the Void\'s suit matches the last winning suit!'; }
      // both match or neither matches -> fall through to value comparison
    }
    if (!winner) {
      if (activeRule === 'invert') {
        if (pv < av) { winner = 'player'; reason = 'INVERT — lowest card wins!'; }
        else if (av < pv) { winner = 'ai'; reason = 'INVERT — lowest card wins!'; }
      } else {
        if (pv > av) { winner = 'player'; reason = 'Higher card wins.'; }
        else if (av > pv) { winner = 'ai'; reason = 'Higher card wins.'; }
      }
    }
    if (!winner) {
      result.reason = 'Equal cards — a perfect tie. No damage.';
      return result;
    }

    var base = Math.max(1, Math.abs(pv - av));
    var dmg = base;

    // DOUBLE: winner deals 2x damage.
    if (activeRule === 'double') { dmg = base * 2; reason += ' DOUBLE x2!'; }

    // COMBO (a) Void Chain — win a round while a Void rule is active: +5.
    if (activeRule) {
      dmg += COMBO.VOID_CHAIN_BONUS;
      result.voidChain = true;
    }
    // COMBO (b) Resonance — winning card's suit matches previous round's
    // winning card suit: +3. (Void cards have no resonance: they are value 0
    // and never win a round on their own.)
    var winCard = winner === 'player' ? pCard : aCard;
    if (prevWinSuit && winCard.suit !== 'void' && winCard.suit === prevWinSuit) {
      dmg += COMBO.RESONANCE_BONUS;
      result.resonance = true;
    }

    result.winner = winner;
    result.baseDamage = base;
    result.damage = dmg;
    result.reason = reason;
    return result;
  }

  // Human-readable banner text for the active rule.
  function bannerText(ruleId) {
    return ruleId && RULES[ruleId] ? RULES[ruleId].banner : '';
  }

  var api = {
    RULES: RULES, COMBO: COMBO,
    effectiveValue: effectiveValue, bothVoid: bothVoid,
    voidRuleSet: voidRuleSet, resolveRound: resolveRound, bannerText: bannerText
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.VoidRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
