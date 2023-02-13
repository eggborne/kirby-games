import './css/style.css';

window.addEventListener('load', () => {
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  document.getElementById('quick-draw-selection').addEventListener('click', () => {
    document.getElementById('game-select').classList.add('hidden');
    document.getElementById('quick-draw').classList.remove('hidden');
  });
});

