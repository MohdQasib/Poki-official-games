import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, X, Play, ShieldAlert, Award, Grid } from 'lucide-react';
import { evaluateBet, logWin, logLoss } from '../../utils/casinoRigging';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number, setBet?: (val: number) => void) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

export default function KenoMatrix({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'drawing' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(70);

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [currentBouncingBall, setCurrentBouncingBall] = useState<number | null>(null);

  const [matches, setMatches] = useState<number>(0);
  const [payoutResult, setPayoutResult] = useState<{ win: boolean; mult: number; amount: number; profit: number }>({ win: false, mult: 0, amount: 0, profit: 0 });

  const isStartingRef = useRef<boolean>(false);

  // 1 to 40 board array
  const boardCells = Array.from({ length: 40 }, (_, i) => i + 1);

  const resetGameEngine = () => {
    setDrawnNumbers([]);
    setCurrentBouncingBall(null);
    setMatches(0);
    setPayoutResult({ win: false, mult: 0, amount: 0, profit: 0 });
  };

  // Multipliers based on chosen match count out of selected list
  // Standard lottery risk curve:
  const getKenoMultiplier = (matchCount: number, totalSelected: number) => {
    if (totalSelected === 0) return 0;
    
    // Custom adaptive payouts based on total selected slots count
    const ratio = matchCount / totalSelected;
    if (ratio >= 0.8) return 50.0; // 80%+ hits is immense
    if (ratio >= 0.6) return 15.0; // 60% hits
    if (ratio >= 0.4) return 4.0;  // 40% hits
    if (ratio >= 0.2) return 1.5;  // 20% hits
    return 0; // standard house edge losses
  };

  const handleCellClick = (num: number) => {
    if (gameState === 'drawing') return;

    synth.playCoin();
    setSelectedNumbers((prev) => {
      if (prev.includes(num)) {
        return prev.filter((x) => x !== num);
      } else {
        if (prev.length >= 10) {
          alert('You can only select up to 10 numbers on Keno Matrix.');
          return prev;
        }
        return [...prev, num];
      }
    });
  };

  const drawKenoBalls = () => {
    if (gameState === 'drawing' || isStartingRef.current) return;
    isStartingRef.current = true;

    resetGameEngine();

    if (selectedNumbers.length === 0) {
      alert('Select at least 1 number on the matrix first.');
      isStartingRef.current = false;
      return;
    }

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert('Specify a valid bet greater than 0.');
      isStartingRef.current = false;
      return;
    }

    if (parsedBet < 70) {
      onDeductBalance(parsedBet, setBetAmount);
      isStartingRef.current = false;
      return;
    }

    const uId = window.currentUserId || 'anonymous';
    const evaluation = evaluateBet(uId, parsedBet, pokiBalance);
    if (!evaluation.allowed) {
      alert(evaluation.reason || 'Bet blocked by security parameters.');
      isStartingRef.current = false;
      return;
    }

    if (!onDeductBalance(parsedBet, setBetAmount)) {
      alert('Insufficient Pokicoin balance.');
      isStartingRef.current = false;
      return;
    }

    setGameState('drawing');
    synth.playCoin();
    isStartingRef.current = false;

    let forceLoss = evaluation.shouldForceLoss;
    if (parsedBet >= 300) {
      forceLoss = true;
    }

    // Select 10 random drawn balls
    const finalDrawn: number[] = [];
    while (finalDrawn.length < 10) {
      const idx = Math.floor(Math.random() * 40) + 1;
      if (forceLoss && selectedNumbers.includes(idx)) {
        continue;
      }
      if (!finalDrawn.includes(idx)) {
        finalDrawn.push(idx);
      }
    }

    // Sequence shooter animation
    let ballIndex = 0;
    const shootSequence = () => {
      if (ballIndex < 10) {
        const nextBall = finalDrawn[ballIndex];
        setDrawnNumbers((prev) => [...prev, nextBall]);
        setCurrentBouncingBall(nextBall);
        synth.playJump();
        
        ballIndex++;
        setTimeout(shootSequence, 200); // 200ms increments
      } else {
        // SETTLE KENO MATCHES
        setCurrentBouncingBall(null);

        // find duplicates
        const overlaps = selectedNumbers.filter((x) => finalDrawn.includes(x));
        const overlapCount = overlaps.length;
        setMatches(overlapCount);

        const multiplier = getKenoMultiplier(overlapCount, selectedNumbers.length);
        const isWin = multiplier > 0;

        const payoutVal = isWin ? parseFloat((parsedBet * multiplier).toFixed(8)) : 0;
        const netProfit = isWin ? parseFloat((payoutVal - parsedBet).toFixed(8)) : -parsedBet;

        setPayoutResult({ win: isWin, mult: multiplier, amount: payoutVal, profit: netProfit });
        setGameState('settled');

        if (isWin) {
          synth.playLevelUp();
          onAwardBalance(payoutVal);
          logWin(uId, parsedBet, payoutVal, 'Keno Matrix', pokiBalance);
          syncCasinoData('Keno Lottery', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        } else {
          synth.playCrash();
          logLoss(uId, parsedBet, 'Keno Matrix', pokiBalance);
          syncCasinoData('Keno Lottery', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        }
      }
    };

    setTimeout(shootSequence, 100);
  };

  const resetKenoGrid = () => {
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setGameState('idle');
    synth.playCoin();
  };

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-19-keno">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">KENO MATRIX</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">DECENTRALIZED CRYPTO LOTTERY</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left Side: Interactive 5x8 Grid */}
        <div className="bg-[#0b0c10] border border-[#2a2f3b] p-4 rounded-xl flex flex-col justify-center">
          <div className="grid grid-cols-8 gap-1.5 font-mono text-center">
            {boardCells.map((val) => {
              const isSelected = selectedNumbers.includes(val);
              const isDrawn = drawnNumbers.includes(val);
              const isHitMatch = isSelected && isDrawn;
              const isBouncing = currentBouncingBall === val;

              let styleClasses = 'bg-[#171a21] border border-[#2a2f3b]/70 text-gray-400 hover:border-[#ffb703]/50';
              if (isHitMatch) {
                styleClasses = 'bg-[#ffb703] border-[#ffb703] text-black font-extrabold scale-[1.05] animate-pulse';
              } else if (isBouncing) {
                styleClasses = 'bg-red-500 border-red-500 text-white scale-[1.08] animate-ping';
              } else if (isSelected) {
                styleClasses = 'bg-[#ffd166]/10 border-[#ffb703] text-[#ffb703] font-bold';
              } else if (isDrawn) {
                styleClasses = 'bg-gray-500/10 border-gray-400 text-gray-300';
              }

              return (
                <div
                  key={val}
                  onClick={() => handleCellClick(val)}
                  className={`py-2 rounded text-xs select-none cursor-pointer transition active:scale-95 flex items-center justify-center font-bold ${styleClasses}`}
                >
                  {val.toString().padStart(2, '0')}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between items-center text-[10px] font-mono">
            <span className="text-gray-500">SELECTED: {selectedNumbers.length}/10 NODES</span>
            <button
              onClick={resetKenoGrid}
              disabled={gameState === 'drawing'}
              className="text-[#ffb703] hover:underline disabled:opacity-50 transition uppercase font-bold text-[9px]"
            >
              CLEAR GRID ×
            </button>
          </div>
        </div>

        {/* Right Side Betting Controls */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            {/* Prize Multiplier Chart Box */}
            <div className="bg-[#0b0c10] border border-[#2a2f3b] p-3 rounded-lg font-mono text-[9px] text-gray-400 leading-normal">
              <h5 className="text-[#ffb703] uppercase font-bold text-[10px] mb-1.5">KENO DEFI RATIO CHART</h5>
              <div className="space-y-1">
                <p>• 80%+ Nodes Hit: <span className="text-emerald-400">50.0x payout</span></p>
                <p>• 60%+ Nodes Hit: <span className="text-[#ffd166]">15.0x payout</span></p>
                <p>• 40%+ Nodes Hit: <span className="text-[#ffb703]">4.0x payout</span></p>
                <p>• 20%+ Nodes Hit: <span className="text-[#ffb703]">1.5x payout</span></p>
                <p>• &lt; 20% Hits Yields Stake Crash Bust</p>
              </div>
            </div>

            {/* Stake Input */}
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                <span className="text-gray-400 font-bold uppercase">LOTTERY STAKE AMOUNT</span>
                <span className="text-gray-500">Wallet: {pokiBalance.toFixed(4)} POKI</span>
              </div>
              <input
                type="number"
                disabled={gameState === 'drawing'}
                value={betAmount === 0 ? '' : betAmount}
                onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
                className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2 text-sm font-mono w-full focus:outline-none focus:border-[#ffb703]/50"
              />
            </div>
          </div>

          {gameState === 'settled' && (
            <div className="mt-4 p-3 bg-[#0b0c10] border border-[#2a2f3b] rounded text-center animate-fade-in font-mono text-xs">
              {payoutResult.win ? (
                <>
                  <p className="text-emerald-400 font-bold font-sans">🎉 WINNING LOTTERY: MATCH {matches} SLOTS!</p>
                  <p className="text-white mt-1">Payout received: +{payoutResult.amount.toFixed(4)} POKI</p>
                </>
              ) : (
                <>
                  <p className="text-red-400 font-bold font-sans">❌ NO LUCK: ONLY MATCHED {matches} SLOTS</p>
                  <p className="text-gray-500 mt-1 uppercase text-[10px]">Staked run failed</p>
                </>
              )}
            </div>
          )}

          <button
            onClick={drawKenoBalls}
            disabled={gameState === 'drawing'}
            className="w-full py-3.5 mt-5 bg-[#ffb703] text-black font-sans font-extrabold text-sm uppercase rounded tracking-wider shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95 transition disabled:opacity-50"
          >
            {gameState === 'drawing' ? 'DRAWING ENERGY BALLS...' : 'ACTIVATE DRAW MATRIX'}
          </button>
        </div>
      </div>
    </div>
  );
}
