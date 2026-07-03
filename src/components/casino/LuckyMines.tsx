import React, { useState, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, Play, ShieldAlert, Award, Grid, ShieldCheck, Bomb, Coins } from 'lucide-react';
import { evaluateBet, logWin, logLoss } from '../../utils/casinoRigging';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number, setBet?: (val: number) => void) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

interface Cell {
  id: number;
  isMine: boolean;
  state: 'hidden' | 'gold' | 'bomb';
}

export default function LuckyMines({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'cashout' | 'bust'>('idle');
  const [betAmount, setBetAmount] = useState<number>(70);
  const [mineCount, setMineCount] = useState<number>(3);
  
  const [grid, setGrid] = useState<Cell[]>([]);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const activeGameBetRef = useRef<number>(0);

  // Generate standard casino multiplier sequence on client calculations
  const calculateNextMultiplier = (revealed: number) => {
    if (revealed === 0) return 1.0;
    // Combinations Math: multi = (nCr(25, revealed) / nCr(25 - mineCount, revealed)) * 0.98 (House Edge 2%)
    let num = 1;
    let den = 1;
    for (let i = 0; i < revealed; i++) {
      num *= (25 - i);
      den *= (25 - mineCount - i);
    }
    const val = (num / den) * 0.98;
    return parseFloat(val.toFixed(2));
  };

  const nextMultiplier = calculateNextMultiplier(revealedCount + 1);
  const currentMultiplier = revealedCount > 0 ? calculateNextMultiplier(revealedCount) : 1.0;
  const currentCashout = activeGameBetRef.current * currentMultiplier;

  const handleStartGame = () => {
    if (gameState === 'playing') return;

    if (mineCount < 1 || mineCount >= 24) {
      alert("Select mines count between 1 and 24.");
      return;
    }

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Specify a valid bet amount.");
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
      alert("Insufficient Balance.");
      return;
    }

    activeGameBetRef.current = parsedBet;

    // Create 5x5 Grid
    const newCells: Cell[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isMine: false,
      state: 'hidden'
    }));

    // Randomly plant mineCount mines
    let placed = 0;
    while (placed < mineCount) {
      const idx = Math.floor(Math.random() * 25);
      if (!newCells[idx].isMine) {
        newCells[idx].isMine = true;
        placed++;
      }
    }

    setGrid(newCells);
    setRevealedCount(0);
    setGameState('playing');
    synth.playCoin();
  };

  const handleCellClick = (id: number) => {
    if (gameState !== 'playing') return;
    const target = grid[id];
    if (target.state !== 'hidden') return;

    const uId = window.currentUserId || 'anonymous';
    const evaluation = evaluateBet(uId, activeGameBetRef.current, pokiBalance);

    let forceLoss = evaluation.shouldForceLoss;

    // High bet defense (if bet >= 300 PKG, guarantee bomb on 2nd click)
    if (activeGameBetRef.current >= 300 && revealedCount >= 1) {
      forceLoss = true;
    }

    // Brake mode: slow win but cap maximum streak count to 4 safe clicks
    if (evaluation.applyBrakeMode && revealedCount >= 3) {
      forceLoss = true;
    }

    const newGrid = [...grid];

    if (forceLoss && !target.isMine) {
      // Dynamic Mine Swap: Swaps a mine from somewhere else in the grid to this clicked cell
      const mineIndex = newGrid.findIndex(cell => cell.isMine && cell.id !== id && cell.state === 'hidden');
      if (mineIndex !== -1) {
        newGrid[id].isMine = true;
        newGrid[mineIndex].isMine = false;
      } else {
        newGrid[id].isMine = true; // Fallback
      }
    }

    if (newGrid[id].isMine) {
      // Exploded! Reveal all mines and bust
      newGrid[id].state = 'bomb';
      // Reveal other mines
      newGrid.forEach(cell => {
        if (cell.isMine) cell.state = 'bomb';
      });
      setGrid(newGrid);
      setGameState('bust');
      synth.playCrash();

      const netLoss = -activeGameBetRef.current;
      logLoss(uId, activeGameBetRef.current, 'Lucky Mines', pokiBalance);
      syncCasinoData('Lucky Mines', netLoss, parseFloat((pokiBalance - activeGameBetRef.current).toFixed(8)))
        .catch(err => console.error(err));
    } else {
      // Golden Gem found!
      newGrid[id].state = 'gold';
      setGrid(newGrid);
      
      const newRevealedCount = revealedCount + 1;
      setRevealedCount(newRevealedCount);
      synth.playJump();

      // Trigger win if all remaining safe tiles revealed
      const totalSafeTiles = 25 - mineCount;
      if (newRevealedCount === totalSafeTiles) {
        // Auto cashout maximum profit multiplier
        const maxMultiplier = calculateNextMultiplier(totalSafeTiles);
        const payout = activeGameBetRef.current * maxMultiplier;
        
        setGameState('cashout');
        onAwardBalance(parseFloat(payout.toFixed(4)));
        synth.playCoin();
        
        const netProfit = payout - activeGameBetRef.current;
        logWin(uId, activeGameBetRef.current, payout, 'Lucky Mines', pokiBalance);
        syncCasinoData('Lucky Mines', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)))
          .catch(err => console.error(err));
      }
    }
  };

  const handleCashout = () => {
    if (gameState !== 'playing' || revealedCount === 0) return;
    
    const payout = activeGameBetRef.current * currentMultiplier;
    setGameState('cashout');
    onAwardBalance(parseFloat(payout.toFixed(4)));
    synth.playCoin();

    // Reveal all remaining cells to the user
    const newGrid = grid.map(cell => {
      if (cell.state === 'hidden') {
        return { ...cell, state: cell.isMine ? 'bomb' : 'gold' as any };
      }
      return cell;
    });
    setGrid(newGrid as any);

    const netProfit = payout - activeGameBetRef.current;
    const uId = window.currentUserId || 'anonymous';
    logWin(uId, activeGameBetRef.current, payout, 'Lucky Mines', pokiBalance);
    syncCasinoData('Lucky Mines', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)))
      .catch(err => console.error(err));
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#08090c] text-white p-4 max-w-5xl mx-auto w-full gap-6">
      {/* Settings layout sidebar */}
      <div className="w-full md:w-80 bg-[#0f1118] border border-[#d4af37]/20 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bomb className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] font-mono">LUCKY MINES</h2>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-4 text-xs text-zinc-400 font-sans">
            Choose the number of hidden bombs. Uncover <span className="text-[#d4af37] font-bold">Gold Gems</span> to compound multipliers. Click <span className="text-emerald-400 font-bold font-mono">Cash Out</span> at any time to pocket your loot!
          </div>

          {/* Bet size */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block font-bold">Bet Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={betAmount}
                disabled={gameState === 'playing'}
                onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-[#d4af37]/60 text-sm rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Mine count */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[10px] uppercase font-bold font-mono tracking-widest text-zinc-500">
              <span>MINE COUNT</span>
              <span className="text-[#d4af37]">{mineCount} / 24</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={mineCount}
              disabled={gameState === 'playing'}
              onChange={(e) => setMineCount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#d4af37] disabled:opacity-50"
            />
          </div>
        </div>

        {/* Action Button */}
        {gameState === 'playing' ? (
          <button
            onClick={handleCashout}
            disabled={revealedCount === 0}
            className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex flex-col items-center justify-center gap-1 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-40`}
          >
            <span>CASHOUT</span>
            <span className="text-[9px] opacity-75 font-sans font-black">{currentCashout.toFixed(2)} COINS ({currentMultiplier.toFixed(2)}x)</span>
          </button>
        ) : (
          <button
            onClick={handleStartGame}
            className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            START SWEEPING
          </button>
        )}
      </div>

      {/* 5x5 Mines Arena columns */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[400px] flex flex-col justify-between p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.2px,transparent_0.2px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        {/* Header telemetry info */}
        <div className="flex justify-between items-center z-10 w-full mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${gameState === 'playing' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-650'}`} />
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest">
              {gameState === 'playing' ? 'SCANNING SECURE CODES' : 'STANDBY ARENA'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#d4af37] font-bold">MULTIPLIER: {currentMultiplier.toFixed(2)}x</div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 flex items-center justify-center z-10">
          {grid.length > 0 ? (
            <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-[340px] w-full aspect-square">
              {grid.map((cell) => {
                const isHidden = cell.state === 'hidden';
                const isBomb = cell.state === 'bomb';
                const isGold = cell.state === 'gold';

                return (
                  <button
                    key={cell.id}
                    disabled={gameState !== 'playing' || !isHidden}
                    onClick={() => handleCellClick(cell.id)}
                    className={`aspect-square rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer border ${
                      isHidden
                        ? gameState === 'playing'
                          ? 'bg-gradient-to-b from-zinc-950 to-[#12141c] hover:border-[#d4af37]/60 hover:scale-105 border-zinc-850'
                          : 'bg-zinc-900/40 border-zinc-900 opacity-60 cursor-not-allowed'
                        : isGold
                          ? 'bg-gradient-to-b from-[#ffb703]/25 to-[#d4af37]/5 border-[#d4af37] text-[#d4af37] shadow-lg shadow-[#d4af37]/10 scale-100 animate-pulse cursor-default'
                          : 'bg-gradient-to-b from-rose-950/40 to-black border-rose-600 text-rose-500 animate-shake cursor-default'
                    }`}
                  >
                    {isGold && <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37] drop-shadow-[0_0_8px_#d4af37]" />}
                    {isBomb && <Bomb className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 drop-shadow-[0_0_8px_#f43f5e]" />}
                    {isHidden && <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 transition group-hover:bg-[#d4af37]" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-zinc-550 text-xs font-mono max-w-xs uppercase leading-relaxed">
              Place a target sweep bet to initialize the 5x5 Mine Grid and start sweeping for gold coins!
            </div>
          )}
        </div>

        {/* Custom State Bottom overlay */}
        <div className="flex justify-between items-center z-10 w-full border-t border-zinc-900/80 pt-3 text-[10px] font-mono text-zinc-500 mt-4">
          <div>REVEALED SECURE GEMS: <span className="text-[#d4af37] font-bold">{revealedCount}</span></div>
          <div>NEXT GEM multiplier: <span className="text-[#d4af37] font-bold">{nextMultiplier.toFixed(2)}x</span></div>
        </div>
      </div>
    </div>
  );
}
