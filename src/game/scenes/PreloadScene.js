import Phaser from 'phaser';
import { C, GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0805);

    const S = 2;
    const makeTex = (key, artW, artH, fn) => {
      const tex = this.textures.createCanvas(key, artW * S, artH * S);
      const ctx = tex.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const p = (hex, ax, ay, aw = 1, ah = 1) => {
        const x0 = Math.max(ax, 0), y0 = Math.max(ay, 0);
        const rw = Math.min(aw - (x0 - ax), artW - x0);
        const rh = Math.min(ah - (y0 - ay), artH - y0);
        if (rw <= 0 || rh <= 0) return;
        ctx.fillStyle = '#' + hex.toString(16).padStart(6, '0');
        ctx.fillRect(x0 * S, y0 * S, rw * S, rh * S);
      };
      fn(p);
      tex.refresh();
    };

    const HA  = 0x1a0e06; const HM  = 0x2c1a0a; const HL  = 0x402e18;
    const SK  = 0xC8A060; const SBr = 0xDCBC78; const Ssd = 0xA07838;
    const SU  = 0x232538; const SL  = 0x2e3048; const Sda = 0x161828;
    const WH  = 0xE8E8D8; const PA  = 0x1a1c2e; const SHO = 0x121220;
    const GF  = 0x252535; const GB  = 0xC89010;

    // ── Side-profile John Wick: 20×34 art → 40×68 texture ──
    const drawJW = (key, tieCol, barrelCol, aLegX, bLegX) => {
      const BK = 0x0D0D0D;
      const BH = 0x1C1C1C;

      // Hair: dark base + reddish-brown highlights (like ref image)
      const HK = 0x0E0602;  // near-black hair
      const HR = 0x7A2010;  // reddish-brown highlight
      const HM = 0x2C1008;  // mid-dark hair

      // Skin
      const SK = 0xC49060;  // base skin
      const SS = 0x8B5030;  // skin shadow
      const BE = 0x1A0A04;  // beard/stubble

      makeTex(key, 20, 34, p => {
        // shadow
        p(0x000000, 1, 32, 14, 2);

        // ── HAIR ── dark mass with subtle warm depth
        p(HK, 1,  0,  8,  1);          // top hairline row
        p(HK, 1,  1, 10,  9);          // main hair block
        p(HM, 4,  1,  5,  2);          // subtle depth highlight — top
        p(HM, 3,  3,  4,  2);          // subtle depth — mid
        p(HM, 2,  5,  3,  2);          // subtle depth — lower
        p(HK, 1,  1,  2, 10);          // very dark left-edge strip
        p(HK, 1, 10,  6,  4);          // long strands flowing down
        p(HM, 2, 10,  2,  2);          // subtle depth on strands
        p(HK, 2, 14,  3,  2);          // hair tip

        // ── HEAD (profile, facing right) ──
        p(SK, 7,  1,  4,  1);          // crown skin (top of head)
        p(SK, 7,  2,  7,  8);          // full face skin block x=7..13, y=2..9
        p(SS, 7,  2,  1,  7);          // shadow stripe at hairline

        // Eyebrow — strong, thick, dark
        p(HK, 9,  4,  4,  1);

        // Eye — single dark pixel in profile
        p(HK,12,  5,  1,  1);

        // Nose — juts right past face boundary (key profile feature)
        p(SK,13,  6,  2,  2);          // nose bridge + tip extends to x=14
        p(SS,13,  8,  1,  1);          // nostril shadow
        p(HK,12,  8,  1,  1);          // nostril

        // Cheek shadow
        p(SS, 7,  6,  2,  2);

        // Beard / jaw — dark stubble
        p(BE, 7,  9,  6,  2);          // beard base on whole jaw
        p(SK, 9,  9,  3,  1);          // skin showing through beard (mid-chin)
        p(SK,10, 10,  1,  1);          // chin highlight

        // ── NECK ──
        p(SK, 8, 11,  3,  2);
        p(SS, 8, 11,  1,  1);

        // ── TORSO (slim coat) ──
        p(BK, 6, 13,  7,  8);
        p(BH, 6, 13,  1,  7);
        p(BH,12, 13,  1,  7);
        p(BH, 9, 13,  2,  3);          // lapel

        // ── LEFT ARM (behind) ──
        p(BK, 4, 14,  3,  6);
        p(SK, 4, 19,  2,  1);

        // ── RIGHT ARM + HAND ──
        p(BK,11, 13,  4,  4);
        p(SK,13, 15,  3,  2);

        // ── GUN ──
        p(BK,14, 12,  6,  3);
        p(BH,14, 12,  6,  1);
        p(BK,15, 15,  2,  3);
        p(barrelCol, 19, 12, 1, 2);

        // ── LEGS ──
        p(BK, aLegX,     21,  3,  9);
        p(BK, bLegX,     21,  3,  9);
        p(BH, aLegX + 2, 21,  1,  8);
        p(BH, bLegX,     21,  1,  8);

        // ── SHOES ──
        p(BK, aLegX - 1, 29,  5,  2);
        p(BK, bLegX,     29,  4,  2);
      });
    };

    drawJW('player',    0x0D0D0D, GB,  5,  9);
    drawJW('player_w1', 0x0D0D0D, GB,  4,  9);
    drawJW('player_w2', 0x0D0D0D, GB,  5, 10);

    drawJW('enemy',    0x0D0D0D, 0xDD2020,  5,  9);
    drawJW('enemy_w1', 0x0D0D0D, 0xDD2020,  4,  9);
    drawJW('enemy_w2', 0x0D0D0D, 0xDD2020,  5, 10);

    drawJW('enemy_elite',    0x0D0D0D, 0x9900CC,  5,  9);
    drawJW('enemy_elite_w1', 0x0D0D0D, 0x9900CC,  4,  9);
    drawJW('enemy_elite_w2', 0x0D0D0D, 0x9900CC,  5, 10);


    /* ── non-character textures ── */
    const g = this.make.graphics({ add: false });

    g.clear(); g.fillStyle(0xffffff); g.fillRect(0,0,1,1);
    g.generateTexture('pixel', 1, 1);

    g.clear();
    g.fillStyle(0x181410); g.fillRect(0,0,64,64);
    g.fillStyle(0x201a14,0.6); g.fillRect(3,3,40,30);
    g.lineStyle(1,0xC8960C,0.22); g.lineBetween(4,18,46,60);
    g.lineStyle(1,0xA87828,0.14); g.lineBetween(18,4,60,46);
    g.fillStyle(0x080604);
    g.fillRect(0,0,64,2); g.fillRect(0,0,2,64);
    g.fillRect(62,0,2,64); g.fillRect(0,62,64,2);
    g.fillStyle(0xC8960C,0.6);
    g.fillRect(0,0,3,3); g.fillRect(61,0,3,3);
    g.fillRect(0,61,3,3); g.fillRect(61,61,3,3);
    g.generateTexture('floor_tile', 64, 64);

    g.clear();
    g.fillStyle(0x000000,0.55); g.fillCircle(27,29,26);
    g.fillStyle(0x706050);      g.fillCircle(26,26,25);
    g.fillStyle(0x585040);      g.fillCircle(26,26,21);
    g.fillStyle(0x403830);      g.fillCircle(26,26,15);
    g.fillStyle(0x282018);      g.fillCircle(26,26,9);
    g.fillStyle(0x181008);      g.fillCircle(26,26,4);
    g.lineStyle(1,0xC8960C,0.22); g.lineBetween(14,6,38,46);
    g.lineStyle(1,0x9E7A40,0.14); g.lineBetween(6,22,46,34);
    g.lineStyle(2.5,0xC8960C,0.9); g.strokeCircle(26,26,23);
    g.lineStyle(1,0xC8960C,0.45);  g.strokeCircle(26,26,17);
    g.fillStyle(0x907060,0.35); g.fillEllipse(21,19,16,11);
    g.generateTexture('pillar', 52, 52);

    g.destroy();

    const bar = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2+50, 0, 3, C.AMBER);
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2-30, 'AGENT 404', {
      fontFamily:'Share Tech Mono', fontSize:'28px', color:'#C8960C', letterSpacing:10,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH/2, GAME_HEIGHT/2+10, 'INITIALIZING . . .', {
      fontFamily:'Share Tech Mono', fontSize:'11px', color:'#6B4A04', letterSpacing:4,
    }).setOrigin(0.5);
    this.tweens.add({
      targets: bar, width: 300, duration: 700, ease: 'Quad.Out',
      onComplete: () => this.scene.start('IntroScene'),
    });
  }
}
