import { randomInt, pause, swapClass } from '../util.js';

export default class Kirby {
  constructor(type) {
    this.type = type;
    this.maxAmmo = 8;
    this.ammo = 0;
    this.score = 0;
    this.reloadTime = 40; // ms per bullet

    this.blinkInterval;

    this.scoreKirbyElement = document.querySelector(`#kotd-results-kirby-area .kotd-kirby.${type}`);

    this.container = document.createElement('div');
    this.container.classList.add('kotd-kirby');
    this.container.classList.add('resting');
    this.container.classList.add(type);

    this.scoreContainer = document.createElement('div');
    this.scoreContainer.classList.add('numeral-area');
    this.scoreContainer.innerHTML = `
      <div class="score-number black"></div>
      <div class="score-number black"></div>
      <div class="score-number black"></div>
      <div class="score-number black"></div>
    `;
    this.ammoContainer = document.createElement('div');
    this.ammoContainer.classList.add('numeral-area');
    this.ammoContainer.innerHTML = `
      <div class="score-number white"></div>
    `;
    this.rankContainer = document.createElement('div');
    this.rankContainer.id = `${type}-rank`;
    this.rankContainer.classList.add('rank');
    this.rankContainer.classList.add('rank-4');
    
    document.querySelector('#kotd-screen #kotd-kirby-rank-area').appendChild(this.rankContainer);
    document.querySelector('#kotd-screen #kotd-kirby-area').appendChild(this.container);
    document.querySelector('#kotd-screen #kotd-kirby-score-area').appendChild(this.scoreContainer);
    document.querySelector('#kotd-screen #kotd-kirby-ammo-area').appendChild(this.ammoContainer);
  }

  get reloading() {
    return this.container.classList.contains('reloading');
  }

  set reloading(newStatus) {
    let action = newStatus ? 'add' : 'remove';
    this.container.classList[action]('reloading');
  }

  async startBlinkSequence(stop) {
    if (stop) {
      clearInterval(this.blinkInterval);
    } else {
      this.blinkInterval = setInterval(async () => {
        swapClass(this.scoreKirbyElement, 'blinking', 'blinking-1');
        await pause(60);
        swapClass(this.scoreKirbyElement, 'blinking-1', 'blinking-2');
        await pause(60);
        swapClass(this.scoreKirbyElement, 'blinking-2', 'blinking-1');
        await pause(60);
        swapClass(this.scoreKirbyElement, 'blinking-1', 'blinking');
        await pause(60);
      }, randomInt(1000, 2000));
    }
  }

  async startCelebrationSequence(stop) {
    if (stop) {
      clearInterval(this.blinkInterval);
    } else {
      this.blinkInterval = setInterval(async () => {
        swapClass(this.scoreKirbyElement, 'celebrating', 'celebrating-2');
        await pause(200);
        swapClass(this.scoreKirbyElement, 'celebrating-2', 'celebrating');
        await pause(200);
        swapClass(this.scoreKirbyElement, 'celebrating', 'celebrating-1');
        await pause(200);
        swapClass(this.scoreKirbyElement, 'celebrating-1', 'celebrating');
        await pause(200);
      }, 800);
    }
  }

  async reloadAmmo(instant) {
    console.warn(this.type, 'reloading');
    if (!this.bombed) {
      this.reloading = true;
      let reloadTime = instant ? 1 : (this.maxAmmo - this.ammo) * this.reloadTime;
      this.container.classList.remove('drawn');
      let frameAnimationGap = Math.floor(reloadTime / 5);
      this.container.classList.add('reloading-1');
      await pause(frameAnimationGap);
      swapClass(this.container, 'reloading-1', 'reloading-2');
      await pause(frameAnimationGap);
      swapClass(this.container, 'reloading-2', 'reloading-3');
      await pause(frameAnimationGap);
      swapClass(this.container, 'reloading-3', 'reloading-2');
      await pause(frameAnimationGap);
      swapClass(this.container, 'reloading-2', 'reloading-1');
      await pause(frameAnimationGap);
  
      if (!instant && this.type === 'player') {
        document.getElementById('kotd-ammo-bar').classList.add('off-y');
        document.querySelector('#kotd-score-bar #cylinder').classList.add('spinning');
        document.getElementById('kotd').classList.remove('out-of-ammo');
      }
      if (!instant && this.type === 'player') {
        document.querySelector('#kotd-score-bar #cylinder').classList.remove('spinning');
        await pause(60);
        document.getElementById('kotd-ammo-bar').classList.remove('off-y');
      }
      this.ammo = this.maxAmmo;
      this.reloading = false;
      this.container.classList.remove('reloading-1');
      this.container.classList.add('drawn');
      this.renderAmmo();
    }
  }

  async playFireAnimation() {
    this.container.classList.add('fired');
    await pause(100);
    this.container.classList.remove('fired');
    this.container.classList.add('drawn');
  }

  async fireAtTarget(targetInstance) {
    let readyToFire = this.type !== 'player' ? Date.now() - targetInstance.spawnedAt >= this.cpuKirbyData.reactionSpeed : true;
    if (
      readyToFire &&
      !this.reloading &&
      !this.bombed &&
      // targetInstance.container.classList.contains('cpu-vulnerable') &&
      !targetInstance.container.classList.contains('dead') &&
      this.ammo > 0
    ) {
      this.ammo--;
      this.playFireAnimation();
      this.renderAmmo();
      this.score += targetInstance.pointValue;
      if (this.score < 0 || this.score > 9000) {
        this.score = 0;
      }
      if (targetInstance.type === 'bomb') {
        this.bombed = true;
        pause(100).then(() => {
          this.container.classList.add('bombed');
          pause(1000).then(() => {
            this.bombed = false;
            this.container.classList.remove('bombed');
          });
        });
      }
      targetInstance.die(this.type);
      this.renderScore();
      if (this.type === 'player') {
        if (this.ammo === 0) {
          document.getElementById('kotd').classList.add('out-of-ammo');
        }
      }
    } else {
      if (this.type === 'player') {
        console.warn('-------------------------------------------------');
        console.log('-----------   player did not fire   ---------');
        console.log('readyToFire', readyToFire);
        console.log('!this.reloading', !this.reloading);
        console.log('!this.bombed', !this.bombed);
        console.log('!targetInstance.container.classList.contains("dead")', !targetInstance.container.classList.contains('dead'));
        console.log('this.ammo > 0', this.ammo > 0);
        console.warn('-------------------------------------------------');
      }
      if (this.ammo <= 0) {
        if (this.type === 'player') {
          if (!document.getElementById('kotd').classList.contains('no-ammo-message')) {
            document.getElementById('kotd').classList.add('no-ammo-message');
            await pause(800);
            document.getElementById('kotd').classList.remove('no-ammo-message');
          }
        } else {
          this.reloadAmmo();
        }
      }
    }
  }

  renderScore() {
    let scoreString = this.score.toString();
    let leadingZeros = 4 - scoreString.length;
    scoreString = '0'.repeat(leadingZeros) + scoreString;
    [...this.scoreContainer.children].forEach((numeral, n) => {
      let scoreNumeral = scoreString[n];
      numeral.style.backgroundPositionY = `calc(var(--ds-screen-height) / 12 * -${scoreNumeral})`;
    });
  }

  renderAmmo() {
    this.ammoContainer.querySelector('.score-number').style.backgroundPositionY = `calc(var(--ds-screen-height) / 12 * -${this.ammo})`;
  }
}