import React, { useState, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, Play, ShieldAlert, Award, Grid, ShieldCheck, Heart } from 'lucide-react';
import { evaluateBet, logWin, logLoss } from '../../utils/casinoRigging';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number, setBet?: (val: number) => void) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

type BetTarget = 'player' | 'banker' | 'tie';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  valChar: string;
  score: number;
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const CARDS_MAP = [
  { char: 'A', score: 1 },
  { char: '2', score: 2 },
  { char: '3', score: 3 },
  { char: '4', score: 4 },
  { char: '5', score: 5 },
  { char: '6', score: 6 },
  { char: '7', score: 7 },
  { char: '8', score: 8 },
  { char: '9', score: 9 },
  { char: '10', score: 0 },
  { char: 'J', score: 0 },
  { char: 'Q', score: 0 },
  { char: 'K', score: 0 },
];

function PlayingCard({ card }: { card: Card; key?: any }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div className="w-14 h-20 bg-gradient-to-br from-white via-[#f0f0f0] to-[#e4e4e4] rounded-xl flex flex-col justify-between p-2 shadow-2xl border border-zinc-200 transform hover:scale-105 transition-all duration-300 relative overflow-hidden select-none animate-slide-up">
      {/* Sparkle top sheen */}
      <span className={`text-base font-black leading-none ${isRed ? 'text-red-600' : 'text-zinc-950'}`}>{card.valChar}</span>
      <span className={`text-2xl text-center self-center my-auto ${isRed ? 'text-red-500' : 'text-zinc-800'}`}>{card.suit}</span>
      <span className={`text-base font-black leading-none text-right rotate-180 self-end ${isRed ? 'text-red-600' : 'text-zinc-950'}`}>{card.valChar}</span>
      <div className="absolute inset-px rounded-[10px] bg-gradient-to-tr from-transparent via-[#ffffff]/5 to-[#ffffff]/10 pointer-events-none" />
    </div>
  );
}

export default function BaccaratLite({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'dealing' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(70);
  const [selectedBet, setSelectedBet] = useState<BetTarget>('player');

  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [bankerScore, setBankerScore] = useState<number>(0);

  const [winStatus, setWinStatus] = useState<boolean | null>(null);
  const [roundWinner, setRoundWinner] = useState<BetTarget | null>(null);
  const [payoutAmt, setPayoutAmt] = useState<number>(0);

  const isDealingRef = useRef<boolean>(false);

  const getRandomCard = (): Card => {
    const suit = SUITS[Math.floor(Math.random() * 4)];
    const map = CARDS_MAP[Math.floor(Math.random() * CARDS_MAP.length)];
    return {
      suit,
      valChar: map.char,
      score: map.score
    };
  };

  const handleDeal = () => {
    if (gameState === 'dealing' || isDealingRef.current) return;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Please enter a valid bet amount.");
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

    isDealingRef.current = true;
    setGameState('dealing');
    setWinStatus(null);
    setRoundWinner(null);
    setPlayerCards([]);
    setBankerCards([]);
    setPlayerScore(0);
    setBankerScore(0);
    synth.playCoin();

    // Determine rigged outcome
    let expectedWin = false;
    if (evaluation.shouldForceLoss) {
      expectedWin = false;
    } else {
      // Honeymoon phase / normal
      const stats = JSON.parse(localStorage.getItem(`casino_rigging_${uId}`) || '{}');
      const isHoneymoon = stats.firstPlayTime && (Date.now() - stats.firstPlayTime < 5 * 60 * 1000);
      let winChance = 0.44; // standard house edge (under 50%)
      if (isHoneymoon && parsedBet < 150) {
        winChance = 0.65;
      } else if (evaluation.applyBrakeMode && parsedBet < 100) {
        winChance = 0.55;
      }
      expectedWin = Math.random() < winChance;
    }

    // Pre-calculate full game cards to match the expectedWin state
    let pc1 = getRandomCard(), pc2 = getRandomCard(), pc3: Card | null = null;
    let bc1 = getRandomCard(), bc2 = getRandomCard(), bc3: Card | null = null;
    let pTotal = 0, bTotal = 0;
    let winner: BetTarget = 'tie';

    let attempts = 0;
    while (attempts < 1000) {
      pc1 = getRandomCard(); pc2 = getRandomCard(); pc3 = null;
      bc1 = getRandomCard(); bc2 = getRandomCard(); bc3 = null;

      pTotal = (pc1.score + pc2.score) % 10;
      bTotal = (bc1.score + bc2.score) % 10;

      if (pTotal < 6) {
        pc3 = getRandomCard();
        pTotal = (pTotal + pc3.score) % 10;
      }
      if (bTotal < 6) {
        bc3 = getRandomCard();
        bTotal = (bTotal + bc3.score) % 10;
      }

      winner = 'tie';
      if (pTotal > bTotal) winner = 'player';
      else if (bTotal > pTotal) winner = 'banker';

      const isWin = selectedBet === winner;
      if (isWin === expectedWin) {
        break;
      }
      attempts++;
    }

    // Sequential Deal Animation with pre-calculated cards
    setTimeout(() => {
      setPlayerCards([pc1]);
      setPlayerScore(pc1.score % 10);
      synth.playJump();

      setTimeout(() => {
        setBankerCards([bc1]);
        setBankerScore(bc1.score % 10);
        synth.playJump();

        setTimeout(() => {
          const pCards = [pc1, pc2];
          setPlayerCards(pCards);
          let pTotalSoFar = (pc1.score + pc2.score) % 10;
          setPlayerScore(pTotalSoFar);
          synth.playJump();

          setTimeout(() => {
            const bCards = [bc1, bc2];
            setBankerCards(bCards);
            let bTotalSoFar = (bc1.score + bc2.score) % 10;
            setBankerScore(bTotalSoFar);
            synth.playJump();

            setTimeout(() => {
              // Deal optional third cards
              let pFinalCards = [...pCards];
              let bFinalCards = [...bCards];

              if (pc3) {
                pFinalCards.push(pc3);
                setPlayerCards(pFinalCards);
                setPlayerScore(pTotal);
                synth.playJump();
              }

              setTimeout(() => {
                if (bc3) {
                  bFinalCards.push(bc3);
                  setBankerCards(bFinalCards);
                  setBankerScore(bTotal);
                  synth.playJump();
                }

                setTimeout(() => {
                  setRoundWinner(winner);

                  const isWin = selectedBet === winner;
                  let odds = 2.0; 
                  if (winner === 'banker') odds = 1.95; 
                  if (winner === 'tie') odds = 9.0; 

                  let computedPayout = 0;
                  let netProfit = -parsedBet;

                  if (isWin) {
                    computedPayout = parsedBet * odds;
                    netProfit = computedPayout - parsedBet;
                    onAwardBalance(parseFloat(computedPayout.toFixed(4)));
                    synth.playCoin();
                    logWin(uId, parsedBet, computedPayout, 'Baccarat Lite', pokiBalance);
                  } else {
                    synth.playCrash();
                    logLoss(uId, parsedBet, 'Baccarat Lite', pokiBalance);
                  }

                  setPayoutAmt(computedPayout);
                  setWinStatus(isWin);
                  setGameState('settled');
                  isDealingRef.current = false;

                  syncCasinoData('Baccarat Lite', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)))
                    .catch(err => console.error(err));
                }, 500);
              }, pc3 ? 500 : 0);
            }, 600);
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#08090c] text-white p-4 max-w-5xl mx-auto w-full gap-6">
      {/* Sidebar Control Column */}
      <div className="w-full md:w-80 bg-[#0f1118] border border-[#d4af37]/25 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-[#d4af37] fill-current" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] font-mono">BACCARAT ADVANCED</h2>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-4 text-xs text-zinc-400">
            A real-physics premium Baccarat board. Hand scores are calculated by summing cards modulo 10 (Tens/Face cards are worth 0).
          </div>

          {/* Bet size */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block font-bold">Bet Amount</label>
            <input
              type="number"
              value={betAmount}
              disabled={gameState === 'dealing'}
              onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#d4af37]/60 text-sm rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Target selector */}
          <div className="space-y-2 mb-6">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block">Choose Bet Target</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedBet('player')}
                disabled={gameState === 'dealing'}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'player'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                PLAYER
                <span className="block text-[8px] opacity-60 text-white mt-0.5">2.0x</span>
              </button>
              <button
                onClick={() => setSelectedBet('tie')}
                disabled={gameState === 'dealing'}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'tie'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                TIE
                <span className="block text-[8px] opacity-60 text-white mt-0.5">9.0x</span>
              </button>
              <button
                onClick={() => setSelectedBet('banker')}
                disabled={gameState === 'dealing'}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'banker'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                BANKER
                <span className="block text-[8px] opacity-60 text-white mt-0.5">1.95x</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDeal}
          disabled={gameState === 'dealing'}
          className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
            gameState === 'dealing'
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-650 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30'
          }`}
        >
          {gameState === 'dealing' ? 'Dealing advanced hands...' : 'Place Baccarat Bet'}
        </button>
      </div>

      {/* Arena container */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[400px] flex flex-col justify-between p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.2px,transparent_0.2px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        <div className="flex justify-between items-center z-10 w-full mb-4">
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest font-bold">DIGITAL LIVE COUPE DECK</span>
          <span className="text-[10px] font-mono text-[#d4af37] font-bold">HOUSE RTP: 98.94%</span>
        </div>

        {/* Dealing Table Arena */}
        <div className="flex-1 flex flex-col sm:flex-row items-stretch justify-center gap-6 z-10 py-4">
          {/* Player Hand Cylinder */}
          <div className="flex-1 bg-[#0a0c10]/80 border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
            <div className="text-xs uppercase font-mono tracking-wider font-bold text-blue-400 mb-2">PLAYER</div>
            <div className="flex flex-wrap justify-center items-center gap-2 flex-grow min-h-[100px]">
              {playerCards.map((card, idx) => (
                <PlayingCard key={idx} card={card} />
              ))}
              {playerCards.length === 0 && <div className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">Waiting for deal...</div>}
            </div>
            <div className="text-2xl font-black font-mono text-white mt-2">SCORE: <span className="text-blue-400">{playerScore}</span></div>
          </div>

          {/* Banker Hand Cylinder */}
          <div className="flex-1 bg-[#0f0a0a]/80 border border-zinc-900 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
            <div className="text-xs uppercase font-mono tracking-wider font-bold text-amber-500 mb-2">BANKER</div>
            <div className="flex flex-wrap justify-center items-center gap-2 flex-grow min-h-[100px]">
              {bankerCards.map((card, idx) => (
                <PlayingCard key={idx} card={card} />
              ))}
              {bankerCards.length === 0 && <div className="text-zinc-600 text-[10px] font-mono uppercase tracking-widest">Waiting for deal...</div>}
            </div>
            <div className="text-2xl font-black font-mono text-white mt-2">SCORE: <span className="text-amber-500">{bankerScore}</span></div>
          </div>
        </div>

        {/* Results Panel */}
        {gameState === 'settled' && roundWinner && (
          <div className="absolute inset-x-0 bottom-16 flex justify-center p-4 z-20">
            <div className="animate-fade-in bg-zinc-900/95 border border-zinc-800 rounded-2xl p-4 text-center max-w-sm w-full mx-auto shadow-2xl backdrop-blur-md">
              <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">Round Concluded</div>
              <div className="text-lg font-black text-[#d4af37] font-mono uppercase tracking-wider">
                {roundWinner === 'tie' ? 'TIE HAND' : `${roundWinner.toUpperCase()} HAND WINS`}
              </div>
              <div className={`mt-2 text-xs font-bold font-mono tracking-wider uppercase px-4 py-1.5 rounded-lg border ${
                winStatus
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
              }`}>
                {winStatus ? `YOU WIN: +${payoutAmt.toFixed(2)}` : 'HOUSE WINS'}
              </div>
            </div>
          </div>
        )}

        {/* Bottom footer status */}
        <div className="flex justify-between items-center z-10 w-full border-t border-zinc-900/80 pt-3 text-[10px] font-mono text-zinc-500 mt-4">
          <div>BETTING TARGET: <span className="text-[#d4af37] font-bold">{selectedBet.toUpperCase()}</span></div>
          <div>BET VALUE: <span className="text-[#d4af37] font-bold">{betAmount} Coins</span></div>
        </div>
      </div>
    </div>
  );
}
