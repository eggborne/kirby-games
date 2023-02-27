import './css/style.css';
import { pause } from './js/util.js';
import { Howl, Howler } from 'howler';
import SamuraiKirbyGame from './js/SamuraiKirbyGame';
import KirbyOnTheDrawGame from './js/KirbyOnTheDrawGame';
// import BombRallyGame from './js/BombRallyGame';

let isMobile = true;
class KirbyGames {
  constructor() {
    this.userSettings = {
      userVolume: 100,
    };
    this.sounds = {};
    this.soundOn = true;
    this.game;
    this.games = {
      'samurai-kirby': () => new SamuraiKirbyGame(),
      'kotd': () => new KirbyOnTheDrawGame(),
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

  let userSettings = JSON.parse(localStorage.getItem('kirbyGamesSettings'));
  if (userSettings) {
    Howler.volume(userSettings.userVolume / 100);
    document.querySelector('#sound-controls > input').value = userSettings.userVolume;
  }

  let app = new KirbyGames();
  app.loadSounds();

  [...document.getElementsByClassName('game-selection')].forEach(element => {
    element.addEventListener('pointerdown', e => {
      app.playSound('blip');
      app.selectedGame = e.target;
    });
  });

  document.getElementById('start-button').addEventListener('click', async e => {
    app.playSound('select');
    let splitID = app.selectedGame.id.split('-');
    let selectedGameTitle = splitID.slice(0, splitID.length - 1).join('-');
    app.game = app.games[selectedGameTitle]();
    await pause(150);
    document.getElementById('game-select-screen').classList.add('hidden');
    if (selectedGameTitle === 'kotd') {
      document.getElementById('samurai-kirby').classList.add('display-none');
      document.getElementById('kotd').classList.remove('display-none');
    } else if (selectedGameTitle === 'samurai-kirby') {
      document.getElementById('kotd').classList.add('display-none');
      document.getElementById('samurai-kirby').classList.add('display-none');
    } 
    app.game.showInstructions();
  });

  document.querySelector('#sound-controls > input').addEventListener('change', async e => {
    app.userSettings.userVolume = e.target.value;
    localStorage.setItem('kirbyGamesSettings', JSON.stringify(app.userSettings));
    Howler.volume(app.userSettings.userVolume / 100);
    app.playSound('select');
  });

  document.getElementById('mute-icon').addEventListener('pointerdown', async e => {
    Howler.volume(0);
    document.querySelector('#sound-controls > input').value = '0';
  });

  document.getElementById('full-icon').addEventListener('pointerdown', async e => {
    Howler.volume(1);
    app.playSound('select');
    document.querySelector('#sound-controls > input').value = '100';
  });
});