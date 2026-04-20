import Phaser from 'phaser';
import { PLAYER_SPEED, BULLET_SPEED, PLAYER_MAX_HP, C } from '../config.js';

// Gun tip is ~28px right of sprite center (texture: 64×40, origin 0.5,0.5)
const GUN_TIP_DIST = 28;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');

    this.hp = PLAYER_MAX_HP;
    this.alive = true;
    this.invincible = false;
    this.canShoot = true;
    this.shootCooldown = 200;

    // Pivot at exact center of 64×40 texture
    this.setOrigin(0.5, 0.5);
    this.setDepth(5);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Circle hitbox centered at sprite origin (body center)
    // 64/2 - 13 = 19,  40/2 - 13 = 7
    this.body.setCircle(13, 19, 7);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(PLAYER_SPEED * 1.1, PLAYER_SPEED * 1.1);

    // Crosshair cursor
    scene.input.setDefaultCursor('crosshair');
  }

  shoot(bulletGroup) {
    if (!this.canShoot || !this.alive) return;

    const angle = this.rotation;

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

    // ── Aim logic ──
    // If any enemy is within AUTO_AIM_RANGE, lock onto nearest one
    const AUTO_AIM_RANGE = 320;
    const nearestEnemy = this._nearestEnemy(enemies);
    const enemyDist = nearestEnemy
      ? Phaser.Math.Distance.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y)
      : Infinity;

    let angle;
    if (nearestEnemy && enemyDist <= AUTO_AIM_RANGE) {
      // Enemy nearby → auto-aim at them
      angle = Phaser.Math.Angle.Between(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
    } else {
      // No nearby enemy → aim at mouse
      angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    }
    this.setRotation(angle);

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
    this.clearTint();
    this.setAlpha(1);
    this.body.reset(x, y);
    this.scene.events.emit('playerHpChanged', this.hp);
  }
}
