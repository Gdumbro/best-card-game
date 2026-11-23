/* main.js — VOID DECK: boot.
   No ?shot= -> title screen, fully playable. ?shot=title|table|win|loss
   shows a deterministic screenshot state (the game still plays normally
   after Play / Play Again). */
(function () {
  'use strict';

  function boot() {
    var params = new URLSearchParams(window.location.search);
    var shot = params.get('shot');
    var KNOWN_SHOTS = ['title', 'table', 'win', 'loss'];
    var validShot = KNOWN_SHOTS.indexOf(shot) !== -1 ? shot : null;

    document.getElementById('play-btn').addEventListener('click', function () {
      VoidGame.startGame();
    });
    document.getElementById('again-btn').addEventListener('click', function () {
      VoidGame.startGame();
    });
    // Keyboard: Enter/Space starts from the title screen.
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') &&
          !document.getElementById('title-screen').classList.contains('hidden')) {
        e.preventDefault();
        VoidGame.startGame();
        return;
      }
      // Keys 1-7 play a card during the duel.
      if (/^[1-7]$/.test(e.key) &&
          !document.getElementById('game-screen').classList.contains('hidden')) {
        VoidGame.onKeyPlay(parseInt(e.key, 10));
      }
    });

    if (validShot) {
      VoidGame.applyShot(validShot);
    } else {
      VoidRender.showScreen('title-screen');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
