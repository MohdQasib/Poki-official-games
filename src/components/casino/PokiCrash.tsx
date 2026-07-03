import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { TrendingUp, Sparkles, RefreshCw, X, Play, ShieldAlert, Award } from 'lucide-react';
import { evaluateBet, logWin, logLoss } from '../../utils/casinoRigging';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number, setBet?: (val: number) => void) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

export default function PokiCrash({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isStartingRef = useRef<boolean>(false);

  const [gameState, setGameState] = useState<'idle' | 'running' | 'crashed' | 'cashed_out'>('idle');
  const [betAmount, setBetAmount] = useState<number>(70);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [bustPoint, setBustPoint] = useState<number>(1.0);
  const [cashoutGain, setCashoutGain] = useState<number>(0);
  const [payoutMultiplier, setPayoutMultiplier] = useState<number>(1.0);

  // Sound generator
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Math: Generate crash point
  const generateBustPoint = () => {
    const r = Math.random();
    if (r < 0.03) return 1.0; // 3% instant crash
    
    // Standard distribution
    const roll = Math.random();
    let mult = 99 / (100 - roll * 98); // scales up
    
    // Add jackpot payouts (up to 120x)
    if (Math.random() < 0.1) {
      mult = 1.1 + Math.random() * 25;
    }
    if (Math.random() < 0.01) {
      mult = 10 + Math.random() * 110;
    }
    return parseFloat(Math.max(1.01, mult).toFixed(2));
  };

  const startSound = () => {
    try {
      if (synth.getMuteState()) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.warn('Audio synthesis initialized with system constraints');
    }
  };

  const updateSoundFreq = (mult: number) => {
    try {
      if (oscRef.current && audioCtxRef.current) {
        // frequency ramps up with multiplier
        const targetFreq = 180 + mult * 40;
        oscRef.current.frequency.setValueAtTime(
          Math.min(1000, targetFreq),
          audioCtxRef.current.currentTime
        );
      }
    } catch (e) {}
  };

  const stopSound = () => {
    try {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {}
  };

  const resetGameEngine = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    stopSound();
    setMultiplier(1.0);
    setPayoutMultiplier(0);
    setCashoutGain(0);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const initiateBet = () => {
    if (gameState === 'running' || isStartingRef.current) return;
    isStartingRef.current = true;

    // Reset game engine completely
    resetGameEngine();

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert('Specify a valid bet greater than 0.');
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
      alert('Insufficient Pokicoin balance for this stake.');
      isStartingRef.current = false;
      return;
    }

    // Start
    let currentBust = generateBustPoint();

    if (evaluation.shouldForceLoss) {
      // Crash instantly or very early (between 1.00x and 1.15x) to guarantee a loss
      currentBust = parseFloat((1.0 + Math.random() * 0.15).toFixed(2));
    } else {
      // Slower or better odds under honeymoon phase / brake mode
      const stats = JSON.parse(localStorage.getItem(`casino_rigging_${uId}`) || '{}');
      const isHoneymoon = stats.firstPlayTime && (Date.now() - stats.firstPlayTime < 5 * 60 * 1000);

      if (isHoneymoon && parsedBet < 150) {
        // Boosted crash points
        currentBust = parseFloat((2.5 + Math.random() * 8.0).toFixed(2));
      } else if (evaluation.applyBrakeMode && parsedBet < 100) {
        // Give comfortable but realistic safety wins (1.5x - 2.5x)
        currentBust = parseFloat((1.6 + Math.random() * 1.2).toFixed(2));
      }
    }

    setBustPoint(currentBust);
    setMultiplier(1.0);
    setGameState('running');
    synth.playCoin();
    startSound();

    isStartingRef.current = false;

    let startTime = Date.now();
    const loop = () => {
      const elapsed = Date.now() - startTime;
      // Exponential rise curve
      const calculatedVal = parseFloat(Math.pow(1.06, elapsed / 500).toFixed(2));

      if (calculatedVal >= currentBust) {
        // IT CRASHED!
        setMultiplier(currentBust);
        setGameState('crashed');
        stopSound();
        synth.playCrash();
        logLoss(uId, parsedBet, 'Poki Crash', pokiBalance);
        syncCasinoData('Poki Crash', -parsedBet, parseFloat((pokiBalance - parsedBet).toFixed(8)));
      } else {
        setMultiplier(calculatedVal);
        updateSoundFreq(calculatedVal);
        
        // Render Rocket Trajectory
        drawRocket(calculatedVal);
        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const cashOut = () => {
    if (gameState !== 'running') return;

    // Save final state
    const payoutMult = multiplier;
    const finalWinning = parseFloat((betAmount * payoutMult).toFixed(8));
    const profit = parseFloat((finalWinning - betAmount).toFixed(8));

    setPayoutMultiplier(payoutMult);
    setCashoutGain(finalWinning);
    setGameState('cashed_out');
    stopSound();
    synth.playLevelUp();

    onAwardBalance(finalWinning);
    const uId = window.currentUserId || 'anonymous';
    logWin(uId, betAmount, finalWinning, 'Poki Crash', pokiBalance);
    syncCasinoData('Poki Crash', profit, parseFloat((pokiBalance + profit).toFixed(8)));
  };

  // Canvas drawing routine
  const drawRocket = (mult: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#2a2f3b';
    ctx.lineWidth = 1;
    for (let i = 50; i < w; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 50; i < h; i += 60) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }

    // Trajectory curve
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 4.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffb703';

    ctx.beginPath();
    ctx.moveTo(35, h - 35);

    // Calculate curve points
    const pointsCount = 40;
    const currentMaxX = w - 80;
    const currentMaxY = h - 80;

    for (let i = 0; i <= pointsCount; i++) {
      const pct = i / pointsCount;
      const pointX = 35 + pct * (currentMaxX - 35);
      // Curve equation matching the current multiplier
      const exponentialOffset = Math.pow(pct, 2) * (mult - 1.0) / (mult + 1);
      const pointY = (h - 35) - pct * currentMaxY - (exponentialOffset * 80);
      ctx.lineTo(pointX, Math.max(20, pointY));
    }
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Rocket Icon head
    const headX = 35 + (w - 110);
    const headY = Math.max(30, (h - 35) - currentMaxY);

    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(headX, headY, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('✈️ POKI AEROPLANE', headX-42, headY-18);
  };

  useEffect(() => {
    // Initial static grid draw
    drawRocket(1.0);
    return () => {
      stopSound();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-11-crash">
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">POKI CRASH</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">THE ROCKET MULTIPLIER GAME</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Graph Box */}
      <div className="relative bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden h-64 mb-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={560}
          height={256}
          className="absolute inset-0 w-full h-full"
        />

        {/* Live Multiplier Display */}
        <div className="absolute z-10 text-center select-none pointer-events-none">
          <h2 className={`font-mono text-5xl md:text-6xl font-black tracking-tight ${
            gameState === 'crashed' ? 'text-red-500 scale-[1.05]' : 'text-[#ffb703] animate-pulse'
          }`}>
            {multiplier.toFixed(2)}x
          </h2>
          <span className="text-[10px] font-semibold text-gray-500 tracking-widest uppercase">
            {gameState === 'idle' && 'READY TO LAUNCH'}
            {gameState === 'running' && 'CLIMBING MULTIPLIER (CASH OUT!)'}
            {gameState === 'crashed' && 'CRASHED (BUSTED)'}
            {gameState === 'cashed_out' && 'SECURED PAYOUT!'}
          </span>
        </div>

        {/* Custom Results Modal Display inside canvas boundary */}
        {gameState === 'crashed' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-20 animate-fade-in p-4 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 animate-bounce mb-2" />
            <h3 className="text-white font-extrabold text-lg uppercase tracking-wider">CRASHED AT {multiplier.toFixed(2)}x</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
              The rocket exploded before cashout! Stake of <span className="text-red-400 font-bold">{betAmount} POKI</span> combusted.
            </p>
            <button
              onClick={() => {
                setGameState('idle');
                setMultiplier(1.0);
              }}
              className="mt-4 px-5 py-2 bg-gradient-to-r from-red-500 to-amber-600 font-mono font-bold text-xs uppercase text-white rounded shadow-lg shadow-red-500/10 cursor-pointer active:scale-95 transition"
            >
              RUN NEXT NODE
            </button>
          </div>
        )}

        {gameState === 'cashed_out' && (
          <div className="absolute inset-0 bg-[#0b0c10]/95 flex flex-col items-center justify-center z-20 animate-fade-in p-4 text-center border-2 border-emerald-500/50 rounded-lg">
            <Award className="w-14 h-14 text-emerald-400 animate-spin-reverse mb-2" />
            <h3 className="text-emerald-400 font-black text-2xl uppercase tracking-widest">SUCCESSFUL SECURED</h3>
            <p className="text-xs text-white mt-1 max-w-sm">
              Cashed out at <span className="text-[#ffb703] font-mono font-bold text-md">{payoutMultiplier.toFixed(2)}x</span>
            </p>
            <div className="mt-3 bg-black/40 border border-[#2a2f3b] py-2 px-4 rounded font-mono text-sm">
              Stake Reward: <span className="text-emerald-400 font-bold">+{cashoutGain.toFixed(4)} POKI</span>
            </div>
            <button
              onClick={() => {
                setGameState('idle');
                setMultiplier(1.0);
              }}
              className="mt-4 px-6 py-2 bg-[#ffb703] hover:brightness-110 font-mono font-bold text-xs uppercase text-black rounded cursor-pointer active:scale-95 transition"
            >
              PREPARE STAKE RUN
            </button>
          </div>
        )}
      </div>

      {/* Betting panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="md:col-span-2">
          <label className="block text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase mb-1.5">
            Stake Amount (POKI)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              disabled={gameState === 'running'}
              value={betAmount === 0 ? '' : betAmount}
              onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
              className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2 text-sm font-mono focus:border-[#ffb703]/50 focus:outline-none w-full"
            />
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={gameState === 'running'}
                onClick={() => setBetAmount((prev) => Math.floor(prev / 2) || 1)}
                className="bg-[#0b0c10] hover:bg-[#20242e] border border-[#2a2f3b] text-gray-400 hover:text-white font-mono text-[10px] rounded px-2 py-2 transition"
              >
                1/2
              </button>
              <button
                type="button"
                disabled={gameState === 'running'}
                onClick={() => setBetAmount((prev) => prev * 2)}
                className="bg-[#0b0c10] hover:bg-[#20242e] border border-[#2a2f3b] text-gray-400 hover:text-white font-mono text-[10px] rounded px-2 py-2 transition"
              >
                2x
              </button>
              <button
                type="button"
                disabled={gameState === 'running'}
                onClick={() => setBetAmount(pokiBalance)}
                className="bg-[#0b0c10] hover:bg-[#20242e] border border-[#2a2f3b] text-gray-400 hover:text-white font-mono text-[10px] rounded px-2.5 py-2 transition"
              >
                MAX
              </button>
            </div>
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-1 block">
            Current balance: {pokiBalance.toFixed(8)} POKI
          </span>
        </div>

        <div className="pt-2 md:pt-4">
          {gameState === 'running' ? (
            <button
              onClick={cashOut}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-sans font-extrabold text-sm uppercase rounded shadow-lg shadow-[#ffb703]/20 hover:brightness-110 active:scale-98 transition duration-200 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-spin-reverse" />
              CASH OUT
            </button>
          ) : (
            <button
              onClick={initiateBet}
              disabled={gameState === 'crashed' || gameState === 'cashed_out'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#0b0c10] hover:bg-[#20242e] border-2 border-[#ffb703]/40 hover:border-[#ffb703] text-white font-mono font-bold text-sm uppercase rounded tracking-wider cursor-pointer active:scale-98 transition disabled:opacity-50"
            >
              <Play className="w-4 h-4 text-[#ffb703]" />
              PLACE BET
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
