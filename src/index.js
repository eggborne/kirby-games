import './css/style.css';
import QuickDrawGame from './js/QuickDrawGame';

window.addEventListener('load', () => {
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  document.getElementById('quick-draw-selection').addEventListener('click', () => {
    document.getElementById('game-select').classList.add('hidden');
    document.getElementById('quick-draw').classList.remove('hidden');
    let game = new QuickDrawGame();
    document.getElementById('quick-draw-button').addEventListener('pointerdown', e => {
      game.handleAButtonClick(e);
    });
    game.playRound(1);
  });
});

