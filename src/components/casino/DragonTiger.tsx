import React, { useState, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, Play, ShieldAlert, Award, Grid, ShieldCheck, Zap } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

type BetChoice = 'dragon' | 'tiger' | 'tie';

interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  valChar: string;
  rank: number;
}

const SUITS: ('♠' | '♥' | '♦' | '♣')[] = ['♠', '♥', '♦', '♣'];
const CARD_RANKS = [
  { char: 'A', rank: 1 },
  { char: '2', rank: 2 },
  { char: '3', rank: 3 },
  { char: '4', rank: 4 },
  { char: '5', rank: 5 },
  { char: '6', rank: 6 },
  { char: '7', rank: 7 },
  { char: '8', rank: 8 },
  { char: '9', rank: 9 },
  { char: '10', rank: 10 },
  { char: 'J', rank: 11 },
  { char: 'Q', rank: 12 },
  { char: 'K', rank: 13 },
];

function PlayingCard({ card, glowColor }: { card: Card; glowColor: 'rose' | 'amber' }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  const shadowGlow = glowColor === 'rose' 
    ? 'shadow-[0_0_15px_rgba(244,63,94,0.3)] border-rose-500/40' 
    : 'shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-500/40';

  return (
    <div className={`w-18 h-26 bg-gradient-to-br from-white via-[#f5f5f5] to-[#e4e4e4] rounded-2xl flex flex-col justify-between p-2.5 shadow-2xl border-2 transform scale-105 transition-all duration-300 relative overflow-hidden select-none animate-slide-up ${shadowGlow}`}>
      <span className={`text-[13px] font-black leading-none ${isRed ? 'text-red-600' : 'text-zinc-950'}`}>{card.valChar}</span>
      <span className={`text-3xl text-center self-center my-auto ${isRed ? 'text-red-500' : 'text-zinc-800'}`}>{card.suit}</span>
      <span className={`text-[13px] font-black leading-none text-right rotate-180 self-end ${isRed ? 'text-red-600' : 'text-zinc-950'}`}>{card.valChar}</span>
      {/* Dynamic diagonal sheen */}
      <div className="absolute inset-px rounded-[14px] bg-gradient-to-tr from-transparent via-[#ffffff]/5 to-[#ffffff]/10 pointer-events-none" />
    </div>
  );
}

export default function DragonTiger({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'drawing' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedBet, setSelectedBet] = useState<BetChoice>('dragon');

  const [dragonCard, setDragonCard] = useState<Card | null>(null);
  const [tigerCard, setTigerCard] = useState<Card | null>(null);

  const [winStatus, setWinStatus] = useState<boolean | null>(null);
  const [roundWinner, setRoundWinner] = useState<BetChoice | null>(null);
  const [payoutAmt, setPayoutAmt] = useState<number>(0);

  const isDrawingRef = useRef<boolean>(false);

  const getRandomCard = (): Card => {
    const suit = SUITS[Math.floor(Math.random() * 4)];
    const item = CARD_RANKS[Math.floor(Math.random() * CARD_RANKS.length)];
    return {
      suit,
      valChar: item.char,
      rank: item.rank
    };
  };

  const handleDraw = () => {
    if (gameState === 'drawing' || isDrawingRef.current) return;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Please enter a valid bet amount.");
      return;
    }

    if (!onDeductBalance(parsedBet)) {
      alert("Insufficient Balance.");
      return;
    }

    isDrawingRef.current = true;
    setGameState('drawing');
    setWinStatus(null);
    setRoundWinner(null);
    setDragonCard(null);
    setTigerCard(null);
    synth.playCoin();

    // Settle with sequential card draw timers for realism
    setTimeout(() => {
      const dCard = getRandomCard();
      setDragonCard(dCard);
      synth.playJump();

      setTimeout(() => {
        const tCard = getRandomCard();
        setTigerCard(tCard);
        synth.playJump();

        let winner: BetChoice = 'tie';
        if (dCard.rank > tCard.rank) winner = 'dragon';
        else if (tCard.rank > dCard.rank) winner = 'tiger';

        setRoundWinner(winner);

        let isWin = selectedBet === winner;
        let odds = 2.0;

        if (winner === 'tie' && selectedBet !== 'tie') {
          // Half stake returned on tie
          odds = 0.5;
          isWin = true;
        } else if (winner === 'tie') {
          odds = 11.0;
        }

        let computedPayout = 0;
        let netProfit = -parsedBet;

        if (isWin) {
          computedPayout = parsedBet * odds;
          netProfit = computedPayout - parsedBet;
          onAwardBalance(parseFloat(computedPayout.toFixed(4)));
          synth.playCoin();
        } else {
          synth.playCrash();
        }

        setPayoutAmt(computedPayout);
        setWinStatus(isWin && computedPayout > 0);
        setGameState('settled');
        isDrawingRef.current = false;

        syncCasinoData('Dragon Tiger', netProfit, pokiBalance - parsedBet + computedPayout)
          .catch(err => console.error(err));

      }, 800);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#08090c] text-white p-4 max-w-5xl mx-auto w-full gap-6">
      {/* Sidebar Betting controls */}
      <div className="w-full md:w-80 bg-[#0f1118] border border-[#d4af37]/25 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] font-mono">DRAGON TIGER</h2>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-4 text-xs text-zinc-400">
            High-adrenaline digital split. One card dealt to Dragon division, one to Tiger. King is high, Ace is low. Tie takes 11.0x!
          </div>

          {/* Bet size */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block font-bold">Bet Amount</label>
            <input
              type="number"
              value={betAmount}
              disabled={gameState === 'drawing'}
              onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#d4af37]/60 text-sm rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Side selector */}
          <div className="space-y-4 mb-6">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block">Choose Division Bet</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedBet('dragon')}
                disabled={gameState === 'drawing'}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'dragon'
                    ? 'bg-rose-950/45 border-rose-600 text-rose-400'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                DRAGON
                <span className="block text-[8px] opacity-60 text-white mt-0.5">2.0x</span>
              </button>
              <button
                onClick={() => setSelectedBet('tie')}
                disabled={gameState === 'drawing'}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'tie'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                TIE
                <span className="block text-[8px] opacity-60 text-white mt-0.5">11.0x</span>
              </button>
              <button
                onClick={() => setSelectedBet('tiger')}
                disabled={gameState === 'drawing'}
                className={`py-2 px-1 text-center rounded-xl border font-mono text-[11px] font-bold tracking-wider transition cursor-pointer disabled:opacity-50 ${
                  selectedBet === 'tiger'
                    ? 'bg-amber-950/45 border-amber-600 text-amber-400'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                TIGER
                <span className="block text-[8px] opacity-60 text-white mt-0.5">2.0x</span>
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDraw}
          disabled={gameState === 'drawing'}
          className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer ${
            gameState === 'drawing'
              ? 'bg-zinc-900 border border-zinc-800 text-zinc-650 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30'
          }`}
        >
          {gameState === 'drawing' ? 'Dealing confrontation...' : 'Settle Hand Bet'}
        </button>
      </div>

      {/* Duel Screen */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[400px] flex flex-col justify-between p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.2px,transparent_0.2px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        {/* Header section info */}
        <div className="flex justify-between items-center z-10 w-full mb-4">
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest font-bold">50-50 HIGH SUSPENSE COMBAT BOARD</span>
          <span className="text-[10px] font-mono text-[#d4af37] font-bold font-bold">RTP RATE: 96.27%</span>
        </div>

        {/* Core Deal visual stage */}
        <div className="flex-1 flex flex-col sm:flex-row items-stretch justify-center gap-6 z-10 py-6">
          {/* Dragon Card Container */}
          <div className="flex-1 bg-rose-950/10 border border-rose-950/40 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
            <div className="text-xs uppercase font-mono tracking-wider font-bold text-rose-500 mb-2">DRAGON SIDE</div>
            <div className="flex-grow flex items-center justify-center min-h-[140px]">
              {dragonCard ? (
                <PlayingCard card={dragonCard} glowColor="rose" />
              ) : (
                <div className="text-zinc-750 font-mono text-[10px] uppercase tracking-widest animate-pulse">Waiting for flip...</div>
              )}
            </div>
            {dragonCard && <div className="text-[10px] font-mono font-bold text-rose-400 mt-2">STRENGTH RANK: {dragonCard.rank}</div>}
          </div>

          {/* Golden division ring */}
          <div className="flex justify-center items-center text-[#d4af37] text-lg font-mono font-black py-2 self-center bg-zinc-900/60 w-10 h-10 rounded-full border border-zinc-800">VS</div>

          {/* Tiger Card Container */}
          <div className="flex-1 bg-amber-950/10 border border-amber-950/40 rounded-2xl p-4 flex flex-col justify-between items-center text-center">
            <div className="text-xs uppercase font-mono tracking-wider font-bold text-amber-500 mb-2">TIGER SIDE</div>
            <div className="flex-grow flex items-center justify-center min-h-[140px]">
              {tigerCard ? (
                <PlayingCard card={tigerCard} glowColor="amber" />
              ) : (
                <div className="text-zinc-750 font-mono text-[10px] uppercase tracking-widest animate-pulse">Waiting for flip...</div>
              )}
            </div>
            {tigerCard && <div className="text-[10px] font-mono font-bold text-amber-400 mt-2">STRENGTH RANK: {tigerCard.rank}</div>}
          </div>
        </div>

        {/* Results view layer */}
        {gameState === 'settled' && roundWinner && (
          <div className="absolute inset-x-0 bottom-16 flex justify-center p-4 z-20 animate-fade-in">
            <div className="bg-zinc-900/95 border border-zinc-800 rounded-2xl p-4 text-center max-w-sm w-full mx-auto shadow-2xl backdrop-blur-md">
              <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest font-bold">DECK MATCH SETTLED</div>
              <div className="text-lg font-black text-[#d4af37] font-mono uppercase tracking-wider">
                {roundWinner === 'tie' ? 'TIE HAND DRAWN' : `${roundWinner.toUpperCase()} HAND WINS`}
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

        {/* Footer division */}
        <div className="flex justify-between items-center z-10 w-full border-t border-zinc-900/80 pt-3 text-[10px] font-mono text-zinc-500 mt-4">
          <div>COMMITTED TARGET: <span className="text-[#d4af37] font-bold">{selectedBet.toUpperCase()}</span></div>
          <div>ESTIMATED STAKE: <span className="text-[#d4af37] font-bold">{betAmount} Coins</span></div>
        </div>
      </div>
    </div>
  );
}
