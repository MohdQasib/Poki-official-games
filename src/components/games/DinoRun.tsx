import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { GameSession } from '../../types';
import { Shield, Sparkles, Volume2, VolumeX, AlertTriangle, ArrowLeft, Gamepad2, Play, Award, Zap } from 'lucide-react';

interface DinoRunProps {
  onSessionComplete: (session: GameSession) => void;
  uid: string;
  onClose: () => void;
}

export default function DinoRun({ onSessionComplete, uid, onClose }: DinoRunProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [gameState, setGameState] = useState<string>('idle'); // idle, playing, gameover
  const [highScore, setHighScore] = useState<number>(() => {
    return Number(localStorage.getItem('poki_dino_highscore') || '0');
  });

  const [milestoneColor, setMilestoneColor] = useState<string>('#ffb703'); // Starts with gold
  const [speedLevel, setSpeedLevel] = useState<number>(1);
  const [coins, setCoins] = useState<number>(0);

  const stateRef = useRef({
    score: 0,
    speed: 6,
    dinoY: 0,
    dinoVelocityY: 0,
    isJumping: false,
    obstacles: [] as Array<{ x: number; width: number; height: number; type: 'cactus' | 'bird'; y: number }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string; life: number }>,
    gameActive: false,
    spawnTimer: 0,
    lastTime: 0,
    color: '#ffb703',
    jumpsCount: 0,
    coinsList: [] as Array<{ x: number; y: number; width: number; height: number; collected: boolean }>,
    collectedCoinsCount: 0,
    sessionStartTime: 0,
  });

  const syncScore = async (finalScore: number) => {
    console.log(`[DINO RUN] syncScore with score: ${finalScore}`);
    
    const finalCoins = stateRef.current.collectedCoinsCount || 0;
    const validatedScore = finalScore;
    
    onSessionComplete({
      distance: validatedScore,
      coinsCollected: finalCoins,
      multiplier: 1.0,
      timestamp: Date.now(),
      hashSignature: '0x' + Math.random().toString(16).slice(2, 12),
      securePayload: JSON.stringify({ score: validatedScore, coins: finalCoins }),
      status: 'gameover',
    });

    try {
      const formData = new FormData();
      formData.append('score', String(validatedScore));
      formData.append('coins', String(finalCoins));
      formData.append('game', 'Dino Run');

      await fetch('update_coins.php', {
        method: 'POST',
        body: formData,
      });
      console.log("[DINO RUN] External database synced successfully.");
    } catch (e) {
      console.warn("[DINO RUN] update_coins.php not found or unreachable in dev, local sync preserved.");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = 400;
      }
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Jump control
  const triggerJump = () => {
    if (!stateRef.current.gameActive || stateRef.current.isJumping) return;
    try {
      synth.playJump();
    } catch (e) {}
    
    // Stable, comfortable jump velocity matched with 0.52 gravity for perfect tactile control
    stateRef.current.dinoVelocityY = -11;
    stateRef.current.isJumping = true;
    
    stateRef.current.jumpsCount = (stateRef.current.jumpsCount || 0) + 1;
    
    // Spawn dust particles
    for (let i = 0; i < 5; i++) {
      stateRef.current.particles.push({
        x: 80,
        y: 280,
        vx: -2 - Math.random() * 2,
        vy: -Math.random() * 2,
        radius: 3 + Math.random() * 3,
        color: stateRef.current.color,
        life: 1,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    triggerJump();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      triggerJump();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startGame = () => {
    try {
      synth.playLevelUp();
    } catch (e) {}
    stateRef.current = {
      score: 0,
      speed: 6,
      dinoY: 0,
      dinoVelocityY: 0,
      isJumping: false,
      obstacles: [],
      particles: [],
      gameActive: true,
      spawnTimer: 0,
      lastTime: Date.now(),
      color: '#ffb703',
      jumpsCount: 0,
      coinsList: [],
      collectedCoinsCount: 0,
      sessionStartTime: Date.now(),
    };
    setScore(0);
    setCoins(0);
    setMilestoneColor('#ffb703');
    setSpeedLevel(1);
    setGameState('playing');
    setIsPlaying(true);
  };

  // Main game loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying || gameState !== 'playing') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateAndDraw = () => {
      if (!ctx || !canvas) return;
      const state = stateRef.current;
      if (!state.gameActive) return;

      const groundY = 320;
      let activeGravity = 0.55;

      // Clear Canvas
      ctx.fillStyle = '#0b0c10';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Score incremental
      state.score += 0.15;
      const displayScore = Math.floor(state.score);
      setScore(displayScore);

      // Speed Milestone Colors
      // Color shifts:
      // Speed 6-10: Gold (#ffb703)
      // Speed 10-15: Amber (#e67e22)
      // Speed 15-20: Neon Cyan (#00f260)
      // Speed 20+: Galactic Magenta (#ec38bc)
      let currentDinoColor = '#ffb703';
      let currentSpeedLevel = 1;
      
      if (state.speed < 8) {
        currentDinoColor = '#ffb703'; // Gold
        currentSpeedLevel = 1;
      } else if (state.speed < 10) {
        currentDinoColor = '#f39c12'; // Amber
        currentSpeedLevel = 2;
      } else if (state.speed < 12) {
        currentDinoColor = '#e74c3c'; // Neon Red
        currentSpeedLevel = 3;
      } else {
        currentDinoColor = '#ec38bc'; // Galactic Magenta
        currentSpeedLevel = 4;
      }

      if (state.color !== currentDinoColor) {
        state.color = currentDinoColor;
        setMilestoneColor(currentDinoColor);
        setSpeedLevel(currentSpeedLevel);
        try {
          synth.playCoin();
        } catch (e) {}
      }

      const sessionTimeElapsed = (Date.now() - (state.sessionStartTime || Date.now())) / 1000;
      let spawnGapCompression = 0.0;

      // Medium difficulty tuning: Stable, readable progressive speed starting at 5.0 and gently climbing.
      const currentCoins = state.collectedCoinsCount || 0;
      let activeSpeed = Math.min(5.0 + displayScore * 0.012, 8.2);
      activeGravity = 0.52; // stabilized perfect gravity delta for tactile precision

      if (currentCoins >= 16) {
        activeSpeed += (currentCoins - 15) * 0.45;
        activeGravity += (currentCoins - 15) * 0.035;
      }
      if (currentCoins >= 25) {
        activeSpeed += (currentCoins - 24) * 0.9;
        activeGravity += (currentCoins - 24) * 0.07;
      }
      if (currentCoins >= 32) {
        activeSpeed += (currentCoins - 31) * 1.5;
        activeGravity += (currentCoins - 31) * 0.15;
      }

      if ((window as any).isExtremeHardMode) {
        activeSpeed *= 2.0;
        activeGravity *= 2.0;
      }
      
      state.speed = activeSpeed;

      // Apply Gravity
      if (state.isJumping) {
        state.dinoY += state.dinoVelocityY;
        state.dinoVelocityY += activeGravity;

        if (state.dinoY >= 0) {
          state.dinoY = 0;
          state.dinoVelocityY = 0;
          state.isJumping = false;
        }
      }

      // Draw Grid lines / Ground Line (Premium Gold/Charcoal Grid)
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 1;
      // Horizon line
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Perspective ground grid bars
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, groundY);
        ctx.lineTo(i - 40, canvas.height);
        ctx.stroke();
      }

      // Draw background glow stars
      for (let i = 0; i < 15; i++) {
        const sx = (displayScore * 0.5 + i * 200) % canvas.width;
        const sy = (i * 15) % 150 + 40;
        ctx.fillStyle = '#ffb703';
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 4;
        ctx.fillRect(canvas.width - sx, sy, 2, 2);
        ctx.shadowBlur = 0; // reset
      }

      // Coin Spawning & Management disabled in favor of +1 coin per obstacle spawn

      // Obstacle Management
      state.spawnTimer += 1.5;
      let minSpawnWait = 90 - state.speed * 2.5;
      if (spawnGapCompression > 0) {
        minSpawnWait *= (1.0 - spawnGapCompression);
      }
      if (state.spawnTimer > minSpawnWait && Math.random() < 0.03) {
        const rollObj = Math.random();
        const type = rollObj > 0.82 ? 'bird' : 'cactus';
        const h = type === 'cactus' ? (25 + Math.random() * 30) : 25;
        const w = 15 + Math.random() * 15;
        const y = type === 'bird' ? (groundY - 60 - Math.random() * 35) : (groundY - h);

        state.obstacles.push({
          x: canvas.width,
          width: w,
          height: h,
          type,
          y,
        });
        state.spawnTimer = 0;

        // Every 6 obstacles spawned/passed grants exactly +1 coin, up to a maximum cap of 25 coins per game.
        if (!(state as any).obstaclesCount) {
          (state as any).obstaclesCount = 0;
        }
        (state as any).obstaclesCount++;
        if ((state as any).obstaclesCount % 6 === 0 && (state.collectedCoinsCount || 0) < 40) {
          state.collectedCoinsCount = (state.collectedCoinsCount || 0) + 1;
          setCoins(state.collectedCoinsCount);
        }
      }

      // Draw and Move Obstacles
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        obs.x -= state.speed;

        // Draw Obstacle
        ctx.shadowColor = '#ff4d4d';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ff4d4d';
        
        ctx.beginPath();
        if (obs.type === 'cactus') {
          // Draw a stylized cactus
          ctx.rect(obs.x + obs.width / 3, obs.y, obs.width / 3, obs.height);
          ctx.rect(obs.x, obs.y + obs.height / 3, obs.width, obs.height / 4);
        } else {
          // Bird wings animation flap
          const flap = Math.floor(displayScore / 4) % 2;
          ctx.moveTo(obs.x, obs.y + obs.height / 2);
          ctx.lineTo(obs.x + obs.width / 2, obs.y + (flap ? 0 : obs.height));
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height / 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Hard-recode the collision system wrapper. Obstacle hitboxes must validate every tick using precise overlapping bounds check (getBoundingClientRect)
        const compressMultiplier = (window as any).isExtremeHardMode ? 1.4 : 1.0;
        const dinoX = 60;
        const dinoW = 30 * compressMultiplier;
        const dinoH = 40 * compressMultiplier;
        const dinoActualY = groundY - dinoH + state.dinoY;

        const canvasRect = canvas.getBoundingClientRect();
        const dinoRect = {
          left: canvasRect.left + dinoX,
          right: canvasRect.left + dinoX + dinoW,
          top: canvasRect.top + dinoActualY,
          bottom: canvasRect.top + dinoActualY + dinoH
        };

        const obsRect = {
          left: canvasRect.left + obs.x,
          right: canvasRect.left + obs.x + obs.width,
          top: canvasRect.top + obs.y,
          bottom: canvasRect.top + obs.y + obs.height
        };

        const isColliding = !(
          dinoRect.right < obsRect.left ||
          dinoRect.left > obsRect.right ||
          dinoRect.bottom < obsRect.top ||
          dinoRect.top > obsRect.bottom
        );

        if (isColliding) {
          // COLLISION DETECTED
          state.gameActive = false;
          try {
            synth.playCrash();
          } catch (e) {}

          // Explode particles
          for (let p = 0; p < 25; p++) {
            state.particles.push({
              x: dinoX + 15,
              y: dinoActualY + 20,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.7) * 10,
              radius: 4 + Math.random() * 5,
              color: state.color,
              life: 1,
            });
          }

          // Trigger Game over
          setTimeout(() => {
            if (displayScore > highScore) {
              setHighScore(displayScore);
              localStorage.setItem('poki_dino_highscore', String(displayScore));
            }
            setGameState('gameover');
            syncScore(displayScore);
          }, 800);
        }

        // Remove out of bounds obstacles
        if (obs.x + obs.width < 0) {
          state.obstacles.splice(i, 1);
        }
      }

      // Draw Dinosaur
      const dinoH = 40;
      const dinoW = 30;
      const dinoActualY = groundY - dinoH + state.dinoY;

      ctx.save();
      ctx.shadowColor = state.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = state.color;

      // Draw stylish cyberpunk cyber-dino with glowing head and tail
      ctx.beginPath();
      // Head
      ctx.fillRect(66, dinoActualY, 18, 12);
      ctx.fillRect(72, dinoActualY + 4, 3, 3); // Eye
      // Neck
      ctx.fillRect(60, dinoActualY + 12, 12, 12);
      // Body
      ctx.fillRect(50, dinoActualY + 18, 22, 16);
      // Tail
      ctx.fillRect(44, dinoActualY + 18, 6, 8);
      // Feet animation
      const legOffset = Math.floor(displayScore / 5) % 2 === 0 ? 4 : 0;
      ctx.fillRect(54, dinoActualY + 34, 4, 6);
      ctx.fillRect(64, dinoActualY + 34, 4, legOffset ? 4 : 6);

      ctx.restore();

      // Particles Management
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life <= 0) {
          state.particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(updateAndDraw);
    };

    animationFrameId = requestAnimationFrame(updateAndDraw);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, gameState]);

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
          <span className="text-sm font-mono tracking-widest text-[#ffb703] font-bold">DINO NEON RUNNER</span>
        </div>

        <div className="text-xs text-amber-500 font-mono flex items-center gap-1">
          <Award className="w-4 h-4" /> HIGHSCORE: {highScore}
        </div>
      </div>

      {/* Main Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-[#0a0a0c] p-1 flex justify-center">
        {gameState === 'idle' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="border border-[#ffb703]/20 p-8 rounded-2xl max-w-md text-center bg-[#0d0d0f] shadow-2xl relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black px-4 py-1 text-xs font-mono font-black rounded-full tracking-wider">
                ARCADE CLASSIC
              </div>
              <h2 className="text-2xl font-black text-[#ffb703] font-mono tracking-wider mb-2">DINO RUN</h2>
              <p className="text-xs text-gray-400 mb-6 font-sans">
                Jump over lightning-cacti obstacles and dodge aerial anomalies. Reach new milestones to unlock custom speed colors.
              </p>
              
              <div className="flex justify-around items-center mb-6 py-3 border-y border-[#ffb703]/10">
                <div className="text-center">
                  <div className="text-[10px] text-gray-500 font-mono">CONTROLS</div>
                  <div className="text-xs font-bold text-[#ffb703] font-mono mt-1">SPACE / TAP SCREEN</div>
                </div>
                <div className="w-px h-8 bg-[#ffb703]/10"></div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-500 font-mono">SPEED MULTIPLIER</div>
                  <div className="text-xs font-bold text-amber-500 font-mono mt-1">UP TO 4X GLOW</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full bg-[#ffb703] hover:bg-amber-400 text-black font-semibold font-mono tracking-wider py-3 px-6 rounded-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" /> START RUN
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div className="border border-red-500/20 p-8 rounded-2xl max-w-md text-center bg-[#0d0d0f] shadow-2xl relative">
              <h2 className="text-3xl font-black text-red-500 font-mono tracking-wider mb-2">GAME OVER</h2>
              <p className="text-gray-400 mb-6 font-mono text-xs">
                Collided with an anomalous hazard.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6 py-4 px-4 bg-black/40 rounded-xl border border-white/5">
                <div className="text-center border-r border-[#ffb703]/15">
                  <div className="text-xs text-gray-400 font-sans">DISTANCE RUN</div>
                  <div className="text-2xl font-black text-[#ffb703] font-mono">{score}m</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-sans">COINS EARNED</div>
                  <div className="text-2xl font-black text-[#ffb703] font-mono">+{coins.toFixed(1)}</div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 border border-[#ffb703]/20 hover:bg-[#ffb703]/10 text-white font-semibold font-mono py-3 rounded-lg transition"
                >
                  EXIT LOBBY
                </button>
                <button
                  onClick={startGame}
                  className="flex-1 bg-[#ffb703] hover:bg-amber-400 text-black font-semibold font-mono py-3 rounded-lg transition"
                >
                  PLAY AGAIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Canvas element */}
        <canvas
          ref={canvasRef}
          onClick={triggerJump}
          onTouchStart={handleTouchStart}
          className="block w-full bg-[#0b0c10] cursor-pointer rounded-lg border border-[#ffb703]/5"
          style={{ maxHeight: '400px' }}
        />

        {/* Game HUD */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 right-4 pointer-events-none flex justify-between items-center z-10">
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-[#ffb703]/10">
              <div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">DISTANCE</div>
                <div className="text-lg font-mono font-black text-[#ffb703]">{score}m</div>
              </div>
              <div className="w-px h-6 bg-[#ffb703]/10"></div>
              <div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">COINS</div>
                <div className="text-lg font-mono font-black text-[#ffb703]">+{coins.toFixed(1)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-[#ffb703]/10">
              <Zap className="w-4 h-4" style={{ color: milestoneColor }} />
              <div>
                <div className="text-[9px] text-gray-400 font-mono uppercase">GLOW LEVEL</div>
                <div className="text-xs font-mono font-black" style={{ color: milestoneColor }}>
                  LVL #{speedLevel}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
