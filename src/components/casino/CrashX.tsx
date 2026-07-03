import React, { useState, useEffect, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, Play, ShieldAlert, Award, Grid, ShieldCheck, Rocket, AlertOctagon } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number, setBet?: (val: number) => void) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

type RocketColor = 'red' | 'blue' | 'gold';

interface ActiveBet {
  color: RocketColor;
  amount: number;
  cashedOut: boolean;
  payout: number;
}

export default function CrashX({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const [gameState, setGameState] = useState<'idle' | 'flying' | 'crashed'>('idle');
  const [betAmount, setBetAmount] = useState<number>(70);
  const [selectedRockets, setSelectedRockets] = useState<RocketColor[]>(['gold']);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.0);
  
  // Track continuous canvas vectors
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Custom multi-crash points
  const [crashPoints, setCrashPoints] = useState<Record<RocketColor, number>>({
    red: 0,
    blue: 0,
    gold: 0
  });

  const [activeBets, setActiveBets] = useState<Record<RocketColor, ActiveBet | null>>({
    red: null,
    blue: null,
    gold: null
  });

  const runTimerRef = useRef<number | null>(null);
  const multiplierRef = useRef<number>(1.0);
  const gameStateRef = useRef<typeof gameState>('idle');

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const generateCrashPoint = (coef: number): number => {
    // 5% instant crash risk, otherwise exponential progression distribution
    const rand = Math.random();
    if (rand < 0.05) return 1.00;
    
    let power = 1.0;
    if (coef === 2) power = 1.25; // Blue
    if (coef === 3) power = 1.5;  // Gold
    
    const multiplier = 0.98 / Math.pow(Math.random(), 0.95 * power);
    return Math.max(1.02, parseFloat(multiplier.toFixed(2)));
  };

  // Draw continuous vector canvas flight indicators
  useEffect(() => {
    if (gameState !== 'flying' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const startTimeStamp = Date.now();

    const draw = () => {
      if (gameStateRef.current !== 'flying') return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw beautiful dynamic neon grid
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 25;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const elapsed = (Date.now() - startTimeStamp) / 1000;
      const currentVal = multiplierRef.current;

      // Draw flight lines for active rockets
      const colorsMap: Record<RocketColor, string> = {
        red: '#f43f5e',
        blue: '#3b82f6',
        gold: '#fbbf24',
      };

      (['red', 'blue', 'gold'] as RocketColor[]).forEach((color, i) => {
        const pnt = crashPoints[color];
        const isCrashed = currentVal >= pnt;
        const bet = activeBets[color];
        
        ctx.beginPath();
        ctx.strokeStyle = colorsMap[color];
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        // Draw curved parabolic escape lines
        const segments = 40;
        let finalX = 20;
        let finalY = canvas.height - 20;

        ctx.moveTo(20, canvas.height - 20);
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const currentE = elapsed * t;
          const valAtT = Math.pow(1.08, currentE * 3);

          if (valAtT > pnt) break; // Terminate line at actual crash coordinate

          const targetX = 20 + t * (canvas.width - 60);
          const targetY = (canvas.height - 20) - (Math.pow(t, 2) * (canvas.height - 80) * (1 + i * 0.1));
          
          ctx.lineTo(targetX, targetY);
          finalX = targetX;
          finalY = targetY;
        }
        ctx.stroke();

        // Draw rocket pointer glows
        if (!isCrashed && (bet ? !bet.cashedOut : true)) {
          ctx.beginPath();
          ctx.arc(finalX, finalY, 7, 0, Math.PI * 2);
          ctx.fillStyle = colorsMap[color];
          ctx.fill();

          ctx.beginPath();
          ctx.arc(finalX, finalY, 15, 0, Math.PI * 2);
          ctx.fillStyle = colorsMap[color] + '22';
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [gameState, crashPoints, activeBets]);

  const handleStartFlight = () => {
    if (gameState === 'flying') return;

    if (selectedRockets.length === 0) {
      alert("Please select at least one rocket to bet on.");
      return;
    }

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert("Specify a valid bet amount.");
      return;
    }

    if (parsedBet < 70) {
      onDeductBalance(parsedBet, setBetAmount);
      return;
    }

    const totalDeduction = parsedBet * selectedRockets.length;
    if (!onDeductBalance(totalDeduction, setBetAmount)) {
      alert("Insufficient Balance for selective spot bets.");
      return;
    }

    const newBets: Record<RocketColor, ActiveBet | null> = { red: null, blue: null, gold: null };
    selectedRockets.forEach(color => {
      newBets[color] = {
        color,
        amount: parsedBet,
        cashedOut: false,
        payout: 0
      };
    });

    const redCrash = generateCrashPoint(1);
    const blueCrash = generateCrashPoint(2);
    const goldCrash = generateCrashPoint(3);

    const points = {
      red: redCrash,
      blue: blueCrash,
      gold: goldCrash
    };

    setCrashPoints(points);
    setActiveBets(newBets);
    setCurrentMultiplier(1.0);
    multiplierRef.current = 1.0;
    setGameState('flying');
    synth.playCoin();

    const startTime = Date.now();

    const updateFrame = () => {
      if (gameStateRef.current !== 'flying') return;

      const elapsed = (Date.now() - startTime) / 1000;
      const currentVal = parseFloat(Math.pow(1.08, elapsed * 3).toFixed(2));
      multiplierRef.current = currentVal;
      setCurrentMultiplier(currentVal);

      const allRockets = ['red', 'blue', 'gold'] as RocketColor[];

      // Check current rocket outcomes sequentially
      allRockets.forEach(color => {
        const pnt = points[color];
        const bet = newBets[color];
        if (bet && !bet.cashedOut && currentVal >= pnt) {
          synth.playCrash();
        }
      });

      // Is it crashed for all bets?
      const isRedCrashed = currentVal >= redCrash;
      const isBlueCrashed = currentVal >= blueCrash;
      const isGoldCrashed = currentVal >= goldCrash;

      // Are any bets still alive?
      let anyBetStillAlive = false;
      allRockets.forEach(color => {
        const bet = newBets[color];
        const pnt = points[color];
        if (bet && !bet.cashedOut && currentVal < pnt) {
          anyBetStillAlive = true;
        }
      });

      if (isRedCrashed && isBlueCrashed && isGoldCrashed) {
        setGameState('crashed');
        let netProfit = 0;
        allRockets.forEach(color => {
          const bet = newBets[color];
          if (bet) {
            netProfit += (bet.payout - bet.amount);
          }
        });
        syncCasinoData('Crash X Multi', netProfit, pokiBalance + netProfit)
          .catch(err => console.error(err));
      } else if (!anyBetStillAlive) {
        const anyFliersRemaining = allRockets.some(color => currentVal < points[color]);
        if (!anyFliersRemaining) {
          setGameState('crashed');
        } else {
          runTimerRef.current = requestAnimationFrame(updateFrame);
        }
      } else {
        runTimerRef.current = requestAnimationFrame(updateFrame);
      }
    };

    runTimerRef.current = requestAnimationFrame(updateFrame);
  };

  const handleIndividualCashout = (color: RocketColor) => {
    const bet = activeBets[color];
    const crashMax = crashPoints[color];
    const currentVal = multiplierRef.current;

    if (gameState !== 'flying' || !bet || bet.cashedOut || currentVal >= crashMax) return;

    const winCredit = bet.amount * currentVal;
    
    const updatedBet = {
      ...bet,
      cashedOut: true,
      payout: winCredit
    };

    setActiveBets(prev => ({
      ...prev,
      [color]: updatedBet
    }));

    onAwardBalance(parseFloat(winCredit.toFixed(4)));
    synth.playCoin();

    // Check if other bets we placed are still flying safely
    const anyFliersRemaining = (['red', 'blue', 'gold'] as RocketColor[]).some(c => {
      const b = activeBets[c];
      const pnt = crashPoints[c];
      return b && c !== color && !b.cashedOut && currentVal < pnt;
    });

    if (!anyFliersRemaining) {
      let netProfit = winCredit - bet.amount;
      (['red', 'blue', 'gold'] as RocketColor[]).forEach(c => {
        if (c !== color) {
          const ob = activeBets[c];
          if (ob) {
            netProfit += (ob.payout - ob.amount);
          }
        }
      });

      setGameState('crashed');
      syncCasinoData('Crash X Multi', netProfit, pokiBalance + netProfit)
        .catch(err => console.error(err));
    }
  };

  const toggleRocketSelection = (color: RocketColor) => {
    if (gameState === 'flying') return;
    if (selectedRockets.includes(color)) {
      setSelectedRockets(selectedRockets.filter(c => c !== color));
    } else {
      setSelectedRockets([...selectedRockets, color]);
    }
  };

  useEffect(() => {
    return () => {
      if (runTimerRef.current) cancelAnimationFrame(runTimerRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#08090c] text-white p-4 max-w-5xl mx-auto w-full gap-6">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-[#0f1118] border border-[#d4af37]/25 rounded-2xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] font-mono">CRASH X MULTI</h2>
          </div>

          <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-4 text-xs text-zinc-400 font-sans leading-relaxed">
            Multi-rocket cockpit! Select Red, Blue, and/or Gold rockets. Cash out individual bets safely before index crash constraints occur!
          </div>

          {/* Bet Size */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block font-bold">Single Spot Bet Size</label>
            <input
              type="number"
              value={betAmount}
              disabled={gameState === 'flying'}
              onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-zinc-850 focus:border-[#d4af37]/60 text-sm rounded-xl px-3 py-2 text-white font-mono focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Multi betting selectors */}
          <div className="space-y-2 mb-6">
            <label className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-widest block">Select Rocket Mission Bets</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => toggleRocketSelection('red')}
                disabled={gameState === 'flying'}
                className={`py-2.5 px-3 text-left rounded-xl border flex justify-between items-center transition cursor-pointer disabled:opacity-55 ${
                  selectedRockets.includes('red')
                    ? 'bg-rose-950/20 border-rose-600 text-rose-400'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <span className="text-xs font-bold font-mono">RED ESCORT (Moderate)</span>
                <span className="text-[10px] opacity-60">1.1x - 15x</span>
              </button>

              <button
                onClick={() => toggleRocketSelection('blue')}
                disabled={gameState === 'flying'}
                className={`py-2.5 px-3 text-left rounded-xl border flex justify-between items-center transition cursor-pointer disabled:opacity-55 ${
                  selectedRockets.includes('blue')
                    ? 'bg-blue-950/20 border-blue-600 text-blue-400'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <span className="text-xs font-bold font-mono">BLUE FIGHTER (High)</span>
                <span className="text-[10px] opacity-60">1.05x - 25x</span>
              </button>

              <button
                onClick={() => toggleRocketSelection('gold')}
                disabled={gameState === 'flying'}
                className={`py-2.5 px-3 text-left rounded-xl border flex justify-between items-center transition cursor-pointer disabled:opacity-55 ${
                  selectedRockets.includes('gold')
                    ? 'bg-amber-950/20 border-amber-600 text-amber-500'
                    : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <span className="text-xs font-bold font-mono">GOLD SCOUT (Insane)</span>
                <span className="text-[10px] opacity-60">1.01x - 100x</span>
              </button>
            </div>
          </div>
        </div>

        {gameState === 'flying' ? (
          <div className="flex flex-col gap-2">
            {selectedRockets.map(color => {
              const bet = activeBets[color];
              const crashPnt = crashPoints[color];
              const isAlive = bet && !bet.cashedOut && currentMultiplier < crashPnt;

              return (
                <button
                  key={color}
                  disabled={!isAlive}
                  onClick={() => handleIndividualCashout(color)}
                  className={`py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-between px-3 cursor-pointer ${
                    isAlive
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg hover:brightness-110'
                      : 'bg-zinc-900 text-zinc-650 border border-zinc-800'
                  }`}
                >
                  <span className="text-[10px]">{color.toUpperCase()} CASHOUT</span>
                  {isAlive ? (
                    <span>{(betAmount * currentMultiplier).toFixed(1)} COINS</span>
                  ) : bet?.cashedOut ? (
                    <span className="text-[10px] text-emerald-400 font-bold">CASHED OUT</span>
                  ) : (
                    <span className="text-[10px] text-rose-500 font-bold">CRASHED</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <button
            onClick={handleStartFlight}
            className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#f39c12] text-black shadow-lg shadow-[#d4af37]/25 hover:shadow-[#d4af37]/35 rounded-xl font-bold font-mono text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            INITIATE COCKPIT FLIGHT
          </button>
        )}
      </div>

      {/* Flight Canvas Simulation screen */}
      <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl min-h-[400px] flex flex-col justify-between p-6 relative overflow-hidden">
        {/* Radar background view simulation */}
        <div className="absolute inset-0 bg-[#06070a]" />

        {/* Dynamic Canvas element */}
        {gameState === 'flying' && (
          <canvas
            ref={canvasRef}
            width={440}
            height={260}
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40"
          />
        )}

        <div className="flex justify-between items-center z-10 w-full">
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest font-bold">VECTOR TARGET MATRIX</span>
          <span className="text-[10px] font-mono text-[#d4af37] font-bold">RTP DESIGN: 97.5%</span>
        </div>

        {/* Radar info overlays */}
        <div className="flex-1 flex flex-col justify-center items-center gap-6 z-10 w-full">
          {gameState === 'idle' && (
            <div className="text-center font-mono text-xs text-zinc-500 max-w-xs uppercase leading-relaxed">
              Vessel core ready. Fuel vectors loaded. Select escaping targets to launch flight lines.
            </div>
          )}

          {gameState === 'flying' && (
            <div className="flex flex-col items-center gap-8 w-full">
              {/* Giant digital reading */}
              <div className="text-center">
                <div className="text-6xl font-black font-mono tracking-tight text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                  {currentMultiplier.toFixed(2)}x
                </div>
                <div className="text-[10px] font-mono uppercase text-zinc-450 mt-1 tracking-widest">Escaping Speed Velocity</div>
              </div>

              {/* Graphical radar vectors */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                {(['red', 'blue', 'gold'] as RocketColor[]).map(color => {
                  const crashed = currentMultiplier >= crashPoints[color];
                  const bet = activeBets[color];
                  const select = selectedRockets.includes(color);

                  return (
                    <div
                      key={color}
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${
                        crashed
                          ? 'bg-rose-950/15 border-rose-950/60 text-rose-500 opacity-50'
                          : bet?.cashedOut
                            ? 'bg-emerald-950/15 border-emerald-950/60 text-emerald-450'
                            : select
                              ? 'bg-[#10121a]/85 border-zinc-700 text-white shadow-xl shadow-black/80'
                              : 'bg-zinc-950 border-zinc-900 opacity-25'
                      }`}
                    >
                      <Rocket className={`w-8 h-8 mb-2 transition-all ${
                        crashed
                          ? 'text-rose-600 scale-90'
                          : bet?.cashedOut
                            ? 'text-emerald-500 scale-105 rotate-45'
                            : color === 'red'
                              ? 'text-rose-500 animate-bounce'
                              : color === 'blue'
                                ? 'text-blue-500 animate-bounce delay-75'
                                : 'text-amber-500 animate-bounce delay-150'
                      }`} />
                      <div className="text-[9px] font-mono font-bold uppercase">{color}</div>
                      <div className="text-[9px] font-mono opacity-80 mt-1">
                        {crashed ? 'CRASHED' : bet?.cashedOut ? 'SAFE' : 'FLYING'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gameState === 'crashed' && (
            <div className="animate-fade-in flex flex-col items-center text-center gap-3">
              <AlertOctagon className="w-12 h-12 text-rose-500 animate-bounce" />
              <div className="text-2xl font-black font-mono text-rose-500 uppercase">COCKPIT ENGINE CRASHED</div>
              <div className="text-zinc-500 text-xs font-mono max-w-sm leading-relaxed uppercase">
                Red crashed @ <span className="text-[#d4af37] font-bold">{crashPoints.red}x</span> | {' '}
                Blue @ <span className="text-[#d4af37] font-bold">{crashPoints.blue}x</span> | {' '}
                Gold @ <span className="text-[#d4af37] font-bold">{crashPoints.gold}x</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center z-10 w-full border-t border-zinc-900/80 pt-3 text-[10px] font-mono text-zinc-500">
          <div>FLYING TARGETS: <span className="text-[#d4af37] font-bold font-mono">{selectedRockets.join(', ').toUpperCase()}</span></div>
          <div>CURRENT DEPOSITS: <span className="text-[#d4af37] font-bold font-mono">{betAmount * selectedRockets.length} Coins</span></div>
        </div>
      </div>
    </div>
  );
}
