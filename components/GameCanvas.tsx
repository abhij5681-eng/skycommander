
import React, { useRef, useEffect, useState } from 'react';
import { GameState, EntityType, Character, Rect, Particle, Projectile, WeaponType, Weapon, Pickup, Vector2, EnemyClass } from '../types';
import * as Constants from '../constants';

interface GameCanvasProps {
  onExit: () => void;
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onExit, isMobile, setIsMobile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Input State
  const keysPressed = useRef<Set<string>>(new Set());
  const mousePos = useRef<Vector2>({ x: 0, y: 0 });
  const mouseDown = useRef<boolean>(false);
  const mouseClicked = useRef<boolean>(false); 

  // Mobile Input State
  const leftJoystickRef = useRef<{active: boolean, origin: Vector2, current: Vector2, id: number | null}>({ 
    active: false, origin: { x: 0, y: 0 }, current: { x: 0, y: 0 }, id: null 
  });
  const rightJoystickRef = useRef<{active: boolean, origin: Vector2, current: Vector2, id: number | null}>({ 
    active: false, origin: { x: 0, y: 0 }, current: { x: 0, y: 0 }, id: null 
  });
  
  // Mobile Button Refs (Retained for logic consistency)
  const isFireBtnPressed = useRef(false);
  const isJumpBtnPressed = useRef(false);

  // Game State Ref
  const state = useRef<GameState>(createNewGameState());

  // UI State
  const [hudFuel, setHudFuel] = useState(100);
  const [hudHealth, setHudHealth] = useState(100);
  const [hudWeapon, setHudWeapon] = useState<Weapon | null>(null);
  const [hudWave, setHudWave] = useState(1);
  const [hudWaveTimer, setHudWaveTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [canRevive, setCanRevive] = useState(true);

  function createNewGameState(): GameState {
    return {
      player: createCharacter('hero', EntityType.PLAYER, 0, 700),
      companion: createCharacter('drone', EntityType.COMPANION, -50, 650),
      bots: [],
      projectiles: [],
      particles: [],
      pickups: [
        createPickup(WeaponType.RIFLE, 600, 750),
        createPickup(WeaponType.SHOTGUN, 1000, 650),
        createPickup(WeaponType.SMG, 400, 600),
        createPickup(WeaponType.MINIGUN, 1400, 300),
        createPickup(WeaponType.RAILGUN, -200, 600),
        createPickup(WeaponType.PLASMA, 800, 400),
        createPickup(WeaponType.ROCKET, 200, 480)
      ],
      map: generateMap(),
      camera: { x: 0, y: 0 },
      score: 0,
      gameOver: false,
      wave: 1,
      waveStatus: 'INTERMISSION',
      waveTimer: Constants.WAVE_INTERMISSION_TIME
    };
  }

  const handleRedeploy = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    state.current = createNewGameState();
    keysPressed.current.clear();
    mouseDown.current = false;
    mouseClicked.current = false;
    isFireBtnPressed.current = false;
    isJumpBtnPressed.current = false;
    setGameOver(false);
    setHudWave(1);
    setHudHealth(100);
    setHudFuel(100);
    setHudWeapon(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleKeyDown = (e: KeyboardEvent) => {
        keysPressed.current.add(e.code);
        // Weapon Switching via Number Keys
        if (state.current && !state.current.gameOver && e.code.startsWith('Digit')) {
            const digit = parseInt(e.code.replace('Digit', ''));
            if (!isNaN(digit) && digit > 0) {
                const idx = digit - 1;
                if (idx < state.current.player.inventory.length) {
                    state.current.player.currentWeaponIndex = idx;
                }
            }
        }
    };

    const handleWheel = (e: WheelEvent) => {
        if (state.current && !state.current.gameOver) {
            const player = state.current.player;
            const len = player.inventory.length;
            if (len > 1) {
                if (e.deltaY > 0) {
                    player.currentWeaponIndex = (player.currentWeaponIndex + 1) % len;
                } else {
                    player.currentWeaponIndex = (player.currentWeaponIndex - 1 + len) % len;
                }
            }
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.code);
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile) mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseDownGlobal = () => {
      if (!isMobile) { mouseDown.current = true; mouseClicked.current = true; }
    };
    const handleMouseUpGlobal = () => { if (!isMobile) mouseDown.current = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDownGlobal);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    window.addEventListener('wheel', handleWheel);

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.67, 2); 
      lastTime = time;

      if (!state.current.gameOver) {
        if (isMobile) {
             processMobileInputs(
                 keysPressed, mousePos, mouseDown, 
                 isFireBtnPressed, isJumpBtnPressed,
                 leftJoystickRef.current, rightJoystickRef.current, 
                 state.current.player, state.current.camera, canvas
             );
        }
        updateGame(state.current, dt, keysPressed.current, mousePos.current, mouseDown.current, mouseClicked.current, canvas);
        mouseClicked.current = false;

        if (Math.abs(state.current.player.fuel - hudFuel) > 0.5) setHudFuel(state.current.player.fuel);
        if (Math.abs(state.current.player.health - hudHealth) > 0.5) setHudHealth(state.current.player.health);
        if (state.current.wave !== hudWave) setHudWave(state.current.wave);
        if (state.current.companion.canRevive !== canRevive) setCanRevive(!!state.current.companion.canRevive);
        
        if (state.current.waveStatus === 'INTERMISSION') setHudWaveTimer(Math.ceil(state.current.waveTimer / 60));
        else setHudWaveTimer(0);

        const currentWep = state.current.player.inventory[state.current.player.currentWeaponIndex];
        if (currentWep) setHudWeapon({...currentWep});
      } else {
        if (!gameOver) setGameOver(true);
      }

      render(canvas, state.current);
      if (isMobile) drawJoysticks(canvas, leftJoystickRef.current, rightJoystickRef.current);
      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDownGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isMobile]);

  return (
    <div className="relative w-full h-full bg-black cursor-crosshair overflow-hidden" 
         onTouchStart={(e) => { if (!isMobile) return; handleTouchStart(e); }} 
         onTouchMove={(e) => { if (!isMobile) return; handleTouchMove(e); }} 
         onTouchEnd={(e) => { if (!isMobile) return; handleTouchEnd(e); }} 
         onTouchCancel={(e) => { if (!isMobile) return; handleTouchEnd(e); }}>
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />
      
      {/* HUD Left */}
      <div className="absolute top-4 left-4 flex flex-col gap-3 pointer-events-none select-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center relative shadow-lg">
               <span className="text-xs font-bold text-white">HP</span>
               {canRevive && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white animate-pulse"></div>}
             </div>
             <div className="w-48 h-4 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700 shadow-inner">
               <div className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300" style={{ width: `${hudHealth}%` }} />
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-lg">
               <span className="text-xs font-bold text-white">JET</span>
             </div>
             <div className="w-48 h-4 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700 shadow-inner">
               <div className="h-full bg-gradient-to-r from-orange-600 to-amber-400 transition-all duration-75" style={{ width: `${hudFuel}%` }} />
             </div>
          </div>
        </div>

        {hudWeapon && (
            <div className="mt-2 bg-slate-900/80 p-3 rounded-lg border border-slate-700 backdrop-blur-md text-white w-fit animate-fade-in shadow-2xl">
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{Constants.WEAPONS[hudWeapon.type].name}</div>
                <div className="text-2xl font-black font-mono leading-none">{hudWeapon.magAmmo} <span className="text-slate-500 text-sm">/ {Constants.WEAPONS[hudWeapon.type].infiniteReserve ? '∞' : hudWeapon.reserveAmmo}</span></div>
            </div>
        )}
      </div>

      <div className="absolute top-4 left-[280px] flex gap-2">
         <button onClick={() => setIsMobile(!isMobile)} className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-lg pointer-events-auto active:scale-95 transition-all">
           INPUT: {isMobile ? 'MOBILE' : 'PC'}
         </button>
      </div>

      <div className="absolute top-4 right-4 text-right pointer-events-none select-none">
          <div className="text-white font-black text-4xl drop-shadow-2xl">WAVE <span className="text-blue-500">{hudWave}</span></div>
          <div className="text-slate-400 font-bold text-xl drop-shadow-xl">SCORE: <span className="text-yellow-400">{state.current.score}</span></div>
          {hudWaveTimer > 0 && <div className="text-red-500 text-sm font-black mt-1 animate-pulse tracking-widest">NEXT WAVE: {hudWaveTimer}s</div>}
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 pointer-events-auto backdrop-blur-md animate-fade-in">
          <h2 className="text-9xl font-black text-red-600 mb-2 tracking-tighter drop-shadow-[0_0_30px_rgba(220,38,38,0.7)]">K.I.A.</h2>
          <p className="text-2xl text-slate-300 mb-8 font-mono tracking-[0.6em] uppercase border-y border-slate-700/50 py-4">Mission Failed</p>
          <div className="text-4xl text-yellow-400 mb-10 font-black bg-slate-900/50 px-12 py-6 rounded-2xl border border-slate-700 shadow-2xl">FINAL SCORE: {state.current.score}</div>
          <div className="flex gap-6">
             <button onClick={handleRedeploy} onTouchStart={handleRedeploy} 
                     className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xl rounded-2xl shadow-xl active:scale-95 transition-all transform hover:scale-105 border border-blue-400/30">REDEPLOY</button>
             <button onClick={() => onExit()} onTouchStart={() => onExit()} 
                     className="px-12 py-5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xl rounded-2xl active:scale-95 transition-all transform hover:scale-105 border border-slate-600">DEPLOY MENU</button>
          </div>
        </div>
      )}
    </div>
  );

  // --- Mobile Touch Event Handlers ---
  function handleTouchStart(e: React.TouchEvent) {
      for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const x = t.clientX, y = t.clientY;
          // Left Zone (Bottom Left Quad)
          if (x < window.innerWidth / 2 && y > window.innerHeight / 2) {
              if (!leftJoystickRef.current.active) {
                  leftJoystickRef.current.active = true;
                  leftJoystickRef.current.origin = { x, y };
                  leftJoystickRef.current.current = { x, y };
                  leftJoystickRef.current.id = t.identifier;
              }
          } 
          // Right Zone (Bottom Right Quad)
          else if (x > window.innerWidth / 2 && y > window.innerHeight / 2) {
             if (!rightJoystickRef.current.active) {
                  rightJoystickRef.current.active = true;
                  rightJoystickRef.current.origin = { x, y };
                  rightJoystickRef.current.current = { x, y };
                  rightJoystickRef.current.id = t.identifier;
             }
          }
      }
  }

  function handleTouchMove(e: React.TouchEvent) {
      for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === leftJoystickRef.current.id) leftJoystickRef.current.current = { x: t.clientX, y: t.clientY };
          if (t.identifier === rightJoystickRef.current.id) rightJoystickRef.current.current = { x: t.clientX, y: t.clientY };
      }
  }

  function handleTouchEnd(e: React.TouchEvent) {
      for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === leftJoystickRef.current.id) { leftJoystickRef.current.active = false; leftJoystickRef.current.id = null; }
          if (t.identifier === rightJoystickRef.current.id) { rightJoystickRef.current.active = false; rightJoystickRef.current.id = null; }
      }
  }
};

// --- Helpers ---

function processMobileInputs(
    keys: React.MutableRefObject<Set<string>>, 
    mouse: React.MutableRefObject<Vector2>, 
    mouseDown: React.MutableRefObject<boolean>,
    fireBtn: React.MutableRefObject<boolean>,
    jumpBtn: React.MutableRefObject<boolean>,
    left: any, right: any, player: any, cam: any, canvas: any
) {
    // Thresholds
    const MOVE_T = 20; 
    const JUMP_T = 40; 
    const FIRE_T = 30; 

    keys.current.delete('KeyA');
    keys.current.delete('KeyD');
    keys.current.delete('KeyW');

    if (left.active) {
        const dx = left.current.x - left.origin.x;
        const dy = left.current.y - left.origin.y;
        if (dx < -MOVE_T) keys.current.add('KeyA');
        else if (dx > MOVE_T) keys.current.add('KeyD');
        if (dy < -JUMP_T) keys.current.add('KeyW');
    }

    if (jumpBtn.current) keys.current.add('KeyW');

    let joystickFire = false;
    if (right.active) {
        const dx = right.current.x - right.origin.x;
        const dy = right.current.y - right.origin.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 10) {
            const angle = Math.atan2(dy, dx);
            const px = player.pos.x - cam.x;
            const py = player.pos.y - cam.y;
            mouse.current.x = px + Math.cos(angle) * 150;
            mouse.current.y = py + Math.sin(angle) * 150;
        }

        if (dist > FIRE_T) {
            joystickFire = true;
        }
    }
    
    mouseDown.current = fireBtn.current || joystickFire;
}

function drawJoysticks(canvas: HTMLCanvasElement, left: any, right: any) {
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const drawStick = (j: any, color: string) => {
        if (!j.active) return;
        ctx.beginPath(); ctx.arc(j.origin.x, j.origin.y, 50, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill(); 
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();
        ctx.beginPath(); ctx.arc(j.origin.x, j.origin.y, 25, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.stroke();
        ctx.beginPath(); ctx.arc(j.current.x, j.current.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.shadowBlur = 10; ctx.shadowColor = color; ctx.stroke(); ctx.shadowBlur = 0;
    };
    drawStick(left, 'rgba(59, 130, 246, 0.4)');
    drawStick(right, 'rgba(239, 68, 68, 0.4)');
}

function createWeapon(type: WeaponType): Weapon {
  const def = Constants.WEAPONS[type];
  return { type, magAmmo: def.magSize, reserveAmmo: def.startReserve, reloadTimer: 0, fireTimer: 0 };
}

function createCharacter(id: string, type: EntityType, x: number, y: number, enemyClass?: EnemyClass): Character {
  const isPlayer = type === EntityType.PLAYER;
  let stats = { width: 30, height: 50, hp: 100, maxHp: 100, color: Constants.COLORS.player };
  let startWeapons = [createWeapon(WeaponType.PISTOL)];
  
  if (type === EntityType.COMPANION) {
      stats = { width: 24, height: 24, hp: 9999, maxHp: 9999, color: Constants.COLORS.companion };
      startWeapons = [createWeapon(WeaponType.LASER)];
  } else if (!isPlayer && enemyClass !== undefined) {
      const cs = Constants.ENEMY_STATS[enemyClass];
      stats = { width: cs.width, height: cs.height, hp: cs.hp, maxHp: cs.hp, color: cs.color };
      startWeapons = enemyClass === EnemyClass.MELEE ? [createWeapon(WeaponType.MELEE)] : [createWeapon(Math.random() > 0.6 ? WeaponType.RIFLE : WeaponType.PISTOL)];
  }

  return { 
    id, type, enemyClass, pos: { x, y }, vel: { x: 0, y: 0 }, acc: { x: 0, y: 0 }, 
    width: stats.width, height: stats.height, color: stats.color, health: stats.hp, 
    maxHealth: stats.maxHp, fuel: 100, maxFuel: 100, isGrounded: false, 
    facingRight: true, aimAngle: 0, inventory: startWeapons, currentWeaponIndex: 0, 
    animTimer: 0, muzzleFlash: 0,
    canRevive: type === EntityType.COMPANION, pointDefenseCooldown: 0,
    isJetpacking: false, name: id, score: 0 
  };
}

function createPickup(weaponType: WeaponType, x: number, y: number): Pickup {
    return { id: Math.random().toString(), type: EntityType.PICKUP, weaponType, pos: { x, y }, vel: { x: 0, y: 0 }, isGrounded: false };
}

function generateMap(): Rect[] {
  return [
    { x: -5000, y: 800, w: 15000, h: 2000 },
    { x: -400, y: 650, w: 300, h: 40 },
    { x: 500, y: 720, w: 400, h: 80 },
    { x: 1200, y: 600, w: 600, h: 200 },
    { x: 300, y: 500, w: 200, h: 30 },
    { x: 800, y: 450, w: 300, h: 30 },
    { x: 1400, y: 350, w: 400, h: 30 }
  ];
}

function updateGame(state: GameState, dt: number, keys: Set<string>, mouse: Vector2, mouseDown: boolean, mouseClicked: boolean, canvas: HTMLCanvasElement) {
  const { player, map, projectiles, bots, particles, pickups } = state;
  
  if (state.waveStatus === 'INTERMISSION') {
      state.waveTimer -= dt;
      if (state.waveTimer <= 0) { state.waveStatus = 'ACTIVE'; startWave(state); }
  } else if (state.waveStatus === 'ACTIVE' && bots.length === 0) {
      state.wave++; state.waveStatus = 'INTERMISSION'; state.waveTimer = Constants.WAVE_INTERMISSION_TIME;
      player.health = Math.min(player.maxHealth, player.health + 25);
  }

  const isL = keys.has('KeyA') || keys.has('ArrowLeft');
  const isR = keys.has('KeyD') || keys.has('ArrowRight');
  const isU = keys.has('KeyW') || keys.has('ArrowUp');
  
  player.acc.x = isL ? -Constants.MOVE_ACCELERATION : (isR ? Constants.MOVE_ACCELERATION : 0);
  player.isJetpacking = isU && player.fuel > 0;
  
  if (player.isJetpacking) { player.vel.y -= Constants.JETPACK_FORCE * dt; player.fuel -= Constants.FUEL_CONSUMPTION * dt; } 
  else { player.fuel = Math.min(player.maxFuel, player.fuel + Constants.FUEL_REGEN * dt); }

  if (player.health < player.maxHealth) {
      player.health = Math.min(player.maxHealth, player.health + 0.1 * dt);
  }

  const wmX = mouse.x + state.camera.x, wmY = mouse.y + state.camera.y;
  player.aimAngle = Math.atan2(wmY - (player.pos.y - 12), wmX - player.pos.x);
  player.facingRight = Math.abs(player.aimAngle) < Math.PI / 2;
  player.animTimer += (Math.abs(player.vel.x) > 0.5 ? Math.abs(player.vel.x) * 0.15 : 0.05) * dt;

  handleWeapon(state, player, mouseDown, mouseClicked, keys.has('KeyR'), dt);
  updateCharacter(player, dt, map);
  updateCompanion(state, dt);

  if (player.pos.y > 2000) {
      if (state.companion.canRevive) {
           player.health = player.maxHealth * 0.5;
           player.vel = { x: 0, y: 0 };
           player.pos = { x: state.camera.x + canvas.width/2, y: 500 }; 
           state.companion.canRevive = false;
           spawnExplosion(state, player.pos, 30);
      } else {
           player.health = 0;
           state.gameOver = true;
      }
  }
  
  for (let i = bots.length - 1; i >= 0; i--) {
      const bot = bots[i];
      const dx = player.pos.x - bot.pos.x;
      bot.acc.x = dx > 0 ? 0.6 : -0.6;
      bot.animTimer += 0.15 * dt;
      bot.aimAngle = Math.atan2(player.pos.y - bot.pos.y, player.pos.x - bot.pos.x);
      bot.facingRight = Math.abs(bot.aimAngle) < Math.PI / 2;
      updateCharacter(bot, dt, map);
      if (bot.pos.y > 2000) bot.health = 0;
      handleWeapon(state, bot, Math.abs(dx) < 600, true, bot.inventory[0].magAmmo === 0, dt);
      if (bot.health <= 0) { state.score += 150; bots.splice(i, 1); spawnExplosion(state, bot.pos, 5); }
  }

  updateProjectiles(state, dt);
  
  for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt; p.life -= 0.02 * dt;
      if (p.life <= 0) particles.splice(i, 1);
  }
  
  for (let i = state.pickups.length - 1; i >= 0; i--) {
        const p = state.pickups[i];
        if (checkPointRect(p.pos, player)) {
            const existing = player.inventory.find(w => w.type === p.weaponType);
            if (existing) {
                existing.reserveAmmo += Constants.WEAPONS[p.weaponType].magSize * 2;
                state.particles.push({ id: Math.random().toString(), pos: { ...p.pos }, vel: { x: 0, y: -1 }, life: 0.5, maxLife: 0.5, color: '#fff', size: 5 });
            } else {
                // ADD WEAPON BUT DO NOT SWITCH AUTOMATICALLY
                player.inventory.push(createWeapon(p.weaponType));
                state.particles.push({ id: Math.random().toString(), pos: { ...p.pos }, vel: { x: 0, y: -1 }, life: 0.5, maxLife: 0.5, color: '#fff', size: 10 });
            }
            state.pickups.splice(i, 1);
        }
    }

  state.camera.x += (player.pos.x - canvas.width/2 - state.camera.x) * 0.15 * dt;
  state.camera.y += (player.pos.y - canvas.height/2 - state.camera.y) * 0.15 * dt;
}

function updateCompanion(state: GameState, dt: number) {
    const { companion, player, bots } = state;
    const targetX = player.pos.x + (player.facingRight ? -40 : 40);
    const targetY = player.pos.y - 65 + Math.sin(player.animTimer * 0.5) * 10;
    companion.pos.x += (targetX - companion.pos.x) * 0.08 * dt;
    companion.pos.y += (targetY - companion.pos.y) * 0.08 * dt;
    companion.animTimer += 0.1 * dt;
    if (companion.pointDefenseCooldown && companion.pointDefenseCooldown > 0) companion.pointDefenseCooldown -= dt;
    let closestBot: Character | null = null;
    let minDist = Constants.COMPANION_STATS.attackRange;
    for (const bot of bots) {
        const d = Math.hypot(bot.pos.x - companion.pos.x, bot.pos.y - companion.pos.y);
        if (d < minDist) { minDist = d; closestBot = bot; }
    }
    if (closestBot) {
        companion.aimAngle = Math.atan2(closestBot.pos.y - companion.pos.y, closestBot.pos.x - companion.pos.x);
        handleWeapon(state, companion, true, true, false, dt);
        companion.facingRight = Math.abs(companion.aimAngle) < Math.PI / 2;
    } else {
        companion.aimAngle = player.aimAngle;
        companion.facingRight = player.facingRight;
    }
}

function spawnExplosion(state: GameState, pos: Vector2, count: number) {
    for (let i = 0; i < count; i++) {
        state.particles.push({ id: Math.random().toString(), pos: { ...pos }, vel: { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 }, life: 1, maxLife: 1, color: '#ff4400', size: 3 + Math.random() * 5 });
    }
}

function startWave(state: GameState) {
    const count = Math.min(12, 2 + state.wave);
    for (let i = 0; i < count; i++) {
        const side = Math.random() > 0.5 ? -1500 : 2500;
        state.bots.push(createCharacter(`bot_${Date.now()}_${i}`, EntityType.BOT, side + Math.random() * 500, 0, EnemyClass.SHOOTER));
    }
}

function updateProjectiles(state: GameState, dt: number) {
    const { projectiles, map, bots, player, companion } = state;
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.ownerId !== player.id && p.ownerId !== companion.id) {
            const distToPlayer = Math.hypot(p.pos.x - player.pos.x, p.pos.y - player.pos.y);
            if (distToPlayer < Constants.COMPANION_STATS.pointDefenseRange) {
                if ((companion.pointDefenseCooldown || 0) <= 0) {
                     companion.pointDefenseCooldown = Constants.COMPANION_STATS.pointDefenseCooldown;
                     state.particles.push({ id: Math.random().toString(), pos: {x: p.pos.x, y: p.pos.y}, vel: {x:0, y:0}, life: 0.5, maxLife: 0.5, color: Constants.COLORS.companion, size: 20 });
                     projectiles.splice(i, 1); continue;
                }
            }
        }
        p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt;
        let hit = false;
        for (const w of map) if (rectCircleIntersect(w, p)) { hit = true; break; }
        if (!hit) {
            if (p.ownerId === player.id || p.ownerId === companion.id) {
                for (const b of bots) if (checkPointRect(p.pos, b)) { b.health -= p.damage; hit = true; break; }
            } else if (checkPointRect(p.pos, player)) { 
                player.health -= p.damage; hit = true; 
                if (player.health <= 0) {
                     if (companion.canRevive) { player.health = player.maxHealth * 0.5; companion.canRevive = false; spawnExplosion(state, player.pos, 25); }
                     else state.gameOver = true;
                }
            }
        }
        if (hit) {
             if (p.isExplosive) {
                 spawnExplosion(state, p.pos, 10);
                 const power = p.ownerId === player.id || p.ownerId === companion.id ? 0.8 : 0.5;
                 for (const b of bots) if (Math.hypot(b.pos.x - p.pos.x, b.pos.y - p.pos.y) < p.blastRadius) b.health -= p.damage * power;
             }
             projectiles.splice(i, 1);
        } else if (Math.abs(p.pos.x - player.pos.x) > 3000) projectiles.splice(i, 1);
    }
}

function handleWeapon(state: GameState, char: Character, isD: boolean, isC: boolean, isR: boolean, dt: number) {
    const w = char.inventory[char.currentWeaponIndex];
    if (!w) return;
    if (w.magAmmo <= 0) w.magAmmo = 10;
    const def = Constants.WEAPONS[w.type];
    if (char.muzzleFlash && char.muzzleFlash > 0) char.muzzleFlash -= dt;
    if (w.fireTimer > 0) w.fireTimer -= dt;
    if (isR && w.magAmmo < def.magSize) { w.magAmmo = def.magSize; return; }
    if (isD && w.fireTimer <= 0 && w.magAmmo > 0) {
        w.magAmmo--; w.fireTimer = def.fireRate; char.muzzleFlash = 3;
        const angle = char.aimAngle + (Math.random() - 0.5) * def.spread;
        state.projectiles.push({ id: Math.random().toString(), ownerId: char.id, pos: { x: char.pos.x + Math.cos(char.aimAngle) * 30, y: char.pos.y - 12 + Math.sin(char.aimAngle) * 30 }, vel: { x: Math.cos(angle) * def.speed, y: Math.sin(angle) * def.speed }, radius: 4, damage: def.damage, color: def.color, isExplosive: def.isExplosive, blastRadius: def.blastRadius });
    }
}

function updateCharacter(char: Character, dt: number, map: Rect[]) {
    char.vel.x += char.acc.x * dt; char.vel.y += Constants.GRAVITY * dt;
    char.vel.x *= Math.pow(char.isGrounded ? Constants.FRICTION_GROUND : Constants.FRICTION_AIR, dt);
    char.pos.x += char.vel.x * dt; checkCollision(char, map, true);
    char.isGrounded = false;
    char.pos.y += char.vel.y * dt; checkCollision(char, map, false);
}

function checkCollision(char: Character, map: Rect[], isX: boolean) {
    const r = { x: char.pos.x - char.width/2, y: char.pos.y - char.height/2, w: char.width, h: char.height };
    for (const w of map) {
        if (rectIntersect(r, w)) {
            if (isX) { char.pos.x = char.vel.x > 0 ? w.x - char.width/2 : w.x + w.w + char.width/2; char.vel.x = 0; }
            else { 
                if (char.vel.y > 0) { char.pos.y = w.y - char.height/2; char.isGrounded = true; } 
                else { char.pos.y = w.y + w.h + char.height/2; } 
                char.vel.y = 0; 
            }
        }
    }
}

function render(canvas: HTMLCanvasElement, state: GameState) {
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = Constants.COLORS.background; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for(let i=0; i<50; i++) {
        const x = (i * 317 - state.camera.x * 0.2) % canvas.width;
        const y = (i * 221 - state.camera.y * 0.2) % canvas.height;
        ctx.fillRect(x < 0 ? x + canvas.width : x, y < 0 ? y + canvas.height : y, 2, 2);
    }
    ctx.save(); ctx.translate(-state.camera.x, -state.camera.y);
    ctx.fillStyle = Constants.COLORS.ground;
    for (const w of state.map) {
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = Constants.COLORS.groundHighlight; ctx.fillRect(w.x, w.y, w.w, 4); ctx.fillStyle = Constants.COLORS.ground;
    }
    for (const p of state.pickups) {
        const def = Constants.WEAPONS[p.weaponType];
        ctx.fillStyle = def ? def.color : '#fef08a'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y + Math.sin(state.player.animTimer) * 5, 8, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = 'white'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(def ? def.name : 'WEAPON', p.pos.x, p.pos.y - 15);
    }
    state.bots.forEach(b => drawCharacter(ctx, b));
    drawCharacter(ctx, state.player);
    drawCharacter(ctx, state.companion);
    for (const p of state.projectiles) { ctx.fillStyle = p.color; ctx.shadowBlur = 10; ctx.shadowColor = p.color; ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.restore();
}

function drawCharacter(ctx: CanvasRenderingContext2D, char: Character) {
    ctx.save(); ctx.translate(char.pos.x, char.pos.y);
    const lean = char.vel.x * 0.03; ctx.rotate(lean);
    const isHero = char.type === EntityType.PLAYER;
    const isBot = char.type === EntityType.BOT;
    const isDrone = char.type === EntityType.COMPANION;
    if (isDrone) {
        ctx.fillStyle = char.color; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(char.facingRight ? 4 : -4, -2, 3, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.rotate(char.animTimer); ctx.strokeRect(-12, -12, 24, 24);
        if (char.pointDefenseCooldown && char.pointDefenseCooldown <= 0) { ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)'; ctx.beginPath(); ctx.arc(0, 0, Constants.COMPANION_STATS.pointDefenseRange, 0, Math.PI*2); ctx.stroke(); }
        if (char.canRevive) { ctx.fillStyle = '#4ade80'; ctx.shadowBlur = 5; ctx.shadowColor = '#4ade80'; ctx.beginPath(); ctx.arc(0, -15, 2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
    } else {
        const legSwing = Math.sin(char.animTimer) * 10;
        ctx.fillStyle = char.color;
        if (!char.isGrounded) { ctx.fillRect(-8, 5, 6, 15); ctx.fillRect(2, 5, 6, 12); }
        else if (Math.abs(char.vel.x) > 0.5) { ctx.fillRect(-8 + legSwing/2, 5, 6, 15); ctx.fillRect(2 - legSwing/2, 5, 6, 15); }
        else { ctx.fillRect(-8, 5, 6, 15); ctx.fillRect(2, 5, 6, 15); }
        ctx.fillStyle = char.color; ctx.fillRect(-12, -25, 24, 30);
        ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(-12, -10, 24, 5);
        if (isHero) {
            ctx.fillStyle = '#475569'; ctx.fillRect(char.facingRight ? -18 : 6, -20, 12, 20);
            if (char.isJetpacking) { ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(char.facingRight ? -16 : 8, 0); ctx.lineTo(char.facingRight ? -12 : 12, 15 + Math.random()*10); ctx.lineTo(char.facingRight ? -8 : 16, 0); ctx.fill(); }
        }
        ctx.fillStyle = char.color; ctx.beginPath(); ctx.arc(0, -32, 12, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = isBot ? '#f87171' : '#60a5fa'; const visorX = char.facingRight ? 2 : -10; ctx.fillRect(visorX, -36, 8, 6);
    }
    if (!isDrone) {
        ctx.restore(); ctx.save(); ctx.translate(char.pos.x, char.pos.y - 12); ctx.rotate(char.aimAngle);
        const w = char.inventory[char.currentWeaponIndex];
        const wColor = w ? Constants.WEAPONS[w.type].color : '#94a3b8';
        ctx.fillStyle = '#1e293b'; ctx.fillRect(0, -3, 30, 6);
        ctx.fillStyle = wColor; ctx.fillRect(0, -2, 15, 8);
        if (char.muzzleFlash && char.muzzleFlash > 0) { ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(35, 0, 8, 0, Math.PI*2); ctx.fill(); }
    }
    ctx.restore();
}

function rectIntersect(r1: Rect, r2: Rect) { return !(r2.x >= r1.x + r1.w || r2.x + r2.w <= r1.x || r2.y >= r1.y + r1.h || r2.y + r2.h <= r1.y); }
function rectCircleIntersect(rect: Rect, circle: any) {
    const dx = Math.abs(circle.pos.x - (rect.x + rect.w / 2));
    const dy = Math.abs(circle.pos.y - (rect.y + rect.h / 2));
    if (dx > (rect.w / 2 + circle.radius) || dy > (rect.h / 2 + circle.radius)) return false;
    if (dx <= rect.w / 2 || dy <= rect.h / 2) return true;
    const dSq = Math.pow(dx - rect.w / 2, 2) + Math.pow(dy - rect.h / 2, 2);
    return dSq <= Math.pow(circle.radius, 2);
}
function checkPointRect(p: Vector2, r: Character) { return p.x >= r.pos.x - r.width/2 && p.x <= r.pos.x + r.width/2 && p.y >= r.pos.y - r.height/2 && p.y <= r.pos.y + r.height/2; }

export default GameCanvas;
