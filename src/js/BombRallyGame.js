import { pause, randomInt } from './util.js';
const importAll = require =>
  require.keys().reduce((acc, next) => {
    acc[next.replace("./", "")] = require(next);
    return acc;
  }, {});

const images = importAll(
  require.context("../media/quickdraw/images/", true, /\.(png|jpe?g|svg)$/)
);

export default class BombRallyGame {
  constructor() {
    //
  }
}