import './css/style.css';
import QuickDrawGame from './js/QuickDrawGame';

let game;

window.addEventListener('load', () => {
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  if (!game) {
    game = new QuickDrawGame();
  }
  document.getElementById('quick-draw-button').addEventListener('pointerdown', e => {
    game.handleAButtonClick(e);
  });
  document.getElementById('quit-button').addEventListener('click', e => {
    game.handleQuitButtonClick(e);
  });
  document.getElementById('quick-draw-selection').addEventListener('click', () => {
    document.getElementById('game-select').classList.add('hidden');
    document.getElementById('quick-draw').classList.remove('hidden');
    game.playRound(0);
  });
});

