import { pause, randomInt, getPercent } from './util.js';
import { Howl } from 'howler';

let totalKBLoaded = 0;
const loadImage = (bundledPath) => {
  return new Promise(resolve => {
    let loaderImage = new Image();
    loaderImage.src = bundledPath;
    loaderImage.addEventListener('load', () => resolve(fetch(bundledPath).then(r => r.blob())));
  });
};
const importAll = async require => {
  let reduced = require.keys().reduce((acc, next) => {
    acc[next.replace("./", "")] = require(next);
    return acc;
  }, {});
  document.querySelector('#samurai-kirby .loading-bar > .details').innerText = `loading images...`;
  let count = 0;
  for (const imagePath in reduced) {
    count++;
    let loadResponse = await loadImage(reduced[imagePath]);
    let imageKB = Math.round(loadResponse.size / 1024);
    totalKBLoaded += imageKB;
    let percentDone = getPercent(count / Object.keys(reduced).length);
    document.querySelector('#samurai-kirby .loading-bar > .label').innerText = `${percentDone}% (${totalKBLoaded}kb)`;
    document.querySelector('#samurai-kirby .loading-bar > .filler').style.scale = `${percentDone}% 1`;
    if (percentDone === 100) {
      document.querySelector('#samurai-kirby .loading-bar > .details').innerText = `done!`;
    }
  }
  return reduced;
};

export default class KirbyOnTheDrawGame {
  constructor() {
    this.className = 'kotd';
    this.images;
    this.sounds;
    this.soundOn = true;
    this.level = 0;
    this.veil = document.querySelector('#kotd > .veil');
    console.log('----------- initialized KirbyOnTheDrawGame!');
    this.assignHandlers();
  }

  get phase() {
    return document.getElementById('kotd').className;
  }

  set phase(newPhase) {
    document.getElementById('kotd').className = newPhase;
  }

  async loadImages() {
    let startedLoadAt = Date.now();
    this.images = await importAll(
      require.context("../media/kotd/images/", true, /\.(png)$/)
    );
    console.log('loaded in', (Date.now() - startedLoadAt));
    // document.querySelector('#kotd .loading-bar > .details').innerText = `Loaded ${totalKBLoaded}kb in ${Date.now() - startedLoadAt}ms`;
  }

  loadSounds() {
    this.sounds = {};
    // this.loadSound('whiplow', 'mp3');
    // this.loadSound('gong', 'mp3');
    // this.loadSound('wind', 'mp3');
    // this.loadSound('call', 'mp3');
    // this.loadSound('strike', 'mp3');
    // this.loadSound('foul', 'mp3');
    // this.loadSound('goodclear', 'mp3');
    // this.loadSound('badclear', 'mp3');
    // this.loadSound('select', 'mp3');
  }

  loadSound(soundName, extension) {
    this.sounds[soundName] = {};
    this.sounds[soundName].file = new Howl({
      src: [require(`../media/${this.className}/sounds/${soundName}.${extension}`)],
      preload: true,
    });
  }

  playSound(soundName) {
    console.log('>>>>> PLAYING', soundName);
    if (this.soundOn) {
      this.sounds[soundName].file.play();
    }
  }
  stopSound(soundName) {
    console.log('<<<<< STOPPING', soundName);
    if (this.soundOn) {
      this.sounds[soundName].file.stop();
    }
  }

  createSprites() {
    
  }

  assignHandlers() {
    document.getElementById('kotd-button').addEventListener('click', e => {
      e.target.classList.add('invisible');
      this.startGame();
    });
  }


  async startGame() {
    console.log('--------------- starting KirbyOnTheDraw --------------------');
    this.phase = '';
    document.getElementById(this.className).classList.remove('hidden');
  }

  async printNumerals(score, targetElement, color, timeLimit) {
    // if (color) {

    //   targetElement.classList.add(color);
    // }
    // targetElement.innerHTML = '';
    // let scoreNumerals = score.toString().split('');
    // scoreNumerals.forEach(numeral => {
    //   let numeralElement = document.createElement('div');
    //   numeralElement.className = 'score-numeral';
    //   numeralElement.style.backgroundImage = `url(${this.images[`numerals/tile00${numeral}.png`]})`;
    //   targetElement.append(numeralElement);
    // });
    // if (timeLimit) {
    //   await pause(timeLimit);
    //   targetElement.classList.remove(color);
    // }
  }

  async showInstructions() {
    this.phase = 'showing-instructions';
    if (!this.images) {
      await this.loadImages();
    }
    // if (!this.sounds) {
    //   this.loadSounds();
    // }
  }

  async handleAButtonClick() {
    if (this.phase === 'called') {
      // Kirby wins
      clearInterval(this.callInterval);
      this.phase = 'kirby-attacking';
      this.stopSound('call');
      this.playSound('strike');
      await this.displaySlashes(90);
      this.kirbyElement.style.backgroundImage = `url(${this.images['samuraikirby/attacking.png']})`;
      document.getElementById('enemy').style.backgroundImage = `url(${this.images[this.attacker.name + '/defeated.png']})`;
      this.roundTimes[this.level] = this.currentRoundTime;
      let scoreForRound = ((this.attacker.drawSpeed + (this.level * 250)) - (this.currentRoundTime * 5)) * (this.level + 1);
      this.totalScore += scoreForRound;
      document.getElementById('score-change-display').classList.add('showing');
      this.printNumerals(scoreForRound, document.getElementById('score-change-display'), 'green', 1800);
      this.printNumerals(this.totalScore, document.getElementById('player-score-display'), 'white');
      await pause(1500);
      document.getElementById('score-change-display').classList.remove('showing');
      this.level++;
      this.advanceToRound(this.level);
    } else if (this.phase === 'waiting') {
      // Kirby fouled
      clearInterval(this.callInterval);
      this.phase = 'fouled';
      this.stopSound('gong');
      this.stopSound('wind');
      this.playSound('foul');
      this.enemyElement.style.backgroundImage = `url(${this.images[this.attacker.name + '/defeated.png']})`;
      let penalty = Math.round((1000 - this.attacker.drawSpeed) / 2);
      this.totalScore -= penalty;
      if (this.totalScore <= 0) {
        this.totalScore = 0;
      }
      document.getElementById('score-change-display').classList.add('showing');
      this.printNumerals(penalty, document.getElementById('score-change-display'), 'red', 1200);
      this.printNumerals(this.totalScore, document.getElementById('player-score-display'), 'white');
      await this.loseLife(1000);
      document.getElementById('score-change-display').classList.remove('showing');
    } else if (this.phase === 'showing-score') {
      // Game is over, button says 'Try Again'
      this.endGame(true);
    } else if (this.phase === 'showing-instructions') {
      await pause(300);
      this.startGame();
    }
  }

  async handleQuitButtonClick() {
    this.playSound('select');
    await pause(150);
    this.endGame();
  }
}