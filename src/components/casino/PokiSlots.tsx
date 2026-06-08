import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, X, Play, ShieldAlert, Award, RefreshCw, Trophy } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

interface SymbolItem {
  id: string;
  char: string;
  color: string;
  name: string;
  isJackpot: boolean;
}

export default function PokiSlots({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'spinning' | 'settled' | 'jackpot'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);

  // Reel states
  const [reelSymbols, setReelSymbols] = useState<SymbolItem[]>([]);
  const [payoutResult, setPayoutResult] = useState<{ win: boolean; mult: number; amount: number; profit: number }>({ win: false, mult: 0, amount: 0, profit: 0 });

  // Symbols list: BTC, ETH, SOL, P (Pokicoin!)
  const symbols: SymbolItem[] = [
    { id: 'btc', char: '₿', color: '#f7931a', name: 'Bitcoin', isJackpot: false },
    { id: 'eth', char: 'Ξ', color: '#627eea', name: 'Ethereum', isJackpot: false },
    { id: 'sol', char: '🟢', color: '#14f195', name: 'Solana', isJackpot: false },
    { id: 'poki', char: '🪙', color: '#ffb703', name: 'Pokicoin', isJackpot: true },
  ];

  // Canvas Refs for 3 reels blurring
  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef3 = useRef<HTMLCanvasElement | null>(null);
  const isStartingRef = useRef<boolean>(false);

  // Setup initial render Symbols
  useEffect(() => {
    setReelSymbols([symbols[3], symbols[3], symbols[3]]); // center jackpot default
    drawStaticSymbol(canvasRef1, symbols[3]);
    drawStaticSymbol(canvasRef2, symbols[3]);
    drawStaticSymbol(canvasRef3, symbols[3]);
  }, []);

  const drawStaticSymbol = (canvasRef: React.RefObject<HTMLCanvasElement | null>, sym: SymbolItem) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#171a21'; // matching inner slate
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid details
    ctx.strokeStyle = '#2a2f3b';
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = sym.color;
    ctx.fillText(sym.char, canvas.width / 2, canvas.height / 2);
  };

  const resetGameEngine = () => {
    setPayoutResult({ win: false, mult: 0, amount: 0, profit: 0 });
    setReelSymbols([]);
  };

  const spinSlots = () => {
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

    // Select results indices
    const target1 = Math.floor(Math.random() * symbols.length);
    const target2 = Math.floor(Math.random() * symbols.length);
    const target3 = Math.floor(Math.random() * symbols.length);

    const s1 = symbols[target1];
    const s2 = symbols[target2];
    const s3 = symbols[target3];

    // Blur Animation Loop on canveses
    const spinDurations = [1200, 1800, 2400]; // reels stop sequentially
    const spinStart = Date.now();

    const renderSpin = () => {
      const elapsed = Date.now() - spinStart;

      // Reel 1
      if (elapsed < spinDurations[0]) {
        drawBlurringReel(canvasRef1);
      } else {
        drawStaticSymbol(canvasRef1, s1);
      }

      // Reel 2
      if (elapsed < spinDurations[1]) {
        drawBlurringReel(canvasRef2);
      } else {
        drawStaticSymbol(canvasRef2, s2);
      }

      // Reel 3
      if (elapsed < spinDurations[2]) {
        drawBlurringReel(canvasRef3);
      } else {
        drawStaticSymbol(canvasRef3, s3);
      }

      const totalSpinCompleted = elapsed >= spinDurations[2];
      if (!totalSpinCompleted) {
        requestAnimationFrame(renderSpin);
      } else {
        // SETTLE RESULTS IN CONCENTRIC LEDGER
        setReelSymbols([s1, s2, s3]);

        // Evaluate winnings matches
        let isWin = false;
        let scaleMult = 0;
        let isJackpot = false;

        if (s1.id === s2.id && s2.id === s3.id) {
          isWin = true;
          if (s1.isJackpot) {
            scaleMult = 50.0; // 50x POKI jackpot
            isJackpot = true;
          } else {
            scaleMult = 5.0; // 3 matches
          }
        } else if (s1.id === s2.id || s2.id === s3.id || s1.id === s3.id) {
          isWin = true;
          scaleMult = 1.5; // 2 matches
        }

        const payoutVal = isWin ? parseFloat((parsedBet * scaleMult).toFixed(8)) : 0;
        const netProfit = isWin ? parseFloat((payoutVal - parsedBet).toFixed(8)) : -parsedBet;

        setPayoutResult({ win: isWin, mult: scaleMult, amount: payoutVal, profit: netProfit });

        if (isJackpot) {
          setGameState('jackpot');
          synth.playLevelUp();
          onAwardBalance(payoutVal);
          syncCasinoData('Poki Slots Jackpot', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        } else if (isWin) {
          setGameState('settled');
          synth.playLevelUp();
          onAwardBalance(payoutVal);
          syncCasinoData('Poki Slots', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        } else {
          setGameState('settled');
          synth.playCrash();
          syncCasinoData('Poki Slots', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        }
      }
    };

    requestAnimationFrame(renderSpin);
  };

  const drawBlurringReel = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b0c10'; // deeper matte
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#2a2f3b';
    ctx.lineWidth = 1;
    ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

    // Draw blurred characters going down
    const randomShiftY = (Date.now() % 50);
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffb703';
    ctx.globalAlpha = 0.45;
    
    // Draw trail
    ctx.fillText('Ξ', canvas.width / 2, randomShiftY);
    ctx.fillText('₿', canvas.width / 2, randomShiftY + 40);
    ctx.fillText('🪙', canvas.width / 2, randomShiftY + 80);
    ctx.fillText('🟢', canvas.width / 2, randomShiftY - 40);
    ctx.globalAlpha = 1.0;
  };

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-14-slots">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">POKI SLOTS</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">3-REEL CRYPTO SLOTS</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Core Slot machine housing */}
      <div className="bg-[#0b0c10] border-4 border-[#232731] rounded-xl p-6 relative flex flex-col items-center">
        {/* Neon light border details */}
        <div className="absolute inset-0 border border-[#ffb703]/30 rounded-lg pointer-events-none" />

        {/* 3 reels slots layouts */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          <canvas ref={canvasRef1} width={80} height={110} className="w-full h-[110px] bg-[#171a21] rounded border border-[#2a2f3b]" />
          <canvas ref={canvasRef2} width={80} height={110} className="w-full h-[110px] bg-[#171a21] rounded border border-[#2a2f3b]" />
          <canvas ref={canvasRef3} width={80} height={110} className="w-full h-[110px] bg-[#171a21] rounded border border-[#2a2f3b]" />
        </div>

        {/* Win lines visual indication */}
        <div className="w-11/12 border-b border-dashed border-[#ffb703]/40 mt-4 relative" />

        {/* Results overlays */}
        {gameState === 'settled' && (
          <div className="mt-4 text-center animate-fade-in">
            {payoutResult.win ? (
              <div className="space-y-1">
                <p className="text-emerald-400 font-bold text-sm font-sans flex items-center justify-center gap-1">
                  <Award className="w-4 h-4" /> SUCCESSFUL PAYOUT ({payoutResult.mult}x)
                </p>
                <p className="text-white font-mono text-xs">Profit: +{payoutResult.profit.toFixed(4)} POKI</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-red-400 font-bold text-sm font-sans flex items-center justify-center gap-1">
                  <ShieldAlert className="w-4 h-4" /> NO MATCH
                </p>
                <p className="text-xs text-gray-500 font-semibold uppercase">Reboot nodes stake lost</p>
              </div>
            )}
          </div>
        )}

        {/* JACKPOT CASCADE EVENT OVERLAY */}
        {gameState === 'jackpot' && (
          <div className="absolute inset-0 bg-[#ffb703]/95 text-black flex flex-col items-center justify-center p-4 text-center rounded-lg z-20 animate-fade-in">
            <Trophy className="w-16 h-16 text-black animate-bounce mb-2" />
            <span className="text-[10px] font-mono tracking-widest text-black font-extrabold uppercase">JACKPOT BLITZ TRIGGER</span>
            <h1 className="text-3xl font-black font-sans leading-none tracking-tight uppercase">POKICOIN MEGA BUSTER!</h1>
            <p className="text-xs font-semibold text-black uppercase mt-1">Concentric consensus multiplier: <span className="font-bold underline">50.0x Payout</span></p>

            <div className="mt-3 bg-black text-emerald-400 px-4 py-2 border border-black rounded text-sm font-mono font-extrabold">
              +{payoutResult.amount.toFixed(4)} POKI
            </div>

            <button
               onClick={() => {
                 setGameState('idle');
                 drawStaticSymbol(canvasRef1, symbols[3]);
                 drawStaticSymbol(canvasRef2, symbols[3]);
                 drawStaticSymbol(canvasRef3, symbols[3]);
               }}
               className="mt-4 px-6 py-2 bg-black hover:brightness-110 font-mono font-bold text-xs uppercase text-white rounded cursor-pointer"
            >
              CASH OUT RECOVERY
            </button>
          </div>
        )}
      </div>

      {/* Betting control inputs */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
            <span className="text-gray-400 font-bold">STAKE AMOUNT</span>
            <span className="text-gray-500">Wallet: {pokiBalance.toFixed(8)}</span>
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
          onClick={spinSlots}
          disabled={gameState === 'spinning'}
          className="w-full py-3.5 bg-gradient-to-r from-teal-400 to-[#ffb703] text-black font-sans font-extrabold text-sm uppercase rounded tracking-wider cursor-pointer active:scale-95 transition disabled:opacity-50"
        >
          {gameState === 'spinning' ? 'REELS SPINNING...' : 'ACTIVATE REELS SPIN'}
        </button>
      </div>
    </div>
  );
}
