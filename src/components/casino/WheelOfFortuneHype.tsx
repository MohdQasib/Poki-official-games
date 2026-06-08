import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, Play, ShieldAlert, Award, Grid, HelpCircle, AlertTriangle } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

interface SectorConfig {
  mult: number;
  label: string;
  color: string;
  hype?: boolean;
}

const SECTORS: SectorConfig[] = [
  { mult: 0.0, label: 'BUST', color: '#111218' },
  { mult: 1.2, label: '1.2x RECOV', color: '#161922' },
  { mult: 0.5, label: '0.5x HALF', color: '#101115' },
  { mult: 2.0, label: '2.0x DOUBLE', color: '#1b1a13' },
  { mult: 0.0, label: 'BUST', color: '#111218' },
  { mult: 1.5, label: '1.5x NICE', color: '#161922' },
  { mult: 100.0, label: '★ GRAND JACKPOT ★', color: '#d4af37', hype: true },
  { mult: 0.0, label: 'BUST', color: '#111218' },
  { mult: 1.2, label: '1.2x RECOV', color: '#161922' },
  { mult: 5.0, label: '5.0x SUPER', color: '#1c1811' },
  { mult: 0.5, label: '0.5x HALF', color: '#101115' },
  { mult: 0.0, label: 'BUST', color: '#111218' },
];

export default function WheelOfFortuneHype({
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
  const [payoutAmt, setPayoutAmt] = useState<number>(0);
  const [winStatus, setWinStatus] = useState<boolean | null>(null);

  const currentAngleRef = useRef<number>(0);
  const isSpinningRef = useRef<boolean>(false);

  const drawWheel = (angle: number) => {
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

    const totalSecs = SECTORS.length;
    const sectorAngle = (Math.PI * 2) / totalSecs;

    // Outer glow dynamic ring gradient style
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.04)';
    ctx.fill();

    SECTORS.forEach((sec, idx) => {
      const start = angle + idx * sectorAngle;
      const end = start + sectorAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();

      // Premium styling colors
      ctx.fillStyle = sec.color;
      ctx.fill();

      // Golden highlights for high hype grand jackpot
      if (sec.hype) {
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw Labels elegantly
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + sectorAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = sec.hype ? '#0b0c10' : '#efeef1';
      ctx.font = sec.hype ? 'black 11px monospace' : 'bold 9px monospace';
      ctx.fillText(sec.label, radius - 15, 3);
      ctx.restore();
    });

    // Outer steel border ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Elegant center HUB capsule
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0b0e';
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#d4af37';
    ctx.fill();

    // Top indicator needle with neon amber glowing center
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 12);
    ctx.lineTo(cx - 12, cy - radius + 15);
    ctx.lineTo(cx + 12, cy - radius + 15);
    ctx.closePath();
    ctx.fillStyle = '#f39c12';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  const handleSpin = () => {
    if (gameState === 'spinning' || isSpinningRef.current) return;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Specify a valid bet amount.");
      return;
    }

    if (!onDeductBalance(parsedBet)) {
      alert("Insufficient Balance.");
      return;
    }

    isSpinningRef.current = true;
    setGameState('spinning');
    setSelectedMultiplier(null);
    setPayoutAmt(0);
    setWinStatus(null);
    synth.playCoin();

    let spinVelocity = 0.55 + Math.random() * 0.45; 
    let deceleration = 0.0035;

    let localAngle = currentAngleRef.current;

    const tickFrame = () => {
      localAngle += spinVelocity;
      currentAngleRef.current = localAngle;

      drawWheel(localAngle);
      synth.playJump();

      spinVelocity -= deceleration;

      if (spinVelocity > 0.005) {
        animRef.current = requestAnimationFrame(tickFrame);
      } else {
        const totalSecs = SECTORS.length;
        const sectorAngle = (Math.PI * 2) / totalSecs;
        const indicatorAngle = -Math.PI / 2;

        let normalizedAngle = (indicatorAngle - localAngle) % (Math.PI * 2);
        if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;

        const landedIdx = Math.floor(normalizedAngle / sectorAngle) % totalSecs;
        const chosenSec = SECTORS[landedIdx];

        setSelectedMultiplier(chosenSec.mult);

        let computedPayout = parsedBet * chosenSec.mult;
        let isWin = chosenSec.mult > 0;
        let netProfit = computedPayout - parsedBet;

        if (isWin) {
          onAwardBalance(parseFloat(computedPayout.toFixed(4)));
          synth.playCoin();
        } else {
          synth.playCrash();
        }

        setPayoutAmt(computedPayout);
        setWinStatus(isWin);
        setGameState('settled');
        isSpinningRef.current = false;

        syncCasinoData('Wheel of Hype', netProfit, pokiBalance - parsedBet + computedPayout)
          .catch(err => console.error(err));
      }
    };

    animRef.current = requestAnimationFrame(tickFrame);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      drawWheel(currentAngleRef.current);
    }, 150);

    const handleResize = () => {
      drawWheel(currentAngleRef.current);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#08090c] text-white p-4 max-w-5xl mx-auto w-full gap-6">
      {/* Sidebar Control Panel */}
      <div className="w-full md:w-80 bg-[#0f1118] border border-[#d4af37]/25 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] font-mono font-bold">WHEEL OF FORTUNE</h2>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-4 text-xs text-zinc-400 font-sans">
            Spin the high-volatility wheel of fortune. Targets include a single massive <span className="text-[#d4af37] font-bold">100x GRAND JACKPOT</span> slice!
          </div>

          {/* Bet size */}
          <div className="space-y-4 mb-6">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block font-bold">Bet Size</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={betAmount}
                disabled={gameState === 'spinning'}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="flex-grow bg-zinc-950 border border-zinc-850 focus:border-[#d4af37]/60 text-sm rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
              />
            </div>
            <div className="bg-amber-950/20 border border-amber-900/30 p-2.5 rounded-xl flex gap-1.5 items-center text-[10px] text-amber-500 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>CAUTION: Volatile progressive scale coefficient.</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={gameState === 'spinning'}
          className={`w-full py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
            gameState === 'spinning'
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-650 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/35'
          }`}
        >
          {gameState === 'spinning' ? 'Spinning wheel...' : 'Spin Hype Wheel'}
        </button>
      </div>

      {/* Main Wheel canvas container block */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[400px] flex flex-col justify-between p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.2px,transparent_0.2px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="flex justify-between items-center z-10 w-full mb-4">
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest font-bold">CIRCULAR PROGRESSIVE SPIN SYSTEM</span>
          <span className="text-[10px] font-mono text-[#d4af37] font-bold">100X GRAND JACKPOT ACTIVE</span>
        </div>

        {/* Canvas stage */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 relative">
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] transition-transform shadow-2xl relative z-10 bg-transparent rounded-full"
          />

          {/* Settle Panel */}
          {gameState === 'settled' && selectedMultiplier !== null && (
            <div className="absolute inset-x-0 bottom-2 flex justify-center p-3 z-20 animate-fade-in">
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-center max-w-xs w-full shadow-2xl backdrop-blur-md">
                <div className="text-zinc-500 text-[9px] uppercase font-mono tracking-widest">Landed multiplier</div>
                <div className="text-2xl font-black text-[#d4af37] font-mono uppercase tracking-wider">
                  {selectedMultiplier === 100.0 ? 'GRAND JACKPOT!' : `${selectedMultiplier.toFixed(1)}x Payout`}
                </div>
                <div className={`mt-2 text-[10px] font-bold font-mono tracking-wider uppercase px-3 py-1 rounded-lg border ${
                  winStatus
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                }`}>
                  {winStatus ? `YOU WIN: +${payoutAmt.toFixed(2)}` : 'BUSTED'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom footer status */}
        <div className="flex justify-between items-center z-10 w-full border-t border-zinc-900/80 pt-3 text-[10px] font-mono text-zinc-500">
          <div>HYPE FACTOR: <span className="text-[#d4af37] font-black">MAXIMA</span></div>
          <div>EST. JACKPOT PRIZE: <span className="text-[#d4af37] font-bold">{betAmount * 100} Coins</span></div>
        </div>
      </div>
    </div>
  );
}
