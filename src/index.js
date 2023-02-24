import './css/style.css';
import { pause } from './js/util.js';
import { Howl } from 'howler';
import SamuraiKirbyGame from './js/SamuraiKirbyGame';
// import BombRallyGame from './js/BombRallyGame';
let isMobile = true;
class KirbyGames {
  constructor() {
    this.sounds = {};
    this.soundOn = true;
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

  playSound(soundName) {
    if (this.soundOn) {
      this.sounds[soundName].file.play();
    }
  }

  loadSound(soundName, extension) {
    this.sounds[soundName] = {};
    this.sounds[soundName].file = new Howl({
      src: [require(`./media/title/sounds/${soundName}.${extension}`)],
      preload: true,
    });
  }

  loadSounds() {
    this.loadSound('blip', 'mp3');
    this.loadSound('select', 'mp3');
    this.loadSound('whiplow', 'mp3');
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
  app.loadSounds();

  [...document.getElementsByClassName('game-selection')].forEach(element => {
    element.addEventListener('pointerdown', e => {
      app.playSound('blip');
      app.selectedGame = e.target;
      console.log(app.selectedGame);
    });
  });

  document.getElementById('start-button').addEventListener('click', async e => {
    app.playSound('select');
    let selectedGameTitle = app.selectedGame.id.split('-').slice(0, 2).join('-');
    console.log('selectedGame', selectedGameTitle);
    app.game = app.games[selectedGameTitle]();
    await pause(150);
    document.getElementById('game-select-screen').classList.add('hidden');
    app.game.showInstructions();
  });
});