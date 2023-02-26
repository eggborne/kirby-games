import { pause, randomInt, getPercent } from './util.js';
import { Howl } from 'howler';
import Enemy from './Enemy';

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
    this.spawnCount = 0;
    this.level = 0;
    this.spawnInterval;
    this.enemies = [];
    this.ammo = 8;
    this.scores = {
      player: 0,
      yellow: 0,
      pink: 0,
      lime: 0
    };

    this.veil = document.querySelector('#kotd > .veil');

    this.enemyData = [
      {
        name: 'waddledee',
        pointValue: 10,
      },
      {
        name: 'cappy',
        pointValue: 10,
      },
      {
        name: 'brontoburt',
        pointValue: 10,
      },
      {
        name: 'knucklejoe',
        pointValue: 20,
      },
      {
        name: 'waddledoo',
        pointValue: 20,
      },
      {
        name: 'chefkawasaki',
        pointValue: 40,
      },
      {
        name: 'bonkers',
        pointValue: 40,
      },
      {
        name: 'dedede',
        pointValue: 100,
      },
      {
        name: 'metaknight',
        pointValue: 100,
      },
    ];

    this.assignHandlers();
    console.log('----------- KirbyOnTheDrawGame constructor finished --->');
  }

  get phase() {
    return document.getElementById('kotd').className;
  }

  set phase(newPhase) {
    document.getElementById('kotd').className = newPhase;
  }

  enemyByName(enemyName) {
    console.log('looking up', enemyName);
    for (let enemyListing of this.enemyData) {
      console.log('checking', enemyListing);
      if (enemyListing.name === enemyName) {
        return enemyListing;
      }
    }
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

  async spawnEnemy() {
    let randomType = this.enemyData[randomInt(0, this.enemyData.length - 1)].name;
    let randomOrigin = 'bottom-edge';
    let newEnemy = new Enemy(randomType, randomOrigin);
    this.spawnCount++;
    newEnemy.container.id = `enemy-${this.spawnCount}`;
    newEnemy.container.querySelector('.kotd-enemy').addEventListener('pointerdown', async e => {
      if (!e.target.parentElement.classList.contains('dead') && this.ammo > 0) {
        this.ammo--;
        this.renderAmmo();
        document.querySelector('.kotd-kirby.player').classList.add('fired');
        await pause(80);
        document.querySelector('.kotd-kirby.player').classList.remove('fired');
        document.querySelector('.kotd-kirby.player').classList.add('firing');

        e.target.parentElement.classList.add('dead');
        this.scores.player += this.enemyByName(randomType).pointValue;
        console.log('socre now', this.scores.player);
        this.renderScore(this.scores.player);
        await pause(600);
        e.target.parentElement.parentElement.removeChild(e.target.parentElement);

      } else {
        console.log('no ammo');
        document.querySelector('#kotd #no-ammo').classList.add('showing');
        await pause(600);
        document.querySelector('#kotd #no-ammo').classList.remove('showing');
      }
      
    });
    this.enemies.push(newEnemy);
    await pause(30);
    newEnemy.container.classList.remove('obscured');
  }

  renderAmmo() {
    [...document.getElementsByClassName('ammo-slot')].forEach((slot, s) => {
      if (s < this.ammo) {
        slot.classList.remove('empty');
      } else {
        slot.classList.add('empty');
      }
    });
  }

  renderScore(newScore) {
    let scoreString = newScore.toString();
    let leadingZeros = 4 - scoreString.length;
    scoreString = '0'.repeat(leadingZeros) + scoreString;
    [...document.querySelectorAll('#numeral-area > .red-number')].forEach((numeral, n) => {
      let scoreNumeral = scoreString[n];
      numeral.style.backgroundPositionY = `calc(var(--ds-screen-height) / 12 * -${scoreNumeral})`;
    });
  }

  assignHandlers() {
    document.getElementById('kotd-button').addEventListener('click', e => {
      e.target.classList.add('invisible');
      this.startGame();
    });
    document.getElementById('kotd-ammo-bar').addEventListener('pointerdown', e => {
      this.reloadAmmo();
    });
    this.renderScore(this.scores.player);
  }

  async reloadAmmo() {
    document.getElementById('kotd-ammo-bar').classList.add('off-y');
    let reloadTime = (8 - this.ammo) * 60;
    document.querySelector('#kotd-score-bar #cylinder').classList.add('spinning');
    await pause(reloadTime);
    document.querySelector('#kotd-score-bar #cylinder').classList.remove('spinning');
    await pause(80);
    this.ammo = 8;
    this.renderAmmo();
    document.getElementById('kotd-ammo-bar').classList.remove('off-y');
  }

  async startGame() {
    console.log('--------------- starting KirbyOnTheDraw --------------------');
    this.phase = '';
    document.getElementById(this.className).classList.remove('hidden');
    await pause(1000);
    this.spawnEnemy();
    await pause(400);
    this.spawnEnemy();
    await pause(400);
    this.spawnEnemy();
    this.spawnInterval = setInterval(async () => {
      this.spawnEnemy();
      await pause(600);
      this.spawnEnemy();
      await pause(600);
      this.spawnEnemy();
    }, 2400);
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