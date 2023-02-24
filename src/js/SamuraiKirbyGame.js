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
  document.querySelector('#loading-bar > #details').innerText = `loading images...`;
  let count = 0;
  for (const imagePath in reduced) {
    count++;
    let loadResponse = await loadImage(reduced[imagePath]);
    let imageKB = Math.round(loadResponse.size / 1024);
    totalKBLoaded += imageKB;
    let percentDone = getPercent(count / Object.keys(reduced).length);
    document.querySelector('#loading-bar > #label').innerText = `${percentDone}% (${totalKBLoaded}kb)`;
    document.querySelector('#loading-bar > #filler').style.scale = `${percentDone}% 1`;
    if (percentDone === 100) {
      document.querySelector('#loading-bar > #details').innerText = `done!`;
    }
  }
  return reduced;
};
let images;
let sounds;

export default class SamuraiKirbyGame {
  constructor() {
    this.className = 'samurai-kirby';
    this.images = {};
    this.sounds = {};
    this.soundOn = true;
    this.roundStartDelay = 800;
    this.difficulty = 1;
    this.totalScore = 0;
    this.level = 0;
    this.attacker;
    this.scorePost = document.getElementById('score-post');
    this.veil = document.querySelector('#samurai-kirby-screen > .veil');
    this.calledAt;
    this.currentRoundTime = 0;
    this.roundTimes = [];
    this.maxLives = 3;
    this.lives = this.maxLives;

    this.attackers = [
      {
        name: 'eyeballman',
        drawSpeed: 800,
        suspenseTime: { min: 3000, max: 5000 },
      },
      {
        name: 'wheelbro',
        drawSpeed: 500,
        suspenseTime: { min: 2000, max: 5000 },
      },
      {
        name: 'fishchef',
        drawSpeed: 400,
        suspenseTime: { min: 3000, max: 7000 },
      },
      {
        name: 'dedede',
        drawSpeed: 300,
        suspenseTime: { min: 2000, max: 4000 },
      },
      {
        name: 'metaknight',
        drawSpeed: 200,
        suspenseTime: { min: 4000, max: 9000 },
      },
    ];

    this.buildLifeMarkers();
    console.log('----------- initialized SamuraiKirbyGame!');
    this.assignHandlers();
  }

  get phase() {
    return document.getElementById('samurai-kirby').className;
  }

  set phase(newPhase) {
    document.getElementById('samurai-kirby').className = newPhase;
  }

  async loadImages() {
    let startedLoadAt = Date.now();
    images = await importAll(
      require.context("../media/samurai-kirby/images/", true, /\.(png)$/)
    );
    console.log('loaded in', (Date.now() - startedLoadAt));
    document.querySelector('#loading-bar > #details').innerText = `Loaded ${totalKBLoaded}kb in ${Date.now() - startedLoadAt}ms`;
    return images;
  }

  loadSounds() {
    sounds = {};
    this.loadSound('whiplow', 'mp3');
    this.loadSound('gong', 'mp3');
    this.loadSound('wind', 'mp3');
    this.loadSound('call', 'mp3');
    this.loadSound('strike', 'mp3');
    this.loadSound('foul', 'mp3');
    this.loadSound('goodclear', 'mp3');
    this.loadSound('badclear', 'mp3');
    this.loadSound('select', 'mp3');
  }

  loadSound(soundName, extension) {
    sounds[soundName] = {};
    sounds[soundName].file = new Howl({
      src: [require(`../media/${this.className}/sounds/${soundName}.${extension}`)],
      preload: true,
    });
  }

  playSound(soundName) {
    console.log('>>>>> PLAYING', soundName);
    if (this.soundOn) {
      sounds[soundName].file.play();
    }
  }
  stopSound(soundName) {
    console.log('<<<<< STOPPING', soundName);
    if (this.soundOn) {
      sounds[soundName].file.stop();
    }
  }

  createSprites() {
    this.kirbyElement = document.getElementById('kirby');
    this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/drawing.png']})`;
    this.kirbyElement.addEventListener('transitionend', e => {
      e.target.classList.add('bouncing');
      pause(200).then(() => {
        e.target.classList.remove('bouncing');
      });
    });
    this.enemyElement = document.getElementById('enemy');
    this.enemyElement.addEventListener('transitionend', e => {
      e.target.classList.add('bouncing');
      pause(200).then(() => {
        e.target.classList.remove('bouncing');
      });
    });
  }

  assignHandlers() {
    document.getElementById('samurai-kirby-button').addEventListener('pointerdown', e => {
      this.handleAButtonClick(e);
    });
    document.getElementById('quit-button').addEventListener('click', e => {
      this.handleQuitButtonClick(e);
    });
    [...document.getElementsByClassName('level-segment')].forEach((segment, i) => {
      let highlightElement = document.getElementById('level-bar-highlight');
      segment.addEventListener('pointerdown', e => {
        this.playSound('whiplow');
        let positionClass = `position-${(i + 1)}`;
        console.log('adding class', positionClass);
        highlightElement.className = positionClass;
        this.difficulty = (i + 1);
      });
    });
  }

  buildLifeMarkers() {
    let livesArea = document.getElementById('lives-area');
    livesArea.innerHTML = '';
    for (let i = 0; i < this.maxLives; i++) {
      livesArea.innerHTML += `
        <div class="life-marker"></div>
      `;
    }
  }

  async startGame() {
    console.log('--------------- starting game --------------------');
    this.phase = '';
    document.getElementById(this.className).classList.remove('hidden');
    this.playRound(0, this.roundStartDelay);
  }

  async resetForNewRound() {
    document.body.classList.remove('round-started');
    this.phase = 'resetting';
    this.scorePost.classList.remove('showing');
    this.kirbyElement.classList = ['fighter'];
    this.enemyElement.classList = ['fighter'];
    this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/drawing.png']})`;
    await pause(10);
    this.calledAt = 0;
    this.currentRoundTime = 0;
  }

  async showScoreScreen() {
    this.veil.classList.add('showing');
    await pause(600);
    await this.resetForNewRound();
    await pause(300);
    this.printNumerals(this.level, document.getElementById('enemy-count-display'), 'red');
    let fastestTime = this.roundTimes.sort((a, b) => a - b)[0];
    if (fastestTime) {
      this.printNumerals(fastestTime, document.getElementById('fastest-time-display'), 'green');
    }
    this.printNumerals(this.totalScore, document.getElementById('total-score-display'), 'white');
    if (this.level === 0) {
      document.getElementById('fastest-time').style.opacity = 0;
    } else {
      document.getElementById('fastest-time').style.opacity = 1;
    }
    this.veil.classList.remove('showing');
    this.phase = 'showing-score';
    if (this.totalScore > 3000) {
      this.playSound('goodclear');
    } else {
      this.playSound('badclear');
    }
  }

  async endGame(resetOnly) {
    this.resetPlayerStatus();
    if (!resetOnly) {
      await this.resetForNewRound();
      document.getElementById('samurai-kirby').classList.add('hidden');
      document.getElementById('game-select-screen').classList.remove('hidden');
      this.veil.classList.add('showing');
    } else {
      this.veil.classList.add('showing');
      await pause(600);
      await this.resetForNewRound();
      await pause(300);
      this.veil.classList.remove('showing');
      this.playRound(0);
    }
  }

  resetPlayerStatus() {
    this.lives = this.maxLives;
    this.level = 0;
    this.totalScore = 0;
    this.roundTimes = [];
    this.updateLivesDisplay();
  }

  loadAttacker(attacker) {
    this.attacker = attacker;
    this.enemyElement.style.display = 'block';
    this.enemyElement.style.backgroundImage = `url(${images[attacker.name + '/waiting.png']})`;
  }

  displayScorePost() {
    this.printNumerals('00', this.scorePost);
    this.scorePost.classList.add('showing');
  }

  async printNumerals(score, targetElement, color, timeLimit) {
    if (color) {

      targetElement.classList.add(color);
    }
    targetElement.innerHTML = '';
    let scoreNumerals = score.toString().split('');
    scoreNumerals.forEach(numeral => {
      let numeralElement = document.createElement('div');
      numeralElement.className = 'score-numeral';
      numeralElement.style.backgroundImage = `url(${images[`numerals/tile00${numeral}.png`]})`;
      targetElement.append(numeralElement);
    });
    if (timeLimit) {
      await pause(timeLimit);
      targetElement.classList.remove(color);
    }
  }

  async displaySlashes(speed) {
    document.getElementById('slash-screen').style.backgroundColor = '#000000';
    document.getElementById('slash-screen').style.display = 'block';
    let slash1 = document.querySelector('.slash-mark:first-child');
    let slash2 = document.querySelector('.slash-mark:last-child');
    let centerSlash = document.getElementById('center-slash');
    let randomAngle = randomInt(0, 360);
    slash1.style.rotate = `${randomAngle}deg`;
    slash2.style.rotate = `${randomAngle + 25}deg`;

    slash1.classList.add('showing');
    await pause(10);
    slash1.classList.add('revealing');
    await pause(speed);
    slash1.classList.remove('showing');
    slash1.classList.remove('revealing');

    slash2.classList.add('showing');
    await pause(10);
    slash2.classList.add('revealing');
    await pause(speed);
    slash2.classList.remove('showing');
    slash2.classList.remove('revealing');

    document.getElementById('slash-screen').style.backgroundColor = 'transparent';

    centerSlash.classList.add('showing');
    await pause(speed);
    centerSlash.classList.remove('showing');

    document.getElementById('slash-screen').style.display = 'none';
  }

  async advanceToRound(round) {
    let roundToPlay = round < this.attackers.length ? round : (round - this.attackers.length);
    this.veil.classList.add('showing');
    await pause(600);
    this.phase = 'waiting';
    await this.resetForNewRound();
    await pause(300);
    this.veil.classList.remove('showing');
    await pause(this.roundStartDelay);
    this.playRound(roundToPlay);
  }

  async playRound(roundNumber, extraPause = 0) {
    await pause(2);
    this.veil.classList.remove('showing');
    // await pause(extraPause);
    this.printNumerals((roundNumber + 1), document.getElementById('round-display'), 'white');
    this.printNumerals(this.totalScore, document.getElementById('player-score-display'), 'white');
    this.phase = 'waiting';
    this.loadAttacker(this.attackers[roundNumber]);
    await pause(100);
    document.body.classList.add('round-started');
    this.displayScorePost();
    let suspenseTime = randomInt(this.attacker.suspenseTime.min, this.attacker.suspenseTime.max);
    this.playSound('gong');
    await pause(400);
    this.playSound('wind');
    await pause(suspenseTime);
    // user could foul now...
    if (this.phase === 'waiting') { // but if not, call for the draw
      this.calledAt = Date.now();
      this.phase = 'called';
      this.stopSound('wind');
      this.playSound('call');
      this.callInterval = setInterval(() => {
        let currentScore = Math.round((Date.now() - this.calledAt) / 5);
        this.printNumerals(currentScore, this.scorePost);
        this.currentRoundTime = currentScore;
      }, 1);

      await pause(this.attacker.drawSpeed);
      if (this.phase === 'called') { // if no kirby attack occurred
        clearInterval(this.callInterval);
        this.phase = 'time-up';
        this.stopSound('call');
        this.stopSound('wind');
        this.playSound('strike');
        await this.displaySlashes(90);
        document.getElementById('enemy').style.backgroundImage = `url(${images[this.attacker.name + '/attacking.png']})`;
        this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/defeated.png']})`;
        this.loseLife(2000);
      }
    }
  }

  async loseLife(pauseTime) {
    this.lives--;
    this.updateLivesDisplay();
    await pause(pauseTime);
    if (this.lives === 0) {
      this.showScoreScreen();
    } else {
      this.advanceToRound(this.level);
    }
  }

  updateLivesDisplay() {
    let filledLives = (this.maxLives - this.lives);
    let lifeElements = [...document.getElementsByClassName('life-marker')];
    lifeElements.forEach((lifeEl, i) => {
      if (i < filledLives) {
        lifeEl.classList.add('filled');
      } else {
        lifeEl.classList.remove('filled');
      }
    });
  }

  async showInstructions() {
    document.getElementById('samurai-kirby-button').classList.add('receded');
    this.phase = 'showing-instructions';
    console.log('images is', images);
    if (!images) {
      await this.loadImages();
    }
    if (!sounds) {
      this.loadSounds();
    }
    this.createSprites();
    document.getElementById('samurai-kirby-button').classList.remove('receded');
  }

  async handleAButtonClick() {
    if (this.phase === 'called') {
      // Kirby wins
      clearInterval(this.callInterval);
      this.phase = 'kirby-attacking';
      this.stopSound('call');
      this.playSound('strike');
      await this.displaySlashes(90);
      this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/attacking.png']})`;
      document.getElementById('enemy').style.backgroundImage = `url(${images[this.attacker.name + '/defeated.png']})`;
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
      this.enemyElement.style.backgroundImage = `url(${images[this.attacker.name + '/defeated.png']})`;
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
      this.startGame();
    }
  }

  async handleQuitButtonClick() {
    this.playSound('select');
    await pause(150);
    this.endGame();
  }
}