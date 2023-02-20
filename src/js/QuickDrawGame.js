import { pause, randomInt } from './util.js';
const importAll = require =>
  require.keys().reduce((acc, next) => {
    acc[next.replace("./", "")] = require(next);
    return acc;
  }, {});

const images = importAll(
  require.context("../media/quickdraw/images/", true, /\.(png|jpe?g|svg)$/)
);

let isMobile = true;

export default class QuickDrawGame {
  constructor() {
    this.className = 'quick-draw';
    this.roundStartDelay = 800;
    this.totalScore = 0;
    this.level = 0;
    this.attacker;
    this.scorePost = document.getElementById('score-post');
    this.veil = document.querySelector('#quick-draw-screen > .veil');
    this.calledAt;
    this.currentRoundTime = 0;
    this.roundTimes = [];
    this.maxLives = 3;
    this.lives = this.maxLives;

    this.attackers = [
      {
        name: 'eyeballman',
        drawSpeed: 800,
        suspenseTime: { min: 2000, max: 2500 },
      },
      {
        name: 'wheelbro',
        drawSpeed: 500,
        suspenseTime: { min: 1500, max: 5000 },
      },
      {
        name: 'fishchef',
        drawSpeed: 450,
        suspenseTime: { min: 3000, max: 7000 },
      },
      {
        name: 'dedede',
        drawSpeed: 400,
        suspenseTime: { min: 2000, max: 4000 },
      },
      {
        name: 'metaknight',
        drawSpeed: 300,
        suspenseTime: { min: 4000, max: 10000 },
      },
    ];

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
    this.buildLifeMarkers();
    console.log('----------- initialized QuickDrawGame!');
    if (isMobile) {
      document.getElementById('button-name').innerHTML = 'the button!';
    } else {
      document.getElementById('button-name').innerHTML = 'the space bar!';
    }
    this.assignHandlers();
  }

  get phase() {
    return document.getElementById('quick-draw').className;
  }

  set phase(newPhase) {
    document.getElementById('quick-draw').className = newPhase;
  }

  assignHandlers() {
    document.getElementById('quick-draw-button').addEventListener('pointerdown', e => {
      this.handleAButtonClick(e);
    });
    document.getElementById('quit-button').addEventListener('click', e => {
      this.handleQuitButtonClick(e);
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
  }

  async endGame(resetOnly) {
    this.resetPlayerStatus();
    if (!resetOnly) {
      await this.resetForNewRound();
      document.getElementById('quick-draw').classList.add('hidden');
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
    this.veil.classList.add('showing');
    await pause(600);
    this.phase = 'waiting';
    await this.resetForNewRound();
    await pause(300);
    // this.phase = '';
    this.veil.classList.remove('showing');
    await pause(this.roundStartDelay);
    this.playRound(round);
  }

  async playRound(roundNumber, extraPause=0) {
    await pause(2);
    this.veil.classList.remove('showing');
    await pause(extraPause);
    this.printNumerals((roundNumber + 1), document.getElementById('round-display'), 'white');
    this.printNumerals(this.totalScore, document.getElementById('player-score-display'), 'white');
    this.phase = 'waiting';
    this.loadAttacker(this.attackers[roundNumber]);
    await pause(100);
    document.body.classList.add('round-started');
    await pause(400);
    this.displayScorePost();
    let suspenseTime = randomInt(this.attacker.suspenseTime.min, this.attacker.suspenseTime.max);

    await pause(suspenseTime);
    // user could foul now...
    if (this.phase === 'waiting') { // but if not, call for the draw
      this.calledAt = Date.now();
      this.phase = 'called';
      this.callInterval = setInterval(() => {
        let currentScore = Math.round((Date.now() - this.calledAt) / 5);
        this.printNumerals(currentScore, this.scorePost);
        this.currentRoundTime = currentScore;
      }, 1);

      await pause(this.attacker.drawSpeed);
      // user needs to click now, or else...
      if (this.phase === 'called') { // if no kirby attack
        clearInterval(this.callInterval);
        this.phase = 'time-up';
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
    this.phase = 'showing-instructions';
  }

  async handleAButtonClick() {
    if (this.phase === 'called') {
      // Kirby wins
      clearInterval(this.callInterval);
      this.phase = 'kirby-attacking';
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
    this.endGame();
  }
}