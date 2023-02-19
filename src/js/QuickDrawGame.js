import { pause, randomInt } from './util.js';
const importAll = require =>
  require.keys().reduce((acc, next) => {
    acc[next.replace("./", "")] = require(next);
    return acc;
  }, {});

const images = importAll(
  require.context("../media/quickdraw/images/", true, /\.(png|jpe?g|svg)$/)
);

export default class QuickDrawGame {
  constructor() {
    this.totalScore = 0;
    this.level = 0;
    this.attacker;
    this.scorePost = document.getElementById('score-post');
    this.veil = document.querySelector('#quick-draw-screen > .veil');
    this.calledAt;
    this.currentRoundTime = 0;
    this.roundTimes = [];
    this.lives = 1;

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
        drawSpeed: 350,
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
  }

  get phase() {
    return document.getElementById('quick-draw').className;
  }

  set phase(newPhase) {
    document.getElementById('quick-draw').className = newPhase;
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
    this.printNumerals(fastestTime, document.getElementById('fastest-time-display'), 'green');
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
    
    this.veil.classList.add('showing');
    await pause(600);
    await this.resetForNewRound();
    await pause(300);
    this.lives = 1;
    this.level = 0;
    this.totalScore = 0;
    this.roundTimes = [];
    this.veil.classList.remove('showing');
    if (!resetOnly) {
      document.getElementById('quick-draw').classList.add('hidden');
      document.getElementById('game-select').classList.remove('hidden');
      await pause(600);
      this.veil.classList.add('showing');
    } else {
      this.playRound(0);
    }
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

      console.log('giving', color,'to classLsit', targetElement.classList);
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
    this.phase = '';
    this.veil.classList.remove('showing');
    await pause(600);
    this.playRound(round);
  }

  async playRound(roundNumber) {
    await pause(2);
    this.veil.classList.remove('showing');
    await pause(600);
    // document.getElementById('player-level').innerText = `Round ${roundNumber + 1}`;
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
    // user could foul here...

    if (this.phase === 'waiting') { // but if not, call for the draw
      this.calledAt = Date.now();
      this.phase = 'called';
      this.callInterval = setInterval(() => {
        let currentScore = Math.round((Date.now() - this.calledAt) / 5);
        this.printNumerals(currentScore, this.scorePost);
        this.currentRoundTime = currentScore;
      }, 1);
  
      await pause(this.attacker.drawSpeed);
      // user needs to click here, or else...

      if (this.phase === 'called') { // if no kirby attack
        clearInterval(this.callInterval);
        this.phase = 'time-up';
        await this.displaySlashes(90);
        document.getElementById('enemy').style.backgroundImage = `url(${images[this.attacker.name + '/attacking.png']})`;
        this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/defeated.png']})`;
        await pause(2000);
        this.lives--;
        if (this.lives === 0) {
          this.showScoreScreen();
        }
        // this.endGame();
      }
    }
  }

  async handleAButtonClick(e) {
    if (this.phase === 'called') {
      // Kirby wins
      clearInterval(this.callInterval);
      this.phase = 'kirby-attacking';
      await this.displaySlashes(90);
      this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/attacking.png']})`;
      document.getElementById('enemy').style.backgroundImage = `url(${images[this.attacker.name + '/defeated.png']})`;
      // await pause(1500);
      console.warn('time is', this.currentRoundTime);
      this.roundTimes[this.level] = this.currentRoundTime;
      let scoreForRound = (this.attacker.drawSpeed - (this.currentRoundTime * 5));
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
      this.printNumerals(penalty, document.getElementById('score-change-display'), 'red', 1000);
      this.printNumerals(this.totalScore, document.getElementById('player-score-display'), 'white');
      await pause(800);
      document.getElementById('score-change-display').classList.remove('showing');
      this.advanceToRound(this.level);
    } else if (this.phase === 'showing-score') {
      // Game is over
      
      this.endGame(true);
    }
  }

  async handleQuitButtonClick() {
    this.endGame();
  }
}