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

const degToRad = (radians) => {
  return radians * (Math.PI / 180);
};

const radToDeg = (radians) => {
  let deg = radians * (180 / Math.PI);
  if (deg < 0) {
    deg += 360;
  } else if (deg > 359) {
    deg -= 360;
  }
  return radians * (180 / Math.PI);
};

export {
  pause,
  randomInt,
  distanceFromABToXY,
  pointAtAngle,
  angleOfPointABFromXY,
  degToRad,
  radToDeg
};