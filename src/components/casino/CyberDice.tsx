import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, X, Play, ShieldAlert, Award, Dices } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

export default function CyberDice({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'rolling' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [rollType, setRollType] = useState<'under' | 'over'>('under');
  const [sliderVal, setSliderVal] = useState<number>(50);

  // Results
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [winStatus, setWinStatus] = useState<boolean>(false);
  const [payoutAmt, setPayoutAmt] = useState<number>(0);
  
  // High speed animation state
  const [flashRoll, setFlashRoll] = useState<number>(50);

  const isStartingRef = useRef<boolean>(false);

  // Dynamic Multiplier math
  const getWinChance = () => {
    if (rollType === 'under') {
      return sliderVal; // strictly sliderVal% chance to roll under
    } else {
      return 100 - sliderVal; // (100-sliderVal)% chance to roll over
    }
  };

  const getMultiplier = () => {
    const chance = getWinChance();
    if (chance <= 0 || chance >= 100) return 1.0;
    // 98% RTP standard casino fair math
    return parseFloat((98 / chance).toFixed(4));
  };

  const winChance = getWinChance();
  const multiplier = getMultiplier();
  const projectedPayout = betAmount * multiplier;

  const resetGameEngine = () => {
    setDiceRoll(null);
    setPayoutAmt(0);
    setWinStatus(false);
  };

  const rollDice = () => {
    if (gameState === 'rolling' || isStartingRef.current) return;
    isStartingRef.current = true;

    resetGameEngine();

    if (sliderVal < 2 || sliderVal > 98) {
      alert("Bounds must be between 2 and 98 to keep fair math odds.");
      isStartingRef.current = false;
      return;
    }

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

    setGameState('rolling');
    synth.playCoin();
    isStartingRef.current = false;

    // Start high speed flash cycle
    let cycles = 0;
    const maxCycles = 25;
    const rollStart = Date.now();

    const triggerRollCycle = () => {
      cycles++;
      const randomFlash = Math.floor(Math.random() * 100) + 1;
      setFlashRoll(randomFlash);
      synth.playJump();

      if (cycles < maxCycles) {
        setTimeout(triggerRollCycle, 45 + cycles * 2); // gradual deceleration
      } else {
        // SETTLE ROLL OUTCOME
        const finalOutcome = Math.floor(Math.random() * 100) + 1;
        setDiceRoll(finalOutcome);

        let isWin = false;
        if (rollType === 'under' && finalOutcome < sliderVal) {
          isWin = true;
        } else if (rollType === 'over' && finalOutcome > sliderVal) {
          isWin = true;
        }

        const payoutVal = isWin ? parseFloat((parsedBet * multiplier).toFixed(8)) : 0;
        const netProfit = isWin ? parseFloat((payoutVal - parsedBet).toFixed(8)) : -parsedBet;

        setWinStatus(isWin);
        setPayoutAmt(payoutVal);
        setGameState('settled');

        if (isWin) {
          synth.playLevelUp();
          onAwardBalance(payoutVal);
          syncCasinoData('Cyber Dice', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        } else {
          synth.playCrash();
          syncCasinoData('Cyber Dice', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
        }
      }
    };

    triggerRollCycle();
  };

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-13-dice">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <Dices className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">CYBER DICE</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">HIGH / LOW PREDICTION MATRIX</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Interactive display screen */}
        <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded-lg p-6 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
          {gameState === 'rolling' ? (
            <div className="text-center animate-pulse">
              <h1 className="text-7xl font-mono font-black tracking-widest text-amber-500">
                {flashRoll.toString().padStart(2, '0')}
              </h1>
              <span className="text-[10px] font-mono tracking-wider text-gray-500 uppercase block mt-2">
                SHUFFLING PROBABILITIES...
              </span>
            </div>
          ) : gameState === 'settled' && diceRoll !== null ? (
            <div className="text-center animate-fade-in w-full">
              {winStatus ? (
                <Award className="w-12 h-12 text-emerald-400 mx-auto animate-bounce mb-3" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-red-400 mx-auto animate-bounce mb-3" />
              )}
              
              <div className="mb-2">
                <span className="text-xs text-gray-400 font-mono">DICE ROLLED</span>
                <h1 className={`text-6xl font-mono font-black ${winStatus ? 'text-emerald-400' : 'text-red-500'}`}>
                  {diceRoll}
                </h1>
                <span className="text-[10px] font-medium text-gray-400 uppercase">
                  Target: {rollType === 'under' ? `< ${sliderVal}` : `> ${sliderVal}`}
                </span>
              </div>

              <div className="mt-4 bg-black/40 border border-[#2a2f3b] p-2.5 rounded font-mono text-sm max-w-[220px] mx-auto">
                {winStatus ? (
                  <p className="text-emerald-400 font-bold">OUTCOME WIN: +{payoutAmt.toFixed(4)} POKI</p>
                ) : (
                  <p className="text-red-500">OUTCOME LOSS: -{betAmount} POKI</p>
                )}
              </div>

              <button
                onClick={() => setGameState('idle')}
                className="mt-4 px-5 py-2 bg-[#ffb703] hover:brightness-110 font-mono font-bold text-xs uppercase text-black rounded cursor-pointer"
              >
                ROLL AGAIN
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-6xl font-mono font-extrabold text-[#ffb703]">DICE</h1>
              <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase block mt-1">
                ADJUST VALUES TO START
              </span>
            </div>
          )}
        </div>

        {/* Right: Controller Sliders and Predictors */}
        <div className="space-y-4">
          {/* Prediction Selection */}
          <div>
            <span className="block text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase mb-1.5">
              PREDICTION DIRECTION
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={gameState === 'rolling'}
                onClick={() => { synth.playCoin(); setRollType('under'); }}
                className={`py-2 px-3 border rounded text-xs font-bold font-mono transition flex flex-col items-center justify-center cursor-pointer ${
                  rollType === 'under'
                    ? 'bg-[#ffb703] text-black border-[#ffb703]'
                    : 'bg-[#0b0c10] text-[#ffb703] border-[#2a2f3b] hover:border-[#ffb703]/50'
                }`}
              >
                ROLL UNDER
              </button>
              <button
                disabled={gameState === 'rolling'}
                onClick={() => { synth.playCoin(); setRollType('over'); }}
                className={`py-2 px-3 border rounded text-xs font-bold font-mono transition flex flex-col items-center justify-center cursor-pointer ${
                  rollType === 'over'
                    ? 'bg-[#ffb703] text-black border-[#ffb703]'
                    : 'bg-[#0b0c10] text-[#ffb703] border-[#2a2f3b] hover:border-[#ffb703]/50'
                }`}
              >
                ROLL OVER
              </button>
            </div>
          </div>

          {/* Slider input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                TARGET BOUND: <span className="text-[#ffb703] text-sm">{sliderVal}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                WIN CHANCE: <span className="text-[#ffd166]">{winChance}%</span>
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={98}
              disabled={gameState === 'rolling'}
              value={sliderVal}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSliderVal(val);
                // click tick every 5 slider points
                if (val % 5 === 0) synth.playJump();
              }}
              className="w-full accent-[#ffb703] bg-[#0b0c10] rounded h-2 border border-[#2a2f3b] outline-none cursor-pointer"
            />
          </div>

          {/* Outputs */}
          <div className="grid grid-cols-2 gap-3 font-mono text-[11px] bg-[#0b0c10] border border-[#2a2f3b] p-3 rounded">
            <div>
              <span className="text-gray-500">MULTIPLIER</span>
              <p className="text-[#ffb703] font-bold text-base mt-0.5">{multiplier.toFixed(4)}x</p>
            </div>
            <div>
              <span className="text-gray-500">PAYOUT ON WIN</span>
              <p className="text-emerald-400 font-bold text-base mt-0.5">{(projectedPayout || 0).toFixed(4)} POKI</p>
            </div>
          </div>

          {/* Bet inputs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">STAKE INTEREST</span>
              <span className="text-[10px] font-mono text-gray-500">Bal: {pokiBalance.toFixed(8)} POKI</span>
            </div>
            <input
              type="number"
              disabled={gameState === 'rolling'}
              value={betAmount === 0 ? '' : betAmount}
              onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
              className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2 text-sm font-mono w-full focus:border-[#ffb703]/50 focus:outline-none"
            />
          </div>

          <button
            onClick={rollDice}
            disabled={gameState === 'rolling'}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-sans font-black text-sm uppercase rounded shadow-lg shadow-amber-500/15 tracking-widest cursor-pointer transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            <Play className="w-4 h-4 fill-black" />
            INITIATE DICE ROLL
          </button>
        </div>
      </div>
    </div>
  );
}
