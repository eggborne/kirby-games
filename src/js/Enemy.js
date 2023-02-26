import { pause, randomInt, getPercent } from './util.js';

export default class Enemy {
  constructor(type, positionClass) {
    this.type = type;
    this.positionClass = positionClass;
    this.spawnedAt = Date.now();
    this.container = document.createElement('div');
    this.container.classList.add('enemy-container');
    this.container.classList.add(positionClass);
    this.container.classList.add('obscured');
    if (!randomInt(0, 4)) {
      type = 'bomb';
      setTimeout(async () => {
        this.container.classList.add('obscured');
        await pause(600);
        this.container.remove();
      }, randomInt(1000, 2500));
    }
    if (randomInt(0, 1)) {
      this.container.style.animationDirection = 'alternate-reverse';
    }
    this.container.innerHTML = `
      <div class="pole"></div>
      <div class="kotd-enemy ${type}"></div>
    `;
    this.container.style.left = randomInt(window.innerWidth * 0.1, window.innerWidth * 0.8) + 'px';
    document.querySelector('#kotd-screen .bottom-screen').appendChild(this.container);
  }

  get phase() {
    return document.getElementById('kotd').className;
  }

  set phase(newPhase) {
    document.getElementById('kotd').className = newPhase;
  }

  
}