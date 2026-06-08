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

type RouletteBetType = 'red' | 'black' | 'even' | 'odd' | 'zero';

interface NumberConfig {
  num: number;
  color: 'red' | 'black' | 'green';
}

const CONFS: NumberConfig[] = [
  { num: 0, color: 'green' },
  { num: 1, color: 'red' },
  { num: 2, color: 'black' },
  { num: 3, color: 'red' },
  { num: 4, color: 'black' },
  { num: 5, color: 'red' },
  { num: 6, color: 'black' },
  { num: 7, color: 'red' },
  { num: 8, color: 'black' },
  { num: 9, color: 'red' },
  { num: 10, color: 'black' },
  { num: 11, color: 'red' },
  { num: 12, color: 'black' },
];

export default function MiniRoulette({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'spinning' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betType, setBetType] = useState<RouletteBetType>('red');
  const [selectedSingleNum, setSelectedSingleNum] = useState<number>(-1); // -1 means color/group bet

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [winningConfig, setWinningConfig] = useState<NumberConfig | null>(null);

  const [winStatus, setWinStatus] = useState<boolean | null>(null);
  const [payoutAmt, setPayoutAmt] = useState<number>(0);

  const isSpinningRef = useRef<boolean>(false);

  const getPayoutOdds = (): number => {
    if (selectedSingleNum >= 0) return 12.0; 
    if (betType === 'zero') return 12.0;    
    return 2.0;                             
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
    setWinStatus(null);
    setWinningConfig(null);
    synth.playCoin();

    // High speed index rotation simulation with realistic physics deceleration
    let spinCycles = 0;
    const maxCycles = 35 + Math.floor(Math.random() * 15);
    let intervalTime = 50;

    const runRotation = () => {
      spinCycles++;
      setActiveIndex((prev) => (prev + 1) % CONFS.length);
      synth.playJump();

      if (spinCycles < maxCycles) {
        if (spinCycles > maxCycles - 12) {
          intervalTime += 35;
        }
        setTimeout(runRotation, intervalTime);
      } else {
        const winConf = CONFS[activeIndex];
        setWinningConfig(winConf);

        let isWin = false;

        if (selectedSingleNum >= 0) {
          if (winConf.num === selectedSingleNum) isWin = true;
        } else {
          if (betType === 'red' && winConf.color === 'red') isWin = true;
          else if (betType === 'black' && winConf.color === 'black') isWin = true;
          else if (betType === 'zero' && winConf.color === 'green') isWin = true;
          else if (betType === 'even' && winConf.num > 0 && winConf.num % 2 === 0) isWin = true;
          else if (betType === 'odd' && winConf.num % 2 !== 0) isWin = true;
        }

        let computedPayout = 0;
        let netProfit = -parsedBet;

        if (isWin) {
          const odds = getPayoutOdds();
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
        isSpinningRef.current = false;

        syncCasinoData('Mini Roulette', netProfit, pokiBalance - parsedBet + computedPayout)
          .catch(err => console.error(err));
      }
    };

    setTimeout(runRotation, intervalTime);
  };

  const oddsMultiplier = getPayoutOdds();

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#08090c] text-white p-4 max-w-5xl mx-auto w-full gap-6">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-[#0f1118] border border-[#d4af37]/25 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] font-mono font-bold">MINI ROULETTE</h2>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-4 text-xs text-zinc-400">
            A fast-paced digital Mini Roulette featuring numbers 0 to 12. Generous returns on single coordinate numbers!
          </div>

          {/* Bet size */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block font-bold">Bet Amount</label>
            <input
              type="number"
              value={betAmount}
              disabled={gameState === 'spinning'}
              onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#d4af37]/60 text-sm rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Bet Type Selection */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block">Choose Sector Bet</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setBetType('red');
                  setSelectedSingleNum(-1);
                }}
                disabled={gameState === 'spinning'}
                className={`py-2 px-1 text-center rounded-xl border text-[10px] font-mono font-bold transition cursor-pointer disabled:opacity-50 ${
                  betType === 'red' && selectedSingleNum === -1
                    ? 'bg-rose-950/25 border-rose-600 text-rose-450'
                    : 'bg-zinc-940 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                RED (2.0x)
              </button>

              <button
                onClick={() => {
                  setBetType('black');
                  setSelectedSingleNum(-1);
                }}
                disabled={gameState === 'spinning'}
                className={`py-2 px-1 text-center rounded-xl border text-[10px] font-mono font-bold transition cursor-pointer disabled:opacity-50 ${
                  betType === 'black' && selectedSingleNum === -1
                    ? 'bg-zinc-900 border-white/40 text-white'
                    : 'bg-zinc-940 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                BLACK (2.0x)
              </button>

              <button
                onClick={() => {
                  setBetType('even');
                  setSelectedSingleNum(-1);
                }}
                disabled={gameState === 'spinning'}
                className={`py-2 px-1 text-center rounded-xl border text-[10px] font-mono font-bold transition cursor-pointer disabled:opacity-50 ${
                  betType === 'even' && selectedSingleNum === -1
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-940 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                EVEN (2.0x)
              </button>

              <button
                onClick={() => {
                  setBetType('odd');
                  setSelectedSingleNum(-1);
                }}
                disabled={gameState === 'spinning'}
                className={`py-2 px-1 text-center rounded-xl border text-[10px] font-mono font-bold transition cursor-pointer disabled:opacity-50 ${
                  betType === 'odd' && selectedSingleNum === -1
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-940 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                ODD (2.0x)
              </button>
            </div>
          </div>

          {/* Specific number selectors */}
          <div className="space-y-2 mb-6">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block">Specific Number Bet (12.0x Payout!)</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CONFS.map((c) => (
                <button
                  key={c.num}
                  disabled={gameState === 'spinning'}
                  onClick={() => setSelectedSingleNum(c.num)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition transition-all cursor-pointer disabled:opacity-50 ${
                    selectedSingleNum === c.num
                      ? 'bg-[#d4af37]/25 border-[#d4af37] text-[#d4af37] scale-105'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  {c.num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSpin}
          disabled={gameState === 'spinning'}
          className={`w-full py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
            gameState === 'spinning'
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-650 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30'
          }`}
        >
          {gameState === 'spinning' ? 'Spinning wheel carousel...' : 'Settle roulette bet'}
        </button>
      </div>

      {/* Main Arena display */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[400px] flex flex-col justify-between p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.2px,transparent_0.2px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="flex justify-between items-center z-10 w-full mb-4">
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest font-bold">CYBER ROULETTE CAROUSEL BOARD</span>
          <span className="text-[10px] font-mono text-[#d4af37] font-bold font-bold">HOUSE RTP: 92.31%</span>
        </div>

        {/* Spinning Layout Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 py-6 gap-6">
          <div className="flex justify-center items-center gap-2.5 max-w-md w-full overflow-hidden py-4 border-y border-zinc-900 bg-zinc-900/40 px-3 relative rounded-xl">
            {/* Ambient gold marker pins */}
            <div className="absolute top-0 bottom-0 left-1/2 -ml-0.5 w-1 bg-[#d4af37] z-20 shadow-md shadow-[#d4af37]" />

            {/* Render a segment of the wheel carousel centered around the active index */}
            {[-2, -1, 0, 1, 2].map((offset) => {
              const idx = (activeIndex + offset + CONFS.length) % CONFS.length;
              const conf = CONFS[idx];
              const isCenter = offset === 0;

              return (
                <div
                  key={offset}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-mono font-black border transition-all duration-300 ${
                    conf.color === 'green'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                      : conf.color === 'red'
                        ? 'bg-rose-950/40 border-rose-600 text-rose-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-100'
                  } ${isCenter ? 'scale-118 ring-1 ring-[#d4af37]/50 shadow-xl' : 'opacity-35 scale-85'}`}
                >
                  {conf.num}
                </div>
              );
            })}
          </div>

          {/* Settle results */}
          {gameState === 'settled' && winningConfig && (
            <div className="animate-fade-in flex flex-col items-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl max-w-sm w-full text-center">
              <div className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest">Spin Outcome Number</div>
              <div className="text-3xl font-black text-white font-mono flex items-center gap-1.5 justify-center">
                <span className={winningConfig.color === 'red' ? 'text-rose-500 font-bold' : winningConfig.color === 'green' ? 'text-emerald-500 font-bold' : 'text-zinc-300 font-bold'}>
                  {winningConfig.num}
                </span>
                <span className="text-xs text-zinc-500 font-normal uppercase">
                  ({winningConfig.color.toUpperCase()})
                </span>
              </div>
              <div className={`mt-2 text-xs font-bold font-mono tracking-wider uppercase px-4 py-1.5 rounded-lg border ${
                winStatus
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
              }`}>
                {winStatus ? `YOU WIN: +${payoutAmt.toFixed(2)}` : 'HOUSE WINS'}
              </div>
            </div>
          )}

          {gameState === 'spinning' && (
            <div className="text-[#d4af37] text-xs font-mono tracking-widest animate-pulse uppercase">
              Agitating ball tracking coordinates...
            </div>
          )}
        </div>

        {/* Footers */}
        <div className="flex justify-between items-center z-10 w-full border-t border-zinc-900/80 pt-3 text-[10px] font-mono text-zinc-500">
          <div>BET CONFIG: <span className="text-[#d4af37] font-bold">{selectedSingleNum >= 0 ? `SINGLE NR: ${selectedSingleNum}` : betType.toUpperCase()}</span></div>
          <div>EXPECTED ODDS: <span className="text-[#d4af37] font-bold">{oddsMultiplier.toFixed(1)}x</span></div>
        </div>
      </div>
    </div>
  );
}
