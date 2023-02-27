import { pause, randomInt, getPercent } from './util.js';

export default class Enemy {
  constructor(type, positionClass, sizeClass) {
    this.type = type;
    this.positionClass = positionClass;
    this.sizeClass = 'normal' || sizeClass;
    this.spawnedAt = Date.now();
    this.container = document.createElement('div');
    this.container.classList.add('enemy-container');
    this.container.classList.add(positionClass);
    this.container.classList.add(sizeClass);
    this.container.classList.add('obscured');
    if (!randomInt(0, 4)) {
      type = 'bomb';
      setTimeout(async () => {
        this.container.classList.add('obscured');
        await pause(600);
        this.container.remove();
      }, randomInt(1000, 2500));
    }
    console.log(`----> SPAWNING ${type}, ${positionClass}, ${sizeClass}`);
    if (randomInt(0, 1)) {
      this.container.style.animationDirection = 'alternate-reverse';
    }
    this.container.innerHTML = `
      <div class="pole"></div>
      <div class="kotd-enemy ${type}"></div>
    `;
    this.enemyElement = this.container.querySelector('.kotd-enemy');
    // this.enemyElement.classList.add(sizeClass);
    let leftX;
    if (positionClass === 'bottom-edge' || positionClass === 'top-edge') {
      leftX = `calc(${randomInt(20, 80)} * (var(--ds-screen-width) / 100))`;
      this.container.style.left = leftX;
    } else if (positionClass === 'left-edge') {
      leftX = `calc(${randomInt(0, 60)} * (var(--ds-screen-height) / 100))`;
      this.container.style.left = leftX;
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

  
}