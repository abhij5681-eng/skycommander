import { EnemyClass } from "./types";

export const GRAVITY = 0.65; // Slightly heavier gravity for better jump feel
export const FRICTION_GROUND = 0.70; // More grip on ground (less sliding)
export const FRICTION_AIR = 0.96;
export const MOVE_ACCELERATION = 2.0; // Higher acceleration to compensate for higher friction
export const JETPACK_FORCE = 0.95; 
export const JUMP_FORCE = 13;
export const MAX_SPEED_X = 9; // Slightly slower top speed for control
export const MAX_SPEED_Y = 18;

export const FUEL_MAX = 100;
export const FUEL_CONSUMPTION = 0.6;
export const FUEL_REGEN = 0.8;
export const FUEL_REGEN_DELAY = 30;

export const SCREEN_SHAKE_INTENSITY = 5;

// Wave Config
export const WAVE_INTERMISSION_TIME = 180; // 3 seconds
export const WAVE_ENEMY_BASE = 2; // Base enemies

// Colors
export const COLORS = {
  background: '#1a1f2c',
  backgroundFar: '#13161f',
  backgroundMid: '#242a3b',
  ground: '#1e293b', // Darker ground
  groundHighlight: '#334155',
  player: '#3b82f6',
  companion: '#34d399', // Emerald 400
  companionHighlight: '#10b981', // Emerald 500
  
  // Bot Colors
  botMelee: '#f87171', // Light Red
  botShooter: '#c084fc', // Purple
  botHeavy: '#475569', // Dark Slate

  jetpackFlame: '#f97316',
  hudText: '#f1f5f9',
};

// Enemy Stats
export const ENEMY_STATS = {
  [EnemyClass.MELEE]: { hp: 50, speedMod: 1.2, width: 25, height: 45, color: COLORS.botMelee, jetpackChance: 0.05 },
  [EnemyClass.SHOOTER]: { hp: 80, speedMod: 0.9, width: 30, height: 50, color: COLORS.botShooter, jetpackChance: 0.02 },
  [EnemyClass.HEAVY]: { hp: 250, speedMod: 0.6, width: 45, height: 60, color: COLORS.botHeavy, jetpackChance: 0.01 },
};

// Companion Stats
export const COMPANION_STATS = {
    followDistanceX: 40,
    followDistanceY: 50,
    pointDefenseRange: 80,
    pointDefenseCooldown: 90, // 1.5 seconds
    attackRange: 500,
};

// Weapon Definitions
export type WeaponStatsDef = {
  name: string;
  damage: number;
  fireRate: number; // Frames between shots (lower is faster)
  speed: number;    // Projectile speed
  spread: number;   // In radians
  magSize: number;
  reloadTime: number; // Frames
  pellets: number; // Count of projectiles per shot
  color: string;
  isExplosive: boolean;
  blastRadius: number;
  automatic: boolean;
  infiniteReserve: boolean;
  startReserve: number;
  range?: number; // Max distance for melee
};

export const WEAPONS: Record<number, WeaponStatsDef> = {
  0: { // PISTOL
    name: "M9 PISTOL",
    damage: 15,
    fireRate: 15,
    speed: 18,
    spread: 0.05,
    magSize: 12,
    reloadTime: 60,
    pellets: 1,
    color: '#fbbf24', // Amber
    isExplosive: false,
    blastRadius: 0,
    automatic: false,
    infiniteReserve: true,
    startReserve: 999
  },
  1: { // RIFLE
    name: "ASSAULT RIFLE",
    damage: 12,
    fireRate: 6,
    speed: 22,
    spread: 0.1,
    magSize: 30,
    reloadTime: 90,
    pellets: 1,
    color: '#60a5fa', // Blue
    isExplosive: false,
    blastRadius: 0,
    automatic: true,
    infiniteReserve: false,
    startReserve: 120
  },
  2: { // SHOTGUN
    name: "SHOTGUN",
    damage: 8,
    fireRate: 50,
    speed: 16,
    spread: 0.3,
    magSize: 6,
    reloadTime: 120,
    pellets: 5,
    color: '#94a3b8', // Slate
    isExplosive: false,
    blastRadius: 0,
    automatic: false,
    infiniteReserve: false,
    startReserve: 24
  },
  3: { // SNIPER
    name: "SNIPER RIFLE",
    damage: 85,
    fireRate: 70,
    speed: 35,
    spread: 0.0,
    magSize: 5,
    reloadTime: 150,
    pellets: 1,
    color: '#a3e635', // Lime
    isExplosive: false,
    blastRadius: 0,
    automatic: false,
    infiniteReserve: false,
    startReserve: 10
  },
  4: { // ROCKET
    name: "ROCKET LAUNCHER",
    damage: 100, // Direct hit
    fireRate: 90,
    speed: 12,
    spread: 0.05,
    magSize: 2,
    reloadTime: 180,
    pellets: 1,
    color: '#f87171', // Red
    isExplosive: true,
    blastRadius: 120,
    automatic: false,
    infiniteReserve: false,
    startReserve: 6
  },
  5: { // MELEE (Robot Blade)
    name: "ENERGY BLADE",
    damage: 25,
    fireRate: 30,
    speed: 10, // Short travel
    spread: 0.2,
    magSize: 999,
    reloadTime: 0,
    pellets: 1,
    color: '#ef4444',
    isExplosive: false,
    blastRadius: 0,
    automatic: true,
    infiniteReserve: true,
    startReserve: 999,
    range: 60
  },
  6: { // LASER (Companion)
    name: "DRONE LASER",
    damage: 10,
    fireRate: 12,
    speed: 25,
    spread: 0.02,
    magSize: 999,
    reloadTime: 0,
    pellets: 1,
    color: '#34d399',
    isExplosive: false,
    blastRadius: 0,
    automatic: true,
    infiniteReserve: true,
    startReserve: 999
  },
  7: { // SMG
    name: "VECTOR SMG",
    damage: 9,
    fireRate: 4,
    speed: 20,
    spread: 0.15,
    magSize: 40,
    reloadTime: 70,
    pellets: 1,
    color: '#22d3ee', // Cyan
    isExplosive: false,
    blastRadius: 0,
    automatic: true,
    infiniteReserve: false,
    startReserve: 160
  },
  8: { // MINIGUN
    name: "CHAINGUN",
    damage: 7,
    fireRate: 2,
    speed: 22,
    spread: 0.2,
    magSize: 100,
    reloadTime: 200,
    pellets: 1,
    color: '#fb923c', // Orange
    isExplosive: false,
    blastRadius: 0,
    automatic: true,
    infiniteReserve: false,
    startReserve: 400
  },
  9: { // RAILGUN
    name: "RAILGUN",
    damage: 150,
    fireRate: 120,
    speed: 50,
    spread: 0.0,
    magSize: 3,
    reloadTime: 150,
    pellets: 1,
    color: '#8b5cf6', // Violet
    isExplosive: false,
    blastRadius: 0,
    automatic: false,
    infiniteReserve: false,
    startReserve: 6
  },
  10: { // PLASMA
    name: "PLASMA RIFLE",
    damage: 22,
    fireRate: 10,
    speed: 15,
    spread: 0.05,
    magSize: 25,
    reloadTime: 90,
    pellets: 1,
    color: '#e879f9', // Fuchsia
    isExplosive: true,
    blastRadius: 60,
    automatic: true,
    infiniteReserve: false,
    startReserve: 100
  }
};