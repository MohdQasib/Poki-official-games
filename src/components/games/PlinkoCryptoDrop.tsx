import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Play, Coins } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

export default function PlinkoCryptoDrop({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isStartingRef = useRef<boolean>(false);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [coins, setCoins] = useState<number>(0);
  const [stake, setStake] = useState<number>(10); // Standard deposit stake
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isDropping, setIsDropping] = useState<boolean>(false);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const [multiplierGained, setMultiplierGained] = useState<number>(0);

  // Trays at the bottom with standard color labels and payout values
  const buckets = [
    { label: '10x', mul: 10.0, color: '#ef4444' },
    { label: '3x', mul: 3.0, color: '#f59e0b' },
    { label: '1.5x', mul: 1.5, color: '#10b981' },
    { label: '0.5x', mul: 0.5, color: '#3b82f6' },
    { label: '0.2x', mul: 0.2, color: '#6b7280' },
    { label: '0.5x', mul: 0.5, color: '#3b82f6' },
    { label: '1.5x', mul: 1.5, color: '#10b981' },
    { label: '3x', mul: 3.0, color: '#f59e0b' },
    { label: '10x', mul: 10.0, color: '#ef4444' },
  ];

  // Peg rows parameters
  const pegRows = 8;
  const startRowPegs = 3;

  const stateRef = useRef({
    ball: null as { x: number; y: number; vx: number; vy: number; radius: number } | null,
    pegs: [] as Array<{ x: number; y: number; radius: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number; alpha: number }>,
    gameTime: 0,
  });

  // Setup static peg coordinates on load
  useEffect(() => {
    const st = stateRef.current;
    st.pegs = [];

    const cw = 440;
    const ch = 380;
    const spacingY = 28;
    const startY = 60;

    for (let r = 0; r < pegRows; r++) {
      const pegsInRow = startRowPegs + r;
      const rowY = startY + r * spacingY;
      const rowWidth = 32 * (pegsInRow - 1);
      const startX = (cw - rowWidth) / 2;

      for (let p = 0; p < pegsInRow; p++) {
        st.pegs.push({
          x: startX + p * 32,
          y: rowY,
          radius: 3.5,
        });
      }
    }
  }, []);

  // Handle resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = 440; // Maintain standard coordinates coordinate box for perfect physics consistency
        canvas.height = 380;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  const resetGameEngine = () => {
    setMultiplierGained(0);
    setActiveBucket(null);
    setSecuredTransaction(null);
    // Clear ball state
    stateRef.current.ball = null;
    stateRef.current.particles = [];
  };

  const dropNewCoin = () => {
    if (isDropping || isStartingRef.current) return;
    isStartingRef.current = true;

    resetGameEngine();

    if (!onDeductBalance(stake)) {
      alert('Insufficient Pokicoin balance for this Plinko drop.');
      isStartingRef.current = false;
      return;
    }
    synth.playJump();
    setIsDropping(true);
    setGameState('playing');

    // Spawn ball at the top middle with a slight random offset to guarantee variety of drops
    stateRef.current.ball = {
      x: 220 + (Math.random() - 0.5) * 16,
      y: 20,
      vx: (Math.random() - 0.5) * 1,
      vy: 1.2,
      radius: 7,
    };

    isStartingRef.current = false;
  };

  const syncGameData = (finalScore: number, coinsCollected: number) => {
    setGameState('syncing');
    setSyncStatus('REGISTERING PLINKO PAYOUT TRANSFERS...');
    try {
      synth.playLevelUp();
    } catch (e) {}

    setTimeout(() => {
      const timestamp = Date.now();
      const rawPayload = {
        client_uid: 'anonymous_peer_vector',
        score_distance: finalScore,
        poki_tokens_collected: coinsCollected,
        poki_tokens_earned: parseFloat((coinsCollected * 1.05).toFixed(8)),
        node_consensus_index: Math.floor(Math.random() * 900000 + 100000),
        rate_limit_token: btoa(`_plinko_${timestamp}_${finalScore}_${coinsCollected}`),
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

      setSyncStatus('PLINKO STAKE DISTRIBUTED!');
      setGameState('gameover');

      // Award payout and sync casino data
      onAwardBalance(coinsCollected);
      const profit = coinsCollected - stake;
      syncCasinoData('Plinko Crypto Drop', profit, parseFloat((pokiBalance + profit).toFixed(8)));
    }, 1000);
  };

  // Gameloop driver
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gravity = 0.16;
    const bounceFriction = 0.58;

    const loop = () => {
      const st = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      st.gameTime++;

      // Clear Screen
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, w, h);

      // Render aesthetic pin grids
      ctx.fillStyle = '#ffb703';
      st.pegs.forEach((peg) => {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius + 1.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Render Bucket Bins at bottom
      const bucketWidth = w / buckets.length;
      buckets.forEach((bVal, i) => {
        const xStart = i * bucketWidth;
        const isActive = activeBucket === i;

        // Draw tray container box
        ctx.fillStyle = isActive ? `${bVal.color}40` : '#171a21';
        ctx.strokeStyle = isActive ? bVal.color : '#2a2f3b';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(xStart + 3, h - 38, bucketWidth - 6, 32, 4);
        ctx.fill();
        ctx.stroke();

        // Print multiplier label
        ctx.fillStyle = isActive ? '#ffffff' : '#9ca3af';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bVal.label, xStart + bucketWidth / 2, h - 22);
      });

      // Physics update for active dropping Plinko ball
      if (st.ball) {
        const b = st.ball;
        b.vy += gravity;
        b.x += b.vx;
        b.y += b.vy;

        // Wall padding constraints
        if (b.x < b.radius) {
          b.x = b.radius;
          b.vx = -b.vx * bounceFriction;
          synth.playJump();
        }
        if (b.x > w - b.radius) {
          b.x = w - b.radius;
          b.vx = -b.vx * bounceFriction;
          synth.playJump();
        }

        // Emit trace glow paths
        if (st.gameTime % 2 === 0) {
          st.particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            color: '#ffb703',
            life: 18,
            alpha: 1
          });
        }

        // Circular Collision against static pegs pins
        st.pegs.forEach((peg) => {
          const dx = b.x - peg.x;
          const dy = b.y - peg.y;
          const dist = Math.hypot(dx, dy);
          const minDist = b.radius + peg.radius;

          if (dist < minDist) {
            // Push out of overlapping coordinate
            const nx = dx / dist; // normal unit
            const ny = dy / dist;

            b.x = peg.x + nx * minDist;
            b.y = peg.y + ny * minDist;

            // Reflect velocities
            const dot = b.vx * nx + b.vy * ny;
            b.vx = (b.vx - 2 * dot * nx) * bounceFriction;
            b.vy = (b.vy - 2 * dot * ny) * bounceFriction;

            // Add standard horizontal random friction perturbation to keep peg bounciness dynamic
            b.vx += (Math.random() - 0.5) * 0.4;
            b.vy += 0.05;

            synth.playCoin();

            // Emit coin collision splashes
            for (let i = 0; i < 3; i++) {
              st.particles.push({
                x: peg.x,
                y: peg.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: '#ffd166',
                life: 10,
                alpha: 1
              });
            }
          }
        });

        // Draw Dropping Gold Plinko Token
        ctx.save();
        ctx.translate(b.x, b.y);

        const coinGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, b.radius);
        coinGrad.addColorStop(0, '#ffe893');
        coinGrad.addColorStop(0.5, '#ffb703');
        coinGrad.addColorStop(1, '#8c5f00');

        ctx.fillStyle = coinGrad;
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffe893';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius - 1, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // Check landing in bucket tray
        if (b.y > h - 38) {
          const finishedIdx = Math.floor(b.x / bucketWidth);
          const landedBucketIdx = Math.max(0, Math.min(buckets.length - 1, finishedIdx));
          const trayHit = buckets[landedBucketIdx];

          setActiveBucket(landedBucketIdx);
          setMultiplierGained(trayHit.mul);
          
          const earned = Math.ceil(stake * trayHit.mul);
          setCoins(earned);

          st.ball = null;
          cancelAnimationFrame(animId);
          setIsDropping(false);
          syncGameData(Math.floor(stake * trayHit.mul * 10), earned);
        }
      }

      // Render flowing trace particles
      st.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.alpha = p.life / 18;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) st.particles.splice(idx, 1);
      });

      if (st.ball) {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, activeBucket, isDropping]);

  return (
    <div className="flex flex-col bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden shadow-2xl relative w-full h-[450px]">
      
      <div className="flex items-center justify-between p-3 border-b border-[#2a2f3b] bg-[#14161c]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            PLINKO CRYPTO DROP
          </span>
          <span className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin payout</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">DROP STAKE:</span>
            <select
              disabled={isDropping}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="bg-[#0b0c10] border border-[#2a2f3b] text-white px-2 py-0.5 rounded text-[11px] font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#ffb703] cursor-pointer"
            >
              <option value="5">5 POKI</option>
              <option value="10">10 POKI</option>
              <option value="20">20 POKI</option>
              <option value="50">50 POKI</option>
            </select>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
            title="Exit game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PLINKO BOARD VIEWPORT */}
      <div 
        ref={containerRef}
        className="flex-1 bg-[#0b0c10] relative flex items-center justify-center p-2"
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-6 text-center">
            <Coins className="w-10 h-10 text-amber-400 animate-bounce mb-3" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase font-sans">
              PLINKO CRYPTO DROP
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mt-2 mb-6">
              Drop a physics-simulated coin into the pegboard container! Bounces down and lands in any coefficient tray at the bottom (up to <span className="text-emerald-400 font-extrabold text-xs">10.0x Return multiplier</span>) to multiplier your deposit stake instantly!
            </p>
            <button
              onClick={dropNewCoin}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-extrabold text-sm uppercase rounded cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#ffb703]/20"
            >
              <Play className="w-4 h-4 fill-black" /> DROP CHIP NOW
            </button>
          </div>
        )}

        {gameState === 'syncing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <div className="w-12 h-12 rounded-full border-4 border-[#2a2f3b] border-t-[#ffb703] animate-spin mb-4" />
            <p className="text-xs font-mono text-[#ffb703] uppercase tracking-widest animate-pulse font-semibold flex items-center gap-2">
              <span>{syncStatus}</span>
            </p>
          </div>
        )}

        {/* CUSTOM PREMIUM GAME OVER MODAL FOR THE REWARD PAYOUT */}
        {gameState === 'gameover' && securedTransaction && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 overflow-y-auto">
            <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/30 rounded-xl p-5 shadow-2xl relative text-center">
              
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-2 font-mono text-[10px] uppercase tracking-widest font-bold animate-pulse">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>CHIP SETTLED IN REWARD SLOT</span>
              </div>

              <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
                PLINKO MULTIPLIER PAYOUT
              </h3>

              <div className="grid grid-cols-3 gap-2.5 my-4">
                <div className="bg-black/40 border border-[#2a2f3b] p-2.5 rounded">
                  <span className="text-[9px] font-mono text-gray-500 uppercase block">Drop Stake</span>
                  <span className="text-md font-mono font-extrabold text-[#ffd166]">{stake} POKI</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-2.5 rounded">
                  <span className="text-[9px] font-mono text-gray-500 uppercase block">Slot hit</span>
                  <span className="text-md font-mono font-extrabold text-sky-400">{multiplierGained}x</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-2.5 rounded">
                  <span className="text-[9px] font-mono text-gray-500 uppercase block">Total Earned</span>
                  <span className="text-md font-mono font-extrabold text-emerald-400">🪙 {coins}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5">
                <div className="flex items-center justify-between font-mono text-[9px] text-[#ffb703] pb-1.5 border-b border-[#2a2f3b]/60">
                  <span className="font-semibold">PROOF_PLINKO_MULTIPLIER</span>
                  <span>STATUS: CREDITED</span>
                </div>
                <p className="text-[9px] font-mono text-gray-400 mt-2 truncate">
                  TX_SHA: {securedTransaction.checksum}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={dropNewCoin}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#ffb703]/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 antialiased animate-spin-reverse" /> DROP AGAIN
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
          className="block bg-black/40 border-b border-[#2a2f3b] rounded"
        />

        {/* PLINKO DRIVER CONTROL PANEL */}
        {gameState === 'playing' && !isDropping && (
          <button 
            onClick={dropNewCoin}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-[#ffb703] hover:bg-[#ffd166] text-black font-extrabold text-xs uppercase rounded cursor-pointer transition shadow-lg flex items-center gap-1"
          >
            DROP NEXT CHIP
          </button>
        )}
      </div>

    </div>
  );
}
