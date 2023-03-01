import { pause, randomInt } from './util.js';

export default class Enemy {
  constructor(type, positionClass, sizeClass) {
    this.spawnedAt = Date.now();
    this.type = type;
    this.positionClass = positionClass;
    this.sizeClass = 'normal' || sizeClass;
    this.container = document.createElement('div');
    this.container.classList.add('enemy-container');
    this.container.classList.add(positionClass);
    this.container.classList.add(sizeClass);
    this.container.classList.add('obscured');
    if (this.type === 'bomb') {
      setTimeout(async () => {
        this.recede();
      }, randomInt(1500, 3000));
    }
    if (randomInt(0, 1)) {
      this.container.style.animationDirection = 'alternate-reverse';
    }
    this.container.innerHTML = `
      <div class="pole"></div>
      <div class="kotd-enemy ${type}"></div>
    `;

    this.enemyElement = this.container.querySelector('.kotd-enemy');

    let leftX;
    if (positionClass === 'bottom-edge' || positionClass === 'top-edge' || positionClass === 'behind-bar' || positionClass === 'bottom-window-edge') {
      let randomXValue = randomInt(20, 80);
      if (positionClass === 'bottom-window-edge') {
        let side = randomInt(0, 1) ? 'left' : 'right';
        if (side === 'left') {
          randomXValue = randomInt(5, 30);
        } else if (side === 'right') {
          randomXValue = randomInt(60, 85);
        }
      }
      leftX = `calc(${randomXValue} * (var(--ds-screen-width) / 100))`;
    } else if (positionClass === 'left-edge') {
      leftX = `calc(${randomInt(0, 60)} * (var(--ds-screen-height) / 100))`;
    } else if (positionClass === 'right-edge') {
      leftX = `calc(${randomInt(20, 80)} * (var(--ds-screen-height) / 100))`;
    }
    this.container.style.left = leftX;
    document.querySelector(`#kotd-screen .bottom-screen #${positionClass}-enemies`).appendChild(this.container);
  }

  get phase() {
    return document.getElementById('kotd').className;
  }

  set phase(newPhase) {
    document.getElementById('kotd').className = newPhase;
  }

  async die(killerType) {
    this.container.classList.add('dead');
    this.container.classList.add(killerType);
    let valueImage = document.createElement('div');
    valueImage.classList;
    await pause(600);
    this.container.remove();
    delete this.game.activeEnemies[this.container.id];

  }

  async recede() {
    this.container.classList.add('obscured');
    await pause(600);
    this.container.remove();
    delete this.game.activeEnemies[this.container.id];
  }

  
}