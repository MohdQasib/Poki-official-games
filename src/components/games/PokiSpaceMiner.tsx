import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Radio, Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface GameProps {
  onSessionComplete: (session: any) => void;
  uid: string;
  onClose: () => void;
}

export default function PokiSpaceMiner({ onSessionComplete, uid, onClose }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const stateRef = useRef({
    shipX: 220,
    isLeftPressed: false,
    isRightPressed: false,
    asteroids: [] as Array<{ x: number; y: number; size: number; vy: number; hp: number }>,
    lasers: [] as Array<{ x: number; y: number; vy: number }>,
    lootCoins: [] as Array<{ x: number; y: number; vy: number; collected: boolean; radius: number; rotOffset: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number }>,
    gameTime: 0,
    speed: 1,
    coinsCollectedSession: 0,
  });

  // Resizing viewport
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = Math.min(container.clientHeight, 400);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // Handle Controls keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        stateRef.current.isLeftPressed = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        stateRef.current.isRightPressed = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        stateRef.current.isLeftPressed = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        stateRef.current.isRightPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const moveLeftTouch = (pressed: boolean) => {
    stateRef.current.isLeftPressed = pressed;
  };

  const moveRightTouch = (pressed: boolean) => {
    stateRef.current.isRightPressed = pressed;
  };

  const handlePointerDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    if ('touches' in e) {
      if (e.touches[0]) {
        clientX = e.touches[0].clientX;
      } else {
        return;
      }
    } else {
      clientX = e.clientX;
    }
    const relativeX = clientX - rect.left;
    stateRef.current.shipX = (relativeX / rect.width) * canvas.width;
  };

  const startNewGame = () => {
    synth.playCoin();
    setScore(0);
    setCoins(0);
    setSecuredTransaction(null);
    setSyncStatus('');

    stateRef.current = {
      shipX: 220,
      isLeftPressed: false,
      isRightPressed: false,
      asteroids: [],
      lasers: [],
      lootCoins: [],
      particles: [],
      gameTime: 0,
      speed: 1,
      coinsCollectedSession: 0,
    };

    setGameState('playing');
  };

  const syncGameData = (finalScore: number, coinsCollected: number) => {
    setGameState('syncing');
    setSyncStatus('BROADCASTING SPACE MINER LEDGER STATUS...');
    try {
      synth.playLevelUp();
    } catch (e) {}

    setTimeout(() => {
      const timestamp = Date.now();
      const rawPayload = {
        client_uid: uid || 'anonymous_peer_vector',
        score_distance: finalScore,
        poki_tokens_collected: coinsCollected,
        poki_tokens_earned: parseFloat((coinsCollected * 1.05).toFixed(8)),
        node_consensus_index: Math.floor(Math.random() * 900000 + 100000),
        rate_limit_token: btoa(`${uid}_${timestamp}_${finalScore}_${coinsCollected}`),
        timestamp_utc: new Date().toISOString(),
      };

      const dummyKey = 'POKI_SHIELD_V9';
      const checksumBase = `${dummyKey}:${rawPayload.poki_tokens_collected}:${rawPayload.score_distance}:${timestamp}`;
      let checksumHex = '';
      for (let i = 0; i < checksumBase.length; i++) {
        checksumHex += checksumBase.charCodeAt(i).toString(16);
      }
      checksumHex = `0x${checksumHex.slice(0, 48).padEnd(48, 'a')}`;

      const jwtMock = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(rawPayload))}.SIG_${checksumHex.slice(2, 20)}`;

      setSecuredTransaction({
        jwt: jwtMock,
        checksum: checksumHex,
        payload: rawPayload,
      });

      setSyncStatus('SPACE ORE SAMPLES TRANSMITTED!');
      setGameState('gameover');

      onSessionComplete({
        distance: finalScore,
        coinsCollected: coinsCollected,
        multiplier: 1,
        timestamp: timestamp,
        hashSignature: checksumHex,
        securePayload: JSON.stringify(rawPayload),
        status: 'gameover',
      });
    }, 1000);
  };

  // Space Miner Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const st = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      st.gameTime++;

      // Automatically fire dual lasers upward
      if (st.gameTime % 14 === 0) {
        st.lasers.push({ x: st.shipX - 10, y: h - 50, vy: -6, active: true } as any);
        st.lasers.push({ x: st.shipX + 10, y: h - 50, vy: -6, active: true } as any);
        synth.playJump();
      }

      // Spawns incoming asteroids space rock
      const currentCoins = st.coinsCollectedSession || 0;
      let spawnRate = 45;
      if (currentCoins >= 16) {
        spawnRate = 30;
      }
      if (currentCoins >= 25) {
        spawnRate = 18;
      }
      if (currentCoins >= 32) {
        spawnRate = 8;
      }

      if (st.gameTime % spawnRate === 0) {
        const size = 16 + Math.random() * 24;
        const elapsedSec = st.gameTime / 60;
        let hpVal = 4 + Math.floor(Math.random() * 4); // default 4-7 (slightly harder)
        let activeVY = 0.8 + Math.random() * 1.2;

        if (elapsedSec > 30 && elapsedSec <= 60) {
          hpVal = 8 + Math.floor(Math.random() * 6); // 8-13 (slightly harder)
        } else if (elapsedSec > 60) {
          hpVal = 15 + Math.floor(Math.random() * 10); // 15-24 (slightly harder)
        }

        if (currentCoins >= 16) {
          hpVal = 12 + Math.floor(Math.random() * 8);
          activeVY *= 1.8;
        }
        if (currentCoins >= 25) {
          hpVal = 25 + Math.floor(Math.random() * 15);
          activeVY *= 3.0;
        }
        if (currentCoins >= 32) {
          hpVal = 50 + Math.floor(Math.random() * 30);
          activeVY *= 5.0;
        }

        st.asteroids.push({
          x: 20 + Math.random() * (w - 40),
          y: -25,
          size: size,
          vy: activeVY, // dynamic speed matching difficulty scaling
          hp: hpVal,
          active: true,
          flashTime: 0
        } as any);
      }

      // Move player spaceship via horizontal keys
      if (st.isLeftPressed) {
        st.shipX -= 4.2;
      }
      if (st.isRightPressed) {
        st.shipX += 4.2;
      }
      st.shipX = Math.max(20, Math.min(w - 20, st.shipX));

      // Clear Screen
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, w, h);

      // Starfield parallax lines scrolling backgrounds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 20; i++) {
        const sx = (i * 47) % w;
        const sy = (st.gameTime * (2 + (i % 3))) % h;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Lasers update
      st.lasers.forEach((l) => {
        if (!l) return;
        l.y += l.vy;
      });

      // Asteroids update
      st.asteroids.forEach((ast) => {
        if (!ast) return;
        ast.y += ast.vy;
        if ((ast as any).flashTime && (ast as any).flashTime > 0) {
          (ast as any).flashTime--;
        }
      });

      // Collision laser vs asteroid check
      for (let i = 0; i < st.lasers.length; i++) {
        const l = st.lasers[i];
        if (!l || (l as any).active === false) continue;

        for (let j = 0; j < st.asteroids.length; j++) {
          const ast = st.asteroids[j];
          if (!ast || (ast as any).active === false || ast.hp <= 0) continue;

          const distToAsteroid = Math.hypot(l.x - ast.x, l.y - ast.y);
          if (distToAsteroid < ast.size) {
            // Laser hit! Mark laser as inactive and decrement asteroid HP
            (l as any).active = false;
            ast.hp--;
            (ast as any).flashTime = 5; // Flash effect

            // Spark particles
            for (let k = 0; k < 3; k++) {
              st.particles.push({
                x: l.x,
                y: l.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 2 - 2,
                color: '#ffdd22',
                size: 1.5,
                alpha: 1,
                life: 12
              });
            }

            // Explosion check
            if (ast.hp <= 0) {
              (ast as any).active = false;
              setScore((s) => s + 50);
              synth.playCoin();

              // Drop exactly 1 Yellow Coin at exact pixel location
              st.lootCoins.push({
                x: ast.x,
                y: ast.y,
                vy: 1.5 + Math.random() * 1.5,
                collected: false,
                radius: 7,
                rotOffset: Math.random() * Math.PI
              });

              // Visual fracture particle burst
              for (let p = 0; p < 15; p++) {
                st.particles.push({
                  x: ast.x,
                  y: ast.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  color: p % 2 === 0 ? '#ffb703' : '#9ca3af',
                  size: 2 + Math.random() * 2.5,
                  alpha: 1,
                  life: 25
                });
              }
            }
            break; // Stop checking other asteroids for this laser
          }
        }
      }

      // Lasers draw
      st.lasers.forEach((l) => {
        if (!l || (l as any).active === false) return;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 6;
        ctx.fillRect(l.x - 1, l.y, 2, 10);
        ctx.shadowBlur = 0;
      });

      // Asteroids draw
      st.asteroids.forEach((ast) => {
        if (!ast || ast.hp <= 0 || (ast as any).active === false) return;

        // Draw rocky polygonal asteroids
        if ((ast as any).flashTime && (ast as any).flashTime > 0) {
          ctx.fillStyle = '#ffffff'; // Flash white
          ctx.strokeStyle = '#ef4444';
        } else {
          ctx.fillStyle = '#171a21';
          ctx.strokeStyle = '#2a2f3b';
        }
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner thermal line glow
        ctx.strokeStyle = (ast as any).flashTime && (ast as any).flashTime > 0 ? '#ffb703' : 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ast.x - ast.size * 0.4, ast.y - ast.size * 0.2);
        ctx.lineTo(ast.x + ast.size * 0.3, ast.y + ast.size * 0.3);
        ctx.stroke();

        // RENDER LOGIC: Project dynamic integer value of HP onto center
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(ast.hp.toString(), ast.x, ast.y);
        ctx.restore();
      });

      // Rocket spaceship collision check
      let shipCrashed = false;
      st.asteroids.forEach((ast) => {
        if (!ast || ast.hp <= 0 || (ast as any).active === false) return;
        const shipDist = Math.hypot(ast.x - st.shipX, ast.y - (h - 40));
        if (shipDist < ast.size + 14) {
          shipCrashed = true;
        }
      });

      // Loot Floating Coins update and draw
      st.lootCoins.forEach((coin) => {
        if (!coin || coin.collected) return;
        coin.y += coin.vy;

        const rotationAngle = (st.gameTime * 0.08 + coin.rotOffset) % (Math.PI * 2);
        const cosVal = Math.cos(rotationAngle);

        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.scale(Math.abs(cosVal) < 0.1 ? 0.1 : cosVal, 1.0);

        const coinGrad = ctx.createRadialGradient(-1.5, -1.5, 1, 0, 0, coin.radius);
        if (coinGrad) {
          coinGrad.addColorStop(0, '#ffe893');
          coinGrad.addColorStop(0.5, '#ffb703');
          coinGrad.addColorStop(1, '#8c5f00');
          ctx.fillStyle = coinGrad;
        } else {
          ctx.fillStyle = '#ffb703';
        }

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffe893';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, coin.radius - 1, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Player ship boundaries catch coin checks
        const coinDist = Math.hypot(coin.x - st.shipX, coin.y - (h - 40));
        if (coinDist < 16 + coin.radius) {
          coin.collected = true;
          if (st.coinsCollectedSession < 40) {
            st.coinsCollectedSession++;
            setCoins(st.coinsCollectedSession);
            setScore((s) => s + 100);
            synth.playCoin();

            // Spawn sparkles
            for (let i = 0; i < 4; i++) {
              st.particles.push({
                x: coin.x,
                y: coin.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: '#ffb703',
                size: 1.8,
                alpha: 1,
                life: 14,
              });
            }
          }
        }
      });

      // Render flowing sparkles/sparks particles
      st.particles.forEach((p) => {
        if (!p) return;
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / 20);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Spaceship character at bottom
      ctx.save();
      ctx.translate(st.shipX, h - 40);

      // engine fire particle emission tail
      if (st.gameTime % 3 === 0) {
        st.particles.push({
          x: st.shipX,
          y: h - 25,
          vx: (Math.random() - 0.5) * 2,
          vy: 3 + Math.random() * 2,
          color: '#ffb703',
          size: 2.2,
          alpha: 1,
          life: 12
        });
      }

      // Base gold ship vectors
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 2.2;

      ctx.beginPath();
      ctx.moveTo(0, -18);   // Nose tip
      ctx.lineTo(-14, 12);  // Left wing base
      ctx.lineTo(-6, 6);    // Mid left
      ctx.lineTo(6, 6);     // Mid right
      ctx.lineTo(14, 12);   // Right wing base
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cyber shield central dome
      ctx.fillStyle = '#00e1ff';
      ctx.beginPath();
      ctx.arc(0, -2, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Clean off list elements safely
      st.particles = st.particles.filter((p) => p && p.life > 0);
      st.lasers = st.lasers.filter((l) => l && (l as any).active !== false && l.y > -20);
      st.asteroids = st.asteroids.filter((ast) => ast && ast.hp > 0 && (ast as any).active !== false && ast.y < h + 40);
      st.lootCoins = st.lootCoins.filter((coin) => coin && !coin.collected && coin.y < h + 40);

      if (shipCrashed) {
        cancelAnimationFrame(animId);
        synth.playCrash();
        syncGameData(score, coins);
      } else {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score, coins]);

  return (
    <div className="flex flex-col bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden shadow-2xl relative w-full h-[450px]">
      
      <div className="flex items-center justify-between p-3 border-b border-[#2a2f3b] bg-[#14161c]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            POKI SPACE MINER
          </span>
          <span className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-400 font-bold uppercase">
            REVENUE: <span className="text-white">{score} XP</span>
          </span>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
            title="Exit game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME VIEWPORT */}
      <div 
        ref={containerRef}
        onMouseMove={handlePointerDrag}
        onTouchMove={handlePointerDrag}
        className="flex-1 bg-[#0b0c10] relative flex items-center justify-center select-none cursor-crosshair"
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-6 text-center">
            <Radio className="w-10 h-10 text-amber-400 animate-pulse mb-3" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase font-sans">
              POKI SPACE MINER
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mt-2 mb-6">
              Navigate your ship Left and Right using <span className="text-[#ffd166] font-bold">A/D Keys</span>, <span className="text-[#ffd166] font-bold">Arrows</span>, or slide your pointer across the viewport. Bullet-cannons will automatically fire up. Explode space-ores and capture golden loot chunks!
            </p>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-extrabold text-sm uppercase rounded cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#ffb703]/20"
            >
              <Play className="w-4 h-4 fill-black" /> WARP IN SHIP
            </button>
          </div>
        )}

        {gameState === 'syncing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <div className="w-12 h-12 rounded-full border-4 border-[#2a2f3b] border-t-[#ffb703] animate-spin mb-4" />
            <p className="text-xs font-mono text-[#ffb703] uppercase tracking-widest animate-pulse font-semibold">
              {syncStatus}
            </p>
          </div>
        )}

        {/* CUSTOM PREMIUM GAME OVER REPORT MODAL OVERLAY */}
        {gameState === 'gameover' && securedTransaction && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 overflow-y-auto">
            <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/30 rounded-xl p-5 shadow-2xl relative text-center" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-center justify-center gap-2 text-rose-500 mb-2 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                <span>SHIP DESTROYED - ENORMOUS IMPACT</span>
              </div>

              <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
                SYSTEM MINING SETTLEMENT
              </h3>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Cosmic Revenue</span>
                  <span className="text-lg font-mono font-extrabold text-white">{score} XP</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Coins Gathered</span>
                  <span className="text-lg font-mono font-extrabold text-[#ffd166]">🪙 {coins}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5">
                <div className="flex items-center justify-between font-mono text-[9px] text-[#ffb703] pb-1.5 border-b border-[#2a2f3b]/60">
                  <span className="font-semibold">PROOF_SPACE_REVENUES</span>
                  <span>STATUS: INBOUND</span>
                </div>
                <p className="text-[9px] font-mono text-gray-400 mt-2 truncate">
                  SHA-HASH: {securedTransaction.checksum}
                </p>
              </div>

              <div className="flex gap-4 animate-fadeIn">
                <button
                  onClick={startNewGame}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#ffb703]/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 antialiased animate-spin-reverse" /> ENGAGE ENGINES
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#0b0c10] border border-[#2a2f3b] text-white hover:bg-[#1a1d26] font-extrabold text-xs uppercase rounded transition-all cursor-pointer"
                >
                  FORFEIT SHIP
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CANVAS */}
        <canvas
          ref={canvasRef}
          className="block w-full h-full bg-[#0b0c10]"
        />

        {/* STEERING TAP OVERLAYS DIRECTLY ON SCREEN */}
        {gameState === 'playing' && (
          <div className="absolute inset-x-0 bottom-0 top-1/2 flex pointer-events-auto z-15 opacity-0 select-none">
            <div 
              onTouchStart={() => moveLeftTouch(true)}
              onTouchEnd={() => moveLeftTouch(false)}
              onMouseDown={() => moveLeftTouch(true)}
              onMouseUp={() => moveLeftTouch(false)}
              className="w-1/2 h-full cursor-pointer"
              title="Steer Left"
            />
            <div 
              onTouchStart={() => moveRightTouch(true)}
              onTouchEnd={() => moveRightTouch(false)}
              onMouseDown={() => moveRightTouch(true)}
              onMouseUp={() => moveRightTouch(false)}
              className="w-1/2 h-full cursor-pointer"
              title="Steer Right"
            />
          </div>
        )}

        {/* BOTTOM HUD */}
        {gameState === 'playing' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-black/60 backdrop-blur-md border border-[#2a2f3b] rounded-full pointer-events-none select-none text-[9px] font-mono text-center text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span>DRAG OR TAP LOWER HALVES TO COSTEER FIGHTER</span>
          </div>
        )}
      </div>

    </div>
  );
}
