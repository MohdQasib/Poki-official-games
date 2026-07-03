import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Radio, Play, ChevronDown } from 'lucide-react';

interface GameProps {
  onSessionComplete: (session: any) => void;
  uid: string;
  onClose: () => void;
}

export default function PokiTowerStacker({ onSessionComplete, uid, onClose }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const stateRef = useRef({
    stack: [] as Array<{ x: number; w: number; y: number; color: string }>,
    currentBlock: { x: 0, w: 140, dx: 3.5, y: 340 },
    blockHeight: 18,
    cameraOffset: 0,
    gameTime: 0,
    speedMultiplier: 1.0,
    sessionStartTime: 0,
  });

  // Resizing canvas
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = 440; // Pin dimensions for robust collision math
        canvas.height = 380;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // Drop stack blocks via Spacebar key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        dropActiveBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const dropActiveBlock = () => {
    if (gameState !== 'playing') return;

    const st = stateRef.current;
    const baseBlock = st.stack[st.stack.length - 1];

    if (!baseBlock) {
      // First base block landing, perfectly allowed
      st.stack.push({
        x: st.currentBlock.x,
        w: st.currentBlock.w,
        y: st.currentBlock.y,
        color: '#ffb703',
      });
      advanceToNextLevel();
      return;
    }

    // Alignment bounds calculations with standard overhang slicing
    const leftBound = baseBlock.x;
    const rightBound = baseBlock.x + baseBlock.w;
    
    const currLeft = st.currentBlock.x;
    const currRight = st.currentBlock.x + st.currentBlock.w;

    // Check complete miss
    if (currRight < leftBound || currLeft > rightBound) {
      handleMissedAll();
      return;
    }

    // Alignment and chopping math!
    let nextLeft = Math.max(leftBound, currLeft);
    let nextRight = Math.min(rightBound, currRight);
    let sliceWidth = nextRight - nextLeft;

    if (sliceWidth <= 2) {
      handleMissedAll();
      return;
    }

    // Build landing block
    st.stack.push({
      x: nextLeft,
      w: sliceWidth,
      y: st.currentBlock.y,
      color: '#ffb703',
    });

    synth.playCoin();
    setScore((s) => s + 1);
    setCoins((c) => c + 2); // Each success stack awards +2 Pokicoins

    // Check if block size or speed should be scaled
    st.currentBlock.w = sliceWidth;
    advanceToNextLevel();
  };

  const advanceToNextLevel = () => {
    const st = stateRef.current;
    const h = 380;
    
    // Position of next block
    const nextY = st.currentBlock.y - st.blockHeight;

    // Update Speed multiplier slightly corresponding to tower altitude
    const currentHeight = st.stack.length;
    let extraSpeedFactor = 1.0;
    if (currentHeight >= 8) {
      extraSpeedFactor = 1.0 + (currentHeight - 7) * 0.35;
    }
    if (currentHeight >= 12) {
      extraSpeedFactor = 2.4 + (currentHeight - 11) * 0.75;
    }
    if (currentHeight >= 15) {
      extraSpeedFactor = 5.5 + (currentHeight - 14) * 1.8;
    }
    st.speedMultiplier = (1.0 + currentHeight * 0.08) * extraSpeedFactor;

    // Slide camera coordinates downward to keep top blocks within viewscreen bounds
    let scrollAmt = 0;
    if (nextY < 120) {
      scrollAmt = st.blockHeight;
      st.cameraOffset += scrollAmt;

      // Translate all existing stack items down
      st.stack.forEach((b) => {
        b.y += scrollAmt;
      });
    }

    // Set new drop block at top
    st.currentBlock = {
      x: 10 + Math.random() * 80,
      w: st.currentBlock.w,
      dx: (2.5 + Math.random() * 1.5) * (Math.random() < 0.5 ? -1 : 1) * st.speedMultiplier,
      y: st.stack[st.stack.length - 1].y - st.blockHeight,
    };
  };

  const handleMissedAll = () => {
    synth.playCrash();
    syncGameData(score, coins);
  };

  const startNewGame = () => {
    synth.playCoin();
    setScore(0);
    setCoins(0);
    setSecuredTransaction(null);
    setSyncStatus('');

    // Prepopulate safe starting base level anchor coordinates
    const baseW = 180;
    const base = {
      x: (440 - baseW) / 2,
      w: baseW,
      y: 350,
      color: '#171a21',
    };

    stateRef.current = {
      stack: [base],
      currentBlock: { x: 30, w: baseW, dx: 3.2, y: 350 - 18 },
      blockHeight: 18,
      cameraOffset: 0,
      gameTime: 0,
      speedMultiplier: 1.0,
      sessionStartTime: Date.now(),
    };

    setGameState('playing');
  };

  const syncGameData = (finalScore: number, coinsCollected: number) => {
    setGameState('syncing');
    setSyncStatus('RECORDING TIMING STACK BALANCES...');
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

      setSyncStatus('STACK LEDGER BLOCK LOCKED!');
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

    const loop = () => {
      const st = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      const sessionTimeElapsed = (Date.now() - (st.sessionStartTime || Date.now())) / 1000;
      let timeMultiplier = 1.0;
      if (sessionTimeElapsed <= 45) {
        timeMultiplier = 1.0;
      } else if (sessionTimeElapsed <= 80) {
        timeMultiplier = 1.5;
      } else {
        timeMultiplier = 3.5;
      }

      st.gameTime++;

      // Horizontal block animation move
      st.currentBlock.x += st.currentBlock.dx * timeMultiplier;
      if (st.currentBlock.x < 10 || st.currentBlock.x + st.currentBlock.w > w - 10) {
        st.currentBlock.dx *= -1; // bounce walls
      }

      // Render Screen
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, w, h);

      // Aesthetic wire grid vector lines
      ctx.strokeStyle = '#151921';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      const scrollYOffset = st.cameraOffset % gridSize;
      for (let y = scrollYOffset; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Render Stack structure
      st.stack.forEach((b, idx) => {
        const isBase = idx === 0;
        
        ctx.fillStyle = isBase ? '#171a21' : '#ffb703';
        ctx.strokeStyle = isBase ? '#2a2f3b' : '#ffe893';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, st.blockHeight - 1.5, 2);
        ctx.fill();
        ctx.stroke();

        // Shiny gold texture accent
        if (!isBase) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(b.x + 2, b.y + 1, b.w - 4, 3);
        }
      });

      // Render Moving slide block
      const cb = st.currentBlock;
      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#df9e00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cb.x, cb.y, cb.w, st.blockHeight - 1.5, 2);
      ctx.fill();
      ctx.stroke();

      // Shiny upper highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cb.x + 2, cb.y + 1, cb.w - 4, 3);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="flex flex-col bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden shadow-2xl relative w-full h-[450px]">
      
      <div className="flex items-center justify-between p-3 border-b border-[#2a2f3b] bg-[#14161c]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-rose-500/20 border border-rose-400/40 text-rose-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            TOWER STACKER
          </span>
          <span className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-400 font-bold uppercase">
            ALTITUDE STACKED: <span className="text-white">{score} Stages</span>
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

      {/* TOWER VIEWPORT */}
      <div 
        ref={containerRef}
        onClick={dropActiveBlock}
        className="flex-1 bg-[#0b0c10] relative flex items-center justify-center select-none cursor-pointer p-4"
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-6 text-center">
            <Radio className="w-10 h-10 text-rose-400 animate-pulse mb-3" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase font-sans">
              POKI TOWER STACKER
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mt-2 mb-6">
              Align the moving blocks perfectly on top of each other! Click, tap the viewport, or click <span className="text-[#ffd166] font-bold">Spacebar</span> to drop. Overhang borders are chopped off, making the target stacking plane narrower. Completely miss and it's game over!
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startNewGame();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-extrabold text-sm uppercase rounded cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#ffb703]/20"
            >
              <Play className="w-4 h-4 fill-black" /> STACK CORE BLOCKS
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
                <span>STACK COLLAPSED - HIGH OVERHANG CUTOFF</span>
              </div>

              <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
                TOWER RE-ENTRY STICKER
              </h3>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Stacked Blocks</span>
                  <span className="text-lg font-mono font-extrabold text-white">{score} blocks</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Coins Settled</span>
                  <span className="text-lg font-mono font-extrabold text-[#ffd166]">🪙 {coins}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5">
                <div className="flex items-center justify-between font-mono text-[9px] text-[#ffb703] pb-1.5 border-b border-[#2a2f3b]/60">
                  <span className="font-semibold">PROOF_TOWER_STACK_SEDIMENT</span>
                  <span>STATUS: ANCHORED</span>
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
                  <RefreshCw className="w-3.5 h-3.5 antialiased animate-spin-reverse" /> drop another anchor
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="flex-1 py-2.5 bg-[#0b0c10] border border-[#2a2f3b] text-white hover:bg-[#1a1d26] font-extrabold text-xs uppercase rounded transition-all cursor-pointer"
                >
                  FORFEIT TOWER
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

        {/* HUD TIP */}
        {gameState === 'playing' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 p-3 bg-black/70 rounded-full flex items-center gap-1.5 border border-[#2a2f3b] pointer-events-none text-[9px] font-mono uppercase text-gray-400 select-none tracking-widest leading-none">
            <ChevronDown className="w-3 h-3 text-[#ffb703] animate-bounce" /> Click to lock block positions
          </div>
        )}

      </div>

    </div>
  );
}
