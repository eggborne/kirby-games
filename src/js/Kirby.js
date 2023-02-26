import { pause, randomInt, getPercent } from './util.js';

export default class Kirby {
  constructor(type) {
    this.type = type;
    this.container = document.createElement('div');
    this.container.classList.add('enemy-container');
    this.container.classList.add(positionClass);
    this.container.classList.add('obscured');
    // let randomScale = (randomInt(60, 110) / 100);
    // this.container.style.setProperty('--enemy-scale', randomScale);
    this.container.innerHTML = `
      <div class="pole"></div>
      <div class="kotd-enemy ${type}"></div>
    `;
    this.container.style.left = randomInt(window.innerWidth * 0.15, window.innerWidth * 0.85) + 'px';
    document.querySelector('#kotd-screen .bottom-screen').appendChild(this.container);
    // this.container.querySelector('.kotd-enemy').addEventListener('pointerdown', async e => {
    //   console.log('clicked enemy', e.target.classList);
    //   e.target.parentElement.classList.add('dead');
    //   document.querySelector('.kotd-kirby.player').classList.add('fired');
    //   await pause(80);
    //   document.querySelector('.kotd-kirby.player').classList.remove('fired');
    //   document.querySelector('.kotd-kirby.player').classList.add('firing');
    //   await pause(600);
    //   e.target.parentElement.parentElement.removeChild(e.target.parentElement);
    // });
  }

  get phase() {
    return document.getElementById('kotd').className;
  }

  set phase(newPhase) {
    document.getElementById('kotd').className = newPhase;
  }

  
}