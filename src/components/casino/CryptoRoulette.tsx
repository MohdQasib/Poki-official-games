import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, X, Play, ShieldAlert, Award, Grid } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

interface Sector {
  id: number;
  color: string; // 'gold' | 'slate' | 'green'
  label: string;
}

export default function CryptoRoulette({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const isStartingRef = useRef<boolean>(false);

  const [gameState, setGameState] = useState<'idle' | 'spinning' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betType, setBetType] = useState<'gold' | 'slate' | 'green'>('gold');

  const [spinResult, setSpinResult] = useState<Sector | null>(null);
  const [payoutResult, setPayoutResult] = useState<{ win: boolean; amount: number; profit: number }>({ win: false, amount: 0, profit: 0 });

  // 15 slices matching requirements: 7 Gold (2x), 7 Dark-Slate (2x), 1 Green (14x)
  const sectors: Sector[] = [
    { id: 0, color: 'green', label: 'CYBER 0' },
    { id: 1, color: 'gold', label: 'GOLD 1' },
    { id: 2, color: 'slate', label: 'SLATE 2' },
    { id: 3, color: 'gold', label: 'GOLD 3' },
    { id: 4, color: 'slate', label: 'SLATE 4' },
    { id: 5, color: 'gold', label: 'GOLD 5' },
    { id: 6, color: 'slate', label: 'SLATE 6' },
    { id: 7, color: 'gold', label: 'GOLD 7' },
    { id: 8, color: 'slate', label: 'SLATE 8' },
    { id: 9, color: 'gold', label: 'GOLD 9' },
    { id: 10, color: 'slate', label: 'SLATE 10' },
    { id: 11, color: 'gold', label: 'GOLD 11' },
    { id: 12, color: 'slate', label: 'SLATE 12' },
    { id: 13, color: 'gold', label: 'GOLD 13' },
    { id: 14, color: 'slate', label: 'SLATE 14' },
  ];

  const totalSectors = sectors.length;
  const sectorAngle = (Math.PI * 2) / totalSectors;

  // Wheel angle state ref
  const angleRef = useRef<number>(0);

  // Draw Routine
  const drawWheel = (currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 20;

    ctx.clearRect(0, 0, w, h);

    // Draw wheel segments
    sectors.forEach((sec, idx) => {
      const startAngle = currentAngle + idx * sectorAngle;
      const endAngle = startAngle + sectorAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      // Cyber Colors
      if (sec.color === 'green') {
        ctx.fillStyle = '#10b981'; // Cyber Emerald
      } else if (sec.color === 'gold') {
        ctx.fillStyle = '#ffb703'; // Neon Gold
      } else {
        ctx.fillStyle = '#171a21'; // Dark Slate
      }
      ctx.fill();

      // Border lines
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label Text rotated inside segment
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sectorAngle / 2);
      ctx.fillStyle = sec.color === 'gold' ? '#000000' : '#ffffff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(sec.label.split(' ')[1], radius - 15, 3);
      ctx.restore();
    });

    // Draw Outer rim
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary core cap inner cylinder
    ctx.fillStyle = '#0b0c10';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a2f3b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Small Gold Central Dot
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Top Pointer Needle
    ctx.fillStyle = '#ffb703';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - radius - 5);
    ctx.lineTo(cx + 10, cy - radius - 5);
    ctx.lineTo(cx, cy - radius + 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const resetGameEngine = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setSpinResult(null);
    setPayoutResult({ win: false, amount: 0, profit: 0 });
  };

  const spinWheel = () => {
    if (gameState === 'spinning' || isStartingRef.current) return;
    isStartingRef.current = true;

    resetGameEngine();

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert('Specify a valid bet greater than 0.');
      isStartingRef.current = false;
      return;
    }

    if (!onDeductBalance(parsedBet)) {
      alert('Insufficient Pokicoin balance.');
      isStartingRef.current = false;
      return;
    }

    setGameState('spinning');
    synth.playCoin();
    isStartingRef.current = false;

    // Select random sector outcome
    const targetIdx = Math.floor(Math.random() * totalSectors);
    const targetSector = sectors[targetIdx];

    // Compute stopping angle so that target segment lands at top pointer (angle = -Math.PI / 2)
    // Formula: -Math.PI / 2 = currentAngle + targetIdx * sectorAngle + sectorAngle / 2
    const targetSectorOffset = targetIdx * sectorAngle + sectorAngle / 2;
    const finalAngle = -Math.PI / 2 - targetSectorOffset + Math.PI * 8; // spin multiple rotations

    const startAngle = angleRef.current % (Math.PI * 2);
    const spinDur = 3500; // 3.5 seconds
    const spinStart = Date.now();

    let lastTickAngle = startAngle;

    const runSpin = () => {
      const elapsed = Date.now() - spinStart;
      const progress = Math.min(1.0, elapsed / spinDur);
      
      // Deceleration easing function (standard power progress easeOut)
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + ease * (finalAngle - startAngle);
      angleRef.current = currentAngle;

      drawWheel(currentAngle);

      // Play click sounds on segment boundaries
      const currentRelativeAngle = currentAngle % (Math.PI * 2);
      if (Math.abs(currentRelativeAngle - lastTickAngle) >= sectorAngle) {
        synth.playJump(); // tick sound
        lastTickAngle = currentRelativeAngle;
      }

      if (progress < 1.0) {
        animRef.current = requestAnimationFrame(runSpin);
      } else {
        // SPIN COMPLETED!
        setSpinResult(targetSector);
        
        // Payout evaluation
        let isWin = false;
        let mult = 2;
        if (targetSector.color === 'green') {
          mult = 14;
        }

        if (betType === targetSector.color) {
          isWin = true;
        }

        const payoutVal = isWin ? parseFloat((parsedBet * mult).toFixed(8)) : 0;
        const netProfit = isWin ? parseFloat((payoutVal - parsedBet).toFixed(8)) : -parsedBet;

        setPayoutResult({ win: isWin, amount: payoutVal, profit: netProfit });
        setGameState('settled');

        if (isWin) {
          synth.playLevelUp();
          onAwardBalance(payoutVal);
          syncCasinoData('Crypto Roulette', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        } else {
          synth.playCrash();
          syncCasinoData('Crypto Roulette', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        }
      }
    };

    animRef.current = requestAnimationFrame(runSpin);
  };

  useEffect(() => {
    drawWheel(0);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-12-roulette">
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">CRYPTO ROULETTE</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">THE TECH WHEEL MODULE</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Interactive Canvas */}
        <div className="relative bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden p-6 aspect-square flex items-center justify-center w-full max-w-[280px] mx-auto md:max-w-none">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="w-full h-full max-w-[260px] max-h-[260px]"
          />

          {/* Results Reveal Inside Canvas Shield */}
          {gameState === 'settled' && spinResult && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-10 p-4 text-center animate-fade-in">
              {payoutResult.win ? (
                <Award className="w-12 h-12 text-emerald-400 animate-pulse mb-1.5" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-red-400 animate-bounce mb-1.5" />
              )}
              <h2 className="text-white font-mono font-extrabold text-xl mb-1 uppercase tracking-wide">
                LANDED ON {spinResult.label}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border uppercase ${
                spinResult.color === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                spinResult.color === 'gold' ? 'bg-[#ffb703]/10 text-[#ffb703] border-[#ffb703]/20' :
                'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}>
                {spinResult.color} Color
              </span>

              <div className="mt-4 text-sm font-mono text-gray-300">
                {payoutResult.win ? (
                  <p className="font-bold text-emerald-400">WIN PAYOUT: +{payoutResult.amount.toFixed(4)} POKI</p>
                ) : (
                  <p className="text-red-400">LOST: -{betAmount} POKI</p>
                )}
              </div>

              <button
                onClick={() => setGameState('idle')}
                className="mt-5 px-5 py-2 bg-[#ffb703] text-black font-mono font-bold text-xs uppercase rounded cursor-pointer transition active:scale-95"
              >
                SPIN AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Right: Betting Controls */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            {/* Bet Type Selection */}
            <div>
              <span className="block text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase mb-1.5">
                SELECT CRYPTO OPTION
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {/* Gold Selector */}
                <button
                  type="button"
                  disabled={gameState === 'spinning'}
                  onClick={() => { synth.playCoin(); setBetType('gold'); }}
                  className={`border py-2.5 rounded text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                    betType === 'gold'
                      ? 'bg-[#ffb703] text-black border-[#ffb703]'
                      : 'bg-[#0b0c10] text-[#ffb703] border-[#2a2f3b] hover:border-[#ffb703]/50'
                  }`}
                >
                  <span className="text-xs font-extrabold">GOLD</span>
                  <span className="text-[8px] font-mono tracking-wider opacity-90">(2x multiplier)</span>
                </button>

                {/* Slate Selector */}
                <button
                  type="button"
                  disabled={gameState === 'spinning'}
                  onClick={() => { synth.playCoin(); setBetType('slate'); }}
                  className={`border py-2.5 rounded text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                    betType === 'slate'
                      ? 'bg-white text-black border-white'
                      : 'bg-[#0b0c10] text-gray-400 border-[#2a2f3b] hover:border-white/50'
                  }`}
                >
                  <span className="text-xs font-extrabold">SLATE</span>
                  <span className="text-[8px] font-mono tracking-wider opacity-90">(2x multiplier)</span>
                </button>

                {/* Green Selector */}
                <button
                  type="button"
                  disabled={gameState === 'spinning'}
                  onClick={() => { synth.playCoin(); setBetType('green'); }}
                  className={`border py-2.5 rounded text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                    betType === 'green'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-[#0b0c10] text-emerald-400 border-[#2a2f3b] hover:border-emerald-500/50'
                  }`}
                >
                  <span className="text-xs font-extrabold">CYBER G</span>
                  <span className="text-[8px] font-mono tracking-wider opacity-90">(14x multiplier)</span>
                </button>
              </div>
            </div>

            {/* Stake Input Row */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase mb-1.5">
                Bet Stake Amount (POKI)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  disabled={gameState === 'spinning'}
                  value={betAmount === 0 ? '' : betAmount}
                  onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
                  className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2 text-sm font-mono focus:border-[#ffb703]/50 focus:outline-none w-full"
                />
                <div className="flex gap-1">
                  <button
                    disabled={gameState === 'spinning'}
                    onClick={() => setBetAmount((prev) => Math.floor(prev / 2) || 1)}
                    className="bg-[#0b0c10] hover:bg-[#20242e] border border-[#2a2f3b] text-gray-400 font-mono text-[10px] rounded px-2 transition cursor-pointer"
                  >
                    1/2
                  </button>
                  <button
                    disabled={gameState === 'spinning'}
                    onClick={() => setBetAmount((prev) => prev * 2)}
                    className="bg-[#0b0c10] hover:bg-[#20242e] border border-[#2a2f3b] text-gray-400 font-mono text-[10px] rounded px-2 transition cursor-pointer"
                  >
                    2x
                  </button>
                </div>
              </div>
              <span className="text-[9.5px] text-gray-500 font-mono mt-1 block">
                Poki Wallet Balance: {pokiBalance.toFixed(8)} POKI
              </span>
            </div>
          </div>

          <button
            onClick={spinWheel}
            disabled={gameState === 'spinning'}
            className="w-full py-3.5 mt-5 bg-[#ffb703] hover:brightness-110 active:scale-98 transition text-black font-sans font-extrabold text-sm uppercase rounded tracking-wider shadow-lg shadow-[#ffb703]/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-black" />
            ACTIVATE CONCENTRIC SPIN
          </button>
        </div>
      </div>
    </div>
  );
}
