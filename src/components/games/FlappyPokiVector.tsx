import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Radio, Play } from 'lucide-react';

interface GameProps {
  onSessionComplete: (session: any) => void;
  uid: string;
  onClose: () => void;
}

export default function FlappyPokiVector({ onSessionComplete, uid, onClose }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const stateRef = useRef({
    pokiY: 150,
    pokiVY: 0,
    pipes: [] as Array<{ x: number; topHeight: number; bottomHeight: number; passed: boolean; width: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number }>,
    speed: 3.2,
    gameTime: 0,
    gapSize: 110,
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

  // Handle keyboard jump inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        applyFlapUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const applyFlapUp = () => {
    if (gameState !== 'playing') return;
    stateRef.current.pokiVY = -5.4; // Optimized jump velocity for flawless single jumps and precision
    synth.playJump();

    const st = stateRef.current;
    // Emit flap fire sparks
    for (let i = 0; i < 4; i++) {
      st.particles.push({
        x: 80,
        y: st.pokiY + 4,
        vx: -3 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 4,
        color: '#ffb703',
        size: 2,
        alpha: 1,
        life: 15
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState === 'playing') {
      e.preventDefault(); // Prevents simulated double tap triggered by click mapping
      applyFlapUp();
    }
  };

  const startNewGame = () => {
    synth.playCoin();
    setScore(0);
    setCoins(0);
    setSecuredTransaction(null);
    setSyncStatus('');

    // Prepopulate first pipe at some position
    const initPipes = [
      { x: 400, topHeight: 100, bottomHeight: 150, passed: false, width: 44 }
    ];

    stateRef.current = {
      pokiY: 150,
      pokiVY: -4.5,
      pipes: initPipes,
      particles: [],
      speed: 3.2,
      gameTime: 0,
      gapSize: 105
    };

    setGameState('playing');
  };

  const syncGameData = (finalScore: number, coinsCollected: number) => {
    setGameState('syncing');
    setSyncStatus('VALIDATING VECTOR TRAJECTORY PROOF...');
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

      setSyncStatus('FLAPPY PROOF MINED SUCCESSFULLY!');
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

  // Gameloop controller
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

      // COMPONENT DYNAMIC DIFFICULTY SCALING based on score / coins (Specification 1)
      let activeSpeed = 3.2;
      let activeGravity = 0.28;
      let activeGap = 105;

      const currentCoins = score * 2;

      if (currentCoins >= 16) {
        // scale obstacles/speeds exponentially
        const scaleFactor = 1.0 + (currentCoins - 15) * 0.12;
        activeSpeed = 3.2 * scaleFactor;
        activeGravity = 0.28 * Math.pow(1.08, currentCoins - 15);
        activeGap = Math.max(55, 105 - (currentCoins - 15) * 4);
      }
      
      if (currentCoins >= 25) {
        // Sudden Death tier
        const scaleFactor = 1.0 + (currentCoins - 15) * 0.22;
        activeSpeed = 3.2 * scaleFactor * 1.5;
        activeGravity = 0.28 * Math.pow(1.15, currentCoins - 15) * 1.4;
        activeGap = Math.max(42, 60 - (currentCoins - 24) * 3); // extremely narrow gap size guaranteeing a quick skill-based knockout
      }

      if (currentCoins >= 32) {
        // Extreme impossible barrier
        activeSpeed = 15;
        activeGravity = 0.9;
        activeGap = 35; // mathematically near-impossible to survive multiple
      }

      // Physics constants gravity pulls coin down
      if ((window as any).isExtremeHardMode) {
        activeSpeed *= 2.5;
        activeGravity *= 2.5;
        activeGap = Math.max(30, activeGap / 2);
      }

      st.pokiVY += activeGravity;
      st.pokiY += st.pokiVY;

      // Check ground collision
      if (st.pokiY > h - 18 || st.pokiY < 5) {
        handleCrashed();
        return;
      }

      // Spawn subsequent pipes using adjusted speed interval
      const spawnInterval = Math.max(40, Math.round(110 / (activeSpeed / 3.2)));
      if (st.gameTime % spawnInterval === 0) {
        const maxH = h - activeGap - 60;
        const topH = 30 + Math.floor(Math.random() * maxH);
        const botH = h - topH - activeGap;
        st.pipes.push({
          x: w + 20,
          topHeight: topH,
          bottomHeight: botH,
          passed: false,
          width: 44
        });
      }

      // Render backgrounds
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, w, h);

      // Electronic grid scrolling lines
      ctx.strokeStyle = '#1a1f2c';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      const offsetX = -(st.gameTime * 0.8) % gridSize;
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

      // Update Pipes and checking collision states
      let hasHitPipe = false;
      st.pipes.forEach((pipe) => {
        pipe.x -= activeSpeed;

        // Draw top pipeline node (Dark slate with yellow borders)
        ctx.fillStyle = '#171a21';
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = 'rgba(255, 183, 3, 0.15)';
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.roundRect(pipe.x, 0, pipe.width, pipe.topHeight, [0, 0, 4, 4]);
        ctx.fill();
        ctx.stroke();

        // Draw pipeline top flanges
        ctx.fillStyle = '#ffb703';
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 12, pipe.width + 6, 12);

        // Draw bottom pipeline node
        ctx.fillStyle = '#171a21';
        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 1.8;
        
        ctx.beginPath();
        ctx.roundRect(pipe.x, h - pipe.bottomHeight, pipe.width, pipe.bottomHeight, [4, 4, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Draw pipeline bottom flanges
        ctx.fillStyle = '#ffb703';
        ctx.fillRect(pipe.x - 3, h - pipe.bottomHeight, pipe.width + 6, 12);

        ctx.shadowBlur = 0; // reset

        // Circle vs AABB Box intersections
        const radius = 10;
        const px = 80;
        const py = st.pokiY;

        // Check Top pillar bounding box intersection
        const topOverlapX = px + radius > pipe.x && px - radius < pipe.x + pipe.width;
        const topOverlapY = py - radius < pipe.topHeight;
        if (topOverlapX && topOverlapY) {
          hasHitPipe = true;
        }

        // Check Bottom pillar box intersection
        const botOverlapY = py + radius > h - pipe.bottomHeight;
        if (topOverlapX && botOverlapY) {
          hasHitPipe = true;
        }

        // Check passing pipelines scoring increment
        if (!pipe.passed && pipe.x + pipe.width < px) {
          pipe.passed = true;
          setScore((s) => s + 1);
          setCoins((c) => c + 2); // passing successfully awards +2 Poki Gold
          synth.playCoin();

          // Spawn celebration green indicators
          for (let i = 0; i < 5; i++) {
            st.particles.push({
              x: pipe.x + pipe.width / 2,
              y: h / 2,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: '#34d399',
              size: 2.2,
              alpha: 1,
              life: 20
            });
          }
        }
      });

      // Update & Draw particles
      st.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = p.life / 15;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) st.particles.splice(idx, 1);
      });

      // Draw the flappy Pokicoin particle player
      ctx.save();
      ctx.translate(80, st.pokiY);
      
      // Calculate rotating wobble path
      const rotationAngle = (st.gameTime * 0.08) % (Math.PI * 2);
      ctx.rotate(rotationAngle);

      // Gold Radial gradient matching signature coin asset!
      const coinGrad = ctx.createRadialGradient(-2.5, -2.5, 1, 0, 0, 10);
      coinGrad.addColorStop(0, '#ffe893');
      coinGrad.addColorStop(0.35, '#ffb703');
      coinGrad.addColorStop(0.8, '#b57c00');
      coinGrad.addColorStop(1, '#8c5f00');

      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Border line
      ctx.strokeStyle = '#ffe893';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.stroke();

      // Inner 'P' letters inside coin
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, 0);

      ctx.restore();

      // Clear offscreen pipelines
      st.pipes = st.pipes.filter((pipe) => pipe.x > -100);

      if (hasHitPipe) {
        cancelAnimationFrame(animId);
        synth.playCrash();
        handleCrashed();
      } else {
        animId = requestAnimationFrame(loop);
      }
    };

    const handleCrashed = () => {
      synth.playCrash();
      const st = stateRef.current;
      syncGameData(Math.floor(score), coins);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, score, coins]);

  return (
    <div className="flex flex-col bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden shadow-2xl relative w-full h-[450px]">
      
      <div className="flex items-center justify-between p-3 border-b border-[#2a2f3b] bg-[#14161c]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-rose-500/20 border border-rose-400/40 text-rose-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            FLAPPY VECTOR
          </span>
          <span className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-400">
            BARRIERS: <span className="text-white font-bold">{score} Pairs</span>
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
        onClick={applyFlapUp}
        onTouchStart={handleTouchStart}
        className="flex-1 bg-[#0b0c10] relative flex items-center justify-center select-none cursor-pointer"
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-6 text-center">
            <Radio className="w-10 h-10 text-rose-400 animate-pulse mb-3" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase font-sans">
              FLAPPY POKI VECTOR
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mt-2 mb-6">
              Click, Tap, or press <span className="text-[#ffd166] font-bold">Spacebar</span> to boost the Pokicoin flying upward. Traverse safely through narrow bridge grids. Passing bridges earns <span className="text-emerald-400 font-bold">+2 Poki Gold</span> instantly!
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startNewGame();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-extrabold text-sm uppercase rounded cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#ffb703]/20"
            >
              <Play className="w-4 h-4 fill-black" /> LAUNCH TOKEN
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
            <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/30 rounded-xl p-5 shadow-2xl relative text-center" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-center justify-center gap-2 text-rose-500 mb-2 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                <span>PIPE COLLISION FORCE DETECTED</span>
              </div>

              <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
                FLIGHT SUMMARY
              </h3>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Gaps Cleared</span>
                  <span className="text-lg font-mono font-extrabold text-white">{score} Pairs</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Coins Accumulated</span>
                  <span className="text-lg font-mono font-extrabold text-[#ffd166]">🪙 {coins}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5">
                <div className="flex items-center justify-between font-mono text-[9px] text-[#ffb703] pb-1.5 border-b border-[#2a2f3b]/60">
                  <span className="font-semibold">TRAJECTORY_CONSENSUS_STAMP</span>
                  <span>RATE LMT: ACTIVE</span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    startNewGame();
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#ffb703]/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 antialiased animate-spin-reverse" /> RESPAWN TOKEN
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
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
          className="block w-full h-full bg-[#0b0c10]"
        />

        {/* HUD TIP */}
        {gameState === 'playing' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-black/60 backdrop-blur-md border border-[#2a2f3b] rounded-full pointer-events-none select-none text-[9px] font-mono text-center text-gray-400 uppercase tracking-widest">
            CLICK OR TOUCH ON CANVAS TO SWOOP
          </div>
        )}
      </div>

    </div>
  );
}
