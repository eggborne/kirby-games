import { pause } from './util.js';

export default class Kirby {
  constructor(type) {
    this.type = type;
    this.ammo = 8;
    this.score = 0;

    this.container = document.createElement('div');
    this.container.classList.add('kotd-kirby');
    this.container.classList.add(type);
    this.container.classList.add(type);

    this.scoreContainer = document.createElement('div');
    this.scoreContainer.classList.add('numeral-area');
    this.scoreContainer.innerHTML = `
      <div class="score-number black"></div>
      <div class="score-number black"></div>
      <div class="score-number black"></div>
      <div class="score-number black"></div>
    `;
    
    
    document.querySelector('#kotd-screen #kotd-kirby-area').appendChild(this.container);
    document.querySelector('#kotd-screen #kotd-kirby-score-area').appendChild(this.scoreContainer);

  }

  get reloading() {
    return this.container.classList.contains('reloading');
  }

  set reloading(newStatus) {
    let action = newStatus ? 'add' : 'remove';
    this.container.classList[action]('reloading');
  }

  async reloadAmmo() {
    this.reloading = true;
    document.getElementById('kotd-ammo-bar').classList.add('off-y');
    let reloadTime = (8 - this.ammo) * 40;
    document.querySelector('#kotd-score-bar #cylinder').classList.add('spinning');
    await pause(reloadTime);
    document.querySelector('#kotd-score-bar #cylinder').classList.remove('spinning');
    await pause(60);
    this.ammo = 8;
    document.getElementById('kotd-ammo-bar').classList.remove('off-y');
    this.reloading = false;
  }

  async playFireAnimation() {
    this.container.classList.add('fired');
    await pause(100);
    this.container.classList.remove('fired');
    this.container.classList.add('firing');
  }

  async fireAtTarget(targetElement, pointValue) {
    if (
      !this.reloading &&
      !targetElement.parentElement.classList.contains('dead') &&
      this.ammo > 0
    ) {
      this.ammo--;
      this.playFireAnimation();
      // let dataForEnemy = enemyByName(targetElement.classList[1]);
      // let pointValue = dataForEnemy.pointValue;
      
      this.score += pointValue;
      if (this.score < 0) {
        this.score = 0;
      }

      targetElement.parentElement.classList.add('dead');
      setTimeout(() => {
        targetElement.parentElement.remove();
      }, 600);
      this.renderScore(this.score);
    } else {
      document.querySelector('#kotd #no-ammo').classList.add('showing');
      await pause(300);
      document.querySelector('#kotd #no-ammo').classList.remove('showing');
    }
  }

  renderScore(newScore) {
    let scoreString = newScore.toString();
    let leadingZeros = 4 - scoreString.length;
    scoreString = '0'.repeat(leadingZeros) + scoreString;
    [...this.scoreContainer.children].forEach((numeral, n) => {
      let scoreNumeral = scoreString[n];
      numeral.style.backgroundPositionY = `calc(var(--ds-screen-height) / 12 * -${scoreNumeral})`;
    });
  }
}