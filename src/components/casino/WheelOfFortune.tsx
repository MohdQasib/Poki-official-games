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
  mult: number;
  color: string;
  label: string;
}

export default function WheelOfFortune({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'spinning' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);

  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [payoutResult, setPayoutResult] = useState<{ amount: number; profit: number }>({ amount: 0, profit: 0 });

  // 10 segments comprising our Wheel of Fortune risk distribution:
  const sectors: Sector[] = [
    { mult: 0.0, color: '#f33d5e', label: '0x BUST' },
    { mult: 1.2, color: '#161920', label: '1.2x RECOV' },
    { mult: 0.5, color: '#e07a5f', label: '0.5x HALF' },
    { mult: 2.0, color: '#ffb703', label: '2.0x DOUBLE' },
    { mult: 0.0, color: '#f33d5e', label: '0x BUST' },
    { mult: 1.2, color: '#161920', label: '1.2x RECOV' },
    { mult: 5.0, color: '#4ea8de', label: '5.0x SUPER' },
    { mult: 0.5, color: '#e07a5f', label: '0.5x HALF' },
    { mult: 1.2, color: '#161920', label: '1.2x RECOV' },
    { mult: 50.0, color: '#ffb703', label: '50x JACKPOT' },
  ];

  const totalSectors = sectors.length;
  const sectorAngle = (Math.PI * 2) / totalSectors;

  // Track rotational angle
  const angleRef = useRef<number>(0);

  const drawWheel = (currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width || 320;
    const displayHeight = rect.height || 320;

    if (canvas.width !== Math.floor(displayWidth * dpr) || canvas.height !== Math.floor(displayHeight * dpr)) {
      canvas.width = Math.floor(displayWidth * dpr);
      canvas.height = Math.floor(displayHeight * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const cx = displayWidth / 2;
    const cy = displayHeight / 2;
    const radius = Math.min(cx, cy) - 24; // Generous margin to prevent needle top clipping

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw individual sectors
    sectors.forEach((sec, idx) => {
      const startAngle = currentAngle + idx * sectorAngle;
      const endAngle = startAngle + sectorAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = sec.color;
      ctx.fill();

      // Inner cylinder divider line
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Segment text labeled with precise multiplier
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sectorAngle / 2);
      ctx.fillStyle = sec.mult === 0 ? '#ffffff' : sec.color === '#ffb703' ? '#0b0c10' : '#efeef1';
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(sec.label, radius - 15, 3.5);
      ctx.restore();
    });

    // Draw Outer glowing steel rim
    ctx.strokeStyle = '#2a2f3b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Central structural cylinder cover
    ctx.fillStyle = '#0b0c10';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a2f3b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    // Center Golden Circle
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Sights Pointer Needle
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

    ctx.restore();
  };

  const spinWheel = () => {
    if (gameState === 'spinning') return;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Bet size is invalid.");
      return;
    }

    if (!onDeductBalance(parsedBet)) {
      alert("Insufficient funds in Pokicoin.");
      return;
    }

    setGameState('spinning');
    synth.playCoin();

    // Pick winning index
    const winningIdx = Math.floor(Math.random() * totalSectors);
    const winningSector = sectors[winningIdx];

    // Align stopping angle to top pinpoint (-Math.PI / 2)
    const segmentCenterOffset = winningIdx * sectorAngle + sectorAngle / 2;
    const stopAngle = -Math.PI / 2 - segmentCenterOffset + Math.PI * 10; // extra spins

    const startRot = angleRef.current % (Math.PI * 2);
    const duration = 4000; // 4 seconds spin decay
    const startTimeElapsed = Date.now();

    let lastTickAngle = startRot;

    const rotateAnimation = () => {
      const elapsed = Date.now() - startTimeElapsed;
      const pct = Math.min(1.0, elapsed / duration);

      // Decerlation easeOut
      const ease = 1 - Math.pow(1 - pct, 4);
      const angle = startRot + ease * (stopAngle - startRot);
      angleRef.current = angle;

      drawWheel(angle);

      // Play tick sound when sector boundary crossed
      const currentRelative = angle % (Math.PI * 2);
      if (Math.abs(currentRelative - lastTickAngle) >= sectorAngle) {
        synth.playJump();
        lastTickAngle = currentRelative;
      }

      if (pct < 1.0) {
        animRef.current = requestAnimationFrame(rotateAnimation);
      } else {
        // SPIN COMPLETED!
        setSelectedMultiplier(winningSector.mult);

        const payoutVal = parseFloat((parsedBet * winningSector.mult).toFixed(8));
        const netProfit = parseFloat((payoutVal - parsedBet).toFixed(8));

        setPayoutResult({ amount: payoutVal, profit: netProfit });
        setGameState('settled');

        if (winningSector.mult > 1.0) {
          synth.playLevelUp();
          onAwardBalance(payoutVal);
          syncCasinoData('Wheel of Fortune', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        } else {
          synth.playCrash();
          if (payoutVal > 0) {
             onAwardBalance(payoutVal);
          }
          syncCasinoData('Wheel of Fortune', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        }
      }
    };

    animRef.current = requestAnimationFrame(rotateAnimation);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      drawWheel(0);
    }, 150);

    const handleResize = () => {
      drawWheel(0);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-15-fortune">
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">WHEEL OF FORTUNE</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">RISK MULTIPLIER SPIN WHEEL</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Canvas wheel spinner box */}
        <div className="relative bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden p-6 aspect-square flex items-center justify-center w-full max-w-[280px] mx-auto md:max-w-none">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="w-full h-full max-w-[260px] max-h-[260px]"
          />

          {/* Results display modal inside box */}
          {gameState === 'settled' && selectedMultiplier !== null && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-10 p-4 text-center animate-fade-in border-2 border-[#ffb703]/30 rounded-lg">
              {selectedMultiplier >= 1.2 ? (
                <Award className="w-12 h-12 text-[#ffb703] animate-pulse mb-2" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-red-500 animate-bounce mb-2" />
              )}
              <h2 className="text-white font-sans font-extrabold text-xl uppercase tracking-wider">
                MULTIPLIER: {selectedMultiplier}x
              </h2>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs leading-normal">
                Staked run yielded exact core output multiplier.
              </p>

              <div className="mt-4 bg-black/50 border border-[#2a2f3b] py-2 px-4 rounded font-mono text-xs">
                {selectedMultiplier >= 1.2 ? (
                  <span className="text-emerald-400 font-bold">Payout: +{payoutResult.amount.toFixed(4)} POKI</span>
                ) : selectedMultiplier === 0.5 ? (
                  <span className="text-amber-500">Recovery: +{payoutResult.amount.toFixed(4)} POKI</span>
                ) : (
                  <span className="text-red-500">Node loss: -{betAmount} POKI</span>
                )}
              </div>

              <button
                onClick={() => setGameState('idle')}
                className="mt-5 px-5 py-2 bg-[#ffb703] hover:brightness-110 font-mono font-bold text-xs text-black uppercase rounded cursor-pointer transition active:scale-95"
              >
                SPIN AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Right: Betting Stake and SPIN Button */}
        <div>
          <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded-lg p-4 mb-4">
            <h5 className="text-[10px] font-mono tracking-widest text-[#ffb703] uppercase font-extrabold mb-2">
              WHEEL PRIZE MATRIX
            </h5>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400 leading-normal">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f33d5e]" />
                <span>0x BUST (2 sectors)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e07a5f]" />
                <span>0.5x HALF (2 sectors)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#161920]" />
                <span>1.2x RECOVER (3 sectors)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb703]" />
                <span>2.0x DOUBLE (1 sector)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ea8de]" />
                <span>5.0x SUPER (1 sector)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb703] animate-pulse" />
                <span>50x JACKPOT (1 sector)</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
              <span className="text-gray-400 font-bold uppercase">Bet Stake (POKI)</span>
              <span className="text-gray-500">Balance: {pokiBalance.toFixed(4)} POKI</span>
            </div>
            <input
              type="number"
              disabled={gameState === 'spinning'}
              value={betAmount === 0 ? '' : betAmount}
              onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
              className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2 text-sm font-mono w-full focus:outline-none focus:border-[#ffb703]/50"
            />
          </div>

          <button
            onClick={spinWheel}
            disabled={gameState === 'spinning'}
            className="w-full py-3.5 mt-5 bg-[#ffb703] text-black font-sans font-extrabold text-sm uppercase rounded tracking-wider shadow-lg shadow-amber-500/10 cursor-pointer hover:brightness-110 active:scale-95 transition disabled:opacity-50"
          >
            ACTIVATE PRIZE WHEEL
          </button>
        </div>
      </div>
    </div>
  );
}
