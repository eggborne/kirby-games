import { pause, randomInt } from './util.js';
const importAll = require =>
  require.keys().reduce((acc, next) => {
    acc[next.replace("./", "")] = require(next);
    return acc;
  }, {});

const images = importAll(
  require.context("../media/images/", true, /\.(png|jpe?g|svg)$/)
);

export default class QuickDrawGame {
  constructor() {
    this.score = 0;
    this.level = 0;
    this.attacker;
    this.scorePost = document.getElementById('score-post');
    this.veil = document.querySelector('#quick-draw-screen > .veil');
    this.calledAt;

    this.attackers = [
      {
        name: 'eyeballman',
        drawSpeed: 800,
        suspenseTime: { min: 1500, max: 2500 },
      },
      {
        name: 'wheelbro',
        drawSpeed: 700,
        suspenseTime: { min: 1500, max: 5000 },
      },
      {
        name: 'fishchef',
        drawSpeed: 600,
        suspenseTime: { min: 1500, max: 7000 },
      },
      {
        name: 'dedede',
        drawSpeed: 500,
        suspenseTime: { min: 2000, max: 4000 },
      },
      {
        name: 'metaknight',
        drawSpeed: 200,
        suspenseTime: { min: 750, max: 9000 },
      },
    ];

    this.kirbyElement = document.getElementById('kirby');
    this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/waiting.png']})`;
    this.enemyElement = document.getElementById('enemy');
  }

  get phase() {
    return document.getElementById('quick-draw').className;
  }

  set phase(newPhase) {
    document.getElementById('quick-draw').className = newPhase;
  }

  async playRound(roundNumber) {
    this.loadAttacker(this.attackers[roundNumber]);
    await pause(100);
    document.body.classList.add('round-started');
    await pause(400);
    this.displayScorePost();
    let suspenseTime = randomInt(this.attacker.suspenseTime.min, this.attacker.suspenseTime.max);
    await pause(suspenseTime);
    this.calledAt = Date.now();
    this.phase = 'called';
    this.callInterval = setInterval(() => {
      let currentScore = Math.round((Date.now() - this.calledAt) / 50);
      this.printScore(currentScore);
    }, 5);
    await pause(this.attacker.drawSpeed);
    // if player clicked, phase will be 'kirby-attacking'
    if (this.phase === 'called') {
      clearInterval(this.callInterval);
      this.phase = 'time-up';
      await this.displaySlashes(90);
      document.getElementById('enemy').style.backgroundImage = `url(${images[this.attacker.name + '/attacking.png']})`;
      this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/defeated.png']})`;
    }
  }

  async endRound() {
    document.body.classList.remove('round-started');
    this.phase = 'resetting';
    this.scorePost.classList.remove('showing');
    this.kirbyElement.classList = ['fighter'];
    this.enemyElement.classList = ['fighter'];
    this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/waiting.png']})`;
    await pause(10);
    this.phase = '';
  }

  loadAttacker(attacker) {
    this.attacker = attacker;
    this.enemyElement.style.display = 'block';
    this.enemyElement.style.backgroundImage = `url(${images[attacker.name + '/waiting.png']})`;
  }

  displayScorePost() {
    this.printScore(0);
    this.scorePost.classList.add('showing');
  }

  printScore(score) {
    this.scorePost.innerHTML = '';
    let scoreNumerals = score.toString().split('');
    scoreNumerals.forEach(numeral => {
      let numeralElement = document.createElement('div');
      numeralElement.className = 'score-numeral';
      numeralElement.style.backgroundImage = `url(${images[`numerals/tile00${numeral}.png`]})`;
      this.scorePost.append(numeralElement);
    });
  }

  async displaySlashes(speed) {
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

    centerSlash.classList.add('showing');
    await pause(Math.round(speed * 1.5));
    centerSlash.classList.remove('showing');

    document.getElementById('slash-screen').style.display = 'none';
  }

  async handleAButtonClick(e) {
    if (this.phase === 'called') {
      clearInterval(this.callInterval);
      this.phase = 'kirby-attacking';
      await this.displaySlashes(90);
      this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/attacking.png']})`;
      document.getElementById('enemy').style.backgroundImage = `url(${images[this.attacker.name + '/defeated.png']})`;
      await pause(1000);
      this.veil.classList.add('showing');
      await pause(600);
      await this.endRound();
      await pause(300);
      this.veil.classList.remove('showing');
  
      this.level++;
      this.playRound(this.level + 1);
    }
  }
}