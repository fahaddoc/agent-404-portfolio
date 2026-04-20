import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_MAX_HP, C, ROOM_CONFIGS } from '../config.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }); }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    // HP bar
    this._buildHPBar();

    // Room progress
    this._buildRoomProgress();

    // Listen to game events
    const game = this.scene.get('GameScene');
    game.events.on('playerHpChanged', this._updateHP, this);
    game.events.on('roomChanged', this._updateRoom, this);

    this._updateHP(PLAYER_MAX_HP);
    this._updateRoom(0);
  }

  _buildHPBar() {
    // Background
    this.add.text(12, 12, 'AGENT 404', {
      fontFamily: 'Share Tech Mono', fontSize: '10px',
      color: '#FFB800', letterSpacing: 3,
    });

    this.add.text(12, 28, 'VITALS', {
      fontFamily: 'Share Tech Mono', fontSize: '9px',
      color: '#444', letterSpacing: 2,
    });

    // HP segments
    this.hpSegments = [];
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      const seg = this.add.rectangle(12 + i * 20, 48, 16, 10, C.AMBER);
      seg.setOrigin(0, 0.5);
      this.hpSegments.push(seg);
    }
  }

  _buildRoomProgress() {
    const total = ROOM_CONFIGS.length;
    const startX = GAME_WIDTH - 16;
    const dotSize = 10;
    const gap = 18;

    this.add.text(GAME_WIDTH - 16, 12, 'SECTORS', {
      fontFamily: 'Share Tech Mono', fontSize: '9px',
      color: '#444', letterSpacing: 2,
    }).setOrigin(1, 0);

    this.roomDots = [];
    for (let i = 0; i < total; i++) {
      const x = startX - (total - 1 - i) * gap;
      const dot = this.add.rectangle(x, 46, dotSize, dotSize, 0x222233);
      dot.setOrigin(0.5);
      const lbl = this.add.text(x, 58, `${i + 1}`, {
        fontFamily: 'Share Tech Mono', fontSize: '8px',
        color: '#333', letterSpacing: 0,
      }).setOrigin(0.5);
      this.roomDots.push({ dot, lbl });
    }

    // Horizontal line connecting dots
    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(1, 0x1e1e2e);
    lineGfx.lineBetween(startX - (total - 1) * gap, 46, startX, 46);

    this.roomLineGfx = this.add.graphics();
    this.roomLineGfx.setDepth(-1);
  }

  _updateHP(hp) {
    this.hpSegments.forEach((seg, i) => {
      if (i < hp) {
        seg.setFillStyle(C.AMBER);
      } else {
        seg.setFillStyle(0x222);
        seg.setStrokeStyle(1, 0x444);
      }
    });
  }

  _updateRoom(index) {
    const total = ROOM_CONFIGS.length;
    this.roomDots.forEach(({ dot, lbl }, i) => {
      if (i < index) {
        // Completed
        dot.setFillStyle(C.GREEN);
        lbl.setColor('#00FF88');
      } else if (i === index) {
        // Current
        dot.setFillStyle(C.AMBER);
        lbl.setColor('#FFB800');
        // Pulse animation
        this.tweens.add({
          targets: dot, scaleX: 1.3, scaleY: 1.3,
          yoyo: true, repeat: 2, duration: 200,
        });
      } else {
        dot.setFillStyle(0x222233);
        lbl.setColor('#333');
      }
    });

    // Room name bottom-right
    if (this.roomLabel) this.roomLabel.destroy();
    const conf = ROOM_CONFIGS[index];
    if (conf) {
      this.roomLabel = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 16,
        `${String(index + 1).padStart(2, '0')} / ${total}  ${conf.name}`, {
          fontFamily: 'Share Tech Mono', fontSize: '11px',
          color: '#333', letterSpacing: 2,
        }
      ).setOrigin(1, 1);
    }
  }
}
