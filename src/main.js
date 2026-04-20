import Phaser from 'phaser';
import PreloadScene from './game/scenes/PreloadScene.js';
import IntroScene from './game/scenes/IntroScene.js';
import GameScene from './game/scenes/GameScene.js';
import UIScene from './game/scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 700,
  parent: 'game-container',
  backgroundColor: '#080810',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1200,
    height: 700,
  },
  scene: [PreloadScene, IntroScene, GameScene, UIScene],
};

new Phaser.Game(config);
