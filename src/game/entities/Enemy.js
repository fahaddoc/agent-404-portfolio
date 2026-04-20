import Phaser from 'phaser';
import { ENEMY_SPEED, ENEMY_BULLET_SPEED, ENEMY_HP, ELITE_HP, C } from '../config.js';

const STATE = { PATROL: 0, ALERT: 1, DEAD: 2 };
const DETECT_RANGE = 340;
const SHOOT_RANGE  = 280;
const BASE_COOLDOWN = 1600;

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, patrolX1, patrolX2, isElite = false) {
    const key = isElite ? 'enemy_elite' : 'enemy';
    super(scene, patrolX1, y, key); // Start at patrol start

    this.isElite  = isElite;
    this.hp       = isElite ? ELITE_HP : ENEMY_HP;
    this.maxHp    = this.hp;
    this.state    = STATE.PATROL;
    this.patrolX1 = patrolX1;
    this.patrolX2 = patrolX2;
    this.patrolDir = 1;
    this.canShoot  = true;
    this.alive     = true;
    this.patrolY   = y;

    this.setOrigin(0.5, 0.5);
    this.setDepth(5);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Circle centered at sprite origin: offset = (w/2 - r, h/2 - r)
    this.body.setCircle(12, this.width * 0.5 - 12, this.height * 0.5 - 12);

    // HP bar (separate graphics, world-space)
    this.hpBarBg   = scene.add.graphics().setDepth(8);
    this.hpBarFill = scene.add.graphics().setDepth(9);
    this._redrawHpBar();
  }

  // ── Per-frame update ─────────────────────────────────────────────────────

  update(player, enemyBullets) {
    if (!this.alive || !player.alive) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (dist < DETECT_RANGE) {
      this.state = STATE.ALERT;
      this._alertBehavior(player, dist, enemyBullets);
    } else {
      if (this.state === STATE.ALERT) this.state = STATE.PATROL;
      this._patrolBehavior();
    }

    this._redrawHpBar();
  }

  _patrolBehavior() {
    const spd = this.isElite ? ENEMY_SPEED * 1.2 : ENEMY_SPEED;
    this.body.setVelocityY(0);

    if (this.patrolDir === 1) {
      if (this.x < this.patrolX2) {
        this.body.setVelocityX(spd);
        this.setFlipX(false);
      } else {
        this.patrolDir = -1;
      }
    } else {
      if (this.x > this.patrolX1) {
        this.body.setVelocityX(-spd);
        this.setFlipX(true);
      } else {
        this.patrolDir = 1;
      }
    }
  }

  _alertBehavior(player, dist, enemyBullets) {
    const spd = this.isElite ? ENEMY_SPEED * 1.6 : ENEMY_SPEED * 1.2;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

    // Move toward player (keep some distance)
    if (dist > 120) {
      this.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
    } else {
      this.body.setVelocity(0, 0);
    }

    // Face player
    this.setFlipX(player.x < this.x);

    // Shoot
    if (dist < SHOOT_RANGE && this.canShoot) {
      this._shoot(angle, enemyBullets);
    }
  }

  _shoot(angle, bulletGroup) {
    this.canShoot = false;
    const spd = this.isElite ? ENEMY_BULLET_SPEED * 1.3 : ENEMY_BULLET_SPEED;
    const col = this.isElite ? 0xCC00FF : 0xFF3333;

    const bx = this.x + Math.cos(angle) * 28;
    const by = this.y + Math.sin(angle) * 28;

    const bullet = bulletGroup.create(bx, by, 'pixel');
    bullet.setDisplaySize(14, 4);
    bullet.setTint(col);
    bullet.setRotation(angle);
    bullet.setDepth(4);
    bullet.isEnemyBullet = true;
    bullet.body.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
    bullet.body.allowGravity = false;

    // Trail
    for (let i = 1; i <= 2; i++) {
      const ox = bx - Math.cos(angle) * i * 6;
      const oy = by - Math.sin(angle) * i * 6;
      const dot = this.scene.add.circle(ox, oy, 2.5 - i * 0.5, col, 0.6);
      dot.setDepth(3);
      this.scene.tweens.add({
        targets: dot, alpha: 0, duration: 70 + i * 20,
        onComplete: () => dot.destroy(),
      });
    }

    // Muzzle flash
    const flash = this.scene.add.circle(bx + Math.cos(angle) * 6, by + Math.sin(angle) * 6, 5, col, 0.9);
    flash.setDepth(6);
    this.scene.tweens.add({
      targets: flash, alpha: 0, scaleX: 2, scaleY: 2, duration: 60,
      onComplete: () => flash.destroy(),
    });

    const cooldown = BASE_COOLDOWN + (this.isElite ? 0 : Phaser.Math.Between(-200, 400));
    this.scene.time.delayedCall(cooldown, () => { this.canShoot = true; });
  }

  // ── Damage & Death ────────────────────────────────────────────────────────

  takeDamage(dmg = 1) {
    if (!this.alive) return;
    this.hp -= dmg;

    // Flash white
    this.setTint(0xFFFFFF);
    this.scene.time.delayedCall(80, () => {
      if (this.alive && this.active) this.clearTint();
    });

    // ── BLOOD SPLASH ──
    this._bloodSplash();

    if (this.hp <= 0) this._die();
  }

  _bloodSplash(big = false) {
    const count = big ? 16 : 7;
    const maxDist = big ? 70 : 32;
    const colors = [0xCC0000, 0xFF1111, 0x880000, 0xFF4422];

    for (let i = 0; i < count; i++) {
      const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(10, maxDist);
      const size = Phaser.Math.Between(big ? 4 : 2, big ? 8 : 5);
      const col = colors[Phaser.Math.Between(0, colors.length - 1)];

      const p = this.scene.add.circle(this.x, this.y, size, col);
      p.setDepth(3);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Math.cos(a) * dist,
        y: this.y + Math.sin(a) * dist + (big ? dist * 0.3 : 0),
        alpha: 0,
        scaleX: big ? 0.3 : 0.5,
        scaleY: big ? 0.3 : 0.5,
        duration: Phaser.Math.Between(200, big ? 600 : 350),
        ease: 'Quad.Out',
        onComplete: () => p.destroy(),
      });
    }
  }

  _die() {
    this.alive = false;
    this.state = STATE.DEAD;
    this.body.setVelocity(0, 0);
    this.body.enable = false;
    if (this.hpBarBg)   this.hpBarBg.destroy();
    if (this.hpBarFill) this.hpBarFill.destroy();

    // Big blood splash on death
    this._bloodSplash(true);

    this.scene.cameras.main.shake(120, 0.007);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5, scaleY: 0.5,
      rotation: Phaser.Math.FloatBetween(-1.5, 1.5),
      duration: 300, ease: 'Quad.In',
      onComplete: () => {
        this.scene.events.emit('enemyDied', this);
        this.destroy();
      },
    });
  }

  // ── HP Bar ────────────────────────────────────────────────────────────────

  _redrawHpBar() {
    if (!this.hpBarBg || !this.hpBarFill) return;
    const W = 36, H = 4;
    const bx = this.x - W / 2;
    const by = this.y - 28;

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x111111);
    this.hpBarBg.fillRect(bx, by, W, H);

    const filled = Math.max(0, (this.hp / this.maxHp)) * W;
    const col = this.isElite ? 0xCC00FF : 0xFF3333;
    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(col);
    this.hpBarFill.fillRect(bx, by, filled, H);
  }

  destroy() {
    if (this.hpBarBg   && this.hpBarBg.scene)   this.hpBarBg.destroy();
    if (this.hpBarFill && this.hpBarFill.scene)  this.hpBarFill.destroy();
    super.destroy();
  }
}
