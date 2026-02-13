
export type Vector2 = { x: number; y: number };

export enum EntityType {
  PLAYER,
  BOT,
  COMPANION,
  PROJECTILE,
  PARTICLE,
  CRATE,
  PICKUP
}

export enum EnemyClass {
  MELEE,
  SHOOTER,
  HEAVY
}

export enum WeaponType {
  PISTOL,
  RIFLE,
  SHOTGUN,
  SNIPER,
  ROCKET,
  MELEE,
  LASER,
  SMG,
  MINIGUN,
  RAILGUN,
  PLASMA
}

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Particle = {
  id: string;
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type Projectile = {
  id: string;
  ownerId: string;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  damage: number;
  color: string;
  isExplosive: boolean;
  blastRadius: number;
  life?: number;
};

export type Weapon = {
  type: WeaponType;
  magAmmo: number;
  reserveAmmo: number;
  reloadTimer: number;
  fireTimer: number;
};

export type Character = {
  id: string;
  type: EntityType;
  enemyClass?: EnemyClass;
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  width: number;
  height: number;
  color: string;
  health: number;
  maxHealth: number;
  fuel: number;
  maxFuel: number;
  isGrounded: boolean;
  facingRight: boolean;
  aimAngle: number;
  
  // Weapon System
  inventory: Weapon[];
  currentWeaponIndex: number;
  
  // Animation
  animTimer: number;
  muzzleFlash?: number;

  // Companion Specifics
  canRevive?: boolean;
  pointDefenseCooldown?: number;
  
  isJetpacking: boolean;
  name: string;
  score: number;
};

export type Pickup = {
  id: string;
  type: EntityType.PICKUP;
  weaponType: WeaponType;
  pos: Vector2;
  vel: Vector2;
  isGrounded: boolean;
};

export type GameState = {
  player: Character;
  companion: Character;
  bots: Character[];
  projectiles: Projectile[];
  particles: Particle[];
  pickups: Pickup[];
  camera: Vector2;
  map: Rect[];
  score: number;
  gameOver: boolean;
  
  wave: number;
  waveStatus: 'INTERMISSION' | 'ACTIVE';
  waveTimer: number;
};

export const TILE_SIZE = 40;