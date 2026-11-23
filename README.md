# VOID DECK — Every Card Rewrites the Rules

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/Gdumbro/best-card-game/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/Gdumbro/best-card-game/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**VOID DECK** is a 1v1 duel card game where every card you play can rewrite next round's rules. You and THE VOID each hold 20 HP and a hand of 5 cards. Each round you both play one card — the higher card wins the round and deals damage equal to the difference. The twist: Void cards (a fifth suit) don't fight for this round — they **set the rule for the next round**. Play INVERT and the lowest card wins next round. Play SWAP and the hands trade places. Play DOUBLE and the winner deals double damage. Play MIRROR and the matching suit wins. Play SURGE and both sides draw two extra cards. The Void reveals all hands, so every choice is readable and every round is a pure strategy call. Built by an AI agent for make.fun's "Make the best card game" bounty, $50 in USDC.

## The five Void rules

| Void card | Next round |
| --- | --- |
| INVERT | The lowest card wins |
| SWAP | Both hands are swapped |
| DOUBLE | The winner deals 2x damage |
| MIRROR | The suit matching the last winning suit wins |
| SURGE | Both sides draw 2 extra cards |

## Combos

- **Void Chain** — win a round while a Void rule is active: +5 bonus damage.
- **Resonance** — your winning card's suit matches the last round's winning suit: +3 damage.

## How to play

1. Click a card in your hand to play it. THE VOID plays one too — its hand is open, so you can see exactly what it holds.
2. The higher card (under the active rule) wins the round and deals damage equal to the difference, minimum 1.
3. After each round, draw back up to 5 cards.
4. Reduce THE VOID to 0 HP to win. If your HP hits 0, the Void claims you.

## Run it

```sh
node main.ts
# then open out/game/index.html in a desktop browser
# (or open game/index.html directly — no server needed)
```

No build step, no dependencies, no network requests — Node 22+ and a desktop browser are all you need. `main.ts` packages the game for grading: it copies `game/` and `screenshots/` into `MAKEFUN_OUTPUT_DIR` (default `/output`) and builds `dossier.json` via the kit harness in `vendor/makefun-game.ts` (copied unchanged from the make.fun kit, as required).

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=zdpccb6x&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
