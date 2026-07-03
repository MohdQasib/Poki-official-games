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

interface Card {
  suit: string; // 'hearts' | 'diamonds' | 'clubs' | 'spades'
  value: number; // 2 to 14 (14 is Ace)
  suitChar: string;
  label: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const cardNames = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};

export default function BlackjackMini({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dealer_turn' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(70);

  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);

  const [resultMessage, setResultMessage] = useState<string>('');
  const [winStatus, setWinStatus] = useState<'win' | 'lose' | 'push' | 'blackjack'>('lose');
  const [payoutAmt, setPayoutAmt] = useState<number>(0);
  const [forceLoss, setForceLoss] = useState<boolean>(false);

  const isStartingRef = useRef<boolean>(false);

  // Initialize deck
  const createDeck = (): Card[] => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const generated: Card[] = [];
    suits.forEach((st) => {
      for (let v = 2; v <= 14; v++) {
        generated.push({
          suit: st,
          value: v,
          suitChar: suitSymbols[st as keyof typeof suitSymbols],
          label: cardNames[v as keyof typeof cardNames],
        });
      }
    });

    // Shuffle
    for (let i = generated.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    return generated;
  };

  const getHandScore = (hand: Card[]): number => {
    let score = 0;
    let aces = 0;

    hand.forEach((cd) => {
      if (cd.value >= 11 && cd.value <= 13) {
        score += 10; // face cards
      } else if (cd.value === 14) {
        score += 11; // Ace initially counts as 11
        aces += 1;
      } else {
        score += cd.value;
      }
    });

    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }

    return score;
  };

  const resetGameEngine = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setResultMessage('');
    setPayoutAmt(0);
  };

  const startBlackjack = () => {
    if (gameState === 'playing' || gameState === 'dealer_turn' || isStartingRef.current) return;
    isStartingRef.current = true;

    resetGameEngine();

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

    synth.playCoin();
    isStartingRef.current = false;

    let isForcedLoss = evaluation.shouldForceLoss;
    if (parsedBet >= 300) {
      isForcedLoss = true;
    }
    setForceLoss(isForcedLoss);

    const currentDeck = createDeck();
    let p1 = currentDeck.pop()!;
    let d1 = currentDeck.pop()!;
    let p2 = currentDeck.pop()!;
    let d2 = currentDeck.pop()!;

    if (isForcedLoss) {
      // Deviously swap cards to give player 16 and dealer 20 or 21
      const card6Idx = currentDeck.findIndex(c => c.value === 6);
      const card10Idx = currentDeck.findIndex(c => c.value >= 10 && c.value <= 13);
      const dealerAceIdx = currentDeck.findIndex(c => c.value === 14);
      const dealer9or10Idx = currentDeck.findIndex(c => c.value >= 9 && c.value <= 13);

      if (card6Idx !== -1 && card10Idx !== -1) {
        p1 = currentDeck.splice(card10Idx, 1)[0];
        p2 = currentDeck.splice(card6Idx, 1)[0];
      }
      if (dealerAceIdx !== -1 && dealer9or10Idx !== -1) {
        d1 = currentDeck.splice(dealer9or10Idx, 1)[0];
        d2 = currentDeck.splice(dealerAceIdx, 1)[0];
      }
    }

    const startPlayer = [p1, p2];
    const startDealer = [d1, d2];

    setPlayerHand(startPlayer);
    setDealerHand(startDealer);
    setDeck(currentDeck);

    // Check for natural Blackjack
    const pScore = getHandScore(startPlayer);
    if (pScore === 21) {
      // Automatic Blackjack Check
      const dScore = getHandScore(startDealer);
      if (dScore === 21) {
        endGame(startPlayer, startDealer, 'push', 'Double Blackjack push!');
      } else {
        endGame(startPlayer, startDealer, 'blackjack', 'Natural 21 Blackjack!');
      }
    } else {
      setGameState('playing');
    }
  };

  const hitCard = () => {
    if (gameState !== 'playing') return;

    synth.playJump();

    const mutableDeck = [...deck];
    let drawn = mutableDeck.pop()!;
    
    if (forceLoss && getHandScore(playerHand) >= 12) {
      // Find a card in deck that busts the player
      const bustCardIndex = mutableDeck.findIndex(cd => {
        const val = cd.value >= 11 && cd.value <= 13 ? 10 : (cd.value === 14 ? 11 : cd.value);
        return getHandScore(playerHand) + val > 21;
      });
      if (bustCardIndex !== -1) {
        drawn = mutableDeck.splice(bustCardIndex, 1)[0];
      }
    }

    const nextHand = [...playerHand, drawn];

    setPlayerHand(nextHand);
    setDeck(mutableDeck);

    const score = getHandScore(nextHand);
    if (score > 21) {
      endGame(nextHand, dealerHand, 'lose', 'You busted! Scoring over 21.');
    }
  };

  const stand = () => {
    if (gameState !== 'playing') return;

    setGameState('dealer_turn');
    synth.playCoin();

    // Dealer automated sequence hits soft/hard < 17
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];

    const dealerAction = () => {
      let dScore = getHandScore(currentDealerHand);
      const pScore = getHandScore(playerHand);

      // If forceLoss is active, we want dealer score to beat player score and not bust
      if (forceLoss) {
        if (dScore <= pScore && dScore < 21) {
          let bestCardIndex = currentDeck.findIndex(cd => {
            const cardVal = cd.value >= 11 && cd.value <= 13 ? 10 : (cd.value === 14 ? 11 : cd.value);
            const newScore = dScore + cardVal;
            return newScore > pScore && newScore <= 21;
          });

          if (bestCardIndex === -1) {
            bestCardIndex = currentDeck.findIndex(cd => {
              const cardVal = cd.value >= 11 && cd.value <= 13 ? 10 : (cd.value === 14 ? 11 : cd.value);
              return dScore + cardVal <= 21;
            });
          }

          if (bestCardIndex !== -1) {
            const drawn = currentDeck.splice(bestCardIndex, 1)[0];
            currentDealerHand.push(drawn);
            setDealerHand(currentDealerHand);
            setDeck(currentDeck);
            synth.playJump();
            setTimeout(dealerAction, 1000);
            return;
          }
        }
      }

      dScore = getHandScore(currentDealerHand);
      if (dScore < 17) {
        const drawn = currentDeck.pop()!;
        currentDealerHand.push(drawn);
        setDealerHand(currentDealerHand);
        setDeck(currentDeck);
        synth.playJump();
        setTimeout(dealerAction, 1000); // 1s dealer lag
      } else {
        // Resolve final scores
        settleStandOffs(playerHand, currentDealerHand);
      }
    };

    setTimeout(dealerAction, 1000);
  };

  const settleStandOffs = (pHand: Card[], dHand: Card[]) => {
    const pScore = getHandScore(pHand);
    const dScore = getHandScore(dHand);

    if (dScore > 21) {
      endGame(pHand, dHand, 'win', 'Dealer busted! You win.');
    } else if (pScore > dScore) {
      endGame(pHand, dHand, 'win', `You beat Dealer ${pScore} to ${dScore}!`);
    } else if (pScore < dScore) {
      endGame(pHand, dHand, 'lose', `Dealer beats you ${dScore} to ${pScore}.`);
    } else {
      endGame(pHand, dHand, 'push', 'Its a standoff push.');
    }
  };

  const endGame = (pHand: Card[], dHand: Card[], outcome: 'win' | 'lose' | 'push' | 'blackjack', msg: string) => {
    setResultMessage(msg);
    setWinStatus(outcome);
    setGameState('settled');

    const parsedBet = parseFloat(betAmount.toFixed(4));
    let payoutValue = 0;
    let netProfit = -parsedBet;

    if (outcome === 'blackjack') {
      payoutValue = parseFloat((parsedBet * 2.5).toFixed(8)); // 3:2 payout standard blackjack
      netProfit = parseFloat((payoutValue - parsedBet).toFixed(8));
    } else if (outcome === 'win') {
      payoutValue = parseFloat((parsedBet * 2.0).toFixed(8)); // 1:1 payout standard
      netProfit = parseFloat((payoutValue - parsedBet).toFixed(8));
    } else if (outcome === 'push') {
      payoutValue = parsedBet; // Return stake
      netProfit = 0;
    }

    setPayoutAmt(payoutValue);

    const uId = window.currentUserId || 'anonymous';

    if (outcome === 'win' || outcome === 'blackjack') {
      synth.playLevelUp();
      onAwardBalance(payoutValue);
      logWin(uId, parsedBet, payoutValue, 'Blackjack 21', pokiBalance);
      syncCasinoData('Blackjack 21', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
    } else if (outcome === 'push') {
      synth.playCoin();
      onAwardBalance(payoutValue);
      syncCasinoData('Blackjack 21', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
    } else {
      synth.playCrash();
      logLoss(uId, parsedBet, 'Blackjack 21', pokiBalance);
      syncCasinoData('Blackjack 21', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
    }
  };

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-18-blackjack">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">BLACKJACK MINI</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">DEALER VS PLAYER 21 MATRIX</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Playfield Area */}
        <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded-lg p-5 flex flex-col gap-6 justify-between min-h-[300px] relative">
          
          {/* Dealer Hand */}
          <div className="space-y-1.5 flex flex-col items-center">
            <h5 className="text-[10px] font-mono text-gray-500 uppercase">
              DEALER HAND SCORE:{' '}
              <span className="text-white font-bold">
                {gameState === 'playing' ? '?' : getHandScore(dealerHand)}
              </span>
            </h5>
            <div className="flex gap-2">
              {dealerHand.map((cd, idx) => {
                const hidden = gameState === 'playing' && idx === 1;
                return (
                  <div
                    key={idx}
                    className={`w-14 h-20 rounded-lg flex flex-col justify-between p-1.5 border font-mono select-none ${
                      hidden
                        ? 'bg-gradient-to-br from-[#ffb703]/20 to-[#ffb703]/5 border-[#ffb703]/30 text-[#ffb703] items-center justify-center'
                        : 'bg-white border-gray-300 text-black'
                    }`}
                  >
                    {hidden ? (
                      <span className="text-lg font-black animate-pulse">?</span>
                    ) : (
                      <>
                        <span className="text-[11px] font-black leading-none">{cd.label}</span>
                        <span className="text-center text-xl font-bold leading-none">{cd.suitChar}</span>
                        <span className="text-[11px] font-black leading-none rotate-180 text-right w-full block">
                          {cd.label}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Hand */}
          <div className="space-y-1.5 flex flex-col items-center">
            <h5 className="text-[10px] font-mono text-gray-500 uppercase">
              YOUR PLAYER HAND SCORE:{' '}
              <span className="text-[#ffb703] font-bold">
                {playerHand.length > 0 ? getHandScore(playerHand) : '--'}
              </span>
            </h5>
            <div className="flex gap-2">
              {playerHand.map((cd, idx) => (
                <div
                  key={idx}
                  className="w-14 h-20 rounded-lg flex flex-col justify-between p-1.5 border bg-white border-gray-300 text-black font-mono select-none"
                >
                  <span className="text-[11px] font-black leading-none">{cd.label}</span>
                  <span className="text-center text-xl font-bold leading-none">{cd.suitChar}</span>
                  <span className="text-[11px] font-black leading-none rotate-180 text-right w-full block">
                    {cd.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Center Results Overlay */}
          {gameState === 'settled' && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 text-center animate-fade-in z-10 rounded-lg">
              {winStatus === 'win' || winStatus === 'blackjack' ? (
                <Award className="w-12 h-12 text-emerald-400 mb-1.5 animate-pulse" />
              ) : winStatus === 'push' ? (
                <Grid className="w-12 h-12 text-blue-400 mb-1.5 animate-pulse" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-red-500 mb-1.5 animate-bounce" />
              )}
              <h3 className="text-white font-sans font-black text-lg uppercase tracking-wider">{resultMessage}</h3>
              
              <div className="mt-3 bg-black/40 border border-[#2a2f3b] py-1.5 px-4 rounded font-mono text-xs">
                {winStatus === 'win' || winStatus === 'blackjack' ? (
                  <span className="text-emerald-400 font-bold">Outcome payout: +{payoutAmt.toFixed(4)} POKI</span>
                ) : winStatus === 'push' ? (
                  <span className="text-blue-400">Push status: Return of {betAmount} POKI stake</span>
                ) : (
                  <span className="text-red-500">Loss: -{betAmount} POKI</span>
                )}
              </div>

              <button
                onClick={() => setGameState('idle')}
                className="mt-4 px-6 py-2 bg-[#ffb703] text-black font-mono font-bold text-xs uppercase rounded cursor-pointer active:scale-95 transition"
              >
                DEAL NEW HAND
              </button>
            </div>
          )}
        </div>

        {/* Action Controls Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {gameState === 'playing' ? (
            <div className="grid grid-cols-2 gap-3 w-full md:col-span-2">
              <button
                onClick={hitCard}
                className="py-3 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-sans font-extrabold text-sm uppercase rounded transition cursor-pointer"
              >
                💥 HIT CARD
              </button>
              <button
                onClick={stand}
                className="py-3 bg-gradient-to-r from-amber-500 to-[#ffb703] text-black font-sans font-extrabold text-sm uppercase rounded transition cursor-pointer"
              >
                ✋ STAND
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase mb-1.5">
                  Blackjack Stake (POKI)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    disabled={gameState !== 'idle'}
                    value={betAmount === 0 ? '' : betAmount}
                    onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
                    className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2 text-sm font-mono focus:border-[#ffb703]/50 focus:outline-none w-full animate-fade-in"
                  />
                </div>
              </div>

              <button
                onClick={startBlackjack}
                disabled={gameState !== 'idle'}
                className="w-full py-3.5 bg-[#ffb703] hover:brightness-110 text-black font-sans font-extrabold text-sm uppercase rounded tracking-widest cursor-pointer mt-4"
              >
                SHUFFLE & DEAL HANDS
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
