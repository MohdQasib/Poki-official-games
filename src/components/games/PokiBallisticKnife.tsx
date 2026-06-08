import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Radio, Play } from 'lucide-react';

interface GameProps {
  onSessionComplete: (session: any) => void;
  uid: string;
  onClose: () => void;
}

export default function PokiBallisticKnife({ onSessionComplete, uid, onClose }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // limited knives count to throw for current stage
  const [knivesLeft, setKnivesLeft] = useState<number>(7);

  const stateRef = useRef({
    wheelAngle: 0,
    wheelSpeed: 0.038,
    speedFluctuateTimer: 0,
    knivesLeftCount: 7,
    embeddedKnives: [] as Array<{ angle: number }>, // Angle relative to the wheel
    activeKnife: null as { y: number; vy: number } | null,
    targetCoins: [] as Array<{ angle: number; radius: number; collected: boolean }>, // Stuck coins
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number }>,
    gameTime: 0,
    stageLevel: 1,
  });

  // Resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = 440;
        canvas.height = 380;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  const handleThrowKnife = () => {
    if (gameState !== 'playing') return;
    const st = stateRef.current;
    if (st.activeKnife || st.knivesLeftCount <= 0) return;

    // Launch a knife straight up from bottom
    st.activeKnife = {
      y: 340,
      vy: -14, // velocity
    };
    synth.playJump();
  };

  const startNewGame = () => {
    synth.playCoin();
    setScore(0);
    setCoins(0);
    setSecuredTransaction(null);
    setSyncStatus('');
    setKnivesLeft(7);

    // Stuck coin offsets
    const coinsList = [];
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      coinsList.push({
        angle: (i * (Math.PI * 2 / count)) + Math.random() * 0.4,
        radius: 65,
        collected: false
      });
    }

    stateRef.current = {
      wheelAngle: 0,
      wheelSpeed: 0.035,
      speedFluctuateTimer: 0,
      knivesLeftCount: 7,
      embeddedKnives: [],
      activeKnife: null,
      targetCoins: coinsList,
      particles: [],
      gameTime: 0,
      stageLevel: 1,
    };

    setGameState('playing');
  };

  const syncGameData = (finalScore: number, coinsCollected: number) => {
    setGameState('syncing');
    setSyncStatus('RECORDING WHEEL KNIVES CONVERGENCE...');
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

      setSyncStatus('KNIVES LEDGER STAMP FINISHED');
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
    if (gameState !== 'playing') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerY = 135;
    const centerX = 220;
    const wheelRadius = 65;

    const loop = () => {
      const st = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      st.gameTime++;
      st.speedFluctuateTimer++;

      // Speed fluctuation logic to simulate real fluctuating coin wheel speed
      if (st.speedFluctuateTimer % 110 === 0) {
        st.wheelSpeed = (0.02 + Math.random() * 0.045) * (Math.random() > 0.45 ? 1 : -1);
      }
      st.wheelAngle += st.wheelSpeed;

      // Update Flying Knife
      let gameOverHit = false;
      let nextStageTrigger = false;

      if (st.activeKnife) {
        const k = st.activeKnife;
        k.y += k.vy;

        // Check reach wheel center boundary
        if (k.y <= centerY + wheelRadius) {
          // Collision angle! Relative to the wheel's current rotation angle
          // We hit the wheel vertically from underneath, so the hit point is at angle Math.PI / 2
          const targetAngle = (Math.PI / 2) - st.wheelAngle;

          // Check if it overlaps with any already embedded knives
          const overlapThreshold = 0.16; // Approx 9 degrees
          let hitExisting = false;
          st.embeddedKnives.forEach((oldKf) => {
            // Normalize angles between [-PI, PI] for precision comparison
            const diff = Math.atan2(Math.sin(oldKf.angle - targetAngle), Math.cos(oldKf.angle - targetAngle));
            if (Math.abs(diff) < overlapThreshold) {
              hitExisting = true;
            }
          });

          if (hitExisting) {
            gameOverHit = true;
          } else {
            // Embedded successfully!
            synth.playCoin();
            st.embeddedKnives.push({ angle: targetAngle });
            st.knivesLeftCount--;
            setKnivesLeft(st.knivesLeftCount);
            setScore((s) => s + 200);

            // Check coin hit targets stuck to the wheel
            st.targetCoins.forEach((coin) => {
              if (coin.collected) return;
              const diff = Math.atan2(Math.sin(coin.angle - targetAngle), Math.cos(coin.angle - targetAngle));
              if (Math.abs(diff) < 0.22) {
                // Coin Hit!
                coin.collected = true;
                setCoins((c) => c + 1);
                setScore((s) => s + 500);
                synth.playCoin();

                // Sparkles splash
                for (let i = 0; i < 5; i++) {
                  st.particles.push({
                    x: centerX,
                    y: centerY + wheelRadius,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    color: '#ffb703',
                    size: 2.5,
                    alpha: 1,
                    life: 20
                  });
                }
              }
            });

            // Splatter spark particles
            for (let i = 0; i < 4; i++) {
              st.particles.push({
                x: centerX,
                y: centerY + wheelRadius - 3,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 2 + 2,
                color: '#ffffff',
                size: 1.5,
                alpha: 1,
                life: 14
              });
            }

            st.activeKnife = null; // Reset projectile

            // Check if stage cleared
            if (st.knivesLeftCount <= 0) {
              nextStageTrigger = true;
            }
          }
        }
      }

      // Progress stage on clearance
      if (nextStageTrigger) {
        st.stageLevel++;
        st.knivesLeftCount = 7 + st.stageLevel;
        setKnivesLeft(st.knivesLeftCount);
        st.embeddedKnives = [];
        
        // Spawn fresh target coins stuck elements
        const coinsList = [];
        const count = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          coinsList.push({
            angle: (i * (Math.PI * 2 / count)) + Math.random() * 0.4,
            radius: 65,
            collected: false
          });
        }
        st.targetCoins = coinsList;
        synth.playLevelUp();
      }

      // Render Screen
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, w, h);

      // Aesthetic background lines grids
      ctx.strokeStyle = '#141821';
      ctx.lineWidth = 0.5;
      const spacingVal = 40;
      for (let x = 0; x < w; x += spacingVal) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += spacingVal) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Spinning Wheel central circle with cyber neon-borders
      const visualAng = st.wheelAngle;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(visualAng);

      // Main wheel slate panel
      ctx.fillStyle = '#171a21';
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spinning inner decals lines
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const theta = i * (Math.PI / 4);
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(theta) * wheelRadius, Math.sin(theta) * wheelRadius);
      }
      ctx.stroke();

      // Center gold cap
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Target coins stuck to the surface of the wheel
      st.targetCoins.forEach((coin) => {
        if (coin.collected) return;
        const cx = Math.cos(coin.angle) * coin.radius;
        const cy = Math.sin(coin.angle) * coin.radius;

        ctx.save();
        ctx.translate(cx, cy);
        
        ctx.fillStyle = '#ffb703';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });

      // Render Embedded knives sticking out
      st.embeddedKnives.forEach((kf) => {
        const kx = Math.cos(kf.angle) * (wheelRadius + 6);
        const ky = Math.sin(kf.angle) * (wheelRadius + 6);
        
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(kf.angle + Math.PI / 2); // Orient outward

        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 16); // Blade sticking out
        ctx.stroke();

        // gold handle
        ctx.strokeStyle = '#dfa100';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.lineTo(0, 24);
        ctx.stroke();

        ctx.restore();
      });

      ctx.restore();

      // Draw Flying Projectile active Knife underneath
      if (st.activeKnife) {
        ctx.save();
        ctx.translate(centerX, st.activeKnife.y);

        ctx.strokeStyle = '#ff3b30'; // Red target laser guide
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, -100);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 4);
        ctx.stroke();

        ctx.strokeStyle = '#8c5f00';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(0, 12);
        ctx.stroke();

        ctx.restore();
      } else if (st.knivesLeftCount > 0) {
        // Draw weapon standby indicator loading at bottom center
        ctx.save();
        ctx.translate(centerX, 335);
        ctx.globalAlpha = 0.55;

        ctx.strokeStyle = '#ffb703';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(0, 4);
        ctx.stroke();

        ctx.restore();
      }

      // Render glowing trail particles
      st.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = p.life / 20;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) st.particles.splice(idx, 1);
      });

      if (gameOverHit) {
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
          <span className="text-[10px] bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            BALLISTIC KNIFE
          </span>
          <span className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-[#ffb703] font-bold">
            MUNITION LEFT: <span className="text-white bg-black px-2 py-0.5 rounded border border-[#2a2f3b] font-mono text-center inline-block w-8 font-extrabold">{knivesLeft}</span>
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
        onClick={handleThrowKnife}
        className="flex-1 bg-[#0b0c10] relative flex items-center justify-center select-none cursor-pointer p-4"
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-6 text-center">
            <Radio className="w-10 h-10 text-indigo-400 animate-pulse mb-3" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase font-sans">
              POKI BALLISTIC KNIFE
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mt-2 mb-6 font-sans">
              Tap or click the screen to throw ballistic knives straight up into the spinning crypto-wheel. Avoid striking any knives that are already embedded. Catch stuck coins for jackpot payouts!
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startNewGame();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-extrabold text-sm uppercase rounded cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#ffb703]/20"
            >
              <Play className="w-4 h-4 fill-black" /> ENGAGE CYCLER
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

        {/* CUSTOM PREMIUM GAME OVER REPORT OVERLAY */}
        {gameState === 'gameover' && securedTransaction && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 overflow-y-auto">
            <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/30 rounded-xl p-5 shadow-2xl relative text-center" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex items-center justify-center gap-2 text-rose-500 mb-2 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                <span>FAULT: DEFLECTIVE BLADE INTERACTION</span>
              </div>

              <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
                WHEEL STRIKE METRICS
              </h3>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Impact Score</span>
                  <span className="text-lg font-mono font-extrabold text-white">{score} XP</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Coins Settled</span>
                  <span className="text-lg font-mono font-extrabold text-[#ffd166]">🪙 {coins}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5 animate-slideUp">
                <div className="flex items-center justify-between font-mono text-[9px] text-[#ffb703] pb-1.5 border-b border-[#2a2f3b]/60">
                  <span className="font-semibold">PROOF_BALLISTIC_CONVERGENCE</span>
                  <span>STATUS: FILED</span>
                </div>
                <p className="text-[9px] font-mono text-gray-400 mt-2 truncate">
                  SHA-HASH: {securedTransaction.checksum}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startNewGame();
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#ffb703]/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 antialiased animate-spin-reverse" /> RESPIN CYCLER
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
          className="block w-full h-[320px] bg-black/40 rounded border border-[#282d3b]"
        />

        {/* TIP OVERLAY */}
        {gameState === 'playing' && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-black/60 border border-[#2a2f3b] rounded-full pointer-events-none text-[8.5px] font-mono text-center text-gray-400 uppercase tracking-widest leading-none">
            TAP SCREEN TO FIRE CHARGED PIN
          </div>
        )}
      </div>

    </div>
  );
}
