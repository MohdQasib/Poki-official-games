import React, { useState, useEffect, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Coins, HelpCircle, Bomb } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

export default function CryptoMinesweeper({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [stake, setStake] = useState<number>(50);
  const [coins, setCoins] = useState<number>(0);
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const [grid, setGrid] = useState<Array<{ id: number; isOpen: boolean; isMine: boolean }>>([]);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [currentGold, setCurrentGold] = useState<number>(0);
  const [isCrashed, setIsCrashed] = useState<boolean>(false);
  const [revealedCount, setRevealedCount] = useState<number>(0);

  const isStartingRef = useRef<boolean>(false);

  const resetGameEngine = () => {
    setSecuredTransaction(null);
    setSyncStatus('');
    setIsCrashed(false);
    setRevealedCount(0);
    setCoins(0);
    setMultiplier(1.0);
    setCurrentGold(0);
    setGrid([]);
  };

  // Grid initialization
  const startNewGame = () => {
    if (gameState === 'playing' || gameState === 'syncing' || isStartingRef.current) return;
    isStartingRef.current = true;

    resetGameEngine();

    if (!onDeductBalance(stake)) {
      alert('Insufficient Pokicoin balance for this stake.');
      isStartingRef.current = false;
      return;
    }
    synth.playCoin();
    setCurrentGold(stake);

    // Build grid indices: 20 Coins, 5 Mines
    const minesIndices = new Set<number>();
    while (minesIndices.size < 5) {
      minesIndices.add(Math.floor(Math.random() * 25));
    }

    const nextGrid = Array.from({ length: 25 }).map((_, index) => {
      return {
        id: index,
        isOpen: false,
        isMine: minesIndices.has(index),
      };
    });

    setGrid(nextGrid);
    setGameState('playing');
    isStartingRef.current = false;
  };

  const handleRevealTile = (index: number) => {
    if (gameState !== 'playing' || grid[index].isOpen || isCrashed) return;

    const nextGrid = [...grid];
    const target = nextGrid[index];
    target.isOpen = true;

    if (target.isMine) {
      // Hitted System Crash mine! Immediate blast
      setIsCrashed(true);
      synth.playCrash();
      target.isOpen = true;
      setGrid(nextGrid);

      // reveal all remaining gems/mines immediately
      setTimeout(() => {
        setGrid((g) => g.map((tile) => ({ ...tile, isOpen: true })));
        syncGameData(0, 0, true); // 0 payout
      }, 800);
      return;
    }

    // Success coin!
    synth.playCoin();
    const nextRevealedCount = revealedCount + 1;
    setRevealedCount(nextRevealedCount);

    // Multiplier increment math: Exponentially increases based on risk count
    const nextMul = parseFloat((1.0 + nextRevealedCount * 0.18 + Math.pow(nextRevealedCount, 1.3) * 0.05).toFixed(2));
    setMultiplier(nextMul);

    const nextAcc = Math.ceil(stake * nextMul);
    setCurrentGold(nextAcc);
    setGrid(nextGrid);
  };

  const cashOutGains = () => {
    if (gameState !== 'playing' || revealedCount === 0 || isCrashed) return;

    synth.playCoin();
    // Save coins earned
    const finalEarned = currentGold;
    setCoins(finalEarned);

    // Reveal remaining tiles to highlight mine places
    setGrid((g) => g.map((tile) => ({ ...tile, isOpen: true })));
    setGameState('syncing');

    syncGameData(Math.floor(finalEarned * 10), finalEarned, false);
  };

  const syncGameData = (finalScore: number, coinsCollected: number, isMineBlaster: boolean) => {
    setGameState('syncing');
    setSyncStatus(isMineBlaster ? 'LIQUIDATING LOST STAKE CORES...' : 'SECURE CASH OUT BROADCAST SIGNALS...');
    
    setTimeout(() => {
      const timestamp = Date.now();
      const rawPayload = {
        client_uid: 'anonymous_peer_vector',
        score_distance: finalScore,
        poki_tokens_collected: coinsCollected,
        poki_tokens_earned: parseFloat((coinsCollected * 1.05).toFixed(8)),
        node_consensus_index: Math.floor(Math.random() * 900000 + 100000),
        rate_limit_token: btoa(`_minesweeper_${timestamp}_${finalScore}_${coinsCollected}`),
        timestamp_utc: new Date().toISOString(),
      };

      const dummyKey = 'POKI_SHIELD_V9';
      const checksumBase = `${dummyKey}:${rawPayload.poki_tokens_collected}:${rawPayload.score_distance}:${timestamp}`;
      let checksumHex = '';
      for (let i = 0; i < checksumBase.length; i++) {
        checksumHex += checksumBase.charCodeAt(i).toString(16);
      }
      checksumHex = `0x${checksumHex.slice(0, 48).padEnd(48, 'a')}`;

      const jwtMock = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(rawPayload))}.SIG_${checksumHex.slice(2, 20)}`;

      setSecuredTransaction({
        jwt: jwtMock,
        checksum: checksumHex,
        payload: rawPayload,
      });

      setSyncStatus(isMineBlaster ? 'LIQUIDITY WIPED OUT BY CRASH!' : 'CASH OUT VALIDATED!');
      setGameState('gameover');

      // Update Casino Ledger sync and wallet balances
      if (!isMineBlaster) {
        onAwardBalance(coinsCollected);
        const profit = coinsCollected - stake;
        syncCasinoData('Crypto Minesweeper', profit, parseFloat((pokiBalance + profit).toFixed(8)));
      } else {
        syncCasinoData('Crypto Minesweeper', -stake, parseFloat((pokiBalance - stake).toFixed(8)));
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden shadow-2xl relative w-full h-[450px]">
      
      <div className="flex items-center justify-between p-3 border-b border-[#2a2f3b] bg-[#14161c]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-rose-500/20 border border-rose-400/40 text-rose-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            CRYPTO FIELD MINES
          </span>
          <span className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-gray-400">STAKE:</span>
            <select
              disabled={gameState === 'playing'}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="bg-[#0b0c10] border border-[#2a2f3b] text-white px-2 py-0.5 rounded text-[11px] font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#ffb703] cursor-pointer"
            >
              <option value="50">50 POKI</option>
              <option value="100">100 POKI</option>
              <option value="250">250 POKI</option>
              <option value="500">500 POKI</option>
              <option value="1000">1000 POKI</option>
              <option value="2000">2000 POKI</option>
              <option value="3000">3000 POKI</option>
            </select>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
            title="Exit game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME VIEWPORT */}
      <div className="flex-1 bg-[#0b0c10] flex flex-col md:flex-row items-center justify-center p-4 gap-4 overflow-y-auto">
        
        {/* SIDE BAR BOARD CONTROLS */}
        <div className="w-full md:w-[150px] bg-[#171a21] border border-[#2a2f3b] rounded-lg p-3 text-center flex flex-col justify-between h-auto self-stretch">
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Accumulated Multiplier</span>
            <div className="text-2xl font-mono font-extrabold text-[#ffd166] mt-1">
              {multiplier.toFixed(2)}x
            </div>
            
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block mt-3">Target Gold Balance</span>
            <div className="text-base font-mono font-black text-white mt-0.5">
              🪙 {currentGold} POKI
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {gameState === 'playing' && revealedCount > 0 && !isCrashed && (
              <button
                onClick={cashOutGains}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded shadow-lg shadow-emerald-500/10 cursor-pointer transition animate-bounce"
              >
                CASH OUT
              </button>
            )}
            
            {gameState === 'idle' && (
              <button
                onClick={startNewGame}
                className="w-full py-2 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black text-xs font-extrabold uppercase rounded shadow-md cursor-pointer hover:brightness-110 active:scale-95 transition-all"
              >
                PROBE TILES
              </button>
            )}
          </div>
        </div>

        {/* 5x5 MINING GRID TARGET CARD */}
        <div className="flex-1 max-w-[320px] aspect-square grid grid-cols-5 grid-rows-5 gap-[3px] p-2 bg-black/60 rounded-xl border border-[#2a2f3b]">
          {gameState === 'idle' ? (
            <div className="col-span-5 row-span-5 flex flex-col items-center justify-center p-4 text-center">
              <Coins className="w-10 h-10 text-amber-500 animate-pulse mb-2" />
              <h4 className="text-xs font-bold uppercase text-white mb-1">Risk miner Sweep</h4>
              <p className="text-[9.5px] text-gray-500 max-w-[200px]">
                Click tiles to discover hidden Pokicoins. Cache out any time before clicking on one of the 5 fatal Mines!
              </p>
            </div>
          ) : (
            grid.map((tile, i) => {
              const isTileOpen = tile.isOpen;
              return (
                <button
                  key={i}
                  disabled={isTileOpen || gameState === 'syncing' || gameState === 'gameover'}
                  onClick={() => handleRevealTile(i)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all outline-none border focus:outline-none focus:border-[#ffb703] active:scale-95 duration-200 cursor-pointer ${
                    isTileOpen
                      ? tile.isMine
                        ? 'bg-rose-600/30 border-rose-500 text-rose-500'
                        : 'bg-emerald-500/10 border-emerald-500 text-[#ffb703]'
                      : 'bg-[#171a21] hover:bg-[#20242f] border-[#2a2f3b] text-gray-500'
                  }`}
                >
                  {isTileOpen ? (
                    tile.isMine ? (
                      <Bomb className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="text-xs font-bold font-mono">🪙</span>
                    )
                  ) : (
                    <HelpCircle className="w-4 h-4 opacity-40 hover:opacity-100 transition-all text-gray-400" />
                  )}
                </button>
              );
            })
          )}
        </div>

      </div>

      {gameState === 'syncing' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
          <div className="w-12 h-12 rounded-full border-4 border-[#2a2f3b] border-t-[#ffb703] animate-spin mb-4" />
          <p className="text-xs font-mono text-[#ffb703] uppercase tracking-widest animate-pulse font-semibold">
            {syncStatus}
          </p>
        </div>
      )}

      {/* OVERLAY MODAL FOR CASH OUT RESULTS OR EXPLOSIONS */}
      {gameState === 'gameover' && securedTransaction && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 overflow-y-auto">
          <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/30 rounded-xl p-5 shadow-2xl relative text-center">
            
            {isCrashed ? (
              <div className="flex items-center justify-center gap-2 text-rose-500 mb-2 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                <span>BOOBY TRAP BLAST POINT BLASTED</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2 font-mono text-xs uppercase tracking-widest font-bold animate-pulse">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>CASH OUT SECURED SUCCESSFULLY</span>
              </div>
            )}

            <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
              {isCrashed ? 'SYSTEM DISCHARGE DAMAGE' : 'SETTLED REVENUE CONTRACT'}
            </h3>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                <span className="text-[10px] font-mono text-gray-500 uppercase block">Multiplier cashed</span>
                <span className="text-lg font-mono font-extrabold text-sky-400">{isCrashed ? '0.0x' : multiplier + 'x'}</span>
              </div>
              <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                <span className="text-[10px] font-mono text-gray-500 uppercase block">Tokens Dispatched</span>
                <span className="text-lg font-mono font-extrabold text-white">🪙 {coins} POKI</span>
              </div>
            </div>

            <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5">
              <p className="text-[9px] font-mono text-gray-400 truncate">
                CONSENSUS BLOCK: {securedTransaction.checksum}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={startNewGame}
                className="flex-1 py-1.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#ffb703]/10"
              >
                <RefreshCw className="w-3.5 h-3.5 antialiased" /> PLACE NEW STAKE
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-1.5 bg-[#0b0c10] border border-[#2a2f3b] text-white hover:bg-[#1a1d26] font-extrabold text-xs uppercase rounded transition-all cursor-pointer"
              >
                ARCADE LOBBY
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
