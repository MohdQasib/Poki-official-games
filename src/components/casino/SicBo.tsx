import React, { useState, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, Play, ShieldAlert, Award, Grid, ShieldCheck, HelpCircle } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

type SicBoBet = 'small' | 'big' | 'any_triple' | 'sum_9_12';

// Golden Dot Die component for deep professional customization
function DieFace({ value, isRolling }: { value: number; isRolling: boolean }) {
  const getDots = (val: number) => {
    switch (val) {
      case 1:
        return [{ row: 2, col: 2 }];
      case 2:
        return [{ row: 1, col: 1 }, { row: 3, col: 3 }];
      case 3:
        return [{ row: 1, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 3 }];
      case 4:
        return [
          { row: 1, col: 1 }, { row: 1, col: 3 },
          { row: 3, col: 1 }, { row: 3, col: 3 }
        ];
      case 5:
        return [
          { row: 1, col: 1 }, { row: 1, col: 3 },
          { row: 2, col: 2 },
          { row: 3, col: 1 }, { row: 3, col: 3 }
        ];
      case 6:
        return [
          { row: 1, col: 1 }, { row: 1, col: 3 },
          { row: 2, col: 1 }, { row: 2, col: 3 },
          { row: 3, col: 1 }, { row: 3, col: 3 }
        ];
      default:
        return [];
    }
  };

  const dots = getDots(value);

  return (
    <div
      className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#0d0f14] border-2 border-[#d4af37]/45 shadow-2xl relative flex items-center justify-center transition-all duration-300 ${
        isRolling ? 'animate-bounce border-[#d4af37] rotate-6 scale-105' : 'hover:border-[#d4af37]/65'
      }`}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-10 h-10 sm:w-11 sm:h-11">
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3) + 1;
          const col = (i % 3) + 1;
          const hasDot = dots.some((d) => d.row === row && d.col === col);

          return (
            <div key={i} className="flex items-center justify-center">
              {hasDot && (
                <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gradient-to-br from-[#ffe066] to-[#d4af37] shadow-[0_0_6px_#d4af37] ${
                  isRolling ? 'scale-110 opacity-85' : ''
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="absolute inset-px rounded-[14px] bg-gradient-to-tr from-transparent via-[#ffffff]/5 to-[#ffffff]/10 pointer-events-none" />
    </div>
  );
}

export default function SicBo({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'rolling' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedBet, setSelectedBet] = useState<SicBoBet>('small');

  const [dice1, setDice1] = useState<number>(3);
  const [dice2, setDice2] = useState<number>(4);
  const [dice3, setDice3] = useState<number>(5);

  const [animDice1, setAnimDice1] = useState<number>(3);
  const [animDice2, setAnimDice2] = useState<number>(4);
  const [animDice3, setAnimDice3] = useState<number>(5);

  const [rollResult, setRollResult] = useState<number | null>(null);
  const [winStatus, setWinStatus] = useState<boolean | null>(null);
  const [payoutAmt, setPayoutAmt] = useState<number>(0);

  const isRollingRef = useRef<boolean>(false);

  const getBetPayoutOdds = (bet: SicBoBet) => {
    if (bet === 'small') return 2.0;    
    if (bet === 'big') return 2.0;      
    if (bet === 'any_triple') return 31.0; 
    if (bet === 'sum_9_12') return 7.0; 
  };

  const handleRoll = () => {
    if (gameState === 'rolling' || isRollingRef.current) return;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Specify a valid bet amount.");
      return;
    }

    if (!onDeductBalance(parsedBet)) {
      alert("Insufficient Balance.");
      return;
    }

    isRollingRef.current = true;
    setGameState('rolling');
    setWinStatus(null);
    setRollResult(null);
    synth.playCoin();

    let count = 0;
    const interval = setInterval(() => {
      setAnimDice1(Math.floor(Math.random() * 6) + 1);
      setAnimDice2(Math.floor(Math.random() * 6) + 1);
      setAnimDice3(Math.floor(Math.random() * 6) + 1);
      synth.playJump();
      count++;

      if (count > 15) {
        clearInterval(interval);

        const fD1 = Math.floor(Math.random() * 6) + 1;
        const fD2 = Math.floor(Math.random() * 6) + 1;
        const fD3 = Math.floor(Math.random() * 6) + 1;
        const total = fD1 + fD2 + fD3;

        setDice1(fD1);
        setDice2(fD2);
        setDice3(fD3);
        setAnimDice1(fD1);
        setAnimDice2(fD2);
        setAnimDice3(fD3);
        setRollResult(total);

        const isTriple = fD1 === fD2 && fD2 === fD3;
        let isWin = false;
        
        if (selectedBet === 'small') {
          if (total >= 4 && total <= 10 && !isTriple) isWin = true;
        } else if (selectedBet === 'big') {
          if (total >= 11 && total <= 17 && !isTriple) isWin = true;
        } else if (selectedBet === 'any_triple') {
          if (isTriple) isWin = true;
        } else if (selectedBet === 'sum_9_12') {
          if (total === 9 || total === 10 || total === 11 || total === 12) isWin = true;
        }

        let computedPayout = 0;
        let netProfit = -parsedBet;

        if (isWin) {
          const odds = getBetPayoutOdds(selectedBet);
          computedPayout = parsedBet * odds;
          netProfit = computedPayout - parsedBet;
          onAwardBalance(parseFloat(computedPayout.toFixed(4)));
          synth.playCoin();
        } else {
          synth.playCrash();
        }

        setPayoutAmt(computedPayout);
        setWinStatus(isWin);
        setGameState('settled');
        isRollingRef.current = false;

        syncCasinoData('Sic Bo', netProfit, pokiBalance - parsedBet + computedPayout)
          .catch(err => console.error(err));
      }
    }, 90);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#08090c] text-white p-4 max-w-5xl mx-auto w-full gap-6">
      {/* Sidebar Controllers */}
      <div className="w-full md:w-80 bg-[#0f1118] border border-[#d4af37]/25 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] font-mono">SIC BO</h2>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-4 text-xs text-zinc-400">
            A traditional three-dice casino game. Predict the outcome of the triple dice tumble using the optimized high-payout layout.
          </div>

          {/* Bet size */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block font-bold">Bet Amount</label>
            <input
              type="number"
              value={betAmount}
              disabled={gameState === 'rolling'}
              onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#d4af37]/60 text-sm rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Settle Type selection Grid */}
          <div className="space-y-2 mb-6">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block">Choose Betting Sector</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedBet('small')}
                disabled={gameState === 'rolling'}
                className={`py-3 px-2 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'small'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                SMALL (4-10)
                <span className="block text-[8px] opacity-60 text-white mt-0.5">2.0x Payout</span>
              </button>

              <button
                onClick={() => setSelectedBet('big')}
                disabled={gameState === 'rolling'}
                className={`py-3 px-2 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'big'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                BIG (11-17)
                <span className="block text-[8px] opacity-60 text-white mt-0.5">2.0x Payout</span>
              </button>

              <button
                onClick={() => setSelectedBet('any_triple')}
                disabled={gameState === 'rolling'}
                className={`py-3 px-2 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'any_triple'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                ANY TRIPLE
                <span className="block text-[8px] opacity-60 text-white mt-0.5">31.0x Payout</span>
              </button>

              <button
                onClick={() => setSelectedBet('sum_9_12')}
                disabled={gameState === 'rolling'}
                className={`py-3 px-2 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'sum_9_12'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                SUM 9 - 12
                <span className="block text-[8px] opacity-60 text-white mt-0.5">7.0x Payout</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleRoll}
          disabled={gameState === 'rolling'}
          className={`w-full py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
            gameState === 'rolling'
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-650 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/35'
          }`}
        >
          {gameState === 'rolling' ? 'Shaking Dice Cup...' : 'Settle Sic Bo Bet'}
        </button>
      </div>

      {/* Main Arena screen */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[400px] flex flex-col justify-between p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.2px,transparent_0.2px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="flex justify-between items-center z-10 w-full mb-4">
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest font-bold">TRIPLE DICE LIVE DOCK</span>
          <span className="text-[10px] font-mono text-[#d4af37] font-bold">HOUSE RTP: 97.22%</span>
        </div>

        {/* Dice Cup Tumble area */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 gap-8 font-mono">
          <div className="flex justify-center items-center gap-4 sm:gap-6">
            <DieFace value={animDice1} isRolling={gameState === 'rolling'} />
            <DieFace value={animDice2} isRolling={gameState === 'rolling'} />
            <DieFace value={animDice3} isRolling={gameState === 'rolling'} />
          </div>

          {/* Results readout */}
          {gameState === 'settled' && rollResult !== null && (
            <div className="animate-fade-in flex flex-col items-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl max-w-sm w-full text-center">
              <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest">Shaked Outcome Sum</div>
              <div className="text-3xl font-black text-white font-mono flex items-center gap-1.5 justify-center">
                <span>{rollResult}</span>
                <span className="text-xs text-[#d4af37] font-normal">
                  ({rollResult <= 10 ? 'SMALL' : 'BIG'}{' '}|{' '}{dice1 === dice2 && dice2 === dice3 ? 'TRIPLE' : 'MIXED'})
                </span>
              </div>
              <div className={`mt-2 text-xs font-bold font-mono tracking-wider uppercase px-4 py-1.5 rounded-lg border ${
                winStatus
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
              }`}>
                {winStatus ? `YOU WIN: +${payoutAmt.toFixed(2)}` : 'HOUSE WINS'}
              </div>
            </div>
          )}

          {gameState === 'rolling' && (
            <div className="text-[#d4af37] text-xs font-mono tracking-widest animate-pulse uppercase">
              Shaking triple golden cylinder dice cup...
            </div>
          )}
        </div>

        {/* Footers */}
        <div className="flex justify-between items-center z-10 w-full border-t border-zinc-900/80 pt-3 text-[10px] font-mono text-zinc-500 mt-4">
          <div>BET TYPE: <span className="text-[#d4af37] font-bold">{selectedBet.toUpperCase()}</span></div>
          <div>STAKE VALUE: <span className="text-[#d4af37] font-bold">{betAmount} Coins</span></div>
        </div>
      </div>
    </div>
  );
}
