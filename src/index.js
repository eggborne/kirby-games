import './css/style.css';
import { pause } from './js/util.js';
import SamuraiKirbyGame from './js/SamuraiKirbyGame';
// import BombRallyGame from './js/BombRallyGame';
let isMobile = true;
class KirbyGames {
  constructor() {
    this.game;
    this.games = {
      'samurai-kirby': () => new SamuraiKirbyGame(),
      // 'bombrally': () => new BombRallyGame(),
    };

  }
  get selectedGame() {
    let selected;
    [...document.getElementsByClassName('game-selection')].forEach(element => {
      if (element.classList.contains('selected')) {
        selected = element;
      }
    });
    return selected;
  }
  set selectedGame(newSelectedGame) {
    if (this.selectedGame) {
      this.selectedGame.classList.remove('selected');
    }
    newSelectedGame.classList.add('selected');
  }
}

window.addEventListener('load', () => {
  if (isMobile) {
    document.getElementById('button-name').innerHTML = 'the button!';
  } else {
    document.getElementById('button-name').innerHTML = 'the space bar!';
  }
  document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  window.addEventListener('resize', () => {
    document.documentElement.style.setProperty('--actual-height', window.innerHeight + 'px');
  });
  
  let app = new KirbyGames();
  
  [...document.getElementsByClassName('game-selection')].forEach(element => {
    element.addEventListener('pointerdown', e => {
      app.selectedGame = e.target;
      console.log(app.selectedGame);
    });
  });
  document.getElementById('start-button').addEventListener('click', async e => {
    let selectedGameTitle = app.selectedGame.id.split('-').slice(0, 2).join('-');
    console.log('selectedGame', selectedGameTitle);
    app.game = app.games[selectedGameTitle]();
    await pause(150);
    document.getElementById('game-select-screen').classList.add('hidden');
    app.game.showInstructions();
  });
});