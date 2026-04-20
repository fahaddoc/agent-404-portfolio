import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, C } from '../config.js';

const BRIEFING_LINES = [
  'CLASSIFICATION: TOP SECRET',
  '',
  'OPERATIVE: AGENT 404',
  'TARGET: EXPOSE CLASSIFIED PORTFOLIO DATA',
  '',
  'MISSION PARAMETERS:',
  '  — NAVIGATE 6 HIGH-SECURITY SECTORS',
  '  — ELIMINATE ALL HOSTILE OPERATIVES',
  '  — EXTRACT CLASSIFIED INTEL FROM EACH SECTOR',
  '',
  'RULES OF ENGAGEMENT:',
  '  WASD / ARROWS — MOVEMENT',
  '  MOUSE         — AIM',
  '  LEFT CLICK    — FIRE',
  '',
  'STAND BY FOR DEPLOYMENT . . .',
];

export default class IntroScene extends Phaser.Scene {
  constructor() { super('IntroScene'); }

  create() {
    this.cameras.main.setBackgroundColor(C.DARK);

    // Scanline overlay
    const g = this.add.graphics();
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      g.fillStyle(0x000000, 0.15);
      g.fillRect(0, y, GAME_WIDTH, 2);
    }
    g.setDepth(10);

    // Corner decorations
    this._drawCorners();

    // Top classified banner
    const banner = this.add.rectangle(GAME_WIDTH / 2, 28, GAME_WIDTH, 36, 0x110000);
    this.add.text(GAME_WIDTH / 2, 28, '◆  TOP SECRET  ◆  CLASSIFIED  ◆  EYES ONLY  ◆', {
      fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#CC0000', letterSpacing: 3,
    }).setOrigin(0.5);

    // AGENT 404 title
    const title = this.add.text(GAME_WIDTH / 2, 120, 'AGENT', {
      fontFamily: 'Share Tech Mono', fontSize: '72px', color: '#FFB800',
      letterSpacing: 20, stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    const titleNum = this.add.text(GAME_WIDTH / 2, 200, '404', {
      fontFamily: 'Share Tech Mono', fontSize: '96px', color: '#ffffff',
      letterSpacing: 16, stroke: '#FFB800', strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);

    const tagline = this.add.text(GAME_WIDTH / 2, 280, '"They said he didn\'t exist.  His code says otherwise."', {
      fontFamily: 'Share Tech Mono', fontSize: '13px', color: '#555',
      letterSpacing: 1,
    }).setOrigin(0.5).setAlpha(0);

    // Briefing text box
    const boxY = 330;
    this.add.rectangle(GAME_WIDTH / 2, boxY + 120, 700, 250, 0x0a0a12).setAlpha(0.8);
    this.add.rectangle(GAME_WIDTH / 2, boxY + 120, 700, 250)
      .setStrokeStyle(1, C.AMBER, 0.3);

    // Briefing lines (typewriter)
    this.briefingTexts = [];
    BRIEFING_LINES.forEach((line, i) => {
      const t = this.add.text(GAME_WIDTH / 2 - 320, boxY + i * 16 + 10, '', {
        fontFamily: 'Share Tech Mono', fontSize: '12px',
        color: line.startsWith('  ') ? '#888' : (line.includes(':') ? '#FFB800' : '#aaa'),
        letterSpacing: 1,
      }).setAlpha(0);
      this.briefingTexts.push({ text: t, fullText: line });
    });

    // Press Enter prompt
    this.enterPrompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '[ PRESS ENTER OR CLICK TO DEPLOY ]', {
      fontFamily: 'Share Tech Mono', fontSize: '14px', color: '#FFB800', letterSpacing: 3,
    }).setOrigin(0.5).setAlpha(0);

    // Animate in sequence
    this.tweens.add({
      targets: title, alpha: 1, y: '-=10', duration: 600, ease: 'Quad.Out',
      onComplete: () => {
        this.tweens.add({
          targets: titleNum, alpha: 1, y: '-=10', duration: 500, ease: 'Quad.Out',
          onComplete: () => {
            this.tweens.add({
              targets: tagline, alpha: 1, duration: 600,
              onComplete: () => this._typewriterBriefing(0),
            });
          }
        });
      }
    });

    // Enter / click to start
    this.input.keyboard.on('keydown-ENTER', () => this._startGame());
    this.input.on('pointerdown', () => {
      if (this.enterPrompt.alpha > 0.5) this._startGame();
    });

    // Ambient flicker effect on title
    this._flickerTitle(title);
  }

  _drawCorners() {
    const g = this.add.graphics();
    const size = 40;
    g.lineStyle(2, C.AMBER, 0.5);
    // Top-left
    g.lineBetween(0, size, 0, 0); g.lineBetween(0, 0, size, 0);
    // Top-right
    g.lineBetween(GAME_WIDTH - size, 0, GAME_WIDTH, 0); g.lineBetween(GAME_WIDTH, 0, GAME_WIDTH, size);
    // Bottom-left
    g.lineBetween(0, GAME_HEIGHT - size, 0, GAME_HEIGHT); g.lineBetween(0, GAME_HEIGHT, size, GAME_HEIGHT);
    // Bottom-right
    g.lineBetween(GAME_WIDTH - size, GAME_HEIGHT, GAME_WIDTH, GAME_HEIGHT); g.lineBetween(GAME_WIDTH, GAME_HEIGHT - size, GAME_WIDTH, GAME_HEIGHT);
  }

  _typewriterBriefing(lineIndex) {
    if (lineIndex >= this.briefingTexts.length) {
      // All lines shown — show prompt
      this.tweens.add({
        targets: this.enterPrompt, alpha: 1, duration: 400,
        onComplete: () => {
          this.tweens.add({
            targets: this.enterPrompt,
            alpha: 0.3,
            yoyo: true, repeat: -1, duration: 600,
          });
        }
      });
      return;
    }

    const item = this.briefingTexts[lineIndex];
    item.text.setAlpha(1);

    // Type each character
    let charIndex = 0;
    const fullText = item.fullText;

    if (!fullText) {
      this.time.delayedCall(30, () => this._typewriterBriefing(lineIndex + 1));
      return;
    }

    const typeTimer = this.time.addEvent({
      delay: 22,
      repeat: fullText.length - 1,
      callback: () => {
        charIndex++;
        item.text.setText(fullText.slice(0, charIndex));
        if (charIndex >= fullText.length) {
          this.time.delayedCall(40, () => this._typewriterBriefing(lineIndex + 1));
        }
      },
    });
  }

  _flickerTitle(title) {
    this.time.delayedCall(Phaser.Math.Between(2000, 5000), () => {
      if (!this.scene.isActive('IntroScene')) return;
      const origAlpha = title.alpha;
      title.setAlpha(0.2);
      this.time.delayedCall(60, () => {
        title.setAlpha(origAlpha);
        this._flickerTitle(title);
      });
    });
  }

  _startGame() {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
      this.scene.start('UIScene');
      this.scene.stop('IntroScene');
    });
  }
}
