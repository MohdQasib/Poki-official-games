import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Radio, Play } from 'lucide-react';

interface GameProps {
  onSessionComplete: (session: any) => void;
  uid: string;
  onClose: () => void;
}

export default function NeonGridBrickBreaker({ onSessionComplete, uid, onClose }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const [currentStage, setCurrentStage] = useState<number>(1);
  const [lives, setLives] = useState<number>(3);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const stateRef = useRef({
    paddleX: 180,
    paddleW: 72,
    ballX: 220,
    ballY: 260,
    ballVX: 2.5,
    ballVY: -3,
    ballRadius: 6,
    bricks: [] as Array<{ x: number; y: number; w: number; h: number; intact: boolean; isGold: boolean; durability: number; maxDurability: number }>,
    lootCoins: [] as Array<{ x: number; y: number; vy: number; radius: number; collected: boolean; angle: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number }>,
    gameTime: 0,
    speedFactor: 1.0,
    coinsCollected: 0,
  });

  // Scale Viewport
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = 440; // Math alignment consistency
        canvas.height = 380;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
    stateRef.current.paddleX = (relativeX / rect.width) * canvas.width - stateRef.current.paddleW / 2;
  };

  const generateBricksForStage = (stage: number) => {
    const durabilityMultiplier = Math.floor((stage - 1) / 3) + 1;
    const padding = 6;
    const brickW = 54;
    const brickH = 14;
    const cols = 7;
    const rows = Math.min(6, 3 + Math.floor(stage / 5));

    const startX = (440 - (cols * (brickW + padding) - padding)) / 2;
    const startY = 40;

    const nextBricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let spawn = true;
        if (stage % 4 === 1) {
          spawn = (r + c) % 2 === 0;
        } else if (stage % 4 === 2) {
          spawn = !(r > 0 && r < rows - 1 && c > 1 && c < cols - 2);
        } else if (stage % 4 === 3) {
          spawn = Math.abs(c - 3) >= r;
        }

        if (spawn) {
          const maxBrickDurability = Math.max(1, Math.min(durabilityMultiplier, Math.floor((rows - r) / 2) + 1));
          nextBricks.push({
            x: startX + c * (brickW + padding),
            y: startY + r * (brickH + padding),
            w: brickW,
            h: brickH,
            intact: true,
            isGold: Math.random() < Math.min(0.5, 0.2 + stage * 0.01),
            durability: maxBrickDurability,
            maxDurability: maxBrickDurability,
          });
        }
      }
    }
    return nextBricks;
  };

  const startNewGame = () => {
    synth.playCoin();
    setScore(0);
    setCoins(0);
    setLives(3);
    setCurrentStage(1);
    setIsTransitioning(false);
    setSecuredTransaction(null);
    setSyncStatus('');

    const nextBricks = generateBricksForStage(1);

    stateRef.current = {
      paddleX: (440 - 72) / 2,
      paddleW: 72,
      ballX: 220,
      ballY: 180,
      ballVX: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 1.5),
      ballVY: 3.2,
      ballRadius: 6,
      bricks: nextBricks,
      lootCoins: [],
      particles: [],
      gameTime: 0,
      speedFactor: 1.0,
      coinsCollected: 0,
    };

    setGameState('playing');
  };

  const syncGameData = (finalScore: number, coinsCollected: number) => {
    setGameState('syncing');
    setSyncStatus('RECORDING BRICK BREAK TRANSACTIONS...');
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

      setSyncStatus('BRICK BREAK CONSTRAINTS MINED!');
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

  // Gameloop logic
  useEffect(() => {
    if (gameState !== 'playing' || isTransitioning) return;

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

      const currentCoins = st.coinsCollected || 0;
      let extraSpeedFactor = 1.0;
      if (currentCoins >= 16) {
        extraSpeedFactor += (currentCoins - 15) * 0.12;
        st.paddleW = Math.max(30, 72 - (currentCoins - 15) * 3);
      }
      if (currentCoins >= 25) {
        extraSpeedFactor += (currentCoins - 24) * 0.22;
        st.paddleW = Math.max(16, 72 - (currentCoins - 15) * 4);
      }
      if (currentCoins >= 32) {
        extraSpeedFactor += (currentCoins - 31) * 0.4;
        st.paddleW = 10;
      }

      // Ball Coordinate Physics Movement
      st.ballX += st.ballVX * extraSpeedFactor;
      st.ballY += st.ballVY * extraSpeedFactor;

      // Wall reflections
      if (st.ballX < st.ballRadius) {
        st.ballX = st.ballRadius;
        st.ballVX *= -1;
        synth.playJump();
      }
      if (st.ballX > w - st.ballRadius) {
        st.ballX = w - st.ballRadius;
        st.ballVX *= -1;
        synth.playJump();
      }
      if (st.ballY < st.ballRadius + 5) {
        st.ballY = st.ballRadius + 5;
        st.ballVY *= -1;
        synth.playJump();
      }

      // Ball vs sliding paddle deflection
      const paddleY = h - 35;
      if (
        st.ballVY > 0 &&
        st.ballY + st.ballRadius >= paddleY &&
        st.ballY - st.ballRadius <= paddleY + 12 &&
        st.ballX >= st.paddleX &&
        st.ballX <= st.paddleX + st.paddleW
      ) {
        // Offset physics: Angle reflection corresponds to hit distance from mid point
        const hitPoint = (st.ballX - (st.paddleX + st.paddleW / 2)) / (st.paddleW / 2);
        st.ballVY = -Math.abs(st.ballVY);
        st.ballVX = hitPoint * 4.2;
        synth.playJump();

        // Stagger slightly faster ball over bounces
        st.speedFactor = Math.min(1.5, st.speedFactor + 0.02);
      }

      // Ball VS Brick grid intersections (progressive durability)
      let winStreak = true;
      st.bricks.forEach((brick) => {
        if (!brick.intact) return;
        winStreak = false;

        // Bounding check
        if (
          st.ballX + st.ballRadius > brick.x &&
          st.ballX - st.ballRadius < brick.x + brick.w &&
          st.ballY + st.ballRadius > brick.y &&
          st.ballY - st.ballRadius < brick.y + brick.h
        ) {
          st.ballVY *= -1;
          
          // Decrement durability
          brick.durability--;
          if (brick.durability <= 0) {
            brick.intact = false;
            setScore((s) => s + 10);
            synth.playCoin();

            // Spawn particle spray
            for (let i = 0; i < 4; i++) {
              st.particles.push({
                x: brick.x + brick.w / 2,
                y: brick.y + brick.h / 2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: brick.isGold ? '#ffb703' : '#a1a8b9',
                size: 2,
                alpha: 1,
                life: 14,
              });
            }

            // Spawning golden cash coin loot
            if (brick.isGold) {
              st.lootCoins.push({
                x: brick.x + brick.w / 2,
                y: brick.y + brick.h,
                vy: 1.8,
                radius: 6.8,
                collected: false,
                angle: Math.random() * Math.PI,
              });
            }
          } else {
            // Indestructible / cracked impact
            try {
              synth.playJump();
            } catch (e) {}
            for (let i = 0; i < 2; i++) {
              st.particles.push({
                x: st.ballX,
                y: st.ballY,
                vx: (Math.random() - 0.5) * 2.5,
                vy: (Math.random() - 0.5) * 2.5,
                color: b7Color(brick),
                size: 1.5,
                alpha: 1,
                life: 10,
              });
            }
          }
        }
      });

      // Helper for brick hit particles
      function b7Color(b: any) {
        if (b.isGold) return '#ffe893';
        if (b.durability === 2) return '#ff007f';
        if (b.durability === 3) return '#39ff14';
        return '#00ffff';
      }

      // Victory check
      if (winStreak && !isTransitioning) {
        cancelAnimationFrame(animId);
        synth.playLevelUp();
        
        setIsTransitioning(true);
        setTimeout(() => {
          const nextLvl = currentStage + 1;
          setCurrentStage(nextLvl);
          setIsTransitioning(false);

          const nextLattice = generateBricksForStage(nextLvl);
          // speed scales up by 10% per level + base scale
          const speedMult = 1.10 * (1 + 0.05 * (nextLvl - 1));

          stateRef.current = {
            paddleX: (440 - 72) / 2,
            paddleW: 72,
            ballX: 220,
            ballY: 180,
            ballVX: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 1.5) * speedMult,
            ballVY: 3.2 * speedMult,
            ballRadius: 6,
            bricks: nextLattice,
            lootCoins: [],
            particles: [],
            gameTime: 0,
            speedFactor: 1.0,
          };

          setScore((s) => s + 500);
          st.coinsCollected = (st.coinsCollected || 0) + 15;
          setCoins(st.coinsCollected);
        }, 2000);
        return;
      }

      // Loot coins update
      st.lootCoins.forEach((coin) => {
        coin.y += coin.vy;

        if (!coin.collected) {
          const rotation = (st.gameTime * 0.09 + coin.angle) % (Math.PI * 2);
          const scale = Math.cos(rotation);

          ctx.save();
          ctx.translate(coin.x, coin.y);
          ctx.scale(Math.abs(scale) < 0.1 ? 0.1 : scale, 1.0);

          const grad = ctx.createRadialGradient(-1.5, -1.5, 1, 0, 0, coin.radius);
          grad.addColorStop(0, '#ffe893');
          grad.addColorStop(0.5, '#ffb703');
          grad.addColorStop(1, '#8c5f00');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();

          // Catch loot check
          if (
            coin.y + coin.radius >= paddleY &&
            coin.y - coin.radius <= paddleY + 12 &&
            coin.x >= st.paddleX &&
            coin.x <= st.paddleX + st.paddleW
          ) {
            coin.collected = true;
            st.coinsCollected = (st.coinsCollected || 0) + 1;
            setCoins(st.coinsCollected);
            synth.playCoin();
          }
        }
      });

      // Clean memories
      st.lootCoins = st.lootCoins.filter((c) => c.y < h + 40);

      // Rendering sequence
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, w, h);

      // Ambient grids lines
      ctx.strokeStyle = '#181d29';
      ctx.lineWidth = 0.5;
      const spacing = 40;
      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Render Bricks with progressive durability coloring
      st.bricks.forEach((b) => {
        if (!b.intact) return;

        let fill = '#171a21';
        let stroke = '#2a2f3b';
        if (b.isGold) {
          fill = '#ffb703';
          stroke = '#ffe893';
        } else {
          switch (b.durability) {
            case 1:
              fill = '#171a21';
              stroke = '#2a2f3b';
              break;
            case 2:
              fill = '#822be2';
              stroke = '#af5eff';
              break;
            case 3:
              fill = '#ec38bc';
              stroke = '#ff69b4';
              break;
            default:
              fill = '#00f260';
              stroke = '#39ff14';
              break;
          }
        }

        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 2.5);
        ctx.fill();
        ctx.stroke();

        if (b.isGold) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(b.x + 3, b.y + 1, b.w - 6, 2);
        }
      });

      // Render flowing trail particles
      st.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = p.life / 14;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) st.particles.splice(idx, 1);
      });

      // Render paddle
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(st.paddleX, paddleY, st.paddleW, 10, 4);
      ctx.fill();
      ctx.stroke();

      // Reflective glowing screen lines
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(st.paddleX + 6, paddleY + 2, st.paddleW - 12, 2);

      // Render Ball entity
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00e1ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(st.ballX, st.ballY, st.ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Failure check (lives support)
      if (st.ballY > h + 30) {
        cancelAnimationFrame(animId);
        synth.playCrash();

        if (lives > 1) {
          setLives((l) => l - 1);
          const speedMult = 1 + 0.05 * (currentStage - 1);
          st.ballX = 220;
          st.ballY = 180;
          st.ballVX = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 1.5) * speedMult;
          st.ballVY = 3.2 * speedMult;
          st.speedFactor = 1.0;
        } else {
          setLives(0);
          syncGameData(score, coins);
        }
      } else {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score, coins, currentStage, lives, isTransitioning]);

  return (
    <div className="flex flex-col bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden shadow-2xl relative w-full h-[450px]">
      
      <div className="flex items-center justify-between p-3 border-b border-[#2a2f3b] bg-[#14161c]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            NEON GRID BREAKER
          </span>
          <span className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin</span>
          </span>
          <span className="text-xs text-rose-400 font-mono flex items-center gap-1 ml-2">
            ❤️ <span className="font-extrabold">x{lives}</span>
          </span>
          <span className="text-xs text-cyan-400 font-mono flex items-center gap-1 ml-2">
            🚀 STAGE <span className="font-extrabold">{currentStage}</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-400 font-bold uppercase">
            XP: <span className="text-white">{score} XP</span>
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
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        className="flex-1 bg-[#0b0c10] relative flex items-center justify-center select-none cursor-none p-4"
      >
        {isTransitioning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm z-30">
            <Sparkles className="w-12 h-12 text-[#ffb703] animate-bounce mb-3" />
            <h2 className="text-xl font-black text-[#ffb703] font-mono tracking-widest uppercase">
              STAGE {currentStage} CLEARED!
            </h2>
            <p className="text-xs text-white/70 font-mono tracking-wider mt-1 uppercase animate-pulse">
              Next level loading... Speed +5%
            </p>
          </div>
        )}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-6 text-center">
            <Radio className="w-10 h-10 text-[#ffb703] animate-pulse mb-3" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase font-sans">
              NEON GRID BRICK BREAKER
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mt-2 mb-6 font-sans">
              Move the bottom safety paddle using your pointer. Bounce the physical ball in upward angles to break top bricks. Catch golden coin tokens released by glowing bricks!
            </p>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-extrabold text-sm uppercase rounded cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#ffb703]/20"
            >
              <Play className="w-4 h-4 fill-black" /> START BREAKING
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

        {/* CUSTOM PREMIUM GAME OVER MODAL OVERLAY */}
        {gameState === 'gameover' && securedTransaction && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 overflow-y-auto">
            <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/30 rounded-xl p-5 shadow-2xl relative text-center" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-center justify-center gap-2 text-rose-500 mb-2 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                <span>OUT OF BREAKING SPHERE RESERVE</span>
              </div>

              <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
                BRICK RE-ENTRY BALANCE REPORT
              </h3>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">XP Earnings</span>
                  <span className="text-lg font-mono font-extrabold text-white">{score} XP</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Coin Looted</span>
                  <span className="text-lg font-mono font-extrabold text-[#ffd166]">🪙 {coins}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5 animate-slideUp">
                <div className="flex items-center justify-between font-mono text-[9px] text-[#ffb703] pb-1.5 border-b border-[#2a2f3b]/60">
                  <span className="font-semibold">PROOF_ATARI_GRID_LOCK</span>
                  <span>STATUS: COMMITTED</span>
                </div>
                <p className="text-[9px] font-mono text-gray-400 mt-2 truncate">
                  SHA-HASH: {securedTransaction.checksum}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startNewGame}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#ffb703]/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 antialiased animate-spin-reverse" /> RESPAWN SPHERE
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
          className="block w-full h-[320px] bg-black/40 rounded border border-[#282d3b]"
        />

        {/* TIP OVERLAY */}
        {gameState === 'playing' && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 px-4 py-1 bg-black/60 border border-[#2a2f3b] rounded-full pointer-events-none text-[8.5px] font-mono text-center text-gray-400 uppercase tracking-widest leading-none">
            USE MOUSE OR TOUCH TO DRAG THE PADDLE
          </div>
        )}
      </div>

    </div>
  );
}
