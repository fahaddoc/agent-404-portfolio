import Phaser from 'phaser';
import { C, GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  create() {
    this.cameras.main.setBackgroundColor(0x080810);

    const g = this.make.graphics({ add: false });

    /* ── pixel (1×1 white) ── */
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture('pixel', 1, 1);

    /* ════════════════════════════════════════════════════════════════
     * PLAYER — Agent 404 / John Wick  (64 × 40, top-down)
     * Origin: setOrigin(0.5, 0.5) → pivot = (32, 20)
     * Faces RIGHT at rotation=0
     * Gun tip ≈ (60, 20)  →  GUN_TIP_DIST = 28
     * ════════════════════════════════════════════════════════════════ */
    g.clear();

    // ── drop shadow ──
    g.fillStyle(0x000000, 0.45);
    g.fillEllipse(27, 26, 44, 16);

    // ── suit body (charcoal) ──
    g.fillStyle(0x1c1c26);
    g.fillEllipse(20, 20, 34, 30);

    // ── jacket inner shading ──
    g.fillStyle(0x14141c);
    g.fillEllipse(18, 20, 22, 22);

    // ── left lapel ──
    g.fillStyle(0x242432);
    g.fillTriangle(13, 12, 19, 18, 13, 22);

    // ── right lapel ──
    g.fillStyle(0x242432);
    g.fillTriangle(22, 12, 16, 18, 22, 22);

    // ── white shirt / collar ──
    g.fillStyle(0xdedec8);
    g.fillRect(15, 14, 9, 12);

    // ── black tie ──
    g.fillStyle(0x080808);
    g.fillRect(17, 13, 5, 12);
    // tie knot (wider at top)
    g.fillStyle(0x101010);
    g.fillRect(16, 13, 7, 4);

    // ── HEAD — dark hair circle, centered on aim axis y=20 ──
    g.fillStyle(0x1a100a);
    g.fillCircle(27, 20, 11);

    // ── hair shine / parting ──
    g.fillStyle(0x261810);
    g.fillEllipse(25, 18, 14, 9);

    // ── skin (right cheek/chin visible from above) ──
    g.fillStyle(0xaa6e38);
    g.fillEllipse(32, 20, 7, 9);

    // ── stubble / jaw shadow ──
    g.fillStyle(0x7a4e28, 0.5);
    g.fillEllipse(33, 21, 5, 6);

    // ── right arm — suit sleeve ──
    g.fillStyle(0x1c1c26);
    g.fillRect(33, 18, 11, 5);

    // ── hand ──
    g.fillStyle(0xaa6e38);
    g.fillRect(43, 19, 7, 4);

    // ── GLOCK 17 — facing right, centered on y=20 ──
    // grip (below center)
    g.fillStyle(0x0e0e18);
    g.fillRect(47, 22, 9, 10);
    // grip texture
    g.fillStyle(0x080810);
    g.fillRect(48, 24, 2, 7);
    g.fillRect(51, 24, 2, 7);
    g.fillRect(54, 24, 2, 7);
    // frame
    g.fillStyle(0x141420);
    g.fillRect(46, 17, 18, 9);
    // slide (upper, lighter)
    g.fillStyle(0x1e1e2c);
    g.fillRect(46, 17, 14, 5);
    // slide serrations
    g.fillStyle(0x161622);
    g.fillRect(47, 17, 2, 5);
    g.fillRect(50, 17, 2, 5);
    g.fillRect(53, 17, 2, 5);
    // trigger guard
    g.fillStyle(0x141420);
    g.fillRect(51, 21, 8, 6);
    // barrel
    g.fillStyle(0x090912);
    g.fillRect(57, 18, 6, 4);
    // front sight (tiny bright dot)
    g.fillStyle(0xffffff);
    g.fillRect(61, 17, 1, 1);
    // muzzle
    g.fillStyle(0x202030);
    g.fillRect(62, 18, 2, 4);

    g.generateTexture('player', 64, 40);

    /* ════════════════════════════════════════════════════════════════
     * ENEMY — Suit Hitman  (56 × 36, top-down)
     * Origin: setOrigin(0.5, 0.5) → pivot = (28, 18)
     * Faces RIGHT
     * ════════════════════════════════════════════════════════════════ */
    g.clear();

    // ── shadow ──
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(30, 27, 42, 15);

    // ── suit body (dark navy) ──
    g.fillStyle(0x181826);
    g.fillEllipse(18, 18, 30, 28);

    // ── suit shading ──
    g.fillStyle(0x101018);
    g.fillEllipse(16, 18, 20, 20);

    // ── lapels ──
    g.fillStyle(0x202030);
    g.fillTriangle(10, 11, 16, 17, 10, 21);
    g.fillTriangle(20, 11, 14, 17, 20, 21);

    // ── white shirt ──
    g.fillStyle(0xd8d8c0);
    g.fillRect(12, 13, 9, 10);

    // ── red tie ──
    g.fillStyle(0xaa1111);
    g.fillRect(14, 12, 5, 11);
    g.fillStyle(0xcc1818);
    g.fillRect(14, 12, 5, 3);

    // ── HEAD — dark hair, on aim axis y=18 ──
    g.fillStyle(0x1c140c);
    g.fillCircle(25, 18, 10);

    // ── hair shine ──
    g.fillStyle(0x281e10);
    g.fillEllipse(23, 16, 13, 8);

    // ── skin (right side) ──
    g.fillStyle(0xa06432);
    g.fillEllipse(30, 18, 7, 9);

    // ── arm ──
    g.fillStyle(0x181826);
    g.fillRect(31, 16, 9, 5);

    // ── hand ──
    g.fillStyle(0xa06432);
    g.fillRect(39, 17, 6, 4);

    // ── compact pistol ──
    g.fillStyle(0x111118);
    g.fillRect(43, 15, 14, 8);
    g.fillStyle(0x181820);
    g.fillRect(43, 15, 10, 4);
    g.fillStyle(0x0a0a10);
    g.fillRect(51, 16, 6, 3);
    // grip
    g.fillStyle(0x0e0e16);
    g.fillRect(44, 21, 7, 8);
    // muzzle
    g.fillStyle(0x1e1e28);
    g.fillRect(55, 16, 2, 3);

    g.generateTexture('enemy', 56, 36);

    /* ════════════════════════════════════════════════════════════════
     * ENEMY ELITE — Heavy Hitman  (60 × 38, top-down)
     * Origin: setOrigin(0.5, 0.5) → pivot = (30, 19)
     * ════════════════════════════════════════════════════════════════ */
    g.clear();

    // ── shadow ──
    g.fillStyle(0x000000, 0.5);
    g.fillEllipse(32, 30, 48, 16);

    // ── suit body (deep black) ──
    g.fillStyle(0x10101a);
    g.fillEllipse(19, 19, 34, 32);

    // ── suit shading ──
    g.fillStyle(0x0a0a12);
    g.fillEllipse(17, 19, 24, 24);

    // ── lapels (slightly purple tint = elite) ──
    g.fillStyle(0x18102a);
    g.fillTriangle(10, 11, 17, 18, 10, 24);
    g.fillTriangle(22, 11, 15, 18, 22, 24);

    // ── white shirt ──
    g.fillStyle(0xd0d0b8);
    g.fillRect(11, 13, 10, 12);

    // ── purple tie (elite identifier) ──
    g.fillStyle(0x6600aa);
    g.fillRect(14, 12, 5, 13);
    g.fillStyle(0x8800cc);
    g.fillRect(14, 12, 5, 4);

    // ── pocket square (elite badge) ──
    g.fillStyle(0x9900dd);
    g.fillTriangle(10, 15, 13, 15, 10, 19);

    // ── HEAD — larger, heavier ──
    g.fillStyle(0x140e08);
    g.fillCircle(27, 19, 12);

    // ── hair ──
    g.fillStyle(0x1e160c);
    g.fillEllipse(25, 17, 16, 10);

    // ── skin ──
    g.fillStyle(0x986030);
    g.fillEllipse(33, 19, 8, 11);

    // ── thick arm (heavier build) ──
    g.fillStyle(0x10101a);
    g.fillRect(34, 16, 11, 7);

    // ── hand ──
    g.fillStyle(0x986030);
    g.fillRect(44, 18, 7, 4);

    // ── SUBMACHINE GUN (longer) ──
    // receiver
    g.fillStyle(0x0e0e18);
    g.fillRect(48, 14, 22, 10);
    // top rail
    g.fillStyle(0x161622);
    g.fillRect(48, 14, 18, 4);
    // side marks
    g.fillStyle(0x0a0a14);
    g.fillRect(49, 14, 2, 4);
    g.fillRect(52, 14, 2, 4);
    g.fillRect(55, 14, 2, 4);
    // grip
    g.fillStyle(0x0c0c16);
    g.fillRect(49, 22, 9, 10);
    // barrel extension
    g.fillStyle(0x080810);
    g.fillRect(62, 16, 8, 5);
    // purple highlight on barrel (elite weapon)
    g.fillStyle(0x440066);
    g.fillRect(62, 16, 8, 2);
    // muzzle
    g.fillStyle(0x1a1a26);
    g.fillRect(68, 17, 2, 4);

    g.generateTexture('enemy_elite', 70, 38);

    /* ════════════════════════════════════════════════════════════════
     * FLOOR TILE — warm stone / marble  (64 × 64)
     * ════════════════════════════════════════════════════════════════ */
    g.clear();

    // base stone colour
    g.fillStyle(0x18150f);
    g.fillRect(0, 0, 64, 64);

    // subtle inner quad (slight colour variation for marble look)
    g.fillStyle(0x1c1910);
    g.fillRect(2, 2, 60, 60);

    // diagonal veins (light marble lines)
    g.lineStyle(1, 0x221e14, 0.6);
    g.lineBetween(0, 16, 16, 0);
    g.lineBetween(0, 48, 48, 0);
    g.lineBetween(16, 64, 64, 16);
    g.lineBetween(48, 64, 64, 48);

    // grout / edge border
    g.lineStyle(1, 0x0e0c08, 1);
    g.strokeRect(0, 0, 64, 64);

    g.generateTexture('floor_tile', 64, 64);

    /* ── column (stone pillar top-view, 52×52) ── */
    g.clear();
    // outer shadow ring
    g.fillStyle(0x000000, 0.45);
    g.fillCircle(28, 30, 26);
    // stone base
    g.fillStyle(0x2a2318);
    g.fillCircle(26, 26, 25);
    // middle ring
    g.fillStyle(0x322b1e);
    g.fillCircle(26, 26, 19);
    // inner cap (top of column)
    g.fillStyle(0x3c3326);
    g.fillCircle(26, 26, 13);
    // highlight
    g.fillStyle(0x46402e);
    g.fillCircle(23, 23, 7);
    // outer rim line
    g.lineStyle(1.5, 0xaa8844, 0.5);
    g.strokeCircle(26, 26, 24);
    // inner rim
    g.lineStyle(1, 0x887040, 0.4);
    g.strokeCircle(26, 26, 18);
    g.generateTexture('pillar', 52, 52);

    g.destroy();

    /* ── loading bar ── */
    const bar = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 0, 3, C.AMBER);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, 'AGENT 404', {
      fontFamily: 'Share Tech Mono', fontSize: '28px', color: '#FFB800', letterSpacing: 10,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'INITIALIZING . . .', {
      fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#444', letterSpacing: 4,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: bar, width: 300, duration: 700, ease: 'Quad.Out',
      onComplete: () => this.scene.start('IntroScene'),
    });
  }
}
