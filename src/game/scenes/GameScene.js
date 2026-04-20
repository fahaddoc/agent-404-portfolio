import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT, WALL_T, DOOR_GAP,
  C, ROOM_CONFIGS
} from '../config.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import ClassifiedModal from '../ui/ClassifiedModal.js';

const DOOR_HEIGHT = DOOR_GAP;        // 100
const DOOR_Y_TOP  = GAME_HEIGHT / 2 - DOOR_HEIGHT / 2;   // 300
const DOOR_Y_BOT  = GAME_HEIGHT / 2 + DOOR_HEIGHT / 2;   // 400

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.cameras.main.setBackgroundColor(0x100d0a);
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.currentRoomIndex = 0;
    this.roomCleared  = false;
    this.transitioning = false;
    this._enemyColliders = [];   // track per-room colliders so we can clean them up
    this._doorCollider   = null;

    // Physics groups
    this.wallGroup     = this.physics.add.staticGroup();
    this.obstacleGroup = this.physics.add.staticGroup();
    this.enemyGroup    = this.physics.add.group();
    this.playerBullets = this.physics.add.group();
    this.enemyBullets  = this.physics.add.group();

    // Visuals
    this.roomGfx  = this.add.graphics().setDepth(0);
    this.decorGfx = this.add.graphics().setDepth(1);

    // Player
    this.player = new Player(this, 120, GAME_HEIGHT / 2);

    // Expose bullet group to Player (for spacebar shooting)
    this._bulletGroupRef = this.playerBullets;

    // Input
    this.cursors  = this.input.keyboard.createCursorKeys();
    this.wasd     = this.input.keyboard.addKeys({ W: 'W', A: 'A', S: 'S', D: 'D' });
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.fKey     = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // Mouse shooting
    this.input.on('pointerdown', () => {
      if (!this.modal.isOpen) this.player.shoot(this.playerBullets);
    });

    // Modal
    this.modal = new ClassifiedModal();

    // ── Colliders & Overlaps ──────────────────────────────────────────────
    this.physics.add.collider(this.player, this.wallGroup);
    this.physics.add.collider(this.player, this.obstacleGroup);

    // Player bullets vs walls/obstacles → wall spark
    this.physics.add.collider(
      this.playerBullets, this.wallGroup,
      (b) => this._destroyBullet(b, 'wall')
    );
    this.physics.add.collider(
      this.playerBullets, this.obstacleGroup,
      (b) => this._destroyBullet(b, 'obstacle')
    );

    // Enemy bullets vs walls/obstacles
    this.physics.add.collider(
      this.enemyBullets, this.wallGroup,
      (b) => this._destroyBullet(b, 'wall')
    );
    this.physics.add.collider(
      this.enemyBullets, this.obstacleGroup,
      (b) => this._destroyBullet(b, 'obstacle')
    );

    // Player bullets vs enemies — blood + damage
    this.physics.add.overlap(
      this.playerBullets, this.enemyGroup,
      (bullet, enemy) => {
        if (!bullet.active || !enemy.alive) return;
        this._destroyBullet(bullet, 'enemy');
        enemy.takeDamage(1);
      }
    );

    // Enemy bullets vs player — damage
    this.physics.add.overlap(
      this.enemyBullets, this.player,
      (player, bullet) => {
        if (!bullet.active) return;
        this._destroyBullet(bullet, 'player');
        this.player.takeDamage();
      }
    );

    // Enemy vs walls (so they don't walk through)
    this.physics.add.collider(this.enemyGroup, this.wallGroup);
    this.physics.add.collider(this.enemyGroup, this.obstacleGroup);

    // Events
    this.events.on('enemyDied', this._onEnemyDied, this);
    this.events.on('playerDied', this._onPlayerDied, this);

    // UI
    this.events.emit('playerHpChanged', this.player.hp);
    this.events.emit('roomChanged', 0);

    // Death overlay
    this._createDeathOverlay();

    // Build first room
    this._buildRoom(0);
  }

  update() {
    if (this.transitioning || this.modal.isOpen) {
      if (this.modal.isOpen) this.player.body.setVelocity(0, 0);
      return;
    }

    // F key also shoots
    if (Phaser.Input.Keyboard.JustDown(this.fKey)) {
      this.player.shoot(this.playerBullets);
    }
    // Hold left click = rapid fire
    if (this.input.activePointer.isDown) {
      this.player.shoot(this.playerBullets);
    }

    this.player.update(this.cursors, this.wasd, this.spaceKey, this.input.activePointer, this.enemyGroup.getChildren());

    // Update enemies
    this.enemyGroup.getChildren().forEach(e => {
      if (e.alive) e.update(this.player, this.enemyBullets);
    });

    // Cull out-of-bounds bullets
    this._cullBullets(this.playerBullets);
    this._cullBullets(this.enemyBullets);

    // Check if player walked through open door
    if (this.roomCleared && this.doorZone && !this.transitioning) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.doorZone.x, this.doorZone.y
      );
      if (dist < 55) this._nextRoom();
    }
  }

  // ── Room Building ─────────────────────────────────────────────────────────

  _buildRoom(index) {
    const conf = ROOM_CONFIGS[index];
    this.roomCleared = false;
    this.doorLock = null;
    this.doorZone = null;

    // Remove stale per-room colliders to prevent leak/ghosting
    this._enemyColliders.forEach(c => { if (c) this.physics.world.removeCollider(c); });
    this._enemyColliders = [];
    if (this._doorCollider) { this.physics.world.removeCollider(this._doorCollider); this._doorCollider = null; }

    this.events.emit('roomChanged', index);

    // Clear physics groups (visual objects destroyed separately)
    this.wallGroup.clear(true, true);
    this.obstacleGroup.clear(true, true);
    this.enemyGroup.clear(true, true);
    this.playerBullets.clear(true, true);
    this.enemyBullets.clear(true, true);

    // Draw floor + walls
    this.roomGfx.clear();
    this._drawFloor();
    this._drawWalls(index);
    this._addWallBodies(index);

    // Obstacles — destroy any pillar images from previous room
    if (this._pillars) { this._pillars.forEach(p => { if (p.active) p.destroy(); }); }
    this._pillars = [];
    this.decorGfx.clear();
    conf.obstacles.forEach(o => this._addObstacle(o));

    // Locked door
    if (index < ROOM_CONFIGS.length - 1) this._addLockedDoor();

    // Enemies
    conf.enemies.forEach(ec => {
      const e = new Enemy(this, ec.x, ec.y, ec.px1, ec.px2, ec.elite);
      this.enemyGroup.add(e);
      this._enemyColliders.push(this.physics.add.collider(e, this.wallGroup));
      this._enemyColliders.push(this.physics.add.collider(e, this.obstacleGroup));
    });

    this._showRoomNotif(conf.name, conf.subtitle);
  }

  _drawFloor() {
    const g = this.roomGfx;
    const TILE = 80;

    // Warm near-black base
    g.fillStyle(0x100d0a);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // ── Marble checkerboard — clearly visible two-tone ──
    for (let tx = 0; tx < GAME_WIDTH; tx += TILE) {
      for (let ty = 0; ty < GAME_HEIGHT; ty += TILE) {
        const alt = ((tx / TILE + ty / TILE) % 2 === 0);
        // Dark tile: warm near-black; Light tile: warm dark stone — enough contrast
        g.fillStyle(alt ? 0x181410 : 0x2a231c);
        g.fillRect(tx, ty, TILE, TILE);

        // Marble vein texture within each tile
        const v = (tx / TILE * 3 + ty / TILE * 7) % 6;
        if (v === 0) {
          g.lineStyle(1, 0xC8960C, 0.18);
          g.lineBetween(tx + 5, ty + TILE * 0.3, tx + TILE * 0.65, ty + 5);
        } else if (v === 1) {
          g.lineStyle(1, 0xA87828, 0.14);
          g.lineBetween(tx + TILE * 0.25, ty + TILE - 5, tx + TILE - 5, ty + TILE * 0.35);
        } else if (v === 2) {
          g.lineStyle(1, 0xC8960C, 0.12);
          g.lineBetween(tx + TILE * 0.5, ty + 5, tx + TILE - 5, ty + TILE * 0.6);
        } else if (v === 3) {
          // Cross-vein
          g.lineStyle(1, 0x8B6010, 0.10);
          g.lineBetween(tx, ty + TILE * 0.6, tx + TILE * 0.4, ty + TILE);
        }
      }
    }

    // ── Grout lines (dark, visible) ──
    g.lineStyle(2, 0x080604, 1);
    for (let x = 0; x <= GAME_WIDTH; x += TILE) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y <= GAME_HEIGHT; y += TILE) g.lineBetween(0, y, GAME_WIDTH, y);

    // ── Gold diamond inlay at every tile intersection ──
    g.fillStyle(0xC8960C, 0.55);
    for (let x = TILE; x < GAME_WIDTH; x += TILE) {
      for (let y = TILE; y < GAME_HEIGHT; y += TILE) {
        // Small gold diamond/cross at grout intersection
        g.fillRect(x - 2, y - 1, 4, 2);
        g.fillRect(x - 1, y - 2, 2, 4);
      }
    }

    // ── Subtle warm ambient pool (hotel sconce lighting effect) ──
    // Very faint warm light puddles near wall sconces
    g.fillStyle(0xC8960C, 0.03);
    for (let x = 160; x < GAME_WIDTH - 160; x += 210) {
      g.fillCircle(x, 40, 60);
      g.fillCircle(x, GAME_HEIGHT - 40, 60);
    }
  }

  _drawWalls(index) {
    const g = this.roomGfx;
    const W = GAME_WIDTH, H = GAME_HEIGHT, T = WALL_T;
    const dT = DOOR_Y_TOP, dB = DOOR_Y_BOT;
    const isLast = index >= ROOM_CONFIGS.length - 1;

    // ── Wall base — rich dark mahogany ──
    g.fillStyle(0x1e120a);
    g.fillRect(0, 0, W, T);
    g.fillRect(0, H - T, W, T);
    if (index === 0) { g.fillRect(0, 0, T, H); }
    else { g.fillRect(0, 0, T, dT); g.fillRect(0, dB, T, H - dB); }
    if (isLast) { g.fillRect(W - T, 0, T, H); }
    else { g.fillRect(W - T, 0, T, dT); g.fillRect(W - T, dB, T, H - dB); }

    // ── Wood grain bands on walls ──
    g.fillStyle(0x170d06, 0.9);
    for (let x = T + 4; x < W - T - 4; x += 110) {
      const pw = Math.min(102, W - T - x - 4);
      if (pw > 20) {
        g.fillRect(x, 3, pw, T - 6);
        g.fillRect(x, H - T + 3, pw, T - 6);
      }
    }
    // Horizontal wood grain lines
    g.lineStyle(1, 0x140c05, 0.7);
    for (let y = 6; y < T - 4; y += 6) {
      g.lineBetween(T, y, W - T, y);
      g.lineBetween(T, H - T + y, W - T, H - T + y);
    }

    // ── Warm amber glow behind gold molding (soft light halo) ──
    g.fillStyle(0xC8960C, 0.14);
    g.fillRect(0, T - 10, W, 10);
    g.fillRect(0, H - T, W, 10);

    // ── GOLD inner molding — thick, bright, dominant ──
    g.fillStyle(0xC8960C);
    g.fillRect(0, T - 3, W, 3);
    g.fillRect(0, H - T, W, 3);
    if (index === 0) {
      g.fillRect(T - 3, 0, 3, H);
    } else {
      g.fillRect(T - 3, 0, 3, dT);
      g.fillRect(T - 3, dB, 3, H - dB);
    }
    if (isLast) {
      g.fillRect(W - T, 0, 3, H);
    } else {
      g.fillRect(W - T, 0, 3, dT);
      g.fillRect(W - T, dB, 3, H - dB);
    }

    // ── Secondary thin gold line (double molding) ──
    g.fillStyle(0xC8960C, 0.45);
    g.fillRect(0, T - 7, W, 2);
    g.fillRect(0, H - T + 4, W, 2);

    // ── Wall sconces — visible warm light fixtures ──
    for (let x = 160; x < W - 160; x += 210) {
      // Gold bracket
      g.fillStyle(0xC8960C);
      g.fillRect(x - 5, T - 11, 10, 8);
      g.fillRect(x - 2, T - 14, 4, 3);
      // Warm light glow (large soft circle)
      g.fillStyle(0xFFEE88, 0.5);
      g.fillCircle(x, T - 8, 7);
      g.fillStyle(0xFFDD66, 0.2);
      g.fillCircle(x, T - 8, 14);
      // Bottom sconces
      g.fillStyle(0xC8960C);
      g.fillRect(x - 5, H - T + 3, 10, 8);
      g.fillRect(x - 2, H - T + 11, 4, 3);
      g.fillStyle(0xFFEE88, 0.5);
      g.fillCircle(x, H - T + 7, 7);
      g.fillStyle(0xFFDD66, 0.2);
      g.fillCircle(x, H - T + 7, 14);
    }

    // ── Gold corner ornaments (prominent L-brackets) ──
    g.fillStyle(0xC8960C);
    // Top-left
    g.fillRect(T, T - 3, 48, 3); g.fillRect(T - 3, T, 3, 48);
    // Corner dot
    g.fillRect(T - 3, T - 3, 6, 6);
    // Top-right
    g.fillRect(W - T - 48, T - 3, 48, 3); g.fillRect(W - T, T, 3, 48);
    g.fillRect(W - T, T - 3, 6, 6);
    // Bottom-left
    g.fillRect(T, H - T, 48, 3); g.fillRect(T - 3, H - T - 48, 3, 48);
    g.fillRect(T - 3, H - T, 6, 6);
    // Bottom-right
    g.fillRect(W - T - 48, H - T, 48, 3); g.fillRect(W - T, H - T - 48, 3, 48);
    g.fillRect(W - T, H - T, 6, 6);

    // ── Gold panel dividers (visible vertical lines) ──
    g.fillStyle(0xC8960C, 0.35);
    for (let x = T + 110; x < W - T; x += 110) {
      g.fillRect(x, 0, 1, T);
      g.fillRect(x, H - T, 1, T);
    }
  }

  _addWallBodies(index) {
    const W = GAME_WIDTH, H = GAME_HEIGHT, T = WALL_T;
    const dT = DOOR_Y_TOP, dB = DOOR_Y_BOT;
    const isLast = index >= ROOM_CONFIGS.length - 1;

    this._staticZone(0, 0, W, T, this.wallGroup);
    this._staticZone(0, H - T, W, T, this.wallGroup);
    if (index === 0) {
      this._staticZone(0, 0, T, H, this.wallGroup);
    } else {
      this._staticZone(0, 0, T, dT, this.wallGroup);
      this._staticZone(0, dB, T, H - dB, this.wallGroup);
    }
    if (isLast) {
      this._staticZone(W - T, 0, T, H, this.wallGroup);
    } else {
      this._staticZone(W - T, 0, T, dT, this.wallGroup);
      this._staticZone(W - T, dB, T, H - dB, this.wallGroup);
    }
  }

  _staticZone(x, y, w, h, group) {
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(zone, true);
    group.add(zone);
    return zone;
  }

  _addObstacle(o) {
    // Square-ish small obstacle → stone pillar; elongated → wooden crate
    const isPillar = o.w <= 80 && o.h <= 80 && Math.abs(o.w - o.h) <= 20;

    if (isPillar) {
      this._drawPillar(o);
    } else {
      this._drawCrate(o);
    }
    this._staticZone(o.x, o.y, o.w, o.h, this.obstacleGroup);
  }

  _drawPillar(o) {
    // Use pre-generated pillar texture centered in the obstacle bounds
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    const img = this.add.image(cx, cy, 'pillar');
    img.setDisplaySize(Math.min(o.w, o.h) + 4, Math.min(o.w, o.h) + 4);
    img.setDepth(1);
    this.decorGfx; // keep decorGfx ref for clears (pillar is separate image)
    // Track for room cleanup
    if (!this._pillars) this._pillars = [];
    this._pillars.push(img);
  }

  _drawCrate(o) {
    const g = this.decorGfx;
    const { x, y, w, h } = o;

    // Drop shadow
    g.fillStyle(0x000000, 0.45);
    g.fillRect(x + 4, y + 4, w, h);

    // Dark mahogany wood base
    g.fillStyle(0x1a0e08);
    g.fillRect(x, y, w, h);

    // Inset panel (slightly darker center)
    g.fillStyle(0x120a04);
    g.fillRect(x + 5, y + 5, w - 10, h - 10);

    // Wood grain bands
    g.fillStyle(0x140c06, 0.85);
    const step = w >= h
      ? Math.max(20, Math.floor(w / Math.max(2, Math.floor(w / 32))))
      : Math.max(20, Math.floor(h / Math.max(2, Math.floor(h / 32))));
    if (w >= h) {
      for (let i = step; i < w; i += step) {
        g.fillRect(x + i, y + 1, 1, h - 2);
        if (i + 2 < w) g.fillRect(x + i + 2, y + 1, 1, h - 2);
      }
    } else {
      for (let i = step; i < h; i += step) {
        g.fillRect(x + 1, y + i, w - 2, 1);
        if (i + 2 < h) g.fillRect(x + 1, y + i + 2, w - 2, 1);
      }
    }

    // Gold trim strips (top + bottom edge)
    g.fillStyle(0xC8960C);
    g.fillRect(x, y, w, 2);
    g.fillRect(x, y + h - 2, w, 2);

    // Gold corner brackets
    const bs = 10;
    g.fillStyle(0xC8960C);
    g.fillRect(x, y, bs, 2);          g.fillRect(x, y, 2, bs);
    g.fillRect(x + w - bs, y, bs, 2); g.fillRect(x + w - 2, y, 2, bs);
    g.fillRect(x, y + h - 2, bs, 2);  g.fillRect(x, y + h - bs, 2, bs);
    g.fillRect(x + w - bs, y + h - 2, bs, 2); g.fillRect(x + w - 2, y + h - bs, 2, bs);

    // Gold center handle
    const hx = x + w / 2, hy = y + h / 2;
    g.fillStyle(0xC8960C, 0.75);
    g.fillRect(hx - 7, hy - 2, 14, 4);
    g.fillStyle(0xFFDD88, 0.9);
    g.fillCircle(hx, hy, 3);

    // Warm glow hint at top edge
    g.fillStyle(0xC8960C, 0.07);
    g.fillRect(x, y, w, 5);
  }

  _addLockedDoor() {
    const W = GAME_WIDTH, T = WALL_T;
    const g = this.roomGfx;

    // Visual
    g.fillStyle(0x1a0404);
    g.fillRect(W - T, DOOR_Y_TOP, T, DOOR_HEIGHT);
    g.fillStyle(C.DOOR_LOCK, 0.4);
    g.fillRect(W - T + 2, DOOR_Y_TOP + 2, T - 4, DOOR_HEIGHT - 4);
    g.fillStyle(C.DOOR_LOCK);
    g.fillRect(W - T, DOOR_Y_TOP, T, 2);
    g.fillRect(W - T, DOOR_Y_BOT - 2, T, 2);
    // Lock icon
    const cx = W - T / 2, cy = GAME_HEIGHT / 2;
    g.fillStyle(C.DOOR_LOCK);
    g.fillRect(cx - 5, cy, 10, 8);
    g.fillStyle(0x000000);
    g.fillCircle(cx, cy - 2, 5);
    g.fillStyle(0x2a0000);
    g.fillCircle(cx, cy - 3, 3);

    // Physics body
    this.doorLock = this._staticZone(W - T, DOOR_Y_TOP, T, DOOR_HEIGHT, this.wallGroup);
    this._doorCollider = this.physics.add.collider(this.player, this.doorLock);

    // Walk-through trigger zone (for detecting when player passes through after unlock)
    this.doorZone = this.add.zone(W - T / 2, GAME_HEIGHT / 2, T + 20, DOOR_HEIGHT);
  }

  // ── Room Clearing ─────────────────────────────────────────────────────────

  _onEnemyDied() {
    const alive = this.enemyGroup.getChildren().filter(e => e.alive);
    if (alive.length === 0 && !this.roomCleared) this._clearRoom();
  }

  _clearRoom() {
    this.roomCleared = true;
    const conf    = ROOM_CONFIGS[this.currentRoomIndex];
    const isLast  = this.currentRoomIndex === ROOM_CONFIGS.length - 1;

    // Unlock door visual
    if (!isLast && this.doorLock) {
      this.wallGroup.remove(this.doorLock, true, true);
      this.doorLock = null;

      const W = GAME_WIDTH, T = WALL_T;
      const g = this.roomGfx;
      g.fillStyle(0x100c08);
      g.fillRect(W - T, DOOR_Y_TOP, T, DOOR_HEIGHT);
      g.fillStyle(C.GREEN, 0.5);
      g.fillRect(W - T, DOOR_Y_TOP, T, 2);
      g.fillRect(W - T, DOOR_Y_BOT - 2, T, 2);
      g.fillStyle(C.GREEN, 0.12);
      g.fillRect(W - T, DOOR_Y_TOP + 2, T, DOOR_HEIGHT - 4);
      // Arrow hint
      g.fillStyle(C.AMBER);
      g.fillTriangle(W - T + 10, GAME_HEIGHT / 2, W - T + 2, GAME_HEIGHT / 2 - 8, W - T + 2, GAME_HEIGHT / 2 + 8);
    }

    // Screen flash
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, C.AMBER)
      .setAlpha(0).setDepth(20);
    this.tweens.add({ targets: flash, alpha: 0.12, duration: 80, yoyo: true, onComplete: () => flash.destroy() });
    this.cameras.main.shake(200, 0.005);

    // Notification
    const notif = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70,
      '◆  CLASSIFIED DATA UNLOCKED  ◆', {
        fontFamily: 'Share Tech Mono', fontSize: '16px', color: '#C8960C',
        letterSpacing: 4, stroke: '#000', strokeThickness: 4,
      }
    ).setOrigin(0.5).setDepth(25).setAlpha(0);

    this.tweens.add({
      targets: notif, alpha: 1, y: '-=16', duration: 280, ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(900, () => {
          this.tweens.add({
            targets: notif, alpha: 0, duration: 280,
            onComplete: () => {
              notif.destroy();
              this.physics.pause();
              this.modal.open(conf.section, () => {
                this.physics.resume();
                if (isLast) this._showVictory();
              });
            }
          });
        });
      }
    });
  }

  // ── Room Transition ───────────────────────────────────────────────────────

  _nextRoom() {
    if (this.transitioning) return;
    this.transitioning = true;

    this.cameras.main.fadeOut(480, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.currentRoomIndex++;
      this.player.body.reset(120, GAME_HEIGHT / 2);
      this.player.x = 120;
      this.player.y = GAME_HEIGHT / 2;
      this._buildRoom(this.currentRoomIndex);
      this.cameras.main.fadeIn(480, 0, 0, 0);
      this.cameras.main.once('camerafadeincomplete', () => { this.transitioning = false; });
    });
  }

  // ── Player Death ──────────────────────────────────────────────────────────

  _onPlayerDied() {
    this.physics.pause();
    this.deathBg.setAlpha(0.88);
    this.deathText.setAlpha(1);
    this.retryText.setAlpha(1);

    this.input.keyboard.once('keydown', () => this._respawn());
    this.input.once('pointerdown', () => this._respawn());
  }

  _respawn() {
    // Guard: both keyboard + pointer listeners registered, only execute once
    if (this._respawning) return;
    this._respawning = true;

    this.transitioning = false;
    this.cameras.main.resetFX();   // stop any in-progress fade
    this.cameras.main.setAlpha(1); // ensure camera is fully visible

    this.deathBg.setAlpha(0);
    this.deathText.setAlpha(0);
    this.retryText.setAlpha(0);
    this.physics.resume();
    this.player.respawn(120, GAME_HEIGHT / 2);
    this._buildRoom(this.currentRoomIndex);

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this._respawning = false;
  }

  _createDeathOverlay() {
    this.deathBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000)
      .setDepth(30).setAlpha(0);
    this.deathText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 'AGENT DOWN', {
      fontFamily: 'Share Tech Mono', fontSize: '52px',
      color: '#FF3333', letterSpacing: 8, stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(31).setAlpha(0);
    this.retryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40,
      '[ PRESS ANY KEY TO RETRY ]', {
        fontFamily: 'Share Tech Mono', fontSize: '14px', color: '#C8960C', letterSpacing: 3,
      }
    ).setOrigin(0.5).setDepth(31).setAlpha(0);
  }

  _showVictory() {
    this.cameras.main.fadeOut(700);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cameras.main.fadeIn(700);

      // Store all victory objects so we can destroy them on replay
      this._victoryObjects = [];
      const vo = (obj) => { this._victoryObjects.push(obj); return obj; };

      vo(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000).setDepth(40).setAlpha(0.96));
      vo(this.add.text(GAME_WIDTH / 2, 200, 'MISSION COMPLETE', {
        fontFamily: 'Share Tech Mono', fontSize: '52px', color: '#C8960C', letterSpacing: 8, stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(41));
      vo(this.add.text(GAME_WIDTH / 2, 290, 'ALL 6 SECTORS CLEARED · AGENT 404', {
        fontFamily: 'Share Tech Mono', fontSize: '15px', color: '#A87830', letterSpacing: 3,
      }).setOrigin(0.5).setDepth(41));
      vo(this.add.text(GAME_WIDTH / 2, 360, '"They said he didn\'t exist.  His code says otherwise."', {
        fontFamily: 'Share Tech Mono', fontSize: '13px', color: '#554433', letterSpacing: 1,
      }).setOrigin(0.5).setDepth(41));
      vo(this.add.text(GAME_WIDTH / 2, 460, '[ CLICK TO PLAY AGAIN ]', {
        fontFamily: 'Share Tech Mono', fontSize: '14px', color: '#C8960C', letterSpacing: 3,
      }).setOrigin(0.5).setDepth(41));

      this.input.once('pointerdown', () => {
        // Destroy all victory screen objects
        if (this._victoryObjects) {
          this._victoryObjects.forEach(o => { if (o && o.active) o.destroy(); });
          this._victoryObjects = [];
        }
        this.transitioning = false;
        this.cameras.main.resetFX();
        this.currentRoomIndex = 0;
        this.player.respawn(120, GAME_HEIGHT / 2);
        this._buildRoom(0);
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.physics.resume();
      });
    });
  }

  // ── Effects ───────────────────────────────────────────────────────────────

  _destroyBullet(bullet, type = 'wall') {
    if (!bullet || !bullet.active) return;

    // Immediately flag inactive + kill body so callback can't fire again this frame
    bullet.setActive(false).setVisible(false);
    if (bullet.body) { bullet.body.enable = false; bullet.body.setVelocity(0, 0); }

    const x = bullet.x, y = bullet.y;
    const angle = bullet.rotation;
    bullet.destroy();

    // Impact sparks
    const cols = type === 'wall'
      ? [0xC8960C, 0xDDB870, 0xFFEEAA, 0x887040]   // gold marble chips
      : type === 'obstacle'
        ? [0x5a3010, 0x8a5020, 0xC8960C, 0x3a1c08]  // dark wood splinters + gold
        : [0xCC0000, 0xFF2222]; // enemy hit (backup)

    const count = type === 'wall' ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const sa = angle + Math.PI + Phaser.Math.FloatBetween(-0.8, 0.8);
      const dist = Phaser.Math.FloatBetween(8, 28);
      const sz = Phaser.Math.Between(2, 5);
      const col = cols[Phaser.Math.Between(0, cols.length - 1)];
      const p = this.add.rectangle(x, y, sz, sz, col);
      p.setDepth(7);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(sa) * dist,
        y: y + Math.sin(sa) * dist,
        alpha: 0,
        scaleX: 0.2, scaleY: 0.2,
        duration: Phaser.Math.Between(80, 180),
        ease: 'Quad.Out',
        onComplete: () => p.destroy(),
      });
    }

    // Wall scorch mark (small dark spot)
    if (type === 'wall' || type === 'obstacle') {
      const scorch = this.add.circle(x, y, 3, 0x000000, 0.5);
      scorch.setDepth(2);
      this.time.delayedCall(3000, () => { if (scorch.active) scorch.destroy(); });
    }
  }

  _cullBullets(group) {
    group.getChildren().forEach(b => {
      if (b.active && (b.x < -40 || b.x > GAME_WIDTH + 40 || b.y < -40 || b.y > GAME_HEIGHT + 40)) {
        b.destroy();
      }
    });
  }

  _showRoomNotif(name, subtitle) {
    const t1 = this.add.text(GAME_WIDTH / 2, 78, name, {
      fontFamily: 'Share Tech Mono', fontSize: '20px', color: '#C8960C',
      letterSpacing: 5, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    const t2 = this.add.text(GAME_WIDTH / 2, 104, subtitle, {
      fontFamily: 'Share Tech Mono', fontSize: '11px', color: '#555', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);

    this.tweens.add({
      targets: [t1, t2], alpha: 1, duration: 380,
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: [t1, t2], alpha: 0, duration: 380,
            onComplete: () => { t1.destroy(); t2.destroy(); }
          });
        });
      }
    });
  }
}
