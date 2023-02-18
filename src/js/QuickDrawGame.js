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
    this.calledAt;

    this.attackers = [
      {
        name: 'eyeballman',
        drawSpeed: 800,
        suspenseTime: { min: 1500, max: 2500 },
      },
      {
        name: 'wheelbro',
        drawSpeed: 5000,
        suspenseTime: { min: 1500, max: 3000 },
      },
      {
        name: 'fishchef',
        drawSpeed: 600,
        suspenseTime: { min: 1500, max: 5000 },
      },
      {
        name: 'dedede',
        drawSpeed: 500,
        suspenseTime: { min: 2000, max: 5000 },
      },
      {
        name: 'metaknight',
        drawSpeed: 400,
        suspenseTime: { min: 750, max: 5000 },
      },
    ];

    this.kirbyElement = document.getElementById('kirby');
    this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/waiting.png']})`;
  }

  get phase() {
    return document.getElementById('quick-draw').className;
  }

  set phase(newPhase) {
    document.getElementById('quick-draw').className = newPhase;
  }

  async startRound(roundNumber) {
    this.loadAttacker(this.attackers[roundNumber]);
    await pause(600);
    this.displayScorePost();
    document.body.classList.add('round-started');
    let suspenseTime = randomInt(this.attacker.suspenseTime.min, this.attacker.suspenseTime.max);
    await pause(suspenseTime);
    this.calledAt = Date.now();
    this.phase = 'called';
    this.callInterval = setInterval(() => {
      let currentScore = Math.round((Date.now() - this.calledAt) / 50);
      this.printScore(currentScore);
    }, 5);
    await pause(this.attacker.drawSpeed);
    // if player clicked A phase won't be 'called'
    if (this.phase === 'called') {
      clearInterval(this.callInterval);
      this.phase = 'time-up';
      document.getElementById('enemy').style.backgroundImage = `url(${images[this.attacker.name + '/attacking.png']})`;
      this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/defeated.png']})`;
    }
  }

  loadAttacker(attacker) {
    this.attacker = attacker;
    let enemyElement = document.getElementById('enemy');
    enemyElement.style.display = 'block';
    enemyElement.style.backgroundImage = `url(${images[attacker.name + '/waiting.png']})`;
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

  async handleAButtonClick(e) {
    this.phase = 'kirby-attacking';
    this.kirbyElement.style.backgroundImage = `url(${images['samuraikirby/attacking.png']})`;
    document.getElementById('enemy').style.backgroundImage = `url(${images[this.attacker.name + '/defeated.png']})`;
    clearInterval(this.callInterval);
    // await pause(300);
    // this.phase = 'kirby-won';
  }
}