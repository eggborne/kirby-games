import './css/style.css';
import QuickDrawGame from './js/QuickDrawGame';
// import BombRallyGame from './js/BombRallyGame';

class KirbyGames {
  constructor() {
    this.game;
    this.games = {
      'quickdraw': () => new QuickDrawGame(),
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
  document.getElementById('start-button').addEventListener('pointerdown', async e => {
    
    let selectedGameTitle = app.selectedGame.id.split('-').slice(0, 2).join('');
    
    app.game = app.games[selectedGameTitle]();
    document.getElementById('game-select-screen').classList.add('hidden');
    app.game.showInstructions();
  });

});