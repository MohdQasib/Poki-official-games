import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Radio, Play, Flame } from 'lucide-react';

interface GameProps {
  onSessionComplete: (session: any) => void;
  uid: string;
  onClose: () => void;
}

export default function PokiJetpackRush({ onSessionComplete, uid, onClose }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Refs for loop state
  const stateRef = useRef({
    playerY: 150,
    playerVY: 0,
    playerX: 80,
    isThrusting: false,
    obstacles: [] as Array<{ x: number; y: number; w: number; h: number; type: 'laser_h' | 'laser_v' }>,
    coins: [] as Array<{ x: number; y: number; collected: boolean; radius: number; pulseOffset: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number }>,
    speed: 4,
    distanceRun: 0,
    gameTime: 0,
    multiplier: 1,
    collectedCoinsCount: 0,
  });

  // Handle Resize
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

  // Handle keys/clicks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        stateRef.current.isThrusting = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        stateRef.current.isThrusting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startNewGame = () => {
    synth.playCoin();
    setScore(0);
    setCoins(0);
    setSecuredTransaction(null);
    setSyncStatus('');
    
    // Reset state values
    stateRef.current = {
      playerY: 150,
      playerVY: 0,
      playerX: 80,
      isThrusting: false,
      obstacles: [],
      coins: [],
      particles: [],
      speed: 4.5,
      distanceRun: 0,
      gameTime: 0,
      multiplier: 1,
      collectedCoinsCount: 0,
    };
    
    setGameState('playing');
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    stateRef.current.isThrusting = true;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    stateRef.current.isThrusting = false;
  };

  const syncGameData = (finalScore: number, coinsCollected: number) => {
    setGameState('syncing');
    setSyncStatus('GENERATING CONSENSUS BLOCK PROOF...');
    try {
      synth.playJump();
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

      // Simulated hash signature block matching parent logic
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

      setSyncStatus('MINED TRANSACTION BROADCAST SECURED!');
      setGameState('gameover');

      // Sync backend balance matching other games in app
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

  // Main Canvas loop
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
      st.distanceRun += st.speed / 10;
      setScore(Math.floor(st.distanceRun));

      // Physics constants
      let gravity = 0.35;
      let thrust = -0.55;
      let maxSpd = 6;
      
      if ((window as any).isExtremeHardMode) {
        gravity *= 2.5;
        thrust *= 2.5;
        maxSpd *= 2.5;
      }
      
      // Update Player
      if (st.isThrusting) {
        st.playerVY += thrust;
        // Jetpack fire particles emissions
        if (Math.random() < 0.6) {
          st.particles.push({
            x: st.playerX - 10,
            y: st.playerY + 8,
            vx: -2 - Math.random() * 2,
            vy: 1 + Math.random() * 3,
            color: Math.random() > 0.4 ? '#ffb703' : '#ef4444',
            size: 2 + Math.random() * 3,
            alpha: 1,
            life: 25,
          });
        }
      } else {
        st.playerVY += gravity;
      }

      st.playerVY = Math.max(-maxSpd, Math.min(maxSpd, st.playerVY));
      st.playerY += st.playerVY;

      // Keep inside bounds
      if (st.playerY < 20) {
        st.playerY = 20;
        st.playerVY = 0;
      }
      if (st.playerY > h - 40) {
        st.playerY = h - 40;
        st.playerVY = 0;
      }

      // Spawning lasers & coins sequence
      if (st.gameTime % 120 === 0) {
        // Spawn electric laser grid barrier
        const type = Math.random() > 0.5 ? 'laser_h' : 'laser_v';
        if (type === 'laser_h') {
          st.obstacles.push({
            x: w + 20,
            y: 50 + Math.random() * (h - 150),
            w: 120,
            h: 16,
            type: 'laser_h'
          });
        } else {
          st.obstacles.push({
            x: w + 20,
            y: 30 + Math.random() * (h - 180),
            w: 24,
            h: 110,
            type: 'laser_v'
          });
        }
      }

      if (st.gameTime % 90 === 0) {
        // Spawn nice chains of gold spinning Pokicoins
        const cy = 60 + Math.random() * (h - 150);
        const count = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
          st.coins.push({
            x: w + 30 + i * 28,
            y: cy + Math.sin(i * 0.5) * 15,
            collected: false,
            radius: 8,
            pulseOffset: Math.random() * Math.PI
          });
        }
      }

      // Progress speed slightly
      let baseSpeed = 4.5 + st.distanceRun * 0.003;
      if ((window as any).isExtremeHardMode) {
        baseSpeed *= 2.5;
      }
      st.speed = baseSpeed;

      // Clear Canvas
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, w, h);

      // Draw subtle futuristic cyber grids background
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      const offsetX = -(st.distanceRun * 2) % gridSize;
      for (let x = offsetX; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Update & Draw Coins
      st.coins.forEach((coin) => {
        coin.x -= st.speed;

        if (!coin.collected) {
          // Drawing Spinning gold Pokicoins custom procedural rendering
          const localRot = (st.gameTime * 0.07 + coin.pulseOffset) % (Math.PI * 2);
          const cosRot = Math.cos(localRot);

          ctx.save();
          ctx.translate(coin.x, coin.y);
          ctx.scale(Math.abs(cosRot) < 0.1 ? 0.1 : cosRot, 1.0);

          // Poki coin styling
          const grad = ctx.createRadialGradient(-2, -2, 1, 0, 0, coin.radius);
          grad.addColorStop(0, '#ffe893');
          grad.addColorStop(0.5, '#ffb703');
          grad.addColorStop(1, '#8c5f00');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
          ctx.fill();

          // Border Ring
          ctx.strokeStyle = '#ffe893';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(0, 0, coin.radius - 1, 0, Math.PI * 2);
          ctx.stroke();

          // P logo inside
          ctx.fillStyle = '#000000';
          ctx.font = '7px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('P', 0, 0);

          ctx.restore();

          // Check collision with player
          const distToPlayer = Math.hypot(coin.x - st.playerX, coin.y - st.playerY);
          if (distToPlayer < coin.radius + 14) {
            coin.collected = true;
            st.collectedCoinsCount = (st.collectedCoinsCount || 0) + 1;
            setCoins(st.collectedCoinsCount);
            synth.playCoin();
            
            // Add sparkle particles
            for (let i = 0; i < 4; i++) {
              st.particles.push({
                x: coin.x,
                y: coin.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#ffb703',
                size: 2,
                alpha: 1,
                life: 15,
              });
            }
          }
        }
      });

      // Update & Draw Laser obstacles
      let isCrashed = false;
      st.obstacles.forEach((obs) => {
        obs.x -= st.speed;

        // Draw laser base nodes
        ctx.fillStyle = '#ff3333';
        if (obs.type === 'laser_h') {
          // Draw standard electric nodes on both ends
          ctx.fillRect(obs.x, obs.y - 4, 8, 24);
          ctx.fillRect(obs.x + obs.w - 8, obs.y - 4, 8, 24);

          // Pulsing laser connection beam
          const beamGlow = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.h);
          beamGlow.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
          beamGlow.addColorStop(0.5, 'rgba(255, 232, 232, 0.95)');
          beamGlow.addColorStop(1, 'rgba(239, 68, 68, 0.2)');

          ctx.fillStyle = beamGlow;
          ctx.fillRect(obs.x + 8, obs.y + 4, obs.w - 16, 8);

          // Outer glowing boundaries
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 2 + Math.sin(st.gameTime * 0.3) * 1.5;
          ctx.beginPath();
          ctx.moveTo(obs.x + 8, obs.y + 8);
          ctx.lineTo(obs.x + obs.w - 8, obs.y + 8);
          ctx.stroke();

          // AABB bounding box checks with player cylinder height (approx 26px x 26px)
          if (
            st.playerX + 12 > obs.x + 8 &&
            st.playerX - 12 < obs.x + obs.w - 8 &&
            st.playerY + 12 > obs.y + 4 &&
            st.playerY - 12 < obs.y + 12
          ) {
            isCrashed = true;
          }
        } else {
          // Draw a tall vertical beam
          ctx.fillRect(obs.x - 4, obs.y, 32, 8);
          ctx.fillRect(obs.x - 4, obs.y + obs.h - 8, 32, 8);

          // Vertical Pulsing laser beam
          const beamGlow = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.w, obs.y);
          beamGlow.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
          beamGlow.addColorStop(0.5, 'rgba(255, 232, 232, 0.95)');
          beamGlow.addColorStop(1, 'rgba(239, 68, 68, 0.2)');

          ctx.fillStyle = beamGlow;
          ctx.fillRect(obs.x + 8, obs.y + 8, 8, obs.h - 16);

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 2 + Math.sin(st.gameTime * 0.3) * 1.5;
          ctx.beginPath();
          ctx.moveTo(obs.x + 12, obs.y + 8);
          ctx.lineTo(obs.x + 12, obs.y + obs.h - 8);
          ctx.stroke();

          // Collision check
          if (
            st.playerX + 12 > obs.x + 8 &&
            st.playerX - 12 < obs.x + 16 &&
            st.playerY + 12 > obs.y + 8 &&
            st.playerY - 12 < obs.y + obs.h - 8
          ) {
            isCrashed = true;
          }
        }
      });

      // Draw Jetpack Flame particles
      st.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = Math.max(0, p.life / 25);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) st.particles.splice(idx, 1);
      });

      // Draw Jetpack Astronaut character
      ctx.save();
      ctx.translate(st.playerX, st.playerY);

      // Outer gold aura glow if thrusting
      if (st.isThrusting) {
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 12;
      }

      // Jetpack tank on back
      ctx.fillStyle = '#2a2f3b';
      ctx.fillRect(-15, -4, 6, 16);
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(-15, 12, 6, 4); // fire nozzles

      // Main suit body (Deep slate)
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Golden Helmet visor
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(4, -2, 6, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Golden booster shield wing
      ctx.fillStyle = '#ffe893';
      ctx.beginPath();
      ctx.moveTo(-8, 5);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-11, -5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Garbage clean memory arrays
      st.obstacles = st.obstacles.filter((obs) => obs.x > -200);
      st.coins = st.coins.filter((coin) => coin.x > -100);

      if (isCrashed) {
        cancelAnimationFrame(animId);
        synth.playCrash();
        syncGameData(Math.floor(st.distanceRun), st.collectedCoinsCount || 0);
      } else {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="flex flex-col bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden shadow-2xl relative w-full h-[450px]">
      
      {/* GAME STATS OVERLAY FOR HUDS */}
      <div className="flex items-center justify-between p-3 border-b border-[#2a2f3b] bg-[#14161c]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            SPACE JETPACK
          </span>
          <span id="poki-coin-hud" className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span id="high-score-hud" className="text-gray-400">
            SCORE: <span className="text-white font-bold">{score}m</span>
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
        className="flex-1 bg-[#0b0c10] relative flex items-center justify-center select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-6 text-center">
            <Radio className="w-10 h-10 text-[#ffb703] animate-pulse mb-3" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase font-sans">
              POKI JETPACK RUSH
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mt-2 mb-6">
              Hold <span className="text-[#ffd166] font-bold">Spacebar</span>, Click, or Touch and hold on the screen to boosters climb up. Avoid the red electric laser walls and grab shining Pokicoins!
            </p>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-extrabold text-sm uppercase rounded cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#ffb703]/20"
            >
              <Play className="w-4 h-4 fill-black" /> START RUNNING
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

        {/* CUSTOM PREMIUM GAME-OVER MODAL OVERLAY */}
        {gameState === 'gameover' && securedTransaction && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 overflow-y-auto">
            <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/30 rounded-xl p-5 shadow-2xl relative text-center">
              
              <div className="flex items-center justify-center gap-2 text-red-500 mb-2 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                <span>CONNECTION TERMINATED (LASER CRASH)</span>
              </div>

              <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
                JETPACK RE-ENTRY REPORT
              </h3>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Distance Traveled</span>
                  <span className="text-lg font-mono font-extrabold text-white">{score}m</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Mined Pokicoins</span>
                  <span className="text-lg font-mono font-extrabold text-[#ffd166]">🪙 {coins}</span>
                </div>
              </div>

              {/* Secure transactional token status */}
              <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5">
                <div className="flex items-center justify-between font-mono text-[9px] text-[#ffb703] pb-1.5 border-b border-[#2a2f3b]/60">
                  <span className="font-semibold">BLOCK_PROV_SIGNATURE</span>
                  <span>RATE LMT: APPROVED</span>
                </div>
                <p className="text-[9px] font-mono text-gray-400 mt-2 truncate">
                  SHA-HASH: {securedTransaction.checksum}
                </p>
                <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 mt-1">
                  <span>CONSENSUS INDEX: {securedTransaction.payload.node_consensus_index}</span>
                  <span>{securedTransaction.payload.timestamp_utc}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startNewGame}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#ffb703]/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 antialiased animate-spin-reverse" /> CHUTE BACK IN
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#0b0c10] border border-[#2a2f3b] text-white hover:bg-[#1a1d26] font-extrabold text-xs uppercase rounded transition-all cursor-pointer"
                >
                  RETURN TO LOBBY
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CANVAS */}
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-pointer bg-[#0b0c10]"
        />

        {/* BOTTOM RIGHT HUD FOR ACTION TIPS */}
        {gameState === 'playing' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-black/60 backdrop-blur-md border border-[#2a2f3b] rounded-full pointer-events-none select-none text-[9px] font-mono text-center text-gray-400 uppercase tracking-widest">
            HOLD SCREEN OR KEY TO THRUST UPWARD
          </div>
        )}
      </div>

    </div>
  );
}
