import React, { useState, useEffect } from 'react';
import { synth } from '../../utils/audioSynth';
import { GameSession } from '../../types';
import { Shield, Gem, Crown, Key, Flame, Anchor, Sword, Trophy, ArrowLeft, Gamepad2, Play, Award, HelpCircle } from 'lucide-react';

interface MemoryMatchProps {
  onSessionComplete: (session: GameSession) => void;
  uid: string;
  onClose: () => void;
}

interface Card {
  id: number;
  symbolId: number; // 0 to 7 representing the 8 icons
  isFlipped: boolean;
  isMatched: boolean;
}

// Icon mapper for the 8 gold symbols
const SYMBOLS = [
  { icon: Shield, id: 0, label: 'SHIELD' },
  { icon: Gem, id: 1, label: 'GEM' },
  { icon: Crown, id: 2, label: 'CROWN' },
  { icon: Key, id: 3, label: 'KEY' },
  { icon: Flame, id: 4, label: 'FLAME' },
  { icon: Anchor, id: 5, label: 'ANCHOR' },
  { icon: Sword, id: 6, label: 'SWORD' },
  { icon: Trophy, id: 7, label: 'TROPHY' },
];

export default function MemoryMatch({ onSessionComplete, uid, onClose }: MemoryMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]); // holds indices of matching cards
  const [turns, setTurns] = useState<number>(0);
  const [matches, setMatches] = useState<number>(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('poki_memory_highscore') || '0');
  });

  const initGame = () => {
    try {
      synth.playLevelUp();
    } catch (e) {}

    // Generate 16 cards (8 pairs)
    const pairIds = [...Array(8).keys(), ...Array(8).keys()];
    // Shuffle
    const shuffled = pairIds
      .map((id, index) => ({ id: index, symbolId: id, isFlipped: false, isMatched: false }))
      .sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setSelectedCards([]);
    setTurns(0);
    setMatches(0);
    setGameState('playing');
  };

  const syncScore = async (finalScore: number) => {
    console.log(`[MEMORY] syncScore with score: ${finalScore}`);
    
    // Convert score to coins: e.g., 1 coin per 2 score points
    const coins = Math.max(2, Math.floor(finalScore / 2));

    onSessionComplete({
      distance: finalScore,
      coinsCollected: coins,
      multiplier: 1.0,
      timestamp: Date.now(),
      hashSignature: '0x' + Math.random().toString(16).slice(2, 12),
      securePayload: JSON.stringify({ score: finalScore, coins }),
      status: 'gameover',
    });

    try {
      const formData = new FormData();
      formData.append('score', String(finalScore));
      formData.append('coins', String(coins));
      formData.append('game', 'Memory Match');

      await fetch('update_coins.php', {
        method: 'POST',
        body: formData,
      });
      console.log("[MEMORY] External database score synchronization completed.");
    } catch (e) {
      console.warn("[MEMORY] update_coins.php unreachable during dev loop, local balance synced.");
    }
  };

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing' || selectedCards.length >= 2 || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    try {
      synth.playSlide();
    } catch (e) {}

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelection = [...selectedCards, index];
    setSelectedCards(newSelection);

    if (newSelection.length === 2) {
      const nextTurns = turns + 1;
      setTurns(nextTurns);
      const [firstIdx, secondIdx] = newSelection;

      if (cards[firstIdx].symbolId === cards[secondIdx].symbolId) {
        // MATCH FOUND!
        try {
          synth.playCoin();
        } catch (e) {}

        const updatedCards = [...newCards];
        updatedCards[firstIdx].isMatched = true;
        updatedCards[secondIdx].isMatched = true;
        setCards(updatedCards);

        setMatches(prev => {
          const updatedMatches = prev + 1;
          if (updatedMatches === 8) {
            // ALL 8 PAIRS MATCHED - GAME CONCLUDED
            setTimeout(() => {
              const calculatedScore = Math.max(10, 100 - nextTurns * 3);
              
              if (calculatedScore > highScore) {
                setHighScore(calculatedScore);
                localStorage.setItem('poki_memory_highscore', String(calculatedScore));
              }
              setGameState('gameover');
              syncScore(calculatedScore);
            }, 800);
          }
          return updatedMatches;
        });
        setSelectedCards([]);
      } else {
        // NO MATCH -> Flip back with clean transition Delay
        setTimeout(() => {
          const revertCards = [...newCards];
          revertCards[firstIdx].isFlipped = false;
          revertCards[secondIdx].isFlipped = false;
          setCards(revertCards);
          setSelectedCards([]);
        }, 850);
      }
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#0b0c10] border border-[#ffb703]/20 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-[#0b0c10] px-4 py-3 flex items-center justify-between border-b border-[#ffb703]/10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs text-[#ffb703] hover:text-white font-mono tracking-wider cursor-pointer transition font-bold"
        >
          <ArrowLeft className="w-4 h-4 text-[#ffb703]" />
          CLOSE HUB
        </button>

        <div className="flex items-center gap-3">
          <Gamepad2 className="w-5 h-5 text-[#ffb703]" />
          <span className="text-sm font-mono tracking-widest text-[#ffb703] font-bold">MEMORY GOLD SYNC</span>
        </div>

        <div className="text-xs text-amber-500 font-mono flex items-center gap-1">
          <Award className="w-4 h-4" /> HIGHSCORE: {highScore}
        </div>
      </div>

      {/* Grid Container Board */}
      <div className="bg-[#0d0d0f] p-5 flex flex-col items-center justify-center min-h-[440px] relative">
        {gameState === 'idle' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="border border-[#ffb703]/20 p-8 rounded-2xl max-w-sm text-center bg-[#0d0d0f] shadow-2xl">
              <h2 className="text-2xl font-black text-[#ffb703] font-mono tracking-wider mb-2">GOLD MEMORY MATCH</h2>
              <p className="text-xs text-gray-400 mb-6 font-sans">
                Unveil hidden pairs of premium gold icons. Match them with optimal efficiency and minimum turns to accumulate maximum high scores and payout!
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 py-3 border-y border-[#ffb703]/10 text-center">
                <div>
                  <div className="text-[10px] text-gray-500 font-mono">GRID SIZE</div>
                  <div className="text-xs font-bold text-[#ffb703] font-mono mt-1">4 X 4 (16 CARDS)</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono">MULTIPLIER YIELD</div>
                  <div className="text-xs font-bold text-amber-500 font-mono mt-1">LESS TURNS = MORE COINS</div>
                </div>
              </div>

              <button
                onClick={initGame}
                className="w-full bg-[#ffb703] hover:bg-amber-400 text-black font-semibold font-mono tracking-wider py-3 px-6 rounded-lg transition"
              >
                UNLOCK GRID
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="border border-[#ffb703]/20 p-8 rounded-2xl max-w-sm text-center bg-[#0d0d0f] shadow-2xl">
              <h2 className="text-2xl font-black text-[#ffb703] font-mono tracking-wider mb-2">GRID CLEARED</h2>
              <p className="text-xs text-gray-400 mb-6 font-sans">
                Excellent memory recall! All golden artifacts synchronized.
              </p>

              <div className="grid grid-cols-3 gap-2 mb-6 py-3 px-2 bg-black/55 rounded-xl border border-white/5 font-mono">
                <div className="text-center border-r border-[#ffb703]/10 px-1">
                  <div className="text-[10px] text-gray-400 font-sans">TURNS</div>
                  <div className="text-md font-bold text-[#ffb703]">{turns}</div>
                </div>
                <div className="text-center border-r border-[#ffb703]/10 px-1">
                  <div className="text-[10px] text-gray-400 font-sans">EFFICIENCY</div>
                  <div className="text-md font-bold text-[#ffb703]">{Math.max(10, 100 - turns * 3)} pts</div>
                </div>
                <div className="text-center px-1">
                  <div className="text-[10px] text-gray-400 font-sans">COINS</div>
                  <div className="text-md font-bold text-amber-500">+{Math.max(2, Math.floor(Math.max(10, 100 - turns * 3) / 2))}</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 border border-[#ffb703]/20 hover:bg-[#ffb703]/10 text-white font-semibold font-mono py-2.5 rounded-lg transition text-sm"
                >
                  EXIT
                </button>
                <button
                  onClick={initGame}
                  className="flex-1 bg-[#ffb703] hover:bg-amber-400 text-black font-semibold font-mono py-2.5 rounded-lg transition text-sm"
                >
                  RE-PLAY
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HUD Statistics panel */}
        {gameState === 'playing' && (
          <div className="w-full max-w-sm flex justify-between items-center bg-black/60 px-4 py-2 rounded-xl mb-4 border border-[#ffb703]/10 font-mono">
            <div>
              <div className="text-[9px] text-gray-400">TURNS SPENT</div>
              <div className="text-md font-extrabold text-[#ffb703]">{turns}</div>
            </div>
            <div className="w-px h-6 bg-[#ffb703]/10"></div>
            <div>
              <div className="text-[9px] text-gray-400">PAIRS MATCHED</div>
              <div className="text-md font-extrabold text-[#ffb703]">{matches} / 8</div>
            </div>
          </div>
        )}

        {/* 16-Card Interaction Grid */}
        <div className="w-full max-w-sm grid grid-cols-4 gap-3.5 aspect-square p-2 bg-[#0b0c10] border border-[#ffb703]/15 rounded-2xl select-none shadow-2xl">
          {cards.map((card, index) => {
            const isFlippedOrMatched = card.isFlipped || card.isMatched;
            const SymbolComponent = isFlippedOrMatched ? SYMBOLS[card.symbolId].icon : HelpCircle;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`w-full h-full aspect-square flex items-center justify-center transition-all duration-300 rounded-xl relative overflow-hidden border cursor-pointer focus:outline-none ${
                  card.isMatched
                    ? 'bg-gradient-to-br from-[#12141c] to-black border-emerald-500/30 text-emerald-400'
                    : card.isFlipped
                    ? 'bg-gradient-to-br from-[#1c1404] to-black border-[#ffb703] text-[#ffb703] shadow-[0_0_12px_rgba(255,183,3,0.35)]'
                    : 'bg-[#151821]/45 hover:bg-[#1f2432]/60 border-[#ffb703]/20 text-gray-600 hover:border-[#ffb703]/50'
                }`}
              >
                {/* 3D rotate transition effect using icons */}
                <div className={`transition-transform duration-300 ${isFlippedOrMatched ? 'transform scale-110 rotate-0' : 'transform rotate-45'}`}>
                  <SymbolComponent className="w-6 h-6" />
                </div>
              </button>
            );
          })}
        </div>

        {gameState === 'playing' && (
          <div className="text-center mt-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
            Match pairs of glowing artifact vectors to lock in coins
          </div>
        )}
      </div>
    </div>
  );
}
