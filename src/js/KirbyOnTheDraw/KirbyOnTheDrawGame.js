import { pause, randomInt, getPercent } from '../util.js';
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
    this.difficulty = 0;
    this.roundTimer = 0;
    this.spawnCount = 0;
    this.level = 1;
    this.reloading = false;
    this.spawnInterval;
    this.intervalCounter = -1;
    this.spawnStarted = 0;
    this.spawnTickDuration = 100;
    this.activeEnemies = {};
    this.scores = {
      player: 0,
      lemon: 0,
      strawberry: 0,
      lime: 0
    };
    this.players = [];
    this.levels = [
      // difficulty 0
      [
        undefined,
        {
          roundLength: 3,
          groupAmount: 1,
          groupTimeGap: 180, // ms
          groupFrequency: 16, // .1s
          bombPercentChance: 10,
          originLimit: {
            min: 0,
            max: 1
          },
        }
      ],
      // difficulty 1
      [
        undefined,
        {
          roundLength: 60,
          groupAmount: 3,
          groupTimeGap: 300, // ms
          groupFrequency: 24, // .1s
          bombPercentChance: 20,
          originLimit: {
            min: 0,
            max: 3
          },
        }
      ],
      // difficulty 2
      [
        undefined,
        {
          roundLength: 120,
          groupAmount: 5 ,
          groupTimeGap: 400, // ms
          groupFrequency: 36, // .1s
          bombPercentChance: 30,
          originLimit: {
            min: 1,
            max: 5
          },
        }
      ],
    ];

    this.veil = document.querySelector('#kotd > .veil');
    this.readySign = document.querySelector('#kotd-screen > #ready');
    this.finishSign = document.querySelector('#kotd-screen > #finish');

    this.enemyOrigins = [
      'bottom-edge',
      'behind-bar',
      'left-edge',
      'right-edge',
      'top-edge',
      'bottom-window-edge',
    ];
    this.enemySizes = [
      'xxsmall',
      'xsmall',
      'small',
      'normal',
      'large',
    ];

    this.cpuKirbyData = [
      undefined,
      {
        name: 'lemon',
        targetFrequency: 8.5,
        reactionSpeed: 400,
        reloadTime: 60,
        maxAmmo: 8,
        bombAvoidance: 70,
      },
      {
        name: 'strawberry',
        targetFrequency: 7.5,
        reactionSpeed: 400,
        reloadTime: 60,
        maxAmmo: 8,
        bombAvoidance: 80,
      },
      {
        name: 'lime',
        targetFrequency: 8,
        reactionSpeed: 400,
        reloadTime: 60,
        maxAmmo: 8,
        bombAvoidance: 90,
      },
    ];

    this.enemyData = [
      { name: 'waddledee', pointValue: 10, },
      { name: 'cappy', pointValue: 10, },
      { name: 'brontoburt', pointValue: 10, },
      { name: 'knucklejoe', pointValue: 20, },
      { name: 'waddledoo', pointValue: 20, },
      { name: 'chefkawasaki', pointValue: 40, },
      { name: 'bonkers', pointValue: 40, },
      { name: 'dedede', pointValue: 100, },
      { name: 'metaknight', pointValue: 100, },
      { name: 'bomb', pointValue: -50, },
    ];

    this.assignHandlers();
    this.players.push(new Kirby('player'), new Kirby('lemon'), new Kirby('strawberry'), new Kirby('lime'));
    this.players.filter(player => player.type !== 'player').forEach((player, p, arr) => {
      player.cpuKirbyData = this.cpuKirbyData[p+1];
      player.reloadTime = player.cpuKirbyData.reloadTime;
      player.maxAmmo = player.cpuKirbyData.maxAmmo;
    });

    this.timerContainer = document.createElement('div');
    this.timerContainer.classList.add('numeral-area');
    this.timerContainer.innerHTML = `
      <div class="score-number black"></div>
      <div class="score-number black"></div>
      <div class="score-number black"></div>
    `;
    document.querySelector('#kotd-screen #kotd-round-timer-area').appendChild(this.timerContainer);

    console.log('----------- KirbyOnTheDrawGame constructor finished --->');
  }

  get phase() {
    return document.getElementById('kotd').className;
  }

  set phase(newPhase) {
    document.getElementById('kotd').className = newPhase;
  }

  get currentLevel() {
    return this.levels[this.difficulty][this.level];
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
      require.context("../../media/kotd/images/", true, /\.(png)$/)
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
      src: [require(`../../media/${this.className}/sounds/${soundName}.${extension}`)],
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
    let randomEnemyIndex = randomInt(0, this.enemyData.length - 2);
    let enemyType = this.enemyData[randomEnemyIndex].name;
    let enemyOrigin = this.enemyOrigins[randomInt(this.currentLevel.originLimit.min, this.currentLevel.originLimit.max)];
    let sizeLimit = { min: 2, max: 3 };
    if (enemyOrigin === 'behind-bar') {
      sizeLimit.min = 1;
      sizeLimit.max = 1;
    }
    if (enemyOrigin === 'bottom-window-edge') {
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
    let dataIndex = enemyType === 'bomb' ? this.enemyData.length - 1 : randomEnemyIndex;
    newEnemy.enemyData = this.enemyData[dataIndex];

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
    // await pa .container.classList.add('cpu-vulnerable');
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
  
  renderRoundTimer() {
    let timerString = this.roundTimer.toString();
    let leadingZeros = 3 - timerString.length;
    timerString = 'x'.repeat(leadingZeros) + timerString;
    [...document.querySelectorAll('#kotd-round-timer-area .score-number')].forEach((numeral, n) => {
      let timerNumeral = timerString[n];
      if (timerNumeral !== 'x') {
        numeral.style.display = 'block';
        numeral.style.backgroundPositionY = `calc(var(--ds-screen-height) / 12 * -${timerNumeral})`;
      } else {
        numeral.style.display = 'none';
      }
    });
  }

  assignHandlers() {
    document.getElementById('kotd-button').addEventListener('click', e => {
      e.target.classList.add('invisible');
      this.startGame();
    });
    document.getElementById('kotd-score-bar').addEventListener('pointerdown', async () => {
      await this.players[0].reloadAmmo();
      this.renderPlayerAmmo();
    });
    [...document.getElementsByClassName('level-sign')].forEach((signElement, s, arr) => {
      signElement.addEventListener('pointerdown', e => {
        e.target.classList.add('selected');
        this.difficulty = s;
        document.getElementById('level-indicator').style.backgroundPositionY = `calc(var(--spacing-y) * ${s})`;
        arr.filter(signElement => signElement !== e.target && signElement.classList.contains('selected')).forEach(signElement => {
          signElement.classList.remove('selected');
        });
      });
    });
  }

  async descendSign(element, noFlip, leaveDelay, postFlipDelay) {
    element.classList.add('showing');
    element.classList.add('descending');
    await pause(1000); // sign reach bottom screen center
    if (!noFlip) {
      await pause(500); // wait to flip
      element.classList.add('flat');
      await pause(200); // sign completely flat
      element.classList.add('go'); // change bg while flat
      element.classList.remove('flat'); 
      await pause(200); // wait for unflatten
      await pause(postFlipDelay);
    } else {
      await pause(leaveDelay);
    }
    element.classList.add('leaving');
    await pause(300); // wait for scale out
    element.classList.remove('leaving');
    element.classList.remove('go');
    element.classList.remove('showing');
  }

  async startGame() {
    console.log('--------------- KirbyOnTheDraw.startGame() --------------------');
    this.veil.classList.add('showing');
    await pause(600);
    this.renderPlayerScore();
    this.phase = 'round-started';
    this.veil.classList.remove('showing');
    await pause(400); // veil fade out - sign flip
    await this.descendSign(this.readySign, false, 0, 800);
    document.getElementById('kotd-top-curtains').classList.remove('closed');
    document.getElementById('kotd-bottom-curtains').classList.remove('closed');
    await pause(800); // curtain time
    // document.getElementById(this.className).classList.remove('hidden');
    for (let player of this.players) {
      await player.reloadAmmo();
      await pause(200);
    }

    this.roundTimer = this.currentLevel.roundLength;
    let timerElement = document.getElementById(`kotd-round-timer-area`);
    if (this.roundTimer <= 99 && !timerElement.classList.contains('double-digit')) {
      timerElement.classList.add('double-digit');
    } else if (this.roundTimer > 99 && timerElement.classList.contains('double-digit')) {
      timerElement.classList.remove('double-digit');
    }
    this.renderRoundTimer();
    await pause(1000);

    this.spawnStarted = Date.now();
    this.intervalCounter = 0;
    this.spawnInterval = setInterval(async () => {

      // accesses CPU Kirby instances via this.players[1-3]
      //  who call fireAtTarget(), 
      //    which accesses the target Enemy instance via this.activeEnemies[id],
      //      and calls Enemy.die()

      if ((this.intervalCounter % this.currentLevel.groupFrequency) === 0) {
        for (let i = 0; i < this.currentLevel.groupAmount; i++) {
          let pauseTime = this.currentLevel.groupTimeGap * i;
          pause(pauseTime).then(() => {
            this.spawnEnemy().then(() => {
              return;
            });
          });
        }
      }
      this.players.filter(player => player.type !== 'player').forEach(player => {
        if (this.intervalCounter % player.cpuKirbyData.targetFrequency === 0) {
          let randomTarget = this.randomEnemy(randomInt(0, 100) <= player.cpuKirbyData.bombAvoidance);
          if (randomTarget) {
            player.fireAtTarget(randomTarget);
          }
        }
      });

      this.intervalCounter++;
      if (this.intervalCounter % 10 === 0) {
        this.roundTimer--;
        this.renderRoundTimer();
        let timerElement = document.getElementById(`kotd-round-timer-area`);
        if (this.roundTimer <= 99 && !timerElement.classList.contains('double-digit')) {
          timerElement.classList.add('double-digit');
        }
        if (this.roundTimer === 10) {
          timerElement.classList.add('low');
        }
        if (this.roundTimer === 0) {
          clearInterval(this.spawnInterval);
          this.showResultsScreen();
        }
      }
    }, this.spawnTickDuration);
  }

  async showResultsScreen() {
    document.getElementById('kotd-top-curtains').classList.add('closed');
    document.getElementById('kotd-bottom-curtains').classList.add('closed');
    document.getElementById(`kotd-round-timer-area`).classList.remove('low');
    await this.descendSign(this.finishSign, true, 1000);
    document.querySelector('#kotd-screen > .top-screen.results-screen').classList.add('showing');
    document.querySelector('#kotd-screen > .bottom-screen.results-screen').classList.add('showing');
    document.getElementById('kotd-top-curtains').classList.remove('closed');
    document.getElementById('kotd-bottom-curtains').classList.remove('closed');
    for (let player of this.players) {
      if (document.querySelector(`.kirby-stack.${player.type}`).classList.contains('rank-1')) {
        player.startCelebrationSequence();
      } else {
        player.startBlinkSequence();        
        await pause(randomInt(500, 1200));
      }
    }
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