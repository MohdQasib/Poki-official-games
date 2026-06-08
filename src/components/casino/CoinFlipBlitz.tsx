import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, X, Play, ShieldAlert, Award } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
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
  const [betAmount, setBetAmount] = useState<number>(10);
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
    const radius = 64;

    ctx.clearRect(0, 0, w, h);

    // Apply simulated 3D vertical perspective scale
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.0, Math.max(0.01, Math.sin(scaleY)));

    // Outer thick gold rim
    const gradient = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius);
    gradient.addColorStop(0, '#f1b822');
    gradient.addColorStop(1, '#9a6b0c');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner background
    if (currentFace === 'heads') {
      ctx.fillStyle = '#ffb703'; // Bright gold for Heads
    } else {
      ctx.fillStyle = '#171a21'; // Dark Matrix Slate for Tails
    }

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.88, 0, Math.PI * 2);
    ctx.fill();

    // Details/Icons labeled on coin faces
    ctx.fillStyle = currentFace === 'heads' ? '#171a21' : '#ffb703';
    ctx.font = 'bold 36px font-sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentFace === 'heads' ? 'P' : 'T', 0, 0);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  };

  const flipCoin = () => {
    if (gameState === 'flipping') return;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert('Specify a valid bet greater than 0.');
      return;
    }

    if (!onDeductBalance(parsedBet)) {
      alert('Insufficient Pokicoin balance.');
      return;
    }

    setGameState('flipping');
    synth.playCoin();

    // Outcome generator
    const targetSide = Math.random() < 0.5 ? 'heads' : 'tails';
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
          syncCasinoData('Coin Flip Blitz', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        } else {
          synth.playCrash();
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
