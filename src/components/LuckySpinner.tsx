/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { synth } from '../utils/audioSynth';
import { Sparkles, Trophy, RotateCcw } from 'lucide-react';

interface LuckySpinnerProps {
  onSuccess: (amount: number) => void;
  cooldownHours?: number;
  onResetTrigger?: any;
}

export default function LuckySpinner({ onSuccess, cooldownHours = 24 }: LuckySpinnerProps) {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [showReward, setShowReward] = useState<boolean>(false);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // countdown

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef<number>(0);

  // Sector segments
  const segments = [
    { label: '+0.10 POKI', val: 0.1, color: '#0f1115' },
    { label: '+1.50 POKI', val: 1.5, color: '#1a1c24' },
    { label: '+0.25 POKI', val: 0.25, color: '#0f1115' },
    { label: '+2.50 POKI', val: 2.5, color: '#ffb703' }, // jackpot gold
    { label: '+0.05 POKI', val: 0.05, color: '#0f1115' },
    { label: '+0.50 POKI', val: 0.5, color: '#1a1c24' },
    { label: '+0.12 POKI', val: 0.12, color: '#0f1115' },
    { label: '+5.00 POKI', val: 5.0, color: '#ffd166' }, // mega gold
  ];

  const numSegs = segments.length;
  const radSeg = (Math.PI * 2) / numSegs;

  // Draw the wheel inside Canvas
  useEffect(() => {
    drawWheel();
  }, []);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 15;

    ctx.clearRect(0, 0, w, h);

    // Outer wheel metal border
    ctx.strokeStyle = '#2a2f3b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary inner glowing circle accent
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw individual segments
    for (let i = 0; i < numSegs; i++) {
      const segAngle = currentAngleRef.current + i * radSeg;
      const endAngle = segAngle + radSeg;

      ctx.fillStyle = segments[i].color;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius - 5, segAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Sharp white separator lines
      ctx.strokeStyle = '#2a2f3b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(segAngle) * (radius - 5), cy + Math.sin(segAngle) * (radius - 5));
      ctx.stroke();

      // Draw Sector Text Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(segAngle + radSeg / 2);

      const isJackpot = segments[i].val >= 2.5;
      ctx.fillStyle = isJackpot ? '#0b0c10' : '#ffd166';
      ctx.font = isJackpot ? 'bold 10px monospace' : '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(segments[i].label, radius - 20, 3);
      ctx.restore();
    }

    // Center pivot button
    ctx.fillStyle = '#0b0c10';
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw inner triangular arrow node inside pivot
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const spin = () => {
    if (isSpinning || timeRemaining > 0) return;

    setIsSpinning(true);
    setShowReward(false);
    synth.playJump();

    const targetSpins = 4 + Math.floor(Math.random() * 4); // turns
    const spinDuration = 3600; // ms
    const targetAngle = currentAngleRef.current + targetSpins * Math.PI * 2 + Math.random() * (Math.PI * 2);

    const startTimestamp = performance.now();
    const initialAngle = currentAngleRef.current;

    const animateWheel = (now: number) => {
      const elapsed = now - startTimestamp;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Smooth cubic ease-out deceleration curve for physical inertias
      const easeOut = (x: number): number => {
        return 1 - Math.pow(1 - x, 3);
      };

      currentAngleRef.current = initialAngle + (targetAngle - initialAngle) * easeOut(progress);
      
      // Rotational clicks audio simulation
      if (Math.sin(currentAngleRef.current * 10) > 0.95) {
        synth.playCoin();
      }

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animateWheel);
      } else {
        // Complete rotation logic: determine selected index
        // Spin is pointing right (0 radians). The pointer is officially at top (-PI/2), so shift it.
        const normalizedAngle = (Math.PI * 2 - (currentAngleRef.current % (Math.PI * 2))) % (Math.PI * 2);
        // The pointer top matches angle 1.5 * PI (270deg)
        const pointerAngle = (normalizedAngle + Math.PI / 2) % (Math.PI * 2);
        const resolvedIdx = Math.floor(pointerAngle / radSeg) % numSegs;

        const wonSeg = segments[resolvedIdx];
        setRewardAmount(wonSeg.val);
        setShowReward(true);
        setIsSpinning(false);
        synth.playLevelUp();
        onSuccess(wonSeg.val);

        // Start standard Cooldown timer
        const hourSeconds = cooldownHours * 60 * 60;
        setTimeRemaining(hourSeconds);
      }
    };

    requestAnimationFrame(animateWheel);
  };

  // Cooldown ticking loop
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div id="lucky-spinner-widget" className="bg-[#151821] border border-[#2a2f3b] rounded-lg p-5 flex flex-col items-center">
      
      {/* Visual Canvas containing sector lines */}
      <div className="relative w-52 h-52 flex items-center justify-center">
        {/* Top absolute pointer arrowhead */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#ffb703] drop-shadow-md" />
        
        <canvas
          ref={canvasRef}
          width={208}
          height={208}
          className="w-52 h-52 select-none"
        />
      </div>

      {showReward && (
        <div className="mt-4 p-2 bg-[#ffb703]/10 border border-[#ffb703]/30 rounded flex items-center gap-2 animate-bounce">
          <Trophy className="w-4 h-4 text-[#ffb703]" />
          <span className="text-xs font-mono text-[#ffd166] font-bold">
            JACKPOT GATHERED: +{rewardAmount.toFixed(2)} POKI CONGRATS!
          </span>
        </div>
      )}

      {/* Controller Buttons */}
      <div className="w-full mt-4">
        {timeRemaining > 0 ? (
          <button
            disabled
            className="w-full py-2.5 bg-[#0f1115] border border-[#2a2f3b] text-gray-500 font-mono text-center text-xs tracking-wider uppercase rounded"
          >
            Cooldown Active: {formatTime(timeRemaining)}
          </button>
        ) : (
          <button
            onClick={spin}
            disabled={isSpinning}
            id="spin-trigger-btn"
            className="w-full py-2.5 bg-[#ffb703] hover:bg-[#ffd166] disabled:bg-gray-800 text-black font-mono font-bold text-xs tracking-wider uppercase rounded shadow hover:shadow-lg hover:shadow-[#ffb703]/20 hover:scale-[1.01] transition-all cursor-pointer"
          >
            {isSpinning ? 'CALCULATING ORBITS...' : 'EXECUTE LUCKY SPIN'}
          </button>
        )}
      </div>
    </div>
  );
}
