import React, { useState, useEffect, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { GameSession } from '../../types';
import { Shield, Sparkles, Volume2, VolumeX, ArrowLeft, Gamepad2, Play, Award, Zap, CheckCircle, XCircle } from 'lucide-react';

interface NeonMathMasterProps {
  onSessionComplete: (session: GameSession) => void;
  uid: string;
  onClose: () => void;
}

interface Equation {
  text: string;
  answer: number;
  choices: number[];
}

export default function NeonMathMaster({ onSessionComplete, uid, onClose }: NeonMathMasterProps) {
  const [score, setScore] = useState<number>(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<Equation | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(100); // Percentage of timer left
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('poki_math_highscore') || '0');
  });

  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const stateRef = useRef({
    score: 0,
    timerInterval: null as any,
    currentAnswer: 0,
    gameActive: false,
    timerDuration: 4000, // 4 seconds start duration
    timeLeftMs: 4000,
    lastTime: 0,
  });

  const generateEquation = (points: number): Equation => {
    let num1 = 1;
    let num2 = 1;
    let operator = '+';
    let answer = 0;

    // Difficulty scaling
    if (points < 5) {
      // Very simple additions and subtractions
      num1 = Math.floor(Math.random() * 10) + 1;
      num2 = Math.floor(Math.random() * 10) + 1;
      operator = Math.random() > 0.5 ? '+' : '-';
    } else if (points < 12) {
      // Harder additions and simple multiplications
      num1 = Math.floor(Math.random() * 20) + 5;
      num2 = Math.floor(Math.random() * 15) + 3;
      operator = Math.random() > 0.4 ? (Math.random() > 0.5 ? '+' : '-') : '*';
    } else {
      // Multiplications, division, big additions/subtractions
      const types = ['+', '-', '*', '/'];
      operator = types[Math.floor(Math.random() * types.length)];
      if (operator === '/') {
        num2 = Math.floor(Math.random() * 9) + 2;
        answer = Math.floor(Math.random() * 10) + 2;
        num1 = num2 * answer;
      } else if (operator === '*') {
        num1 = Math.floor(Math.random() * 12) + 2;
        num2 = Math.floor(Math.random() * 10) + 2;
      } else {
        num1 = Math.floor(Math.random() * 90) + 10;
        num2 = Math.floor(Math.random() * 90) + 10;
      }
    }

    // Solve
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      case '/':
        if (num2 === 0) num2 = 1;
        answer = num1 / num2;
        break;
    }

    // Choices formulation
    const choicesList = new Set<number>();
    choicesList.add(answer);

    while (choicesList.size < 4) {
      const dev = Math.floor(Math.random() * 10) - 5;
      const fakeAnswer = answer + (dev === 0 ? 3 : dev);
      choicesList.add(fakeAnswer);
    }

    // Convert Set back to shuffled Array
    const choices = Array.from(choicesList).sort(() => Math.random() - 0.5);

    return {
      text: `${num1} ${operator === '*' ? '×' : operator === '/' ? '÷' : operator} ${num2}`,
      answer,
      choices,
    };
  };

  const syncScore = async (finalScore: number) => {
    console.log(`[MATH MASTER] syncScore with score: ${finalScore}`);
    
    // 3 gold coins per point, capped at 40 max
    const coins = Math.min(40, Math.max(1, finalScore * 3));

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
      formData.append('game', 'Neon Math Master');

      await fetch('update_coins.php', {
        method: 'POST',
        body: formData,
      });
      console.log("[MATH MASTER] External database synced successfully.");
    } catch (e) {
      console.warn("[MATH MASTER] update_coins.php unreachable, local balance synced.");
    }
  };

  const handleGameOver = () => {
    const finalScore = stateRef.current.score;
    stateRef.current.gameActive = false;
    clearInterval(stateRef.current.timerInterval);

    try {
      synth.playCrash();
    } catch (e) {}

    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('poki_math_highscore', String(finalScore));
    }

    setGameState('gameover');
    syncScore(finalScore);
  };

  const handleChoice = (selected: number) => {
    if (gameState !== 'playing' || feedback !== null) return;

    const correct = selected === currentQuestion?.answer;

    if (correct) {
      stateRef.current.score += 1;
      setScore(stateRef.current.score);
      setFeedback('correct');

      try {
        synth.playCoin();
      } catch (e) {}

      // Short beautiful feedback animation transition
      setTimeout(() => {
        setFeedback(null);
        nextQuestion();
      }, 500);
    } else {
      setFeedback('incorrect');
      setTimeout(() => {
        setFeedback(null);
        handleGameOver();
      }, 600);
    }
  };

  const nextQuestion = () => {
    const currentScore = stateRef.current.score;
    const q = generateEquation(currentScore);
    setCurrentQuestion(q);

    // Calculate dynamic speed. Base: 4000ms. Minimum speed restriction: 1500ms
    const currentCoins = currentScore * 3;
    let speed = Math.max(1500, 4200 - currentScore * 180);
    if (currentCoins >= 16) {
      speed = Math.max(800, 2000 - (currentCoins - 15) * 150);
    }
    if (currentCoins >= 25) {
      speed = Math.max(350, 1000 - (currentCoins - 24) * 80);
    }
    if (currentCoins >= 32) {
      speed = 100; // instant game over to naturally end session
    }

    stateRef.current.timerDuration = speed;
    stateRef.current.timeLeftMs = speed;
    stateRef.current.lastTime = Date.now();
  };

  const startGame = () => {
    try {
      synth.playLevelUp();
    } catch (e) {}
    
    stateRef.current.score = 0;
    stateRef.current.gameActive = true;
    setScore(0);
    setGameState('playing');
    setFeedback(null);
    nextQuestion();
  };

  // Timer tick effect
  useEffect(() => {
    if (gameState !== 'playing' || !stateRef.current.gameActive) return;

    const interval = setInterval(() => {
      const state = stateRef.current;
      const now = Date.now();
      const elapsed = now - state.lastTime;
      state.lastTime = now;

      state.timeLeftMs -= elapsed;
      const pct = Math.max(0, (state.timeLeftMs / state.timerDuration) * 100);
      setTimeLeft(pct);

      if (state.timeLeftMs <= 0) {
        clearInterval(interval);
        handleGameOver();
      }
    }, 40);

    stateRef.current.timerInterval = interval;

    return () => clearInterval(interval);
  }, [gameState, currentQuestion]);

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
          <span className="text-sm font-mono tracking-widest text-[#ffb703] font-bold">NEON MATH MASTER</span>
        </div>

        <div className="text-xs text-amber-500 font-mono flex items-center gap-1">
          <Award className="w-4 h-4" /> HIGHSCORE: {highScore}
        </div>
      </div>

      {/* Main Challenge Area */}
      <div className="bg-[#0d0d0f] p-6 flex flex-col items-center justify-center min-h-[420px] relative">
        {gameState === 'idle' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="border border-[#ffb703]/20 p-8 rounded-2xl max-w-sm text-center bg-[#0d0d0f] shadow-2xl">
              <h2 className="text-2xl font-black text-[#ffb703] font-mono tracking-wider mb-2">NEON MATH MASTER</h2>
              <p className="text-xs text-gray-400 mb-6 font-sans">
                A super-glowing math puzzle. Fast-paced equations, declining timers, and immediate high yield. How fast can you compute?
              </p>

              <div className="flex justify-around items-center mb-6 py-3 border-y border-[#ffb703]/10 text-center">
                <div>
                  <div className="text-[10px] text-gray-500 font-mono">TIME CONSTANT</div>
                  <div className="text-xs font-bold text-[#ffb703] font-mono mt-1">SHRINKS EVERY SCORE</div>
                </div>
                <div className="w-px h-8 bg-[#ffb703]/10"></div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono">REWARD ACCRUAL</div>
                  <div className="text-xs font-bold text-amber-500 font-mono mt-1">3 COINS / PT</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-[#ffb703] hover:bg-amber-400 text-black font-semibold font-mono tracking-wider py-3 px-6 rounded-lg transition"
              >
                ACCESS CALCULATION
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="border border-[#ffb703]/20 p-8 rounded-2xl max-w-sm text-center bg-[#0d0d0f] shadow-2xl">
              <h2 className="text-2xl font-black text-red-500 font-mono tracking-wider mb-2">TIME OR PRECISION REJECTED</h2>
              <p className="text-xs text-gray-400 mb-6 font-sans">
                Math synthesis failed. Keep practicing to speed up your synaptic responses.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 py-3 px-4 bg-black/55 rounded-xl border border-white/5">
                <div className="text-center border-r border-[#ffb703]/10">
                  <div className="text-xs text-gray-400 font-sans">EQUATIONS RESOLVED</div>
                  <div className="text-lg font-black text-[#ffb703] font-mono">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-sans">COINS</div>
                  <div className="text-lg font-black text-amber-500 font-mono">+{score * 3}</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 border border-[#ffb703]/20 hover:bg-[#ffb703]/10 text-white font-semibold font-mono py-2.5 rounded-lg transition text-sm"
                >
                  EXIT HUB
                </button>
                <button
                  onClick={startGame}
                  className="flex-1 bg-[#ffb703] hover:bg-amber-400 text-black font-semibold font-mono py-2.5 rounded-lg transition text-sm"
                >
                  RESOLVE AGAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HUD */}
        {gameState === 'playing' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-5">
            <div className="w-full flex justify-between items-center bg-black/50 px-4 py-2 rounded-xl border border-[#ffb703]/10">
              <div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">POINTS</div>
                <div className="text-lg font-mono font-black text-[#ffb703]">{score}</div>
              </div>
              <div className="w-px h-6 bg-[#ffb703]/10"></div>
              <div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">COINS ACCUMULATED</div>
                <div className="text-lg font-mono font-black text-amber-500">+{score * 3}</div>
              </div>
            </div>

            {/* Glowing Neon Timer Bar */}
            <div className="w-full h-3.5 bg-[#151821] rounded-full overflow-hidden border border-[#ffb703]/20 shadow-[0_0_10px_rgba(255,183,3,0.05)]">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 transition-all duration-75 shadow-[0_0_8px_#ffb703]"
                style={{ width: `${timeLeft}%` }}
              ></div>
            </div>

            {/* Glowing Equation screen */}
            <div className="w-full py-8 bg-[#0b0c10] border border-[#ffb703]/15 rounded-2xl flex items-center justify-center relative shadow-[0_0_20px_rgba(255,183,3,0.02)] min-h-[140px]">
              {feedback === 'correct' && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#00f260]/10 backdrop-blur-xs rounded-2xl z-15">
                  <CheckCircle className="w-12 h-12 text-[#00f260] animate-bounce" />
                </div>
              )}
              {feedback === 'incorrect' && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-xs rounded-2xl z-15">
                  <XCircle className="w-12 h-12 text-red-500 animate-ping" />
                </div>
              )}
              <div className="text-4xl font-extrabold text-[#ffb703] font-mono tracking-widest drop-shadow-[0_0_8px_rgba(255,183,3,0.3)]">
                {currentQuestion?.text}
              </div>
            </div>

            {/* Answer Choices Grid */}
            <div className="w-full grid grid-cols-2 gap-4">
              {currentQuestion?.choices.map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(val)}
                  disabled={feedback !== null}
                  className="w-full py-4 px-3 bg-[#111318] hover:bg-[#ffb703]/15 focus:outline-none focus:ring-1 focus:ring-[#ffb703] border border-[#ffb703]/20 rounded-xl font-mono text-xl text-white font-bold transition duration-150 active:scale-95 hover:border-[#ffb703]/60 cursor-pointer shadow-lg disabled:opacity-50 flex items-center justify-center"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
