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
    this.actualPosition = {};
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
    valueImage.classList.add('point-amount');
    valueImage.classList.add(this.positionClass);
    valueImage.classList.add(this.sizeClass);
    console.log('rect------------------------------------');
    console.log('bound', this.enemyElement.getBoundingClientRect());
    console.log('offsetLeft', this.enemyElement.offsetLeft);
    console.log('offsetTop', this.enemyElement.offsetTop);
    console.log('clientLeft', this.enemyElement.left);
    console.log('getClientRects', this.enemyElement.getClientRects);
    console.log('rect------------------------------------');

    let deathX = 
      this.enemyElement.getBoundingClientRect().left
    // - this.enemyElement.getBoundingClientRect().width
    ;

    let deathY = 
      this.enemyElement.getBoundingClientRect().top
    // - this.enemyElement.getBoundingClientRect().height
    ;
    
    let bgYPosition =
      killerType === 'yellow' ? 1 :
        killerType === 'pink' ? 2 :
          killerType === 'lime' ? 3 : 0;
    
    let bgXPosition =
      this.enemyData.pointValue === 10 ? 0 :
        this.enemyData.pointValue === 20 ? 1 :
          this.enemyData.pointValue === 40 ? 2 :
            this.enemyData.pointValue === 100 ? 3 :
              this.enemyData.pointValue === -50 ? 4 : 0;
    
    valueImage.style.backgroundPositionX = `calc(var(--spacing-x) * ${bgXPosition})`;
    valueImage.style.backgroundPositionY = `calc(var(--spacing-y) * ${bgYPosition})`;
    valueImage.style.left = `calc(${deathX}px)`;
    valueImage.style.top = `calc(${deathY}px - var(--ds-screen-height))`;
    // this.container.parentElement.appendChild(valueImage);
    document.querySelector('#kotd-screen .bottom-screen').appendChild(valueImage);

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