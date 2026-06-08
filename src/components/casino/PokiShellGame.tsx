import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Sparkles, X, Play, ShieldAlert, Award, RefreshCw } from 'lucide-react';

interface GameProps {
  pokiBalance: number;
  onAwardBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => boolean;
  syncCasinoData: (gameName: string, netProfitLoss: number, finalCoins: number) => Promise<void>;
  onClose: () => void;
}

interface Cup {
  id: number;
  x: number;
  y: number;
  hasCoin: boolean;
}

export default function PokiShellGame({
  pokiBalance,
  onAwardBalance,
  onDeductBalance,
  syncCasinoData,
  onClose
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'showing' | 'shuffling' | 'select' | 'settled'>('idle');
  const [betAmount, setBetAmount] = useState<number>(10);

  // Cups state refs to keep animation continuous without re-trigger state delays
  const cupsRef = useRef<Cup[]>([
    { id: 0, x: 80, y: 150, hasCoin: false },
    { id: 1, x: 200, y: 150, hasCoin: true },
    { id: 2, x: 320, y: 150, hasCoin: false },
  ]);

  const [selectedCupId, setSelectedCupId] = useState<number | null>(null);
  const [winStatus, setWinStatus] = useState<boolean>(false);
  const [payoutAmt, setPayoutAmt] = useState<number>(0);

  // Setup loop
  const drawCups = (liftedId: number | null = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background surface details
    ctx.strokeStyle = '#2a2f3b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(35, 175);
    ctx.lineTo(canvas.width - 35, 175);
    ctx.stroke();

    const cups = cupsRef.current;

    // Draw Coins first (so they are hidden under cups unless lifted!)
    cups.forEach((cp) => {
      if (cp.hasCoin) {
        let coinY = cp.y + 16;
        if (liftedId === cp.id) {
          coinY = cp.y - 12; // trace coin up? No, keep coin on table, lift cup!
        }
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.arc(cp.x, 170, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#9a6b0c';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', cp.x, 170);
      }
    });

    // Draw Cups
    cups.forEach((cp) => {
      ctx.save();
      
      let cupOffsetH = 0;
      if (liftedId === cp.id) {
        cupOffsetH = -45; // Lift up!
      }

      ctx.translate(cp.x, cp.y + cupOffsetH);

      // Cup Shadow surface
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 24, 22, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw cyber chalice cup shape
      ctx.fillStyle = '#171a21'; // Slate dark matching theme
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 2.5;

      // Draw trapezoid chalice cup
      ctx.beginPath();
      ctx.moveTo(-20, 20);
      ctx.lineTo(20, 20);
      ctx.lineTo(14, -20);
      ctx.lineTo(-14, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top glowing neon rim
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.ellipse(0, -20, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });
  };

  const startShellGame = () => {
    if (gameState !== 'idle' && gameState !== 'settled') return;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    if (isNaN(parsedBet) || parsedBet <= 0) {
      alert('Specify a valid bet greater than 0.');
      return;
    }

    if (!onDeductBalance(parsedBet)) {
      alert('Insufficient Pokicoin balance.');
      return;
    }

    setGameState('showing');
    setSelectedCupId(null);
    synth.playCoin();

    // Assign coin to a random cup
    const randomCoinId = Math.floor(Math.random() * 3);
    cupsRef.current = cupsRef.current.map((cp, idx) => ({
      ...cp,
      hasCoin: idx === randomCoinId,
      x: 80 + idx * 120, // force correct positions
    }));

    // Step 1: Lift correct cup to show coin
    let elapsed = 0;
    const liftDur = 1000;
    const startTime = Date.now();

    const liftSequence = () => {
      const now = Date.now() - startTime;
      const progress = Math.min(1.0, now / liftDur);
      
      if (progress < 1.0) {
        drawCups(randomCoinId);
        requestAnimationFrame(liftSequence);
      } else {
        // Drop down and begin Shuffle
        setTimeout(() => {
          triggerShuffles();
        }, 500);
      }
    };

    liftSequence();
  };

  const triggerShuffles = () => {
    setGameState('shuffling');

    let round = 0;
    const totalRounds = 6;
    const roundDur = 350; // fast swaps

    const executeRound = () => {
      if (round < totalRounds) {
        // Select two points at random to swap
        const idxA = Math.floor(Math.random() * 3);
        let idxB = Math.floor(Math.random() * 3);
        while (idxB === idxA) idxB = Math.floor(Math.random() * 3);

        const posStartX_A = cupsRef.current[idxA].x;
        const posStartX_B = cupsRef.current[idxB].x;

        const roundStartTime = Date.now();
        synth.playJump();

        const animateSwap = () => {
          const now = Date.now() - roundStartTime;
          const pct = Math.min(1.0, now / roundDur);

          // Easing
          const ease = pct; // linear/quadratic curved interpolation
          
          cupsRef.current[idxA].x = posStartX_A + ease * (posStartX_B - posStartX_A);
          cupsRef.current[idxB].x = posStartX_B + ease * (posStartX_A - posStartX_B);

          // Add curve depth height offsets (motion ellipse paths)
          // to make swap visually distinct!
          const heightOffset = Math.sin(pct * Math.PI) * 35;
          cupsRef.current[idxA].y = 150 - heightOffset;
          cupsRef.current[idxB].y = 150 + heightOffset;

          drawCups();

          if (pct < 1.0) {
            animRef.current = requestAnimationFrame(animateSwap);
          } else {
            // Restore center heights
            cupsRef.current[idxA].y = 150;
            cupsRef.current[idxB].y = 150;
            round++;
            executeRound();
          }
        };

        animateSwap();
      } else {
        // SHUFFLING FINISHED!
        setGameState('select');
        drawCups();
      }
    };

    executeRound();
  };

  // Handle Touch clicks on Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Detect which cup was clicked (proximity match)
    const cups = cupsRef.current;
    let clickedCupId: number | null = null;

    cups.forEach((cp) => {
      const distance = Math.abs(clickX - cp.x);
      if (distance <= 45 && clickY >= 110 && clickY <= 190) {
        clickedCupId = cp.id;
      }
    });

    if (clickedCupId !== null) {
      setSelectedCupId(clickedCupId);
      resolveOutcome(clickedCupId);
    }
  };

  const resolveOutcome = (cupId: number) => {
    const clickedCup = cupsRef.current.find((cp) => cp.id === cupId)!;
    const isCorrect = clickedCup.hasCoin;

    const parsedBet = parseFloat(betAmount.toFixed(4));
    const payoutVal = isCorrect ? parseFloat((parsedBet * 3.0).toFixed(8)) : 0;
    const netProfit = isCorrect ? parseFloat((payoutVal - parsedBet).toFixed(8)) : -parsedBet;

    setWinStatus(isCorrect);
    setPayoutAmt(payoutVal);
    setGameState('settled');

    // Lift cup in draw frame to reveal coin!
    drawCups(cupId);

    if (isCorrect) {
      synth.playLevelUp();
      onAwardBalance(payoutVal);
      syncCasinoData('Poki Shell Game', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
    } else {
      synth.playCrash();
      syncCasinoData('Poki Shell Game', netProfit, parseFloat((pokiBalance + netProfit).toFixed(8)));
    }
  };

  useEffect(() => {
    drawCups();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="w-full bg-[#171a21] border border-[#2a2f3b] rounded-xl p-5 text-left md:p-6 overflow-hidden relative" id="game-20-shell">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2f3b] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ffb703]/10 border border-[#ffb703]/20 flex items-center justify-center text-[#ffb703]">
            <RefreshCw className="w-4 h-4 animate-spin-reverse" />
          </div>
          <div>
            <h4 className="text-white font-sans font-bold text-sm tracking-wider uppercase">POKI SHELL GAME</h4>
            <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase">THREE CUPS POSITION SHUFFLE</span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left Arena Canvas */}
        <div className="relative bg-[#0b0c10] border border-[#2a2f3b] rounded-lg p-5 aspect-square flex items-center justify-center w-full max-w-[280px] mx-auto md:max-w-none">
          <canvas
            ref={canvasRef}
            width={400}
            height={280}
            onClick={handleCanvasClick}
            className="w-full h-full max-w-[380px] max-h-[260px] cursor-pointer"
          />

          {/* Canvas prompts overlay */}
          {gameState === 'select' && (
            <div className="absolute top-4 bg-amber-500/10 border border-amber-500/30 text-[#ffb703] font-mono text-[10px] uppercase font-bold py-1 px-3.5 rounded animate-pulse select-none pointer-events-none">
              🔒 INPUT FOCUS: TAP THE CARDINAL CUP
            </div>
          )}

          {/* Results Reveal Inside Container Shield */}
          {gameState === 'settled' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-10 p-4 text-center animate-fade-in">
              {winStatus ? (
                <Award className="w-12 h-12 text-emerald-400 mb-1.5 animate-pulse" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-red-500 mb-1.5 animate-bounce" />
              )}
              <h2 className="text-white font-sans font-extrabold text-lg uppercase tracking-wide">
                {winStatus ? 'CORRECT RECOG!' : 'INCORRECT RECOG!'}
              </h2>
              <p className="text-[11px] text-gray-400 max-w-xs mt-1">
                {winStatus
                  ? 'Gold Poki was tracking correctly and retrieved.'
                  : 'Lost tracking of gold Poki side chalice.'}
              </p>

              <div className="mt-4 bg-black/40 border border-[#2a2f3b] py-1.5 px-4 rounded font-mono text-xs">
                {winStatus ? (
                  <span className="text-emerald-400 font-bold">3.0x payout: +{payoutAmt.toFixed(4)} POKI</span>
                ) : (
                  <span className="text-red-500">Loss: -{betAmount} POKI</span>
                )}
              </div>

              <button
                onClick={() => {
                  setGameState('idle');
                  cupsRef.current = [
                    { id: 0, x: 80, y: 150, hasCoin: false },
                    { id: 1, x: 200, y: 150, hasCoin: true },
                    { id: 2, x: 320, y: 150, hasCoin: false },
                  ];
                  setSelectedCupId(null);
                  drawCups();
                }}
                className="mt-5 px-5 py-2 bg-[#ffb703] text-black font-mono font-bold text-xs uppercase rounded cursor-pointer transition active:scale-95"
              >
                SHUFFLE AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Right Details Panel */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="bg-[#0b0c10] border border-[#2a2f3b] p-3.5 rounded-lg font-mono text-[9.5px] text-gray-500 leading-normal">
              <h5 className="text-[#ffb703] font-bold uppercase mb-1.5 text-[10px]">RECOG INCENTIVE</h5>
              <p>1. Initiate below to load seed positions.</p>
              <p>2. Watch correct card chalice position lifted.</p>
              <p>3. Dynamic swap motion tracking shuffles positions.</p>
              <p>4. Guess correctly to capture 3.0x payout instantly.</p>
            </div>

            {/* Bet Input */}
            <div>
              <div className="flex items-center justify-between font-mono text-[10px] mb-1.5">
                <span className="text-gray-400 font-bold uppercase">SHELL STAKE INTEREST</span>
                <span className="text-gray-500">Wallet: {pokiBalance.toFixed(4)}</span>
              </div>
              <input
                type="number"
                disabled={gameState !== 'idle' && gameState !== 'settled'}
                value={betAmount === 0 ? '' : betAmount}
                onChange={(e) => setBetAmount(Math.max(0.0001, parseFloat(e.target.value) || 0))}
                className="bg-[#0b0c10] border border-[#2a2f3b] text-white rounded px-3 py-2 text-sm font-mono w-full focus:outline-none focus:border-[#ffb703]/50"
              />
            </div>
          </div>

          <button
            onClick={startShellGame}
            disabled={gameState !== 'idle' && gameState !== 'settled'}
            className="w-full py-3.5 mt-5 bg-[#ffb703] text-black font-sans font-extrabold text-sm uppercase rounded tracking-wider shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95 transition disabled:opacity-50"
          >
            INITIATE SHUFFLE RUN
          </button>
        </div>
      </div>
    </div>
  );
}
