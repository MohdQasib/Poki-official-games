import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, X, Play, ShieldAlert, Award, ChevronUp, ChevronDown } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

interface Card {
  suit: string; // 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value: number; // 1 (Ace) to 13 (King)
  suitChar: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const cardNames = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

export default function HiloLedger({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'busted' | 'cashed_out'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);

  // Card items
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [previousCards, setPreviousCards] = useState<Card[]>([]);

  // Streak tracker
  const [streakCount, setStreakCount] = useState<number>(0);
  const [accumulatedMultiplier, setAccumulatedMultiplier] = useState<number>(1.0);

  const generateCard = (): Card => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomVal = Math.floor(Math.random() * 13) + 1;
    return {
      suit: randomSuit,
      value: randomVal,
      suitChar: suitSymbols[randomSuit as keyof typeof suitSymbols],
    };
  };

  const startHiloGame = () => {
    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert('Specify a valid bet greater than 0.');
      return;
    }

    if (!onDeductBalance(parsedBet)) {
      alert('Insufficient Pokicoin balance.');
      return;
    }

    setGameState('playing');
    setStreakCount(0);
    setAccumulatedMultiplier(1.0);
    setPreviousCards([]);

    const initialCard = generateCard();
    setCurrentCard(initialCard);
    synth.playCoin();
  };

  // Predict: 'higher' or 'lower'
  const makePrediction = (prediction: 'higher' | 'lower') => {
    if (gameState !== 'playing' || !currentCard) return;

    synth.playJump();

    const draw = generateCard();
    const currVal = currentCard.value;
    const nextVal = draw.value;

    let correct = false;

    if (prediction === 'higher' && nextVal >= currVal) {
      correct = true;
    } else if (prediction === 'lower' && nextVal <= currVal) {
      correct = true;
    }

    // Capture history
    setPreviousCards((prev) => [currentCard, ...prev].slice(0, 4));
    setCurrentCard(draw);

    if (correct) {
      // Scale multiplier logically based on current value relative index
      // Harder rolls yield significantly bigger multiplier growth!
      let difficultyMultiplier = 1.25;
      if (prediction === 'higher') {
        difficultyMultiplier = 1 + (currVal / 11);
      } else {
        difficultyMultiplier = 1 + ((14 - currVal) / 11);
      }

      difficultyMultiplier = Math.max(1.15, Math.min(1.95, difficultyMultiplier));

      const nextMultiplier = parseFloat((accumulatedMultiplier * difficultyMultiplier).toFixed(3));
      setAccumulatedMultiplier(nextMultiplier);
      setStreakCount((prev) => prev + 1);
      synth.playLevelUp();
    } else {
      // BUSTED!
      setGameState('busted');
      synth.playCrash();
      syncCasinoData('HiLo Ledger', -betAmount, parseFloat((pokiBalance - betAmount).toFixed(8)));
    }
  };

  const cashOut = () => {
    if (gameState !== 'playing') return;

    const winnings = parseFloat((betAmount * accumulatedMultiplier).toFixed(8));
    const profit = parseFloat((winnings - betAmount).toFixed(8));

    setGameState('cashed_out');
    synth.playLevelUp();

    onAwardBalance(winnings);
    syncCasinoData('HiLo Ledger', profit, parseFloat((pokiBalance + profit).toFixed(8)));
  };

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-16-hilo">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <ChevronUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">HILO LEDGER</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">STREAK-BASED CARD PREDICTOR</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left Card Deck visual screen */}
        <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded-xl p-5 md:p-6 flex flex-col justify-center items-center min-h-[260px] relative">
          
          {gameState === 'playing' && currentCard ? (
            <div className="flex flex-col items-center justify-center w-full">
              {/* Playing Card Body */}
              <div className="w-24 h-36 bg-white rounded-xl shadow-2xl relative flex flex-col justify-between p-3 select-none text-black transform hover:rotate-1 transition-transform">
                <div className="text-left font-mono font-extrabold text-lg leading-none">
                  {cardNames[currentCard.value as keyof typeof cardNames]}
                  <span className={`block text-xs ${['hearts', 'diamonds'].includes(currentCard.suit) ? 'text-rose-600' : 'text-slate-800'}`}>
                    {currentCard.suitChar}
                  </span>
                </div>

                <div className={`text-center font-sans text-5xl font-black ${
                  ['hearts', 'diamonds'].includes(currentCard.suit) ? 'text-rose-600' : 'text-slate-800'
                }`}>
                  {currentCard.suitChar}
                </div>

                <div className="text-right font-mono font-extrabold text-lg leading-none rotate-180">
                  {cardNames[currentCard.value as keyof typeof cardNames]}
                  <span className={`block text-xs ${['hearts', 'diamonds'].includes(currentCard.suit) ? 'text-rose-600' : 'text-slate-800'}`}>
                    {currentCard.suitChar}
                  </span>
                </div>
              </div>

              {/* Accumulating indicators */}
              <div className="mt-4 text-center font-mono text-[10px]">
                <p className="text-[#ffb703] font-bold">MULTIPLE POOLS: <span className="text-base text-white">{accumulatedMultiplier.toFixed(2)}x</span></p>
                <p className="text-gray-500 mt-0.5">CURRENT STREAK: {streakCount} ROUNDS</p>
              </div>
            </div>
          ) : gameState === 'busted' ? (
            <div className="text-center animate-fade-in">
              <ShieldAlert className="w-14 h-14 text-red-500 mx-auto animate-bounce mb-3" />
              <h2 className="text-white font-sans font-black text-xl leading-none uppercase">BUSTED NODE!</h2>
              <p className="text-xs text-gray-500 mt-2 max-w-xs">You guessed incorrect direction on draw. Staked payout collapsed.</p>
              <button
                onClick={() => setGameState('idle')}
                className="mt-5 px-6 py-2 bg-gradient-to-r from-red-500 to-amber-600 text-white font-mono font-bold text-xs uppercase rounded cursor-pointer transition active:scale-95"
              >
                STAKE REBOOT
              </button>
            </div>
          ) : gameState === 'cashed_out' ? (
            <div className="text-center animate-fade-in">
              <Award className="w-16 h-16 text-emerald-400 mx-auto animate-spin-reverse mb-2" />
              <h2 className="text-[#ffb703] font-sans font-black text-2xl uppercase">CASH OUT SECURED!</h2>
              <p className="text-xs text-white mt-1">Acquired streak of <span className="font-bold font-mono">{streakCount} matches</span>.</p>
              
              <div className="mt-3 bg-black/40 border border-[#2a2f3b] py-2 px-5 rounded font-mono text-xs text-emerald-400 font-extrabold">
                PAYOUT RECEIVED: +{(betAmount * accumulatedMultiplier).toFixed(4)} POKI
              </div>

              <button
                onClick={() => setGameState('idle')}
                className="mt-5 px-6 py-2 bg-[#ffb703] hover:brightness-110 font-mono font-bold text-xs text-black uppercase rounded cursor-pointer active:scale-95 transition"
              >
                NEXT GAME STAKE
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-gray-400 font-sans font-bold text-base uppercase">Ledger Deck Ready</h3>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed mt-2">
                Click INITIATE below to generate seed playing card, predict higher/lower to scale reward.
              </p>
            </div>
          )}

          {/* Previous drawn cards breadcrumbs matching Screenshot card list */}
          {gameState === 'playing' && previousCards.length > 0 && (
            <div className="absolute bottom-3 left-4 flex gap-1.5 items-center bg-black/40 border border-[#2a2f3b]/50 rounded-lg p-1">
              <span className="text-[8px] font-mono font-bold text-gray-500 uppercase px-1">PREV:</span>
              {previousCards.map((pCard, idx) => (
                <div key={idx} className="bg-white text-black px-1.5 py-0.5 rounded text-[10px] font-mono leading-none font-bold">
                  {cardNames[pCard.value as keyof typeof cardNames]}
                  <span className={['hearts', 'diamonds'].includes(pCard.suit) ? 'text-rose-600' : 'text-slate-800'}>
                    {pCard.suitChar}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right card predictions and bet layout */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            {gameState === 'playing' ? (
              <div className="space-y-3">
                <span className="block text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase mb-1 flex items-center gap-1">
                  PREDICT NEXT CARD VALUE
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* HIGHER BUTTON */}
                  <button
                    onClick={() => makePrediction('higher')}
                    className="py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-sans font-black text-xs uppercase rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ChevronUp className="w-5 h-5" />
                    HIGHER OR EQUAL
                  </button>

                  {/* LOWER BUTTON */}
                  <button
                    onClick={() => makePrediction('lower')}
                    className="py-3 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-sans font-black text-xs uppercase rounded flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ChevronDown className="w-5 h-5" />
                    LOWER OR EQUAL
                  </button>
                </div>

                <div className="border border-dashed border-[#2a2f3b]/80 pt-3">
                  <button
                    onClick={cashOut}
                    className="w-full py-3 bg-[#0b0c10] hover:bg-[#1a1f26] border-2 border-[#ffb703]/50 text-white font-mono font-black text-xs uppercase rounded hover:border-[#ffb703] transition tracking-widest cursor-pointer"
                  >
                    🔒 CASH OUT MUTATION
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bet Input and trigger */}
                <div>
                  <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                    <span className="text-gray-400 font-bold uppercase">HI-LO PRIMARY STAKE</span>
                    <span className="text-gray-500">Bal: {pokiBalance.toFixed(8)}</span>
                  </div>
                  <input
                    type="number"
                    disabled={gameState === 'playing'}
                    value={betAmount === 0 ? '' : betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
                    className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2.5 text-sm font-mono w-full focus:outline-none focus:border-[#ffb703]/50"
                  />
                </div>

                <button
                  onClick={startHiloGame}
                  className="w-full py-4 bg-[#ffb703] hover:brightness-110 font-sans font-extrabold text-sm uppercase text-black rounded tracking-widest shadow-lg shadow-amber-500/10 cursor-pointer active:scale-98 transition"
                >
                  INITIATE HILO RUN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
