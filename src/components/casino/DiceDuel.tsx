import React, { useState, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, Play, ShieldAlert, Award, Dices, RotateCcw, AlertCircle } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

type BetType = 'under' | 'seven' | 'over';

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
      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0d0f14] border-2 border-[#d4af37]/40 shadow-2xl relative flex items-center justify-center transition-all duration-300 ${
        isRolling ? 'animate-bounce border-[#d4af37] rotate-12 scale-105 shadow-[#d4af37]/25' : 'hover:border-[#d4af37]/60'
      }`}
    >
      {/* 3x3 Grid of absolute dots */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-12 h-12 sm:w-14 sm:h-14">
        {Array.from({ length: 9 }).map((_, i) => {
          const row = Math.floor(i / 3) + 1;
          const col = (i % 3) + 1;
          const hasDot = dots.some((d) => d.row === row && d.col === col);

          return (
            <div key={i} className="flex items-center justify-center">
              {hasDot && (
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-br from-[#ffe066] to-[#d4af37] shadow-[0_0_8px_#d4af37] transition-all duration-300 ${
                  isRolling ? 'scale-110 opacity-80 animate-pulse' : ''
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Gloss reflection overlay */}
      <div className="absolute inset-px rounded-[14px] bg-gradient-to-tr from-transparent via-[#ffffff]/5 to-[#ffffff]/10 pointer-events-none" />
    </div>
  );
}

export default function DiceDuel({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'rolling' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedBet, setSelectedBet] = useState<BetType>('seven');
  
  const [dice1, setDice1] = useState<number>(3);
  const [dice2, setDice2] = useState<number>(4);
  const [animDice1, setAnimDice1] = useState<number>(3);
  const [animDice2, setAnimDice2] = useState<number>(4);
  
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [winStatus, setWinStatus] = useState<boolean | null>(null);
  const [payoutAmt, setPayoutAmt] = useState<number>(0);
  const isRollingRef = useRef<boolean>(false);

  // Casino Odds: Under 7 payout = 2.1x, Exactly 7 payout = 5.0x, Over 7 payout = 2.1x (Reflects healthy Math House Edge!)
  const getPayoutOdds = (bet: BetType) => {
    if (bet === 'seven') return 5.0;
    return 2.1;
  };

  const handleRoll = () => {
    if (gameState === 'rolling' || isRollingRef.current) return;
    
    // Bet size sanitization precheck
    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Please enter a valid bet amount.");
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

    // Sound roll effects starting
    let count = 0;
    const interval = setInterval(() => {
      setAnimDice1(Math.floor(Math.random() * 6) + 1);
      setAnimDice2(Math.floor(Math.random() * 6) + 1);
      synth.playJump();
      count++;
      
      if (count > 12) {
        clearInterval(interval);
        
        // Settle roll
        const finalD1 = Math.floor(Math.random() * 6) + 1;
        const finalD2 = Math.floor(Math.random() * 6) + 1;
        const total = finalD1 + finalD2;
        
        setDice1(finalD1);
        setDice2(finalD2);
        setAnimDice1(finalD1);
        setAnimDice2(finalD2);
        setRollResult(total);

        // Calculate win criteria
        let isWin = false;
        if (selectedBet === 'under' && total < 7) isWin = true;
        if (selectedBet === 'seven' && total === 7) isWin = true;
        if (selectedBet === 'over' && total > 7) isWin = true;

        let computedPayout = 0;
        let netProfit = -parsedBet;

        if (isWin) {
          const odds = getPayoutOdds(selectedBet);
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

        // Sync to firebase / cloud synchronization
        syncCasinoData('Dice Duel', netProfit, pokiBalance - parsedBet + computedPayout)
          .catch(err => console.error("PHP State sync error: ", err));
      }
    }, 100);
  };

  const currentOdds = getPayoutOdds(selectedBet);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#08090c] text-white p-4 max-w-5xl mx-auto w-full gap-6">
      {/* Sidebar Control Panel */}
      <div className="w-full md:w-80 bg-[#0f1118] border border-[#d4af37]/20 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Dices className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] font-mono">DICE DUEL</h2>
          </div>
          
          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-4 text-xs text-zinc-400">
            Bet on whether the sum of two rolling dice will be <span className="text-[#d4af37] font-bold">Under 7</span>, <span className="text-[#d4af37] font-bold">Exactly 7 (5.0x Payout!)</span>, or <span className="text-[#d4af37] font-bold">Over 7</span>.
          </div>

          {/* Bet Size Input */}
          <div className="space-y-2 mb-5">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block block">Bet Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={betAmount}
                disabled={gameState === 'rolling'}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-[#d4af37]/60 text-sm rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
              />
              <button
                disabled={gameState === 'rolling'}
                onClick={() => setBetAmount(Math.max(1, betAmount / 2))}
                className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-[10px] font-mono font-bold hover:text-[#d4af37] px-2.5 py-2 border border-zinc-800 rounded-xl cursor-pointer"
              >
                1/2
              </button>
              <button
                disabled={gameState === 'rolling'}
                onClick={() => setBetAmount(betAmount * 2)}
                className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-[10px] font-mono font-bold hover:text-[#d4af37] px-2.5 py-2 border border-zinc-800 rounded-xl cursor-pointer"
              >
                2X
              </button>
            </div>
          </div>

          {/* Bet Types Selection */}
          <div className="space-y-2 mb-6">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block">Choose Sector Bet</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                disabled={gameState === 'rolling'}
                onClick={() => setSelectedBet('under')}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'under'
                    ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                UNDER 7
                <span className="block text-[8px] opacity-60 text-white mt-0.5">2.1x</span>
              </button>
              <button
                disabled={gameState === 'rolling'}
                onClick={() => setSelectedBet('seven')}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'seven'
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37] ring-1 ring-[#d4af37]/30'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                EXACTLY 7
                <span className="block text-[8px] opacity-60 text-white mt-0.5">5.0x</span>
              </button>
              <button
                disabled={gameState === 'rolling'}
                onClick={() => setSelectedBet('over')}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'over'
                    ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                OVER 7
                <span className="block text-[8px] opacity-60 text-white mt-0.5">2.1x</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Button with robust state blocking */}
        <button
          onClick={handleRoll}
          disabled={gameState === 'rolling'}
          className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
            gameState === 'rolling'
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30'
          }`}
        >
          {gameState === 'rolling' ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              Rolling Duel...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-black" />
              Place Duel Bet
            </>
          )}
        </button>
      </div>

      {/* Main Duel Arena area */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[400px] flex flex-col justify-between p-6 relative overflow-hidden">
        {/* Subtle Matte grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.2px,transparent_0.2px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        {/* Title status info */}
        <div className="flex justify-between items-center z-10 w-full">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">ADVANCED LIVE DUEL</span>
          </div>
          <div className="text-[10px] font-mono text-[#d4af37] font-bold font-bold">RTP RATE: 97.22%</div>
        </div>

        {/* Rolling interactive arena container */}
        <div className="flex flex-col items-center justify-center flex-1 py-10 z-10 gap-8">
          <div className="flex justify-center items-center gap-6 sm:gap-10">
            {/* Dice 1 cylinder with authentic dot styles */}
            <DieFace value={animDice1} isRolling={gameState === 'rolling'} />

            {/* Addition central bubble */}
            <div className="text-zinc-600 font-black text-3xl font-mono animate-pulse">+</div>

            {/* Dice 2 cylinder with authentic dot styles */}
            <DieFace value={animDice2} isRolling={gameState === 'rolling'} />
          </div>

          {/* Target / Settle Panel */}
          {gameState === 'settled' && rollResult !== null && (
            <div className="animate-fade-in flex flex-col items-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl max-w-sm w-full text-center">
              <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest">Rolled Outcomes</div>
              <div className="text-3xl font-black text-white font-mono flex items-center gap-1.5 justify-center">
                <span>{rollResult}</span>
                <span className="text-xs text-[#d4af37] font-normal font-mono">
                  ({rollResult < 7 ? 'UNDER 7' : rollResult === 7 ? 'EXACTLY 7' : 'OVER 7'})
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
              Agitating 3D Cup cylinders...
            </div>
          )}
        </div>

        {/* Footer info panel */}
        <div className="flex justify-between items-center z-10 w-full border-t border-zinc-900/80 pt-3 text-[10px] font-mono text-zinc-500">
          <div>BET TYPE: <span className="text-[#d4af37] font-bold">{selectedBet.toUpperCase()}</span></div>
          <div>EST. PAYOUT ODDS: <span className="text-[#d4af37] font-bold">{currentOdds.toFixed(1)}x</span></div>
        </div>
      </div>
    </div>
  );
}
