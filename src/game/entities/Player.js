import Phaser from 'phaser';
import { PLAYER_SPEED, BULLET_SPEED, PLAYER_MAX_HP, C } from '../config.js';

// Pistol muzzle: art x=19, center x=10 → 9 art px × 2 = 18 real px
const GUN_TIP_DIST = 18;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');

    this.hp = PLAYER_MAX_HP;
    this.alive = true;
    this.invincible = false;
    this.canShoot = true;
    this.shootCooldown = 200;
    this._facing = 1;    // 1 = right, -1 = left
    this._aimAngle = 0;  // radians, for bullet direction

    // Pivot at exact center of 40×56 texture
    this.setOrigin(0.5, 0.5);
    this.setDepth(5);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Circle hitbox at torso — 40×68 sprite, slim profile, r=7
    this.body.setCircle(7, 13, 24);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(PLAYER_SPEED * 1.1, PLAYER_SPEED * 1.1);

    // Crosshair cursor
    scene.input.setDefaultCursor('crosshair');
  }

  shoot(bulletGroup) {
    if (!this.canShoot || !this.alive) return;

    const angle = this._aimAngle;

    // Bullet spawns at gun barrel tip (28px from sprite center along aim axis)
    const bx = this.x + Math.cos(angle) * GUN_TIP_DIST;
    const by = this.y + Math.sin(angle) * GUN_TIP_DIST;

    // group.create() builds the physics body fresh — velocity won't get reset
    const bullet = bulletGroup.create(bx, by, 'pixel');
    bullet.setDisplaySize(16, 4);
    bullet.setTint(C.AMBER);
    bullet.setRotation(angle);
    bullet.setDepth(4);
    bullet.isPlayerBullet = true;
    bullet.body.setVelocity(Math.cos(angle) * BULLET_SPEED, Math.sin(angle) * BULLET_SPEED);
    bullet.body.allowGravity = false;

    // Bullet trail — small fading dots left behind
    this._spawnBulletTrail(bx, by, angle, C.AMBER);

    // Muzzle flash at barrel tip
    const mx = this.x + Math.cos(angle) * (GUN_TIP_DIST + 8);
    const my = this.y + Math.sin(angle) * (GUN_TIP_DIST + 8);
    const flash = this.scene.add.circle(mx, my, 7, 0xFFDD44, 1);
    flash.setDepth(6);
    this.scene.tweens.add({
      targets: flash, alpha: 0, scaleX: 2.5, scaleY: 2.5,
      duration: 70, ease: 'Quad.Out',
      onComplete: () => flash.destroy(),
    });

    this.canShoot = false;
    this.scene.time.delayedCall(this.shootCooldown, () => { this.canShoot = true; });
  }

  update(cursors, wasdKeys, spaceKey, pointer, enemies) {
    if (!this.alive) return;

    // ── Movement ──
    let vx = 0, vy = 0;
    if (cursors.left.isDown  || wasdKeys.A.isDown) vx -= PLAYER_SPEED;
    if (cursors.right.isDown || wasdKeys.D.isDown) vx += PLAYER_SPEED;
    if (cursors.up.isDown    || wasdKeys.W.isDown) vy -= PLAYER_SPEED;
    if (cursors.down.isDown  || wasdKeys.S.isDown) vy += PLAYER_SPEED;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    this.body.setVelocity(vx, vy);

    // ── Walk animation via texture swap ──
    const moving = vx !== 0 || vy !== 0;
    const dt = this.scene.game.loop.delta;
    const WALK_KEYS = ['player', 'player_w1', 'player', 'player_w2'];
    if (moving) {
      this._walkT = (this._walkT || 0) + dt;
      const newKey = WALK_KEYS[Math.floor(this._walkT / 100) % 4];
      if (this.texture.key !== newKey) this.setTexture(newKey);
    } else {
      this._walkT = 0;
      if (this.texture.key !== 'player') this.setTexture('player');
    }

    // ── Aim / facing logic (side-view: use flipX, not rotation) ──
    const AUTO_AIM_RANGE = 340;
    const nearestEnemy = this._nearestEnemy(enemies);
    const enemyDist = nearestEnemy
      ? Phaser.Math.Distance.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y)
      : Infinity;

    if (nearestEnemy && enemyDist <= AUTO_AIM_RANGE) {
      this._aimAngle = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
      this._facing   = nearestEnemy.x >= this.x ? 1 : -1;
    } else if (vx !== 0 || vy !== 0) {
      this._aimAngle = Math.atan2(vy, vx);
      if (vx !== 0) this._facing = vx > 0 ? 1 : -1;
    }
    this.setFlipX(this._facing < 0);

    // ── Shoot on SPACE or F key ──
    if (Phaser.Input.Keyboard.JustDown(spaceKey)) {
      this.shoot(this.scene._bulletGroupRef);
    }
  }

  // Returns nearest alive enemy
  _nearestEnemy(enemies) {
    if (!enemies || enemies.length === 0) return null;
    const alive = enemies.filter(e => e.alive);
    if (alive.length === 0) return null;

    let best = null, bestDist = Infinity;
    alive.forEach(e => {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (dist < bestDist) { bestDist = dist; best = e; }
    });
    return best;
  }

  _spawnBulletTrail(x, y, angle, color) {
    for (let i = 1; i <= 3; i++) {
      const ox = x - Math.cos(angle) * i * 7;
      const oy = y - Math.sin(angle) * i * 7;
      const dot = this.scene.add.circle(ox, oy, 3 - i * 0.6, color, 0.7 - i * 0.15);
      dot.setDepth(3);
      this.scene.tweens.add({
        targets: dot, alpha: 0, scaleX: 0.2, scaleY: 0.2,
        duration: 80 + i * 20, ease: 'Quad.Out',
        onComplete: () => dot.destroy(),
      });
    }
  }

  takeDamage() {
    if (this.invincible || !this.alive) return;
    this.hp--;
    this.invincible = true;

    // Red flash on player
    this.setTint(0xFF3333);
    this.scene.tweens.add({
      targets: this, alpha: 0.4,
      yoyo: true, repeat: 3, duration: 70,
      onComplete: () => {
        this.clearTint();
        this.setAlpha(1);
        this.invincible = false;
      },
    });

    this.scene.cameras.main.shake(180, 0.009);
    this.scene.events.emit('playerHpChanged', this.hp);

    if (this.hp <= 0) this._die();
  }

  _die() {
    this.alive = false;
    this.body.setVelocity(0, 0);

    // Death burst
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const p = this.scene.add.circle(this.x, this.y, Phaser.Math.Between(3, 6), C.AMBER);
      p.setDepth(10);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(a) * Phaser.Math.Between(40, 80),
        y: this.y + Math.sin(a) * Phaser.Math.Between(40, 80),
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 500, ease: 'Quad.Out',
        onComplete: () => p.destroy(),
      });
    }
    this.setAlpha(0);
    this.scene.time.delayedCall(500, () => this.scene.events.emit('playerDied'));
  }

  respawn(x, y) {
    this.x = x; this.y = y;
    this.hp = PLAYER_MAX_HP;
    this.alive = true;
    this.invincible = false;
    this._facing = 1;
    this._aimAngle = 0;
    this.setFlipX(false);
    this.clearTint();
    this.setAlpha(1);
    this.body.reset(x, y);
    this.scene.events.emit('playerHpChanged', this.hp);
  }
}
