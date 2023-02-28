import { pause, randomInt, getPercent } from './util.js';
import { Howl } from 'howler';
import Enemy from './Enemy';
import Kirby from './Kirby';

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
    document.querySelector('#kotd .loading-bar > .label').innerText = `${percentDone}% (${totalKBLoaded}kb)`;
    document.querySelector('#kotd .loading-bar > .filler').style.scale = `${percentDone}% 1`;
    if (percentDone === 100) {
      document.querySelector('#kotd .loading-bar > .details').innerText = `done!`;
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
    this.roundTimer = 0;
    this.spawnCount = 0;
    this.level = 0;
    this.reloading = false;
    this.spawnInterval;
    this.intervalCounter = -1;
    this.spawnStarted = 0;
    this.spawnTickDuration = 100;
    this.activeEnemies = {};
    this.scores = {
      player: 0,
      yellow: 0,
      pink: 0,
      lime: 0
    };
    this.players = [];
    this.levels = [
      undefined,
      {
        totalEnemies: 30,
        groupAmount: 5,
        groupTimeGap: 250, // ms
        groupFrequency: 25, // .1s
        bombPercentChance: 25,
      }
    ];
    this.level = 1;

    this.veil = document.querySelector('#kotd > .veil');

    this.enemyOrigins = [
      'top-edge',
      'bottom-edge',
      'left-edge',
      'right-edge',
      'behind-bar',
    ];
    this.enemySizes = [
      'xsmall',
      'small',
      'normal',
      'large',
    ];

    this.cpuKirbyData = [
      undefined,
      {
        name: 'yellow',
        targetFrequency: 8,
        reactionSpeed: 2000,
      },
      {
        name: 'pink',
        targetFrequency: 8,
        reactionSpeed: 500,
      },
      {
        name: 'lime',
        targetFrequency: 7,
        reactionSpeed: 100,
      },
    ];

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
      {
        name: 'bomb',
        pointValue: (-50),
      },
    ];

    this.assignHandlers();
    this.players.push(new Kirby('player'), new Kirby('yellow'), new Kirby('pink'), new Kirby('lime'));
    this.players.forEach((player, p) => {
      player.cpuKirbyData = this.cpuKirbyData[p];
    });
    console.log('----------- KirbyOnTheDrawGame constructor finished --->');
  }

  get phase() {
    return document.getElementById('kotd').className;
  }

  set phase(newPhase) {
    document.getElementById('kotd').className = newPhase;
  }

  get currentLevel() {
    return this.levels[this.level];
  }

  itemByAttribute(attribute, searchValue, searchObj) {
    for (let listItem of searchObj) {
      if (listItem[attribute] === searchValue) {
        return listItem;
      }
    }
  }

  async loadImages() {
    let startedLoadAt = Date.now();
    this.images = await importAll(
      require.context("../media/kotd/images/", true, /\.(png)$/)
    );
    console.log('loaded in', (Date.now() - startedLoadAt), this.images);
    await pause(100);
    document.querySelector('#kotd .loading-bar > .details').innerText = `Loaded ${totalKBLoaded}kb in ${Date.now() - startedLoadAt}ms`;
  }

  loadSounds() {
    this.sounds = {};
    // this.loadSound('whiplow', 'mp3');
  }

  loadSound(soundName, extension) {
    this.sounds[soundName] = {};
    this.sounds[soundName].file = new Howl({
      src: [require(`../media/${this.className}/sounds/${soundName}.${extension}`)],
      preload: true,
    });
  }

  playSound(soundName) {
    if (this.soundOn) {
      this.sounds[soundName].file.play();
    }
  }
  
  stopSound(soundName) {
    if (this.soundOn) {
      this.sounds[soundName].file.stop();
    }
  }

  async spawnEnemy() {
    let enemyType = this.enemyData[randomInt(0, this.enemyData.length - 2)].name;
    let enemyOrigin = this.enemyOrigins[randomInt(0, this.enemyOrigins.length - 1)];
    let sizeLimit = { min: 1, max: 3 };
    if (enemyOrigin === 'behind-bar') {
      sizeLimit.min = 0;
      sizeLimit.max = 0;
    }
    let enemySize = this.enemySizes[randomInt(sizeLimit.min, sizeLimit.max)];
    if (randomInt(0, 100) <= this.currentLevel.bombPercentChance) {
      enemyType = 'bomb';
    }

    let newEnemy = new Enemy(enemyType, enemyOrigin, enemySize);
    this.spawnCount++;
    newEnemy.container.id = `${enemyType}-${this.spawnCount}`;
    newEnemy.game = this;

    newEnemy.container.querySelector('.kotd-enemy').addEventListener('pointerdown', (e) => {
      let elementId = e.target.parentElement.id;
      let enemyInstance = this.activeEnemies[elementId];
      this.players[0].fireAtTarget(enemyInstance);
      this.renderPlayerScore();
      this.renderPlayerAmmo();
    });

    this.activeEnemies[newEnemy.container.id] = newEnemy;
    newEnemy.pointValue = this.itemByAttribute('name', enemyType, this.enemyData).pointValue;
    await pause(20);
    newEnemy.container.classList.remove('obscured');
    await pause(300);
    newEnemy.container.classList.add('cpu-vulnerable');
  }

  renderRanks() {
    let sortedPlayers = [...this.players].sort((a, b) => {
      return b.score - a.score;
    });
    
    sortedPlayers.forEach((player, p) => {
      let newRankClass = `rank-${p + 1}`;
      if (!player.rankContainer.classList.contains(newRankClass)) {
        player.rankContainer.classList = ['rank']; // remove any existing rank class
        player.rankContainer.classList.add(newRankClass);
      }
    });
  }

  renderPlayerAmmo() {
    [...document.getElementsByClassName('ammo-slot')].forEach((slot, s) => {
      if (s < this.players[0].ammo) {
        slot.classList.remove('empty');
      } else {
        slot.classList.add('empty');
      }
    });
  }

  renderPlayerScore() {
    let scoreString = this.players[0].score.toString();
    let leadingZeros = 4 - scoreString.length;
    scoreString = '0'.repeat(leadingZeros) + scoreString;
    [...document.querySelectorAll('#kotd-score-area .score-number')].forEach((numeral, n) => {
      let scoreNumeral = scoreString[n];
      numeral.style.backgroundPositionY = `calc(var(--ds-screen-height) / 12 * -${scoreNumeral})`;
    });
  }

  assignHandlers() {
    document.getElementById('kotd-button').addEventListener('click', e => {
      e.target.classList.add('invisible');
      this.startGame();
    });
    document.getElementById('kotd-score-bar').addEventListener('pointerdown', async () => {
      await this.players[0].reloadAmmo();
      // await this.reloadAmmo();
      this.renderPlayerAmmo();
    });
  }

  async startGame() {
    console.log('--------------- KirbyOnTheDraw.startGame() --------------------');
    this.renderPlayerScore();
    this.phase = 'round-started';
    await pause(600);
    document.getElementById('kotd-top-curtains').classList.remove('closed');
    document.getElementById('kotd-bottom-curtains').classList.remove('closed');
    await pause(800);
    document.getElementById(this.className).classList.remove('hidden');
    for (let player of this.players) {
      await player.reloadAmmo(true);
      await pause(300);
    }
    await pause(1000);
    this.spawnStarted = Date.now();
    this.intervalCounter = 0;
    this.spawnInterval = setInterval(async () => {

      // accesses CPU Kirby instances via this.players[1-3]
      //  who call fireAtTarget(), 
      //    which accesses the target Enemy instance via this.activeEnemies[id],
      //      and calls Enemy.die()

      if ((this.intervalCounter % this.currentLevel.groupFrequency) === 0) {
        console.log('---SPAWNING at', this.intervalCounter);
        for (let i = 0; i < this.currentLevel.groupAmount; i++) {
          let pauseTime = this.currentLevel.groupTimeGap * i;
          pause(pauseTime).then(() => {
            this.spawnEnemy().then(() => {
              return;
            });
          });
        }
      }
      if ((this.intervalCounter % 8) === 0) {
        let firingKirby = this.players[randomInt(1,2)];
        let randomTarget = this.randomEnemy();
        if (randomTarget) {
          firingKirby.fireAtTarget(randomTarget);
        }
      }
      if ((this.intervalCounter % 6) === 0) {
        let limeKirby = this.players[3];
        let randomTarget = this.randomEnemy(randomInt(0,3));
        if (randomTarget) {
          limeKirby.fireAtTarget(randomTarget);
        }
        this.renderRanks();
      }

      this.intervalCounter++;
      if (this.intervalCounter % 1000 === 0) {
        this.roundTimer++;
      }
    }, this.spawnTickDuration);
  }

  randomEnemy(enemiesOnly) {
    let validKeyList = Object.keys(this.activeEnemies).filter(key =>
      !this.activeEnemies[key].dead &&
      !this.activeEnemies[key].obscured &&
      ((Date.now() - this.activeEnemies[key].spawnedAt) > 400)
    );
    if (enemiesOnly) {
      validKeyList = validKeyList.filter(key => this.activeEnemies[key].type !== 'bomb');
    }
    let randomKey = validKeyList[randomInt(0, validKeyList.length - 1)];
    let randomTarget = this.activeEnemies[randomKey];
    return randomTarget;
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
}