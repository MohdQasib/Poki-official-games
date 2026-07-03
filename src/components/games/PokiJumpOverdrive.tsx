import React, { useRef, useEffect, useState } from 'react';
import { synth } from '../../utils/audioSynth';
import { Shield, Sparkles, RefreshCw, X, Radio, Play } from 'lucide-react';

interface GameProps {
  onSessionComplete: (session: any) => void;
  uid: string;
  onClose: () => void;
}

export default function PokiJumpOverdrive({ onSessionComplete, uid, onClose }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'syncing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [securedTransaction, setSecuredTransaction] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');

  const stateRef = useRef({
    playerX: 180,
    playerY: 300,
    playerVX: 0,
    playerVY: 0,
    scoreTracker: 0,
    cameraY: 0,
    isLeftPressed: false,
    isRightPressed: false,
    platforms: [] as Array<{ x: number; y: number; w: number; h: number; isMoving: boolean; direction: number; hasCoin: boolean; coinCollected: boolean }>,
    particles: [] as Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number; life: number }>,
    gameTime: 0,
    collectedCoinsCount: 0,
  });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight || 400;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // Handle Controls keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        stateRef.current.isLeftPressed = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        stateRef.current.isRightPressed = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        stateRef.current.isLeftPressed = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        stateRef.current.isRightPressed = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    if ('touches' in e) {
      if (e.touches[0]) {
        clientX = e.touches[0].clientX;
      } else {
        return;
      }
    } else {
      clientX = e.clientX;
    }
    const relativeX = clientX - rect.left;
    stateRef.current.playerX = (relativeX / rect.width) * canvas.width;
  };

  const startNewGame = () => {
    synth.playCoin();
    setScore(0);
    setCoins(0);
    setSecuredTransaction(null);
    setSyncStatus('');

    const initPlatforms = [] as any[];
    // Spawn standard helper platforms going up
    initPlatforms.push({ x: 140, y: 380, w: 100, h: 8, isMoving: false, direction: 1, hasCoin: false, coinCollected: false });
    
    for (let i = 0; i < 15; i++) {
      const py = 320 - i * 45;
      const px = 20 + Math.random() * 260;
      initPlatforms.push({
        x: px,
        y: py,
        w: 52,
        h: 8,
        isMoving: i > 3 && Math.random() < 0.4,
        direction: Math.random() > 0.5 ? 1 : -1,
        hasCoin: Math.random() < 0.25,
        coinCollected: false
      });
    }

    stateRef.current = {
      playerX: 180,
      playerY: 340,
      playerVX: 0,
      playerVY: -9,
      scoreTracker: 0,
      cameraY: 0,
      isRightPressed: false,
      isLeftPressed: false,
      platforms: initPlatforms,
      particles: [],
      gameTime: 0,
      collectedCoinsCount: 0
    };

    setGameState('playing');
  };

  const syncGameData = (finalScore: number, coinsCollected: number) => {
    setGameState('syncing');
    setSyncStatus('REGISTERING JUMP ALTITUDE PROOF...');
    try {
      synth.playJump();
    } catch (e) {}

    setTimeout(() => {
      const timestamp = Date.now();
      const rawPayload = {
        client_uid: uid || 'anonymous_peer_vector',
        score_distance: finalScore,
        poki_tokens_collected: coinsCollected,
        poki_tokens_earned: parseFloat((coinsCollected * 1.05).toFixed(8)),
        node_consensus_index: Math.floor(Math.random() * 900000 + 100000),
        rate_limit_token: btoa(`${uid}_${timestamp}_${finalScore}_${coinsCollected}`),
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

      setSyncStatus('LOBBY JUMP SCORE LEDGERED!');
      setGameState('gameover');

      onSessionComplete({
        distance: finalScore,
        coinsCollected: coinsCollected,
        multiplier: 1,
        timestamp: timestamp,
        hashSignature: checksumHex,
        securePayload: JSON.stringify(rawPayload),
        status: 'gameover',
      });
    }, 1000);
  };

  // Gameloop loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      const st = stateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      st.gameTime++;

      // Horizontal controls Physics
      if (st.isLeftPressed) {
        st.playerVX = -4.5;
      } else if (st.isRightPressed) {
        st.playerVX = 4.5;
      } else {
        st.playerVX *= 0.85; // friction
      }

      st.playerX += st.playerVX;

      // Wrap horizontal bounds
      if (st.playerX < -10) st.playerX = w;
      if (st.playerX > w + 10) st.playerX = 0;

      // Gravity and jump
      st.playerVY += 0.28; // gravity
      st.playerY += st.playerVY;

      // Platform bounce collision checks (only moving downwards)
      if (st.playerVY > 0) {
        st.platforms.forEach((p) => {
          if (
            st.playerX + 11 > p.x &&
            st.playerX - 11 < p.x + p.w &&
            st.playerY + 14 >= p.y &&
            st.playerY + 8 <= p.y + p.h
          ) {
            // Apply high bounce velocity
            st.playerVY = -8.5;
            synth.playJump();

            // Emit floor jump dust
            for (let i = 0; i < 6; i++) {
              st.particles.push({
                x: st.playerX,
                y: st.playerY + 12,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2,
                color: '#ffb703',
                size: 2,
                alpha: 1,
                life: 15
              });
            }
          }
        });
      }

      // Smooth camera scrolling following character jump height
      if (st.playerY < h * 0.4) {
        const offset = h * 0.4 - st.playerY;
        st.playerY = h * 0.4;
        st.cameraY += offset;
        st.scoreTracker += offset;
        setScore(Math.floor(st.scoreTracker));

        // Pan all platforms down
        st.platforms.forEach((p) => {
          p.y += offset;
        });

        // Pan particles
        st.particles.forEach((pt) => {
          pt.y += offset;
        });
      }

      // Generate highest platform on screen pan
      while (st.platforms.length < 15) {
        const topY = st.platforms.length === 0 ? h : Math.min(...st.platforms.map((p) => p.y));
        
        const currentCoins = st.collectedCoinsCount || 0;
        let spacing = 50;
        let platformWidth = 52;
        let moveChance = 0.45;

        if (currentCoins >= 16) {
          spacing = 50 + (currentCoins - 15) * 4;
          platformWidth = Math.max(30, 52 - (currentCoins - 15) * 1.5);
          moveChance = 0.7;
        }
        if (currentCoins >= 25) {
          spacing = 70 + (currentCoins - 24) * 8;
          platformWidth = Math.max(18, 38 - (currentCoins - 24) * 2.0);
          moveChance = 0.95;
        }
        if (currentCoins >= 32) {
          spacing = 110;
          platformWidth = 10;
          moveChance = 1.0;
        }

        const py = topY - spacing;
        const px = 10 + Math.random() * (w - 70);
        st.platforms.push({
          x: px,
          y: py,
          w: platformWidth,
          h: 8,
          isMoving: Math.random() < moveChance,
          direction: Math.random() > 0.5 ? 1 : -1,
          hasCoin: Math.random() < 0.25,
          coinCollected: false
        });
      }

      // Garbage collect offscreen low platforms
      st.platforms = st.platforms.filter((p) => p.y < h + 50);

      // Rendering sequence
      ctx.fillStyle = '#08090d';
      ctx.fillRect(0, 0, w, h);

      // Starry Space Parallax background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const starX = (Math.abs(Math.sin(i * 123.45)) * w);
        const starY = (Math.abs(Math.cos(i * 543.21)) * h + st.cameraY * (0.15 + (i % 3) * 0.1)) % h;
        const starSize = 0.8 + (i % 3) * 0.6;
        const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(st.gameTime * 0.02 + i));
        ctx.save();
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Web vector background grids with subtle blue overlay
      ctx.strokeStyle = 'rgba(0, 225, 255, 0.05)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      const scrollOffset = st.cameraY % gridSize;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = scrollOffset; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Platforms and Floating Coins
      st.platforms.forEach((p) => {
        // Platform dynamic movement update
        if (p.isMoving) {
          const currentCoins = st.collectedCoinsCount || 0;
          let activeSpeed = 1.2;
          if (currentCoins >= 16) {
            activeSpeed = 1.2 + (currentCoins - 15) * 0.15;
          }
          if (currentCoins >= 25) {
            activeSpeed = 2.5 + (currentCoins - 24) * 0.35;
          }
          if (currentCoins >= 32) {
            activeSpeed = 5.0;
          }
          p.x += p.direction * activeSpeed;
          if (p.x < 10 || p.x + p.w > w - 10) {
            p.direction *= -1;
          }
        }

        // Draw neon glowing platform panel
        ctx.save();
        ctx.shadowColor = p.isMoving ? '#00e1ff' : '#ffd166';
        ctx.shadowBlur = p.isMoving ? 10 : 5;
        ctx.fillStyle = p.isMoving ? 'rgba(0, 225, 255, 0.25)' : '#171a21';
        ctx.strokeStyle = p.isMoving ? '#00e1ff' : '#ffd166';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 4);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Platform center line accents
        ctx.strokeStyle = p.isMoving ? 'rgba(0, 225, 255, 0.4)' : 'rgba(255, 183, 3, 0.2)';
        ctx.beginPath();
        ctx.moveTo(p.x + 8, p.y + p.h / 2);
        ctx.lineTo(p.x + p.w - 8, p.y + p.h / 2);
        ctx.stroke();

        // Render Coin above platform
        if (p.hasCoin && !p.coinCollected) {
          const coinX = p.x + p.w / 2;
          const coinY = p.y - 18;
          
          // Draw spinning coin
          const localRot = (st.gameTime * 0.08) % (Math.PI * 2);
          const cosValue = Math.cos(localRot);

          ctx.save();
          ctx.translate(coinX, coinY);
          ctx.scale(Math.abs(cosValue) < 0.1 ? 0.1 : cosValue, 1.0);

          const grad = ctx.createRadialGradient(-1.5, -1.5, 1, 0, 0, 6);
          grad.addColorStop(0, '#ffe893');
          grad.addColorStop(0.5, '#ffb703');
          grad.addColorStop(1, '#8c5f00');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffe893';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();

          // Player-Coin collision checking
          const distToCoin = Math.hypot(coinX - st.playerX, coinY - st.playerY);
          if (distToCoin < 13 + 6) {
            p.coinCollected = true;
            st.collectedCoinsCount = (st.collectedCoinsCount || 0) + 1;
            setCoins(st.collectedCoinsCount);
            synth.playCoin();

            // Fire tiny sparkles
            for (let i = 0; i < 4; i++) {
              st.particles.push({
                x: coinX,
                y: coinY,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: '#ffd166',
                size: 1.8,
                alpha: 1,
                life: 12
              });
            }
          }
        }
      });

      // Update and draw particles
      st.particles.forEach((pt, index) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;
        pt.alpha = pt.life / 15;

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (pt.life <= 0) st.particles.splice(index, 1);
      });

      // Draw character
      ctx.save();
      ctx.translate(st.playerX, st.playerY);

      // Draw active beautiful propulsion fire flare
      if (st.playerVY < 1) {
        const fireHeight = 8 + Math.abs(st.playerVY) * 1.5 + Math.sin(st.gameTime * 0.4) * 4;
        const grad = ctx.createLinearGradient(0, 4, 0, 4 + fireHeight);
        grad.addColorStop(0, '#ff3c00');
        grad.addColorStop(0.5, '#ffb703');
        grad.addColorStop(1, 'rgba(255, 183, 3, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-4, 4);
        ctx.quadraticCurveTo(0, 4 + fireHeight * 1.2, 0, 4 + fireHeight);
        ctx.quadraticCurveTo(0, 4 + fireHeight * 1.2, 4, 4);
        ctx.closePath();
        ctx.fill();
      }

      // Sleek Futuristic Spaceship design
      ctx.fillStyle = '#1a1c23';
      ctx.strokeStyle = '#ffb703';
      ctx.lineWidth = 2.0;

      // Outer wings
      ctx.save();
      ctx.fillStyle = '#111317';
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(-12, 6);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(5, 2);
      ctx.lineTo(12, 6);
      ctx.lineTo(5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Main cockpit body
      ctx.beginPath();
      ctx.moveTo(0, -14); // Nose cone
      ctx.lineTo(8, 2);   // Right hull
      ctx.lineTo(5, 5);   // Bottom right
      ctx.lineTo(-5, 5);  // Bottom left
      ctx.lineTo(-8, 2);  // Left hull
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing cockpit canopy window
      ctx.fillStyle = '#00e1ff';
      ctx.shadowColor = '#00e1ff';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(4, -2);
      ctx.lineTo(-4, -2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Match game over: player fell below visible camera coordinates
      if (st.playerY > h + 40) {
        cancelAnimationFrame(animId);
        synth.playCrash();
        syncGameData(Math.floor(st.scoreTracker / 10), st.collectedCoinsCount || 0);
      } else {
        animId = requestAnimationFrame(loop);
      }
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState]);

  return (
    <div className="flex flex-col bg-[#0b0c10] border border-[#2a2f3b] rounded-lg overflow-hidden shadow-2xl relative w-full h-[450px]">
      
      <div className="flex items-center justify-between p-3 border-b border-[#2a2f3b] bg-[#14161c]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-sky-500/20 border border-sky-400/40 text-sky-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">
            JUMP OVERDRIVE
          </span>
          <span className="text-xs text-[#ffb703] font-mono flex items-center gap-1">
            🪙 <span className="font-extrabold">{coins} Coin</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-400">
            ALTITUDE: <span className="text-white font-bold">{score}m</span>
          </span>
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
      <div 
        ref={containerRef}
        className="flex-1 bg-[#0b0c10] relative flex items-center justify-center select-none"
      >
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 z-10 p-6 text-center">
            <Sparkles className="w-10 h-10 text-sky-400 animate-pulse mb-3" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase font-sans">
              POKI JUMP OVERDRIVE
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mt-2 mb-6">
              Move Left and Right using <span className="text-[#ffd166] font-bold">A/D</span> tags, <span className="text-[#ffd166] font-bold">Arrows</span>, or slide your mouse/finger across the grid to glide. Bounce off platforms, catch coins, and don't fall off!
            </p>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] hover:brightness-110 text-black font-extrabold text-sm uppercase rounded cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#ffb703]/20"
            >
              <Play className="w-4 h-4 fill-black" /> DROP TO PLATFORM
            </button>
          </div>
        )}

        {gameState === 'syncing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
            <div className="w-12 h-12 rounded-full border-4 border-[#2a2f3b] border-t-[#ffb703] animate-spin mb-4" />
            <p className="text-xs font-mono text-[#ffb703] uppercase tracking-widest animate-pulse font-semibold">
              {syncStatus}
            </p>
          </div>
        )}

        {/* CUSTOM PREMIUM GAME-OVER MODAL OVERLAY */}
        {gameState === 'gameover' && securedTransaction && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 p-6 overflow-y-auto">
            <div className="max-w-md w-full bg-[#171a21] border border-[#ffb703]/30 rounded-xl p-5 shadow-2xl relative text-center">
              
              <div className="flex items-center justify-center gap-2 text-amber-500 mb-2 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 bg-amber-600 rounded-full animate-ping" />
                <span>TERMINATED: ZERO GRAVITY OUT-OF-BOUNDS</span>
              </div>

              <h3 className="text-2xl font-black text-[#ffb703] uppercase tracking-wide">
                ALTITUDE SUMMARY
              </h3>

              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Max Height Reached</span>
                  <span className="text-lg font-mono font-extrabold text-white">{score}m</span>
                </div>
                <div className="bg-black/40 border border-[#2a2f3b] p-3 rounded">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Mined Pokicoins</span>
                  <span className="text-lg font-mono font-extrabold text-[#ffd166]">🪙 {coins}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-[#2a2f3b] rounded p-3 text-left mb-5">
                <div className="flex items-center justify-between font-mono text-[9px] text-[#ffb703] pb-1.5 border-b border-[#2a2f3b]/60">
                  <span className="font-semibold">ALTITUDE_PROOF_SECURED</span>
                  <span>RATE LMT: APPROVED</span>
                </div>
                <p className="text-[9px] font-mono text-gray-400 mt-2 truncate">
                  SHA-HASH: {securedTransaction.checksum}
                </p>
                <div className="flex items-center justify-between text-[8px] font-mono text-gray-500 mt-1">
                  <span>CONSENSUS INDEX: {securedTransaction.payload.node_consensus_index}</span>
                  <span>{securedTransaction.payload.timestamp_utc}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startNewGame}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#ffb703] to-[#ffd166] text-black font-extrabold text-xs uppercase rounded hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-[#ffb703]/10"
                >
                  <RefreshCw className="w-3.5 h-3.5 antialiased animate-spin-reverse" /> BOUNCE BACK IN
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-[#0b0c10] border border-[#2a2f3b] text-white hover:bg-[#1a1d26] font-extrabold text-xs uppercase rounded transition-all cursor-pointer"
                >
                  RETURN TO LOBBY
                </button>
              </div>

            </div>
          </div>
        )}

        {/* CANVAS */}
        <canvas
          ref={canvasRef}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          className="block w-full h-full cursor-none bg-[#0b0c10]"
        />

        {/* TOUCH HUD */}
        {gameState === 'playing' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 bg-black/50 border border-[#2a2f3b] rounded-full pointer-events-none text-[8.5px] font-mono text-center text-gray-400 uppercase tracking-widest leading-none">
            USE LEFT/RIGHT KEYS OR DRAG TO GLIDE
          </div>
        )}
      </div>

    </div>
  );
}
