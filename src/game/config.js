export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 700;
export const WALL_T = 32;           // wall thickness
export const DOOR_GAP = 100;        // door opening height
export const PLAYER_SPEED = 210;
export const ENEMY_SPEED = 70;
export const BULLET_SPEED = 520;
export const ENEMY_BULLET_SPEED = 260;
export const PLAYER_MAX_HP = 5;
export const ENEMY_HP = 2;
export const ELITE_HP = 4;

export const C = {
  DARK:       0x0a0805,   // deep warm black
  FLOOR:      0x0d0b09,   // dark warm marble A
  FLOOR_ALT:  0x110f0c,   // dark warm marble B
  WALL:       0x0c0806,   // dark mahogany
  WALL_EDGE:  0x1e1208,   // mahogany edge
  AMBER:      0xC8960C,   // primary = rich gold
  AMBER_DIM:  0x6B4A04,
  CYAN:       0x8B1020,   // secondary = deep burgundy
  RED:        0xCC1122,
  GREEN:      0xD4A520,   // door open = bright gold
  PURPLE:     0x7B1FA2,   // elite accent
  PLAYER_COL: 0x08080a,
  ENEMY_COL:  0x0d0808,
  ELITE_COL:  0x0d0808,
  OBSTACLE:   0x1a0e08,
  OBS_EDGE:   0x2a1810,
  DOOR_LOCK:  0xAA1020,   // blood red locked
  DOOR_OPEN:  0xC8960C,   // gold open
};

export const ROOM_CONFIGS = [
  {
    name: 'ENTRY LOBBY',
    subtitle: 'SECTOR 01 · INITIAL CONTACT',
    section: 'intro',
    enemies: [
      { x: 480, y: 200, px1: 320, px2: 680, elite: false },
      { x: 820, y: 500, px1: 680, px2: 980, elite: false },
    ],
    obstacles: [
      { x: 420, y: 340, w: 90, h: 55 },
      { x: 720, y: 200, w: 55, h: 110 },
      { x: 920, y: 430, w: 110, h: 50 },
      { x: 200, y: 500, w: 60, h: 60 },
    ],
  },
  {
    name: 'INTEL ROOM',
    subtitle: 'SECTOR 02 · CLASSIFIED PROFILE',
    section: 'about',
    enemies: [
      { x: 320, y: 220, px1: 180, px2: 520, elite: false },
      { x: 720, y: 360, px1: 560, px2: 920, elite: false },
      { x: 480, y: 560, px1: 320, px2: 680, elite: false },
    ],
    obstacles: [
      { x: 350, y: 310, w: 100, h: 60 },
      { x: 620, y: 190, w: 60, h: 60 },
      { x: 830, y: 460, w: 80, h: 80 },
      { x: 160, y: 350, w: 50, h: 120 },
      { x: 960, y: 200, w: 60, h: 60 },
    ],
  },
  {
    name: 'ARSENAL ROOM',
    subtitle: 'SECTOR 03 · TECH INVENTORY',
    section: 'skills',
    enemies: [
      { x: 280, y: 300, px1: 160, px2: 450, elite: false },
      { x: 660, y: 200, px1: 500, px2: 820, elite: false },
      { x: 870, y: 520, px1: 720, px2: 1020, elite: false },
    ],
    obstacles: [
      { x: 300, y: 150, w: 120, h: 40 },
      { x: 300, y: 560, w: 120, h: 40 },
      { x: 700, y: 350, w: 40, h: 200 },
      { x: 960, y: 260, w: 60, h: 60 },
      { x: 500, y: 380, w: 80, h: 80 },
    ],
  },
  {
    name: 'CASE FILES',
    subtitle: 'SECTOR 04 · MISSION ARCHIVES',
    section: 'projects',
    enemies: [
      { x: 300, y: 200, px1: 150, px2: 500, elite: true },
      { x: 720, y: 200, px1: 560, px2: 900, elite: true },
      { x: 400, y: 520, px1: 220, px2: 620, elite: false },
      { x: 870, y: 500, px1: 720, px2: 1020, elite: false },
    ],
    obstacles: [
      { x: 260, y: 360, w: 80, h: 120 },
      { x: 560, y: 260, w: 60, h: 60 },
      { x: 760, y: 460, w: 80, h: 80 },
      { x: 1000, y: 320, w: 55, h: 200 },
      { x: 450, y: 150, w: 100, h: 40 },
    ],
  },
  {
    name: 'FIELD OPS',
    subtitle: 'SECTOR 05 · MISSION LOG',
    section: 'experience',
    enemies: [
      { x: 400, y: 260, px1: 200, px2: 620, elite: false },
      { x: 720, y: 460, px1: 560, px2: 960, elite: true },
      { x: 210, y: 520, px1: 140, px2: 420, elite: false },
    ],
    obstacles: [
      { x: 420, y: 360, w: 200, h: 40 },
      { x: 820, y: 200, w: 40, h: 150 },
      { x: 160, y: 300, w: 60, h: 60 },
      { x: 640, y: 560, w: 100, h: 40 },
      { x: 960, y: 450, w: 60, h: 100 },
    ],
  },
  {
    name: 'DEAD DROP',
    subtitle: 'SECTOR 06 · EXFILTRATION POINT',
    section: 'contact',
    enemies: [
      { x: 460, y: 300, px1: 280, px2: 720, elite: true },
      { x: 820, y: 420, px1: 660, px2: 1020, elite: true },
    ],
    obstacles: [
      { x: 310, y: 200, w: 80, h: 80 },
      { x: 620, y: 520, w: 80, h: 80 },
      { x: 920, y: 300, w: 40, h: 200 },
      { x: 200, y: 440, w: 60, h: 60 },
      { x: 700, y: 320, w: 60, h: 60 },
    ],
  },
];
