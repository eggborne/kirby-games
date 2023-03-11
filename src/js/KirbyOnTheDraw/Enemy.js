import { pause, randomInt } from '../util.js';


class RandomNumberGenerator {
  constructor(seed) {
    console.log(`Creating RandomNumberGenerator with seed ${seed}`);
    this.seed = seed;
  }

  next() {
    // use a Linear Congruential Generator (LCG) algorithm to generate the next random number
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }
}

export default class Enemy {
  constructor(type, positionClass, sizeClass) {
    this.spawnedAt = Date.now();
    this.type = type;
    this.positionClass = positionClass;
    this.sizeClass = sizeClass || 'normal';
    this.container = document.createElement('div');
    this.container.classList.add('enemy-container');
    this.container.classList.add(this.sizeClass);
    this.container.classList.add(this.positionClass);
    this.container.classList.add('obscured');
    this.randomGenerator = new RandomNumberGenerator(Date.now());
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
    valueImage.classList.add('enemy-dependent');
    valueImage.classList.add(this.sizeClass);
    valueImage.classList.add(this.positionClass);

    let deathX = this.enemyElement.getBoundingClientRect().left ;
    let deathY = this.enemyElement.getBoundingClientRect().top ;

    let bgYPosition =
      killerType === 'lemon' ? 1 :
        killerType === 'strawberry' ? 2 :
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
    this.renderHole({x: deathX, y: deathY}, this.sizeClass, killerType);
    document.querySelector('#kotd-screen .bottom-screen').appendChild(valueImage);
    this.game.renderRanks();
    await pause(600);
    this.container.remove();
    valueImage.remove();
    delete this.game.activeEnemies[this.container.id];
  }

  getRandomNumber(min, max) {
    let rand = this.randomGenerator.next();
    return Math.floor(rand * (max - min + 1) + min);
  }

  getRandomArcProperties() {
    let randomArcHeight = `${this.getRandomNumber(20, 100)}%`;
    let randomSpreadDistance = `${this.getRandomNumber(50, 200)}%`;
    let randomArcSpeed = `${this.getRandomNumber(800, 1300)}ms`;
    return { randomArcHeight, randomSpreadDistance, randomArcSpeed };
  }

  async renderHole(coords, sizeClass, killerType) {
    let holeElement = document.createElement('div');
    holeElement.classList.add('bullet-hole');
    holeElement.classList.add('enemy-dependent');
    holeElement.classList.add(sizeClass);
    holeElement.classList.add(killerType);
    holeElement.style.left = `${coords.x}px`;
    holeElement.style.top = `${coords.y}px`;
    let starAmount = 6;
    for (let i = 0; i < starAmount; i++) {
      let starElement = document.createElement('div');
      
      let arcProperties = this.getRandomArcProperties();

      if (i % 2 === 0) {
        starElement.classList.add('right');
      }
      starElement.style.setProperty('--arc-height', `${arcProperties.randomArcHeight}`);
      starElement.style.setProperty('--spread-distance', `${arcProperties.randomSpreadDistance}`);
      starElement.style.setProperty('--arc-speed', `${arcProperties.randomArcSpeed}`);
      starElement.classList.add('star');
      holeElement.appendChild(starElement);
      pause(10).then(() => {
        starElement.classList.add('spinning');
      });
    }

    document.querySelector('#kotd-screen .bottom-screen').appendChild(holeElement);
    await pause(100);
    holeElement.classList.add('formed');
    await pause(200);
    holeElement.classList.add('fading');
    await pause(400);
    holeElement.remove();
  }

  async recede() {
    this.container.classList.add('obscured');
    await pause(600);
    this.container.remove();
    delete this.game.activeEnemies[this.container.id];
  }

  
}