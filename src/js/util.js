const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const distanceFromABToXY = (a, b, x, y) => {
  let distanceX = x - a;
  let distanceY = y - b;
  return Math.round(Math.sqrt((distanceX * distanceX) + (distanceY * distanceY)));
};
const pointAtAngle = (x, y, angle, distance) => {
  return { x: x + distance * Math.cos(angle), y: y + distance * Math.sin(angle) };
};

const angleOfPointABFromXY = (a, b, x, y) => {
  return Math.atan2(b - y, a - x) + (Math.PI / 2);
};

const degToRad = degrees => {
  return degrees * (Math.PI / 180);
};

const radToDeg = radians => {
  let deg = radians * (180 / Math.PI);
  if (deg < 0) {
    deg += 360;
  } else if (deg > 359) {
    deg -= 360;
  }
  return radians * (180 / Math.PI);
};

const importAll = async require => {
  let reduced = require.keys().reduce((acc, next) => { 
    acc[next.replace("./", "")] = require(next);
    return acc;
  }, {});
  document.querySelector('#loading-bar > #details').innerText = `loading images...`;
  let count = 0;
  for (const imagePath in reduced) {
    count++;
    await loadImage(reduced[imagePath]);
    let percentDone = getPercent(count / Object.keys(reduced).length);
    document.querySelector('#loading-bar > #label').innerText = `${percentDone}%`;
    document.querySelector('#loading-bar > #filler').style.scale = `${percentDone}% 1`;
    if (percentDone === 100) {
      document.querySelector('#loading-bar > #details').innerText = `done!`;
    }
  }
  return reduced;
};

const loadImage = (bundledPath) => {
  return new Promise(resolve => {
    let loaderImage = new Image();
    loaderImage.src = bundledPath;
    document.getElementById('preload-area').append(loaderImage);
    loaderImage.addEventListener('load', () => resolve(bundledPath));
  });
};

const getPercent = decimal => Math.round(Math.round(decimal * 1e4) / 1e2);

const swapClass = (element, oldClass, newClass) => {
  if (element.classList.contains(oldClass)) {
    element.classList.remove(oldClass);
  }
  element.classList.add(newClass);
};

export {
  importAll,
  pause,
  randomInt,
  distanceFromABToXY,
  pointAtAngle,
  angleOfPointABFromXY,
  degToRad,
  radToDeg,
  getPercent,
  swapClass,
};