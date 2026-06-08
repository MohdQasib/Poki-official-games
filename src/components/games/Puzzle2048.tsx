import React, { useState, useEffect, useRef } from 'react';
import { synth } from '../../utils/audioSynth';
import { GameSession } from '../../types';
import { Shield, Sparkles, Volume2, VolumeX, ArrowLeft, Gamepad2, Play, RefreshCw, Award } from 'lucide-react';

interface Puzzle2048Props {
  onSessionComplete: (session: GameSession) => void;
  uid: string;
  onClose: () => void;
}

type Board = number[][];

export default function Puzzle2048({ onSessionComplete, uid, onClose }: Puzzle2048Props) {
  const [board, setBoard] = useState<Board>([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  const [score, setScore] = useState<number>(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'won'>('idle');
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('poki_2048_highscore') || '0');
  });

  // Touch handlers for mobile swipe
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const initGame = () => {
    try {
      synth.playLevelUp();
    } catch (e) {}
    
    let newBoard = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    
    // Add two tiles
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    
    setBoard(newBoard);
    setScore(0);
    setGameState('playing');
  };

  const addRandomTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length === 0) return currentBoard;

    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    const boardCopy = currentBoard.map(row => [...row]);
    boardCopy[r][c] = value;
    return boardCopy;
  };

  const syncScore = async (finalScore: number) => {
    console.log(`[2048] syncScore with score: ${finalScore}`);
    
    // 1 coin per 20 points
    const coins = Math.max(1, Math.floor(finalScore / 20));

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
      formData.append('game', '2048 Puzzle');

      await fetch('update_coins.php', {
        method: 'POST',
        body: formData,
      });
      console.log("[2048] External database synced successfully.");
    } catch (e) {
      console.warn("[2048] update_coins.php unreachable in dev, local sync preserved.");
    }
  };

  const handleGameOver = (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('poki_2048_highscore', String(finalScore));
    }
    setGameState('gameover');
    syncScore(finalScore);
  };

  const isGameOver = (currentBoard: Board): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (r < 3 && currentBoard[r][c] === currentBoard[r + 1][c]) return false;
        if (c < 3 && currentBoard[r][c] === currentBoard[r][c + 1]) return false;
      }
    }
    return true;
  };

  // 2048 Movement logic
  const slide = (row: number[]): { row: number[]; scoreGained: number; merged: boolean } => {
    // Filter non-zeros
    let arr = row.filter(val => val !== 0);
    let scoreGained = 0;
    let merged = false;

    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        scoreGained += arr[i];
        arr[i + 1] = 0;
        merged = true;
      }
    }

    arr = arr.filter(val => val !== 0);
    while (arr.length < 4) {
      arr.push(0);
    }

    return { row: arr, scoreGained, merged };
  };

  const rotateLeft = (matrix: Board): Board => {
    const result = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        result[3 - c][r] = matrix[r][c];
      }
    }
    return result;
  };

  const moveLeft = (currentBoard: Board) => {
    const nextBoard: Board = [];
    let scoreToAdd = 0;
    let anyMerged = false;

    for (let r = 0; r < 4; r++) {
      const res = slide(currentBoard[r]);
      nextBoard.push(res.row);
      scoreToAdd += res.scoreGained;
      if (res.merged) anyMerged = true;
    }

    return { board: nextBoard, scoreToAdd, anyMerged };
  };

  const moveRight = (currentBoard: Board) => {
    // Reverse, slide left, reverse
    const reversed = currentBoard.map(row => [...row].reverse());
    const res = moveLeft(reversed);
    const nextBoard = res.board.map(row => [...row].reverse());
    return { board: nextBoard, scoreToAdd: res.scoreToAdd, anyMerged: res.anyMerged };
  };

  const moveUp = (currentBoard: Board) => {
    // Rotate left, slide left, rotate right (3 times left is right)
    let rotated = rotateLeft(currentBoard);
    const res = moveLeft(rotated);
    let nextBoard = rotateLeft(rotateLeft(rotateLeft(res.board)));
    return { board: nextBoard, scoreToAdd: res.scoreToAdd, anyMerged: res.anyMerged };
  };

  const moveDown = (currentBoard: Board) => {
    // Rotate right, slide left, rotate left
    let rotated = rotateLeft(rotateLeft(rotateLeft(currentBoard)));
    const res = moveLeft(rotated);
    let nextBoard = rotateLeft(res.board);
    return { board: nextBoard, scoreToAdd: res.scoreToAdd, anyMerged: res.anyMerged };
  };

  const handleAction = (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
    if (gameState !== 'playing') return;

    let result: { board: Board; scoreToAdd: number; anyMerged: boolean };

    switch (direction) {
      case 'LEFT':
        result = moveLeft(board);
        break;
      case 'RIGHT':
        result = moveRight(board);
        break;
      case 'UP':
        result = moveUp(board);
        break;
      case 'DOWN':
        result = moveDown(board);
        break;
    }

    // Check if board changed
    const boardChanged = JSON.stringify(board) !== JSON.stringify(result.board);

    if (boardChanged) {
      try {
        if (result.anyMerged) {
          synth.playCoin();
        } else {
          synth.playSlide();
        }
      } catch (e) {}

      let updatedBoard = addRandomTile(result.board);
      setBoard(updatedBoard);
      setScore(prev => prev + result.scoreToAdd);

      if (isGameOver(updatedBoard)) {
        try {
          synth.playCrash();
        } catch (e) {}
        handleGameOver(score + result.scoreToAdd);
      }
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (gameState !== 'playing') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleAction('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleAction('RIGHT');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleAction('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleAction('DOWN');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gameState, score]);

  // Handle Swipes
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const threshold = 40;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          handleAction('RIGHT');
        } else {
          handleAction('LEFT');
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0) {
          handleAction('DOWN');
        } else {
          handleAction('UP');
        }
      }
    }
    touchStartRef.current = null;
  };

  // Style colors mapping for premium black and gold
  const getTileStyles = (val: number) => {
    if (val === 0) return 'bg-[#151821]/40 border border-white/5';
    
    switch (val) {
      case 2:
        return 'bg-gradient-to-br from-[#1c1e24] to-[#121317] border border-[#ffb703]/25 text-[#ffb703]/70 text-2xl font-black shadow-lg';
      case 4:
        return 'bg-gradient-to-br from-[#242730] to-[#151820] border border-[#ffb703]/40 text-[#ffb703]/85 text-2xl font-black shadow-lg';
      case 8:
        return 'bg-gradient-to-br from-[#d4af37]/10 to-[#121317] border-2 border-[#d4af37]/60 text-[#ffb703] text-2xl font-black shadow-[0_0_8px_rgba(212,175,55,0.2)]';
      case 16:
        return 'bg-gradient-to-br from-[#d4af37]/20 to-[#151820] border-2 border-[#d4af37] text-white text-2xl font-black shadow-[0_0_12px_rgba(212,175,55,0.4)]';
      case 32:
        return 'bg-gradient-to-br from-[#ffb703]/30 to-[#1c1e24] border-2 border-amber-400 text-amber-300 text-2xl font-black shadow-[0_0_15px_rgba(255,183,3,0.4)] animate-pulse';
      case 64:
        return 'bg-gradient-to-br from-[#ff8c00]/40 to-[#ffb703]/10 border-2 border-orange-500 text-orange-200 text-2xl font-black shadow-[0_0_18px_rgba(255,140,0,0.5)]';
      case 128:
        return 'bg-gradient-to-br from-[#ff5f6d] to-[#ffc371] border-2 border-amber-300 text-white text-2xl font-black shadow-[0_0_20px_rgba(255,183,3,0.6)]';
      case 256:
        return 'bg-[#ffb703] border-2 border-white/20 text-black text-2xl font-extrabold shadow-[0_0_25px_rgba(255,183,3,0.7)]';
      case 512:
        return 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 border-2 border-white/30 text-black text-2xl font-black shadow-[0_0_30px_rgba(212,175,55,0.8)]';
      case 1024:
        return 'bg-gradient-to-b from-[#ffb703] to-[#d4af37] border-2 border-white text-black text-2xl font-black shadow-[0_0_35px_rgba(255,255,255,0.5)]';
      case 2048:
        return 'bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-500 border-2 border-white text-black text-2xl font-black shadow-[0_0_40px_rgba(255,183,3,0.9)] animate-bounce';
      default:
        return 'bg-[#ffb703] border-2 border-white text-black text-2xl font-black shadow-[0_0_45px_red]';
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
          <span className="text-sm font-mono tracking-widest text-[#ffb703] font-bold">2048 PUZZLE PROTOCOL</span>
        </div>

        <div className="text-xs text-amber-500 font-mono flex items-center gap-1">
          <Award className="w-4 h-4" /> HIGHSCORE: {highScore}
        </div>
      </div>

      {/* Main Body */}
      <div className="bg-[#0d0d0f] p-4 flex flex-col items-center justify-center relative min-h-[450px]">
        {gameState === 'idle' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="border border-[#ffb703]/20 p-8 rounded-2xl max-w-sm text-center bg-[#0d0d0f] shadow-2xl">
              <h2 className="text-2xl font-black text-[#ffb703] font-mono tracking-wider mb-2">2048 GOLD PUZZLE</h2>
              <p className="text-xs text-gray-400 mb-6 font-sans">
                Merge identical tiles to double their value in a clean premium dark-gold interface. Reach the legendary absolute 2048 cell!
              </p>
              
              <div className="flex justify-around items-center mb-6 py-3 border-y border-[#ffb703]/10 text-center">
                <div>
                  <div className="text-[10px] text-gray-500 font-mono">CONTROLS</div>
                  <div className="text-xs font-bold text-[#ffb703] font-mono mt-1">SWIPE / KEYS</div>
                </div>
                <div className="w-px h-8 bg-[#ffb703]/10"></div>
                <div>
                  <div className="text-[10px] text-gray-500 font-mono">EARNING SCALE</div>
                  <div className="text-xs font-bold text-amber-500 font-mono mt-1">1 COIN / 20 PTS</div>
                </div>
              </div>

              <button
                onClick={initGame}
                className="w-full bg-[#ffb703] hover:bg-amber-400 text-black font-semibold font-mono tracking-wider py-3 px-6 rounded-lg transition"
              >
                LAUNCH MATRIX
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="border border-[#ffb703]/20 p-8 rounded-2xl max-w-sm text-center bg-[#0d0d0f] shadow-2xl">
              <h2 className="text-2xl font-black text-red-500 font-mono tracking-wider mb-2">MATRIX EXCEEDED</h2>
              <p className="text-xs text-gray-400 mb-6 font-sans">
                No legal strategic merges left.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 py-3 px-4 bg-black/55 rounded-xl border border-white/5">
                <div className="text-center border-r border-[#ffb703]/10">
                  <div className="text-xs text-gray-400 font-sans">FINAL SCORE</div>
                  <div className="text-lg font-black text-[#ffb703] font-mono">{score}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-sans">COINS</div>
                  <div className="text-lg font-black text-amber-500 font-mono">+{Math.max(1, Math.floor(score / 20))}</div>
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
                  RETRY
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HUD */}
        {gameState === 'playing' && (
          <div className="w-full max-w-sm flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 bg-black/60 px-4 py-2 rounded-xl border border-[#ffb703]/10">
              <div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">MATRIX SCORE</div>
                <div className="text-lg font-mono font-black text-[#ffb703]">{score}</div>
              </div>
              <div className="w-px h-6 bg-[#ffb703]/10"></div>
              <div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">COINS</div>
                <div className="text-lg font-mono font-black text-amber-500">+{Math.max(1, Math.floor(score / 20))}</div>
              </div>
            </div>

            <button
              onClick={initGame}
              className="p-3 bg-black/50 hover:bg-[#ffb703]/10 border border-[#ffb703]/20 rounded-xl transition text-[#ffb703]"
              title="Reset Grid"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2048 Grid Board */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full max-w-sm aspect-square bg-[#0b0c10] border border-[#ffb703]/15 p-3 rounded-2xl grid grid-cols-4 gap-3 select-none touch-none shadow-2xl relative"
        >
          {board.map((row, rIndex) =>
            row.map((val, cIndex) => (
              <div
                key={`${rIndex}-${cIndex}`}
                className={`transition-all duration-100 flex items-center justify-center font-mono rounded-xl ${getTileStyles(val)}`}
              >
                {val > 0 ? val : ''}
              </div>
            ))
          )}
        </div>

        {gameState === 'playing' && (
          <div className="text-center mt-4 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
            Swipe or Arrow keys to merge golden cells
          </div>
        )}
      </div>
    </div>
  );
}
